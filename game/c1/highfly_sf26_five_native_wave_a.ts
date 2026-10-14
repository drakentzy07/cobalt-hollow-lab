/** SF26 / WAVE A: five original native-source composite skills.
 * No new combat/VFX engine. Special delivery sequencing is in pinned SF26
 * compatibility adapter; reject original source-shape drift before registration.
 */
import type {AbilityDef,AbilityEffect} from '../sim/types';
import {HIGHFLY_FUSED_SKILLS,type HighflyClass,type HighflyFusionSpec} from './sf3_skill_catalog';
type Registry=Record<string,AbilityDef>;
type Classes=Record<HighflyClass,{abilities:string[]}>;
export const SF26_IDS=['hf_warrior_u2','hf_rogue_s3','hf_warlock_s3','hf_warlock_u1','hf_druid_s4'] as const;
type Id=typeof SF26_IDS[number];
const DONORS:Record<Id,string>={
 hf_warrior_u2:'heroic_leap,faultline,execute',
 hf_rogue_s3:'rupture,deadly_poison,instant_poison',
 hf_warlock_s3:'life_tap,drain_life,cruel_pact',
 hf_warlock_u1:'rain_of_fire,chaos_bolt',
 hf_druid_s4:'bear_charge,maul,swipe'
};
function effects(d:AbilityDef,lv:number):AbilityEffect[]{
 let e=d.effects;for(const rank of d.ranks??[])if(rank.level<=lv)e=rank.effects;
 return e.map(x=>({...x}));
}
function build(s:HighflyFusionSpec,ds:AbilityDef[]):AbilityDef{
 const id=s.id as Id,[a,b,c]=ds;
 if(s.donors.join(',')!==DONORS[id]||ds.length!==s.donors.length||
  ds.some((d,i)=>!d||d.id!==s.donors[i]||d.class!==s.classId||d.passive||d.hiddenFromPlayer))
  throw Error('SF26_SOURCE_CONTRACT_MISSING_OR_MUTATED:'+id);
 const base:Partial<AbilityDef>={
  specs:undefined,excludeSpecs:undefined,excludeSpecsAtLevel:undefined,
  requiresAuraKind:undefined,requiresForm:undefined,requiresOutOfCombat:undefined,
  actionReplacement:undefined,offGcd:undefined,hiddenFromPlayer:undefined,
  requiresStealth:undefined,projectile:false,spendsCombo:undefined,
  comboOptional:undefined,awardsCombo:undefined,minRange:undefined,
  targetType:undefined,description:'HIGHFLY SF26: original source-native '+s.donors.join(' + ')+
   '. Distinct cast phases delivered by the pinned source compatibility adapter.'
 };
 let props:Partial<AbilityDef>;
 let byLevel:(lv:number)=>AbilityEffect[];
 if(id==='hf_warrior_u2'){
  if(a.targetMode!=='position'||a.effects[0]?.type!=='repositionToAim'||
    b.effects[0]?.type!=='aoeDamage'||c.effects[0]?.type!=='directDamage'||
    c.requiresTargetHpBelow!==0.2||a.school!=='physical')
   throw Error('SF26_WARRIOR_LEAP_FAULTLINE_EXECUTE_SOURCE_DRIFT');
  // Source leap lands over 0.6s; original faultline/execute ONLY run at
  // touchdown via SF26 pinned landing bridge, never at original takeoff.
  props={...base,requiresTarget:false,targetMode:'position',range:30,
   castTime:0,cooldown:30,cost:15,school:'physical',projectile:false};
  byLevel=()=>effects(a,s.unlockLevel);
 }else if(id==='hf_rogue_s3'){
  if(a.effects[0]?.type!=='dot'||!a.spendsCombo||
    b.effects[0]?.type!=='imbue'||b.effects[0].coat?.rider!=='stackDot'||
    c.effects[0]?.type!=='imbue'||c.effects[0].bonus<=0)
   throw Error('SF26_ROGUE_SOURCE_BLEED_POISONS_CHANGED');
  props={...base,requiresTarget:true,range:0,castTime:0,
   cooldown:10,cost:35,school:'physical',
   spendsCombo:true,comboOptional:true,projectile:false};
  byLevel=(lv)=>{
   const bleed=effects(a,lv)[0],venom=effects(b,lv)[0],bite=effects(c,lv)[0];
   if(bleed.type!=='dot'||venom.type!=='imbue'||bite.type!=='imbue')
    throw Error('SF26_ROGUE_RANK_SHAPE_CHANGED');
   // One ORIGINAL weapon coating is the only safe way to keep the native
   // stackDot rider and original Instant Poison swing-damage together.
   return [{...bleed,auraId:'hf_rogue_s3_bleed'},
     {...venom,bonus:bite.bonus}];
  };
 }else if(id==='hf_warlock_s3'){
  if(a.effects[0]?.type!=='lifeTap'||b.effects[0]?.type!=='drainTick'||
    c.effects[0]?.type!=='afflictionCruelPact'||b.channel?.ticks!==3||
    b.channel.duration!==3)
   throw Error('SF26_WARLOCK_LIFETAP_DRAIN_CRUEL_SOURCE_DRIFT');
  props={...base,requiresTarget:true,range:20,castTime:0,
   cooldown:20,cost:25,school:'shadow',channel:b.channel,
   projectile:false};
  byLevel=lv=>[effects(a,lv)[0],effects(b,lv)[0],effects(c,lv)[0]];
 }else if(id==='hf_warlock_u1'){
  if(a.targetMode!=='position'||a.effects[0]?.type!=='groundAoE'||
    b.effects[0]?.type!=='directDamage'||!b.effects[0].guaranteedCrit||
    b.projectileFx!=='heavyBolt'||a.school!=='fire'||b.school!=='fire')
   throw Error('SF26_WARLOCK_RAIN_CHAOS_BOLT_SOURCE_DRIFT');
  props={...base,requiresTarget:false,targetMode:'position',range:30,
   castTime:2.3,cooldown:25,cost:65,ruinCost:undefined,school:'fire',
   projectile:false,projectileFx:'heavyBolt'};
  byLevel=lv=>[...effects(a,lv),...effects(b,lv)];
 }else if(id==='hf_druid_s4'){
  if(a.effects.map(e=>e.type).join(',')!=='charge,stun'||
    b.effects[0]?.type!=='weaponDamage'||!b.onNextSwing||
    c.effects[0]?.type!=='aoeDamage'||a.minRange!==8||a.range!==25)
   throw Error('SF26_DRUID_BEAR_CHARGE_MAUL_SWIPE_SOURCE_DRIFT');
  props={...base,requiresTarget:true,range:25,minRange:8,
   castTime:0,cooldown:18,cost:0,school:'physical',
   usableInForm:true,projectile:false};
  byLevel=()=>effects(a,s.unlockLevel);
 }else{
  throw Error('SF26_UNKNOWN_ID:'+id);
 }
 const ranks=[...new Set([s.unlockLevel,...ds.flatMap(d=>
  (d.ranks??[]).filter(x=>x.level>s.unlockLevel&&x.level<=99).map(x=>x.level))])]
  .sort((x,y)=>x-y);
 return {...a,...props,id:s.id,class:s.classId,name:s.name,
  learnLevel:s.unlockLevel,effects:byLevel(ranks[0]),
  ranks:ranks.slice(1).map((lv,i)=>({rank:i+2,level:lv,
    cost:props.cost??0,effects:byLevel(lv)}))};
}
export function installSf26FiveNative(abilities:Registry,classes:Classes):string[]{
 const specs=Object.values(HIGHFLY_FUSED_SKILLS).flat();
 const staged:{id:string;cls:HighflyClass;def:AbilityDef}[]=[];
 for(const id of SF26_IDS){
  const s=specs.find(x=>x.id===id);
  if(!s||abilities[id]||!classes[s.classId]?.abilities||
   classes[s.classId].abilities.includes(id)||s.donors.join(',')!==DONORS[id])
    throw Error('SF26_DUPLICATE_OR_MISSING_CATALOG:'+id);
  staged.push({id,cls:s.classId,def:build(s,s.donors.map(d=>abilities[d]))});
 }
 if(staged.length!==5)throw Error('SF26_EXPECTED_5');
 for(const x of staged){abilities[x.id]=x.def;classes[x.cls].abilities.push(x.id);}
 return staged.map(x=>x.id);
}
