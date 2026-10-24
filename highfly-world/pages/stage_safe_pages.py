"""Preserve an exact published Pages archive or refuse a Genesis deployment.

Only previously published media and additive compiled JS/CSS are permitted;
there is deliberately NO auto-copy of donor icons, models, SFX or textures.
"""
from __future__ import annotations
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import sys
import tarfile
import urllib.request

if len(sys.argv) != 5:
    raise SystemExit("usage: stage_safe_pages.py old_artifact.tar build_dist site sha")

archive, build, dest, sha = map(str, sys.argv[1:])
root = Path(dest)
dist = Path(build)
tar_path = Path(archive)
if not tar_path.is_file() or not (dist / "index.html").is_file():
    raise SystemExit("GENESIS_NO_COMPLETE_BASELINE_OR_BUILD")
root.mkdir(parents=True, exist_ok=True)
with tarfile.open(tar_path, "r:") as t:
    total = 0
    for entry in t.getmembers():
        name = PurePosixPath(entry.name)
        if (
            name.is_absolute() or
            ".." in name.parts or
            entry.issym() or entry.islnk() or
            not (entry.isfile() or entry.isdir())
        ):
            raise SystemExit("GENESIS_UNSAFE_BASELINE_TAR")
        total += entry.size
        if total > 1_080_000_000:
            raise SystemExit("GENESIS_BASELINE_SITE_TOO_LARGE")
    t.extractall(root, filter="data")

protected = [
    "index.html",
    "play.html",
    "highfly-origin-f12-qa.json",
    "genesis/index.html",
    "candidate/unified-01/index.html",
    "lab/f27-combat-beta/index.html",
    "world0/index.html",
]

def digest(file: Path) -> str:
    h = hashlib.sha256()
    with file.open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()

before: dict[str,str] = {}
for p in protected:
    f = root / p
    if not f.is_file():
        raise SystemExit("GENESIS_PROTECTED_MISSING_" + p)
    before[p] = digest(f)

origin = "https://drakentzy07.github.io/cobalt-hollow-lab/"
for p in protected:
    url = origin + p + "?highfly_genesis_preflight=" + sha[:12]
    req = urllib.request.Request(
        url, headers={"Cache-Control": "no-cache", "User-Agent": "HIGHFLY-GENESIS-PRESERVE"}
    )
    with urllib.request.urlopen(req, timeout=50) as response:
        if response.status != 200:
            raise SystemExit("GENESIS_LIVE_ORIGINAL_HTTP_" + p)
        if hashlib.sha256(response.read()).hexdigest() != before[p]:
            raise SystemExit("GENESIS_LIVE_SITE_CHANGED_ABORT_" + p)

out = root / "highfly-world"
if out.exists():
    raise SystemExit("GENESIS_ROUTE_ALREADY_PRESENT_REQUIRE_SAFE_UPDATE")
out.mkdir()
html = (dist / "index.html").read_bytes()
if b"/cobalt-hollow-lab/assets/" not in html:
    raise SystemExit("GENESIS_VITE_BASE_NOT_MATCHED")
(out / "index.html").write_bytes(html)

new_js_css = 0
reused = 0
new_media = 0
missing = []
for f in dist.rglob("*"):
    if not f.is_file():
        continue
    rel = f.relative_to(dist)
    if str(rel) == "index.html":
        continue
    if rel.parts[0] == "assets" and f.suffix in {".js", ".css"}:
        target = root / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.exists():
            if digest(f) != digest(target):
                raise SystemExit("GENESIS_SHARED_ASSET_COLLISION_" + str(rel))
            reused += 1
        else:
            shutil.copy2(f, target)
            new_js_css += 1
        continue
    # A compile containing any donor media not already on the live site is
    # a licensing and completeness review blocker, never silently released.
    target = root / rel
    if not target.is_file():
        missing.append(str(rel))
        new_media += 1
    elif digest(f) != digest(target):
        raise SystemExit("GENESIS_SHARED_MEDIA_COLLISION_" + str(rel))

if missing:
    raise SystemExit("GENESIS_MISSING_MEDIA_LICENSE_OR_ROOT_SYNC_REVIEW_"
                     + str(new_media) + " examples=" + repr(missing[:15]))

report = {
    "edition": "HIGHFLY WORLD Genesis G2-01 - Impacto Astral",
    "sourceCommit": sha,
    "preserveRoot": True,
    "baseVersion": "ClaudeCraft v0.44.7",
    "playURL": origin + "highfly-world/?hfWorld=1",
    "limitations": [
        "Temporary warrior fixture internally",
        "Separate lab progression saves not implemented",
        "MOBA drag-to-aim/cancel still in development",
        "No real S23 manual verification",
    ],
    "newCompiledAssets": new_js_css,
    "reusedCompiledAssets": reused,
    "additionalDonorMedia": 0,
}
(out / "genesis-g2-qa.json").write_text(json.dumps(report, indent=2) + "\n")
for p, h in before.items():
    if digest(root / p) != h:
        raise SystemExit("GENESIS_ORIGINAL_ROOT_MODIFIED_" + p)

(root / ".nojekyll").touch()
size = sum(p.stat().st_size for p in root.rglob("*") if p.is_file())
if size >= 1_060_000_000:
    raise SystemExit("GENESIS_PAGES_SITE_QUOTA_" + str(size))
print("HIGHFLY_GENESIS_G2_ADDITIVE_SITE_STAGED=" + json.dumps({
    "bytes": size, "new_js_css": new_js_css, "protected_files": protected
}))
