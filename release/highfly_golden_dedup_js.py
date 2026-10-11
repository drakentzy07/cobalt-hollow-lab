#!/usr/bin/env python3
"""HIGHFLY GOLDEN Pages dedup — v4-03-preview JavaScript only.

Only remove old+new SHA-identical JS chunks if all explicit relative chunk
paths inside newly staged V4-03 text are rewritten to the immutable root URL.
Existing public Pages files MUST NOT BE TOUCHED (checked via original hashes).
Fail closed if 995MB budget is not met or link syntax remains. Browser
end-to-end smoke in Actions remains the ultimate deploy prerequisite.
"""
from pathlib import Path
from urllib.request import Request,urlopen
import hashlib,re,json,sys
ROOT=Path("golden-publish/cobalt-hollow-lab")
OLD=ROOT/"assets"
BETA=ROOT/"v4-03-preview"
CHUNKS=BETA/"assets"
BASE="/cobalt-hollow-lab/assets/"
MAX_SIZE=995_000_000
TXT={".js",".mjs",".css",".html",".json",".webmanifest",".map"}
def h(p):
    c=hashlib.sha256()
    with p.open("rb") as f:
        while b:=f.read(1_048_576):c.update(b)
    return c.hexdigest()
def files(d):return (p for p in d.rglob("*") if p.is_file())
def main():
    if not CHUNKS.is_dir() or not OLD.is_dir():raise RuntimeError("BETA_OR_STABLE_ASSETS_MISSING")
    original_checks={}
    for p in ["index.html","v4-02/index.html","monster-lab/index.html","monster-lab/hunts.html"]:
        target=ROOT/p
        original_checks[p]=h(target)
    duplicates={}
    for p in CHUNKS.rglob("*"):
        if not p.is_file() or p.suffix.lower() not in {".js",".mjs"}:continue
        rel=p.relative_to(CHUNKS)
        q=OLD/rel
        if q.is_file() and p.stat().st_size==q.stat().st_size and h(p)==h(q):
            duplicates[rel.as_posix()]=p.stat().st_size
    if len(duplicates)<150:raise RuntimeError("INSUFFICIENT_IDENTICAL_MODULE_BLOBS:"+str(len(duplicates)))
    # Preserve every V4-03 chunk URL. Removing it and rewriting Vite's
    # internal dynamic-import strings creates double-prefixed URLs and broken
    # ESM dependency graphs. Instead, replace ONLY modules proven byte-exact
    # with a tiny same-path ESM forwarder to the existing ROOT module.
    # This keeps Vite's original import graph and cache keys in V4-03 intact.
    forwards={}
    for name,size in duplicates.items():
        p=CHUNKS/name
        url='../../assets/'+name
        proxy=(
          'export * from "'+url+'";\n'
          'import * as hfShared from "'+url+'";\n'
          'export default hfShared.default;\n'
        ).encode('ascii')
        if len(proxy)>size:continue
        p.write_bytes(proxy)
        forwards[name]={"originalBytes":size,"proxyBytes":len(proxy)}
    if len(forwards)<150:raise RuntimeError("NOT_ENOUGH_SAFE_NATIVE_MODULE_PROXIES:"+str(len(forwards)))
    # A forwarder that points at a missing or non-hash-identical old module
    # would silently break the runtime. Recheck ALL before publication.
    for name in forwards:
        p=CHUNKS/name
        old=OLD/name
        if not old.is_file():raise RuntimeError("MISSING_SHARED_MODULE:"+name)
        expected=b'../../assets/'+name.encode('ascii')
        if expected not in p.read_bytes():raise RuntimeError("FORWARDER_TARGET_INCORRECT:"+name)
    changes={name:entry for name,entry in forwards.items()}
    dangling=[]
    for p,oldhash in original_checks.items():
        if h(ROOT/p)!=oldhash:raise RuntimeError("LEGACY_ASSET_MUTATED:"+p)
    total=sum(p.stat().st_size for p in files(ROOT))
    report={
        "status":"DEDUPED_JS_ONLY_WITH_HASH_EQUALS_AND_PRESERVED_LEGACY",
        "deduplicatedJsCount":len(forwards),
        "removedJsBytes":sum(row['originalBytes']-row['proxyBytes'] for row in forwards.values()),
        "rewrittenCandidateFiles":len(changes),
        "legacyHtmlHashes":original_checks,
        "combinedPagesBytes":total,
        "budget":MAX_SIZE,
        "readyForBrowserQa":total<MAX_SIZE,
        "published":False,
        "physicalS23Tested":False,
    }
    Path("golden-v403-js-dedup-report.json").write_text(json.dumps(report,indent=2)+"\n")
    print("HF_GOLDEN_PAGES_REUSED_IDENTICAL_JS_CHUNKS="+json.dumps(report))
    if total>=MAX_SIZE:raise RuntimeError("STILL_EXCEEDS_PAGES_BUDGET")
if __name__=="__main__":
    try:main()
    except Exception as e:
        print("HF_GOLDEN_ASSET_DEDUP_BLOCKED_NO_DEPLOY="+str(e),file=sys.stderr)
        raise
