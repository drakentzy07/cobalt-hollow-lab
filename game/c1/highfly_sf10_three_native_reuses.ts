/**
 * HIGHFLY SF10 / FIRST PRODUCTION-SAFE EXPANSION CANDIDATES.
 * Three honest native reuses (not 53 generic auto-copies): Priest S4,
 * Shaman S2 and Warlock S1. No new Sim, saves or Training stats.
 *
 * SOURCE RESTRICTIONS: the ORIGINAL spec-exclusive donor definitions are
 * immutable templates; original ID-keyed talent procs are NOT inherited.
 * A NEW HF action learns at its author-defined HIGHFLY unlock level.
 * Opt-in runtime only, after the established ten SF4 pilots.
 */
import type { AbilityDef, AbilityEffect } from '../sim/types';
import { HIGHFLY_FUSED_SKILLS, type HighflyClass, type HighflyFusionSpec } from './sf3_skill_catalog';

type Registry=Record<string,AbilityDef>;
type ClassRegistry=Record<HighflyClass,{abilities:string[]}>;
const IDS=['hf_priest_s4','hf_shaman_s2','hf_warlock_s1'] as const;
function at(d:AbilityDef,lv:number):readonly AbilityEffect[]{
 let fx=d.effects;
 for(const r of d.ranks??[])if(r.level<=lv)fx=r.effects;
 return fx;
}
function cost(d:AbilityDef,lv:number):number{
 let n=d.cost;for(const r of d.ranks??[])if(r.level<=lv)n=r.cost;return n;
}
function levels(start:number,...donors:AbilityDef[]):number[]{
 return [...new Set([start,...donors.flatMap(d=>(d.ranks??[]).map(r=>r.level))
   .filter(lv=>lv>start)])].sort((a,b)=>a-b);
}
function source(def:AbilityDef,cls:HighflyClass,id:string):void{
 if(def.id!==id||def.class!==cls||def.passive||def.channel||def.onNextSwing||
    def.requiresForm||def.requiresStealth||def.requiresOutOfCombat||def.maxCharges)
   throw Error('SF10 donor contract changed: '+cls+'/'+id);
}
function one(d:AbilityDef,lv:number,type:AbilityEffect['type']):AbilityEffect{
 const fx=at(d,lv);
 if(fx.length!==1||fx[0].type!==type)throw Error('SF10 expected one '+type+':'+d.id+'@'+lv);
 return fx[0];
}
function noSpecProcCopy(d:AbilityDef,id:string,name:string,cls:HighflyClass,unlock:number,
 cooldown:number,baseCost:number,effects:AbilityEffect[],ranks:AbilityDef['ranks']):AbilityDef{
 return {...d,id,name,class:cls,learnLevel:unlock,cooldown,cost:baseCost,effects,ranks,
   specs:undefined,excludeSpecs:undefined,excludeSpecsAtLevel:undefined,
   requiresQuest:undefined,hiddenFromPlayer:undefined,passive:undefined,
   actionReplacement:undefined,maxCharges:undefined};
}
function priest(spec:HighflyFusionSpec,a:AbilityDef,b:AbilityDef):AbilityDef{
 source(a,'priest','lesser_heal');source(b,'priest','flash_heal');
 if(spec.donors.join(',')!=='lesser_heal,flash_heal'||spec.unlockLevel!==15
  ||a.school!=='holy'||b.school!=='holy'||!a.requiresTarget||!b.requiresTarget
  ||a.targetType!=='friendly'||b.targetType!=='friendly'
  ||a.range!==30||b.range!==30||a.castTime!==2||b.castTime!==1.5)
  throw Error('SF10 Priest compatibility changed');
 const snaps=levels(spec.unlockLevel,a,b).map(lv=>{
   const lead=one(a,lv,'heal'),rider=one(b,lv,'heal');
   if(lead.type!=='heal'||rider.type!=='heal')throw Error('SF10 Priest heal shape');
   // Exactly ONE native heal; no duplicate spellpower scaling.
   return {lv,cost:cost(a,lv)+Math.ceil(cost(b,lv)*0.25),
    fx:[{...lead,min:lead.min+Math.round(rider.min*.25),
      max:lead.max+Math.round(rider.max*.25)}] as AbilityEffect[]};
 });
 return {...noSpecProcCopy(a,spec.id,spec.name,'priest',spec.unlockLevel,6,
   snaps[0].cost,snaps[0].fx,
   snaps.slice(1).map((x,i)=>({rank:i+2,level:x.lv,cost:x.cost,effects:x.fx}))),
   castTime:1.5,
   description:'HIGHFLY SF10: sanación nativa directa única con 25% de Flash Heal. No genera sanación ni procs duplicados.'};
}
function shaman(spec:HighflyFusionSpec,a:AbilityDef,b:AbilityDef):AbilityDef{
 source(a,'shaman','flame_shock');source(b,'shaman','lava_burst');
 if(spec.donors.join(',')!=='flame_shock,lava_burst'||spec.unlockLevel!==5
  ||a.school!=='fire'||b.school!=='fire'||!a.requiresTarget||!b.requiresTarget
  ||a.range!==20||b.range!==30||a.castTime!==0||b.castTime!==2
  ||b.specs?.join(',')!=='elemental'||b.projectileFx!=='heavyBolt')
  throw Error('SF10 Shaman fire donor compatibility changed');
 const snaps=levels(spec.unlockLevel,a,b).map(lv=>{
   const fx=at(a,lv),bolt=one(b,lv,'directDamage');
   if(fx.length!==2||fx[0].type!=='directDamage'||fx[1].type!=='dot'
     ||bolt.type!=='directDamage')throw Error('SF10 Shaman direct+dot contract');
   // One fire impact with small numeric second-donor rider plus native DoT.
   return {lv,cost:cost(a,lv)+Math.ceil(cost(b,lv)*.25),
     fx:[{...fx[0],min:fx[0].min+Math.round(bolt.min*.25),
       max:fx[0].max+Math.round(bolt.max*.25)},fx[1]] as AbilityEffect[]};
 });
 return {...noSpecProcCopy(a,spec.id,spec.name,'shaman',spec.unlockLevel,8,
   snaps[0].cost,snaps[0].fx,
   snaps.slice(1).map((x,i)=>({rank:i+2,level:x.lv,cost:x.cost,effects:x.fx}))),
   // Visual reuse: Flame Shock's hit + existing Magma Burst heavyBolt cue.
   projectileFx:'heavyBolt',
   description:'HIGHFLY SF10: un impacto de Fuego + DoT con aporte de Magma Burst. No hereda reset/crit especiales por ID.'};
}
function warlock(spec:HighflyFusionSpec,a:AbilityDef,b:AbilityDef):AbilityDef{
 source(a,'warlock','shadow_bolt');source(b,'warlock','soul_lance');
 if(spec.donors.join(',')!=='shadow_bolt,soul_lance'||spec.unlockLevel!==1
  ||a.school!=='shadow'||b.school!=='shadow'||!a.requiresTarget||!b.requiresTarget
  ||a.range!==30||b.range!==30||a.castTime!==1.7||b.castTime!==1.6
  ||b.specs?.join(',')!=='demonology')
  throw Error('SF10 Warlock shadow bolt/lance compatibility changed');
 const snaps=levels(spec.unlockLevel,a,b).map(lv=>{
   const lead=one(a,lv,'directDamage'),rider=one(b,lv,'directDamage');
   if(lead.type!=='directDamage'||rider.type!=='directDamage')
    throw Error('SF10 Warlock damage shape');
   return {lv,cost:cost(a,lv)+Math.ceil(cost(b,lv)*.25),
     fx:[{...lead,min:lead.min+Math.round(rider.min*.25),
       max:lead.max+Math.round(rider.max*.25)}] as AbilityEffect[]};
 });
 return {...noSpecProcCopy(a,spec.id,spec.name,'warlock',spec.unlockLevel,8,
   snaps[0].cost,snaps[0].fx,
   snaps.slice(1).map((x,i)=>({rank:i+2,level:x.lv,cost:x.cost,
     castTime:(a.ranks??[]).filter(r=>r.level<=x.lv&&r.castTime!==undefined).at(-1)?.castTime??a.castTime,
     effects:x.fx}))),
   description:'HIGHFLY SF10: único proyectil oscuro fusionado. Los procs originales de Soul Lance/Ossuary Mark NO se heredan.'};
}
export function installSf10NativeExpansion(abilities:Registry,classes:ClassRegistry){
 const catalog=Object.values(HIGHFLY_FUSED_SKILLS).flat();
 const prepared:{id:string;cls:HighflyClass;def:AbilityDef}[]=[];
 if(IDS.some(id=>abilities[id]))throw Error('SF10 duplicate expansion ID');
 for(const id of IDS){
   const spec=catalog.find(x=>x.id===id);
   if(!spec)throw Error('SF10 catalog missing '+id);
   const cl=classes[spec.classId];
   if(!cl?.abilities||cl.abilities.includes(id))throw Error('SF10 class duplicate/missing '+id);
   const donor=spec.donors.map(d=>abilities[d]);
   if(donor.length!==2||donor.some(d=>!d||d.class!==spec.classId))
     throw Error('SF10 foreign or missing source '+id);
   const def=id==='hf_priest_s4'?priest(spec,donor[0],donor[1]):
     id==='hf_shaman_s2'?shaman(spec,donor[0],donor[1]):
     warlock(spec,donor[0],donor[1]);
   prepared.push({id,cls:spec.classId,def});
 }
 if(prepared.length!==3)throw Error('SF10 expected 3 native reuses');
 // Atomic registration: validation completed before the first mutation.
 for(const {id,cls,def} of prepared){abilities[id]=def;classes[cls].abilities.push(id);}
 return prepared.map(x=>x.id);
}
