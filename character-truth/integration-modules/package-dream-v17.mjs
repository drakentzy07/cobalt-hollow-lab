import fs from 'node:fs';import assert from 'node:assert/strict';
const root='character-truth/integration-modules';
const source='character-truth/v16-green-package',dest='highfly-dream-v17-preview';
assert(fs.existsSync(source+'/index.html'),'V17_REQUIRES_VERIFIED_V16_PACKAGE');
fs.rmSync(dest,{recursive:true,force:true});fs.cpSync(source,dest,{recursive:true});
let h=fs.readFileSync(dest+'/index.html','utf8');
assert(h.includes('dream-v16-ui.mjs')&&h.includes('dream-v15-ui.mjs')&&
 h.includes('</body></html>'),'V17_MUST_COMPOSE_V15_AND_V16');
h=h.replace('SKIN STUDIO · V14.1','DREAM SKIN STUDIO · V17')
 .replace('</body></html>','<script type="module" src="./dream-studio-v17.mjs"></script></body></html>');
fs.writeFileSync(dest+'/index.html',h);
for(const n of ['dream-project-v17.mjs','dream-studio-v17.mjs'])
 fs.copyFileSync(root+'/'+n,dest+'/'+n);
assert(fs.statSync(dest+'/assets/HIGHFLY-NIGHTFALL-rigged-body.glb').size>100000);
assert(fs.statSync(dest+'/assets/HIGHFLY-KAGE-ONI-head.glb').size>100000);
assert(!fs.existsSync(dest+'/assets/warrior_modular.glb'));
fs.writeFileSync(dest+'/V17_PROVENANCE.txt',
 'V17 unifies proven V14.1/V15/V16 under one browser cockpit. Original Rig_Medium is loaded from pinned ClaudeCraft source at runtime, not copied. V13 and V14 bake skinned Nightfall GLB; Kage Oni remains a separate rigid GLB and art fit unresolved. Image heuristics are NOT arbitrary image mesh generation. Screenshot/browser check is NOT physical S23 or Unity import validation. No game/main/public deploy.\n');
console.log('HIGHFLY_V17_UNIFIED_SOURCE_REUSE_NO_PUBLIC_DEPLOY_PACKAGE_GREEN=1');
