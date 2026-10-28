#!/usr/bin/env node
// HIGHFLY ORIGIN v0.20 — audited art overlay, no game-mechanics changes.
// Usage: node origins/v020/art/apply_validate.mjs --check-overlay
//        node origins/v020/art/apply_validate.mjs --apply upstream
//        node origins/v020/art/apply_validate.mjs --verify upstream
//        node origins/v020/art/apply_validate.mjs --verify-dist upstream/dist
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'MANIFIESTO_253.json'),'utf8'));
const expected=manifest.records;
const overlay=path.join(dir,'overlay');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const fail = s => {throw new Error('[HIGHFLY ART253] '+s)};
function webpSize(file){
  const b=fs.readFileSync(file);
  if(b.length<30||b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WEBP')fail('Invalid WebP: '+file);
  let pos=12;
  while(pos+8<=b.length){
    const id=b.toString('ascii',pos,pos+4), n=b.readUInt32LE(pos+4), s=pos+8;
    if(s+n>b.length)fail('Invalid WebP chunk: '+file);
    if(id==='VP8X')return [1+b.readUIntLE(s+4,3),1+b.readUIntLE(s+7,3)];
    if(id==='VP8 ' && n>=10)return [b.readUInt16LE(s+6)&0x3fff,b.readUInt16LE(s+8)&0x3fff];
    if(id==='VP8L' && n>=5)return [1+(((b[s+2]&0x3f)<<8)|b[s+1]),1+(((b[s+4]&0x0f)<<10)|(b[s+3]<<2)|((b[s+2]&0xc0)>>6))];
    pos=s+n+(n&1);
  }
  fail('No WebP frame: '+file);
}
function walk(d){if(!fs.existsSync(d))return [];return fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)])}
function verifyFiles(root,offset='',strictList=false){
  const ids=new Set(),paths=new Set(), hashes=new Set();
  if(expected.length!==253)fail('Manifest must contain exactly 253 records');
  const counts={skill:0,item:0};
  for(const r of expected){
    if(typeof r.id!=='string'||ids.has(r.id))fail('Duplicated or invalid id: '+r.id);ids.add(r.id);
    if(typeof r.displayName!=='string'||!r.displayName.trim())fail('Missing displayName for '+r.id);
    if(!/^public\/ui\/(skills\/[^/]+\/|items\/)[a-zA-Z0-9_\-]+\.webp$/.test(r.path)||paths.has(r.path))fail('Invalid/duplicate path: '+r.path);
    paths.add(r.path);
    if(!['skill','item'].includes(r.type))fail('Unexpected type: '+r.type);counts[r.type]++;
    const rel=offset ? r.path.slice(7) : r.path;
    const full=path.join(root,rel);
    if(!fs.existsSync(full))fail('Missing file: '+full);
    const computed=hash(full);
    if(computed!==r.sha256WebP)fail('Hash mismatch: '+rel+' (expected '+r.sha256WebP+', got '+computed+')');
    hashes.add(computed);
    const [w,h]=webpSize(full);
    if(w!==128||h!==128)fail(`Wrong dimensions: ${rel}: ${w}x${h}`);
  }
  if(counts.skill!==152||counts.item!==101||hashes.size!==253)fail('Count or binary uniqueness failure');
  if(strictList){
    const actual=[...walk(path.join(root,offset?'ui/skills':'public/ui/skills')),...walk(path.join(root,offset?'ui/items':'public/ui/items'))]
      .filter(p=>p.toLowerCase().endsWith('.webp'));
    const unknown=actual.filter(p=>!paths.has(offset?'public/'+path.relative(root,p).replaceAll('\\','/'):path.relative(root,p).replaceAll('\\','/')));
    if(unknown.length)fail('Unreviewed icon WebPs exist alongside 253 mapped replacements: '+unknown.slice(0,10).join(', '));
  }
  console.log('[HIGHFLY ART253] OK: 253 unique paths/IDs/hashes, 152 skills, 101 items, WebP 128x128 and SHA-256. Root: '+root);
}
const cmd=process.argv[2];
const arg=process.argv[3];
if(cmd==='--check-overlay')verifyFiles(overlay,'',true);
else if(cmd==='--apply'){
  const root=path.resolve(arg||'upstream');
  verifyFiles(overlay,'',true);
  if(!fs.existsSync(path.join(root,'LICENSE'))||!fs.existsSync(path.join(root,'public/ui')))fail('Upstream source missing; refuse to apply');
  // No destructive delete; replace only the 253 agreed original icon paths.
  for(const r of expected){const dst=path.join(root,r.path);fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(path.join(overlay,r.path),dst)}
  verifyFiles(root,'',true);
  console.log('[HIGHFLY ART253] Applied replacements; no RPG source files modified.');
}
else if(cmd==='--verify')verifyFiles(path.resolve(arg||'upstream'),'',true);
else if(cmd==='--verify-dist')verifyFiles(path.resolve(arg||'upstream/dist'),'public/',true);
else fail('Usage: --check-overlay | --apply <upstream> | --verify <upstream> | --verify-dist <upstream/dist>');
