#!/usr/bin/env python3
"""PR-2: wrap ONLY Claude's gainCraftSkill source body with a passive observer."""
from pathlib import Path

path = Path('src/sim/professions/wheel.ts')
source = path.read_text(encoding='utf-8')
old_import = "import type { SimContext } from '../sim_context';"
new_import = ("import { observeLegacyProfessionProgress } "
              "from './highfly_progress_bridge';\n" + old_import)
old_body = """export function gainCraftSkill(skills: CraftSkills, craftId: string, amount: number): void {
  if (!(craftId in skills) || !(amount > 0)) return;
  skills[craftId] = Math.min(craftMaxSkillFor(craftId), skills[craftId] + amount);
}"""
new_body = """export function gainCraftSkill(skills: CraftSkills, craftId: string, amount: number): void {
  // HIGHFLY PR-2 only observes the applied delta. The ORIGINAL Claude gain
  // body below is still the only writer, and runs exactly once.
  observeLegacyProfessionProgress(skills, craftId, amount, () => {
    if (!(craftId in skills) || !(amount > 0)) return;
    skills[craftId] = Math.min(craftMaxSkillFor(craftId), skills[craftId] + amount);
  });
}"""
if source.count(old_import) != 1 or source.count(old_body) != 1:
    raise SystemExit('PR-2 refuse: immutable Claude profession gain site changed')
if 'observeLegacyProfessionProgress' in source:
    raise SystemExit('PR-2 refuse: duplicate bridge')
updated = source.replace(old_import, new_import, 1).replace(old_body, new_body, 1)
assert updated.count('skills[craftId] = Math.min(craftMaxSkillFor(craftId), skills[craftId] + amount);') == 1
path.write_text(updated, encoding='utf-8')
print('HIGHFLY_PR2_CLAUDE_SKILL_GAIN_UNCHANGED_IN_BRIDGE=1')
