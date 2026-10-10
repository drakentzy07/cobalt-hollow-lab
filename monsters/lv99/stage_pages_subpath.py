#!/usr/bin/env python3
"""P02H: immutable, V4-preserving WebGL monster playtest subpath candidate.
Operates only on current CI donor dist and a NEW local staging folder.
No GitHub Pages write, merge, main branch edits or proprietary assets.
Input: frozen donor native WebGL build (green P02G).
Output: monster-pages-candidate/cobalt-hollow-lab/monster-lab/ ready to add
to the existing Pages artifact as one isolated subtree.
"""
from __future__ import annotations

import hashlib
import json
import os
import shutil
from pathlib import Path

ORIGIN = Path("upstream/dist")
TARGET = Path("monster-pages-candidate/cobalt-hollow-lab/monster-lab")
REPORT = Path("monster-pages-candidate/monster-lab-manifest.json")
OLD = "/cobalt-hollow-lab/"
NEW = "/cobalt-hollow-lab/monster-lab/"
TEXT_EXTS = {".html", ".js", ".css", ".json", ".webmanifest", ".xml",
             ".mjs", ".svg", ".txt", ".map", ".webpmanifest"}


def sha(path: Path) -> str:
    hash_ = hashlib.sha256()
    with path.open("rb") as fd:
        for chunk in iter(lambda: fd.read(1024 * 1024), b""):
            hash_.update(chunk)
    return hash_.hexdigest()


def main() -> None:
    if not (ORIGIN / "index.html").is_file() or not (ORIGIN / "media").is_dir():
        raise SystemExit("HF_P02H_NATIVE_BUILD_NOT_PRESENT")
    if TARGET.exists() or REPORT.exists():
        raise SystemExit("HF_P02H_REFUSE_OVERWRITE_PREVIEW")
    original = {str(p.relative_to(ORIGIN)): sha(p)
                for p in ORIGIN.rglob("*") if p.is_file()}
    if len(original) < 30:
        raise SystemExit("HF_P02H_ORIGINAL_BUNDLE_INCOMPLETE")
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(ORIGIN, TARGET, symlinks=False)
    rewritten_files = 0
    replacements = 0
    for file in TARGET.rglob("*"):
        if not file.is_file() or file.suffix.lower() not in TEXT_EXTS:
            continue
        blob = file.read_bytes()
        try:
            src = blob.decode("utf-8")
        except UnicodeDecodeError:
            raise SystemExit(f"HF_P02H_INVALID_TEXT_FILE:{file}")
        count = src.count(OLD)
        if count:
            dst = src.replace(OLD, NEW)
            file.write_text(dst, encoding="utf-8")
            rewritten_files += 1
            replacements += count
    if rewritten_files < 2 or replacements < 3:
        raise SystemExit(f"HF_P02H_NO_MEANINGFUL_PREFIX_REWRITE:{rewritten_files}:{replacements}")
    index = (TARGET / "index.html").read_text(encoding="utf-8")
    if "<html" not in index.lower() or NEW not in index or OLD+"assets/" in index:
        raise SystemExit("HF_P02H_INDEX_PREFIX_NOT_RELOCATABLE")
    if not (TARGET / "media").is_dir() or not list((TARGET / "media").rglob("*.glb")):
        raise SystemExit("HF_P02H_NATIVE_MONSTERS_MEDIA_MISSING")
    # Original build is a reference artifact and MUST remain byte-for-byte.
    after = {str(p.relative_to(ORIGIN)): sha(p)
             for p in ORIGIN.rglob("*") if p.is_file()}
    if original != after:
        raise SystemExit("HF_P02H_CHANGED_ORIGINAL_PAGES_BUNDLE")
    manifest = {
        "product": "HIGHFLY Monstruos P02H isolated native WebGL",
        "path": "/cobalt-hollow-lab/monster-lab/",
        "built_from": "G GREEN SHA 27111e34923dd20d8f2f3f2825d4172161301bba",
        "deployment": "NONE — staging artifact only",
        "android": "S23 Ultra emulated; physical handset validation pending",
        "files": len(original),
        "bytes": sum(p.stat().st_size for p in TARGET.rglob("*") if p.is_file()),
        "rewritten_files": rewritten_files,
        "rewritten_references": replacements,
        "original_reference_sha256": hashlib.sha256(json.dumps(original, sort_keys=True).encode()).hexdigest(),
        "entry_sha256": sha(TARGET / "index.html"),
        "allowed_modes": ["normal", "elite", "captain"],
        "level_starts": [21, 30, 40, 50, 60, 70, 80, 90],
        "default_public_pages_untouched": True,
        "v4_02_untouched": True,
    }
    REPORT.write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print(json.dumps(manifest, ensure_ascii=False))
    print("HF_P02H_ISOLATED_MONSTER_PAGES_PACKAGE_GREEN=1")


if __name__ == "__main__":
    main()
