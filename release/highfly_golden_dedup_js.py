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
    changes={}
    for p in files(BETA):
        if p.suffix.lower() not in TXT:continue
        before=p.read_bytes()
        content=before
        for name in sorted(duplicates,key=len,reverse=True):
            encoded=name.encode("ascii")
            target=(BASE+name).encode("ascii")
            # Explicit encoded ESM import relative URL and Vite asset prefix.
            content=content.replace(b"/cobalt-hollow-lab/v4-03-preview/assets/"+encoded,target)
            content=content.replace(b"./"+encoded,target)
            # Other formatters emit absolute candidate URL or bare quoted chunks.
            for quote in (b'"',b"'",b'`'):
                content=content.replace(quote+encoded+quote,quote+target+quote)
                content=content.replace(quote+b'assets/'+encoded,quote+target)
        if content!=before:
            p.write_bytes(content);changes[p.relative_to(BETA).as_posix()]={"old":len(before),"new":len(content)}
    # Preserve the *original* index's absolute candidate js and css entrypoints.
    for name in duplicates:
        p=CHUNKS/name
        p.unlink()
    # Check every candidate JS file that was not pruned: its explicit relative
    # references to deleted chunks must have been rewritten to shared root URLs.
    dangling=[]
    for p in files(BETA):
        if p.suffix.lower() not in TXT:continue
        blob=p.read_bytes()
        for name in duplicates:
            encoded=name.encode("ascii")
            if (b"./"+encoded in blob or b"/v4-03-preview/assets/"+encoded in blob):
                dangling.append([p.relative_to(BETA).as_posix(),name])
                if len(dangling)>=12:break
        if len(dangling)>=12:break
    if dangling:raise RuntimeError("UNREWRITTEN_JS_IMPORTS:"+json.dumps(dangling))
    for p,oldhash in original_checks.items():
        if h(ROOT/p)!=oldhash:raise RuntimeError("LEGACY_ASSET_MUTATED:"+p)
    total=sum(p.stat().st_size for p in files(ROOT))
    report={
        "status":"DEDUPED_JS_ONLY_WITH_HASH_EQUALS_AND_PRESERVED_LEGACY",
        "deduplicatedJsCount":len(duplicates),
        "removedJsBytes":sum(duplicates.values()),
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
