#!/usr/bin/env python3
"""PR-13 success-only real Gathering Knowledge hooks; no RNG, XP or loot tweaks."""
from pathlib import Path
ops=[]
def add(path,old,new,label,expected=1):
    ops.append((Path(path),old,new,label,expected))
add('src/sim/professions/gathering.ts',
    "export function completeGatherCast(ctx: SimContext, p: Entity, meta: PlayerMeta): void {",
    "export function completeGatherCast(ctx: SimContext, p: Entity, meta: PlayerMeta): void {",
    'donor seam exists')
# IMPORT: use a stable existing import anchor from one of three source modules;
# insert before first real import rather than relying on evolving import names.
for path in ('src/sim/professions/gathering.ts','src/sim/professions/farming.ts',
             'src/sim/professions/fishing.ts'):
    p=Path(path)
    s=p.read_text(encoding='utf-8')
    anchor="import "
    idx=s.find(anchor)
    if idx<0:raise SystemExit(f'PR13 REFUSED missing imports {path}')
    ins="import { recordHighflyGatheringOutcome } from './highfly_gathering_knowledge';\n"
    if ins in s:raise SystemExit(f'PR13 duplicate import {path}')
    ops.append((p,s[idx:idx+len(anchor)],ins+s[idx:idx+len(anchor)],
                'insert success proof import '+path,1))

add('src/sim/professions/gathering.ts',
"""    ...(effectDepleted ? { effectDepleted: true as const } : {}),
  });
}

export interface PendingGatherGrant {""",
"""    ...(effectDepleted ? { effectDepleted: true as const } : {}),
  });
  // PR-13: once the REAL node yield is already in bags; never a cast-start
  // claim, no extra grant, no changes to the two-draw result.
  meta.highflyProfessions = recordHighflyGatheringOutcome(meta.highflyProfessions, {
    kind: 'node', professionId, sourceId: node.id, itemId,
    quantity: grantedQty,
  });
}

export interface PendingGatherGrant {""",
"one real gatherResult post-grant seam")
add('src/sim/professions/farming.ts',
"""  queueGatheringGrant(meta, 'farming', farmingHarvestGainAt(skill, cropTier));
  // The farm ACTION objective credit""",
"""  queueGatheringGrant(meta, 'farming', farmingHarvestGainAt(skill, cropTier));
  // PR-13: only the SURVIVED harvest path after a genuine produce grant.
  // The two withered arms returned long before this, and seeds refund nothing.
  meta.highflyProfessions = recordHighflyGatheringOutcome(meta.highflyProfessions, {
    kind: 'crop', professionId: 'farming', sourceId: crop.id,
    itemId: allFine ? crop.fineProduceItemId : crop.produceItemId,
    quantity: allFine ? fine : count,
  });
  // The farm ACTION objective credit""",
"survived farmHarvested only")
add('src/sim/professions/fishing.ts',
"""      rodTierRequiredForZone(zoneId),
    ),
  );
}""",
"""      rodTierRequiredForZone(zoneId),
    ),
  );
  // PR-13: landed non-gray catch, even if donor skill gain has gray-capped.
  // No XP gain: Claude explicitly keeps fishing character XP at ZERO.
  if (!isGreyFishingJunk) {
    meta.highflyProfessions = recordHighflyGatheringOutcome(meta.highflyProfessions, {
      kind: 'fishing', professionId: 'fishing', sourceId: zoneId,
      itemId: caught, quantity: 1,
    });
  }
}""",
"only landed fish; gray junk and scripted quest excluded")
add('src/sim/sim.ts',
    "import { highflyInscriptionStatus } from './professions/highfly_inscription_docs';",
    "import { highflyInscriptionStatus } from './professions/highfly_inscription_docs';\n"
    "import { highflyGatheringStatus } from './professions/highfly_gathering_knowledge';",
    "LAB status import")
add('src/sim/sim.ts',
    "  serializeCharacter(pid: number): CharacterState | null {",
    """  /** PR-13 real owned-source history; no monster harvest RewardContext yet. */
  highflyGatheringPilotStatus(pid = this.playerId) {
    return highflyGatheringStatus(this.players.get(pid)?.highflyProfessions);
  }

  serializeCharacter(pid: number): CharacterState | null {""",
    "LAB only status surface")
# The dedicated no-op guard preceding insertion validates source exists.
pending={}
for path,old,new,label,count in ops:
    s=pending.get(path)
    if s is None:s=path.read_text(encoding='utf-8')
    if label=='donor seam exists':
        if s.count(old)!=count:raise SystemExit('PR13 REFUSED donor node seam absent')
        continue
    if s.count(old)!=count or new in s:
        raise SystemExit(f'PR13 REFUSED {label}, expected={count},actual={s.count(old)}')
    pending[path]=s.replace(old,new,1)
for p,s in pending.items():p.write_text(s,encoding='utf-8')
print('PR13_REAL_NODE_CROP_FISH_LANDED_ONLY=1')
print('PR13_NO_CORPSE_REWARDCONTEXT_NO_XP_OR_LOOT_CHANGES=1')
print('PR13_NO_DEV_QUEUE_EXPERIENCE_PROOF=1')
