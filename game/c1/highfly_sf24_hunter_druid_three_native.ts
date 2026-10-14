/** HIGHFLY SF24: 3 original source-native Hunter/Druid fusion mechanics.
 * Real 6-tick ranged channel, melee+moon DoT, melee+double DoT+self Thorns.
 * Absolutely no new Sim, shaders or VFX; donor-ID-specific procs not claimed.
 */
import type {AbilityDef,AbilityEffect} from '../sim/types';
import {HIGHFLY_FUSED_SKILLS,type HighflyClass,type HighflyFusionSpec} from './sf3_skill_catalog';
type Registry=Record<string,AbilityDef>;
type Classes=Record<HighflyClass,{abilities:string[]}>;
export const SF24_IDS=['hf_hunter_u1','hf_druid_s1','hf_druid_s2'] as const;
type Id=typeof SF24_IDS[number];
const CONTRACT:Record<Id,string>={
 hf_hunter_u1:'rapid_fire,bloodtrail_assault',
 hf_druid_s1:'claw,moonfire',
 hf_druid_s2:'rake,insect_swarm,thorns'
};
function at(d:AbilityDef,lv:number):AbilityEffect[]{
 let fx=d.effects;for(const r of d.ranks??[])if(r.level<=lv)fx=r.effects;
 return fx.map(e=>({...e}));
}
function fuse(s:HighflyFusionSpec,ds:AbilityDef[],lv:number):AbilityEffect[]{
 const [a,b,c]=ds.map(d=>at(d,lv));
 if(s.id==='hf_hunter_u1'){
  if(a.length!==1||a[0].type!=='directDamage'||
     b.length!==1||b[0].type!=='selfBuff'||b[0].kind!=='hunter_bloodtrail')
   throw Error('SF24 pinned Hunter source ranks changed '+lv);
  // Original 6-shot channel dispatches original per-tick projectile damage.
  // Source buff is refreshed through same native channel; it is NOT the
  // rapid_fire-ID-only Coldsight final-shot award.
  return [a[0],{...b[0],auraId:'hf_hunter_u1_bloodtrail'}];
 }
 if(s.id==='hf_druid_s1'){
  if(a.length!==1||a[0].type!=='weaponStrike'||
     b.length!==2||b[0].type!=='directDamage'||b[1].type!=='dot')
   throw Error('SF24 pinned Druid Lunar shapes changed '+lv);
  // A source-authored ranged Moonfire packet meets original melee Claw.
  // Adapts form-only donor to 1st skill at LV1, does NOT silently force Cat.
  return [a[0],b[0],{...b[1],auraId:'hf_druid_s1_lunar',school:'arcane'}];
 }
 if(s.id==='hf_druid_s2'){
  if(a.length!==2||a[0].type!=='weaponStrike'||a[1].type!=='dot'||
     b.length!==1||b[0].type!=='dot'||
     c.length!==1||c[0].type!=='buffTarget'||c[0].kind!=='thorns')
   throw Error('SF24 pinned Druid Briar source shapes changed '+lv);
  // Separate DOT identities are essential: native dot handler uses auraId
  // else ability.id, so untagged double-DoT would overwrite the first.
  // Thorns' source is FRIENDLY: make an original selfBuff on the caster,
  // never erroneously buff the attacked hostile target.
  return [a[0],
    {...a[1],auraId:'hf_druid_s2_rake'},
    {...b[0],auraId:'hf_druid_s2_swarm',school:'nature'},
    {type:'selfBuff',kind:c[0].kind,value:c[0].value,duration:c[0].duration,
     auraId:'hf_druid_s2_thorns'}];
 }
 throw Error('SF24 unrecognized fusion '+s.id);
}
function build(s:HighflyFusionSpec,ds:AbilityDef[]):AbilityDef{
 const id=s.id as Id,[a,b,c]=ds;
 if(!CONTRACT[id]||s.donors.join(',')!==CONTRACT[id]||
   ds.length!==(id==='hf_druid_s2'?3:2)||
   ds.some((d,i)=>!d||d.id!==s.donors[i]||d.class!==s.classId||
     d.passive||d.hiddenFromPlayer||d.requiresQuest||d.requiresAuraKind))
  throw Error('SF24 source contract missing/mutated '+s.id);
 if(id==='hf_hunter_u1'&&(
   a.school!=='physical'||!a.requiresTarget||a.range!==35||
   a.minRange!==8||a.channel?.ticks!==6||a.channel?.duration!==2.4||
   a.scalesWith!=='ranged'||b.requiresTarget||b.range!==0||!b.offGcd))
  throw Error('SF24 Hunter 6-tick source channel contract changed');
 if(id==='hf_druid_s1'&&(
   a.school!=='physical'||!a.requiresTarget||a.range!==0||
   a.requiresForm!=='cat'||!a.awardsCombo||b.school!=='arcane'||
   !b.requiresTarget||b.range!==30||a.channel||b.channel))
  throw Error('SF24 Druid Lunar original aim/form contract changed');
 if(id==='hf_druid_s2'&&(
   a.requiresForm!=='cat'||a.range!==0||!a.requiresTarget||
   !a.awardsCombo||b.range!==30||b.school!=='nature'||
   c.targetType!=='friendly'||c.range!==30||
   c.requiresTarget!==true||a.channel||b.channel||c.channel))
  throw Error('SF24 Druid dual-DOT friendly buff contract changed');
 const rows=[...new Set([s.unlockLevel,...ds.flatMap(d=>(d.ranks??[])
    .filter(r=>r.level>s.unlockLevel&&r.level<=99).map(r=>r.level))])]
    .sort((x,y)=>x-y).map(lv=>({lv,fx:fuse(s,ds,lv)}));
 const fields:Partial<AbilityDef>={
  specs:undefined,excludeSpecs:undefined,excludeSpecsAtLevel:undefined,
  requiresAuraKind:undefined,requiresForm:undefined,
  hiddenFromPlayer:undefined,requiresQuest:undefined,
  actionReplacement:undefined,maxCharges:undefined,offGcd:undefined,
  targetType:undefined,requiresStealth:undefined,
  cost:id==='hf_hunter_u1'?0:id==='hf_druid_s1'?45:35,
  cooldown:id==='hf_hunter_u1'?90:id==='hf_druid_s1'?4:12,
  castTime:0,requiresTarget:true,targetMode:undefined,
  range:id==='hf_hunter_u1'?35:0,
  minRange:id==='hf_hunter_u1'?8:undefined,
  channel:id==='hf_hunter_u1'?a.channel:undefined,
  castWhileMoving:id==='hf_hunter_u1'?true:undefined,
  projectile:id==='hf_hunter_u1'?true:false,
  scalesWith:id==='hf_hunter_u1'?'ranged':undefined,
  school:id==='hf_hunter_u1'?'physical':id==='hf_druid_s1'?'arcane':'physical',
  awardsCombo:id==='hf_hunter_u1'?undefined:1,
  spendsCombo:undefined,
  description:'HIGHFLY SF24 '+s.name+': native ORIGINAL '+s.donors.join(' + ')+
   '. Per-element renderer and donor-ID-specific extra procs not certified.'
 };
 return {...a,...fields,id:s.id,class:s.classId,name:s.name,
   learnLevel:s.unlockLevel,effects:rows[0].fx,
   ranks:rows.slice(1).map((x,i)=>({rank:i+2,level:x.lv,
     cost:fields.cost!,effects:x.fx}))};
}
export function installSf24ThreeNative(abilities:Registry,classes:Classes):string[]{
 const all=Object.values(HIGHFLY_FUSED_SKILLS).flat();
 const staged:{id:string;cls:HighflyClass;def:AbilityDef}[]=[];
 for(const id of SF24_IDS){
  const s=all.find(x=>x.id===id);
  if(!s||abilities[id]||!classes[s.classId]?.abilities||
     classes[s.classId].abilities.includes(id)||s.donors.join(',')!==CONTRACT[id])
   throw Error('SF24 catalog duplicate or missing '+id);
  staged.push({id,cls:s.classId,def:build(s,s.donors.map(d=>abilities[d]))});
 }
 if(staged.length!==3)throw Error('SF24 expected 3');
 for(const x of staged){abilities[x.id]=x.def;classes[x.cls].abilities.push(x.id);}
 return staged.map(x=>x.id);
}
