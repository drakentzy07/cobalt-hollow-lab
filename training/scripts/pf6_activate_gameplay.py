#!/usr/bin/env python3
"""PF-6 B: extend the canonical donor's *real* XP authority to LV99.

Called ONLY in the isolated PF-6 CI path, after validated CLEAN patch replay.
No secondary XP wallet or event handler is introduced.
"""
from pathlib import Path
import re

types = Path("src/sim/types.ts")
curve = Path("src/highfly/training/pf6_xp_curve.ts")
if not types.is_file() or not curve.is_file():
    raise SystemExit("PF-6 requires the CLEAN source and its isolated XP curve")

text = types.read_text(encoding="utf-8")
old_table = """export const XP_TABLE = [
  400, 900, 1400, 2100, 2800, 3600, 4500, 5400, 6500, 7600, 8800, 10100, 11400, 12900, 14400, 16000,
  17700, 19400, 21300, 23200,
];"""
if text.count(old_table) != 1:
    raise SystemExit("PF-6 unexpected donor XP_TABLE: abort without modifying source")
if text.count("export const MAX_LEVEL = 20;") != 1:
    raise SystemExit("PF-6 unexpected donor level cap: abort without modifying source")
if text.count("export function xpForLevel(level: number): number {") != 1:
    raise SystemExit("PF-6 missing existing donor XP grant threshold function")

# Pure module: no dependency from Training back to the Sim domain.
import_line = "import { HIGHFLY_PF6_NORMAL_MAX_LEVEL, HIGHFLY_PF6_XP_TABLE } from '../highfly/training/pf6_xp_curve';\n"
if import_line in text:
    raise SystemExit("PF-6 already applied; abort duplicate")
text = import_line + text
text = text.replace(old_table, """// Single authoritative gameplay XP curve; donor grantXp remains unchanged.
export const XP_TABLE = HIGHFLY_PF6_XP_TABLE;""", 1)
text = text.replace(
    "export const MAX_LEVEL = 20;",
    "export const MAX_LEVEL = HIGHFLY_PF6_NORMAL_MAX_LEVEL;",
    1,
)
text = text.replace(
    "// XP required to go from level L to L+1 (classic-era curve values, levels 1..20)",
    "// XP required from real level L to L+1, first 20 costs preserve donor values.",
    1,
)
types.write_text(text, encoding="utf-8")

assert text.count("export const MAX_LEVEL = HIGHFLY_PF6_NORMAL_MAX_LEVEL;") == 1
assert text.count("export const XP_TABLE = HIGHFLY_PF6_XP_TABLE;") == 1
print("HIGHFLY_PF6_DONOR_REAL_LEVEL_CAP_99_ACTIVATED=1")
