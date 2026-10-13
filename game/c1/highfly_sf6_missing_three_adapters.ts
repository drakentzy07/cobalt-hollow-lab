/**
 * HIGHFLY V10 SF6 — last 3 of 9 class pilot families (NOT the 63-skill release).
 * Explicit source-effect adaptation on the ORIGINAL ClaudeCraft Sim. Claude
 * source learn levels and spec flags DO NOT control distinct HIGHFLY skills.
 * No new resource manager, attacker, projectile type, or permanent stat boost.
 */
import type {AbilityDef,AbilityEffect} from '../sim/types';
import type {HighflyFusionSpec} from './sf3_skill_catalog';

function effAt(d:AbilityDef,lv:number):readonly AbilityEffect[]{
  let v=d.effects;for(const r of d.ranks??[])if(r.level<=lv)v=r.effects;return v;
}
function costAt(d:AbilityDef,lv:number):number{
  let v=d.cost;for(const r of d.ranks??[])if(r.level<=lv)v=r.cost;return v;
}
function levels(unlock:number,...sources:AbilityDef[]):number[]{
  return [...new Set([unlock,...sources.flatMap(x=>(x.ranks??[]).map(r=>r.level))
    .filter(x=>x>unlock)])].sort((a,b)=>a-b);
}
function only<T extends AbilityEffect['type']>(def:AbilityDef,lv:number,kind:T):Extract<AbilityEffect,{type:T}>{
  const e=effAt(def,lv);
  if(e.length!==1 || e[0].type!==kind)
    throw new Error('SF6 source effect changed: '+def.id+' @ LV'+lv);
  return e[0] as Extract<AbilityEffect,{type:T}>;
}
function validatePair(spec:HighflyFusionSpec,expected:string,cl:string,a:AbilityDef,b:AbilityDef):void{
  // Donors are effect-source templates. The original ClaudeCraft visibility,
  // passive, spec or learn-level flags are NOT restrictions for a separate
  // HF_* skill. Exact class/ID ownership and the native effect shapes below
  // remain mandatory; no donor definition is mutated.
  if(spec.id!==expected || spec.classId!==cl || spec.donors.join(',')!==[a.id,b.id].join(',')
    || a.class!==cl || b.class!==cl)
    throw new Error('SF6 wrong original source identity: '+spec.id
      + ' spec='+spec.donors.join(',')+' actual='+[a.id,b.id].join(',')
      + ' classes='+[a.class,b.class].join(','));
}

/** Paladin S1: targeted Holy strike + self-seal on the SAME cast.
 * The imbue effect runs on the caster, never on the struck enemy.
 * At HIGHFLY LV1 the original level-10 weapon bonus is scaled to 25%.
 */
export function sf6PaladinCrusaderSeal(
  spec:HighflyFusionSpec,strike:AbilityDef,seal:AbilityDef,
):AbilityDef {
  validatePair(spec,'hf_paladin_s1','paladin',strike,seal);
  if(strike.school!=='holy' || seal.school!=='holy'
    || !strike.requiresTarget || seal.requiresTarget
    || strike.range!==0 || seal.range!==0
    || strike.castTime!==0 || seal.castTime!==0
    || strike.effects.length!==1 || seal.effects.length!==1
    || strike.onNextSwing || seal.onNextSwing
    || strike.requiresForm || strike.requiresAuraKind || seal.requiresForm)
    throw new Error('SF6 Paladin mixed target contract changed');
  const snaps=levels(spec.unlockLevel,seal).concat([5,10,20])
    .filter((lv,i,all)=>all.indexOf(lv)===i).sort((a,b)=>a-b)
    .map(lv=>{
      const sword=only(strike,lv,'weaponStrike');
      const mark=only(seal,lv,'imbue');
      const mult=lv<5?0.25:lv<10?0.4:lv<20?0.6:1;
      return {lv,cost:Math.max(12,Math.round(costAt(strike,lv)*0.5))
          +Math.round(costAt(seal,lv)*0.2),
        effects:[{...sword,bonus:Math.max(1,Math.round(sword.bonus*mult))},mark] as AbilityEffect[]};
    });
  return {...strike,
    id:spec.id,name:spec.name,class:spec.classId,learnLevel:spec.unlockLevel,
    // A donor may be hidden/passive within Claude's tree, but HF_* is an
    // explicitly learned ACTIVE skill with its own unlock and visibility.
    hiddenFromPlayer:undefined,passive:undefined,
    specs:undefined,excludeSpecs:undefined,excludeSpecsAtLevel:undefined,
    cost:snaps[0].cost,cooldown:8,effects:snaps[0].effects,
    ranks:snaps.slice(1).map((s,i)=>({rank:i+2,level:s.lv,cost:s.cost,effects:s.effects})),
    description:'HIGHFLY SF6 piloto: golpe sagrado y sello propio; bonificación escalonada desde LV1. No copia procs de Oathstrike.',
  };
}

/** Hunter S5: melee weapon strike and the real 12-yard retreat, one GCD.
 * Trailbreak donor is off-GCD, but the combined hit/retreat is NOT: the
 * requested source's independent off-GCD perk is deliberately not inherited.
 */
export function sf6HunterRaptorRetreat(
  spec:HighflyFusionSpec,raptor:AbilityDef,retreat:AbilityDef,
):AbilityDef {
  validatePair(spec,'hf_hunter_s5','hunter',raptor,retreat);
  if(raptor.school!=='physical' || retreat.school!=='physical'
    || !raptor.requiresTarget || retreat.requiresTarget || raptor.range!==0 || retreat.range!==0
    || raptor.castTime!==0 || retreat.castTime!==0
    || retreat.cooldown!==15 || retreat.offGcd!==true
    || raptor.effects.length!==1 || retreat.effects.length!==1
    || raptor.onNextSwing || raptor.actionReplacement || retreat.actionReplacement
    || raptor.requiresForm || retreat.requiresForm)
    throw new Error('SF6 Hunter melee/retreat contract changed');
  const snaps=levels(spec.unlockLevel,raptor).map(lv=>{
    const strike=only(raptor,lv,'weaponStrike'),move=only(retreat,lv,'hunterTrailbreak');
    if(move.distance!==12)throw new Error('SF6 Hunter distance changed');
    return {lv,cost:costAt(raptor,lv),effects:[strike,move] as AbilityEffect[]};
  });
  return {...raptor,
    id:spec.id,name:spec.name,class:spec.classId,learnLevel:spec.unlockLevel,
    // A donor may be hidden/passive within Claude's tree, but HF_* is an
    // explicitly learned ACTIVE skill with its own unlock and visibility.
    hiddenFromPlayer:undefined,passive:undefined,
    specs:undefined,excludeSpecs:undefined,excludeSpecsAtLevel:undefined,
    offGcd:undefined,cooldown:15,cost:snaps[0].cost,effects:snaps[0].effects,
    ranks:snaps.slice(1).map((s,i)=>({rank:i+2,level:s.lv,cost:s.cost,effects:s.effects})),
    description:'HIGHFLY SF6 piloto: golpe corto seguido de retroceso 12 yd; sin procs originales dependientes del ID.',
  };
}

/** Warlock S2: one hybrid Shadow DoT from Corruption + 25% Agony,
 * not two same-ID DoT auras that would overwrite one another. Original
 * exclusions of both ClaudeCraft donors remain on donors but NOT on hf_*.
 */
export function sf6WarlockTwinCurse(
  spec:HighflyFusionSpec,rot:AbilityDef,agony:AbilityDef,
):AbilityDef {
  validatePair(spec,'hf_warlock_s2','warlock',rot,agony);
  if(rot.school!=='shadow' || agony.school!=='shadow'
    || !rot.requiresTarget || !agony.requiresTarget
    || rot.range!==30 || agony.range!==30 || rot.castTime!==2 || agony.castTime!==0
    || rot.effects.length!==1 || agony.effects.length!==1
    || rot.channel || agony.channel || rot.spendsCombo || agony.spendsCombo
    || rot.requiresStealth || agony.requiresStealth
    || rot.requiresForm || agony.requiresForm)
    throw new Error('SF6 Warlock DoT/DoT contract changed');
  const snaps=levels(spec.unlockLevel,rot,agony).map(lv=>{
    const dot=only(rot,lv,'dot'),extra=only(agony,lv,'dot');
    if(dot.duration!==18 || extra.duration!==24 || dot.interval!==3 || extra.interval!==3)
      throw new Error('SF6 Warlock DoT cadence changed');
    return {lv,cost:costAt(rot,lv)+Math.ceil(costAt(agony,lv)*0.25),
      effects:[{...dot,total:dot.total+Math.round(extra.total*0.25)}] as AbilityEffect[]};
  });
  return {...rot,
    id:spec.id,name:spec.name,class:spec.classId,learnLevel:spec.unlockLevel,
    // A donor may be hidden/passive within Claude's tree, but HF_* is an
    // explicitly learned ACTIVE skill with its own unlock and visibility.
    hiddenFromPlayer:undefined,passive:undefined,
    specs:undefined,excludeSpecs:undefined,excludeSpecsAtLevel:undefined,
    cooldown:6,cost:snaps[0].cost,effects:snaps[0].effects,
    ranks:snaps.slice(1).map((s,i)=>({rank:i+2,level:s.lv,cost:s.cost,effects:s.effects})),
    description:'HIGHFLY SF6 piloto: una maldición sombría de 18 s con 25% del daño nativo de Agonía; sin doble aura.',
  };
}
