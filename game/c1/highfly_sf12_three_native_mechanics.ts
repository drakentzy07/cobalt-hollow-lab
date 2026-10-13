/**
 * HIGHFLY SF12 — three hand-audited ORIGINAL CLAUDECRAFT effect combinations.
 * 13 prior pilots are not modified. Does not bypass original source spell effects,
 * mutate monster/player stats, create a second combat engine, or fake VFX QA.
 * Warrior: real charge + native hamstring slow/damage.
 * Paladin: existing any-target Holy Shock, improved *single* healing mode using Flash.
 * Mage: existing ally-absorb Temporal Barrier with Frostveil numeric rider,
 *       one shield aura and one native SpellPower application.
 */
import type {AbilityDef,AbilityEffect} from '../sim/types';
import {HIGHFLY_FUSED_SKILLS,type HighflyFusionSpec,type HighflyClass} from './sf3_skill_catalog';
const IDS=['hf_warrior_s3','hf_paladin_s4','hf_mage_s4'] as const;
type Registry=Record<string,AbilityDef>;
type Classes=Record<HighflyClass,{abilities:string[]}>;
function at(d:AbilityDef,lv:number):readonly AbilityEffect[]{
 let a=d.effects;for(const r of d.ranks??[])if(r.level<=lv)a=r.effects;return a;
}
function cost(d:AbilityDef,lv:number):number{
 let n=d.cost;for(const r of d.ranks??[])if(r.level<=lv)n=r.cost;return n;
}
function levels(start:number,...ds:AbilityDef[]):number[]{
 return [...new Set([start,...ds.flatMap(d=>(d.ranks??[]).map(r=>r.level).filter(x=>x>start))])].sort((a,b)=>a-b);
}
function sameSource(s:HighflyFusionSpec,expectedId:string,cl:HighflyClass,ds:AbilityDef[],ids:string[]):void{
 if(s.id!==expectedId||s.classId!==cl||s.donors.join(',')!==ids.join(',')
    ||ids.some((id,i)=>ds[i].id!==id||ds[i].class!==cl))
  throw Error('SF12 original donor identity changed: '+expectedId);
}
function only<T extends AbilityEffect['type']>(d:AbilityDef,lv:number,t:T):Extract<AbilityEffect,{type:T}>{
 const e=at(d,lv);
 if(e.length!==1||e[0].type!==t)throw Error('SF12 effect shape changed '+d.id);
 return e[0] as Extract<AbilityEffect,{type:T}>;
}
function clean(d:AbilityDef,s:HighflyFusionSpec):AbilityDef{
 return {...d,id:s.id,name:s.name,class:s.classId,learnLevel:s.unlockLevel,
  specs:undefined,excludeSpecs:undefined,excludeSpecsAtLevel:undefined,
  hiddenFromPlayer:undefined,passive:undefined,requiresQuest:undefined,
  actionReplacement:undefined,maxCharges:undefined};
}
function warrior(s:HighflyFusionSpec,charge:AbilityDef,hamstring:AbilityDef):AbilityDef{
 sameSource(s,'hf_warrior_s3','warrior',[charge,hamstring],['charge','hamstring']);
 if(s.unlockLevel!==10||charge.school!=='physical'||hamstring.school!=='physical'
  ||!charge.requiresTarget||!hamstring.requiresTarget
  ||charge.minRange!==8||charge.range!==25||hamstring.range!==0
  ||charge.effects.map(e=>e.type).join(',')!=='charge,stun'
  ||charge.castTime!==0||hamstring.castTime!==0||charge.offGcd!==true)
  throw Error('SF12 Warrior native charge contract changed');
 const snapshots=levels(s.unlockLevel,charge,hamstring).map(lv=>{
  const hit=at(hamstring,lv);
  if(hit.length!==2||hit[0].type!=='directDamage'||hit[1].type!=='slow'
     ||charge.effects[0].type!=='charge'||charge.effects[1].type!=='stun')
   throw Error('SF12 Warrior charge/slow handler changed');
  const dmg=hit[0];const slow=hit[1];
  return {lv,cost:Math.ceil(cost(hamstring,lv)*.5),fx:[
   {...charge.effects[0]},{...charge.effects[1]},
   {...dmg,min:Math.max(1,Math.round(dmg.min*.5)),max:Math.max(1,Math.round(dmg.max*.5))},
   {...slow,duration:Math.min(8,slow.duration)}
  ] as AbilityEffect[]};
 });
 return {...clean(charge,s),offGcd:undefined,cooldown:18,cost:snapshots[0].cost,
  effects:snapshots[0].fx,
  ranks:snapshots.slice(1).map((x,i)=>({rank:i+2,level:x.lv,cost:x.cost,effects:x.fx})),
  description:'HIGHFLY SF12: carga nativa desde 8-25 yd y corte ralentizante al llegar. Conserva cast/rango originales, no hereda eventos exclusivos de otro ID.'};
}
function paladin(s:HighflyFusionSpec,shock:AbilityDef,flash:AbilityDef):AbilityDef{
 sameSource(s,'hf_paladin_s4','paladin',[shock,flash],['holy_shock','flash_of_light']);
 if(s.unlockLevel!==15||shock.school!=='holy'||flash.school!=='holy'
   ||shock.targetType!=='any'||flash.targetType!=='friendly'
   ||!shock.requiresTarget||!flash.requiresTarget||shock.range!==30||flash.range!==30
   ||shock.castTime!==0||flash.castTime!==1.5)
  throw Error('SF12 Paladin dual-target Holy Shock contract changed');
 const snaps=levels(s.unlockLevel,shock,flash).map(lv=>{
  const fx=at(shock,lv),heal=only(flash,lv,'heal');
  if(fx.length!==2||fx[0].type!=='heal'||fx[1].type!=='directDamage')
   throw Error('SF12 Paladin original any-target branching changed');
  const h=fx[0];
  return {lv,cost:cost(shock,lv)+Math.ceil(cost(flash,lv)*.2),fx:[
    {...h,min:h.min+Math.round(heal.min*.3),max:h.max+Math.round(heal.max*.3)},
    {...fx[1]}
  ] as AbilityEffect[]};
 });
 return {...clean(shock,s),cooldown:12,cost:snaps[0].cost,
   effects:snaps[0].fx,
   ranks:snaps.slice(1).map((x,i)=>({rank:i+2,level:x.lv,cost:x.cost,effects:x.fx})),
   description:'HIGHFLY SF12: Holy Shock conserva sus modos amigo/enemigo, con cura reforzada 30% Flash of Light. Sin duplicar escalado SpellPower ni heredar generación de Devoción por ID.'};
}
function mage(s:HighflyFusionSpec,frost:AbilityDef,temporal:AbilityDef):AbilityDef{
 sameSource(s,'hf_mage_s4','mage',[frost,temporal],['ice_barrier','temporal_barrier']);
 if(s.unlockLevel!==15||frost.school!=='frost'||temporal.school!=='arcane'
  ||frost.requiresTarget||frost.range!==0||!temporal.requiresTarget
  ||temporal.targetType!=='friendly'||temporal.range!==30
  ||frost.castTime!==0||temporal.castTime!==0
  ||frost.specs?.join(',')!=='frost'||temporal.specs?.join(',')!=='arcane')
  throw Error('SF12 Mage shield donor targeting/shape changed');
 const snaps=levels(s.unlockLevel,frost,temporal).map(lv=>{
  const a=only(frost,lv,'absorb'),b=only(temporal,lv,'absorb');
  // Keep Temporal Barrier's short duration and SpellPower coefficient,
  // fold 25% of Frostveil flat amount into ONE aura rather than two
  // same-ID absorb auras silently overwriting one another.
  return {lv,cost:Math.max(cost(frost,lv),cost(temporal,lv)),fx:[
   {...b,amount:b.amount+Math.round(a.amount*.25)}
  ] as AbilityEffect[]};
 });
 return {...clean(temporal,s),cooldown:30,cost:snaps[0].cost,
   effects:snaps[0].fx,
   ranks:snaps.slice(1).map((x,i)=>({rank:i+2,level:x.lv,cost:x.cost,effects:x.fx})),
   description:'HIGHFLY SF12: barrera de fase para aliado/uno mismo, absorb único Temporal + 25% Frostveil. Mantiene 10s y un solo coeficiente mágico; no crea dos auras ni doble escalado.'};
}
export function installSf12NativeExpansion(abilities:Registry,classes:Classes):readonly string[]{
 const recipes=Object.values(HIGHFLY_FUSED_SKILLS).flat();
 const defs:{cls:HighflyClass;id:string;def:AbilityDef}[]=[];
 for(const id of IDS){
  const s=recipes.find(x=>x.id===id);
  if(!s||abilities[id]||!classes[s.classId]?.abilities||classes[s.classId].abilities.includes(id))
   throw Error('SF12 missing/duplicate destination '+id);
  const donors=s.donors.map(k=>abilities[k]);
  if(donors.length!==2||donors.some(x=>!x||x.class!==s.classId))
   throw Error('SF12 missing/foreign original donor '+id);
  const def=id==='hf_warrior_s3'?warrior(s,donors[0],donors[1]):
    id==='hf_paladin_s4'?paladin(s,donors[0],donors[1]):mage(s,donors[0],donors[1]);
  defs.push({cls:s.classId,id,def});
 }
 // Atomic all-3 commit after every donor and destination passes validation.
 for(const d of defs){abilities[d.id]=d.def;classes[d.cls].abilities.push(d.id);}
 return defs.map(x=>x.id);
}
