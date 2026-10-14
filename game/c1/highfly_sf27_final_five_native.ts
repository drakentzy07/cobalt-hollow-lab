/** SF27 FINAL FIVE: native Rogue/Priest/Druid composites.
 * All donors come from frozen original ClaudeCraft. Explicit source hooks in
 * overlays/highfly_sf27_final_native_compat.py retain original Tithefiend,
 * conditional resurrection and six-tick Hurricane mechanics.
 */
import type {AbilityDef,AbilityEffect} from '../sim/types';
import {HIGHFLY_FUSED_SKILLS,type HighflyClass,type HighflyFusionSpec} from './sf3_skill_catalog';
type Registry=Record<string,AbilityDef>;
type Classes=Record<HighflyClass,{abilities:string[]}>;
export const SF27_IDS=['hf_rogue_u2','hf_priest_u1','hf_priest_u2','hf_druid_u1','hf_druid_u2'] as const;
type Id=typeof SF27_IDS[number];
const SOURCES:Record<Id,string>={
 hf_rogue_u2:'stealth,blind,ambush',
 hf_priest_u1:'prayer_of_healing,prayer_of_returning',
 hf_priest_u2:'summon_tithefiend,psychic_scream',
 hf_druid_u1:'grove_awakening,wildwake',
 hf_druid_u2:'starfire,moonseed,hurricane'
};
function ranked(d:AbilityDef,level:number):AbilityEffect[]{
 let effects=d.effects;
 for(const r of d.ranks??[])if(r.level<=level)effects=r.effects;
 return effects.map(e=>({...e}));
}
function create(s:HighflyFusionSpec,ds:AbilityDef[]):AbilityDef{
 const id=s.id as Id,[a,b,c]=ds;
 if(s.donors.join(',')!==SOURCES[id]||ds.length!==s.donors.length||
   ds.some((d,i)=>!d||d.id!==s.donors[i]||d.class!==s.classId||d.passive||d.hiddenFromPlayer))
   throw Error('SF27_SOURCE_DONOR_MISSING_OR_CHANGED:'+id);
 const common:Partial<AbilityDef>={
  specs:undefined,excludeSpecs:undefined,excludeSpecsAtLevel:undefined,
  requiresForm:undefined,actionReplacement:undefined,
  projectile:false,offGcd:undefined,description:
  'HIGHFLY SF27 native original '+s.donors.join(' + ')+
  '; original combat/VFX semantics kept through strict SF27 compatibility.'
 };
 let props:Partial<AbilityDef>;
 let fx:(level:number)=>AbilityEffect[];
 if(id==='hf_rogue_u2'){
  if(a.effects[0]?.type!=='selfBuff'||a.effects[0].kind!=='stealth'||
    b.effects[0]?.type!=='incapacitate'||c.effects[0]?.type!=='weaponStrike'||
    c.effects[0].weaponMult!==2.5||!c.effects[0].requiresBehind)
    throw Error('SF27_ROGUE_STEALTH_BLIND_AMBUSH_SOURCE_CHANGED');
  props={...common,learnLevel:s.unlockLevel,requiresTarget:true,
   requiresOutOfCombat:undefined,requiresStealth:undefined,
   requiresTargetHpBelow:undefined,range:5,castTime:0,cost:60,cooldown:90,
   school:'physical',targetMode:undefined,awardsCombo:1};
  fx=lv=>[
    // Attack first, then Blind: original damage would immediately break
    // original break-on-damage crowd control in the reverse order.
    // HIGHFLY ultimate: the native Ambush strike is guaranteed against
    // dodge (but still follows the source hit/miss and damage rules).
    // A 90-second signature ability must not whiff solely to 5% RNG dodge.
    {...ranked(c,lv)[0],requiresBehind:false,cannotBeDodged:true},
    ...ranked(b,lv),
    // A brief veil after the ambush (not 3600s / original out-of-combat
    // stealth) is a native status that breaks on the next hostile hit.
    {...ranked(a,lv)[0],duration:3}
  ];
 }else if(id==='hf_priest_u1'){
  if(a.effects[0]?.type!=='aoeHeal'||b.effects[0]?.type!=='massResurrectGroup'||
    !b.requiresOutOfCombat||b.castTime!==7)
    throw Error('SF27_PRIEST_GROUP_HEAL_MASSRES_SOURCE_CHANGED');
  props={...common,requiresTarget:false,requiresOutOfCombat:true,
   cost:250,castTime:7,cooldown:300,range:0,school:'holy',
   targetMode:undefined,requiresAuraKind:undefined};
  fx=lv=>[...ranked(a,lv),...ranked(b,lv)];
 }else if(id==='hf_priest_u2'){
  if(a.effects.length!==0||a.requiresAuraKind!=='gloomtithe'||
    a.consumesRequiredAura!==false||b.effects[0]?.type!=='aoeFear')
   throw Error('SF27_TITHEFIEND_VESPERS_FEAR_SOURCE_CHANGED');
  props={...common,requiresTarget:false,cost:60,cooldown:60,
   castTime:0,range:0,school:'shadow',targetMode:undefined,
   // The base Highfly Priest has no forced ClaudeCraft specialization.
   // Tithefiend uses 1 native Gloomtithe stack minimum, consuming banked
   // source stacks if present; casting remains usable for all nine classes.
   requiresAuraKind:undefined,consumesRequiredAura:false};
  fx=lv=>ranked(b,lv);
 }else if(id==='hf_druid_u1'){
  if(a.effects[0]?.type!=='massResurrectGroup'||!a.requiresOutOfCombat||
    b.effects[0]?.type!=='resurrectAlly'||!b.targetsDead||
    b.targetType!=='friendly')
   throw Error('SF27_DRUID_DUAL_RESS_SOURCE_CHANGED');
  // In combat: source Wildwake targets one dead ally. Outside combat: original
  // Grove Awakening summons all dead party members. SF27 source adapter
  // explicitly protects the mass-res effect from firing in combat.
  props={...common,requiresTarget:true,targetsDead:true,targetType:'friendly',
   requiresOutOfCombat:undefined,range:30,castTime:2,cooldown:300,
   cost:90,school:'nature',targetMode:undefined};
  fx=lv=>[...ranked(b,lv),...ranked(a,lv)];
 }else if(id==='hf_druid_u2'){
  if(a.effects[0]?.type!=='directDamage'||b.effects[0]?.type!=='directDamage'||
    c.effects[0]?.type!=='aoeDamage'||c.targetMode!=='position'||
    c.channel?.ticks!==6||c.channel.duration!==6)
   throw Error('SF27_STARS_MOONSEED_HURRICANE_SOURCE_CHANGED');
  props={...common,requiresTarget:false,requiresAuraKind:undefined,
   requiresOutOfCombat:undefined,range:30,castTime:0,cost:120,
   cooldown:30,school:'nature',targetMode:'position',channel:{...c.channel}};
  fx=lv=>[...ranked(c,lv),...ranked(a,lv),...ranked(b,lv)];
 }else throw Error('SF27_UNKNOWN:'+id);
 const ranks=[...new Set([s.unlockLevel,...ds.flatMap(d=>
  (d.ranks??[]).filter(r=>r.level>s.unlockLevel&&r.level<=99).map(r=>r.level))])]
  .sort((x,y)=>x-y);
 return {...a,...props,id:s.id,name:s.name,class:s.classId,
  learnLevel:s.unlockLevel,effects:fx(ranks[0]),
  ranks:ranks.slice(1).map((lv,i)=>({rank:i+2,level:lv,
    cost:props.cost??0,effects:fx(lv)}))};
}
export function installSf27FinalFive(abilities:Registry,classes:Classes):string[]{
 const catalog=Object.values(HIGHFLY_FUSED_SKILLS).flat();
 const staged:{id:string;cls:HighflyClass;def:AbilityDef}[]=[];
 for(const id of SF27_IDS){
  const s=catalog.find(x=>x.id===id);
  if(!s||abilities[id]||!classes[s.classId]?.abilities||
    classes[s.classId].abilities.includes(id)||s.donors.join(',')!==SOURCES[id])
    throw Error('SF27_DUPLICATE_OR_MISSING:'+id);
  staged.push({id,cls:s.classId,def:create(s,s.donors.map(d=>abilities[d]))});
 }
 if(staged.length!==5)throw Error('SF27_EXPECTED_FINAL_FIVE');
 for(const x of staged){abilities[x.id]=x.def;classes[x.cls].abilities.push(x.id);}
 return staged.map(x=>x.id);
}
