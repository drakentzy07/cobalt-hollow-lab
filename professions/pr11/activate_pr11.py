#!/usr/bin/env python3
"""HIGHFLY PR-11: guarded donor tannery/loom successful craft evidence.

Post-commit only; no new XP, skill, gear, bag capacity, monster loot, item
recipes, stations, RNG, UI or Hunter attribute changes. REUSE FIRST.
"""
from pathlib import Path
changes=[]
def plan(path,old,new,label): changes.append((Path(path),old,new,label))

plan('src/sim/professions/crafting.ts',
  "import { recordHighflyEngineeringCraft } from './highfly_enchant_engineering';",
  "import { recordHighflyEngineeringCraft } from './highfly_enchant_engineering';\n"
  "import { recordHighflyLeatherTextileCraft } from './highfly_leather_textile';",
  'add tannery/loom post-success import')
plan('src/sim/professions/crafting.ts',
  """      meta.highflyProfessions = recordHighflyEngineeringCraft(
        recordHighflyDiscoveryFromCraft(
          recordHighflyAlchemyJewelCraft(
            recordHighflyKnowledgeFromCraft(
              recordCookingCraftEvidence(recordSmithTrialProof(recordCookingTrialProof(
                hfCareer.state, recipe.professionId, recipe.id,
              ), recipe.professionId, recipe.id), recipe), recipe),
            recipe,
          ),
          recipe,
        ),
        recipe,
      );""",
  """      meta.highflyProfessions = recordHighflyLeatherTextileCraft(
        recordHighflyEngineeringCraft(
          recordHighflyDiscoveryFromCraft(
            recordHighflyAlchemyJewelCraft(
              recordHighflyKnowledgeFromCraft(
                recordCookingCraftEvidence(recordSmithTrialProof(recordCookingTrialProof(
                  hfCareer.state, recipe.professionId, recipe.id,
                ), recipe.professionId, recipe.id), recipe), recipe),
              recipe,
            ),
            recipe,
          ),
          recipe,
        ),
        recipe,
      );""",
  'record only after successful original craft, no additional XP')

plan('src/sim/sim.ts',
  "import { highflyEnchantEngineeringStatus } from './professions/highfly_enchant_engineering';",
  "import { highflyEnchantEngineeringStatus } from './professions/highfly_enchant_engineering';\n"
  "import { highflyLeatherTextileStatus } from './professions/highfly_leather_textile';",
  'real Sim view import')
plan('src/sim/sim.ts',
  "  serializeCharacter(pid: number): CharacterState | null {",
  """  /** PR-11 LAB only: shows previously earned tannery/loom evidence. */
  highflyLeatherTextilePilotStatus(pid = this.playerId) {
    return highflyLeatherTextileStatus(this.players.get(pid)?.highflyProfessions);
  }

  serializeCharacter(pid: number): CharacterState | null {""",
  'LAB readout, never fake bag slots or armor visuals')

staged={}
for path,old,new,label in changes:
    s=staged.get(path)
    if s is None:s=path.read_text(encoding='utf-8')
    if s.count(old)!=1 or new in s:
        raise SystemExit(f'PR11 REFUSED {label}: frozen source drift count={s.count(old)}')
    staged[path]=s.replace(old,new,1)
for path,s in staged.items():path.write_text(s,encoding='utf-8')
print('HIGHFLY_PR11_REAL_LEATHER_TAILOR_CRAFT_EVIDENCE=1')
print('HIGHFLY_PR11_NO_NEW_BAG_CAPACITY_NO_EXTRA_XP_NO_NEW_RNG=1')
