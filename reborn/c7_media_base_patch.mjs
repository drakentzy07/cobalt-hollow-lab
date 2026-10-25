/* C7/C8: correct Vite Pages subpath for hashed MEDIA_ASSETS.
   No source assets touched, no second asset pipeline, no CDN runtime.
*/
import fs from 'node:fs';
const file='src/render/assets/media.ts';
const text=fs.readFileSync(file,'utf8');
const original="  return MEDIA_ASSETS[logical] ?? "+String.fromCharCode(96)+"/"+String.fromCharCode(36)+"{logical}"+String.fromCharCode(96)+";";
const replacement=[
  "  // Upstream URLs default to absolute /media/*; Pages serves under a subpath.",
  "  const root = import.meta.env.BASE_URL ?? '/';",
  "  const asset = MEDIA_ASSETS[logical] ?? '/' + logical;",
  "  return (root.endsWith('/') ? root.slice(0,-1) : root) + asset;"
].join('\n');
if(text.split(original).length!==2)throw Error('REBORN_C7_MEDIA_BASE_SEAM_DRIFT');
fs.writeFileSync(file,text.replace(original,replacement));
console.log('HIGHFLY_REBORN_C7_MEDIA_ROOT_VITE_BASE_PREFIX=PASS');
