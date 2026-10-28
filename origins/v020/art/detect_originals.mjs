#!/usr/bin/env node
// HIGHFLY ORIGIN 0.20 ART253: prove the exact old CraftPix byte hashes do not
// survive into the compiled distribution under *any* filename.
// Uses pre-overlay original files in an isolated CI checkout; never exports art.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const self=path.dirname(fileURLToPath(import.meta.url));
const data=JSON.parse(fs.readFileSync(path.join(self,'MANIFIESTO_253.json'),'utf8'));
const expected=data.records;
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function files(root){
 const stack=[root],out=[];
 while(stack.length){const dir=stack.pop();for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const p=path.join(dir,entry.name);
  if(entry.isDirectory())stack.push(p);else if(entry.isFile())out.push(p);
 }}return out;
}
function die(s){throw new Error('[HIGHFLY COPYRIGHT GATE] '+s)}
const mode=process.argv[2],root=path.resolve(process.argv[3]||'upstream'),index=path.resolve(process.argv[4]||'old-icon-hashes.json');
if(mode==='--record'){
 if(expected.length!==253)die('Incorrect expected count');
 const originals=[];
 for(const r of expected){
  const orig=path.join(root,r.path);
  if(!fs.existsSync(orig))die('Missing old icon '+r.path);
  originals.push({path:r.path,sha256:hash(orig)});
 }
 // Multiple upstream paths can legitimately reuse the same CraftPix bytes.
 // Keep all 253 path records, but compare against the unique hash SET.
 const distinct=new Set(originals.map(x=>x.sha256));
 if(distinct.size<1||distinct.size>253)die('Invalid original hash collection');
 fs.writeFileSync(index,JSON.stringify({upstreamVersion:'v0.20.0',originals},null,2));
 console.log(`[HIGHFLY COPYRIGHT GATE] Recorded 253 original paths (${distinct.size} distinct SHA-256 hashes) privately, no image bytes.`);
}else if(mode==='--check'){
 const original=JSON.parse(fs.readFileSync(index,'utf8'));
 if(original.originals?.length!==253)die('Missing full original hash list');
 const blocked=new Set(original.originals.map(x=>x.sha256));
 const leaks=[];
 for(const p of files(root)){
  if(blocked.has(hash(p)))leaks.push(path.relative(root,p));
 }
 if(leaks.length)die('Found original CraftPix icon bytes in output: '+leaks.join(', '));
 console.log('[HIGHFLY COPYRIGHT GATE] PASS: no exact original CraftPix icon bytes in '+files(root).length+' compiled files.');
}else die('Usage: --record <upstream> <hash-json> | --check <dist> <hash-json>');
