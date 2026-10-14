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
    ("SF20", "highfly_sf20_two_source_effects.ts", "export const SF20_IDS=[", 2),
    ("SF21", "highfly_sf21_three_complex_source.ts", "export const SF21_IDS=[", 3),
    ("SF22", "highfly_sf22_three_original_compat.ts", "export const SF22_IDS=[", 3),
    ("SF23", "highfly_sf23_three_native_fusions.ts", "export const SF23_IDS=[", 3),
    ("SF24", "highfly_sf24_hunter_druid_three_native.ts", "export const SF24_IDS=[", 3),
    ("SF25", "highfly_sf25_shaman_warlock_two_native.ts", "export const SF25_IDS=[", 2),
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
if len(all_skills) != expected_total or expected_total != 53:
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
# SF18 explicitly blocked an unadapted secondary selfBuff in six-shot
# channels. SF24 now installs an ORIGINAL casting_lifecycle source bridge
# that issues this buff ONLY after six delivered ticks. Keep the strict
# safety gate: if the exact compatibility source is absent, reject.
if "hf_hunter_u1" in all_skills:
    if all_skills["hf_hunter_u1"] != "SF24":
        raise SystemExit("SF18_INVALID_CHANNEL_SECONDARY_BUFF_WAS_INSTALLED")
    adapter = root / "overlays" / "highfly_sf24_hunter_completion.py"
    bridge = adapter.read_text(encoding="utf-8") if adapter.is_file() else ""
    for token in [
        "hf24SixShotsCompleted",
        "p.channelTicksLeft === 0",
        "completed?.def.id === 'hf_hunter_u1'",
        "activateHunterMajorWindow(ctx, p, buff.duration)",
        "SF24_FROZEN_SOURCE_DRIFT",
    ]:
        if token not in bridge:
            raise SystemExit("SF24_BLOCKED_CHANNEL_COMPLETION_BRIDGE_MISSING:" + token)
    print("HF_SF24_HUNTER_U1_COMPLETION_ONLY_NATIVE_BRIDGE_PREFLIGHT_GREEN=1")
else:
    print("HF_SF18_HUNTER_U1_BLOCKED_LIFECYCLE_ADAPTER_REQUIRED=1")
print(f"HF_SF18_REMAINING_IF_SUCCESS={len(catalog_ids)-len(all_skills)}")

if {"hf_warrior_s2", "hf_rogue_u1"} != {
    id for id, stage in all_skills.items() if stage == "SF19"
}:
    raise SystemExit("SF_PRECHECK_WRONG_SF19_TWO_NATIVE_IDS")
print("HF_SF19_UNIQUE_37_NATIVE_PREFLIGHT_GREEN=1")
print("HF_SF19_PRIOR_CERTIFIED=35 NEW=2 CANDIDATES=37 OF_63")
print(f"HF_SF19_REMAINING_IF_SUCCESS={len(catalog_ids)-len(all_skills)}")

if {"hf_mage_u1", "hf_rogue_s5"} != {
    identifier for identifier, stage in all_skills.items() if stage == "SF20"
}:
    raise SystemExit("SF_PRECHECK_UNEXPECTED_SF20_IDS")
print("HF_SF20_UNIQUE_39_NATIVE_PREFLIGHT_GREEN=1")
print("HF_SF20_PRIOR_CERTIFIED=37 NEW=2 CANDIDATES=39 OF_CATALOG=63")
print(f"HF_SF20_REMAINING_IF_SUCCESS={len(catalog_ids)-len(all_skills)}")

if {"hf_paladin_u2", "hf_hunter_u2", "hf_warlock_s4"} != {
    ident for ident, stage in all_skills.items() if stage == "SF21"
}:
    raise SystemExit("SF_PRECHECK_INVALID_SF21_SET")
print("HF_SF21_UNIQUE_42_NATIVE_PREFLIGHT_GREEN=1")
print("HF_SF21_PRIOR_CERTIFIED=39 NEW=3 CANDIDATES=42 OF_CATALOG=63")
print("HF_SF21_REMAINING_IF_SUCCESS=21")

if {"hf_paladin_u1", "hf_hunter_s4", "hf_mage_u2"} != {
    ident for ident, stage in all_skills.items() if stage == "SF22"
}:
    raise SystemExit("SF_PRECHECK_UNEXPECTED_SF22_IDS")
print("HF_SF22_UNIQUE_45_NATIVE_PREFLIGHT_GREEN=1")
print("HF_SF22_PRIOR_42_NEW_3_CANDIDATES_45_OF_63=1")
print("HF_SF22_REMAINING_IF_SUCCESS=18")

if {"hf_warrior_s1", "hf_rogue_s2", "hf_mage_s5"} != {
    ident for ident, stage in all_skills.items() if stage == "SF23"
}:
    raise SystemExit("SF_PRECHECK_INVALID_SF23_SET")
print("HF_SF23_UNIQUE_48_NATIVE_PREFLIGHT_GREEN=1")
print("HF_SF23_PRIOR_45_NEW_3_CANDIDATES_48_OF_63=1")
print("HF_SF23_REMAINING_IF_SUCCESS=15")

if {"hf_hunter_u1", "hf_druid_s1", "hf_druid_s2"} != {
    ident for ident, stage in all_skills.items() if stage == "SF24"
}:
    raise SystemExit("SF_PRECHECK_INVALID_SF24_SET")
print("HF_SF24_UNIQUE_51_NATIVE_PREFLIGHT_GREEN=1")
print("HF_SF24_PRIOR_48_NEW_3_CANDIDATES_51_OF_63=1")
print("HF_SF24_REMAINING_IF_SUCCESS=12")

if {"hf_shaman_s4", "hf_warlock_s5"} != {
    ident for ident, stage in all_skills.items() if stage == "SF25"
}:
    raise SystemExit("SF_PRECHECK_INVALID_SF25_SET")
source_adapter = root / "overlays" / "highfly_sf25_native_selectors.py"
bridge = source_adapter.read_text(encoding="utf-8") if source_adapter.is_file() else ""
for token in [
    "runUnleashWeapon(ctx, p, target)",
    "id: 'flametongue_weapon'",
    "previous?.templateId === 'emberkin'",
    "ctx.summonPet(p, nextMobId)",
    "SF25_FROZEN_EFFECT_DISPATCH_DRIFT",
]:
    if token not in bridge:
        raise SystemExit("SF25_BLOCKED_NATIVE_SOURCE_BRIDGE_MISSING:" + token)
print("HF_SF25_SHAMAN_PYREBRAND_WARLOCK_ONE_DEMON_BRIDGE_PREFLIGHT_GREEN=1")
print("HF_SF25_UNIQUE_53_NATIVE_PREFLIGHT_GREEN=1")
print("HF_SF25_PRIOR_51_NEW_2_CANDIDATES_53_OF_63=1")
print(f"HF_SF25_REMAINING_IF_SUCCESS={len(catalog_ids)-len(all_skills)}")
