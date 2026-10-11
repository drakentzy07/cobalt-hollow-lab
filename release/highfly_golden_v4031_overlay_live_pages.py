#!/usr/bin/env python3
"""GOLDEN V4-03.1: replace ONLY V4-03-preview bundle in byte-certified
existing PAGES site.  NEVER alter current root, V4-02, Monster Lab or
other paths; NEVER deploy from this script. Exactly one original Sim/Hunter.

Inputs: old certified GitHub Pages site in ./published-old/
new already-tested V4-03.1 WebGL dist in ./candidate/cobalt-hollow-lab/
Output: ./golden-publish/cobalt-hollow-lab (for Chrome smoke+budget gate).
"""
from pathlib import Path
from urllib.request import Request,urlopen
import hashlib,json,shutil,sys
OLD=Path("published-old")
NEW=Path("candidate/cobalt-hollow-lab") if Path("candidate/cobalt-hollow-lab/index.html").is_file() else Path("candidate")
OUT=Path("golden-publish/cobalt-hollow-lab")
PREFIX=b"/cobalt-hollow-lab/assets/"
REBASE=b"/cobalt-hollow-lab/v4-03-preview/assets/"
LIVE="https://drakentzy07.github.io/cobalt-hollow-lab/"
BUDGET=995_000_000
SHARED={"media","audio","models","highfly","data","fonts","icons"}
TEXT={".html",".css",".js",".mjs",".map",".json",".webmanifest",".svg",".txt",".xml"}
PROTECTED=["index.html","v4-02/index.html","monster-lab/index.html","monster-lab/hunts.html"]
def sha(p):
  h=hashlib.sha256()
  with p.open("rb") as f:
    while b:=f.read(1048576):h.update(b)
  return h.hexdigest()
def walk(p):return sorted(x for x in p.rglob("*") if x.is_file())
def read_live(rel):
  req=Request(LIVE+rel,headers={"Cache-Control":"no-cache","User-Agent":"HIGHFLY-V4031-RELEASE-VERIFY"})
  with urlopen(req,timeout=60) as r:
    if r.status!=200:raise RuntimeError("NON_200_PUBLIC_BASELINE:"+rel)
    return r.read(15_000_000)
def main():
  if OUT.exists():raise RuntimeError("OUTPUT_DIR_ALREADY_EXISTS")
  if not (OLD/"v4-03-preview/index.html").is_file() or not (NEW/"index.html").is_file():
    raise RuntimeError("PUBLISHED_OR_CANDIDATE_SITE_MISSING")
  baselines={}
  for rel in PROTECTED:
    old=OLD/rel
    if not old.is_file():raise RuntimeError("MISSING_OLD_PROTECTED_PAGE:"+rel)
    live=read_live(rel)
    if hashlib.sha256(live).hexdigest()!=sha(old):
      raise RuntimeError("LIVE_PAGES_CHANGED_STOP_DEPLOY:"+rel)
    baselines[rel]=sha(old)
  shutil.copytree(OLD,OUT)
  preview=OUT/"v4-03-preview"
  if not preview.is_dir():raise RuntimeError("NO_OLD_PREVIEW_TO_VERSION_UP")
  shutil.rmtree(preview)
  reused=0;added=0;created=0;shared_bytes=0;differences=[]
  for src in walk(NEW):
    if src.is_symlink():raise RuntimeError("NEW_SYMLINK_UNSAFE")
    rel=src.relative_to(NEW)
    if rel.parts[0] in SHARED:
      original=OUT/rel
      if original.is_file() and sha(original)==sha(src):
        reused+=1;shared_bytes+=src.stat().st_size;continue
      if original.exists():differences.append(str(rel));continue
      original.parent.mkdir(parents=True,exist_ok=True)
      shutil.copyfile(src,original)
      added+=src.stat().st_size;created+=1
      continue
    destination=preview/rel
    destination.parent.mkdir(parents=True,exist_ok=True)
    if src.suffix.lower() in TEXT:
      content=src.read_bytes()
      rewritten=content.replace(PREFIX,REBASE)
      destination.write_bytes(rewritten)
    else:shutil.copyfile(src,destination)
  if differences:raise RuntimeError("DIFFERENT_SHARED_ASSETS_REQUIRE_REVIEW:"+",".join(differences[:10]))
  index=(preview/"index.html").read_bytes()
  if REBASE not in index or PREFIX in index:raise RuntimeError("V4031_PREVIEW_INDEX_UNREBASABLE")
  for rel,hash0 in baselines.items():
    if sha(OUT/rel)!=hash0 or hashlib.sha256(read_live(rel)).hexdigest()!=hash0:
      raise RuntimeError("PROTECTED_PAGES_CHANGED_DURING_BUILD:"+rel)
  total=sum(f.stat().st_size for f in walk(OUT))
  report={"phase":"STAGE_ONLY_NO_DEPLOY",
    "oldLivePreserved":baselines,"oldPreviewIntentionallyReplaced":True,
    "candidate":"GOLDEN_V403_1_P13_NATIVE","url":LIVE+"v4-03-preview/",
    "newCommonAssets":created,"newSharedBytes":added,"dedupAlreadySharedCount":reused,
    "dedupAlreadySharedBytes":shared_bytes,
    "bytesBeforeJsCompression":total,
    "maxBytes":BUDGET,"needsJsDedup":total>=BUDGET,
    "saveNamespace":"highfly-play","published":False}
  Path("golden-v4031-full-site-stage.json").write_text(json.dumps(report,indent=2)+"\n")
  print("HF_GOLDEN_V4031_LIVE_PAGES_BYTE_PRESERVED_AND_NEW_BUNDLE_STAGED="+json.dumps(report))
if __name__=="__main__":
  try:main()
  except Exception as e:
    print("HF_GOLDEN_V4031_ABSOLUTE_NO_DEPLOY="+str(e),file=sys.stderr)
    raise
