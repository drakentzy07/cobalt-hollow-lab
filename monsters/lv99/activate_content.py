#!/usr/bin/env python3
"""Fail-closed, additive HIGHFLY LV21-99 content activation after V3-06 replay.
No source overwrites, no new world camps, no quest changes, no LV100+.
"""
from pathlib import Path

src = Path("src/sim/data.ts")
library = Path("src/highfly/monsters/level99.ts")
if not src.is_file() or not library.is_file():
    raise SystemExit("HF_MONSTER_LV99_MISSING_SOURCE")

body = src.read_text(encoding="utf-8")
import_stmt = ("import { buildHighflyMonsterRoster } from '../highfly/monsters/level99';\n"
               "import { applyHighflyHuntRewardTables } from '../highfly/monsters/hunt_rewards';\n")
anchor = "  ...WORLD_QUEST_MOBS,\n};\n\n// Heroic upgraded drop variants:"
if body.count(anchor) != 1 or "buildHighflyMonsterRoster" in body:
    raise SystemExit("HF_MONSTER_LV99_UNEXPECTED_DONOR_MERGE")
body = import_stmt + body.replace(
    anchor,
    "  ...WORLD_QUEST_MOBS,\n};\n\n"
    "// HIGHFLY LV21-99 opt-in hunt definitions. Original MOBS, quests and camps untouched.\n"
    "Object.assign(MOBS, applyHighflyHuntRewardTables(\n"
    "  buildHighflyMonsterRoster(MOBS), ITEMS, ALL_RECIPES\n));\n\n"
    "// Heroic upgraded drop variants:",
    1,
)
src.write_text(body, encoding="utf-8")
print("HIGHFLY_MONSTER_LV99_REAL_RECIPE_REWARDS_REGISTERED=1")
