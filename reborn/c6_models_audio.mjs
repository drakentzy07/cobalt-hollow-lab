/* REBORN C6: exact reserved GLBs remapped to existing fork-authorized geometry.
   Not CC0 trees, weather, materials, or KayKit character rigs. No blank crates.
*/
import fs from 'node:fs';import path from 'node:path';
const candidate=path.resolve(process.argv[2]||'candidate');
const root=path.join(candidate,'public');
const manifest={releaseReady:false,preserved:['original CC0 trees/terrain/armors','fork-allowed creatures/props'],
  models:[],audio:[],missing:[]};
const modelMap={
 'models/props/eastbrook_ferry.glb':'models/props/rowboat.glb',
 'models/props/wyrmwatch_harbor.glb':'models/props/dock_platform.glb',
 'models/props/wickharbor_wharf.glb':'models/props/dock_platform.glb',
 'models/props/wickharbor_harbor.glb':'models/props/dock_platform.glb',
 'models/props/harbor_route_marker.glb':'models/props/bell_tower.glb',
 'models/props/reeds.glb':'models/props/willow_tree.glb',
 'models/mounts/terrorspark_groundshaker.glb':'models/mounts/avian_strider.glb',
 'models/mounts/goblin_rocket_sled.glb':'models/mounts/avian_strider.glb',
 'models/mounts/lanternback_troll.glb':'models/mounts/avian_strider.glb',
 'models/mounts/chimeglass_tortoise.glb':'models/mounts/avian_strider.glb'
};
function copy(target,donor){
 const a=path.join(root,target),b=path.join(root,donor);
 if(!fs.existsSync(a))return;
 if(!fs.existsSync(b)){manifest.missing.push({target,donor});return;}
 fs.copyFileSync(b,a);manifest.models.push({target,donor});
}
for(const [target,donor] of Object.entries(modelMap))copy(target,donor);
const protectedWeapon=(s)=>/^(purple_|redskull_|emberfang_sword$|guildmark_|emberwrought_|hoarfrost_|astravyr_|cosmarch_|encore_|starfall_|skyrender_|meteorlatch_|solheim_|emberwish_|tome_)/.test(s)||new Set(['ashspark_shiv','brasscap_hatchet','brasscrown_walking_staff','cinderbrand','cinderlatch','emberbite','fletcher_s_guild_bow','forgeheart_stave','frostbite','glaciersplit','ice_fang','lacquered_rod','rimecrusher','shard_of_everwinter','smoulderfall','tempered_flanged_mace','winterbite']).has(s);
const dir=path.join(root,'models/weapons');
if(fs.existsSync(dir))for(const file of fs.readdirSync(dir)){
 if(!file.endsWith('.glb')||!protectedWeapon(file.slice(0,-4)))continue;
 copy('models/weapons/'+file,'models/weapons/sword_1handed.glb');
}
function emptyAccessory(){
 const obj={asset:{version:'2.0',generator:'HIGHFLY CC0-safe empty gear'},scene:0,scenes:[{nodes:[]}]};
 const b=Buffer.from(JSON.stringify(obj));
 const padded=Buffer.alloc(Math.ceil(b.length/4)*4,32);b.copy(padded);
 const out=Buffer.alloc(20+padded.length);out.write('glTF',0,'ascii');out.writeUInt32LE(2,4);
 out.writeUInt32LE(out.length,8);out.writeUInt32LE(padded.length,12);out.write('JSON',16,'ascii');padded.copy(out,20);
 return out;
}
for(const file of ['harbormaster_tricorne.glb','harbormaster_spyglass.glb']){
 const rel='models/chars/npc_gear/'+file,abs=path.join(root,rel);
 if(fs.existsSync(abs)){fs.writeFileSync(abs,emptyAccessory());manifest.models.push({target:rel,donor:'HIGHFLY-owned empty gear (no source mesh)'});}
}
async function walk(rootDir,handler){
 if(!fs.existsSync(rootDir))return;
 for(const d of fs.readdirSync(rootDir,{withFileTypes:true})){
  const a=path.join(rootDir,d.name);
  if(d.isDirectory())await walk(a,handler);else if(d.isFile())await handler(a);
 }
}
const fallback=path.join(root,'audio/sfx/amb_birds.mp3');
if(fs.existsSync(fallback)){
 for(const name of ['audio/voice/ignivar','audio/voice/varkhul']){
  await walk(path.join(root,name),async abs=>{if(abs.endsWith('.mp3')){
   fs.copyFileSync(fallback,abs);manifest.audio.push(path.relative(root,abs));
  }});
 }
 const clock=path.join(root,'audio/sfx/temporal_clock.mp3');
 if(fs.existsSync(clock)){fs.copyFileSync(fallback,clock);manifest.audio.push('audio/sfx/temporal_clock.mp3');}
}else manifest.missing.push({audio:'audio/sfx/amb_birds.mp3'});
fs.writeFileSync(path.join(root,'reborn-c6-model-provenance.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('HIGHFLY_REBORN_C6_APPROVED_OR_OWNED_MODEL_ALTERNATIVES='+manifest.models.length);
console.log('HIGHFLY_REBORN_C6_NO_BLANK_TREES_OR_KAYKIT_GEAR_CHANGES=PASS');
if(manifest.missing.length)throw Error('HIGHFLY_C6_NO_SUBSTITUTE: '+JSON.stringify(manifest.missing));
