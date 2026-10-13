/** HIGHFLY SF16 — one genuinely new native fusion after authoritative dedup.
 * 28 already-certified SF4-SF15 skills MUST NOT be reinstalled.
 * Source mechanics stay frozen; this does not certify final VFX/physical S23.
 */
import type {AbilityDef,AbilityEffect} from '../sim/types';
import {HIGHFLY_FUSED_SKILLS,type HighflyClass} from './sf3_skill_catalog';
type Registry=Record<string,AbilityDef>;
type Classes=Record<HighflyClass,{abilities:string[]}>;
export const SF16_IDS=['hf_paladin_s5'] as const;
function snapshot(d:AbilityDef,lv:number):AbilityEffect[]{
 let effects=d.effects;
 for(const r of d.ranks??[])if(r.level<=lv)effects=r.effects;
 return effects.map(e=>({...e}));
}
function costAt(d:AbilityDef,lv:number):number{
 let n=d.cost;for(const r of d.ranks??[])if(r.level<=lv)n=r.cost;
 return n;
}
function build(abilities:Registry):AbilityDef{
 const spec=HIGHFLY_FUSED_SKILLS.paladin.find(s=>s.id==='hf_paladin_s5');
 if(!spec||spec.unlockLevel!==20||spec.donors.join(',')!=='solar_step,hammer_of_justice')
  throw Error('SF16 original catalog changed');
 const [speed,stun]=spec.donors.map(id=>abilities[id]);
 if(!speed||!stun||speed.id!=='solar_step'||stun.id!=='hammer_of_justice'||
  speed.class!=='paladin'||stun.class!=='paladin'||
  speed.requiresTarget||!stun.requiresTarget||stun.range!==10||
  speed.school!=='holy'||stun.school!=='holy'||speed.channel||stun.channel||
  speed.passive||stun.passive||speed.hiddenFromPlayer||stun.hiddenFromPlayer)
  throw Error('SF16 missing/changed original Paladin donors');
 const stages=[...new Set([spec.unlockLevel,...[speed,stun].flatMap(d=>
  (d.ranks??[]).map(r=>r.level).filter(l=>l>spec.unlockLevel&&l<=99))])]
  .sort((a,b)=>a-b);
 const resolved=stages.map(lv=>{
  const a=snapshot(speed,lv),b=snapshot(stun,lv);
  if(a.length!==1||b.length!==1||a[0].type!=='selfBuff'||
   a[0].kind!=='buff_speed'||b[0].type!=='stun')
   throw Error('SF16 original speed/stun rank drift at LV'+lv);
  return {lv,fx:[a[0],b[0]] as AbilityEffect[],
   cost:costAt(speed,lv)+Math.ceil(costAt(stun,lv)*.2)};
 });
 return {...speed,id:spec.id,name:spec.name,class:'paladin',
  learnLevel:spec.unlockLevel,requiresTarget:true,targetType:'enemy',range:10,
  cooldown:35,cost:resolved[0].cost,school:'holy',
  specs:undefined,excludeSpecs:undefined,excludeSpecsAtLevel:undefined,
  maxCharges:undefined,actionReplacement:undefined,
  effects:resolved[0].fx,
  ranks:resolved.slice(1).map((r,i)=>({rank:i+2,level:r.lv,
   cost:r.cost,effects:r.fx})),
  description:'Paso del Alba: carrera veloz de Solar Step + aturdimiento de Sundering Gavel. Fusion nativa, sin procs exclusivos por ID donante.'
 };
}
/** Atomic single-new-skill registration, fails closed on overlap. */
export function installSf16UniqueNative(abilities:Registry,classes:Classes):string[]{
 if(!classes.paladin?.abilities||abilities.hf_paladin_s5||
  classes.paladin.abilities.includes('hf_paladin_s5'))
  throw Error('SF16 already registered or missing class: hf_paladin_s5');
 const skill=build(abilities);
 abilities[skill.id]=skill;
 classes.paladin.abilities.push(skill.id);
 return [skill.id];
}
