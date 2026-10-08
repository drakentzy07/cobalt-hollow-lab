#!/usr/bin/env python3
"""PR-8: guarded, successful-CRAFT-only Discovery commit over PR-7 Knowledge.

No standalone discovery action, RNG,  per-tick scan, recipe unlock, item mint,
profession XP, Character XP, permanent stat or world/gameplay content change.
"""
from pathlib import Path
edits=[]
def plan(path,old,new,label):
    edits.append((Path(path),old,new,label))
plan('src/sim/professions/crafting.ts',
    "import { recordHighflyKnowledgeFromCraft } from './highfly_knowledge_core';",
    "import { recordHighflyKnowledgeFromCraft } from './highfly_knowledge_core';\n"
    "import { recordHighflyDiscoveryFromCraft } from './highfly_discovery_core';",
    "Discovery post-commit import")
plan('src/sim/professions/crafting.ts',
    """      meta.highflyProfessions = recordHighflyKnowledgeFromCraft(
        recordCookingCraftEvidence(recordSmithTrialProof(recordCookingTrialProof(
          hfCareer.state, recipe.professionId, recipe.id,
        ), recipe.professionId, recipe.id), recipe), recipe);""",
    """      meta.highflyProfessions = recordHighflyDiscoveryFromCraft(
        recordHighflyKnowledgeFromCraft(
          recordCookingCraftEvidence(recordSmithTrialProof(recordCookingTrialProof(
            hfCareer.state, recipe.professionId, recipe.id,
          ), recipe.professionId, recipe.id), recipe), recipe),
        recipe,
      );""",
    "Discovery AFTER knowledge and evidence on real craft")
plan('src/sim/sim.ts',
    "import { highflyKnowledgeReadout } from './professions/highfly_knowledge_core';",
    "import { highflyKnowledgeReadout } from './professions/highfly_knowledge_core';\n"
    "import { highflyDiscoveryReadout } from './professions/highfly_discovery_core';",
    "Sim Discovery read-only import")
plan('src/sim/sim.ts',
    "  serializeCharacter(pid: number): CharacterState | null {",
    """  /** PR-8 lab read only: never reveal undiscovered counts or conditions. */
  highflyDiscoveryStatus(pid = this.playerId) {
    return highflyDiscoveryReadout(this.players.get(pid)?.highflyProfessions);
  }

  serializeCharacter(pid: number): CharacterState | null {""",
    "Sim Discovery safe status")
staged={}
for p,old,new,label in edits:
    s=staged.get(p)
    if s is None:s=p.read_text(encoding='utf-8')
    if s.count(old)!=1 or new in s:
        raise SystemExit(f'PR8 REFUSED {label}: source anchor drift ({s.count(old)})')
    staged[p]=s.replace(old,new,1)
for p,s in staged.items():p.write_text(s,encoding='utf-8')
print('HIGHFLY_PR8_EVENT_INDEXED_REAL_CRAFT_DISCOVERY=1')
print('HIGHFLY_PR8_NO_AUTO_RECIPE_STAT_XP_RNG_REWARD=1')
