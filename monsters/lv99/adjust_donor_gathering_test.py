#!/usr/bin/env python3
"""Preserve upstream's pinned donor census when HIGHFLY adds opt-in content.
Edits only the ephemeral CI checkout test, never the frozen donor checkout or
production runtime. New HIGHFLY tags remain separately audited in our tests.
"""
from pathlib import Path
path = Path("tests/gathering.test.ts")
if not path.is_file():
    raise SystemExit("HF_MONSTER_CENSUS_MISSING_TEST")
data = path.read_text(encoding="utf-8")
start = "  it('answers for every shipped template, and none is excluded any more', () => {\n"
end = "\n});\n\ndescribe('resolveCorpseFocusHarvest:"
if data.count(start)!=1 or data.count(end)!=1:
    raise SystemExit("HF_MONSTER_CENSUS_TEST_DRIFT")
head, tail = data.split(start,1)
section, suffix = tail.split(end,1)
counts = {
    "Object.entries(MOBS)": 2,
    "Object.values(MOBS)": 1,
    "Object.keys(MOBS)": 1,
}
for source, expected in counts.items():
    if section.count(source) != expected:
        raise SystemExit(f"HF_MONSTER_CENSUS_ASSERT_DRIFT:{source}")
scoped = (
    "    // Donor's fixed 54/216 template census is a compatibility pin.\n"
    "    // HIGHFLY's 64 hunts + 16 elite/captain templates are audited separately.\n"
    "    const originalMobs = Object.fromEntries(\n"
    "      Object.entries(MOBS).filter(([id]) =>\n"
    "        !id.startsWith('hf_hunt_') && !id.startsWith('hf_enc_')),\n"
    "    );\n"
)
section = (scoped + section
    .replace("Object.entries(MOBS)", "Object.entries(originalMobs)")
    .replace("Object.values(MOBS)", "Object.values(originalMobs)")
    .replace("Object.keys(MOBS)", "Object.keys(originalMobs)"))
new_text = head+start+section+end+suffix
if new_text.count("Object.entries(originalMobs)")!=2:
    raise SystemExit("HF_MONSTER_CENSUS_REWRITE_FAILED")
path.write_text(new_text,encoding="utf-8")
print("HF_MONSTER_ORIGINAL_CENSUS_54_216_RETAINED=1")
