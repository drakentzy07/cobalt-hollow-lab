#!/usr/bin/env node
// HIGHFLY CLEAN REBORN C0: read-only license inventory for the exact 0.44.7 donor.
// Does NOT delete, recolor, copy or replace original assets. Audit != clearance.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const candidate=path.resolve(process.argv[2]||'candidate');
const output=path.resolve(process.argv[3]||'reborn-report');
const publicRoot=path.join(candidate,'public');
const credits=path.join(candidate,'CREDITS.md');
if (!fs.existsSync(credits) || !fs.existsSync(publicRoot)) throw Error('C0_EXPECTED_CLEAN_UPSTREAM_TREE_MISSING');
const creditText=fs.readFileSync(credits,'utf8');
for(const required of ['With the project only','No, permission required','CraftPix','Quaternius','KayKit'])
  if(!creditText.includes(required))throw Error('C0_CREDITS_CHANGED_'+required);

const inventory=[];
function walk(relative, cb){
  const d=path.join(publicRoot,relative);
  if(!fs.existsSync(d))return;
  for(const e of fs.readdirSync(d,{withFileTypes:true})){
    const r=path.posix.join(relative,e.name), absolute=path.join(publicRoot,r);
    if(e.isDirectory())walk(r,cb);
    else if(e.isFile())cb(r,absolute);
  }
}
const graphic=/\.(?:webp|png|jpg|jpeg|svg)$/i;
const add=(rel,status,reason,substitute)=>inventory.push({path:'public/'+rel,status,reason,substitute});
const exact=new Set();
function collect(prefix,status,reason,substitute){
  walk(prefix,(rel)=>{if(graphic.test(rel)){
    add(rel,status,reason,substitute);exact.add(rel);
  }});
}
const restricted='REPLACE_BEFORE_DISTRIBUTION';
const review='REVIEW_PER_FILE';
const skillReplacement='Original HIGHFLY icon; interim neutral glyph drawn in-house (not CraftPix)';
collect('ui/skills',restricted,'Class ability artwork: CraftPix or owner-specific license; intentionally replace entire icon system',skillReplacement);
collect('ui/deeds',restricted,'Prestige/Book of Deeds paintings reserved','HIGHFLY original achievement glyph');
collect('ui/professions',restricted,'Commissioned Professions 2.0 illustrations reserved','HIGHFLY own profession glyph');
collect('ui/auras',review,'Mixed provenance; inspect CREDITS and mappings','Keep permitted entries; original glyph where restricted');
collect('ui/chrome',review,'Mixed, includes reserved art','Inspect per file; own neutral glyph for reserved');
collect('ui/crests',review,'Provenance must be established','Licensed CC0 or HIGHFLY design');
collect('ui/currency',review,'Provenance must be established','Original HIGHFLY currency artwork');
collect('ui/delve-affixes',review,'Provenance must be established','Original effect icon');
collect('ui/fiesta',review,'Provenance must be established','Original interface icon');
collect('ui/map-markers',review,'Some project-created reserved paintings','Own UI marker');
collect('ui/specs',review,'Some class specialization art reserved','HIGHFLY specialization icon if retained');
collect('ui/store/armory',restricted,'Season 1 Armory catalog art reserved','KayKit CC0 equipment render or own icon');
collect('claudium',restricted,'Claudium visual catalog reserved','Remove from HIGHFLY UI or use original assets');
collect('ui/items',review,'Mixed provenance and per-item mapping: DO NOT blanket replace','Keep licensed art; draw only reserved entries');
collect('ui/weapons',review,'Mixed KayKit and rights-reserved Season 1 artwork','Keep licensed weapon art; render CC0 model for reserved item');
const special=['ui/ranks/elite-dragon-frame.webp','ui/reliquary/perfect_specimen.webp',
  'ui/leaderboard/medal_gold.webp','ui/leaderboard/medal_silver.webp','ui/leaderboard/medal_bronze.webp',
  'map_art/world_overview.webp','audio/sfx/temporal_clock.mp3'];
for(const r of special){if(fs.existsSync(path.join(publicRoot,r)))add(r,restricted,'Rights-reserved or used with non-transferable permission','HIGHFLY own visual / license-cleared sound');}
const reservedModels=[
  'models/props/reeds.glb','models/props/eastbrook_ferry.glb','models/props/harbor_route_marker.glb',
  'models/props/wyrmwatch_harbor.glb','models/props/wickharbor_wharf.glb','models/props/wickharbor_harbor.glb',
  'models/chars/npc_gear/harbormaster_tricorne.glb','models/chars/npc_gear/harbormaster_spyglass.glb',
  'models/mounts/terrorspark_groundshaker.glb','models/mounts/goblin_rocket_sled.glb',
  'models/mounts/lanternback_troll.glb','models/mounts/chimeglass_tortoise.glb'
];
for(const r of reservedModels)if(fs.existsSync(path.join(publicRoot,r)))add(r,restricted,'Model with rights reserved in upstream credits','Kenney/Quaternius CC0 equivalent fitted to gameplay');
const seasonIds=new Set(['ashspark_shiv','brasscap_hatchet','brasscrown_walking_staff','cinderbrand','cinderlatch','emberbite','fletcher_s_guild_bow','forgeheart_stave','frostbite','glaciersplit','ice_fang','lacquered_rod','rimecrusher','shard_of_everwinter','smoulderfall','tempered_flanged_mace','winterbite']);
const reservedName=/^(purple_|redskull_|emberfang_sword$|guildmark_|emberwrought_|hoarfrost_|astravyr_|cosmarch_|encore_|starfall_|skyrender_|meteorlatch_|solheim_|emberwish_|tome_)/;
walk('models/weapons',(rel)=>{if(!rel.endsWith('.glb'))return;
  const stem=path.basename(rel,'.glb').toLowerCase();
  if(seasonIds.has(stem)||reservedName.test(stem))add(rel,restricted,'Claudium/Season 1 model, reserved','KayKit CC0 weapon with compatible attachment');
});
walk('audio/voice/ignivar',(rel)=>{if(rel.endsWith('.mp3'))add(rel,review,'Voice rights to be verified','License-cleared sound or text-only line');});
walk('audio/voice/varkhul',(rel)=>{if(rel.endsWith('.mp3'))add(rel,review,'Voice rights to be verified','License-cleared sound or text-only line');});
walk('',(rel)=>{
 if(!graphic.test(rel))return;
 if((/^website[-_]/i.test(rel)||/worldofclaudecraft[-_]?logo/i.test(rel))&& !rel.includes('/'))
   add(rel,restricted,'Brand/website art reserved','HIGHFLY own brand');
});
const allowExamples=[
 ['models/chars/modular','CC0 KayKit character assets'],
 ['models/creatures','CC0 Quaternius or project-only within fork; validate model provenance individually'],
 ['textures/foliage','CC0 ambientCG foliage maps'],
 ['textures/structures','CC0/attribution Poly Haven and ambientCG structure maps'],
 ['models/props','Mixed; keep CC0 and with-project-only, review unknowns']
];
const snapshot=[];
for(const [folder,reason] of allowExamples){
 let count=0, bytes=0, hash=crypto.createHash('sha256');
 walk(folder,(rel,file)=>{if(count<100000){count++;const st=fs.statSync(file);bytes+=st.size;hash.update(rel);hash.update(String(st.size));}});
 snapshot.push({folder,count,bytes,listingFingerprint:hash.digest('hex'),policy:reason});
}
if(inventory.filter(a=>a.status===restricted&&a.path.startsWith('public/ui/skills/')).length<50)
 throw Error('C0_SKILL_ICON_INVENTORY_UNEXPECTEDLY_EMPTY');
inventory.sort((a,b)=>a.path.localeCompare(b.path));
fs.mkdirSync(output,{recursive:true});
const report={
  upstream:'levy-street/world-of-claudecraft@493c35a108cef6c8aa290e8793107b1cd117886e',
  releaseSafe:false,
  statement:'Discovery inventory only. Unlisted media are not assumed reusable; no files altered.',
  counts:{mustReplace:inventory.filter(x=>x.status===restricted).length,
    requiresReview:inventory.filter(x=>x.status===review).length},
  snapshots:snapshot,entries:inventory
};
fs.writeFileSync(path.join(output,'asset-inventory.json'),JSON.stringify(report,null,2)+'\n');
let md='# REBORN C0 — Inventario preliminar\n\nFuente: v0.44.7 CREDITS.md original. **No autoriza publicación**.\n\n';
md+='Recursos bloqueados identificados: '+report.counts.mustReplace+'; elementos para revisión por archivo: '+report.counts.requiresReview+'.\n\n';
md+='No se modificaron los recursos originales. CC0 y With the project only se conservan en el fork.\n\n';
md+='La lista detallada de rutas, riesgos y alternativas está en asset-inventory.json.\n';
fs.writeFileSync(path.join(output,'README.md'),md);
console.log('HIGHFLY_REBORN_C0_LICENSE_INVENTORY='+JSON.stringify(report.counts));
console.log('HIGHFLY_REBORN_C0_PUBLISH_BLOCKED_UNTIL_REPLACEMENTS_AND_PROVENANCE=PASS');
console.log('HIGHFLY_REBORN_C0_ORIGINAL_VISUAL_ASSETS_UNCHANGED=PASS');
