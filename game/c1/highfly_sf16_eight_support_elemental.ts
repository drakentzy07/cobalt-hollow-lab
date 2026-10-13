/**
 * HIGHFLY SF16 — 3 distinct source-faithful elemental, utility and support adaptations.
 * Source: frozen original ClaudeCraft AbilityDef effects, no bespoke combat logic.
 * No VFX invented, talent ID-keyed donor procs not falsely claimed.
 */
import type {AbilityDef,AbilityEffect} from '../sim/types';
import {HIGHFLY_FUSED_SKILLS,type HighflyClass,type HighflyFusionSpec} from './sf3_skill_catalog';
type Registry=Record<string,AbilityDef>;
type Classes=Record<HighflyClass,{abilities:string[]}>;
export const SF16_IDS=[
 'hf_paladin_s5','hf_shaman_s2','hf_warlock_s1'
] as const;
const DONORS:Record<typeof SF16_IDS[number],string>={
 hf_paladin_s5:'solar_step,hammer_of_justice',
 hf_shaman_s2:'flame_shock,lava_burst',
 hf_warlock_s1:'shadow_bolt,soul_lance'
};
function effectsAt(d:AbilityDef,lv:number):AbilityEffect[]{
 let effects=d.effects;
 for(const r of d.ranks??[])if(r.level<=lv)effects=r.effects;
 return effects.map(x=>({...x}));
}
function costAt(d:AbilityDef,lv:number):number{
 let n=d.cost;for(const r of d.ranks??[])if(r.level<=lv)n=r.cost;return n;
}
function castAt(d:AbilityDef,lv:number):number{
 let n=d.castTime;for(const r of d.ranks??[])if(r.level<=lv&&r.castTime!==undefined)n=r.castTime;
 return n;
}
function required(e:AbilityEffect|undefined,t:AbilityEffect['type'],id:string):void{
 if(!e||e.type!==t)throw Error('SF16 native effect contract changed '+id+' '+t);
}
function inspect(s:HighflyFusionSpec,a:AbilityDef,b:AbilityDef):void{
 const id=s.id;
 if(s.donors.join(',')!==DONORS[id as keyof typeof DONORS]||
  a.class!==s.classId||b.class!==s.classId||
  a.passive||b.passive||a.hiddenFromPlayer||b.hiddenFromPlayer||
  a.channel||b.channel||a.requiresForm||b.requiresForm||
  a.requiresStealth||b.requiresStealth||a.spendsCombo||b.spendsCombo)
  throw Error('SF16 source class/contract drift '+id);
 if(id==='hf_paladin_s5'){
  required(a.effects[0],'selfBuff',id);required(b.effects[0],'stun',id);
  if(a.effects.length!==1||b.effects.length!==1||b.range!==10||
   a.requiresTarget||!b.requiresTarget)throw Error('SF16 paladin changed');
 }else if(id==='hf_shaman_s2'){
  required(a.effects[0],'directDamage',id);required(a.effects[1],'dot',id);
  required(b.effects[0],'directDamage',id);
  if(a.effects.length!==2||b.effects.length!==1||
   a.school!=='fire'||b.school!=='fire'||!a.requiresTarget||!b.requiresTarget)
   throw Error('SF16 shaman fire changed');
 }else if(id==='hf_warlock_s1'){
  required(a.effects[0],'directDamage',id);required(b.effects[0],'directDamage',id);
  if(a.effects.length!==1||b.effects.length!==1||a.school!=='shadow'||
   b.school!=='shadow'||a.range!==b.range||!a.requiresTarget||!b.requiresTarget)
   throw Error('SF16 warlock shadow changed');
 }else throw Error('SF16 unexpected id '+id);
}
function mix(s:HighflyFusionSpec,a:AbilityDef,b:AbilityDef,lv:number):AbilityEffect[]{
 const x=effectsAt(a,lv),y=effectsAt(b,lv);
 const id=s.id;
 const shape:Record<typeof SF16_IDS[number],AbilityEffect['type'][][]>={
  hf_paladin_s5:[['selfBuff'],['stun']],
  hf_shaman_s2:[['directDamage','dot'],['directDamage']],
  hf_warlock_s1:[['directDamage'],['directDamage']]
 };
 if(x.map(e=>e.type).join(',')!==shape[id as keyof typeof shape][0].join(',')||
  y.map(e=>e.type).join(',')!==shape[id as keyof typeof shape][1].join(','))
  throw Error('SF16 rank effect drift '+id+' LV'+lv);
 if(id==='hf_paladin_s5')return [x[0],y[0]];
 if(id==='hf_shaman_s2'){
  if(x[0].type!=='directDamage'||y[0].type!=='directDamage')
   throw Error('SF16 fire direct mismatch');
  return [{...x[0],min:x[0].min+Math.round(y[0].min*.35),
    max:x[0].max+Math.round(y[0].max*.35)},x[1]];
 }
 if(id==='hf_warlock_s1'){
  if(x[0].type!=='directDamage'||y[0].type!=='directDamage')
   throw Error('SF16 warlock damage mismatch');
  return [{...x[0],min:x[0].min+Math.round(y[0].min*.35),
   max:x[0].max+Math.round(y[0].max*.35)}];
 }
 throw Error('SF16 invalid effect '+id);
}
function build(s:HighflyFusionSpec,a:AbilityDef,b:AbilityDef):AbilityDef{
 inspect(s,a,b);
 const stages=[...new Set([s.unlockLevel,...[a,b].flatMap(d=>(d.ranks??[])
  .map(r=>r.level).filter(l=>l>s.unlockLevel&&l<=99))])].sort((a,b)=>a-b);
 const snap=stages.map(lv=>({lv,fx:mix(s,a,b,lv),
  cost:costAt(a,lv)+Math.ceil(costAt(b,lv)*.2),cast:castAt(a,lv)}));
 const cooldown:Record<typeof SF16_IDS[number],number>={
  hf_paladin_s5:35,hf_shaman_s2:8,hf_warlock_s1:8
 };
 const patch:Partial<AbilityDef>={
  specs:undefined,excludeSpecs:undefined,excludeSpecsAtLevel:undefined,
  maxCharges:undefined,actionReplacement:undefined,
  requiresAuraKind:undefined,requiresStealth:undefined,
  learnLevel:s.unlockLevel,cooldown:cooldown[s.id as keyof typeof cooldown],
  cost:snap[0].cost,castTime:snap[0].cast,
  description:'HIGHFLY SF16: '+s.name+'. Fusión nativa comprobable de '+
   s.donors.join(' + ')+'. Los procs exclusivos del ID donante no se transfieren.'
 };
 if(s.id==='hf_paladin_s5')Object.assign(patch,{requiresTarget:true,range:10,school:'holy'});
 return {...a,...patch,id:s.id,name:s.name,class:s.classId,effects:snap[0].fx,
  ranks:snap.slice(1).map((r,i)=>({rank:i+2,level:r.lv,cost:r.cost,
   castTime:r.cast,effects:r.fx}))};
}
export function installSf16EightNative(abilities:Registry,classes:Classes):string[]{
 const catalog=Object.values(HIGHFLY_FUSED_SKILLS).flat();
 const staged:{id:string;cls:HighflyClass;def:AbilityDef}[]=[];
 for(const id of SF16_IDS){
  const s=catalog.find(x=>x.id===id);
  if(!s||s.donors.length!==2||abilities[id]||
   !classes[s.classId]?.abilities||classes[s.classId].abilities.includes(id))
   throw Error('SF16 missing/duplicate catalog '+id);
  const [a,b]=s.donors.map(d=>abilities[d]);
  if(!a||!b||a.id!==s.donors[0]||b.id!==s.donors[1])
   throw Error('SF16 missing exact original donor '+id);
  staged.push({id,cls:s.classId,def:build(s,a,b)});
 }
 if(staged.length!==3)throw Error('SF16 did not stage 3');
 for(const x of staged){abilities[x.id]=x.def;classes[x.cls].abilities.push(x.id);}
 return staged.map(x=>x.id);
}
