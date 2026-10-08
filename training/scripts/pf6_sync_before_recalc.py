#!/usr/bin/env python3
"""PF-6 E: synchronize Hunter Core at the donor's true level-up seam.

Safe scope: only grantXp's existing per-level path, after level increment and
before the single derived-stat recalc. Remote/unbound entities are ignored.
"""
from pathlib import Path

path = Path("src/sim/combat/damage.ts")
source = path.read_text(encoding="utf-8")
anchor_import = "import { ABILITIES, DELVES, GROUP_XP_BONUS, ITEMS, MOBS } from '../data';"
replacement_import = ("import { syncHighflyPf6BeforeStatRecalc } "
                      "from '../../highfly/training/pf6_progression_sync';\n"
                      + anchor_import)
# Only the specific grantXp level-up is patched, not other recalc paths.
old = """    p.level++;
    meta.counters.levelUps++;
    // Re-bake the flat talent mods at the new level BEFORE the stat pass:"""
new = """    p.level++;
    meta.counters.levelUps++;
    // Refresh HIGHFLY local permanent Core BEFORE Claude's existing one-pass
    // derived stat calculation. No second XP grant or second stat pass.
    syncHighflyPf6BeforeStatRecalc(p.id, p.level, meta.xp, meta.cls);
    // Re-bake the flat talent mods at the new level BEFORE the stat pass:"""
for label, before in [("damage import", anchor_import), ("level-up seam", old)]:
    if source.count(before) != 1:
        raise SystemExit(f"PF-6 E guarded transform failed at {label}")
if "syncHighflyPf6BeforeStatRecalc" in source:
    raise SystemExit("PF-6 E already applied")
updated = source.replace(anchor_import, replacement_import, 1).replace(old, new, 1)
path.write_text(updated, encoding="utf-8")
assert updated.count("syncHighflyPf6BeforeStatRecalc(") == 1
print("HIGHFLY_PF6_PERMANENT_CORE_BEFORE_RECALC=1")
