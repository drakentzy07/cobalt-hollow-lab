#!/usr/bin/env python3
"""HIGHFLY MONSTER-LAB Pages compositor. Fail closed.

Inputs MUST be GitHub-approved immutable Action artifacts:
  - approved-live-pages/        actual Pages artifact unpacked to site root
  - monster-approved/cobalt-hollow-lab/monster-lab/ H WebGL artifact
Output: composed-pages/           byte-identical root and V4-02, added lab

Never changes any existing byte; reuses deduplicated immutable hashed media.
If a media hash conflicts, live root/V4 is not overwritten. Publishes only after
real headless Chrome testing and explicit downstream Pages job gate.
"""
import hashlib
import json
import os
import shutil
from pathlib import Path

LIVE = Path("approved-live-pages")
CANDIDATE = Path("monster-approved/cobalt-hollow-lab/monster-lab")
STAGED = Path("composed-pages")
ROOT_MEDIA = "/cobalt-hollow-lab/media/"
LAB_MEDIA = "/cobalt-hollow-lab/monster-lab/media/"
TEXT_EXTS = {".html", ".js", ".css", ".json", ".webmanifest",
             ".xml", ".svg", ".mjs", ".map", ".txt"}
MAX_UNCOMPRESSED = 1900 * 1024 * 1024


def sha(file: Path) -> str:
    h = hashlib.sha256()
    with file.open("rb") as fd:
        for data in iter(lambda: fd.read(1024 * 1024), b""):
            h.update(data)
    return h.hexdigest()


def catalogue(path: Path):
    return {p.relative_to(path).as_posix(): sha(p) for p in path.rglob("*") if p.is_file()}


def main():
    if STAGED.exists():
        raise SystemExit("HF_MONSTER_PAGES_REFUSE_OVERWRITE_EXISTING_STAGING")
    if not (LIVE / "index.html").is_file() or not (LIVE / "v4-02/index.html").is_file():
        raise SystemExit("HF_MONSTER_PAGES_MISSING_APPROVED_ROOT_V4")
    if not (CANDIDATE / "index.html").is_file() or not (CANDIDATE / "media").is_dir():
        raise SystemExit("HF_MONSTER_PAGES_MISSING_APPROVED_MONSTER_ARTIFACT")
    manifest = Path("monster-approved/monster-lab-manifest.json")
    if not manifest.is_file():
        raise SystemExit("HF_MONSTER_PAGES_MISSING_SOURCE_MANIFEST")
    m = json.loads(manifest.read_text())
    if m.get("path") != "/cobalt-hollow-lab/monster-lab/" or not m.get("default_public_pages_untouched"):
        raise SystemExit("HF_MONSTER_PAGES_MANIFEST_NOT_CERTIFIED")
    approved = catalogue(LIVE)
    if "monster-lab/index.html" in approved:
        raise SystemExit("HF_MONSTER_PAGES_ALREADY_LIVE_OR_CONFLICT")
    shutil.copytree(LIVE, STAGED)
    target = STAGED / "monster-lab"
    target.mkdir()
    reused = 0
    new_media = 0
    # Text and ordinary static assets go under the isolated path. Content-addressed
    # GLB+textures go to a SHARED root media location only if no byte collision.
    for p in CANDIDATE.rglob("*"):
        if not p.is_file():
            continue
        rel = p.relative_to(CANDIDATE)
        if rel.parts[0] == "media":
            out = STAGED / rel
            if out.exists():
                if sha(out) != sha(p):
                    raise SystemExit(f"HF_MONSTER_PAGES_MEDIA_HASH_COLLISION:{rel}")
                reused += 1
            else:
                out.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(p, out)
                new_media += 1
            continue
        out = target / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        if p.suffix.lower() in TEXT_EXTS:
            src = p.read_text(encoding="utf-8")
            # H has already relocated all app boot paths into /monster-lab.
            if LAB_MEDIA in src:
                src = src.replace(LAB_MEDIA, ROOT_MEDIA)
            out.write_text(src, encoding="utf-8")
        else:
            shutil.copy2(p, out)
    if reused < 20:
        raise SystemExit(f"HF_MONSTER_PAGES_NOT_REUSING_IMMUTABLE_MEDIA:{reused}")
    if not (target / "index.html").is_file():
        raise SystemExit("HF_MONSTER_PAGES_NO_WEBGL_INDEX")
    live_after = {p: sha(STAGED / p) for p in approved}
    if approved != live_after:
        diff = [x for x, h in approved.items() if live_after.get(x) != h]
        raise SystemExit("HF_MONSTER_PAGES_PUBLIC_OR_V4_BYTE_DRIFT:"+repr(diff[:5]))
    if LAB_MEDIA in (target/"index.html").read_text(encoding="utf-8"):
        raise SystemExit("HF_MONSTER_PAGES_BAD_SHARED_MEDIA_REFERENCES")
    total = sum(p.stat().st_size for p in STAGED.rglob("*") if p.is_file())
    if total > MAX_UNCOMPRESSED:
        raise SystemExit(f"HF_MONSTER_PAGES_EXCEEDS_PRELIMINARY_BUDGET:{total}")
    report = {
        "existing_public_and_v4_files_untouched": len(approved),
        "baseline_sha256": hashlib.sha256(json.dumps(approved,sort_keys=True).encode()).hexdigest(),
        "new_media_files": new_media,
        "reused_media_files": reused,
        "full_uncompressed_bytes": total,
        "preview_url_path": "/cobalt-hollow-lab/monster-lab/",
        "source_preview_sha256": m.get("entry_sha256"),
        "deployment": "NO - downstream gated publish needed",
    }
    Path("monsters-pages-composition-report.json").write_text(
        json.dumps(report, indent=2)+"\n",encoding="utf-8")
    print(json.dumps(report))
    print("HF_MONSTER_LAB_PRESERVE_EXISTING_ROOT_V4_SHA256_GREEN=1")


if __name__ == "__main__":
    main()
