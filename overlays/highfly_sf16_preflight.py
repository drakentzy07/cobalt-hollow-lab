#!/usr/bin/env python3
"""Preflight of verified, actually installed native skill IDs across ALL SF stages.
Runs BEFORE the expensive frozen donor checkout, installs and full WebGL job.
Fail CLOSED on repeated IDs, stale manifests, or renamed/dropped catalog entries.
"""
from __future__ import annotations
import pathlib
import re
import sys

root = pathlib.Path(__file__).resolve().parents[1]
files = root / "game" / "c1"
stages = [
    ("SF4", "highfly_sf4_safe_fusions.ts", "const PILOT_IDS = new Set([", 10),
    ("SF10", "highfly_sf10_three_native_reuses.ts", "const IDS=[", 3),
    ("SF12", "highfly_sf12_three_native_mechanics.ts", "const IDS=[", 3),
    ("SF14", "highfly_sf14_hand_native_adapters.ts", "const IDS=[", 2),
    ("SF15", "highfly_sf15_eight_native_batch.ts", "export const SF15_IDS=[", 8),
    ("SF16", "highfly_sf16_eight_support_elemental.ts", "export const SF16_IDS=[", 1),
    ("SF17", "highfly_sf17_three_unique_native.ts", "export const SF17_IDS=[", 3),
    ("SF18", "highfly_sf18_four_native_effects.ts", "export const SF18_IDS=[", 3),
    ("SF19", "highfly_sf19_two_melee_native.ts", "export const SF19_IDS=[", 2),
]
id_pattern = re.compile(r"['\"](hf_[a-z]+_[su]\d+)['\"]")
all_skills: dict[str, str] = {}
duplicates: list[str] = []
for stage, filename, marker, expected in stages:
    text = (files / filename).read_text(encoding="utf-8")
    if marker not in text:
        raise SystemExit(f"SF_PRECHECK_MISSING_MANIFEST:{stage}:{marker}")
    data = text.split(marker, 1)[1].split("]", 1)[0]
    ids = id_pattern.findall(data)
    if len(ids) != expected or len(set(ids)) != expected:
        raise SystemExit(f"SF_PRECHECK_BAD_STAGE_COUNT:{stage}:got_{ids}:expected_{expected}")
    for identifier in ids:
        if identifier in all_skills:
            duplicates.append(f"{identifier} in {all_skills[identifier]} and {stage}")
        all_skills[identifier] = stage

# SF13 deliberately uses a two-target compatibility gate rather than an IDS
# array: verify BOTH literal hand-audited candidates in the pinned source.
sf13 = (files / "highfly_sf13_mass_native_gate.ts").read_text(encoding="utf-8")
sf13_ids = ["hf_mage_s1", "hf_hunter_s2"]
for identifier in sf13_ids:
    if f"s.id==='{identifier}'" not in sf13:
        raise SystemExit(f"SF_PRECHECK_CHANGED_SF13_NATIVE_CANDIDATE:{identifier}")
    if identifier in all_skills:
        duplicates.append(f"{identifier} in {all_skills[identifier]} and SF13")
    all_skills[identifier] = "SF13"

catalog = (files / "highfly_sf3_skill_catalog.ts").read_text(encoding="utf-8")
catalog_ids = set(re.findall(r'"id": "(hf_[a-z]+_[su]\d+)"', catalog))
if len(catalog_ids) != 63:
    raise SystemExit(f"SF_PRECHECK_CATALOG_NOT_63:{len(catalog_ids)}")
unknown = set(all_skills) - catalog_ids
if unknown:
    raise SystemExit(f"SF_PRECHECK_NOT_IN_CATALOG:{sorted(unknown)}")
if duplicates:
    raise SystemExit("SF_PRECHECK_DUPLICATE_SKILL_ID:" + "; ".join(duplicates))
expected_total = sum(row[3] for row in stages) + len(sf13_ids)
if len(all_skills) != expected_total or expected_total != 37:
    raise SystemExit(f"SF_PRECHECK_WRONG_ACTUAL_NATIVE_TOTAL:{len(all_skills)}")
if all_skills.get("hf_paladin_s5") != "SF16":
    raise SystemExit("SF_PRECHECK_SF16_NEW_SKILL_NOT_UNIQUE")
print(f"HF_SF16_UNIQUE_REGISTRY_PREFLIGHT_GREEN=1")
print(f"HF_SF16_PRIOR_CERTIFIED=28 NEW=1 CANDIDATES=29 OF_CATALOG=63")
if { "hf_hunter_s1", "hf_shaman_u1", "hf_shaman_u2" } != {id for id, stage in all_skills.items() if stage == "SF17"}:
    raise SystemExit("SF_PRECHECK_UNEXPECTED_SF17_SET")
print("HF_SF17_REGISTRY_UNIQUE_32_GREEN=1")
print(f"HF_SF17_PRIOR_CERTIFIED=29 NEW=3 CANDIDATES=32 OF_CATALOG=63")
if {"hf_hunter_s3", "hf_shaman_s5", "hf_mage_s2"} != {
    id for id, stage in all_skills.items() if stage == "SF18"
}:
    raise SystemExit("SF_PRECHECK_UNEXPECTED_SF18_IDS")
print("HF_SF18_UNIQUE_35_NATIVE_PREFLIGHT_GREEN=1")
print(f"HF_SF18_PRIOR_CERTIFIED=32 NEW=3 CANDIDATES=35 OF_CATALOG=63")
if "hf_hunter_u1" in all_skills:
    raise SystemExit("SF18_INVALID_CHANNEL_SECONDARY_BUFF_WAS_INSTALLED")
print("HF_SF18_HUNTER_U1_BLOCKED_LIFECYCLE_ADAPTER_REQUIRED=1")
print(f"HF_SF18_REMAINING_IF_SUCCESS={len(catalog_ids)-len(all_skills)}")

if {"hf_warrior_s2", "hf_rogue_u1"} != {
    id for id, stage in all_skills.items() if stage == "SF19"
}:
    raise SystemExit("SF_PRECHECK_WRONG_SF19_TWO_NATIVE_IDS")
print("HF_SF19_UNIQUE_37_NATIVE_PREFLIGHT_GREEN=1")
print("HF_SF19_PRIOR_CERTIFIED=35 NEW=2 CANDIDATES=37 OF_63")
print(f"HF_SF19_REMAINING_IF_SUCCESS={len(catalog_ids)-len(all_skills)}")
