/**
 * HIGHFLY SF17 -- 3 REAL, unregistered native skills.
 * Original SOURCE donor effects only. World/Training/saves never modified.
 * Special ID-gated procs from the donor are not inherited implicitly.
 * All SF4-SF16 IDs are preflight-deduplicated BEFORE expensive Actions work.
 */
import type {AbilityDef,AbilityEffect} from '../sim/types';
import {HIGHFLY_FUSED_SKILLS,type HighflyClass,type HighflyFusionSpec} from './sf3_skill_catalog';
type Registry=Record<string,AbilityDef>;
type Classes=Record<HighflyClass,{abilities:string[]}>;
export const SF17_IDS=['hf_hunter_s1','hf_shaman_u1','hf_shaman_u2'] as const;
const CONTRACT:Record<typeof SF17_IDS[number],string>={
 hf_hunter_s1:'measured_shot,arcane_shot',
 hf_shaman_u1:'earthquake,thunderstorm',
 hf_shaman_u2:'bloodlust,elemental_trance'
};
function levelFx(d:AbilityDef,lv:number):AbilityEffect[]{
 let e=d.effects;
 for(const r of d.ranks??[])if(r.level<=lv)e=r.effects;
 return e.map(x=>({...x}));
}
function costAt(d:AbilityDef,lv:number):number{
 let n=d.cost;for(const r of d.ranks??[])if(r.level<=lv)n=r.cost;
 return n;
}
function stages(spec:HighflyFusionSpec,d:AbilityDef[]):number[]{
 return [...new Set([spec.unlockLevel,...d.flatMap(x=>(x.ranks??[])
  .filter(r=>r.level>spec.unlockLevel&&r.level<=99).map(r=>r.level))])].sort((a,b)=>a-b);
}
function effect(s:HighflyFusionSpec,a:AbilityDef,b:AbilityDef,lv:number):AbilityEffect[]{
 const [x,y]=[levelFx(a,lv),levelFx(b,lv)];
 if(s.id==='hf_hunter_s1'){
  if(x.map(e=>e.type).join(',')!=='directDamage,gainResource'||
    y.map(e=>e.type).join(',')!=='directDamage'||
    x[0].type!=='directDamage'||y[0].type!=='directDamage'||
    x[1].type!=='gainResource')throw Error('SF17 Hunter source effects changed');
  return [{...x[0],min:x[0].min+Math.round(y[0].min*.3),
    max:x[0].max+Math.round(y[0].max*.3)},x[1]];
 }
 if(s.id==='hf_shaman_u1'){
  if(x.map(e=>e.type).join(',')!=='groundAoE'||
     y.map(e=>e.type).join(',')!=='aoeDamage,aoeSlow')
   throw Error('SF17 Storm earthquake source changed');
  if(x[0].type!=='groundAoE'||y[0].type!=='aoeDamage'||
   y[1].type!=='aoeSlow')throw Error('SF17 Storm source shape changed');
  return [{...x[0],duration:Math.min(6,x[0].duration)},
   {...y[0],min:Math.max(1,Math.round(y[0].min*.55)),
    max:Math.max(1,Math.round(y[0].max*.55))},
   {...y[1],duration:Math.min(4,y[1].duration)}];
 }
 if(s.id==='hf_shaman_u2'){
  if(x.length!==1||x[0].type!=='aoeAllyHaste'||
   y.length!==1||y[0].type!=='selfBuff'||y[0].kind!=='buff_dr'||
   x[0].spell!==true||x[0].exhaust!==true||x[0].groupOnly!==true)
   throw Error('SF17 raid-haste/exhaust source changed');
  return [x[0],{...y[0],duration:Math.min(15,y[0].duration)}];
 }
 throw Error('SF17 unknown skill '+s.id);
}
function build(spec:HighflyFusionSpec,a:AbilityDef,b:AbilityDef):AbilityDef{
 const id=spec.id;
 if(spec.donors.join(',')!==CONTRACT[id as keyof typeof CONTRACT]||
  !a||!b||a.id!==spec.donors[0]||b.id!==spec.donors[1]||
  a.class!==spec.classId||b.class!==spec.classId||
  a.passive||b.passive||a.hiddenFromPlayer||b.hiddenFromPlayer||
  a.requiresStealth||b.requiresStealth||a.requiresForm||b.requiresForm||
  a.channel||b.channel||a.requiresQuest||b.requiresQuest)
  throw Error('SF17 donor contract changed '+id);
 if(id==='hf_hunter_s1'&&(!a.projectile||!a.requiresTarget||
   !b.requiresTarget||a.range!==35||b.range!==35||
   a.minRange!==8||b.minRange!==8||a.scalesWith!=='ranged'||
   b.scalesWith!=='ranged'))
  throw Error('SF17 hunter target/ranged source changed');
 if(id==='hf_shaman_u1'&&(a.targetMode!=='position'||
   a.requiresTarget||b.requiresTarget||b.range!==0||
   a.school!=='nature'||b.school!=='nature'))
  throw Error('SF17 Shaman ground targeting changed');
 if(id==='hf_shaman_u2'&&(a.requiresTarget||b.requiresTarget||
   a.school!=='nature'||b.school!=='nature'||a.cooldown!==300))
  throw Error('SF17 Shaman raid haste changed');
 const rows=stages(spec,[a,b]).map(lv=>({
  lv,fx:effect(spec,a,b,lv),cost:costAt(a,lv)+Math.ceil(costAt(b,lv)*.25)
 }));
 const cds:Record<typeof SF17_IDS[number],number>={
  hf_hunter_s1:8,hf_shaman_u1:45,hf_shaman_u2:300
 };
 return {...a,id,name:spec.name,class:spec.classId,learnLevel:spec.unlockLevel,
  cooldown:cds[id as keyof typeof cds],cost:rows[0].cost,
  effects:rows[0].fx,
  specs:undefined,excludeSpecs:undefined,excludeSpecsAtLevel:undefined,
  hiddenFromPlayer:undefined,actionReplacement:undefined,
  maxCharges:undefined,requiresQuest:undefined,
  ranks:rows.slice(1).map((r,i)=>({rank:i+2,level:r.lv,cost:r.cost,effects:r.fx})),
  description:'SF17 '+spec.name+': fusión de mecánicas ClaudeCraft originales '+
   spec.donors.join(' + ')+'. No hereda talentos/procs específicos de IDs donantes; VFX final pendiente.'
 };
}
/** Atomic: if ANY rank, source effect or class contract fails, install NOTHING. */
export function installSf17ThreeNative(abilities:Registry,classes:Classes):string[]{
 const specs=Object.values(HIGHFLY_FUSED_SKILLS).flat();
 const staged:{id:string;cl:HighflyClass;def:AbilityDef}[]=[];
 for(const id of SF17_IDS){
  const spec=specs.find(s=>s.id===id);
  if(!spec||spec.donors.length!==2||
   abilities[id]||classes[spec.classId]?.abilities?.includes(id)||
   !classes[spec.classId]?.abilities)throw Error('SF17 duplicate/invalid spec '+id);
  const [a,b]=spec.donors.map(d=>abilities[d]);
  staged.push({id,cl:spec.classId,def:build(spec,a,b)});
 }
 if(staged.length!==3)throw Error('SF17 expected exactly three');
 for(const s of staged){abilities[s.id]=s.def;classes[s.cl].abilities.push(s.id);}
 return staged.map(s=>s.id);
}
