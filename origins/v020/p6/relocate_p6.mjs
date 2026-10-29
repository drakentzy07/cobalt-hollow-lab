#!/usr/bin/env node
// Re-home the exact QA-tested P6 distribution beneath /lab/origin-p6/.
// P5 at the Pages root remains byte-for-byte unchanged when merged later.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve(process.argv[2]||'upstream/dist');
const oldBase='/cobalt-hollow-lab/';
const newBase='/cobalt-hollow-lab/lab/origin-p6/';
const fail=s=>{throw Error('[HIGHFLY P6 PUBLISH GATE] '+s)};
function walk(dir){
 return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>
   e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
}
const html=path.join(root,'play.html');
const receiptPath=path.join(root,'highfly-origin-v020-p5-rights.json');
if(!fs.existsSync(html)||!fs.existsSync(receiptPath))fail('P5 safe postbuild missing');
const p5=JSON.parse(fs.readFileSync(receiptPath,'utf8'));
if(p5.version!=='P5'||p5.iconCount!==253||p5.upstream!=='4cedc7fbf49e7179f4c29b3db2d0b2bc5bab3d25')fail('P5 safety receipt does not match pinned source');
const original=fs.readFileSync(html,'utf8');
if(!original.includes(oldBase+'assets/')||original.includes(newBase))fail('Expected original absolute Vite base');
let touched=0,total=0;
for(const f of walk(root)){
 if(!/\.(?:html|css|js|json|webmanifest|svg)$/i.test(f))continue;
 const a=fs.readFileSync(f,'utf8');
 const b=a.replaceAll(oldBase,newBase);
 if(b!==a){fs.writeFileSync(f,b);touched++;}
 total++;
}
if(touched<2)fail('Insufficient rewritten files');
const moved=fs.readFileSync(html,'utf8');
if(!moved.includes(newBase+'assets/')||moved.includes(oldBase+'assets/'))fail('Vite asset paths still point to P5 root');
const protectedFiles=walk(root).filter(f=>/\.(?:html|css|js|json|webmanifest|svg)$/i.test(f));
for(const f of protectedFiles){
 const s=fs.readFileSync(f,'utf8');
 const residual=s.replaceAll(newBase,'');
 if(residual.includes(oldBase))fail('Old Pages path in '+path.relative(root,f));
}
if(!fs.existsSync(path.join(root,'ui/skills'))||!fs.existsSync(path.join(root,'ui/items')))fail('253 authored icon folders missing');
const count=(dir,ext)=>walk(dir).filter(f=>f.endsWith(ext)).length;
if(count(path.join(root,'ui/skills'),'.webp')!==152||count(path.join(root,'ui/items'),'.webp')!==101)fail('Icon count mismatch');
if(!fs.existsSync(path.join(root,'ui/cursors/arrow.png'))||!fs.existsSync(path.join(root,'ui/daily-rewards/treasure_chest.webp')))fail('Original P6 replacement art missing');
if(!fs.existsSync(path.join(root,'media/models'))||count(path.join(root,'media/models'),'.glb')<70)fail('Full game models missing');
if(fs.existsSync(path.join(root,'audio')))fail('Unreviewed original audio present');
const head=process.env.GITHUB_SHA||'local-test';
const run=process.env.GITHUB_RUN_ID||'local-test';
const qa={...p5,version:'P6',stage:'HIGHFLY ORIGIN v0.20 P6 MOBA HUD S23',
  p5InheritedSourceSha:p5.sourceSha,
  p6OverlaySha:head,p6QARunId:run,
  basePath:newBase,independentPageRoot:true,
  authoredCursorCount:6,authoredDailyRewardChestCount:1,
  physicalSamsungTest:false};
fs.rmSync(receiptPath);
fs.writeFileSync(path.join(root,'highfly-origin-v020-p6-rights.json'),JSON.stringify(qa,null,2));
const staging={version:'P6',sourceSha:head,qaRun:run,p5Source:'fed1c92b798b24beeae4dfe03b40a554dd3e31df',
  upstream:'4cedc7fbf49e7179f4c29b3db2d0b2bc5bab3d25',
  basePath:newBase,iconCount:253,
  visualReplacements:['ui/cursors/arrow.png','ui/cursors/gauntlet.png','ui/cursors/attack-sword.png','ui/cursors/friendly-shield.png','ui/cursors/hand-default.png','ui/cursors/hand-grab.png','ui/daily-rewards/treasure_chest.webp'],
  buildFiles:walk(root).length};
fs.writeFileSync(path.join(root,'highfly-origin-v020-p6-stage.json'),JSON.stringify(staging,null,2));
const bytes=walk(root).reduce((n,f)=>n+fs.statSync(f).size,0);
if(bytes<40_000_000||bytes>480_000_000)fail('Unexpected P6 site size: '+bytes);
console.log('HIGHFLY_P6_ISOLATED_STAGE_GREEN '+JSON.stringify({base:newBase,rewrittenFiles:touched,textFiles:total,bytes,sourceSha:head}));
