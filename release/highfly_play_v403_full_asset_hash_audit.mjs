/** Full read-only sha256 audit of the 3,179 MEDIA + AUDIO files.
 * Compare modern GREEN P10 bundle against ACTUAL CURRENT GitHub Pages.
 * No writes to public Pages, no saves touched, 12-way network bound.
 * This permits a future space-efficient /v4-03-preview under the SAME repo.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createReadStream} from 'node:fs';
const ROOT=path.resolve('candidate/cobalt-hollow-lab');
const BASE='https://drakentzy07.github.io/cobalt-hollow-lab/';
const folders=['media','audio'];
function walk(d){
  if(!fs.existsSync(d))throw Error('MISSING_BUILT_ASSET_DIR:'+d);
  return fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>{
    const p=path.join(d,e.name);
    if(e.isSymbolicLink())throw Error('NO_SYMLINK:'+p);
    return e.isDirectory()?walk(p):[p];
  });
}
function shaStream(file){
  return new Promise((resolve,reject)=>{
    const h=crypto.createHash('sha256');
    const stream=createReadStream(file,{highWaterMark:1024*1024});
    stream.on('data',b=>h.update(b));stream.on('error',reject);
    stream.on('end',()=>resolve(h.digest('hex')));
  });
}
const files=folders.flatMap(d=>walk(path.join(ROOT,d))).sort();
if(files.length<3000)throw Error('FULL_ASSET_AUDIT_MISSING_INPUT_COUNT:'+files.length);
const results=new Array(files.length);
let cursor=0;
async function worker(){
  while(cursor<files.length){
    const index=cursor++,file=files[index];
    const rel=path.relative(ROOT,file).split(path.sep).join('/');
    const hash=await shaStream(file);
    const bytes=fs.statSync(file).size;
    const urls=[BASE+rel,BASE+'v4-02/'+rel];
    const attempts=[];
    for(const url of urls){
      let hit=false;
      for(let trial=0;trial<2;trial++){
        const controller=new AbortController();
        const timeout=setTimeout(()=>controller.abort(),65000);
        try{
          const response=await fetch(url,{headers:{'User-Agent':'HIGHFLY-GOLDEN-SAME-PAGES-INTEGRITY',
            'Cache-Control':'no-cache'},signal:controller.signal});
          if(response.status!==200){
            attempts.push({url,status:response.status});
            break;
          }
          const remote=crypto.createHash('sha256');
          const reader=response.body.getReader();
          let size=0;
          while(true){
            const {done,value}=await reader.read();
            if(done)break;
            remote.update(value);size+=value.length;
          }
          const matches=size===bytes&&remote.digest('hex')===hash;
          attempts.push({url,status:200,match:matches,size});
          if(matches){hit=true;break}
          break;
        }catch(e){
          attempts.push({url,error:String(e)});
        }finally{clearTimeout(timeout)}
      }
      if(hit)break;
    }
    results[index]={path:rel,bytes,sha256:hash,matched:attempts.some(a=>a.match),attempts};
    if((index+1)%250===0)console.log('HF_GOLDEN_ASSET_PROGRESS='+JSON.stringify({
      scanned:results.filter(Boolean).length,total:files.length,
      missed:results.filter(x=>x&&!x.matched).length}));
  }
}
try{
  await Promise.all(Array.from({length:12},()=>worker()));
}finally{
  const ok=results.filter(x=>x?.matched),fail=results.filter(x=>x&&!x.matched);
  const report={
    purpose:'SOURCE-EXACT_ASSET_SHA256_TO_EXISTING_PAGES_NO_DEPLOY',
    source:'GREEN P10 38141812753',
    checked:results.filter(Boolean).length,expected:files.length,
    matched:ok.length,missingOrDifferent:fail.length,
    matchedBytes:ok.reduce((n,x)=>n+x.bytes,0),
    unmatchedBytes:fail.reduce((n,x)=>n+x.bytes,0),
    mismatchSample:fail.slice(0,75),
    assets:results.filter(Boolean),
    mayOmitDuplicatedMediaFromV403Preview:fail.length===0&&ok.length===files.length,
    actualPublicationPerformed:false,
    legacySitePagesUntouched:true,
  };
  fs.writeFileSync('highfly_golden_play_v403_full_asset_hashes.json',JSON.stringify(report)+'\n');
  console.log('HF_GOLDEN_FULL_MEDIA_AUDIO_SHASUM_REPORT='+JSON.stringify({
    checked:report.checked,matched:report.matched,differences:report.missingOrDifferent,
    matchedBytes:report.matchedBytes,unmatchedBytes:report.unmatchedBytes,
    canShareMediaAudio:report.mayOmitDuplicatedMediaFromV403Preview}));
}
if(results.some(x=>!x?.matched))throw Error('HF_GOLDEN_FULL_ASSET_MATCH_GATE_FAILED__NO_DEPLOY');
