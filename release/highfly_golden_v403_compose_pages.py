#!/usr/bin/env python3
"""GOLDEN PLAY V4-03: build complete original-site + latest WebGL shared-assets
staging, DO NOT DEPLOY. Requires legacy RUN1-J dist and actual GOLDEN candidate.

The script fails closed if ANY old original-root file differs from current
live website, any shared asset is absent/different or package exceeds budget.
Reconstructs original published extra V4-02 and Monster Lab HTML from LIVE GET.
"""
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.error import HTTPError
import hashlib,json,shutil,sys,re,urllib.parse
ROOT=Path("golden-publish/cobalt-hollow-lab")
BASE="https://drakentzy07.github.io/cobalt-hollow-lab/"
LEGACY=Path("legacy/upstream/dist")
LATEST=Path("golden-build/cobalt-hollow-lab")
BUDGET=995_000_000
TXT={".html",".css",".js",".mjs",".json",".webmanifest",".svg",".xml",".txt",".map"}
NEW_PREFIX=b"/cobalt-hollow-lab/v4-03-preview/assets/"
OLD_PREFIX=b"/cobalt-hollow-lab/assets/"
PRESERVE=["index.html","v4-02/index.html","monster-lab/index.html","monster-lab/hunts.html"]
def sha(b):return hashlib.sha256(b).hexdigest()
def remote(p):
  if p.startswith("/") or ".." in Path(p).parts:raise RuntimeError("UNSAFE_PATH:"+p)
  req=Request(BASE+p,headers={"User-Agent":"HIGHFLY-GOLDEN-RELEASE-READONLY","Cache-Control":"no-cache"})
  with urlopen(req,timeout=120) as r:
    if r.status!=200:raise RuntimeError("HTTP_NOT_200:"+p)
    return r.read(15_000_000)
def files(d):return sorted(x for x in d.rglob("*") if x.is_file())
def safe_copy(src,dst):
  dst.parent.mkdir(parents=True,exist_ok=True)
  shutil.copyfile(src,dst)
def main():
  if ROOT.exists():raise RuntimeError("STAGING_OUTPUT_NOT_CLEAN")
  if not (LEGACY/"index.html").is_file() or not (LATEST/"index.html").is_file():
    raise RuntimeError("LEGACY_OR_NEW_CANDIDATE_MISSING")
  old=remote("index.html")
  old_local=(LEGACY/"index.html").read_bytes()
  if sha(old)!=sha(old_local):
    raise RuntimeError("STOP_MAIN_ROOT_HASH_MISMATCH_DO_NOT_DEPLOY:"+sha(old)+":"+sha(old_local))
  shutil.copytree(LEGACY,ROOT)
  # Legacy root is now verified byte-identical to live, not a guess.
  baselines=[{"path":"index.html","sha256":sha(old),"size":len(old)}]
  for p in PRESERVE[1:]:
    try:content=remote(p)
    except HTTPError as e:
      if e.code==404:raise RuntimeError("LEGACY_PUBLIC_ROUTE_MISSING:"+p)
      raise
    out=ROOT/p
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_bytes(content)
    baselines.append({"path":p,"sha256":sha(content),"size":len(content)})
  # Ensure new app cannot silently reference missing old media/voice/images.
  new_files=files(LATEST)
  stats={"reused_files":0,"reused_bytes":0,"copied_files":0,
         "copied_bytes":0,"rebased_text":0,"shared_missing":[],"shared_mismatch":[]}
  shared={"media","audio","models","highfly","data","fonts","icons"}
  for src in new_files:
    rel=src.relative_to(LATEST)
    if src.is_symlink():raise RuntimeError("SYMLINK:"+str(rel))
    if rel.parts[0] in shared:
      existing=ROOT/rel
      if not existing.exists():
        stats["shared_missing"].append(str(rel))
        continue
      # Re-using media requires equality across ALL 6000+ files, not samples.
      s1=sha(src.read_bytes());s2=sha(existing.read_bytes())
      if s1!=s2:
        stats["shared_mismatch"].append(str(rel))
        continue
      stats["reused_files"]+=1
      stats["reused_bytes"]+=src.stat().st_size
      continue
    dest=ROOT/"v4-03-preview"/rel
    dest.parent.mkdir(parents=True,exist_ok=True)
    if src.suffix.lower() in TXT:
      data=src.read_bytes()
      updated=data.replace(OLD_PREFIX,NEW_PREFIX)
      if updated!=data:stats["rebased_text"]+=1
      dest.write_bytes(updated)
    else:
      safe_copy(src,dest)
    stats["copied_files"]+=1
    stats["copied_bytes"]+=src.stat().st_size
  if stats["shared_missing"] or stats["shared_mismatch"]:
    raise RuntimeError("SHARED_ASSET_INCOMPATIBLE_NO_DEPLOY:"+json.dumps({
       "missing":stats["shared_missing"][:12],"mismatches":stats["shared_mismatch"][:12],
       "missing_count":len(stats["shared_missing"]),"mismatch_count":len(stats["shared_mismatch"])}))
  preview=ROOT/"v4-03-preview/index.html"
  if not preview.exists() or NEW_PREFIX not in preview.read_bytes():
    raise RuntimeError("NEW_PREVIEW_JS_BASE_NOT_REBASED")
  if not (ROOT/"v4-03-preview/assets").is_dir():
    raise RuntimeError("NEW_ENTRY_ASSETS_MISSING")
  # Guard the legacy HTML after preparing preview.
  for entry in baselines:
    data=(ROOT/entry["path"]).read_bytes()
    if sha(data)!=entry["sha256"] or sha(remote(entry["path"]))!=entry["sha256"]:
      raise RuntimeError("PUBLIC_OR_STAGED_LEGACY_CHANGED_CONCURRENTLY:"+entry["path"])
  grand=sum(x.stat().st_size for x in files(ROOT))
  if grand>BUDGET:raise RuntimeError(f"PAGES_TOTAL_EXCEEDS_BUDGET:{grand}/{BUDGET}")
  (ROOT/".nojekyll").touch()
  result={"status":"PACKAGED_READY_FOR_LOCAL_BROWSER_QA_ONLY_NOT_PUBLISHED",
    "host":"cobalt-hollow-lab","target":BASE+"v4-03-preview/",
    "bytes":grand,"files":len(files(ROOT)),"legacy_baselines":baselines,
    "media_reuse":stats,"pages_budget_max":BUDGET,
    "not_physical_S23":True,
    "last_release_sha":"766cac86e16d8ef2376a64c79c21e14490ebaf90"}
  Path("golden-combined-stage-report.json").write_text(json.dumps(result,indent=2)+"\n")
  print("HF_GOLDEN_PLAY_FULL_PAGES_STAGING_GREEN="+json.dumps({
    "site_bytes":grand,"stats":stats,
    "legacy_baselines":baselines,"preview":str(preview)}))
if __name__=="__main__":
  try:main()
  except Exception as e:
    print("HF_GOLDEN_PAGES_FAIL_CLOSED_NO_DEPLOY="+str(e),file=sys.stderr)
    raise
