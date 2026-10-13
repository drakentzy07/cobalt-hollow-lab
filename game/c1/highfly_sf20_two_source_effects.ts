/**
 * HIGHFLY SF20 — native ORIGINAL ClaudeCraft two multi-effect recipes.
 * No parallel combat, projectile, spell or CC dispatchers. All IDs fail closed.
 * Donor-ID procs are not asserted as inherited. VFX visual QA remains separate.
 */
import type {AbilityDef,AbilityEffect} from '../sim/types';
import {HIGHFLY_FUSED_SKILLS,type HighflyClass,type HighflyFusionSpec} from './sf3_skill_catalog';
type Registry=Record<string,AbilityDef>;
type Classes=Record<HighflyClass,{abilities:string[]}>;
export const SF20_IDS=['hf_mage_u1','hf_rogue_s5'] as const;
const DONOR:Record<typeof SF20_IDS[number],string>={
 hf_mage_u1:'meteor,frozen_orb',
 hf_rogue_s5:'gouge,kick,kidney_shot'
};
function at(d:AbilityDef,lv:number):AbilityEffect[]{
 let e=d.effects;for(const r of d.ranks??[])if(r.level<=lv)e=r.effects;
 return e.map(x=>({...x}));
}
function costAt(d:AbilityDef,lv:number):number{
 let cost=d.cost;for(const r of d.ranks??[])if(r.level<=lv)cost=r.cost;
 return cost;
}
function stages(s:HighflyFusionSpec,ds:AbilityDef[]):number[]{
 return [...new Set([s.unlockLevel,...ds.flatMap(d=>(d.ranks??[])
  .filter(r=>r.level>s.unlockLevel&&r.level<=99).map(r=>r.level))])]
  .sort((a,b)=>a-b);
}
function nativeFx(s:HighflyFusionSpec,ds:AbilityDef[],lv:number):AbilityEffect[]{
 const [a,b,c]=ds.map(d=>at(d,lv));
 if(s.id==='hf_mage_u1'){
  if(a.length!==1||a[0].type!=='groundAoE'||a[0].delayed!==true||
   b.length!==1||b[0].type!=='frozenOrb')
    throw Error('SF20 original meteoric orbit shape drift at '+lv);
  // BOTH original native handlers execute in the same instant ground cast:
  // a delayed meteor at castAim AND a drifting frost orb from the caster.
  // Two native spellfx/event streams; no invented orbital projectile.
  return [{...a[0],min:Math.round(a[0].min*.8),
    max:Math.round(a[0].max*.8)},
   {...b[0],min:Math.max(1,Math.round(b[0].min*.75)),
    max:Math.max(1,Math.round(b[0].max*.75))}];
 }
 if(s.id==='hf_rogue_s5'){
  if(a.length!==2||a[0].type!=='directDamage'||
   a[1].type!=='incapacitate'||b.length!==1||
   b[0].type!=='interrupt'||c.length!==1||
   c[0].type!=='finisherStun')
   throw Error('SF20 original rogue melee CC effect shape drift at '+lv);
  // Gouge's damage + Kick's interrupt + Kidney's combo-finisher stun.
  // Deliberately DO NOT layer a break-on-damage Gouge incapacitate over
  // Kidney's stun: two simultaneously active competing control modes are
  // not a coherent single strike. Native stun and school lockout remain.
  return [a[0],b[0],c[0]];
 }
 throw Error('SF20 unknown fusion ID '+s.id);
}
function build(s:HighflyFusionSpec,ds:AbilityDef[]):AbilityDef{
 const [a,b,c]=ds;
 const key=s.id as typeof SF20_IDS[number];
 if(!DONOR[key]||s.donors.join(',')!==DONOR[key]||
  !a||!b||a.id!==s.donors[0]||b.id!==s.donors[1]||
  ds.some(d=>!d||d.class!==s.classId||d.passive||d.hiddenFromPlayer||
   d.channel||d.requiresQuest||d.requiresAuraKind||d.requiresStealth||
   d.requiresForm))
  throw Error('SF20 original donor missing or changed '+s.id);
 if(key==='hf_mage_u1'&&(
  ds.length!==2||a.requiresTarget||b.requiresTarget||
  a.targetMode!=='position'||a.range!==30||a.school!=='fire'||
  b.range!==0||b.school!=='frost'||a.castTime!==0||b.castTime!==0))
  throw Error('SF20 meteor/orb position targeting drift');
 if(key==='hf_rogue_s5'&&(
  ds.length!==3||!c||ds.some(d=>!d.requiresTarget||d.range!==0||
   d.school!=='physical')||!c.spendsCombo||
  !a.awardsCombo||b.cooldown!==10||a.cooldown!==10))
  throw Error('SF20 rogue finisher combo/interrupt drift');
 const rows=stages(s,ds).map(lv=>({
  lv,fx:nativeFx(s,ds,lv),
  cost:key==='hf_mage_u1'?costAt(a,lv)+Math.ceil(costAt(b,lv)*.2):45
 }));
 const fields:Partial<AbilityDef>={
  specs:undefined,excludeSpecs:undefined,excludeSpecsAtLevel:undefined,
  hiddenFromPlayer:undefined,requiresQuest:undefined,
  requiresAuraKind:undefined,actionReplacement:undefined,
  maxCharges:undefined,channel:undefined,offGcd:undefined,
  cooldown:key==='hf_mage_u1'?75:25,cost:rows[0].cost,
  castTime:0,requiresTarget:key==='hf_rogue_s5',
  targetMode:key==='hf_mage_u1'?'position':undefined,
  range:key==='hf_mage_u1'?30:0,
  minRange:undefined,projectile:false,spendsCombo:key==='hf_rogue_s5'?true:undefined,
  awardsCombo:undefined,fearDr:undefined,
  description:'HIGHFLY SF20 '+s.name+': source-native composition '+s.donors.join(' + ')+
   '. Special donor-ID procs, new cross-element reactions and final VFX are not certified.'
 };
 return {...a,...fields,
  id:s.id,name:s.name,class:s.classId,learnLevel:s.unlockLevel,
  effects:rows[0].fx,
  ranks:rows.slice(1).map((r,i)=>({rank:i+2,level:r.lv,
   cost:r.cost,effects:r.fx}))};
}
export function installSf20TwoNative(abilities:Registry,classes:Classes):string[]{
 const specs=Object.values(HIGHFLY_FUSED_SKILLS).flat();
 const staged:{id:string;cls:HighflyClass;def:AbilityDef}[]=[];
 for(const id of SF20_IDS){
  const s=specs.find(x=>x.id===id);
  if(!s||abilities[id]||!classes[s.classId]?.abilities||
   classes[s.classId].abilities.includes(id)||
   s.donors.length!==(id==='hf_mage_u1'?2:3))
   throw Error('SF20 duplicate/missing fusion spec '+id);
  staged.push({id,cls:s.classId,def:build(s,s.donors.map(d=>abilities[d]))});
 }
 if(staged.length!==2)throw Error('SF20 exactly two new native skills');
 for(const x of staged){abilities[x.id]=x.def;classes[x.cls].abilities.push(x.id);}
 return staged.map(x=>x.id);
}
