#!/usr/bin/env python3
"""Safe additive GitHub Pages R24 beta stage. Original site bytes never overwritten.

Inputs: baseline/artifact.tar from pinned last successful complete Pages deploy;
supreme-preview/cobalt-hollow-lab from fully green R24 live WebGL job.
No upload/deploy occurs in this script: hard-gate before upload-pages-artifact.
"""
import hashlib,json,re,shutil,tarfile,urllib.request
from pathlib import Path,PurePosixPath

SITE=Path('site')
CAND=Path('supreme-preview/cobalt-hollow-lab')
ARCH=Path('baseline/artifact.tar')
LAB='lab/origin-r24-p0'
RUN=39042695463
COMMIT='69bbe2ade371cb52f5b9723b9364a078cd764848'
ROOT='https://drakentzy07.github.io/cobalt-hollow-lab/'
PROTECTED=(
    'index.html','play.html','manifest.webmanifest',
    'lab/v15-2/index.html','lab/origin-r28/index.html',
    'lab/origin-r29/index.html','lab/origin-r31/index.html',
    'lab/origin-r32/index.html','lab/origin-r32/highfly-origin-r32-qa.json',
)

def digest(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''): h.update(b)
    return h.hexdigest()

def live(rel):
    req=urllib.request.Request(ROOT+rel,headers={
        'Cache-Control':'no-cache','User-Agent':'HIGHFLY-R24-PRESERVE'})
    with urllib.request.urlopen(req,timeout=90) as res:
        if res.status!=200: raise RuntimeError('LIVE_NOT_200_'+rel)
        return res.read()

def hdr_equivalent(previous,new):
    """Only accept mathematically identical RGBE pixels for old/new HDR RLE."""
    marker=re.compile(rb'(?m)^-Y ([0-9]+) \+X ([0-9]+)\r?\n')
    def unpack(p):
        raw=p.read_bytes()
        m=marker.search(raw)
        if m is None: return None
        height,width=map(int,m.groups())
        if not 8<=width<=32767 or not 1<=height<=16384:return None
        tail=memoryview(raw)[m.end():]
        if len(tail)==width*height*4:return raw[:m.end()],bytes(tail)
        out=bytearray();offset=0
        for _ in range(height):
            if bytes(tail[offset:offset+4]) != bytes((2,2,width>>8,width&255)):return None
            offset+=4;channels=[]
            for _ch in range(4):
                result=bytearray()
                while len(result)<width:
                    if offset>=len(tail):return None
                    n=tail[offset];offset+=1
                    if n==0:return None
                    if n>128:
                        if offset>=len(tail):return None
                        result.extend(bytes([tail[offset]])*(n-128));offset+=1
                    else:
                        result.extend(tail[offset:offset+n]);offset+=n
                    if len(result)>width:return None
                channels.append(result)
            row=bytearray(width*4)
            for ch,part in enumerate(channels):row[ch::4]=part
            out.extend(row)
        return raw[:m.end()],bytes(out) if offset==len(tail) else None
    return unpack(previous)==unpack(new) and unpack(previous) is not None

if not ARCH.is_file() or not (CAND/'index.html').is_file() or not (CAND/'assets').is_dir() or not (CAND/'media').is_dir():
    raise SystemExit('R24_BASELINE_OR_COMPLETE_CANDIDATE_MISSING')
if SITE.exists():raise SystemExit('R24_SITE_DIRECTORY_MUST_BE_NEW')
SITE.mkdir()
with tarfile.open(ARCH,'r:') as tar:
    for item in tar.getmembers():
        p=PurePosixPath(item.name)
        if p.is_absolute() or '..' in p.parts or item.issym() or item.islnk() or not (item.isfile() or item.isdir()):
            raise SystemExit('R24_UNSAFE_BASELINE_TAR')
    tar.extractall(SITE,filter='data')

if (SITE/LAB).exists():raise SystemExit('R24_LAB_ALREADY_EXISTS_REFUSE_TO_REPLACE')
for p in PROTECTED:
    if not (SITE/p).is_file():raise SystemExit('R24_PROTECTED_MISSING_'+p)
keep={p:digest(SITE/p) for p in PROTECTED}
for p in ('index.html','play.html','lab/origin-r32/index.html'):
    if hashlib.sha256(live(p+'?hf_r24_guard=1')).hexdigest()!=keep[p]:
        raise SystemExit('R24_LIVE_PUBLIC_DIFFERS_FROM_PINNED_BASELINE_'+p)

same=0;copied=0;equivalent_hdr=0
collisions=[];added=[]
# Preserve every public file. Only import truly new hashed assets and media.
for source in sorted(p for p in CAND.rglob('*') if p.is_file()):
    rel=source.relative_to(CAND)
    name=rel.as_posix()
    if rel.suffix=='.html' or name in {
        '.nojekyll','manifest.webmanifest','sw.js','service-worker.js','highfly-supreme-qa.json'
    } or name.endswith('-qa.json'):
        continue
    dest=SITE/rel
    if dest.exists():
        if dest.is_file() and source.stat().st_size==dest.stat().st_size and digest(source)==digest(dest):
            same+=1
        elif rel.parts[:2]==('media','env') and rel.suffix=='.hdr' and hdr_equivalent(dest,source):
            equivalent_hdr+=1
        else:
            collisions.append(name)
    else:
        dest.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(source,dest)
        copied+=1
        added.append((name,source.stat().st_size))
if collisions:
    print('R24_RESOURCE_COLLISIONS='+json.dumps(collisions[:50]))
    raise SystemExit('R24_RESOURCE_COLLISION_NO_PUBLICATION')

lab=SITE/LAB
lab.mkdir(parents=True)
html=(CAND/'index.html').read_text(encoding='utf-8')
if '/cobalt-hollow-lab/assets/' not in html:raise SystemExit('R24_BAD_VITE_BASE')
html=html.replace('/cobalt-hollow-lab/manifest.webmanifest',
                  '/cobalt-hollow-lab/'+LAB+'/manifest.webmanifest')
(lab/'index.html').write_text(html,encoding='utf-8')
manifest=CAND/'manifest.webmanifest'
if not manifest.is_file():raise SystemExit('R24_MANIFEST_MISSING')
data=json.loads(manifest.read_text(encoding='utf-8'))
data.update({
    'id':'/cobalt-hollow-lab/'+LAB+'/',
    'scope':'/cobalt-hollow-lab/'+LAB+'/',
    'start_url':'/cobalt-hollow-lab/'+LAB+'/?hf_r24=1',
})
(lab/'manifest.webmanifest').write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
refs=re.findall(r"""(?:src|href)=["'](/cobalt-hollow-lab/assets/[^"']+)""",html)
if not refs:raise SystemExit('R24_NO_COMPILED_ASSETS')
for uri in refs:
    target=SITE/uri.removeprefix('/cobalt-hollow-lab/')
    if not target.is_file():raise SystemExit('R24_NEW_ASSET_MISSING_'+uri)
if not any(b'hf-r24-desktop' in (SITE/uri.removeprefix('/cobalt-hollow-lab/')).read_bytes()
    for uri in refs if uri.endswith('.js')):
    raise SystemExit('R24_RUNTIME_SIGNATURE_NOT_IN_DEPLOY_BUNDLE')
qa={
    'edition':'HIGHFLY R24 opt-in single Hunter M/F + same 4 native BASE buttons PC & S23',
    'sourceRun':RUN,'sourceCommit':COMMIT,'pcKeyboard':'WASD A/D strafe',
    'pcMouseCamera':'native mouse camera','androidMovement':'R23 GOLDEN',
    'r24PreviewQuery':'hf_r24=1','visibleBaseSlots':4,
    'trueSinglePersistentHunter':'pending future migration',
    'physicalS23Test':'PENDING USER',
    'baseR23GreenRun':38839051624,
    'p1HunterGreenRun':39040153079,
    'preservedSiteHashes':keep,
    'labPath':'/cobalt-hollow-lab/'+LAB+'/',
}
(lab/'highfly-origin-r24-qa.json').write_text(json.dumps(qa,indent=2,ensure_ascii=False)+'\n')
(SITE/'.nojekyll').touch()
for name,sha in keep.items():
    if digest(SITE/name)!=sha:raise SystemExit('R24_PROTECTED_CONTENT_CHANGED_'+name)
if any(p.is_symlink() for p in SITE.rglob('*')):raise SystemExit('R24_SYMLINK_NOT_ALLOWED')
files=[p for p in SITE.rglob('*') if p.is_file()]
total=sum(p.stat().st_size for p in files)
print('R24_SAFE_SITE_METRICS='+json.dumps({
    'totalBytes':total,'files':len(files),'same':same,'added':copied,
    'hdrEquivalent':equivalent_hdr,'largestNew':sorted(added,key=lambda z:-z[1])[:12]
}))
if total>=995000000 or total<700000000 or len(files)<6000:
    raise SystemExit('R24_PAGES_SITE_SIZE_GATE')
print('HIGHFLY_R24_SAFE_ADDITIVE_PAGES_STAGE_GREEN=1')
