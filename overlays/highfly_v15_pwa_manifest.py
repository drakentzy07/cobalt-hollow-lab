#!/usr/bin/env python3
"""HF15-PWA01 — fix GitHub Pages installation routes in the assembled WebGL PWA.

Run AFTER rewrite_pages_static.py and BEFORE audit_pages_public_roots.py.
This changes dist/ only, never the frozen ClaudeCraft donor or existing public Pages.

Original donor manifest starts at "/" with scope "/", which opens the account's
GitHub Pages root rather than the /cobalt-hollow-lab/ project site when installed.
Preserve the existing PWA "id" if present; identity migration requires separate QA.
"""
import json
import os
from pathlib import Path

ROOT = Path("dist")
MANIFEST = ROOT / "manifest.webmanifest"
BASE = os.environ.get("VITE_COBALT_BASE", "/cobalt-hollow-lab/")


def normalize_base(raw: str) -> str:
    project_segment = raw.strip("/")
    if not project_segment:
        raise ValueError("HF15_PWA_BASE_EMPTY: refusing origin-wide PWA scope")
    base = "/" + project_segment + "/"
    if "?" in base or "#" in base or "\\" in base:
        raise ValueError("HF15_PWA_BASE_INVALID: expected a project path")
    return base


def repair_manifest(path: Path, base: str) -> bool:
    project = normalize_base(base)
    if not path.is_file():
        raise FileNotFoundError(f"HF15_PWA_MANIFEST_MISSING: {path}")
    original = path.read_text(encoding="utf-8")
    manifest = json.loads(original)
    if not isinstance(manifest, dict):
        raise ValueError("HF15_PWA_NOT_AN_OBJECT")
    if manifest.get("display") != "fullscreen" or manifest.get("orientation") != "landscape":
        raise ValueError("HF15_PWA_DISPLAY_ORIENTATION_DRIFT")
    # Explicit fail-closed gate: never overwrite an unrelated custom app entry.
    for field in ("start_url", "scope"):
        found = manifest.get(field)
        if found not in ("/", project):
            raise ValueError(f"HF15_PWA_UNEXPECTED_{field.upper()}: {found!r}")
    manifest["start_url"] = project
    manifest["scope"] = project
    if original == (rendered := json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"):
        return False
    path.write_text(rendered, encoding="utf-8")
    return True


if __name__ == "__main__":
    changed = repair_manifest(MANIFEST, BASE)
    print("HF15_PWA_MANIFEST_GREEN=1")
    print(f"HF15_PWA_SCOPE={normalize_base(BASE)}")
    print(f"HF15_PWA_CHANGED={int(changed)}")
