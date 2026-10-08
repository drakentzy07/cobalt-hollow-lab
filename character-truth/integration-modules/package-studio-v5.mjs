/* HIGHFLY Skin Factory V5 portable preview ZIP, never deploy to the game.
 * No GLB copied; 6 original models requested from pinned upstream source.
 * Only candidate, public deployment requires explicit art-license review.
 */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const out=path.resolve('highfly-skinfactory-v5-preview'),src='character-truth';
const rev='9b57e49c9676d75962700f828cc00a50a9a988b5';
let html=fs.readFileSync(src+'/integration-modules/studio-v5.html','utf8');
function once(a,b){assert.equal(html.split(a).length,2,'BAD_DIST_REPLACEMENT '+a);html=html.replace(a,b)}
once('"/node_modules/three/build/three.module.js"','"./vendor/three/build/three.module.js"');
once('"/node_modules/three/examples/jsm/"','"./vendor/three/examples/jsm/"');
once("'/node_modules/meshoptimizer/meshopt_decoder.module.js'","'./vendor/meshopt_decoder.module.js'");
once("'/node_modules/three/examples/jsm/libs/basis/'","'./vendor/three/examples/jsm/libs/basis/'");
once("'../generated/modular-runtime.mjs'","'./generated/modular-runtime.mjs'");
once("loader.loadAsync('/character-truth/inputs/'+stem+'.glb')",
 "loader.loadAsync('https://raw.githubusercontent.com/levy-street/world-of-claudecraft/"+rev+
 "/public/models/chars/'+(stem==='warrior_modular'?'modular/':'players/')+stem+'.glb')");
html=html.replace('<meta charset="utf-8"/>',
 '<meta charset="utf-8"/><meta name="robots" content="noindex,nofollow"/>');
assert(!html.includes('/node_modules/'), 'ABSOLUTE_IMPORTED_DEPENDENCY');
assert(!html.includes('/character-truth/inputs/'),'LEAKED_ORIGINAL_LOCAL_GLBS');
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out+'/generated',{recursive:true});
fs.mkdirSync(out+'/vendor/three',{recursive:true});
fs.writeFileSync(out+'/index.html',html);
fs.copyFileSync(src+'/generated/modular-runtime.mjs',out+'/generated/modular-runtime.mjs');
for(const file of ['paint-recipe-v3.mjs','native-molder-v3.mjs','factory-recipe-v4.mjs']){
 fs.copyFileSync(src+'/integration-modules/'+file,out+'/'+file);
}
fs.cpSync('node_modules/three/build',out+'/vendor/three/build',{recursive:true});
fs.cpSync('node_modules/three/examples/jsm',out+'/vendor/three/examples/jsm',{recursive:true});
fs.copyFileSync('node_modules/three/LICENSE',out+'/vendor/three/LICENSE');
fs.copyFileSync('node_modules/meshoptimizer/meshopt_decoder.module.js',
 out+'/vendor/meshopt_decoder.module.js');
fs.writeFileSync(out+'/.nojekyll','');
fs.writeFileSync(out+'/NOTICE.txt', [
 'HIGHFLY SKIN STUDIO V5 / ISOLATED SOURCE PREVIEW — NOT THE PF6 GAME',
 '',
 'This is a STATIC demonstration package. Opening it from file:// does not work.',
 'Use an HTTP web server. Publishing it requires separate rights verification.',
 'Original 3D meshes are NOT bundled in this archive. Browsers request six',
 'models directly from World of ClaudeCraft upstream pinned SHA.',
 'World of ClaudeCraft SOURCE CODE is MIT; visual assets have separate',
 'licenses stated in CREDITS.md at:',
 'https://github.com/levy-street/world-of-claudecraft/blob/'+rev+'/CREDITS.md',
 'Permission to redistribute/use the exact modular warrior GLB in a separate',
 'site has not yet been individually certified. Do not deploy before review.',
 'Third-party THREE.js and meshoptimizer licenses retained via notices.',
 'The full V5-studio recipe (V4-compatible schema) saves only cosmetic source look/colors/shapes in localStorage.',
 'It does NOT alter actual PF-6 save/gameplay inventory, skills, or training stats.',
 'Performance verified only on Android-sized headless Chromium, not physical S23.',
 '',
].join('\n'));
const list=[];
const walk=p=>{for(const e of fs.readdirSync(p,{withFileTypes:true})){
 const full=path.join(p,e.name);
 if(e.isDirectory())walk(full);else list.push(path.relative(out,full));
}};walk(out);
for(const name of ['index.html','paint-recipe-v3.mjs','native-molder-v3.mjs',
'factory-recipe-v4.mjs','generated/modular-runtime.mjs',
'vendor/three/build/three.module.js','vendor/three/examples/jsm/loaders/GLTFLoader.js',
'vendor/meshopt_decoder.module.js'])assert(fs.statSync(out+'/'+name).size>200,name);
assert(list.every(x=>!x.toLowerCase().endsWith('.glb')),'ORIGINAL_GLB_MUST_NOT_BE_REDISTRIBUTED');
console.log('HIGHFLY_SKIN_FACTORY_V4_SEPARATE_STATIC_PACKAGE_GREEN=1 FILES='+list.length+
 ' ORIGINAL_GLBS_BUNDLED=0 PF6_DEPLOY=0');
