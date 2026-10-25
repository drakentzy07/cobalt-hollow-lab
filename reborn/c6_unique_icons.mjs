/* C6: unique HIGHFLY-drawn icons, zero rights-reserved donor pixels.
   Input is C0 conservative per-path ledger, never touch CC0 world/terrain/renders.
   Refuse to certify a public release while unlisted provenance remains. */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const candidate=path.resolve(process.argv[2]||'candidate');
const audit=JSON.parse(fs.readFileSync(path.resolve(process.argv[3]),'utf8'));
if(audit.releaseSafe!==false || !audit.upstream.includes('493c35a108cef6c8aa290e8793107b1cd117886e'))throw Error('C6_UNEXPECTED_AUDIT');
const sharp=createRequire(path.join(candidate,'package.json'))('sharp');
const root=path.join(candidate,'public');
const allowedBags=new Set(['backpack.webp','linen_pouch.webp','travelers_knapsack.webp','wolfhide_satchel.webp','gravewoven_bag.webp','mistcallers_duffel.webp']);
let replaced=[],kept=[],unresolved=[];
const hash=s=>{let a=2166136261;for(let i=0;i<s.length;i++){a^=s.charCodeAt(i);a=Math.imul(a,16777619)}return a>>>0};
const symbol=name=>{
 if(/weapon|sword|melee|slash|strike|axe|dagger/i.test(name))return 'M34 90L96 27 105 37 42 99 M32 86L45 99';
 if(/shield|armor|guard|block|protect/i.test(name))return 'M64 23L94 38V66Q87 91 64 107Q40 91 34 66V38Z';
 if(/fire|flame|meteor|arcane|magic|skill|spell/i.test(name))return 'M64 18L73 47 102 64 73 81 64 110 54 81 25 64 54 47Z';
 if(/leaf|plant|profession|harvest|herb|farm/i.test(name))return 'M96 22Q24 32 37 78Q54 111 82 75Z M39 100L83 45';
 if(/coin|loot|item|bag|store/i.test(name))return 'M32 49L64 30 96 49 96 89 64 108 32 89Z M32 49L64 69 96 49';
 if(/dash|evade|bolt|lightning/i.test(name))return 'M73 24L39 68H58L52 106 96 53H73Z';
 return 'M64 21L78 49 109 54 86 77 94 108 64 90 34 108 41 77 19 54 50 49Z';
};
const svg=(rel,wide)=>{
 const hex=hash(rel),h=hex%330,w=wide?640:128,ht=wide?480:128,s=wide?3.5:1;
 const letters=path.basename(rel).replace(/\.(png|webp|svg|jpe?g)$/i,'').split(/[-_]/).filter(Boolean).map(v=>v[0]).join('').replace(/[^A-Za-z0-9]/g,'').toUpperCase().slice(0,3)||'HF';
 const title=letters.replaceAll('&','&amp;').replaceAll('<','&lt;');
 return '<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+ht+'" viewBox="0 0 '+w+' '+ht+'">'+
 '<defs><radialGradient id="a"><stop stop-color="hsl('+h+',50%,36%)"/><stop offset="1" stop-color="#071526"/></radialGradient>'+
 '<linearGradient id="b"><stop stop-color="#faf1db"/><stop offset="1" stop-color="hsl('+h+',92%,67%)"/></linearGradient></defs>'+
 '<rect width="'+w+'" height="'+ht+'" rx="12" fill="url(#a)"/>'+
 '<g transform="translate('+(wide?96:0)+','+(wide?40:0)+') scale('+s+')">'+
 '<circle cx="64" cy="64" r="48" fill="#0b1f30" stroke="url(#b)" stroke-width="3"/>'+
 '<path d="'+symbol(rel)+'" fill="none" stroke="url(#b)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'+
 '</g><rect x="10" y="'+(ht-28)+'" width="'+(w-20)+'" height="20" rx="4" fill="#061426" fill-opacity=".87"/>'+
 '<text x="'+w/2+'" y="'+(ht-13)+'" font-family="sans-serif" font-weight="700" font-size="12" fill="white" text-anchor="middle">'+title+'</text></svg>';
};
const images=new Set();
for(const item of audit.entries){
 const rel=item.path.replace(/^public\//,'');
 if(!/\.(png|webp|svg|jpe?g)$/i.test(rel))continue;
 if(rel.startsWith('ui/items/')&&allowedBags.has(path.basename(rel))){kept.push(rel);continue;}
 images.add(rel);
}
for(const rel of images){
 const file=path.join(root,rel),ext=path.extname(file).toLowerCase();
 if(!fs.existsSync(file)){unresolved.push(rel);continue;}
 const wide=rel==='map_art/world_overview.webp';
 const bytes=Buffer.from(svg(rel,wide));
 if(ext==='.svg')fs.writeFileSync(file,bytes);
 else{
  const tmp=file+'.new-hf';
  if(ext==='.webp')await sharp(bytes).webp({quality:86}).toFile(tmp);
  else if(ext==='.png')await sharp(bytes).png().toFile(tmp);
  else await sharp(bytes).jpeg({quality:86}).toFile(tmp);
  fs.renameSync(tmp,file);
 }
 replaced.push(rel);
}
const manifest={source:audit.upstream,releaseReady:false,generatedDistinctIcons:replaced.length,preservedForkAllowedBags:kept,unresolved,paths:replaced.sort()};
fs.writeFileSync(path.join(root,'reborn-c6-icon-provenance.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('HIGHFLY_REBORN_C6_UNIQUE_AUTHORED_ICONS='+replaced.length);
console.log('HIGHFLY_REBORN_C6_CC0_ENVIRONMENT_UNTOUCHED=PASS');
if(unresolved.length)throw Error('C6_MISSING_ICONS:'+unresolved.join(';'));
