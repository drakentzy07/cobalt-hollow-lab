/* C7: KTX2 transcoder is a static Vite public/ asset, needs Pages prefix. */
import fs from 'node:fs';
const file='src/render/assets/ktx2_support.ts';
const a=fs.readFileSync(file,'utf8');
const old="const TRANSCODER_PATH = '/basis/';";
const fresh="const TRANSCODER_PATH = (import.meta.env.BASE_URL ?? '/') + 'basis/';";
if(a.split(old).length!==2)throw Error('HIGHFLY_C7_BASIS_ANCHOR_DRIFT');
fs.writeFileSync(file,a.replace(old,fresh));
console.log('HIGHFLY_C7_KTX2_BASIS_PAGES_PREFIX=PASS');
