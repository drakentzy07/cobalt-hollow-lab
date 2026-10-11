#!/usr/bin/env python3
"""GOLDEN V4-03 JS fallback alias, limited to verified preview path bugs.
 * Never edits old public assets, only add files at nonexistent immutable
 * chunk hashes that the new V4-03 build requests. Cannot exceed 995 MB.
 * Browser smoke remains required after this small finite alias patch.
"""
from pathlib import Path
import hashlib,shutil,json,sys
ROOT=Path("golden-publish/cobalt-hollow-lab")
BETA=ROOT/"v4-03-preview"
LIMIT=995_000_000
NESTED=["wallet-C0Oh2GLT.js","preload-helper-DOposavd.js",
 "wallets-D8iEriUh.js","client_origin-BEvweq4b.js",
 "events-DLRyCEVK.js","connect-BLrw6oHj.js","esm-DhvlA6gG.js",
 "rolldown-runtime-BG2f4sTM.js","battleground_field-DE7diG_2.js"]
ROOTED=["gfx-mT2h8GOO.js","data-BIX9VrY9.js","ignivar_frontal_telegraph-BVzCosXx.js",
 "rift_death_zone-BNKc7cY3.js","letters-BexK5Dhq.js","loader-VZ4pxzXa.js",
 "sfx-S9fL8oIj.js"]
CURSORS=["gauntlet.png","arrow.png"]
def h(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def source(name):
    options=[BETA/"assets"/name,ROOT/"assets"/name]
    for p in options:
        if p.is_file():return p
    raise RuntimeError("V403_ALIAS_SOURCE_MISSING:"+name)
def copy_safe(from_path,to_path):
    if to_path.is_file():
        if h(from_path)!=h(to_path):raise RuntimeError("PUBLIC_ROOT_COLLISION:"+str(to_path))
        return False
    to_path.parent.mkdir(parents=True,exist_ok=True)
    shutil.copyfile(from_path,to_path)
    return True
def main():
    changes=[]
    for n in NESTED:
        dest=ROOT/"cobalt-hollow-lab/assets"/n
        src=source(n)
        if copy_safe(src,dest):changes.append([str(dest.relative_to(ROOT)),dest.stat().st_size])
    for n in ROOTED:
        dest=ROOT/"assets"/n
        src=source(n)
        if copy_safe(src,dest):changes.append([str(dest.relative_to(ROOT)),dest.stat().st_size])
    for n in CURSORS:
        src=ROOT/"ui/cursors"/n
        if not src.is_file():raise RuntimeError("PUBLIC_OLD_CURSOR_MISSING:"+n)
        dest=BETA/"ui/cursors"/n
        if copy_safe(src,dest):changes.append([str(dest.relative_to(ROOT)),dest.stat().st_size])
    total=sum(p.stat().st_size for p in ROOT.rglob("*") if p.is_file())
    report={"state":"SAFE_V403_JS_ALIAS_FROM_EXISTING_HASHED_FILES_NOT_A_DEPLOY",
      "count":len(changes),"newBytes":sum(a[1] for a in changes),
      "totalBytes":total,"maxBytes":LIMIT,"aliases":changes,
      "originalIndexUntouched":True,
      "browserVerificationRequired":True}
    Path("golden-v403-final-chunk-route-qa.json").write_text(json.dumps(report,indent=2)+"\n")
    print("HF_GOLDEN_NEW_BETA_ALIASES_STAGED="+json.dumps(report))
    if total>=LIMIT:raise RuntimeError("CHUNK_ALIAS_OVER_PAGES_SITE_SIZE_LIMIT")
if __name__=="__main__":
    try:main()
    except Exception as e:print("HF_GOLDEN_ALIAS_FAIL_CLOSED="+str(e),file=sys.stderr);raise
