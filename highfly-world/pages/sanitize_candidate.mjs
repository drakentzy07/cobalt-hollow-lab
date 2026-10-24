/**
 * Sanitize the public Genesis alpha build, never the repository's upstream code.
 * The donor code is MIT, but licensed art is separately controlled by CREDITS.md.
 * Replace (not redistribute) donor-specific paid/rights-reserved UI assets with
 * generic neutral images, and exclude known restricted media.
 *
 * This is a narrow source-led safeguard. Unlisted asset provenance is still
 * subject to review; never infer public redistribution rights from the MIT code.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
// Resolve pinned candidate dependencies, not the independent overlays workspace.
const sharp=createRequire(path.resolve('package.json'))('sharp');

const root='public';
const stats={webp:0,png:0,jpg:0,svg:0,removed:0,props:0,weapons:0,mounts:0,preserved:0,audio:0};
const replacedPaths=[];
function replaceTracked(file) {
  if(!/\.(webp|png|jpg|jpeg|svg)$/i.test(file))return;
  replacedPaths.push(file.replaceAll('\\','/').replace(/^public\//,''));
  replaceArt(file);
}
function keep(file){stats.preserved++;}
function replaceDir(relativePath, allowed=()=>false){
  walk(path.join(root,relativePath),file => {
    if (allowed(file)) keep(file); else replaceTracked(file);
  });
}
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

// License-ledger surgical scrub: CREDITS.md v0.44.7, lines 154-192.
// The original G2 mistakenly wiped ALL ~3,000 UI paintings, including
// reproducible mob portraits and resources allowed "With the project only".
// Leave all unlisted/allowed UI paths intact; target documented restricted art.
// Only these complete art families have an explicit restricted classification.
const restrictedUiDirs=[
 'skills','deeds','chrome','professions','auras',
 'currency','delve-affixes','fiesta','crests','map-markers'
];
for(const dir of restrictedUiDirs)replaceDir('ui/'+dir);
// v0.44.7 CREDITS.md restricts only seven classes' specialization images.
// Do NOT blanket-replace the warrior/mage family when the credits don't say so.
// Those two families remain pending separate provenance review.
const restrictedSpecClasses=new Set(['paladin','hunter','rogue','priest','shaman','warlock','druid']);
replaceDir('ui/specs',file=>{
  const cls=path.relative(path.join(root,'ui/specs'),file).split(path.sep)[0];
  return !restrictedSpecClasses.has(cls);
});
// Armory is a restricted commercial art catalog, not the whole Store folder.
// Keep unrelated fork/project UI and assets untouched.
replaceDir('ui/store/armory');
const armoryPromo=path.join(root,'ui/store/season-01-armory-promo.webp');
if(fs.existsSync(armoryPromo))replaceTracked(armoryPromo);
// The legacy Claudium sets and Season 1 renders are restricted; KayKit
// inventory weapon previews are not a reason to erase all weapon art.
const reservedHeldArt=(name)=>{
  const stem=name.toLowerCase().replace(/\.(jpg|jpeg|png|webp|glb)$/,'');
  return /^(purple_|redskull_|emberfang_sword$|guildmark_|emberwrought_|hoarfrost_|astravyr_|cosmarch_|encore_|starfall_|skyrender_|meteorlatch_|solheim_|emberwish_|tome_)/.test(stem);
};
replaceDir('ui/weapons',file=>!reservedHeldArt(path.basename(file)));
// Item paintings are mixed: explicitly fork-licensed bag icons MUST survive.
const freeForkBagIcons=new Set([
 'backpack.webp','linen_pouch.webp','travelers_knapsack.webp',
 'wolfhide_satchel.webp','gravewoven_bag.webp','mistcallers_duffel.webp'
]);
replaceDir('ui/items',file=>freeForkBagIcons.has(path.basename(file)));
// These are only the restricted pieces within otherwise mixed UI directories.
const specialPaintings=[
 'ui/ranks/elite-dragon-frame.webp',
 'ui/leaderboard/medal_gold.webp',
 'ui/leaderboard/medal_silver.webp',
 'ui/leaderboard/medal_bronze.webp',
 'ui/reliquary/perfect_specimen.webp',
];
for(const item of specialPaintings){
 const file=path.join(root,item);
 if(fs.existsSync(file))replaceTracked(file);
}
// Game render portraits, dungeons, environment/materials, loading backgrounds,
// and CC0 KayKit / Kenney / Quaternius artwork are PRESERVED unchanged.
walk(path.join(root,'ui/mobs'),keep);
walk(path.join(root,'ui/dungeons'),keep);
walk(path.join(root,'ui/classes'),keep);
walk(path.join(root,'textures/loading'),keep);
// Only the world_overview.webp map is rights-reserved; the 7 painted
// zone PNG overlays are licensed "With the project only" in CREDITS.md.
const restrictedMap=path.join(root,'map_art/world_overview.webp');
if(fs.existsSync(restrictedMap))replaceTracked(restrictedMap);
walk(root,(file)=>{
 if(path.dirname(file)!==root)return;
 const name=path.basename(file);
 if(/^website[-_]/i.test(name)||/worldofclaudecraft[-_]?logo/i.test(name)){
   replaceTracked(file);
 }
});

// Never DELETE runtime assets. Two missing NPC meshes blocked G3 already;
// deleted voice/audio can do the same in later zones. Replace restricted voice
// bytes with a licensed fork-owned generic SFX clip, keeping their exact paths.
const emptyVoice=path.join(root,'audio/sfx/amb_birds.mp3');
if(!fs.existsSync(emptyVoice))throw Error('HIGHFLY_LICENSED_SFX_FALLBACK_MISSING');
const voiceBytes=fs.readFileSync(emptyVoice);
for(const rel of ['audio/voice/ignivar','audio/voice/varkhul']){
 walk(path.join(root,rel),file=>{
   if(path.extname(file).toLowerCase()==='.mp3'){
     fs.writeFileSync(file,voiceBytes);
     stats.audio++;replacedPaths.push(file.replaceAll('\\','/').replace(/^public\//,''));
   }
 });
}
const clock=path.join(root,'audio/sfx/temporal_clock.mp3');
if(fs.existsSync(clock)){fs.writeFileSync(clock,voiceBytes);stats.audio++;replacedPaths.push('audio/sfx/temporal_clock.mp3');}
// Claudium paid paintings are not redistributable. Replace the artwork, not
// its folder, metadata, or any load-bearing file.
walk(path.join(root,'claudium'),file=>{
 if(/\.(webp|png|jpg|jpeg|svg)$/i.test(file))replaceTracked(file);
});

// KayKit original weapons, skeleton weapons, shields and gear are CC0.
// Only known rights-reserved sets are replaced; preserve every other weapon.
const weaponDir=path.join(root,'models/weapons');
const sword=path.join(weaponDir,'sword_1handed.glb');
if(!fs.existsSync(sword))throw Error('HIGHFLY_KAYKIT_SWORD_NOT_FOUND');
const swordBytes=fs.readFileSync(sword);
const blockedWeapon=(name)=>reservedHeldArt(name);
walk(weaponDir,file=>{
 if(!file.endsWith('.glb'))return;
 if(blockedWeapon(path.basename(file))) {
   fs.writeFileSync(file,swordBytes);
   stats.weapons++;
   replacedPaths.push(file.replaceAll('\\','/').replace(/^public\//,''));
 } else keep(file);
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
  if(fs.existsSync(file)){fs.writeFileSync(file,crateBytes);stats.props++;replacedPaths.push('models/props/'+name);}
}
const mountDir=path.join(root,'models/mounts');
const safeMount=path.join(mountDir,'avian_strider.glb');
if(!fs.existsSync(safeMount))throw Error('HIGHFLY_SANITIZE_MOUNT_MISSING');
const safeMountBytes=fs.readFileSync(safeMount);
for(const name of ['terrorspark_groundshaker.glb','goblin_rocket_sled.glb','lanternback_troll.glb','chimeglass_tortoise.glb']){
  const f=path.join(mountDir,name);
  if(fs.existsSync(f)){fs.writeFileSync(f,safeMountBytes);stats.mounts++;replacedPaths.push('models/mounts/'+name);}
}
// Restricted Harbormaster accessories ARE referenced by the native character
// preload. Deleting them made startup fail. Ship a legal invisible glTF2 scene
// at the SAME logical paths: valid parse, no third-party geometry/materials.
function emptyGlb() {
  const json=Buffer.from(JSON.stringify({
    asset:{version:'2.0',generator:'HIGHFLY Genesis neutral empty accessory'},
    scene:0,scenes:[{nodes:[]}],nodes:[]
  }), 'utf8');
  const padded=Buffer.alloc(Math.ceil(json.length/4)*4,0x20);
  json.copy(padded);
  const out=Buffer.alloc(12+8+padded.length);
  out.write('glTF',0,'ascii');
  out.writeUInt32LE(2,4);
  out.writeUInt32LE(out.length,8);
  out.writeUInt32LE(padded.length,12);
  out.write('JSON',16,'ascii');
  padded.copy(out,20);
  return out;
}
const blankAccessory=emptyGlb();
for(const name of ['harbormaster_tricorne.glb','harbormaster_spyglass.glb']){
  const p=path.join(root,'models/chars/npc_gear',name);
  if(!fs.existsSync(p))throw Error('HIGHFLY_G4_REQUIRED_NPC_GEAR_PATH_MISSING_'+name);
  fs.writeFileSync(p,blankAccessory);
  stats.props++;
  replacedPaths.push('models/chars/npc_gear/'+name);
}

// Preserve only the user's project's original name/URL. The native index
// automatically enters HIGHFLY without requiring a query parameter.
const index='index.html',html=fs.readFileSync(index,'utf8');
const marker='<script type="module" src="/src/main.ts"></script>';
const redirect="<script>(function(){var u=new URL(location.href);if(!u.searchParams.has('hfWorld')){u.searchParams.set('hfWorld','1');location.replace(u.href)}})();</script>";
if(html.split(marker).length!==2)throw Error('HIGHFLY_SANITIZE_INDEX_ANCHOR_DRIFT');
fs.writeFileSync(index,html.replace(marker,redirect+'\n  '+marker));
// Audit receipt survives Vite build in public/ (and therefore in dist/).
// Keep a file-level trail so fixes never silently destroy allowed content.
fs.writeFileSync(path.join(root,'highfly-license-audit.json'),JSON.stringify({
  source:'World of ClaudeCraft v0.44.7 CREDITS.md',
  policy:'retain CC0 and fork-licensed project art; replace restricted only',
  stats, replacedPaths:replacedPaths.sort()
},null,2)+'\n');
console.log('HIGHFLY_GENESIS_LICENSE_SELECTIVE_AUDIT='+JSON.stringify(stats));
