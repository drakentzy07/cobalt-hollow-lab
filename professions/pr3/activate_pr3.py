#!/usr/bin/env python3
"""PR-3: activate additive HIGHFLY Profession XP only at donor's craft success seam.

Do not rewrite Claude's gainCraftSkill, Character XP, RNG, output or materials.
PR-3 must not introduce promotion gates (PR-4) or an extra stat authority.
"""
from pathlib import Path

path=Path('src/sim/professions/crafting.ts')
s=path.read_text(encoding='utf-8')
imp="import { craftActionXp } from './profession_xp';"
replacement=("import { recordHighflyProfessionProgress } from './highfly_profession_progress';\n"+imp)
anchor="""    const skillLearned = (meta.craftSkills[recipe.professionId] ?? 0) - skillBefore;
    // Craft Cast System:"""
insert="""    const skillLearned = (meta.craftSkills[recipe.professionId] ?? 0) - skillBefore;
    // HIGHFLY PR-3: after real item commit and the *unchanged* Claude gain,
    // award deterministic career XP to the optional PR-1 save fragment.
    // Character XP and all original RNG/crafting logic below stay untouched.
    const hfCareer = recordHighflyProfessionProgress(meta.highflyProfessions, {
      professionId: recipe.professionId,
      skillDelta: skillLearned,
      practiceKey: `recipe:${recipe.id}`,
    });
    if (hfCareer.state !== undefined) meta.highflyProfessions = hfCareer.state;
    // Craft Cast System:"""
if s.count(imp)!=1 or s.count(anchor)!=1:
  raise SystemExit('PR-3 refused: frozen original craft-success seam differs')
if 'recordHighflyProfessionProgress' in s:
  raise SystemExit('PR-3 refused: duplicate profession-XP activation')
s=s.replace(imp,replacement,1).replace(anchor,insert,1)
assert s.count('gainCraftSkill(meta.craftSkills, recipe.professionId, CRAFT_SKILL_GAIN * multiplier);')==1
assert s.count('if (xp > 0) ctx.grantXp(xp, meta);')==1
assert s.count('const procRoll = ctx.rng.next();')==1
path.write_text(s,encoding='utf-8')
print('HIGHFLY_PR3_ONLY_SUCCESSFUL_CRAFT_PROGRESS=1')
print('HIGHFLY_PR3_PRESERVED_CLAUDE_SKILL_CHARXP_AND_RNG=1')
