#!/usr/bin/env python3
"""PR-9 guarded additive Catalyst/Prismglass proof on the real craft success.

Replay PR0–8, then stitch post-success and LAB readout only. Never modify the
authored donor recipes, output, station, daily limit, stats, RNG or gem/sockets.
"""
from pathlib import Path
ops=[]
def add(path,old,new,label):
    ops.append((Path(path),old,new,label))

add('src/sim/professions/crafting.ts',
    "import { recordHighflyDiscoveryFromCraft } from './highfly_discovery_core';",
    "import { recordHighflyDiscoveryFromCraft } from './highfly_discovery_core';\n"
    "import { recordHighflyAlchemyJewelCraft } from './highfly_alchemy_jewel';",
    "PR-9 additive success import")
add('src/sim/professions/crafting.ts',
    """      meta.highflyProfessions = recordHighflyDiscoveryFromCraft(
        recordHighflyKnowledgeFromCraft(
          recordCookingCraftEvidence(recordSmithTrialProof(recordCookingTrialProof(
            hfCareer.state, recipe.professionId, recipe.id,
          ), recipe.professionId, recipe.id), recipe), recipe),
        recipe,
      );""",
    """      meta.highflyProfessions = recordHighflyDiscoveryFromCraft(
        recordHighflyAlchemyJewelCraft(
          recordHighflyKnowledgeFromCraft(
            recordCookingCraftEvidence(recordSmithTrialProof(recordCookingTrialProof(
              hfCareer.state, recipe.professionId, recipe.id,
            ), recipe.professionId, recipe.id), recipe), recipe),
          recipe,
        ),
        recipe,
      );""",
    "PR-9 material knowledge before Discovery event")
add('src/sim/sim.ts',
    "import { highflyDiscoveryReadout } from './professions/highfly_discovery_core';",
    "import { highflyDiscoveryReadout } from './professions/highfly_discovery_core';\n"
    "import { highflyAlchemyJewelStatus } from './professions/highfly_alchemy_jewel';",
    "PR-9 read-only Sim import")
add('src/sim/sim.ts',
    "  serializeCharacter(pid: number): CharacterState | null {",
    """  /** PR-9 LAB status; no Gem Core, no socket/payload mutation or public UI. */
  highflyAlchemyJewelPilotStatus(pid = this.playerId) {
    return highflyAlchemyJewelStatus(this.players.get(pid)?.highflyProfessions);
  }

  serializeCharacter(pid: number): CharacterState | null {""",
    "PR-9 read-only status")
staged={}
for path,old,new,label in ops:
    s=staged.get(path)
    if s is None: s=path.read_text(encoding='utf-8')
    if s.count(old)!=1 or new in s:
        raise SystemExit(f'PR9 REFUSED {label}: unexpected upstream anchor {s.count(old)}')
    staged[path]=s.replace(old,new,1)
for path,src in staged.items():path.write_text(src,encoding='utf-8')
print('HIGHFLY_PR9_ALCHEMY_JEWEL_SUCCESS_PROOFS=1')
print('HIGHFLY_PR9_CATALYST_PRISMGLASS_RECIPE_AUTHORITY_UNCHANGED=1')
print('HIGHFLY_PR9_NO_GEMS_SOCKET_TRAINING_XP_RNG_CHANGE=1')
