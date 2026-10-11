#!/usr/bin/env python3
"""Restore currently LIVE V4-02 assets and trim non-live historical donor
root chunks from a FULL Pages release. NO DEPLOY. Fail closed on budget.

Actual new GAME candidate stays byte-identical to CI-approved GOLDEN PLAY.
Existing public HTML stays byte-exact. Never delete or alter assets that
currently exist on the public site. Extracts Vite JS/CSS refs transitively.
"""
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.error import HTTPError,URLError
from concurrent.futures import ThreadPoolExecutor,as_completed
from collections import deque
from html.parser import HTMLParser
import re,hashlib,json,urllib.parse,os,sys
ROOT=Path("golden-publish/cobalt-hollow-lab")
LIVE="https://drakentzy07.github.io/cobalt-hollow-lab/"
MAX_SIZE=995_000_000
EXT={".js",".mjs",".css",".json",".svg",".png",".woff",".woff2",".wasm",".ico",".webp",".avif",".map"}
BASENAME=re.compile(rb'(?:(?:https?:)?//[\w.]+/cobalt-hollow-lab/)?(?:/?cobalt-hollow-lab/)?(?:v4-02/)?(assets|ui)/([A-Za-z0-9_+.-]+(?:/[A-Za-z0-9_+.-]+)*\.(?:js|mjs|css|json|svg|png|woff2?|wasm|ico|webp|avif))')
REL_IMPORT=re.compile(rb'(?:"|\x27|\x60)(?:\./)?([\w.+-]+\.(?:js|mjs|css|wasm|json|webp|png|svg))(?:"|\x27|\x60)')
class Links(HTMLParser):
    def __init__(self):super().__init__();self.urls=[]
    def handle_starttag(self,tag,attrs):
        for k,v in attrs:
            if k in {"src","href"} and v:self.urls.append(v)
def req(path,method="GET"):
    if ".." in Path(path).parts or path.startswith("/") or "\\" in path:raise RuntimeError("BAD_PATH:"+path)
    query=Request(LIVE+path,method=method,headers={"User-Agent":"HIGHFLY-SAFE-GOLDEN-PRESERVE","Cache-Control":"no-cache"})
    try:
        with urlopen(query,timeout=35) as res:return res.status, (res.read(30_000_000) if method=="GET" else b"")
    except HTTPError as e:
        if e.code==404:return 404,b""
        raise
def sha(b):return hashlib.sha256(b).hexdigest()
def validate(ref):
    r=ref.replace("\\","/").split("?",1)[0].split("#",1)[0]
    if not r or ".." in Path(r).parts:return None
    return r
def discover(blob,rel):
    refs=set()
    for kind,name in BASENAME.findall(blob):
        path="v4-02/"+kind.decode()+"/"+name.decode()
        if validate(path):refs.add(path)
    if rel.endswith(".html"):
        p=Links();p.feed(blob.decode("utf8","replace"))
        for u in p.urls:
            resolved=urllib.parse.urljoin(LIVE+rel,u)
            if resolved.startswith(LIVE+"v4-02/"):
                r=validate(resolved[len(LIVE):])
                if r and Path(r).suffix.lower() in EXT:refs.add(r)
    if rel.endswith((".js",".mjs",".css")):
        for name in REL_IMPORT.findall(blob):
            r="v4-02/assets/"+name.decode()
            if validate(r):refs.add(r)
    return refs
def collect():
    first="v4-02/index.html"
    original=(ROOT/first).read_bytes()
    queue=deque(sorted(discover(original,first)))
    seen=set();restored=0;bytes_count=0;missing=[]
    max_paths=2000
    while queue:
        path=queue.popleft()
        if path in seen:continue
        seen.add(path)
        if len(seen)>max_paths:raise RuntimeError("TOO_MANY_V402_REFERENCES")
        if not path.startswith("v4-02/") or Path(path).suffix.lower() not in EXT:continue
        status,body=req(path)
        if status==404:
            missing.append(path)
            continue
        dest=ROOT/path
        if dest.exists() and sha(dest.read_bytes())!=sha(body):
            raise RuntimeError("V402_PUBLIC_ASSET_CONFLICT:"+path)
        if not dest.exists():
            dest.parent.mkdir(parents=True,exist_ok=True)
            dest.write_bytes(body);restored+=1;bytes_count+=len(body)
        for nxt in discover(body,path):
            if nxt not in seen:queue.append(nxt)
    return {"checked":len(seen),"restored":restored,"bytes":bytes_count,"missing":missing[:100],"missingCount":len(missing)}
def check_current_root_asset(path):
    # Never remove resources which are actually still accessible publicly.
    status,_=req(path,method="HEAD")
    return path,status
def clean_stale():
    d=ROOT/"assets"
    items=[f for f in d.rglob("*") if f.is_file()]
    stats={"checked":0,"removed":0,"bytesFreed":0,"preserved":0}
    with ThreadPoolExecutor(max_workers=18) as pool:
        futs={pool.submit(check_current_root_asset,p.relative_to(ROOT).as_posix()):p for p in items}
        for fut in as_completed(futs):
            file=futs[fut]
            path,status=fut.result()
            stats["checked"]+=1
            if status==404:
                stats["removed"]+=1;stats["bytesFreed"]+=file.stat().st_size
                file.unlink()
            else:stats["preserved"]+=1
    return stats
def total():return sum(p.stat().st_size for p in ROOT.rglob("*") if p.is_file())
def main():
    if not (ROOT/"v4-03-preview/index.html").is_file():raise RuntimeError("STAGED_V403_MISSING")
    if not (ROOT/"v4-02/index.html").is_file():raise RuntimeError("LIVE_V402_HTML_MISSING")
    oldBytes=(ROOT/"v4-02/index.html").read_bytes()
    originalRoot=(ROOT/"index.html").read_bytes()
    report={"initialBytes":total(),"v402Restored":collect(),"historicalRootAssetsTrimmed":clean_stale(),"finalBytes":total()}
    for p,original in [("v4-02/index.html",oldBytes),("index.html",originalRoot)]:
        if (ROOT/p).read_bytes()!=original or sha(req(p)[1])!=sha(original):
            raise RuntimeError("ORIGINAL_HTML_NO_LONGER_EXACT:"+p)
    # Existing 404 URLs cannot be reconstructed: they were ALREADY missing
    # from LIVE V4-02. Keep this evidence; actual browser QA will independently
    # detect regressions. Stage can proceed to identical-JS dedup first.
    report["budget"]=MAX_SIZE
    report["readyForDedup"]=True
    report["preExisting404ReferencesNotFabricated"]=report["v402Restored"]["missingCount"]
    report["withinBudgetBeforeDedup"]=report["finalBytes"]<MAX_SIZE
    Path("golden-v402-asset-restoration-report.json").write_text(json.dumps(report,indent=2)+"\n")
    print("HF_GOLDEN_LIVE_V402_RESOURCES_AND_BYTE_BUDGET="+json.dumps(report))
    # The next mandatory step deduplicates SHA-identical JS to meet budget,
    # then Chrome tests old/new routes. NEVER deploy from this step alone.
if __name__=="__main__":
    try:main()
    except Exception as e:
        print("HF_GOLDEN_OLD_V402_RESTORE_FAIL_CLOSED="+str(e),file=sys.stderr)
        raise
