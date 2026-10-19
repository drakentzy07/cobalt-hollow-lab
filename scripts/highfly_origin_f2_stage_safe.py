#!/usr/bin/env python3
"""Add-only HIGHFLY F2 beta lab onto immutable certified F1 Pages baseline.

No root mutation. Fail closed on changed live F1, file collisions, oversize, or
unexpected symlinks. The candidate is an Android-validated standalone WebGL build.
"""
import hashlib
import json
import re
import shutil
import sys
import tarfile
import urllib.request
from pathlib import Path, PurePosixPath

if len(sys.argv) != 5:
    raise SystemExit("usage: stage.py artifact.tar candidate_dist output_site candidate_sha")
archive, candpath, outpath, source_sha = sys.argv[1:]
candidate = Path(candpath)
site = Path(outpath)
site.mkdir(parents=True, exist_ok=True)
if not (candidate / "index.html").is_file() or not (candidate / "assets").is_dir():
    raise SystemExit("F2_BETA_BAD_CANDIDATE")
with tarfile.open(archive, "r:") as tar:
    for member in tar.getmembers():
        pp = PurePosixPath(member.name)
        if (pp.is_absolute() or ".." in pp.parts or member.issym() or
                member.islnk() or not (member.isfile() or member.isdir())):
            raise SystemExit("F2_BETA_UNSAFE_BASELINE_TAR")
    tar.extractall(site, filter="data")
lab = site / "lab/f2-combat-beta"
if lab.exists():
    raise SystemExit("F2_BETA_ALREADY_EXISTS_STOP")
expected = "7518c22c11ff5ddffe09bb7792f8d67bb9e82038"
qa = json.loads((site / "highfly-origin-f12-qa.json").read_text())
if qa.get("sourceCommit") != expected or qa.get("cleanFoundation") is not True:
    raise SystemExit("F2_BETA_F1_BASE_NOT_CERTIFIED")

protected = ["index.html", "highfly-origin-f12-qa.json",
             "highfly-origin-sw.js", "highfly-origin.webmanifest",
             "highfly-origin-appshell.json"]
def sha(path):
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for b in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(b)
    return h.hexdigest()
hashes = {}
for rel in protected:
    p = site / rel
    if not p.is_file():
        raise SystemExit("F2_BETA_MISSING_PROTECTED_" + rel)
    hashes[rel] = sha(p)
root_url = "https://drakentzy07.github.io/cobalt-hollow-lab/"
for rel, digest in hashes.items():
    req = urllib.request.Request(root_url + rel + "?f2betacheck=" + source_sha[:12],
        headers={"Cache-Control": "no-cache", "User-Agent": "HIGHFLY-F2-BETA-SAFE"})
    with urllib.request.urlopen(req, timeout=65) as response:
        live = response.read()
    if hashlib.sha256(live).hexdigest() != digest:
        raise SystemExit("F2_BETA_LIVE_F1_CHANGED_" + rel)
print("HIGHFLY_F2_BETA_F1_ROOT_LIVE_MATCH_GREEN=1", flush=True)

# Merge only content-addressed assets and immutable media: never copy candidate
# index, main SW, origin app shell or site metadata across to F1.
skip = {"index.html", "highfly-origin-sw.js", "highfly-origin.webmanifest",
        "highfly-origin-appshell.json", ".nojekyll"}
added, same = 0, 0
for src in sorted(candidate.rglob("*")):
    if not src.is_file():
        continue
    rel = src.relative_to(candidate)
    # The Vite manifest is build metadata, NOT a runtime resource. The certified
    # F1 baseline owns its own .vite/manifest.json; copying F2's manifest would
    # change a protected original file for no user-visible benefit.
    if rel.parts[0] == ".vite":
        continue
    if rel.name in skip or rel.suffix == ".html" or rel.name.endswith("-qa.json"):
        continue
    dst = site / rel
    if dst.exists():
        if not dst.is_file() or src.stat().st_size != dst.stat().st_size or sha(src) != sha(dst):
            raise SystemExit("F2_BETA_ASSET_COLLISION_" + str(rel))
        same += 1
    else:
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        added += 1

lab.mkdir(parents=True)
html = (candidate / "index.html").read_text()
asset_refs = re.findall(r"""(?:src|href)=["'](/cobalt-hollow-lab/assets/[^"']+)""", html)
if not asset_refs:
    raise SystemExit("F2_BETA_NO_COMPILED_ASSETS")
for ref in asset_refs:
    rel = ref.removeprefix("/cobalt-hollow-lab/")
    if not (site / rel).is_file():
        raise SystemExit("F2_BETA_MISSING_ENTRY_ASSET_" + rel)
if "highfly-origin.webmanifest" not in html:
    raise SystemExit("F2_BETA_WRONG_HTML")
# App icon preload is path-relative; duplicate only these tiny PNGs at lab path.
for name in ["highfly-origin-icon-192.png", "highfly-origin-icon-512.png"]:
    src = candidate / name
    if not src.is_file():
        raise SystemExit("F2_BETA_MISSING_ICON_" + name)
    shutil.copy2(src, lab / name)
# Distinct PWA metadata (not an offline installation promise).
manifest = json.loads((candidate / "highfly-origin.webmanifest").read_text())
manifest.update({
    "name": "HIGHFLY F2 Combat Beta (online test)",
    "short_name": "HF F2 Beta",
    "id": "/cobalt-hollow-lab/lab/f2-combat-beta/",
    "start_url": "/cobalt-hollow-lab/lab/f2-combat-beta/",
    "scope": "/cobalt-hollow-lab/lab/f2-combat-beta/"
})
(lab / "highfly-origin.webmanifest").write_text(json.dumps(manifest, indent=2) + "\n")
# No indexing or canonical confusion with the public game.
html = html.replace('<meta name="robots" content="index, follow, max-image-preview:large" />',
                    '<meta name="robots" content="noindex, nofollow" />')
html = html.replace("<title>HIGHFLY —", "<title>HIGHFLY F2 BETA —")
(lab / "index.html").write_text(html)
(lab / "f2-beta-qa.json").write_text(json.dumps({
    "edition": "HIGHFLY ORIGIN F2 Combat Freedom 360 Android test",
    "sourceCommit": source_sha,
    "parentF1Source": expected,
    "offline": "NOT SUPPORTED BY THIS LAB",
    "saves": "isolated localStorage and IndexedDB; use Chrome Incognito to keep SW cache isolated",
    "physicalS23": "PENDING PLAYER TEST",
    "url": root_url + "lab/f2-combat-beta/",
    "newFiles": added,
    "reusedAssets": same
}, indent=2) + "\n")
(site / ".nojekyll").touch()
for rel,digest in hashes.items():
    if sha(site / rel) != digest:
        raise SystemExit("F2_BETA_PROTECTED_F1_MUTATED_" + rel)
if any(p.is_symlink() for p in site.rglob("*")):
    raise SystemExit("F2_BETA_SYMLINK")
files = [p for p in site.rglob("*") if p.is_file()]
total = sum(p.stat().st_size for p in files)
if total >= 995_000_000:
    raise SystemExit("F2_BETA_PAGES_TOO_LARGE_" + str(total))
print("HIGHFLY_F2_BETA_SAFE_STAGE_GREEN=1 " + json.dumps({
    "bytes":total, "files":len(files), "added":added,"reused":same,
    "rootFilesProtected":len(hashes), "beta":root_url + "lab/f2-combat-beta/"
}), flush=True)
