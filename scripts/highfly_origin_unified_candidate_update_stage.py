#!/usr/bin/env python3
"""Safely refresh ONLY the UNIFIED 01 disposable candidate in an exact certified Pages archive."""
import hashlib, json, re, shutil, sys, tarfile, urllib.request
from pathlib import Path, PurePosixPath

if len(sys.argv) != 5:
    raise SystemExit("usage: stage.py baseline/artifact.tar dist site source_sha")
archive, source, target, sha = sys.argv[1:]
source, site = Path(source), Path(target)
if not re.fullmatch(r"[a-f0-9]{40}", sha):
    raise SystemExit("UNIFIED_RECOVERY_BAD_SHA")
if site.exists() or not (source / "index.html").is_file() or not (source / "assets").is_dir():
    raise SystemExit("UNIFIED_RECOVERY_INPUT_INVALID")
site.mkdir(parents=True)
with tarfile.open(archive,"r:") as tar:
    for m in tar.getmembers():
        p=PurePosixPath(m.name)
        if p.is_absolute() or ".." in p.parts or m.issym() or m.islnk() or not (m.isfile() or m.isdir()):
            raise SystemExit("UNIFIED_RECOVERY_UNSAFE_ARCHIVE")
    tar.extractall(site,filter="data")

def digest(p):
    h=hashlib.sha256()
    with p.open("rb") as f:
        for part in iter(lambda:f.read(1024*1024),b""):h.update(part)
    return h.hexdigest()

expected={
    "highfly-origin-f12-qa.json":"7518c22c11ff5ddffe09bb7792f8d67bb9e82038",
    "candidate/unified-01/unified-candidate-qa.json":"c65159f11e91c88255d10b36b2fe1507f67b9047",
}
for rel,source_sha in expected.items():
    file=site/rel
    if not file.is_file() or json.loads(file.read_text()).get("sourceCommit")!=source_sha:
        raise SystemExit("UNIFIED_RECOVERY_WRONG_BASELINE_"+rel)

# Stop publication if anything at the public root or previous candidate drifted.
live="https://drakentzy07.github.io/cobalt-hollow-lab/"
for rel in ["index.html","highfly-origin-f12-qa.json",
            "lab/f27-combat-beta/index.html","lab/f27-combat-beta/f27-beta-qa.json",
            "candidate/unified-01/index.html","candidate/unified-01/unified-candidate-qa.json"]:
    req=urllib.request.Request(live+rel+"?unified_recovery="+sha[:12],
        headers={"Cache-Control":"no-cache","User-Agent":"HIGHFLY-UNIFIED-RECOVERY"})
    with urllib.request.urlopen(req,timeout=50) as resp:
        if resp.status!=200 or hashlib.sha256(resp.read()).hexdigest()!=digest(site/rel):
            raise SystemExit("UNIFIED_RECOVERY_LIVE_DRIFT_"+rel)

old={str(p.relative_to(site)):digest(p) for p in site.rglob("*") if p.is_file()}
candidate=Path("candidate/unified-01")
dst=site/candidate
allowed={str(candidate/p) for p in [
    "index.html","highfly-origin.webmanifest","unified-candidate-qa.json",
    "highfly-origin-icon-192.png","highfly-origin-icon-512.png"]}
for p in allowed:
    if p not in old:raise SystemExit("UNIFIED_RECOVERY_MISSING_PRIOR_CANDIDATE_"+p)

skip={"index.html","highfly-origin-sw.js","highfly-origin.webmanifest",
      "highfly-origin-appshell.json",".nojekyll"}
added=0
for src in sorted(source.rglob("*")):
    if not src.is_file():continue
    rel=src.relative_to(source)
    if rel.parts[0]==".vite" or rel.suffix==".html" or rel.name in skip or rel.name.endswith("-qa.json"):
        continue
    output=site/rel
    if output.exists():
        if not output.is_file() or digest(src)!=digest(output):
            raise SystemExit("UNIFIED_RECOVERY_ASSET_COLLISION_"+str(rel))
        continue
    output.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(src,output)
    added+=1

html=(source/"index.html").read_text()
refs=re.findall(r"""(?:src|href)=["'](/cobalt-hollow-lab/assets/[^"']+)""",html)
if not refs or any(not (site/url.removeprefix("/cobalt-hollow-lab/")).is_file() for url in refs):
    raise SystemExit("UNIFIED_RECOVERY_INVALID_VITE_REFS")
manifest=json.loads((source/"highfly-origin.webmanifest").read_text())
manifest.update({"name":"HIGHFLY UNIFIED 01 — Recovery Cazador Universal",
    "short_name":"HIGHFLY Test","id":"/cobalt-hollow-lab/candidate/unified-01/",
    "start_url":"/cobalt-hollow-lab/candidate/unified-01/",
    "scope":"/cobalt-hollow-lab/candidate/unified-01/"})
(dst/"highfly-origin.webmanifest").write_text(json.dumps(manifest,indent=2)+"\n")
for png in ["highfly-origin-icon-192.png","highfly-origin-icon-512.png"]:
    shutil.copy2(source/png,dst/png)
html=html.replace("/cobalt-hollow-lab/highfly-origin.webmanifest",
                  "/cobalt-hollow-lab/candidate/unified-01/highfly-origin.webmanifest")
html=html.replace('<meta name="robots" content="index, follow, max-image-preview:large" />',
                  '<meta name="robots" content="noindex, nofollow" />')
html=html.replace("<title>HIGHFLY —","<title>HIGHFLY UNIFIED 01 RECOVERY —")
(dst/"index.html").write_text(html)
(dst/"unified-candidate-qa.json").write_text(json.dumps({
    "edition":"HIGHFLY UNIFIED 01 Recovery — LV1 Universal Hunter + paid cross-school skills",
    "sourceCommit":sha,"noRootChange":True,"physicalS23":"PENDING USER TEST",
    "saves":"isolated candidate-world and candidate-lab; existing namespaces kept",
    "url":live+str(candidate)+"/","addedAssets":added},indent=2)+"\n")
(site/".nojekyll").touch()
for name,value in old.items():
    if name not in allowed and digest(site/name)!=value:
        raise SystemExit("UNIFIED_RECOVERY_MUTATED_EXISTING_FILE_"+name)
if any(p.is_symlink() for p in site.rglob("*")):
    raise SystemExit("UNIFIED_RECOVERY_SYMLINK_FOUND")
size=sum(p.stat().st_size for p in site.rglob("*") if p.is_file())
if size>=1_055_000_000:raise SystemExit("UNIFIED_RECOVERY_PAGES_SIZE_LIMIT_"+str(size))
print("UNIFIED_RECOVERY_CANDIDATE_STAGED_NO_ROOT_CHANGES_GREEN=1",
      json.dumps({"bytes":size,"priorFilesProtected":len(old)-len(allowed),
                  "assetsAdded":added,"url":live+str(candidate)+"/"}),flush=True)
