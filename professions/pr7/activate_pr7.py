#!/usr/bin/env python3
"""PR-7: authored Knowledge earned AFTER real craft commit only.

All writes confined to existing HIGHFLY sparse career; never touch Claude
knownRecipes, item outputs, XP, RNG, Training, transfer or actual Discovery.
"""
from pathlib import Path
ops=[]
def plan(path,old,new,label):ops.append((Path(path),old,new,label))
plan('src/sim/professions/crafting.ts',
  "import { recordCookingCraftEvidence } from './highfly_cooking_evidence';",
  "import { recordCookingCraftEvidence } from './highfly_cooking_evidence';\n"
  "import { recordHighflyKnowledgeFromCraft } from './highfly_knowledge_core';",
  'knowledge import')
plan('src/sim/professions/crafting.ts',
  """      meta.highflyProfessions = recordCookingCraftEvidence(recordSmithTrialProof(recordCookingTrialProof(
        hfCareer.state, recipe.professionId, recipe.id,
      ), recipe.professionId, recipe.id), recipe);""",
  """      meta.highflyProfessions = recordHighflyKnowledgeFromCraft(
        recordCookingCraftEvidence(recordSmithTrialProof(recordCookingTrialProof(
          hfCareer.state, recipe.professionId, recipe.id,
        ), recipe.professionId, recipe.id), recipe), recipe);""",
  'knowledge reads evidence after actual success')
plan('src/sim/sim.ts',
  "import { cookingEvidenceSnapshot } from './professions/highfly_cooking_evidence';",
  "import { cookingEvidenceSnapshot } from './professions/highfly_cooking_evidence';\n"
  "import { highflyKnowledgeReadout } from './professions/highfly_knowledge_core';",
  'Sim read-only Knowledge import')
plan('src/sim/sim.ts',
  "  serializeCharacter(pid: number): CharacterState | null {",
  """  /** PR-7 LAB only: previously learned knowledge, never hidden totals. */
  highflyKnowledgeStatus(pid = this.playerId) {
    return highflyKnowledgeReadout(this.players.get(pid)?.highflyProfessions);
  }

  serializeCharacter(pid: number): CharacterState | null {""",
  'read-only knowledge on real Sim')

staged={}
for p,old,new,label in ops:
    src=staged.get(p)
    if src is None:src=p.read_text(encoding='utf-8')
    if src.count(old)!=1 or new in src:
        raise SystemExit(f'PR7 refused {label}: frozen anchor drifted ({src.count(old)})')
    staged[p]=src.replace(old,new,1)
for p,source in staged.items():p.write_text(source,encoding='utf-8')
print('HIGHFLY_PR7_KNOWLEDGE_POST_CRAFT_ONLY=1')
print('HIGHFLY_PR7_KNOWN_RECIPES_UNCHANGED_NO_STATS_RNG=1')
