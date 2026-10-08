#!/usr/bin/env python3
"""PR-6 Cooking: preserve real donor crafting + feasts, add only earned evidence.

No changes to RNG, item bills, world recipes, feast effects/charges, cooldowns,
quest access, training, profession XP, skill delta or Character XP.
"""
from pathlib import Path

ops=[]
def plan(path,old,new,label):
    p=Path(path)
    ops.append((p,old,new,label))

plan("src/sim/professions/crafting.ts",
    "import { recordHighflyProfessionProgress } from './highfly_profession_progress';",
    "import { recordHighflyProfessionProgress } from './highfly_profession_progress';\n"
    "import { recordCookingCraftEvidence } from './highfly_cooking_evidence';",
    'craft evidence import')
plan("src/sim/professions/crafting.ts",
    """      meta.highflyProfessions = recordSmithTrialProof(recordCookingTrialProof(
        hfCareer.state, recipe.professionId, recipe.id,
      ), recipe.professionId, recipe.id);""",
    """      meta.highflyProfessions = recordCookingCraftEvidence(recordSmithTrialProof(recordCookingTrialProof(
        hfCareer.state, recipe.professionId, recipe.id,
      ), recipe.professionId, recipe.id), recipe);""",
    'craft success-only source & feast-craft evidence')

plan("src/sim/professions/feast.ts",
    "import { buildConsuming } from '../consuming';",
    "import { recordCookingFeastEvidence } from './highfly_cooking_evidence';\n"
    "import { buildConsuming } from '../consuming';",
    'feast proof import')
plan("src/sim/professions/feast.ts",
    """export interface FeastState {
  /** Room roster owner""",
    """export interface FeastState {
  /** Transient original placer entity, checked against stable ownerKey before
   *  giving service proof. Never stored in any character save. */
  placerEntityId?: number;
  /** Room roster owner""",
    'transient feast placer')
plan("src/sim/professions/feast.ts",
    """  ctx.feasts.set(e.id, {
    objectOwner,""",
    """  ctx.feasts.set(e.id, {
    placerEntityId: meta.entityId,
    objectOwner,""",
    'feast owner reference')
plan("src/sim/professions/feast.ts",
    """  ctx.emit({ type: 'farmFeastPlaced', pid: meta.entityId, feastId: e.id });
}""",
    """  ctx.emit({ type: 'farmFeastPlaced', pid: meta.entityId, feastId: e.id });
  // ONLY after the real spend and the new world entity both succeeded.
  if (meta.highflyProfessions)
    meta.highflyProfessions = recordCookingFeastEvidence(meta.highflyProfessions, 'placed');
}""",
    'feast successful place evidence')
plan("src/sim/professions/feast.ts",
    """  ctx.emit({ type: 'log', text: 'You sit down to eat.', color: '#999', pid: meta.entityId });
}""",
    """  ctx.emit({ type: 'log', text: 'You sit down to eat.', color: '#999', pid: meta.entityId });
  // Credited to the *placer*, not an unrelated eater. Claude's once-per-
  // character-per-feast ledger above prevents duplicate service evidence.
  const placer = feast.placerEntityId === undefined ? undefined :
    ctx.players.get(feast.placerEntityId);
  if (placer && feastOwnerKey(placer) === feast.ownerKey && placer.highflyProfessions) {
    placer.highflyProfessions = recordCookingFeastEvidence(placer.highflyProfessions, 'served');
  }
}""",
    'feast accepted serving evidence')

plan("src/sim/sim.ts",
    "import { highflySmithSnapshot, smithCraftId, smithPilotEnroll, smithPilotClaim } from './professions/highfly_smith_pilot';",
    "import { highflySmithSnapshot, smithCraftId, smithPilotEnroll, smithPilotClaim } from './professions/highfly_smith_pilot';\n"
    "import { cookingEvidenceSnapshot } from './professions/highfly_cooking_evidence';",
    'Sim read-only status import')
plan("src/sim/sim.ts",
    "  serializeCharacter(pid: number): CharacterState | null {",
    """  /** LAB-only readout: no new UI surface, XP or stat authority. */
  highflyCookingEvidenceStatus(pid = this.playerId) {
    return cookingEvidenceSnapshot(this.players.get(pid)?.highflyProfessions);
  }

  serializeCharacter(pid: number): CharacterState | null {""",
    'Sim Cooking evidence readout')

staged={}
for path,old,new,label in ops:
    prev=staged.get(path)
    if prev is None: prev=path.read_text(encoding='utf-8')
    if prev.count(old)!=1 or new in prev:
        raise SystemExit(f'PR6 refused {label}: frozen source anchor drifted (count={prev.count(old)})')
    staged[path]=prev.replace(old,new,1)
for path,s in staged.items():
    path.write_text(s,encoding='utf-8')
print('HIGHFLY_PR6_REAL_CRAFT_FARM_FISH_MONSTER_EVIDENCE=1')
print('HIGHFLY_PR6_REAL_FEAST_PLACE_SERVE_EVIDENCE_ONLY=1')
print('HIGHFLY_PR6_NO_FEAST_XP_NO_RNG_NO_TRAINING_CHANGE=1')
