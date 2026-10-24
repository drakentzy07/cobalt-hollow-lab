/**
 * Sanitize the public Genesis alpha build, never the repository's upstream code.
 * The donor code is MIT, but licensed art is separately controlled by CREDITS.md.
 * Replace (not redistribute) donor-specific paid/rights-reserved UI assets with
 * generic neutral images, and exclude known restricted media.
 *
 * This is a broad alpha safeguard. Later replace these placeholders with original
 * HIGHFLY art and per-asset provenance.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
// Resolve pinned candidate dependencies, not the independent overlays workspace.
const sharp=createRequire(path.resolve('package.json'))('sharp');

const root='public';
const stats={webp:0,png:0,jpg:0,svg:0,removed:0,props:0,weapons:0,mounts:0};
function walk(directory, callback) {
  if(!fs.existsSync(directory)) return;
  for(const item of fs.readdirSync(directory,{withFileTypes:true})) {
    const file=path.join(directory,item.name);
    if(item.isDirectory())walk(file,callback);
    else if(item.isFile())callback(file);
  }
}
const generic=sharp({
  create:{width:128,height:128,channels:4,background:'#21374e'}
});
const [webp,png,jpg]=await Promise.all([
  generic.clone().webp({quality:72}).toBuffer(),
  generic.clone().png().toBuffer(),
  generic.clone().jpeg({quality:75}).toBuffer()
]);
const bareSvg='<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" rx="16" fill="#21374e"/><path d="M64 18L96 64 64 110 32 64Z" fill="#d1ae70"/></svg>';

function replaceArt(file){
  const ext=path.extname(file).toLowerCase();
  if(ext==='.webp'){fs.writeFileSync(file,webp);stats.webp++;}
  else if(ext==='.png'){fs.writeFileSync(file,png);stats.png++;}
  else if(ext==='.jpg'||ext==='.jpeg'){fs.writeFileSync(file,jpg);stats.jpg++;}
  else if(ext==='.svg'){fs.writeFileSync(file,bareSvg);stats.svg++;}
}

// The entire donor UI paint library includes premium icons & commissioned art.
// For the HIGHFLY alpha, every raster/icon under UI is a neutral placeholder.
walk(path.join(root,'ui'),replaceArt);
walk(path.join(root,'map_art'),replaceArt);
walk(path.join(root,'website'),replaceArt);
walk(root,(file)=>{
  if(path.dirname(file)!==root)return;
  const name=path.basename(file);
  if(/^website[-_]/i.test(name)||/worldofclaudecraft[-_]?logo/i.test(name)){
    replaceArt(file);
  }
});

// An external paid asset must not be included in the staged web distribution.
for(const p of ['claudium','audio/voice/ignivar','audio/voice/varkhul']) {
  const dir=path.join(root,p);
  if(fs.existsSync(dir)){fs.rmSync(dir,{recursive:true,force:true});stats.removed++;}
}
const clock=path.join(root,'audio/sfx/temporal_clock.mp3');
if(fs.existsSync(clock)){fs.rmSync(clock);stats.removed++;}

// Preserve KayKit/Quaternius bodies, terrain and rigs. Weapon art mixes licensed
// sources, so the alpha uses one known CC0 KayKit sword as a visual placeholder
// for all old donor weapon variants. Rig_Medium sockets continue to function.
const weaponDir=path.join(root,'models/weapons');
const sword=path.join(weaponDir,'sword_1handed.glb');
if(!fs.existsSync(sword))throw Error('HIGHFLY_SANITIZE_KAYKIT_SWORD_NOT_FOUND');
const swordBytes=fs.readFileSync(sword);
walk(weaponDir,file=>{
  if(file.endsWith('.glb')){
    fs.writeFileSync(file,swordBytes);
    stats.weapons++;
  }
});

// Remove or replace exact restricted media. Project-only fork-redistributable
// world props remain untouched.
const propPlaceholder=path.join(root,'models/props/fallback_crate.glb');
if(!fs.existsSync(propPlaceholder))throw Error('HIGHFLY_SANITIZE_CRATE_MISSING');
const crateBytes=fs.readFileSync(propPlaceholder);
const noReuseProps=[
  'reeds.glb','eastbrook_ferry.glb','harbor_route_marker.glb',
  'wyrmwatch_harbor.glb','wickharbor_wharf.glb','wickharbor_harbor.glb'
];
for(const name of noReuseProps){
  const file=path.join(root,'models/props',name);
  if(fs.existsSync(file)){fs.writeFileSync(file,crateBytes);stats.props++;}
}
const mountDir=path.join(root,'models/mounts');
const safeMount=path.join(mountDir,'avian_strider.glb');
if(!fs.existsSync(safeMount))throw Error('HIGHFLY_SANITIZE_MOUNT_MISSING');
const safeMountBytes=fs.readFileSync(safeMount);
for(const name of ['terrorspark_groundshaker.glb','goblin_rocket_sled.glb','lanternback_troll.glb','chimeglass_tortoise.glb']){
  const f=path.join(mountDir,name);
  if(fs.existsSync(f)){fs.writeFileSync(f,safeMountBytes);stats.mounts++;}
}
for(const name of ['harbormaster_tricorne.glb','harbormaster_spyglass.glb']){
  const p=path.join(root,'models/chars/npc_gear',name);
  if(fs.existsSync(p)){fs.rmSync(p);stats.removed++;}
}

// Preserve only the user's project's original name/URL. The native index
// automatically enters HIGHFLY without requiring a query parameter.
const index='index.html',html=fs.readFileSync(index,'utf8');
const marker='<script type="module" src="/src/main.ts"></script>';
const redirect="<script>(function(){var u=new URL(location.href);if(!u.searchParams.has('hfWorld')){u.searchParams.set('hfWorld','1');location.replace(u.href)}})();</script>";
if(html.split(marker).length!==2)throw Error('HIGHFLY_SANITIZE_INDEX_ANCHOR_DRIFT');
fs.writeFileSync(index,html.replace(marker,redirect+'\n  '+marker));
console.log('HIGHFLY_GENESIS_PUBLIC_ASSET_SANITIZATION='+JSON.stringify(stats));
