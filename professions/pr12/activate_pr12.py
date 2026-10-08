#!/usr/bin/env python3
"""HIGHFLY PR-12 guarded actual inscription crafting success seam.

No additional craft XP, original temporary buffs, special offhand stats,
receipt transfer, promoted Legendary status, RNG, Training or public UI.
"""
from pathlib import Path
changes=[]
def plan(path,old,new,label):changes.append((Path(path),old,new,label))

plan('src/sim/professions/crafting.ts',
  "import { recordHighflyLeatherTextileCraft } from './highfly_leather_textile';",
  "import { recordHighflyLeatherTextileCraft } from './highfly_leather_textile';\n"
  "import { recordHighflyInscriptionCraft } from './highfly_inscription_docs';",
  'add Inscription success-only import')

plan('src/sim/professions/crafting.ts',
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
  """      meta.highflyProfessions = recordHighflyInscriptionCraft(
        recordHighflyLeatherTextileCraft(
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
        ),
        recipe,
      );""",
  'post-commit item evidence only, no recipe/XPs')

plan('src/sim/sim.ts',
  "import { highflyLeatherTextileStatus } from './professions/highfly_leather_textile';",
  "import { highflyLeatherTextileStatus } from './professions/highfly_leather_textile';\n"
  "import { highflyInscriptionStatus } from './professions/highfly_inscription_docs';",
  'read-only inscription status import')
plan('src/sim/sim.ts',
  "  serializeCharacter(pid: number): CharacterState | null {",
  """  /** PR-12 LAB: tracks actual authored document crafts, NOT Knowledge transfer. */
  highflyInscriptionPilotStatus(pid = this.playerId) {
    return highflyInscriptionStatus(this.players.get(pid)?.highflyProfessions);
  }

  serializeCharacter(pid: number): CharacterState | null {""",
  'read-only inscription lab status')

pending={}
for p,old,new,label in changes:
    text=pending.get(p)
    if text is None:text=p.read_text(encoding='utf-8')
    if text.count(old)!=1 or new in text:
        raise SystemExit(f'PR12 REFUSED {label}: donor drift count={text.count(old)}')
    pending[p]=text.replace(old,new,1)
for p,s in pending.items():p.write_text(s,encoding='utf-8')
print('HIGHFLY_PR12_REAL_INSCRIPTION_CRAFT_DOCUMENT_PROOFS=1')
print('HIGHFLY_PR12_DOCUMENT_ROLES_NOT_KNOWLEDGE_TRANSFER=1')
print('HIGHFLY_PR12_NO_AUTO_DEED_PROMOTION_NO_EXTRA_ITEM_XP=1')
