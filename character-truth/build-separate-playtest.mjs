/* HIGHFLY SKIN3 — Build a portable, publishable-site CANDIDATE.
 * NO automatic GitHub Pages deployment; one Pages site per repository.
 * NEVER commit or republish the raw unverified original warrior_modular.glb.
 * Read original six GLBs directly from upstream revision only at runtime;
 * distribution of project media requires separate rights review.
 */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const src='character-truth',dist=path.resolve('skin3-preview-dist');
const from=p=>fs.readFileSync(path.join(src,p),'utf8');
const replace=(s,a,b)=>{
  assert.equal(s.split(a).length,2,'Expected exactly one source occurrence: '+a.slice(0,80));
  return s.replace(a,b);
};
const revision='9b57e49c9676d75962700f828cc00a50a9a988b5';
let html=from('phase11-playtest.html');
html=replace(html,'"/node_modules/three/build/three.module.js"','"./vendor/three/build/three.module.js"');
html=replace(html,'"/node_modules/three/examples/jsm/"','"./vendor/three/examples/jsm/"');
html=replace(html,"'/node_modules/meshoptimizer/meshopt_decoder.module.js'","'./vendor/meshopt_decoder.module.js'");
html=replace(html,"'/node_modules/three/examples/jsm/libs/basis/'","'./vendor/three/examples/jsm/libs/basis/'");
html=replace(html,
 "loader.loadAsync('/character-truth/inputs/'+stem+'.glb')",
 "loader.loadAsync('https://raw.githubusercontent.com/levy-street/world-of-claudecraft/"+revision+
 "/public/models/chars/'+(stem==='warrior_modular'?'modular/':'players/')+stem+'.glb')");
assert(!html.includes('/character-truth/inputs/'),'Original media accidentally bundled under public path');
assert(!html.includes('"/node_modules/')&&!html.includes("'/node_modules/"));
html=html.replace('<meta charset="utf-8">','<meta charset="utf-8"><meta name="robots" content="noindex,nofollow">');
fs.rmSync(dist,{recursive:true,force:true});
fs.mkdirSync(path.join(dist,'vendor/three'),{recursive:true});
fs.mkdirSync(path.join(dist,'generated'),{recursive:true});
fs.mkdirSync(path.join(dist,'phase10-generated'),{recursive:true});
fs.copyFileSync(path.join(src,'phase10-item-visual-adapter.mjs'),path.join(dist,'phase10-item-visual-adapter.mjs'));
fs.copyFileSync(path.join(src,'generated/modular-runtime.mjs'),path.join(dist,'generated/modular-runtime.mjs'));
fs.copyFileSync(path.join(src,'phase10-generated/equipment_rules.mjs'),path.join(dist,'phase10-generated/equipment_rules.mjs'));
fs.copyFileSync(path.join(src,'phase10-generated/modular.mjs'),path.join(dist,'phase10-generated/modular.mjs'));

fs.cpSync('node_modules/three/build',path.join(dist,'vendor/three/build'),{recursive:true});
fs.cpSync('node_modules/three/examples/jsm',path.join(dist,'vendor/three/examples/jsm'),{recursive:true});
fs.copyFileSync('node_modules/three/LICENSE',path.join(dist,'vendor/three/LICENSE'));
fs.copyFileSync('node_modules/meshoptimizer/meshopt_decoder.module.js',path.join(dist,'vendor/meshopt_decoder.module.js'));
fs.writeFileSync(path.join(dist,'index.html'),html);
fs.writeFileSync(path.join(dist,'.nojekyll'),'');
fs.writeFileSync(path.join(dist,'LEGAL_AND_REVIEW.txt'),[
 'HIGHFLY SKIN 3 — INDEPENDENT PLAYTEST CANDIDATE',
 'This package is not the HIGHFLY production game.',
 'Original source code: Levy Street / World of ClaudeCraft MIT,',
 'https://github.com/levy-street/world-of-claudecraft/blob/'+revision+'/LICENSE',
 'Three.js MIT, meshoptimizer MIT (respective upstream notices apply).',
 'Original gameplay kit/source models are NOT bundled in this package.',
 'A user browser retrieves six GLB assets from the upstream pinned public source at runtime.',
 'Asset rights: ClaudeCraft CREDITS.md specifically limits project-owned and unlisted art.',
 'The exact permissions of warrior_modular.glb have NOT been independently certified.',
 'Do not publicly deploy this preview before verifying legal permission to display the assets.',
 'No claims are made of authentic PF6 gameplay gear persistence or item-specific cosmetic art.',
 'LocalStorage is only a sandbox for the lab. Physical S23 Ultra still requires testing.',
 'Do not replace main Pages deployment and do not deploy to the existing cobalt-hollow-lab Pages.',
 ''
].join('\n'));
fs.writeFileSync(path.join(dist,'README.txt'),[
 'HIGHFLY SKIN3 — Mobile Playtest',
 '',
 'Open this directory with an HTTP static server or upload the CONTENTS to a',
 'dedicated GitHub Pages repository after verifying permissions.',
 'Entry point: index.html (relative base paths work on GitHub Pages project subdirectories).',
 'Requirements: modern WebGL2 browser with Internet access for six GLB files',
 'hosted at pinned upstream GitHub URL.',
 'This is SOURCE-ONLY equipment visual lab, not game inventory or production saves.',
 'Screens: 3D actor / simple equip / female-male switch / save-load / advanced animation and slots.',
 'Do not open index.html directly with file://; ES modules require an HTTP(S) server.',
 ''
].join('\n'));
const names=['index.html','phase10-item-visual-adapter.mjs','generated/modular-runtime.mjs',
 'phase10-generated/equipment_rules.mjs','phase10-generated/modular.mjs','vendor/meshopt_decoder.module.js',
 'vendor/three/build/three.module.js','vendor/three/examples/jsm/loaders/GLTFLoader.js',
 'vendor/three/examples/jsm/loaders/KTX2Loader.js'];
for(const n of names){assert(fs.statSync(path.join(dist,n)).size>100,'File missing '+n);}
const all=[];function walk(p){for(const d of fs.readdirSync(p,{withFileTypes:true})){
 const loc=path.join(p,d.name);if(d.isDirectory())walk(loc);else all.push(path.relative(dist,loc));
}}walk(dist);
assert(all.every(p=>!p.endsWith('.glb')),'DO NOT REDISTRIBUTE ASSETS');
console.log('HIGHFLY_SKIN3_SEPARATE_SITE_CANDIDATE_GREEN=1 FILES='+all.length+
 ' GLB_DISTRIBUTED=0 BASE_RELATIVE=1 GAME_PAGES_UNTOUCHED=1');
