/** Package V20 over exactly V19 GREEN; no legacy files overwritten. */
import fs from 'node:fs';import assert from 'node:assert/strict';
const base='character-truth/v19-green-package';
const root='character-truth/integration-modules';
const out='highfly-supreme-v20-preview';
assert(fs.existsSync(base+'/index.html'),'V20_NEEDS_PINNED_V19_GREEN_PACKAGE');
fs.rmSync(out,{recursive:true,force:true});fs.cpSync(base,out,{recursive:true});
let html=fs.readFileSync(out+'/index.html','utf8');
assert(html.includes('legendary-forge-v19.mjs')&&html.includes('head-truth-v18.mjs')&&
 html.includes('dream-v16-ui.mjs')&&html.includes('dream-studio-v17.mjs')&&
 html.includes('</body></html>'),'V20_REQUIRED_ALL_FROZEN_MODULES');
html=html.replace('</body></html>',
 '<script type="module" src="./supreme-v20-ui.mjs"></script></body></html>')
 .replace('LEGENDARY SKIN STUDIO · V19','SUPREME ARMOR FORGE · V20.1');
fs.writeFileSync(out+'/index.html',html);
for(const file of ['supreme-recipe-v20.mjs','supreme-v20-ui.mjs'])
 fs.copyFileSync(root+'/'+file,out+'/'+file);
for(const name of ['HIGHFLY-V19-LEGENDARY-COMBINED.glb',
 'HIGHFLY-V19-LEGENDARY-ORNAMENTS.glb','HIGHFLY-NIGHTFALL-rigged-body.glb']){
 assert(fs.statSync(out+'/assets/'+name).size>9000,'V20_PINNED_AUTHENTIC_GLB_MISSING_'+name);
}
assert(!fs.existsSync(out+'/assets/warrior_modular.glb'),'V20_CANNOT_CLONE_SOURCE_HUNTER');
fs.writeFileSync(out+'/V20_PROVENANCE.txt',
 'V20.1 is a deterministic text + V16 local pixel palette -> full-armor design specification and bounded styling of genuine V12/V19 Blender skinned GLBs on real ClaudeCraft Rig_Medium. No arbitrary image reconstruction, no new V20 geometry yet. Browser export rewrites per-piece PBR materials and tiny shoulder-node scales; original rig, joint maps, mesh vertex/skin buffers and old snapshots are untouched. Android simulated Chromium only. Visual QA/clipping, actual Samsung, Unity reimport unverified. Public game unchanged.\n');
console.log('HIGHFLY_V20_PINNED_V19_GREEN_PACKAGE_AND_AUTHENTIC_STYLED_GLTF_READY=1');
