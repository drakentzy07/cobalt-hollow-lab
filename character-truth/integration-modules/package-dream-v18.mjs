/** V18 composes ONLY the frozen V17 GREEN artifact; never changes V17 or public game. */
import fs from 'node:fs';import assert from 'node:assert/strict';
const root='character-truth/integration-modules';
const source='character-truth/v17-green-package',dest='highfly-dream-v18-preview';
assert(fs.existsSync(source+'/index.html'),'V18_PINNED_V17_GREEN_ARTIFACT_REQUIRED');
fs.rmSync(dest,{recursive:true,force:true});fs.cpSync(source,dest,{recursive:true});
let html=fs.readFileSync(dest+'/index.html','utf8');
assert(html.includes('dream-studio-v17.mjs')&&html.includes('</body></html>')&&
 html.includes('dream-v16-ui.mjs')&&html.includes('dream-v15-ui.mjs'), 'V18_MUST_KEEP_V15_V16_V17');
html=html.replace('DREAM SKIN STUDIO · V17','SUPREME SKIN STUDIO · V18')
 .replace('</body></html>','<script type="module" src="./head-truth-v18.mjs"></script></body></html>');
fs.writeFileSync(dest+'/index.html',html);
for(const f of ['head-fit-math-v18.mjs','head-truth-v18.mjs','native-forge-v14-1.mjs'])
 fs.copyFileSync(root+'/'+f,dest+'/'+f);
/* V14.1 in V17 was patched to relative URL by its own packager.
 * Preserve that proven browser-relative Kage-Oni asset when replacing the source module. */
const helmetPath=dest+'/native-forge-v14-1.mjs';
const rawHelmet=fs.readFileSync(helmetPath,'utf8');
const absoluteHelmet="'/character-truth/integration-modules/assets/HIGHFLY-KAGE-ONI-head.glb'";
assert.equal(rawHelmet.split(absoluteHelmet).length,2,'V18_EXPECTS_EXACT_HELMET_SOURCE_ASSET');
fs.writeFileSync(helmetPath,rawHelmet.replace(absoluteHelmet,"'./assets/HIGHFLY-KAGE-ONI-head.glb'"));
assert(!fs.readFileSync(helmetPath,'utf8').includes(absoluteHelmet));
assert(fs.statSync(dest+'/assets/HIGHFLY-NIGHTFALL-rigged-body.glb').size>100000);
assert(fs.statSync(dest+'/assets/HIGHFLY-KAGE-ONI-head.glb').size>100000);
assert(!fs.existsSync(dest+'/assets/warrior_modular.glb'));
assert(fs.readFileSync(dest+'/native-forge-v14-1.mjs','utf8').includes('geometryTruth'));
fs.writeFileSync(dest+'/V18_PROVENANCE.txt',
'V18: real original ClaudeCraft M/F skinned head bounding measurements; geometry-only bounded helmet solver; original animation pose inspection (five clips). Reuses V17 V16 V15 and V14.1. Helmet geometry still needs visual correction and triangle clipping checks. NO physical Samsung/Unity QA. NO original GLB copied. NO PF6 or public gameplay modifications. No external paid generation.\\n');
console.log('HIGHFLY_V18_REUSE_V17_ORIGINAL_SOURCE_HELMET_TRUTH_PACKAGE_GREEN=1');