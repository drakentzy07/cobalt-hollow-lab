/**
 * HIGHFLY SF18 — FOUR new source-audited original-engine mechanic fusions.
 * Original ClaudeCraft effects and channel/trap handlers; ZERO parallel engines.
 * Donor-exclusive ID procs, VFX and form model swaps are NOT automatically inherited.
 */
import type {AbilityDef,AbilityEffect} from '../sim/types';
import {HIGHFLY_FUSED_SKILLS,type HighflyClass,type HighflyFusionSpec} from './sf3_skill_catalog';
type Registry=Record<string,AbilityDef>;
type Classes=Record<HighflyClass,{abilities:string[]}>;
export const SF18_IDS=[
 'hf_hunter_s3','hf_hunter_u1','hf_shaman_s5','hf_mage_s2'
] as const;
const EXACT:Record<typeof SF18_IDS[number],string>={
 hf_hunter_s3:'frostjaw_trap,concussive_shot',
 hf_hunter_u1:'rapid_fire,bloodtrail_assault',
 hf_shaman_s5:'ghost_wolf,frost_shock',
 hf_mage_s2:'ice_lance,arcane_missiles'
};
function snapshot(d:AbilityDef,lv:number):AbilityEffect[]{
 let e=d.effects;for(const r of d.ranks??[])if(r.level<=lv)e=r.effects;
 return e.map(x=>({...x}));
}
function costAt(d:AbilityDef,lv:number):number{
 let c=d.cost;for(const r of d.ranks??[])if(r.level<=lv)c=r.cost;return c;
}
function stages(s:HighflyFusionSpec,d:AbilityDef[]):number[]{
 return [...new Set([s.unlockLevel,...d.flatMap(x=>(x.ranks??[])
  .filter(r=>r.level>s.unlockLevel&&r.level<=99).map(r=>r.level))])]
   .sort((a,b)=>a-b);
}
function effects(s:HighflyFusionSpec,a:AbilityDef,b:AbilityDef,lv:number):AbilityEffect[]{
 const x=snapshot(a,lv),y=snapshot(b,lv);
 if(s.id==='hf_hunter_s3'){
  if(x.map(e=>e.type).join(',')!=='frostjawTrap'||
   y.map(e=>e.type).join(',')!=='directDamage,slow'||
   x[0].type!=='frostjawTrap'||y[0].type!=='directDamage'||y[1].type!=='slow')
   throw Error('SF18 original frost trap + shot changed at '+lv);
  // Projectile contacts the selected mob, dropping the ORIGINAL armed native
  // trap; the other original effects provide ranged impact and slow.
  return [x[0],y[0],y[1]];
 }
 if(s.id==='hf_hunter_u1'){
  if(x.length!==1||x[0].type!=='directDamage'||
   y.length!==1||y[0].type!=='selfBuff'||y[0].kind!=='hunter_bloodtrail')
   throw Error('SF18 native rapid channel / Hunter buff changed at '+lv);
  // Every original tick keeps native projectile/damage mechanics.
  return [x[0],{...y[0],duration:8}];
 }
 if(s.id==='hf_shaman_s5'){
  if(x.length!==1||x[0].type!=='selfBuff'||x[0].kind!=='buff_speed'||
   y.map(e=>e.type).join(',')!=='directDamage,slow')
   throw Error('SF18 Ghost Wolf / Frost Shock changed at '+lv);
  // Combat mobility buff, not a permanent Ghost Wolf shapeshift.
  return [{...x[0],duration:6},y[0],y[1]];
 }
 if(s.id==='hf_mage_s2'){
  if(x.length!==1||x[0].type!=='directDamage'||
   y.length!==1||y[0].type!=='directDamage')
   throw Error('SF18 native mage lance / channel changed at '+lv);
  // Native Arcane Missiles remains a THREE-tick channel. Ice Lance adds
  // damage per missile; the engine resolves exactly one SP coefficient per tick.
  return [{...y[0],min:y[0].min+Math.round(x[0].min*.35),
   max:y[0].max+Math.round(x[0].max*.35)}];
 }
 throw Error('SF18 unexpected recipe '+s.id);
}
function build(s:HighflyFusionSpec,ds:AbilityDef[]):AbilityDef{
 const [a,b]=ds;
 const id=s.id;
 if(s.donors.length!==2||s.donors.join(',')!==EXACT[id as keyof typeof EXACT]||
  !a||!b||a.id!==s.donors[0]||b.id!==s.donors[1]||
  a.class!==s.classId||b.class!==s.classId||
  a.passive||b.passive||a.hiddenFromPlayer||b.hiddenFromPlayer||
  a.requiresForm||b.requiresForm||a.requiresStealth||b.requiresStealth||
  a.requiresQuest||b.requiresQuest||a.requiresAuraKind||b.requiresAuraKind)
  throw Error('SF18 missing or changed frozen donor '+id);
 if(id==='hf_hunter_s3'&&(
   a.effects[0]?.type!=='frostjawTrap'||a.requiresTarget||a.range!==30||
   b.minRange!==8||b.range!==35||!b.projectile||b.scalesWith!=='ranged'||
   !b.requiresTarget||b.school!=='physical'||a.channel||b.channel))
  throw Error('SF18 trap/shot targeting original changed');
 if(id==='hf_hunter_u1'&&(
   !a.channel||a.channel.duration!==2.4||a.channel.ticks!==6||
   !a.requiresTarget||a.minRange!==8||a.range!==35||!a.projectile||
   a.scalesWith!=='ranged'||b.requiresTarget||b.effects[0]?.type!=='selfBuff'))
  throw Error('SF18 hunter burst source changed');
 if(id==='hf_shaman_s5'&&(
   a.requiresTarget||a.effects[0]?.type!=='selfBuff'||b.requiresTarget!==true||
   b.range!==20||b.school!=='frost'||a.channel||b.channel))
  throw Error('SF18 wolf shock source changed');
 if(id==='hf_mage_s2'&&(
   a.channel||b.channel?.ticks!==3||b.channel.duration!==3||
   !a.requiresTarget||!b.requiresTarget||a.range!==30||b.range!==30||
   a.school!=='frost'||b.school!=='arcane'))
  throw Error('SF18 mage missile channel source changed');
 const start=id==='hf_hunter_s3'?b:
   id==='hf_hunter_u1'?a:
   id==='hf_mage_s2'?b:b;
 const cds:Record<typeof SF18_IDS[number],number>={
  hf_hunter_s3:30,hf_hunter_u1:90,hf_shaman_s5:20,hf_mage_s2:8
 };
 const levels=stages(s,ds),rows=levels.map(lv=>({
  lv,effects:effects(s,a,b,lv),
  cost:costAt(start,lv)+Math.ceil(costAt(start===a?b:a,lv)*.15)
 }));
 const added:Partial<AbilityDef>={
  id,name:s.name,class:s.classId,learnLevel:s.unlockLevel,
  cooldown:cds[id as keyof typeof cds],cost:rows[0].cost,
  effects:rows[0].effects,ranks:rows.slice(1).map((r,i)=>({
   rank:i+2,level:r.lv,cost:r.cost,effects:r.effects
  })),
  specs:undefined,excludeSpecs:undefined,excludeSpecsAtLevel:undefined,
  hiddenFromPlayer:undefined,requiresQuest:undefined,
  requiresAuraKind:undefined,actionReplacement:undefined,maxCharges:undefined,
  description:'SF18 '+s.name+': native ClaudeCraft original composition of '+
   s.donors.join(' + ')+'. Donor-ID proc bonuses and final skin/particle FX not certified.'
 };
 if(id==='hf_hunter_s3'){
  Object.assign(added,{requiresTarget:true,range:30,minRange:8,
   school:'physical',scalesWith:'ranged'});
 }
 if(id==='hf_hunter_u1'){
  Object.assign(added,{channel:{...a.channel},castWhileMoving:a.castWhileMoving});
 }
 if(id==='hf_shaman_s5'){
  Object.assign(added,{requiresTarget:true,range:20,castTime:0,
   school:'frost',channel:undefined,offGcd:undefined});
 }
 if(id==='hf_mage_s2'){
  Object.assign(added,{channel:{...b.channel},school:'arcane'});
 }
 return {...start,...added} as AbilityDef;
}
export function installSf18FourNative(abilities:Registry,classes:Classes):string[]{
 const catalog=Object.values(HIGHFLY_FUSED_SKILLS).flat();
 const staged:{id:string;cls:HighflyClass;def:AbilityDef}[]=[];
 for(const id of SF18_IDS){
  const s=catalog.find(x=>x.id===id);
  if(!s||abilities[id]||!classes[s.classId]?.abilities||
   classes[s.classId].abilities.includes(id))
   throw Error('SF18 duplicate/missing recipe '+id);
  staged.push({id,cls:s.classId,def:build(s,s.donors.map(d=>abilities[d]))});
 }
 if(staged.length!==4)throw Error('SF18 expected four');
 for(const x of staged){abilities[x.id]=x.def;classes[x.cls].abilities.push(x.id);}
 return staged.map(x=>x.id);
}
