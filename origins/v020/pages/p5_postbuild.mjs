#!/usr/bin/env node
// P5 public Pages output hardening: prefix rooted media in compiled JS/HTML/CSS
// and reject exact proprietary asset hashes from the uploaded distribution.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve(process.argv[2]||'upstream/dist');
const rights=JSON.parse(fs.readFileSync(process.argv[3]||'rights.json','utf8'));
const base='/cobalt-hollow-lab';
if(!fs.existsSync(path.join(root,'play.html')))throw Error('Missing full game play.html');
function walk(d){return fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)])}
const files=walk(root).filter(f=>fs.statSync(f).isFile());
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const blocked=new Set(rights.blockedHashes);
let rewritten=0,fixes=0;
const media='(?:media|models|textures|env|vfx|audio|ui|guide-stills|assets|basis|home-bg|loading-screen|woc-logo|worldofclaudecraft-logo|icon-192|icon-512|favicon|apple-touch-icon)';
const rg=new RegExp('(["\\u0027(=])\\/('+media+')(?=[\\/.])','g');
for(const f of files){
 if(!/\.(html|css|js|json|webmanifest)$/i.test(f))continue;
 const original=fs.readFileSync(f,'utf8');
 const next=original.replace(rg,(_,pre,name)=>{fixes++;return pre+base+'/'+name;});
 if(next!==original){fs.writeFileSync(f,next);rewritten++;}
}
const page='<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HIGHFLY ORIGIN 0.20</title><meta http-equiv="refresh" content="0;url=./play.html?highfly_origin=1"></head><body style="margin:0;background:#050b1b;color:#cff7ff;font-family:sans-serif;text-align:center;padding-top:25vh"><h1>HIGHFLY ORIGIN</h1><p>Entrando al mundo 3D...</p><a href="./play.html?highfly_origin=1" style="color:#7ce9ff">ENTRAR AL MUNDO</a><script>location.replace("./play.html?highfly_origin=1"+location.hash)</script></body></html>';
fs.writeFileSync(path.join(root,'index.html'),page);
const hits=[];
for(const f of walk(root).filter(f=>fs.statSync(f).isFile())){
 if(blocked.has(hash(f)))hits.push(path.relative(root,f));
}
if(hits.length)throw Error('Restricted upstream media escaped: '+hits.slice(0,20).join(', '));
const html=fs.readFileSync(path.join(root,'play.html'),'utf8');
if(!html.includes('/cobalt-hollow-lab/assets/'))throw Error('Vite subpath missing in play.html');
if(!fs.existsSync(path.join(root,'ui/skills'))||!fs.existsSync(path.join(root,'ui/items')))throw Error('Missing replaced icons');
fs.writeFileSync(path.join(root,'highfly-origin-v020-p5-rights.json'),JSON.stringify({
 version:'P5',gameVersion:'HIGHFLY ORIGIN v0.20',sourceSha:process.env.HIGHFLY_SOURCE_SHA||'ffd1b8dc56492335c171195adcb338162ecff94d',upstream:'4cedc7fbf49e7179f4c29b3db2d0b2bc5bab3d25',iconCount:253,
 scrubbedPaths:rights.substitutedOrRemoved,unlicensedHashesRejected:blocked.size,
 basePath:base+'/',generatedPathRewrites:fixes,physicalSamsungTest:false,legalNote:'Unclear project-specific media excluded or replaced; sources in CREDIT and MIT notices; QA preview only'
},null,2));
fs.writeFileSync(path.join(root,'.nojekyll'),'');
let size=0;for(const f of walk(root).filter(f=>fs.statSync(f).isFile()))size+=fs.statSync(f).size;
if(size>900e6)throw Error('Pages too large: '+size);
console.log('[HIGHFLY P5 PAGES] PASS scripts '+rewritten+' URL rewrites '+fixes+', bytes '+size+', blocked original hashes '+blocked.size);
