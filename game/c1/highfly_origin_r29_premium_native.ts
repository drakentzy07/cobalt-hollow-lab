/**
 * HIGHFLY R29 P2: namespaced premium spell definitions registered into Claude's
 * ORIGINAL authoritative combat registry. All damage is emitted by Sim.
 * Values are PROVISIONAL playtest balance, never from short demo cooldowns.
 * Persistent portal travel/summon AI/barrier blocking are NOT claimed complete.
 */
import type {AbilityDef,AbilityEffect} from './types';
import {ABILITIES} from './content/classes';
import {R27_PREMIUM_23} from './highfly_origin_r27_premium23_catalog';

export type R29NativeReadiness='native-damage'|'control-zone'|'visual-only-behavior-pending';
export interface R29PremiumContract{
 id:string;sourceId:string;source:string;name:string;aim:string;range:number;radius:number;
 role:string;mana:number;cooldown:number;minDamage:number;maxDamage:number;
 readiness:R29NativeReadiness;
}
const LABELS:Record<string,string>={
 hf_vfx23_frost_lance:'Frost Lance',hf_vfx23_storm_lance:'Storm Lance',
 hf_vfx23_cinder_fall:'Cinder Fall',hf_vfx23_nova_beam:'Nova Beam',
 hf_vfx23_voltaic_snare:'Voltaic Snare',hf_vfx23_glacial_crown:'Glacial Crown',
 hf_vfx23_pyre_crown:'Pyre Crown',hf_vfx23_kraken_crown:'Kraken Crown',
 hf_vfx23_electrical_sphere:'Electrical Sphere',hf_vfx23_earthen_spire:'Earthen Spire',
 hf_vfx23_verdant_gate:'Verdant Gate',hf_vfx23_tidewrought_ring:'Tidewrought Ring',
 hf_vfx23_fire_portal:'Fire Portal',hf_vfx23_volcanic_horror_ward:'Volcanic Horror Ward',
 hf_vfx23_caustic_bloom:'Caustic Bloom',hf_vfx23_arborists_growth:"Arborist's Growth",
 hf_vfx23_cyber_serpent:'Cyber Serpent',hf_vfx23_crystallized_venom_surge:'Crystallized Venom Surge',
 hf_vfx23_brutalist_earth_blast:'Brutalist Earth Blast',
 hf_vfx23_sumi_tide:'Sumi Tide',hf_vfx23_astral_void_blast:'Astral Void Blast',
 hf_vfx23_baleful_cascade_mark:'Baleful Cascade Mark',
 hf_vfx23_celestial_rend:'Celestial Rend'
};
const FIXED_SOURCE_COUNTS:Record<string,number>={casting6:6,effects7:7,advanced10:10};
const MAGIC:Record<string,AbilityDef['school']>={
 ice:'frost',thunder:'nature',meteor:'fire',beam:'arcane',snare:'nature',
 glacier:'frost',pyre:'fire',kraken:'frost',electrical:'nature',
 earth:'nature',portal:'nature',aether:'arcane',firePortal:'fire',
 ward:'fire',acid:'nature',growth:'nature',cyber:'arcane',
 venom:'nature',quake:'nature',ink:'shadow',astral:'shadow',
 cascade:'shadow',rend:'holy'
};
/** Stable local spell contracts. A benchmark, not inherited vendor balance. */
export const R29_PREMIUM_CONTRACTS:readonly R29PremiumContract[]=R27_PREMIUM_23.map(d=>{
 const pending=d.role==='portal'||d.role==='summon'||d.role==='barrier';
 const control=d.role==='control';
 // Native world-distance is independent from the vendor's authoring scale.
 const range=Math.min(30,Math.max(10,Math.round(d.demoMaxRange*1.2)));
 const radius=d.demoRadius>0?Math.max(3,Math.min(9,d.demoRadius*1.35)):2;
 const mana=d.role==='portal'?55:d.role==='barrier'?50:d.role==='summon'?65:
   d.role==='channel'?48:d.role==='projectile'?28:42;
 const cooldown=d.role==='portal'?35:d.role==='summon'?30:
   d.role==='barrier'?24:d.role==='channel'?14:
   d.role==='control'?18:d.role==='projectile'?6:16;
 const minDamage=Math.round((30+d.index*2)*.9);
 const maxDamage=Math.round((30+d.index*2)*1.2);
 return {id:d.id,sourceId:d.sourceId,source:d.source,aim:d.aim,role:d.role,
   name:LABELS[d.id]??d.id,range,radius,mana,cooldown,minDamage,maxDamage,
   readiness:pending?'visual-only-behavior-pending':control?'control-zone':'native-damage'};
});
function nativeEffects(c:R29PremiumContract):AbilityEffect[]{
 if(c.readiness==='visual-only-behavior-pending')return [];
 if(c.aim==='line'){
  if(c.role==='channel')
    return [{type:'directDamage',min:c.minDamage,max:c.maxDamage}];
  return [{type:'directDamage',min:c.minDamage,max:c.maxDamage}];
 }
 return [{
   type:'groundAoE',
   min:c.minDamage,
   max:c.maxDamage,
   radius:c.radius,
   duration:c.role==='control'?5:1,
   interval:c.role==='control'?1:1,
   ...(c.role==='control'?{slowMult:0.65,slowDuration:2}:{}),
 }];
}
/** Only R29 opt-in import invokes registration. Native ability data untouched. */
export function installR29PremiumNativeContracts():void{
 if(R29_PREMIUM_CONTRACTS.length!==23||
    Object.keys(FIXED_SOURCE_COUNTS).some(s=>
      R29_PREMIUM_CONTRACTS.filter(x=>x.source===s).length!==FIXED_SOURCE_COUNTS[s]))
   throw Error('R29_VENDOR_CONTRACT_COVERAGE_DRIFT');
 for(const c of R29_PREMIUM_CONTRACTS){
  if(ABILITIES[c.id])throw Error('R29_NATIVE_SKILL_ID_COLLISION_'+c.id);
  const positional=c.aim!=='line';
  const def:AbilityDef={
   id:c.id,name:c.name,class:'mage',learnLevel:1,
   school:MAGIC[c.sourceId]??'arcane',
   cost:c.mana,cooldown:c.cooldown,castTime:c.role==='channel'?1.2:0,
   range:c.range,requiresTarget:!positional,
   ...(positional?{targetMode:'position' as const}:{}),
   // A pending portal/AI/physical barrier cannot be represented as fake damage:
   // keep native definition hidden until its semantics are truly ported.
   hiddenFromPlayer:c.readiness==='visual-only-behavior-pending',
   effects:nativeEffects(c),
   description:'HIGHFLY R29 Premium MIT VFX · '+c.role+
     ' · playtest values; independent authored source visuals',
  };
  ABILITIES[c.id]=def;
 }
}
export const R29_PREMIUM_READY_TO_CAST=R29_PREMIUM_CONTRACTS.filter(x=>
  x.readiness!=='visual-only-behavior-pending').map(x=>x.id);
