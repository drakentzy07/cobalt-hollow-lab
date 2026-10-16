#!/usr/bin/env python3
"""R27 P0: verify complete 23-entry registry and legal-safe lab-only policy.
This verifies DATA only; it does not build VFX or claim gameplay passes.
"""
from collections import Counter
from pathlib import Path
import re

catalog = Path(__file__).with_name("highfly_origin_r27_premium23_catalog.ts").read_text(encoding="utf-8")
row = re.compile(
    r"\{index:(\d+),id:'([^']+)',sourceId:'([^']+)',source:'([^']+)',"
    r"aim:'([^']+)',role:'([^']+)',demoMinRange:([0-9.]+),"
    r"demoMaxRange:([0-9.]+),demoRadius:([0-9.]+),"
    r"demoCooldownSec:([0-9.]+),integrationStatus:'catalog-only',"
    r"assetStatus:'review-required'\}"
)
entries = row.findall(catalog)
assert len(entries) == 23, f"Expected exactly 23 VFX prototypes: got {len(entries)}"
assert [int(e[0]) for e in entries] == list(range(1, 24))
assert len({e[1] for e in entries}) == 23, "IDs must be unique"
assert all(e[1].startswith("hf_vfx23_") for e in entries)
assert Counter(e[3] for e in entries) == Counter(casting6=6, effects7=7, advanced10=10)
assert Counter(e[5] for e in entries)["portal"] == 3
assert all(e[4] in {"line", "circle", "gate", "ring", "scribe"} for e in entries)
assert all(0 <= float(e[6]) <= float(e[7]) for e in entries)
assert all(float(e[9]) > 0 for e in entries)
assert "publicDeploy: false" in catalog
assert "persistentUnlocks: false" in catalog
assert "nativeSimOwnsDamage: true" in catalog
assert "unverifiedAssetsForbidden: true" in catalog
assert "equippedNormalSlots: 7" in catalog
assert "reservedSpecialSlots: 3" in catalog
assert "R27_EXTRA_BUFFS" in catalog
for sha in [
    "97f1de19617e9a2e3af3c8021c8c21c8f58b40f3",
    "bf58757ab9b6057515470aa074cdb4026bc54ed7",
    "8c377c886ac2c68b26bc65c8f3507905818b974a",
]:
    assert sha in catalog, "Missing pinned donor provenance"
print("R27 P0 GREEN: 23 unique metadata entries, 6+7+10 donors, "
      "3 utilities, no public deployment, legal asset review required.")
