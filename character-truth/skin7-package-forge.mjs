/** SKIN 7 BLOCK2 — isolated preview composed on exactly frozen V20 GREEN, never overwrite.
 * Two actual Blender-authored 54-piece animated profiles, male/female in one source rig.
 */
import fs from 'node:fs';import assert from 'node:assert/strict';
const base='character-truth/skin7-frozen-v20';
const out='highfly-skin7-supreme-preview';
assert(fs.statSync(base+'/index.html').size>40000,'SKIN7_PINNED_V20_HTML_REQUIRED');
fs.rmSync(out,{recursive:true,force:true});
fs.cpSync(base,out,{recursive:true});
let html=fs.readFileSync(out+'/index.html','utf8');
assert(html.includes('supreme-v20-ui.mjs')&&html.includes('legendary-forge-v19.mjs')&&
 html.includes('dream-studio-v17.mjs')&&html.includes('head-truth-v18.mjs')&&
 html.includes('</body></html>'),'SKIN7_AUTHENTIC_UNMODIFIED_HUNTER_STUDIO_MISSING');
html=html.replace('</body></html>',
  '<script type="module" src="./skin7-supreme-forge-ui.mjs"></script></body></html>');
html=html.replace('SUPREME ARMOR FORGE · V20.1','HIGHFLY · SKIN 7 SUPREME FORGE PREVIEW');
fs.writeFileSync(out+'/index.html',html);
fs.copyFileSync('character-truth/skin7-supreme-forge-ui.mjs',
  out+'/skin7-supreme-forge-ui.mjs');
for(const style of ['crimson','guardian']){
 for(const kind of ['overlay','combined']){
  const n='HIGHFLY-SKIN7-'+style+'-'+kind+'.glb';
  const p='character-truth/skin7-generated/'+n;
  assert(fs.statSync(p).size>15000,'SKIN7_MUST_HAVE_REAL_BLENDER_GLB_'+n);
  fs.copyFileSync(p,out+'/assets/'+n);
 }
}
assert(!fs.existsSync(out+'/assets/warrior_modular.glb'),'SKIN7_FORBIDDEN_ORIGINAL_HUNTER_ASSET_DUPLICATION');
fs.writeFileSync(out+'/SKIN7_PROVENANCE.txt',
 'Skin7 preview is only a candidate, NOT deployed. Blender authors 54 NEW weighted meshes per design, 27 M and 27 F. Reuses exact frozen V20 GREEN existing real Hunter; no existing source or public game changed. The designer can try two pre-authored parametric profiles, compare geometry, inspect original animations, record local artwork preference and discard. Arbitrary image text to new mesh NOT implemented. Kage Oni helmet remains separate. No physical Samsung, Unity Editor, clipping certification or artist approval yet.\n');
console.log('HIGHFLY_SKIN7_BLOCK2_NONDSTRUCTIVE_REAL_ARMOR_PREVIEW_PACKAGE_GREEN=1');
