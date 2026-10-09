import fs from 'node:fs';import assert from 'node:assert/strict';
const root='character-truth/integration-modules',source='character-truth/v15-green-package',dest='highfly-dream-v16-preview';
assert(fs.existsSync(source+'/index.html'),'V16_REQUIRES_GREEN_V15');
fs.rmSync(dest,{recursive:true,force:true});fs.cpSync(source,dest,{recursive:true});
const old=fs.readFileSync(dest+'/index.html','utf8');
assert(old.includes('dream-v15-ui.mjs')&&old.includes('</body></html>'),'V16_BAD_BASE_PACKAGE');
fs.writeFileSync(dest+'/index.html',old.replace('</body></html>',
 '<script type="module" src="./dream-v16-ui.mjs"></script></body></html>'));
for(const name of ['dream-image-v16.mjs','dream-v16-ui.mjs'])
 fs.copyFileSync(root+'/'+name,dest+'/'+name);
assert(fs.existsSync(dest+'/dream-recipe-v15.mjs')&&
 fs.existsSync(dest+'/assets/HIGHFLY-NIGHTFALL-rigged-body.glb'),'V16_GLB_REUSE_MISSING');
fs.writeFileSync(dest+'/V16_PROVENANCE.txt',
 'V16 works on uploaded image pixels locally; palette and silhouette estimations are not semantic 3D reconstruction. Actual output uses V13-V14 real skinned Nightfall GLB. No new image-only geometry automatically created. No deploy.\n');
console.log('HIGHFLY_V16_IMAGE_REFERENCE_AND_REAL_3D_PIPELINE_PACKAGED_GREEN=1');
