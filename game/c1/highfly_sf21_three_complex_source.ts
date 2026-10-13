/**
 * HIGHFLY SF21 -- original source ONLY: three complex skills, no new renderer/VFX.
 * Legacy donor visuals remain in the shared Sim event pipeline. New ability
 * IDs do not automatically inherit hard-coded donor-ID visuals or procs.
 */
import type {AbilityDef,AbilityEffect} from '../sim/types';
import {HIGHFLY_FUSED_SKILLS,type HighflyClass,type HighflyFusionSpec} from './sf3_skill_catalog';
type Registry=Record<string,AbilityDef>;
type Classes=Record<HighflyClass,{abilities:string[]}>;
export const SF21_IDS=['hf_paladin_u2','hf_hunter_u2','hf_warlock_s4'] as const;
const CONTRACT:Record<typeof SF21_IDS[number],string>={
 hf_paladin_u2:'divine_ascension,avenging_wrath',
 hf_hunter_u2:'stampede,pack_command',
 hf_warlock_s4:'evil_eye,fear'
};
function snap(d:AbilityDef,l:number):AbilityEffect[]{
 let e=d.effects;
 for(const r of d.ranks??[])if(r.level<=l)e=r.effects;
 return e.map(x=>({...x}));
}
function levels(s:HighflyFusionSpec,ds:AbilityDef[]):number[]{
 return [...new Set([s.unlockLevel,...ds.flatMap(d=>(d.ranks??[])
  .filter(r=>r.level>s.unlockLevel&&r.level<=99).map(r=>r.level))])].sort((a,b)=>a-b);
}
function fx(s:HighflyFusionSpec,a:AbilityDef,b:AbilityDef,l:number):AbilityEffect[]{
 const x=snap(a,l),y=snap(b,l);
 if(s.id==='hf_paladin_u2'){
  if(x.length!==1||x[0].type!=='divineAscension'||y.length!==3||
   y[0].type!=='selfBuff'||y[0].kind!=='buff_dmg_done'||
   y[1].type!=='selfBuff'||y[1].kind!=='buff_healing_done'||
   y[2].type!=='grantDevotion'||y[2].amount!==10)
   throw Error('SF21 original paladin ascension rank changed '+l);
  // The original ascension requires a Devotion bank. The source Zealwing
  // grants 10 BEFORE that guarded native effect; no fake unlock/proc.
  // Buffs need SEPARATE aura IDs or one silently deletes the other.
  return [y[2],x[0],{...y[0],auraId:s.id+'_damage'},
   {...y[1],auraId:s.id+'_healing'}];
 }
 if(s.id==='hf_hunter_u2'){
  if(x.length!==1||x[0].type!=='hunterStampede'||x[0].beasts!==3||
   y.length!==1||y[0].type!=='packCommand')
   throw Error('SF21 native hunter guardians/pet shape changed '+l);
  // Stampede is fully native; Pack Command hits only when a real pet exists,
  // exactly like source, never a fictional companion.
  return [x[0],y[0]];
 }
 if(s.id==='hf_warlock_s4'){
  if(x.length!==1||x[0].type!=='afflictionEvilEye'||
   y.length!==1||y[0].type!=='incapacitate')
   throw Error('SF21 original affliction eye/fear changed '+l);
  return [x[0],y[0]];
 }
 throw Error('SF21 unknown native recipe '+s.id);
}
function build(s:HighflyFusionSpec,a:AbilityDef,b:AbilityDef):AbilityDef{
 const key=s.id as typeof SF21_IDS[number];
 if(!CONTRACT[key]||s.donors.join(',')!==CONTRACT[key]||
  !a||!b||a.class!==s.classId||b.class!==s.classId||
  a.id!==s.donors[0]||b.id!==s.donors[1]||
  a.passive||b.passive||a.hiddenFromPlayer||b.hiddenFromPlayer||
  a.channel||b.channel||a.requiresStealth||b.requiresStealth||
  a.requiresForm||b.requiresForm||a.requiresQuest||b.requiresQuest)
  throw Error('SF21 frozen source contract violated '+s.id);
 if(key==='hf_paladin_u2'&&(
  a.requiresTarget||b.requiresTarget||a.school!=='holy'||
  b.school!=='holy'||a.effects[0]?.type!=='divineAscension'||
  b.offGcd!==true||a.offGcd!==true))
  throw Error('SF21 paladin source timing/devotion changed');
 if(key==='hf_hunter_u2'&&(
  !a.requiresTarget||!b.requiresTarget||a.range!==35||b.range!==35||
  a.school!=='physical'||b.school!=='physical'))
  throw Error('SF21 native pet target gate changed');
 if(key==='hf_warlock_s4'&&(
  !a.requiresTarget||!b.requiresTarget||a.range!==30||b.range!==20||
  a.school!=='shadow'||b.school!=='shadow'||b.fearDr!==true))
  throw Error('SF21 native curse/fear requirements changed');
 const ds=[a,b];const rows=levels(s,ds).map(l=>({lv:l,fx:fx(s,a,b,l)}));
 const overrides:Partial<AbilityDef>={
  specs:undefined,excludeSpecs:undefined,excludeSpecsAtLevel:undefined,
  actionReplacement:undefined,hiddenFromPlayer:undefined,
  requiresQuest:undefined,requiresAuraKind:undefined,channel:undefined,
  offGcd:undefined,maxCharges:undefined,projectile:false,
  cooldown:key==='hf_paladin_u2'?120:key==='hf_hunter_u2'?90:25,
  cost:key==='hf_paladin_u2'?0:key==='hf_hunter_u2'?0:55,
  castTime:key==='hf_warlock_s4'?1.5:0,
  requiresTarget:key!=='hf_paladin_u2',
  range:key==='hf_paladin_u2'?0:key==='hf_hunter_u2'?35:20,
  fearDr:key==='hf_warlock_s4'?true:undefined,
  description:'SF21 '+s.name+': native source fusion of '+s.donors.join(' + ')+
   '. Original FX/events only; donor-ID-specific visuals/procs not guaranteed.'
 };
 return {...a,...overrides,id:s.id,name:s.name,class:s.classId,
  learnLevel:s.unlockLevel,effects:rows[0].fx,
  ranks:rows.slice(1).map((r,i)=>({rank:i+2,level:r.lv,
   cost:overrides.cost!,effects:r.fx}))};
}
export function installSf21ThreeNative(abilities:Registry,classes:Classes):string[]{
 const catalog=Object.values(HIGHFLY_FUSED_SKILLS).flat();
 const staged:{id:string;cls:HighflyClass;def:AbilityDef}[]=[];
 for(const id of SF21_IDS){
  const s=catalog.find(x=>x.id===id);
  if(!s||abilities[id]||!classes[s.classId]?.abilities||
   classes[s.classId].abilities.includes(id)||s.donors.length!==2)
   throw Error('SF21 duplicate/missing recipe '+id);
  staged.push({id,cls:s.classId,def:build(s,abilities[s.donors[0]],abilities[s.donors[1]])});
 }
 if(staged.length!==3)throw Error('SF21 requires precisely 3 skills');
 for(const x of staged){abilities[x.id]=x.def;classes[x.cls].abilities.push(x.id);}
 return staged.map(x=>x.id);
}
