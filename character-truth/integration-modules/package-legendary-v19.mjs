/** V19: ONLY additive independent candidate on top of verified V18. */
import fs from 'node:fs';import assert from 'node:assert/strict';
const root='character-truth/integration-modules';
const source='character-truth/v18-green-package',dest='highfly-legendary-v19-preview';
assert(fs.existsSync(source+'/index.html'),'V19_REQUIRES_REAL_GREEN_V18_PACKAGE');
fs.rmSync(dest,{recursive:true,force:true});fs.cpSync(source,dest,{recursive:true});
let html=fs.readFileSync(dest+'/index.html','utf8');
assert(html.includes('head-truth-v18.mjs')&&html.includes('dream-studio-v17.mjs')&&html.includes('dream-v16-ui.mjs'),
 'V19_FROZEN_V18_V17_MODULES_MISSING');
const hook='new ResizeObserver(()=>{if(state.ready)render()}).observe(panel);';
assert.equal(html.split(hook).length,2,'V19_ONE_NATIVE_SCENE_REQUIRED');
html=html.replace(hook,
 `window.__HF_V19_SCENE__=Object.freeze({root:()=>root,render:()=>render()});\n`+hook);
assert(html.includes('</body></html>'),'V19_EXPECTS_FROZEN_HTML_END');
html=html.replace('</body></html>',
 '<script type="module" src="./legendary-forge-v19.mjs"></script></body></html>');
html=html.replace('SUPREME SKIN STUDIO · V18','LEGENDARY SKIN STUDIO · V19');
fs.writeFileSync(dest+'/index.html',html);
fs.copyFileSync(root+'/legendary-forge-v19.mjs',dest+'/legendary-forge-v19.mjs');
for(const name of ['HIGHFLY-V19-LEGENDARY-ORNAMENTS.glb','HIGHFLY-V19-LEGENDARY-COMBINED.glb']){
 const src=root+'/assets/'+name;assert(fs.existsSync(src),'V19_BLENDER_OUTPUT_MISSING_'+name);
 assert(fs.statSync(src).size>9000,'V19_EMPTY_SKIN_GLB_'+name);
 fs.copyFileSync(src,dest+'/assets/'+name);
}
assert(!fs.existsSync(dest+'/assets/warrior_modular.glb'));
fs.writeFileSync(dest+'/V19_PROVENANCE.txt',
'V19 consists of 32 independently new Blender meshes with weights sourced from a Rig_Medium-compatible Nightfall donor. Browser binds them to frozen original Hunter. A single combined Blender GLB also carries Nightfall and V19, but never original player body geometry. V15/V16 text/image tools are not yet unrestricted generative models; V19 is first authored expansion for premium 3D armor. No physical Samsung or Unity game import verification; no visual clipping guarantee.\n');
console.log('HIGHFLY_V19_REUSE_GREEN_V18_NEW_BLENDER_3D_NO_PUBLIC_DEPLOY_PACKAGE_GREEN=1');