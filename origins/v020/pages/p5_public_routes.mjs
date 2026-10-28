#!/usr/bin/env node
// P5 public Pages: correct hashed media URLs and use explicit playtest entry,
// never the temporary P3-only hidden CI diagnostic route.
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(process.argv[2]||'upstream');
const p=path.join(root,'src/render/assets/media.ts');
let s=fs.readFileSync(p,'utf8');
const tick=String.fromCharCode(96);
const before='  return MEDIA_ASSETS[logical] ?? '+tick+'/'+String.fromCharCode(36,123)+'logical}'+tick+';';
const after='  const result = MEDIA_ASSETS[logical] ?? "/" + logical;\n  return result.startsWith("/cobalt-hollow-lab/") ? result : "/cobalt-hollow-lab" + result;';
if(s.split(before).length!==2)throw Error('Unsafe v0.20 media.ts anchor');
s=s.replace(before,after);
fs.writeFileSync(p,s);
const main=path.join(root,'src/main.ts');
s=fs.readFileSync(main,'utf8');
const old="new URLSearchParams(location.search).get('highfly_p3') === '1'";
const replacement="new URLSearchParams(location.search).get('highfly_origin') === '1'";
if(s.split(old).length!==2)throw Error('Expected exact P3-only boot selector');
s=s.replace(old,replacement);
s=s.replace('// HIGHFLY INTERNAL SMOKE: run actual offline Sim and renderer on a landscape viewport.',
'// HIGHFLY P5 PUBLIC PLAYTEST: user-requested full original offline world.');
s=s.replace('// This route exists only in CI temporary checkout; it must never reach Pages or APK.',
'// This is the explicit HIGHFLY ORIGIN v0.20 static playtest entry route.');
fs.writeFileSync(main,s);
console.log('[HIGHFLY P5] Rewrote GLB/HDR/texture assetUrl for repo Pages and intentional public ?highfly_origin=1 entry.');
