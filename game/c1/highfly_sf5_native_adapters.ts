/**
 * HIGHFLY V10 / SF5 — three explicit, class-specific SAFE adaptations.
 * Tested only in frozen original ClaudeCraft Sim; NO implied production release.
 * No cloning arbitrary donor chains, party/saves/training remain untouched.
 */
import type {AbilityDef, AbilityEffect} from '../sim/types';
import type {HighflyFusionSpec} from './sf3_skill_catalog';

function effectsAt(def:AbilityDef,level:number):readonly AbilityEffect[]{
  let effects=def.effects;
  for(const r of def.ranks??[])if(r.level<=level)effects=r.effects;
  return effects;
}
function costAt(def:AbilityDef,level:number):number{
  let cost=def.cost;
  for(const r of def.ranks??[])if(r.level<=level)cost=r.cost;
  return cost;
}
function castAt(def:AbilityDef,level:number):number{
  let result=def.castTime;
  for(const r of def.ranks??[])if(r.level<=level && r.castTime!==undefined)result=r.castTime;
  return result;
}
function levels(unlock:number,...donors:AbilityDef[]):number[]{
  return [...new Set([unlock,...donors.flatMap(d=>(d.ranks??[]).map(r=>r.level))
    .filter(x=>x>unlock)])].sort((a,b)=>a-b);
}
function only(def:AbilityDef,level:number,type:AbilityEffect['type']):AbilityEffect{
  const effects=effectsAt(def,level);
  if(effects.length!==1 || effects[0].type!==type)
    throw new Error('SF5 changed source effects '+def.id+' at LV'+level);
  return effects[0];
}
function safeSolo(def:AbilityDef):boolean{
  return !def.passive && !def.hiddenFromPlayer && !def.specs?.length
    && !def.excludeSpecs?.length && !def.requiresForm && !def.channel
    && !def.actionReplacement && !def.requiresStealth && !def.offGcd
    && !def.onNextSwing && !def.requiresAuraKind && !def.requiresOutOfCombat
    && !def.maxCharges && !def.spendsCombo && !def.awardsCombo;
}

/** A frost blink into an arrival root: one cast, two genuine native effects. */
export function sf5MageArrivalNova(
  spec:HighflyFusionSpec,blink:AbilityDef,nova:AbilityDef,
):AbilityDef{
  if(spec.id!=='hf_mage_s3' || spec.donors.join(',')!=='blink,frost_nova'
    || [blink,nova].some(x=>x.class!=='mage' || x.learnLevel>spec.unlockLevel
       || x.requiresTarget || x.range!==0 || x.castTime!==0 || !safeSolo(x))
    || blink.school!=='arcane' || nova.school!=='frost'
    || blink.targetMode!==nova.targetMode || blink.minRange!==nova.minRange)
    throw new Error('SF5 Mage native blink/root contract changed');
  const snap=levels(spec.unlockLevel,blink,nova).map(level=>{
    const move=only(blink,level,'blinkForward'),root=only(nova,level,'aoeRoot');
    if(move.type!=='blinkForward' || move.distance!==15 || !move.breakRoots
      || root.type!=='aoeRoot' || root.ring || root.trap)
      throw new Error('SF5 Mage movement/root semantics changed');
    return {level,cost:Math.max(costAt(blink,level),costAt(nova,level)),
      effects:[move,root] as AbilityEffect[]};
  });
  return {...nova,id:spec.id,name:spec.name,class:spec.classId,
    learnLevel:spec.unlockLevel,castTime:0,
    cooldown:Math.max(22,blink.cooldown,nova.cooldown),
    cost:snap[0].cost,effects:snap[0].effects,
    ranks:snap.slice(1).map((s,i)=>({rank:i+2,level:s.level,cost:s.cost,effects:s.effects})),
    description:'HIGHFLY SF5 PILOTO: teletransporte y raíz al aterrizar. La raíz usa escuela Hielo. Requiere VFX/HUD QA.',
  };
}
/** Single direct heal merging 25% Tidecall: no double spell-power scale, no charge grant. */
export function sf5ShamanTidalMend(
  spec:HighflyFusionSpec,wave:AbilityDef,tide:AbilityDef,
):AbilityDef{
  if(spec.id!=='hf_shaman_s3' || spec.donors.join(',')!=='healing_wave,tidecall'
    || [wave,tide].some(x=>x.class!=='shaman' || x.school!=='nature'
       || x.learnLevel>spec.unlockLevel || !x.requiresTarget
       || x.targetType!=='friendly' || x.range!==30)
    || !safeSolo(wave) || tide.specs?.join(',')!=='restoration'
    || tide.maxCharges!==2 || wave.effects.length!==1 || tide.effects.length!==1)
    throw new Error('SF5 Shaman original heal contract changed');
  const snap=levels(spec.unlockLevel,wave).map(level=>{
    const base=only(wave,level,'heal'),extra=only(tide,level,'heal');
    if(base.type!=='heal' || extra.type!=='heal')
      throw new Error('SF5 Shaman heal types changed');
    return {level,cost:costAt(wave,level)+Math.ceil(costAt(tide,level)*0.25),
      castTime:castAt(wave,level),
      effects:[{...base,min:base.min+Math.round(extra.min*0.25),
        max:base.max+Math.round(extra.max*0.25)}] as AbilityEffect[]};
  });
  return {...wave,id:spec.id,name:spec.name,class:spec.classId,
    learnLevel:spec.unlockLevel,cooldown:Math.max(wave.cooldown,tide.cooldown),
    maxCharges:undefined,specs:undefined,
    cost:snap[0].cost,castTime:snap[0].castTime,effects:snap[0].effects,
    ranks:snap.slice(1).map((s,i)=>({rank:i+2,level:s.level,cost:s.cost,
      castTime:s.castTime,effects:s.effects})),
    description:'HIGHFLY SF5 PILOTO: un solo heal combinado. No hereda cargas o procs exclusivos de Tidecall.',
  };
}
/** LV10 heal+HoT, LV14 Regrowth begins contributing, not before. */
export function sf5DruidBloomMend(
  spec:HighflyFusionSpec,bloom:AbilityDef,regrowth:AbilityDef,touch:AbilityDef,
):AbilityDef{
  if(spec.id!=='hf_druid_s3'
    || spec.donors.join(',')!=='rejuvenation,regrowth,healing_touch'
    || [bloom,regrowth,touch].some(x=>x.class!=='druid'
      || x.school!=='nature'|| x.targetType!=='friendly'
      || !x.requiresTarget || x.range!==30 || !safeSolo(x))
    || bloom.learnLevel>spec.unlockLevel || touch.learnLevel>spec.unlockLevel
    || regrowth.learnLevel!==14 || effectsAt(regrowth,14).map(x=>x.type).join(',')!=='heal,hot')
    throw new Error('SF5 Druid heal+HoT donor contract changed');
  const snap=[...new Set([...levels(spec.unlockLevel,bloom,regrowth,touch),14])]
    .sort((a,b)=>a-b).map(level=>{
      const hot=only(bloom,level,'hot'),heal=only(touch,level,'heal');
      if(hot.type!=='hot'||heal.type!=='heal')
        throw new Error('SF5 Druid base heal or hot changed');
      let minBonus=0,maxBonus=0,hotBonus=0;
      if(level>=14){
        const rank=effectsAt(regrowth,level);
        if(rank.length!==2 || rank[0].type!=='heal' || rank[1].type!=='hot')
          throw new Error('SF5 Druid late regrowth changed');
        minBonus=Math.round(rank[0].min*0.3);
        maxBonus=Math.round(rank[0].max*0.3);
        hotBonus=Math.round(rank[1].total*0.3);
      }
      return {level,castTime:castAt(touch,level),
        cost:costAt(touch,level)+Math.ceil(costAt(bloom,level)*0.5)
          +(level>=14?Math.ceil(costAt(regrowth,level)*0.15):0),
        effects:[
          {...heal,min:heal.min+minBonus,max:heal.max+maxBonus},
          {...hot,total:hot.total+hotBonus},
        ] as AbilityEffect[]};
    });
  return {...touch,id:spec.id,name:spec.name,class:spec.classId,
    learnLevel:spec.unlockLevel,cooldown:8,
    cost:snap[0].cost,castTime:snap[0].castTime,effects:snap[0].effects,
    ranks:snap.slice(1).map((s,i)=>({rank:i+2,level:s.level,cost:s.cost,
      castTime:s.castTime,effects:s.effects})),
    description:'HIGHFLY SF5 PILOTO: un heal + HoT; segundo crecimiento Regrowth desde LV14.',
  };
}
