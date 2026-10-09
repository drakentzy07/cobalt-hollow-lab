/** Non-destructive extension of exact certified V14.1 public-site candidate artifact. */
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
const root='character-truth/integration-modules',out='highfly-dream-v15-preview';
const prior='character-truth/v14-1-approved-package';
assert(fs.existsSync(prior+'/index.html'),'V15_NEEDS_GREEN_V14_1_PACKAGED_SITE');
fs.rmSync(out,{recursive:true,force:true});fs.cpSync(prior,out,{recursive:true});
const htmlPath=out+'/index.html',text=fs.readFileSync(htmlPath,'utf8');
assert(text.includes('SKIN STUDIO · V14.1')&&text.includes('id="bodyPanel"')&&
 text.includes('</body></html>'),'V15_SOURCE_HTML_VERSION_MISMATCH');
const upgraded=text.replace('</body></html>',
 '<script type="module" src="./dream-v15-ui.mjs"></script></body></html>');
assert(upgraded!==text,'V15_BROWSER_EXTENSION_INJECTION_FAILED');
fs.writeFileSync(htmlPath,upgraded);
for(const file of ['dream-v15-ui.mjs','dream-recipe-v15.mjs'])
 fs.copyFileSync(root+'/'+file,out+'/'+file);
assert(fs.statSync(out+'/assets/HIGHFLY-NIGHTFALL-rigged-body.glb').size>100000,
 'V15_NEEDS_REAL_BLENDER_NIGHTFALL_GLB');
assert(fs.statSync(out+'/assets/HIGHFLY-KAGE-ONI-head.glb').size>100000,
 'V15_NEEDS_REAL_BLENDER_KAGE_ONI_GLB');
assert(fs.existsSync(out+'/bake-native-shape-v14.mjs'),'V15_REUSES_REAL_V14_BAKER');
assert(!fs.existsSync(out+'/assets/warrior_modular.glb'),'V15_NEVER_BUNDLES_SOURCE_HUNTER');
fs.writeFileSync(out+'/V15_PROVENANCE.txt',
 'HIGHFLY V15: V14.1 original standalone candidate reused, real Blender V12 skinned armor and Kage Oni imported as-is. Text parsing is deterministic ES with supported signals; only V13 material and V14 shape edits are real exports. Helmet art fit is pending. No public deployment.\n');
console.log('HIGHFLY_V15_PREVIEW_REUSES_REAL_V14_1_AND_BLENDER_GLBS_GREEN=1');
