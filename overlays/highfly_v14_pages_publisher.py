#!/usr/bin/env python3
"""HIGHFLY V14 protected GitHub Pages sidecar. NO build, NO production mutation.
Requires the immutable V9.1, SF28, V13 and V14 build artifacts. It byte-compares
already published public/SF28/V13 before introducing the V14 lab only.
"""
import hashlib, json, os, re, shutil, sys, time, urllib.error, urllib.request
from pathlib import Path

BASE='https://drakentzy07.github.io/cobalt-hollow-lab/'
SRC={
 'home':Path('current-public/cobalt-hollow-lab'),
 'sf28':Path('current-sf28/cobalt-hollow-lab'),
 'v13':Path('current-v13/cobalt-hollow-lab'),
 'v14':Path('new-v14/cobalt-hollow-lab'),
}
V14_RUN=int(os.environ['V14_RUN_ID'])
V14_SHA=os.environ['V14_HEAD_SHA']
TOKEN=os.environ.get('GH_TOKEN','')
STAGE=Path('sidecar-site')

def sha(value:bytes)->str:return hashlib.sha256(value).hexdigest()
def sha_file(path:Path)->str:
 h=hashlib.sha256()
 with path.open('rb') as stream:
  for chunk in iter(lambda:stream.read(4*1024*1024),b''):h.update(chunk)
 return h.hexdigest()
def get(url:str)->bytes:
 req=urllib.request.Request(url,headers={
  'User-Agent':'HIGHFLY-V14-PROTECTED-PUBLISHER',
  'Cache-Control':'no-cache','Pragma':'no-cache'})
 with urllib.request.urlopen(req,timeout=60) as response:
  if response.status!=200:raise ValueError('HTTP not OK '+url)
  return response.read()
def live(rel:str)->bytes:
 return get(BASE+rel+('?v14_guard=1' if '?' not in rel else '&v14_guard=1'))
def green_source():
 url=f'https://api.github.com/repos/drakentzy07/cobalt-hollow-lab/actions/runs/{V14_RUN}'
 headers={'Accept':'application/vnd.github+json','User-Agent':'HIGHFLY-V14-QA-GATE'}
 if TOKEN:headers['Authorization']='Bearer '+TOKEN
 with urllib.request.urlopen(urllib.request.Request(url,headers=headers),timeout=50) as r:
  run=json.load(r)
 if run.get('status')!='completed' or run.get('conclusion')!='success':
  raise SystemExit('V14_NO_RELEASE_BUILD_NOT_GREEN')
 if run.get('head_sha')!=V14_SHA or run.get('head_branch')!='highfly-v14-original-skills-supreme':
  raise SystemExit('V14_NO_RELEASE_WRONG_SOURCE_COMMIT')
 print('V14_DEPLOY_SOURCE_GREEN_RUN='+str(V14_RUN)+' SHA='+V14_SHA)

def validate_source():
 for k,root in SRC.items():
  if not (root/'index.html').is_file() or not (root/'assets').is_dir() or not (root/'media').is_dir():
   raise SystemExit('V14_MISSING_COMPLETE_WEBGL_SOURCE:'+k)
 if json.loads((SRC['v14']/'highfly-v14-qa.json').read_text())['originalSkills']!=90:
  raise SystemExit('V14_CANDIDATE_90_ORIGINALS_QA_ABSENT')
 if STAGE.exists():raise SystemExit('V14_STAGING_ALREADY_PRESENT')

def guarded_existing():
 original=SRC['home']/'index.html'
 current=live('index.html')
 if sha(current)!=sha_file(original):raise SystemExit('V14_ABORT_LIVE_HOME_DIFFERS_FROM_PINNED_SOURCE')
 protected={}
 for lab,run in [('sf28',38543442226),('v13',38606172532)]:
  candidate=SRC[lab]/'index.html'
  body=live('lab/'+lab+'/index.html')
  if sha(body)!=sha_file(candidate):
   raise SystemExit('V14_ABORT_ALREADY_LIVE_'+lab.upper()+'_HTML_DIFFERS_FROM_PINNED_SOURCE')
  metadata=live('lab/'+lab+'/highfly-'+lab+'-qa.json')
  if json.loads(metadata).get('sourceRun')!=run:
   raise SystemExit('V14_ABORT_LIVE_'+lab.upper()+'_SOURCE_RUN_CHANGED')
  protected[lab]={'indexSha256':sha(body),'qaSha256':sha(metadata),'qaBytes':metadata}
 try:
  previous=live('lab/v14/highfly-v14-qa.json')
  if previous:raise SystemExit('V14_ABORT_LAB_PATH_ALREADY_EXISTS')
 except urllib.error.HTTPError as e:
  if e.code!=404:raise
 print('V14_PRESERVE_BEFORE_SHA='+json.dumps({
  'home':sha(current),'sf28':protected['sf28']['indexSha256'],
  'v13':protected['v13']['indexSha256']}))
 return sha(current),protected

def copy_shared_assets():
 STAGE.mkdir()
 shutil.copytree(SRC['home'],STAGE,dirs_exist_ok=True)
 (STAGE/'.nojekyll').touch()
 new_counts={}
 for key in ('sf28','v13','v14'):
  added=0
  root=SRC[key]
  for path in sorted(p for p in root.rglob('*') if p.is_file()):
   if path.is_symlink():raise SystemExit('V14_NO_SYMLINKS:'+key)
   rel=path.relative_to(root)
   if rel.parts[0].startswith('lab') or rel.suffix=='.html' or rel.name=='.nojekyll' or rel.name.endswith('-qa.json'):
    continue
   dst=STAGE/rel
   if dst.exists():
    if path.stat().st_size!=dst.stat().st_size or sha_file(path)!=sha_file(dst):
     raise SystemExit('V14_SHARED_ASSET_COLLISION:'+str(rel))
   else:
    dst.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(path,dst);added+=1
  new_counts[key]=added
 return new_counts

def copy_html_and_validate(lab:str):
 source=SRC[lab]
 directory=STAGE/'lab'/lab
 if directory.exists():raise SystemExit('V14_EXISTING_STAGED_LAB:'+lab)
 directory.mkdir(parents=True)
 for page in source.glob('*.html'):shutil.copy2(page,directory/page.name)
 if not (directory/'index.html').is_file():raise SystemExit('V14_NO_LAB_INDEX:'+lab)
 html=(directory/'index.html').read_text(encoding='utf-8')
 matches=re.findall(r"""(?:src|href)=["'](/cobalt-hollow-lab/assets/[^"']+)""",html)
 if not matches:raise SystemExit('V14_NO_COMPILED_ASSETS_REFERENCED:'+lab)
 for ref in matches:
  target=STAGE/ref.removeprefix('/cobalt-hollow-lab/')
  if not target.is_file():raise SystemExit('V14_BROKEN_COMPILED_ASSET:'+lab+' '+str(ref))
 return len(matches)

def stage():
 green_source();validate_source()
 home_sha,protected=guarded_existing()
 copied=copy_shared_assets()
 assetrefs={lab:copy_html_and_validate(lab) for lab in ('sf28','v13','v14')}
 for lab in ('sf28','v13'):
  (STAGE/'lab'/lab/('highfly-'+lab+'-qa.json')).write_bytes(protected[lab]['qaBytes'])
 # Recheck EVERY byte of the public pinned original and the 2 prior lab entries.
 for p in SRC['home'].rglob('*'):
  if p.is_file():
   rel=p.relative_to(SRC['home'])
   dst=STAGE/rel
   if not dst.is_file() or p.stat().st_size!=dst.stat().st_size or sha_file(p)!=sha_file(dst):
    raise SystemExit('V14_ORIGINAL_PUBLIC_ASSET_MODIFIED:'+str(rel))
 if sha_file(STAGE/'index.html')!=home_sha:raise SystemExit('V14_PUBLIC_HOME_MUTATED')
 for lab in ('sf28','v13'):
  if sha_file(STAGE/'lab'/lab/'index.html')!=protected[lab]['indexSha256']:
   raise SystemExit('V14_PREVIOUS_LAB_HTML_MUTATED:'+lab)
  if sha_file(STAGE/'lab'/lab/('highfly-'+lab+'-qa.json'))!=protected[lab]['qaSha256']:
   raise SystemExit('V14_PREVIOUS_LAB_QA_MUTATED:'+lab)
 report={
  'edition':'HIGHFLY V14 ORIGINAL SKILLS SUPREME',
  'sourceRun':V14_RUN,'sourceCommit':V14_SHA,
  'sourceBranch':'highfly-v14-original-skills-supreme',
  'classCount':9,'nativeOriginalAbilities':90,
  'separatePath':'/cobalt-hollow-lab/lab/v14/',
  'entryQuery':'?hf-v14=1&hf-v14-class=warrior',
  'fusionsUsed':False,'normalAttackSuppressed':False,
  'preservedHomeSHA256':home_sha,
  'preservedSf28IndexSHA256':protected['sf28']['indexSha256'],
  'preservedSf28QaSHA256':protected['sf28']['qaSha256'],
  'preservedV13IndexSHA256':protected['v13']['indexSha256'],
  'preservedV13QaSHA256':protected['v13']['qaSha256'],
  'productionSaveMigration':False,'publicMainUntouched':True,
  'sf28Untouched':True,'v13Untouched':True,
  's23PhysicalTested':False,'visualReview':'pending owner QA',
  'assetRefs':assetrefs,'addedAssets':copied,
 }
 (STAGE/'lab/v14/highfly-v14-qa.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
 files=[p for p in STAGE.rglob('*') if p.is_file()]
 if len(files)<6000:raise SystemExit('V14_TOO_FEW_STATIC_FILES')
 if any(p.is_symlink() for p in STAGE.rglob('*')):raise SystemExit('V14_SYMLINK_BLOCKED')
 size=sum(p.stat().st_size for p in files)
 if size<500_000_000 or size>=995_000_000:raise SystemExit('V14_PAGES_SIZE_GATE:'+str(size))
 print('HIGHFLY_V14_PROTECTED_STAGING_GREEN='+json.dumps({
  'sizeBytes':size,'files':len(files),'copied':copied,'refs':assetrefs,
  'noPublicChanges':True,'noSF28Changes':True,'noV13Changes':True}))

def verify_live():
 qa=None
 for n in range(35):
  try:
   qa=json.loads(live('lab/v14/highfly-v14-qa.json'))
   if qa.get('sourceRun')!=V14_RUN or qa.get('sourceCommit')!=V14_SHA:
    raise RuntimeError('V14_LIVE_NOT_UPDATED_YET')
   checks={
    'index.html':qa['preservedHomeSHA256'],
    'lab/sf28/index.html':qa['preservedSf28IndexSHA256'],
    'lab/sf28/highfly-sf28-qa.json':qa['preservedSf28QaSHA256'],
    'lab/v13/index.html':qa['preservedV13IndexSHA256'],
    'lab/v13/highfly-v13-qa.json':qa['preservedV13QaSHA256'],
   }
   for path,expected in checks.items():
    if sha(live(path))!=expected:raise SystemExit('V14_CRITICAL_EXISTING_PUBLIC_CONTENT_CHANGED:'+path)
   html=live('lab/v14/index.html')
   if b'/cobalt-hollow-lab/assets/' not in html:raise SystemExit('V14_LIVE_WEBGL_ASSETS_NOT_LINKED')
   for asset in re.findall(rb"""(?:src|href)=["'](/cobalt-hollow-lab/assets/[^"']+)""",html):
    content=live(asset.decode().removeprefix('/cobalt-hollow-lab/'))
    if not content:raise SystemExit('V14_LIVE_SCRIPT_MISSING:'+asset.decode())
   print('HIGHFLY_V14_LIVE_PROTECTED_GREEN='+json.dumps({
    'url':BASE+'lab/v14/?hf-v14=1&hf-v14-class=warrior',
    'sourceRun':V14_RUN,'nativeOriginalAbilities':90,
    'homePreserved':True,'sf28Preserved':True,'v13Preserved':True,
    'physicalS23Qa':'pending'}))
   return
  except SystemExit:raise
  except Exception as e:
   print('V14_PAGES_PROPAGATION_CHECK',n,str(e)[:160]);time.sleep(7)
 raise SystemExit('V14_LIVE_DEPLOY_NOT_VERIFIED')

if __name__=='__main__':
 if len(sys.argv)!=2 or sys.argv[1] not in ('stage','verify-live'):raise SystemExit('usage: stage|verify-live')
 if sys.argv[1]=='stage':stage()
 else:verify_live()
