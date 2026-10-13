/**
 * HIGHFLY SF14 — two explicitly hand-audited native adapters.
 * Reuses exact frozen original donor effects. No new combat engine,
 * no fabricated VFX, no inheritance of donor-ID keyed talent handlers.
 */
import type {AbilityDef,AbilityEffect} from '../sim/types';
import {HIGHFLY_FUSED_SKILLS,type HighflyFusionSpec,type HighflyClass} from './sf3_skill_catalog';
type Registry=Record<string,AbilityDef>;
type Classes=Record<HighflyClass,{abilities:string[]}>;
const IDS=['hf_priest_s1','hf_shaman_s1'] as const;
function effectsAt(d:AbilityDef,level:number):AbilityEffect[]{
 let effects=d.effects;for(const r of d.ranks??[])if(r.level<=level)effects=r.effects;
 return effects.map(x=>({...x}));
}
function costAt(d:AbilityDef,level:number):number{
 let c=d.cost;for(const r of d.ranks??[])if(r.level<=level)c=r.cost;return c;
}
function castAt(d:AbilityDef,level:number):number{
 let t=d.castTime;
 for(const r of d.ranks??[])if(r.level<=level&&r.castTime!==undefined)t=r.castTime;
 return t;
}
function levels(spec:HighflyFusionSpec,defs:AbilityDef[]):number[]{
 return [...new Set([spec.unlockLevel,...defs.flatMap(d=>(d.ranks??[])
   .filter(r=>r.level>spec.unlockLevel&&r.level<=99).map(r=>r.level))])].sort((a,b)=>a-b);
}
function src(d:AbilityDef|undefined,expected:string,cls:HighflyClass):asserts d is AbilityDef{
 if(!d||d.id!==expected||d.class!==cls||d.passive||d.channel||
 d.requiresForm||d.requiresStealth||d.onNextSwing||d.maxCharges)
  throw Error('SF14 original donor contract changed '+expected);
}
function priest(s:HighflyFusionSpec,smite:AbilityDef,mercy:AbilityDef):AbilityDef{
 if(s.id!=='hf_priest_s1'||s.unlockLevel!==1||
   s.donors.join(',')!=='smite,scouring_mercy'||
   smite.school!=='holy'||mercy.school!=='holy'||
   smite.range!==30||mercy.range!==30||
   !smite.requiresTarget||!mercy.requiresTarget||
   (smite.targetType??'enemy')!=='enemy'||mercy.targetType!=='any'||
   mercy.specs?.join(',')!=='discipline'||
   smite.castTime!==2||mercy.castTime!==0)
    throw Error('SF14 Priest source damage/heal direction changed');
 const snapshots=levels(s,[smite,mercy]).map(level=>{
  const sm=effectsAt(smite,level),m=effectsAt(mercy,level);
  if(sm.length!==1||sm[0].type!=='directDamage'||m.length!==2||
    m[0].type!=='directDamage'||m[1].type!=='heal')
    throw Error('SF14 Priest original effect shapes changed at '+level);
  const damage:Extract<AbilityEffect,{type:'directDamage'}>=
   {...sm[0],min:sm[0].min+Math.round(m[0].min*.25),
      max:sm[0].max+Math.round(m[0].max*.25)};
  const heal:Extract<AbilityEffect,{type:'heal'}>=
    {...m[1],min:Math.max(1,Math.round(m[1].min*.35)),
      max:Math.max(1,Math.round(m[1].max*.35))};
  return {level,cost:costAt(smite,level)+Math.ceil(costAt(mercy,level)*.25),
    castTime:castAt(smite,level),effects:[heal,damage] as AbilityEffect[]};
 });
 return {...smite,id:s.id,name:s.name,class:'priest',learnLevel:1,
  targetType:'any',cooldown:8,castTime:snapshots[0].castTime,
  specs:undefined,excludeSpecs:undefined,excludeSpecsAtLevel:undefined,
  cost:snapshots[0].cost,effects:snapshots[0].effects,
  ranks:snapshots.slice(1).map((x,i)=>({rank:i+2,level:x.level,
    cost:x.cost,castTime:x.castTime,effects:x.effects})),
  description:'SF14 Castigo de Misericordia: proyectil sagrado ofensivo de Smite con 25% Scouring Mercy, o cura aliada moderada con 35% del donante. Sin procs Doctrine por ID; VFX pendiente.'
 };
}
function shaman(s:HighflyFusionSpec,bolt:AbilityDef,chain:AbilityDef):AbilityDef{
 if(s.id!=='hf_shaman_s1'||s.unlockLevel!==1||
   s.donors.join(',')!=='lightning_bolt,chain_lightning'||
   bolt.school!=='nature'||chain.school!=='nature'||
   bolt.range!==30||chain.range!==30||
   !bolt.requiresTarget||!chain.requiresTarget||
   bolt.castTime!==1.5||chain.castTime!==2.5||
   bolt.projectileFx!=='lightning'||chain.specs?.join(',')!=='elemental')
   throw Error('SF14 Shaman exact original lightning source changed');
 const snapshots=levels(s,[bolt,chain]).map(level=>{
  const a=effectsAt(bolt,level),b=effectsAt(chain,level);
  if(a.length!==1||a[0].type!=='directDamage'||b.length!==1||
    b[0].type!=='chainDamage'||b[0].hitsPrimary!==true||
    b[0].jumps!==2||b[0].radius!==10)
   throw Error('SF14 Shaman chain effect contract changed at '+level);
  const chainEffect:Extract<AbilityEffect,{type:'chainDamage'}>=
   {...b[0],min:Math.max(1,Math.round(b[0].min*.25)),
      max:Math.max(1,Math.round(b[0].max*.25))};
  return {level,cost:costAt(bolt,level)+Math.ceil(costAt(chain,level)*.25),
    castTime:castAt(bolt,level),effects:[a[0],chainEffect] as AbilityEffect[]};
 });
 return {...bolt,id:s.id,name:s.name,class:'shaman',learnLevel:1,
  cooldown:8,specs:undefined,excludeSpecs:undefined,excludeSpecsAtLevel:undefined,
  cost:snapshots[0].cost,castTime:snapshots[0].castTime,
  effects:snapshots[0].effects,
  ranks:snapshots.slice(1).map((x,i)=>({rank:i+2,level:x.level,
    cost:x.cost,castTime:x.castTime,effects:x.effects})),
  description:'SF14 Latigazo de Relámpago: impacto eléctrico nativo y cadena Skybranch de fuerza reducida (25%), saltos reales entre objetivos cercanos. Sin Thunder proc por ID; VFX pendiente.'
 };
}
/** Atomic registration ONLY after all exact source contracts pass. */
export function installSf14HandAdapters(abilities:Registry,classes:Classes):string[]{
 const specs=Object.values(HIGHFLY_FUSED_SKILLS).flat();
 const prepared:{id:string;cls:HighflyClass;def:AbilityDef}[]=[];
 for(const id of IDS){
  const s=specs.find(x=>x.id===id);
  if(!s||abilities[id]||classes[s.classId]?.abilities.includes(id))
    throw Error('SF14 missing/duplicate destination '+id);
  const [a,b]=s.donors.map(x=>abilities[x]);
  src(a,s.donors[0],s.classId);src(b,s.donors[1],s.classId);
  prepared.push({id,cls:s.classId,def:id==='hf_priest_s1'?priest(s,a,b):shaman(s,a,b)});
 }
 for(const x of prepared){abilities[x.id]=x.def;classes[x.cls].abilities.push(x.id);}
 return prepared.map(x=>x.id);
}
