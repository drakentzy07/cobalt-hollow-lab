#!/usr/bin/env node
// HIGHFLY ORIGIN v0.20 Pages P5: conservative public-art clearance gate.
// Replaces project-owned/non-transferable media with original generated placeholders
// or CC0 donor models, preserves every cleared CC0/KayKit/Quaternius/Kenney asset.
// Never modifies upstream repo, only the ephemeral Actions checkout.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
const require=createRequire(path.join(path.resolve(process.argv[2]||'upstream'),'package.json'));
const sharp=require('sharp');
const root=path.resolve(process.argv[2]||'upstream');
const state=path.resolve(process.argv[3]||'p5-removed-hashes.json');
const dir=path.join(root,'public');
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
function walk(d){if(!fs.existsSync(d))return [];return fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);}
function bad(msg){throw Error('[HIGHFLY P5 RIGHTS] '+msg);}
const removed=[],remHashes=[];
function mark(f){if(fs.existsSync(f)){removed.push(path.relative(dir,f).replaceAll('\\','/'));remHashes.push(hash(f));}}
function rm(f){mark(f);if(fs.existsSync(f))fs.rmSync(f,{force:true});}
function rmDir(d){for(const f of walk(d))rm(f);if(fs.existsSync(d))fs.rmSync(d,{recursive:true,force:true});}
async function image(file,w,h,format){
 mark(file);
 const svg=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'"><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#08152b"/><stop offset=".53" stop-color="#173b64"/><stop offset="1" stop-color="#512e78"/></linearGradient><radialGradient id="aura"><stop stop-color="#80f7ff" stop-opacity=".6"/><stop offset="1" stop-color="#80f7ff" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#sky)"/><ellipse cx="'+Math.floor(w*.73)+'" cy="'+Math.floor(h*.30)+'" rx="'+Math.floor(w*.23)+'" ry="'+Math.floor(h*.28)+'" fill="url(#aura)"/><path d="M0 '+Math.floor(h*.86)+' Q'+Math.floor(w*.27)+' '+Math.floor(h*.61)+' '+Math.floor(w*.43)+' '+Math.floor(h*.78)+' T'+w+' '+Math.floor(h*.69)+' V'+h+' H0" fill="#101c39"/><path d="M0 '+Math.floor(h*.94)+' Q'+Math.floor(w*.55)+' '+Math.floor(h*.81)+' '+w+' '+Math.floor(h*.93)+' V'+h+' H0" fill="#090e1d"/><text x="50%" y="56%" text-anchor="middle" font-family="Arial,sans-serif" font-size="'+Math.floor(h*.11)+'" font-weight="bold" letter-spacing="5" fill="#e5fbff">HIGHFLY</text><text x="50%" y="65%" text-anchor="middle" font-family="Arial,sans-serif" font-size="'+Math.floor(h*.035)+'" letter-spacing="4" fill="#a0dff3">ORIGIN</text></svg>');
 fs.mkdirSync(path.dirname(file),{recursive:true});
 const tmp=file+'.generated';
 let s=sharp(svg).resize(w,h);
 if(format==='webp')s=s.webp({quality:80});else if(format==='png')s=s.png();else s=s.jpeg({quality:80});
 await s.toFile(tmp);
 fs.renameSync(tmp,file);
}
if(process.argv[4]!=='--sanitize')bad('Expected --sanitize');
const oldIcons=walk(path.join(dir,'ui/skills')).filter(x=>x.endsWith('.webp'));
if(oldIcons.length!==152)bad('Expected 152 pre-overlay skill icons, got '+oldIcons.length);
for(const name of ['stone_cantor.glb','spider_egg_sac.glb','tolling_bell.glb']){
 const dest=path.join(dir,'models/creatures',name);
 const donor=path.join(dir,'models/creatures',name==='stone_cantor.glb'?'goblin.glb':name==='spider_egg_sac.glb'?'spider.glb':'ghost.glb');
 if(!fs.existsSync(dest)||!fs.existsSync(donor))bad('Missing replacement source/dest '+name);
 mark(dest);fs.copyFileSync(donor,dest);
}
for(const f of ['vale_backdrop.webp','marsh_backdrop.webp','peaks_backdrop.webp','vale_backdrop_4k.webp','marsh_backdrop_4k.webp','peaks_backdrop_4k.webp']){
 const is4=f.includes('4k');await image(path.join(dir,'env',f),is4?4096:2048,is4?2048:1024,'webp');
}
for(const [p,w,h,fmt] of [
 ['home-bg.png',1200,675,'png'],['loading-screen.jpg',1200,675,'jpeg'],
 ['worldofclaudecraft-logo.png',1024,512,'png'],['woc-logo-guide.webp',1024,512,'webp'],
 ['woc-logo-hero.webp',1024,512,'webp'],['woc_logo_square.webp',512,512,'webp'],
 ['icon-512.png',512,512,'png'],['icon-192.png',192,192,'png'],
 ['apple-touch-icon.png',180,180,'png'],
])await image(path.join(dir,p),w,h,fmt);
for(const f of ['favicon-16x16.png','favicon-32x32.png'])await image(path.join(dir,f),f.includes('16')?16:32,f.includes('16')?16:32,'png');
rm(path.join(dir,'home-bg.mp4'));
rm(path.join(dir,'favicon.ico'));
// Other third-party-project media are not clearly granted for redistribution;
// no audio/voices or unproven item artwork escapes the public build.
for(const d of ['audio','guide-stills','ui/weapons','ui/emotes','ui/daily-rewards','ui/cursors'])rmDir(path.join(dir,d));
const report={release:'HIGHFLY ORIGIN 0.20 P5 rights-scrubbed public preview',source:'world-of-claudecraft@4cedc7fb',substitutedOrRemoved:removed.sort(),blockedHashes:[...new Set(remHashes)].sort(),method:'original HIGHFLY generated gradient graphics, KayKit/Quaternius/Kenney CC0 assets, 253 owned art overlays; unverified audio omitted',pagesOriginalMediaAllowlist:['CC0','MIT'],physicalDeviceTest:false};
fs.writeFileSync(state,JSON.stringify(report,null,2));
console.log('[HIGHFLY P5 RIGHTS] Scrubbed '+removed.length+' source paths; blocked '+report.blockedHashes.length+' exact restricted hashes.');
