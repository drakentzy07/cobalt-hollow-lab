/**
 * HIGHFLY SF19: two original melee pipeline fusions; no new damage engine.
 * Warrior blends native weaponStrike rage generation + Redhand's guarded
 * cannotBeDodged and native maiming empower.
 * Rogue retains the original energy restore and per-combo armor shred.
 * External donor-ID-locked special procs are not claimed as inherited.
 */
import type {AbilityDef,AbilityEffect} from '../sim/types';
import {HIGHFLY_FUSED_SKILLS,type HighflyClass,type HighflyFusionSpec} from './sf3_skill_catalog';
type Registry=Record<string,AbilityDef>;
type Classes=Record<HighflyClass,{abilities:string[]}>;
export const SF19_IDS=['hf_warrior_s2','hf_rogue_u1'] as const;
const SOURCES:Record<typeof SF19_IDS[number],string>={
 hf_warrior_s2:'slam,overpower',
 hf_rogue_u1:'adrenaline_rush,expose_armor'
};
function at(d:AbilityDef,lv:number):AbilityEffect[]{
 let row=d.effects;for(const r of d.ranks??[])if(r.level<=lv)row=r.effects;
 return row.map(e=>({...e}));
}
function levels(s:HighflyFusionSpec,ds:AbilityDef[]):number[]{
 return [...new Set([s.unlockLevel,...ds.flatMap(d=>(d.ranks??[])
  .filter(r=>r.level>s.unlockLevel&&r.level<=99).map(r=>r.level))])]
  .sort((a,b)=>a-b);
}
function native(s:HighflyFusionSpec,a:AbilityDef,b:AbilityDef,lv:number):AbilityEffect[]{
 const A=at(a,lv),B=at(b,lv);
 if(s.id==='hf_warrior_s2'){
  if(A.length!==2||A[0].type!=='weaponStrike'||
   A[1].type!=='gainResource'||B.length!==2||
   B[0].type!=='weaponStrike'||B[1].type!=='selfBuff'||
   B[1].kind!=='overpower_charge'||B[0].cannotBeDodged!==true)
   throw Error('SF19 original Brute Swing/Redhand rank effects changed '+lv);
  return [{...A[0],
   bonus:A[0].bonus+Math.round(B[0].bonus*.6),
   cannotBeDodged:true},
   A[1],B[1]];
 }
 if(s.id==='hf_rogue_u1'){
  if(A.length!==1||A[0].type!=='gainResource'||
   B.length!==1||B[0].type!=='sunder'||B[0].perCombo!==true||
   B[0].maxStacks!==5)
   throw Error('SF19 original Quickened Blood/Armor Breach changed '+lv);
  return [{...A[0],amount:Math.round(A[0].amount*.75)},B[0]];
 }
 throw Error('SF19 unknown mechanic '+s.id);
}
function build(s:HighflyFusionSpec,donors:AbilityDef[]):AbilityDef{
 const [a,b]=donors;
 const key=s.id as typeof SF19_IDS[number];
 if(!SOURCES[key]||s.donors.join(',')!==SOURCES[key]||
  !a||!b||a.id!==s.donors[0]||b.id!==s.donors[1]||
  a.class!==s.classId||b.class!==s.classId||
  a.passive||b.passive||a.hiddenFromPlayer||b.hiddenFromPlayer||
  a.channel||b.channel||a.requiresStealth||b.requiresStealth||
  a.requiresForm||b.requiresForm||a.requiresAuraKind||b.requiresAuraKind||
  a.requiresQuest||b.requiresQuest)
  throw Error('SF19 original donor or ability contract changed '+s.id);
 if(key==='hf_warrior_s2'&&(
  !a.requiresTarget||!b.requiresTarget||a.range!==0||b.range!==0||
  a.cost!==0||a.school!=='physical'||b.school!=='physical'||
  a.onNextSwing||b.onNextSwing||b.maxCharges!==2||
  a.effects[0].type!=='weaponStrike'||b.effects[0].type!=='weaponStrike'))
  throw Error('SF19 source melee/rage/charges contract changed');
 if(key==='hf_rogue_u1'&&(
  a.requiresTarget||b.requiresTarget!==true||a.offGcd!==true||
  b.spendsCombo!==true||b.range!==0||a.school!=='physical'||
  b.school!=='physical'))
  throw Error('SF19 source combo/energy contract changed');
 const rows=levels(s,donors).map(lv=>({lv,effects:native(s,a,b,lv)}));
 const fields:Partial<AbilityDef>={
  specs:undefined,excludeSpecs:undefined,excludeSpecsAtLevel:undefined,
  hiddenFromPlayer:undefined,requiresQuest:undefined,
  requiresAuraKind:undefined,actionReplacement:undefined,maxCharges:undefined,
  cooldown:key==='hf_warrior_s2'?6:150,
  cost:key==='hf_warrior_s2'?0:b.cost,
  castTime:0,range:0,school:'physical',requiresTarget:true,
  offGcd:undefined,onNextSwing:undefined,
  awardsCombo:undefined,spendsCombo:key==='hf_rogue_u1'?true:undefined,
  description:'SF19 '+s.name+': mecánicas originales fusionadas de '+
   s.donors.join(' + ')+'. Procs ligados a nombres originales y VFX finales pendientes.'
 };
 return {...(key==='hf_warrior_s2'?a:b),...fields,
  id:s.id,name:s.name,class:s.classId,learnLevel:s.unlockLevel,
  effects:rows[0].effects,ranks:rows.slice(1).map((x,i)=>({
   rank:i+2,level:x.lv,cost:fields.cost!,effects:x.effects
  }))};
}
/** Atomic; do not register ANY ability on error. */
export function installSf19TwoNative(abilities:Registry,classes:Classes):string[]{
 const catalog=Object.values(HIGHFLY_FUSED_SKILLS).flat();
 const staged:{id:string;cls:HighflyClass;def:AbilityDef}[]=[];
 for(const id of SF19_IDS){
  const s=catalog.find(x=>x.id===id);
  if(!s||abilities[id]||!classes[s.classId]?.abilities||
   classes[s.classId].abilities.includes(id)||s.donors.length!==2)
   throw Error('SF19 missing/duplicate recipe '+id);
  staged.push({id,cls:s.classId,def:build(s,s.donors.map(d=>abilities[d]))});
 }
 if(staged.length!==2)throw Error('SF19 expected two');
 for(const x of staged){abilities[x.id]=x.def;classes[x.cls].abilities.push(x.id);}
 return staged.map(x=>x.id);
}
