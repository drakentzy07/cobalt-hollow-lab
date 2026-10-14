#!/usr/bin/env python3
"""V13 phase 0: assert real SF27 catalog and produce immutable A/B cases.
This produces TEST METADATA, not a playable skill runtime or visual VFX QA.
"""
import argparse
import json
import re
from pathlib import Path

CLASSES = ("warrior", "paladin", "hunter", "rogue", "priest", "shaman", "mage", "warlock", "druid")
LAB_REUSE_FILES = (
    "HighflySkillLabBootstrap.cs", "HighflySkillLoadoutMenu.cs",
    "HighflySkillCooldownUI.cs", "HighflyReferenceSkillRuntime.cs",
    "HighflyAdvancedSkillRuntime.cs", "HighflyAerialMobility.cs",
    "HighflyLabDesktopControls.cs", "HighflyAnimeFx.cs",
    "HighflyPremiumFx.cs", "HighflyPremiumSkillRuntime.cs",
)

def generate(catalog_file: Path, lab_dir: Path, output: Path) -> dict:
    source = catalog_file.read_text(encoding="utf-8")
    match = re.search(r"export const HIGHFLY_FUSED_SKILLS[^=]*=\s*(\{.*?\n\});", source, re.S)
    assert match, "V13: source HIGHFLY_FUSED_SKILLS not found; block"
    roster = json.loads(match.group(1))
    assert tuple(roster) == CLASSES, "V13: original nine classes changed"
    skills, ids, cases = [], set(), []
    for cls in CLASSES:
        assert len(roster[cls]) == 7, f"V13: {cls} must retain exactly 7"
        for slot, spec in enumerate(roster[cls], 1):
            sid = spec["id"]
            assert sid not in ids, f"V13: duplicate {sid}"
            ids.add(sid)
            assert spec["slot"] == slot and spec["classId"] == cls, f"V13: mismatch {sid}"
            assert spec["unlockLevel"] in (1, 5, 10, 15, 20, 25, 30)
            assert len(spec["donors"]) >= 2 and len(set(spec["donors"])) == len(spec["donors"])
            assert sid.startswith(f"hf_{cls}_")
            assert spec["name"].strip()
            skills.append(spec)
            cases.append({
                "id": f"v13_{cls}_ab{slot}", "classId": cls, "slot": slot,
                "fusedSkillId": sid, "originalDonorIds": spec["donors"],
                "level": 99, "statsSource": "shared_snapshot_required",
                "equipmentSource": "shared_snapshot_required",
                "target": "invulnerable_dummy",
                "metrics": ["damage", "cooldown", "range", "targeting", "utility",
                            "animation", "vfx", "audio", "cast_time"],
                "runtimeTested": False, "visualVerified": False, "s23Verified": False,
            })
    assert len(skills) == len(ids) == len(cases) == 63
    reusable = {}
    for name in LAB_REUSE_FILES:
        path = lab_dir / name
        assert path.is_file() and path.stat().st_size > 100, f"V13: donor missing {name}"
        reusable[name] = path.stat().st_size
    bootstrap = (lab_dir / "HighflySkillLabBootstrap.cs").read_text(encoding="utf-8")
    for marker in ("HighflyLabDummyStats", "RecordHit", "BuildRoom", "HighflyAerialMobility"):
        assert marker in bootstrap, f"V13: reuse marker missing {marker}"
    data = {
        "edition": "HIGHFLY V13 P0 - CATALOG AND HISTORIC SKILL LAB REUSE AUDIT",
        "classes": list(CLASSES), "classCount": 9, "skillCount": 63,
        "skills": skills, "abCases": cases,
        "donorLab": "drakentzy07/u6-mobile-runtime-probe",
        "donorRef": "highfly/skill-lab-2.0-hd-7of7-green",
        "reusedSourceCandidates": reusable,
        "publicProjectMutated": False,
        "status": "catalog validated; playable 3D integration, VFX QA and S23 pending",
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"HF_V13_P0_CATALOG_9_CLASSES_63_AB_CASES_AND_REUSE_AUDIT_GREEN=1 file={output}")
    return data

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--catalog", default="game/c1/highfly_sf3_skill_catalog.ts")
    ap.add_argument("--donor-lab", default="skilllab-donor/ci/lab")
    ap.add_argument("--output", default="v13-output/skill-lab-63-ab-catalog.json")
    args = ap.parse_args()
    generate(Path(args.catalog), Path(args.donor_lab), Path(args.output))
