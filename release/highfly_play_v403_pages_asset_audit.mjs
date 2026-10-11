/** HIGHFLY GOLDEN PLAY · same repo SAME existing Pages safety diagnosis.
 * READ ONLY. Reuses the already-GREEN P10 artifact; estimates whether new
 * V4-03 media may be shared with public root, rather than uploading 2x 900MB.
 * Does not deploy or mutate original website, index, Hunter or saved games.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const ROOT=path.resolve('candidate');
const SITE='https://drakentzy07.github.io/cobalt-hollow-lab/';
const dirs=['media','assets','audio','models','highfly'];
const walk=(d)=>fs.existsSync(d)?fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>{
  const p=path.join(d,e.name);
  if(e.isSymbolicLink())throw Error('CANDIDATE_SYMLINK_REJECTED:'+p);
  return e.isDirectory()?walk(p):[p];
}):[];
const files=walk(ROOT);
const index=files.find(f=>f.endsWith('/cobalt-hollow-lab/index.html'));
if(!index)throw Error('P10_CANDIDATE_WEBGL_INDEX_NOT_FOUND');
const base=path.dirname(index);
const samples={};
for(const d of dirs){
  const group=walk(path.join(base,d)).filter(f=>fs.statSync(f).isFile());
  const size=group.reduce((a,f)=>a+fs.statSync(f).size,0);
  samples[d]={count:group.length,bytes:size};
}
const unique=files.filter(f=>f.startsWith(base+path.sep)).length;
const stat=fs.statSync(index);
async function getResponse(url,method='HEAD'){
  const controller=new AbortController(),t=setTimeout(()=>controller.abort(),25000);
  try{
    return await fetch(url,{method,redirect:'follow',
      headers:{'User-Agent':'HIGHFLY-PLAY-GOLDEN-READONLY-QA','Cache-Control':'no-cache'},
      signal:controller.signal});
  }finally{clearTimeout(t)}
}
const original={};
for(const name of ['','v4-02/','monster-lab/','monster-lab/hunts.html','skin-lab/s2/','v4-03-preview/']){
  try{
    const r=await getResponse(SITE+name);
    original[name]={status:r.status,length:r.headers.get('content-length'),type:r.headers.get('content-type')};
  }catch(e){original[name]={error:String(e)}}
}
const bucket=walk(path.join(base,'media')).filter(f=>fs.statSync(f).isFile()).sort((a,b)=>fs.statSync(b).size-fs.statSync(a).size);
const candidates=[...bucket.slice(0,12),...bucket.slice(-8)];
const checks=[];
for(const f of candidates){
  const rel=path.relative(base,f).split(path.sep).join('/');
  const ours=crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
  const sources=[];
  for(const prefix of ['','v4-02/']){
    const url=SITE+prefix+rel;
    try{
      let r=await getResponse(url,'GET');
      const remoteHash=r.status===200?crypto.createHash('sha256').update(Buffer.from(await r.arrayBuffer())).digest('hex'):null;
      sources.push({prefix,status:r.status,match:remoteHash===ours});
      if(remoteHash===ours)break;
    }catch(e){sources.push({prefix,error:String(e)})}
  }
  checks.push({path:rel,bytes:fs.statSync(f).size,sources,compatible:sources.some(x=>x.match)});
}
const allBytes=walk(base).reduce((a,f)=>a+fs.statSync(f).size,0);
const result={
  status:'READ_ONLY_ASSET_SHARING_PREFLIGHT_NOT_A_PUBLIC_DEPLOY',
  exactP10Candidate:'fc74d3ba8638aa3bee263c710b5be28da81c6710',
  candidateRoot:base,oldSite:SITE,
  candidateTotalBytes:allBytes,candidateFileCount:unique,
  groups:samples,existingPagesRoutes:original,sampledMedia:checks,
  matchedSamples:checks.filter(x=>x.compatible).length,totalSamples:checks.length,
  canPublishNow:false,
  mustProveBeforePublish:[
    'all legacy Pages routes, assets and hashes preserved',
    'all shared large media assets proven identical or separately included',
    'complete Pages artifact <= hosting upload limit',
    'all new JS/CSS URLs point only at V4-03 subpath',
    'save migration true browser IndexedDB and original V4-02 remain untouched',
  ],
};
fs.writeFileSync('highfly_golden_play_v403_pages_asset_audit.json',JSON.stringify(result,null,2)+'\n');
console.log('HF_GOLDEN_PLAY_PAGES_BUDGET_READONLY_DIAGNOSTIC='+JSON.stringify({
  allBytes,groups:samples,matchedSamples:result.matchedSamples,
  totalSamples:result.totalSamples,routeStatus:original
}));
if(!files.length||stat.size<500)throw Error('P10_WEBGL_CANDIDATE_BAD');
if(original[''].status!==200||original['v4-02/'].status!==200)throw Error('PUBLIC_SITE_NOT_REACHABLE');
