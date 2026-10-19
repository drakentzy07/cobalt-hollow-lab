#!/usr/bin/env python3
"""FOUNDATION-00: read-only, reproducible inventory of the materialized CLEAN source.

Do not import experimental R39/R40 overlays, do not alter assets, and do not deploy.
This is an evidence generator; a successful inventory does not certify gameplay.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

FROZEN_SHA = "9b57e49c9676d75962700f828cc00a50a9a988b5"
EXPECTED_PATCH_SHA256 = "b78ba81e52b10b2ddba7c6fa829d436f59ad4594ec2a0d0d5f0341ce26773cb9"

EDITOR_CANDIDATES = (
    "src/ui/character_appearance.ts",
    "src/render/characters/preview_appearance.ts",
    "src/ui/charselect_redesign.ts",
    "src/ui/charselect_composed_refresh.ts",
    "src/render/characters/visual.ts",
    "src/render/characters/assets.ts",
)
PRIMARY_CANDIDATES = (
    "src/main.ts",
    "src/sim/sim.ts",
    "src/sim/player_motion.ts",
    "src/sim/content/classes.ts",
    "src/sim/character_state.ts",
    "src/highfly/training/stat_authority.ts",
    "src/highfly/training/core.ts",
    "src/highfly/game_c1_runtime.ts",
)
SCHOOLS = ("warrior", "paladin", "hunter", "rogue", "priest", "shaman", "mage", "warlock", "druid")


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as reader:
        for block in iter(lambda: reader.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def files_below(root: Path) -> list[Path]:
    return sorted(p for p in root.rglob("*") if p.is_file() and not p.is_symlink())


def entry(root: Path, relative: str) -> dict:
    file = root / relative
    return {
        "path": relative,
        "exists": file.is_file(),
        "bytes": file.stat().st_size if file.is_file() else None,
        "sha256": sha256(file) if file.is_file() else None,
    }


def run_git(root: Path, *args: str) -> str:
    return subprocess.check_output(["git", "-C", str(root), *args], text=True).strip()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--upstream", default="upstream")
    parser.add_argument("--patch", default="clean/canonical/HIGHFLY_CLEAN_V1.patch")
    parser.add_argument("--output", default="foundation-output/foundation-00-inventory.json")
    args = parser.parse_args()
    upstream, patch, out = Path(args.upstream), Path(args.patch), Path(args.output)

    if run_git(upstream, "rev-parse", "HEAD") != FROZEN_SHA:
        raise SystemExit("FOUNDATION_WRONG_DONOR_SHA")
    if not patch.is_file() or sha256(patch) != EXPECTED_PATCH_SHA256:
        raise SystemExit("FOUNDATION_WRONG_CLEAN_PATCH_SHA")

    src = upstream / "src"
    if not src.is_dir():
        raise SystemExit("FOUNDATION_SOURCE_NOT_MATERIALIZED")
    sources = files_below(src)
    if len(sources) < 1000:
        raise SystemExit(f"FOUNDATION_SOURCE_INCOMPLETE count={len(sources)}")
    primary = [entry(upstream, p) for p in PRIMARY_CANDIDATES]
    missing = [x["path"] for x in primary if not x["exists"]]
    if missing:
        raise SystemExit("FOUNDATION_CORE_PATHS_MISSING: " + ",".join(missing))
    editor = [entry(upstream, p) for p in EDITOR_CANDIDATES]
    present_editor = sum(item["exists"] for item in editor)
    if present_editor < 4:
        raise SystemExit(f"FOUNDATION_CHARACTER_EDITOR_PATHS_MISSING: {present_editor}")

    native_book = (upstream / "src/sim/content/classes.ts").read_text(encoding="utf-8").lower()
    school_names_present = {school: school in native_book for school in SCHOOLS}
    if not all(school_names_present.values()):
        raise SystemExit("FOUNDATION_NINE_SCHOOLS_NOT_LOCATED_IN_NATIVE_BOOK")

    tracked_changes = run_git(upstream, "diff", "--name-only", "HEAD").splitlines()
    report = {
        "status": "SOURCE_INVENTORY_ONLY_NOT_GAMEPLAY_CERTIFICATION",
        "generated_utc": datetime.now(timezone.utc).isoformat(),
        "donor_sha": FROZEN_SHA,
        "clean_patch_sha256": EXPECTED_PATCH_SHA256,
        "source_files_count": len(sources),
        "source_size_bytes": sum(p.stat().st_size for p in sources),
        "clean_modified_tracked_files": len(tracked_changes),
        "editor": {
            "reuse_recommended": True,
            "reuse_is_proven": False,
            "original_class_selector_must_be_decoupled": True,
            "native_files": editor,
        },
        "native_schools_detected": school_names_present,
        "critical_source_files": primary,
        "legacy_R39_R40_overlays_applied": False,
        "live_pages_modified": False,
        "next_gate": "TypeScript, focused native/Training tests, WebGL build and actual character creator manual QA",
    }
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"FOUNDATION_00_INVENTORY_GREEN=1 src_files={len(sources)} editor_files={present_editor}")
    print(f"FOUNDATION_00_NATIVE_SCHOOLS={','.join(SCHOOLS)}")
    print(f"FOUNDATION_00_REPORT={out}")


if __name__ == "__main__":
    main()
