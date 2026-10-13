/**
 * HIGHFLY SF16 — 8 source-faithful elemental, utility and support adaptations.
 * Source: frozen original ClaudeCraft AbilityDef effects, no bespoke combat logic.
 * No VFX invented, talent ID-keyed donor procs not falsely claimed.
 */
import type {AbilityDef,AbilityEffect} from '../sim/types';
import {HIGHFLY_FUSED_SKILLS,type HighflyClass,type HighflyFusionSpec} from './sf3_skill_catalog';
type Registry=Record<string,AbilityDef>;
type Classes=Record<HighflyClass,{abilities:string[]}>;
export const SF16_IDS=[
 'hf_warrior_u1','hf_paladin_s5','hf_priest_s2','hf_priest_s3',
 'hf_shaman_s2','hf_shaman_s3','hf_mage_s3','hf_warlock_s1'
] as const;
const DONORS:Record<typeof SF16_IDS[number],string>={
 hf_warrior_u1:'battle_shout,rallying_cry',
 hf_paladin_s5:'solar_step,hammer_of_justice',
 hf_priest_s2:'mind_blast,shadow_word_pain',
 hf_priest_s3:'power_word_shield,renew',
 hf_shaman_s2:'flame_shock,lava_burst',
 hf_shaman_s3:'healing_wave,tidecall',
 hf_mage_s3:'blink,frost_nova',
 hf_warlock_s1:'shadow_bolt,soul_lance'
};
function effectsAt(d:AbilityDef,lv:number):AbilityEffect[]{
 let effects=d.effects;
 for(const r of d.ranks??[])if(r.level<=lv)effects=r.effects;
 return effects.map(x=>({...x}));
}
function costAt(d:AbilityDef,lv:number):number{
 let n=d.cost;for(const r of d.ranks??[])if(r.level<=lv)n=r.cost;return n;
}
function castAt(d:AbilityDef,lv:number):number{
 let n=d.castTime;for(const r of d.ranks??[])if(r.level<=lv&&r.castTime!==undefined)n=r.castTime;
 return n;
}
function required(e:AbilityEffect|undefined,t:AbilityEffect['type'],id:string):void{
 if(!e||e.type!==t)throw Error('SF16 native effect contract changed '+id+' '+t);
}
function inspect(s:HighflyFusionSpec,a:AbilityDef,b:AbilityDef):void{
 const id=s.id;
 if(s.donors.join(',')!==DONORS[id as keyof typeof DONORS]||
  a.class!==s.classId||b.class!==s.classId||
  a.passive||b.passive||a.hiddenFromPlayer||b.hiddenFromPlayer||
  a.channel||b.channel||a.requiresForm||b.requiresForm||
  a.requiresStealth||b.requiresStealth||a.spendsCombo||b.spendsCombo)
  throw Error('SF16 source class/contract drift '+id);
 if(id==='hf_warrior_u1'){
  required(a.effects[0],'buffTarget',id);required(b.effects[0],'aoeAllyMaxHp',id);
  if(a.effects.length!==1||b.effects.length!==1||a.effects[0].type!=='buffTarget'||
   !a.effects[0].party||a.requiresTarget||b.requiresTarget||b.effects[0].type!=='aoeAllyMaxHp')
    throw Error('SF16 shouts changed');
 }else if(id==='hf_paladin_s5'){
  required(a.effects[0],'selfBuff',id);required(b.effects[0],'stun',id);
  if(a.effects.length!==1||b.effects.length!==1||b.range!==10||
   a.requiresTarget||!b.requiresTarget)throw Error('SF16 paladin changed');
 }else if(id==='hf_priest_s2'){
  required(a.effects[0],'directDamage',id);required(b.effects[0],'dot',id);
  if(a.effects.length!==1||b.effects.length!==1||a.school!=='shadow'||b.school!=='shadow'||
   !a.requiresTarget||!b.requiresTarget||a.range!==b.range)
   throw Error('SF16 priest shadow changed');
 }else if(id==='hf_priest_s3'){
  required(a.effects[0],'absorb',id);required(b.effects[0],'hot',id);
  if(a.effects.length!==1||b.effects.length!==1||a.targetType!=='friendly'||
   b.targetType!=='friendly'||a.range!==b.range)
   throw Error('SF16 priest healing changed');
 }else if(id==='hf_shaman_s2'){
  required(a.effects[0],'directDamage',id);required(a.effects[1],'dot',id);
  required(b.effects[0],'directDamage',id);
  if(a.effects.length!==2||b.effects.length!==1||
   a.school!=='fire'||b.school!=='fire'||!a.requiresTarget||!b.requiresTarget)
   throw Error('SF16 shaman fire changed');
 }else if(id==='hf_shaman_s3'){
  required(a.effects[0],'heal',id);required(b.effects[0],'heal',id);
  if(a.effects.length!==1||b.effects.length!==1||
   a.targetType!=='friendly'||b.targetType!=='friendly')
   throw Error('SF16 shaman heal changed');
 }else if(id==='hf_mage_s3'){
  required(a.effects[0],'blinkForward',id);required(b.effects[0],'aoeRoot',id);
  if(a.effects.length!==1||b.effects.length!==1||a.requiresTarget||b.requiresTarget||
   a.effects[0].type!=='blinkForward'||a.effects[0].distance!==15)
   throw Error('SF16 blink control changed');
 }else if(id==='hf_warlock_s1'){
  required(a.effects[0],'directDamage',id);required(b.effects[0],'directDamage',id);
  if(a.effects.length!==1||b.effects.length!==1||a.school!=='shadow'||
   b.school!=='shadow'||a.range!==b.range||!a.requiresTarget||!b.requiresTarget)
   throw Error('SF16 warlock shadow changed');
 }else throw Error('SF16 unexpected id '+id);
}
function mix(s:HighflyFusionSpec,a:AbilityDef,b:AbilityDef,lv:number):AbilityEffect[]{
 const x=effectsAt(a,lv),y=effectsAt(b,lv);
 const id=s.id;
 // Reject rank divergence; do not silently flatten native effects.
 const shape:Record<typeof SF16_IDS[number],AbilityEffect['type'][][]>={
  hf_warrior_u1:[['buffTarget'],['aoeAllyMaxHp']],
  hf_paladin_s5:[['selfBuff'],['stun']],
  hf_priest_s2:[['directDamage'],['dot']],
  hf_priest_s3:[['absorb'],['hot']],
  hf_shaman_s2:[['directDamage','dot'],['directDamage']],
  hf_shaman_s3:[['heal'],['heal']],
  hf_mage_s3:[['blinkForward'],['aoeRoot']],
  hf_warlock_s1:[['directDamage'],['directDamage']]
 };
 if(x.map(e=>e.type).join(',')!==shape[id as keyof typeof shape][0].join(',')||
  y.map(e=>e.type).join(',')!==shape[id as keyof typeof shape][1].join(','))
  throw Error('SF16 rank effect drift '+id+' LV'+lv);
 if(id==='hf_warrior_u1')return [x[0],y[0]];
 if(id==='hf_paladin_s5')return [x[0],y[0]];
 if(id==='hf_priest_s2'){
  const dot=y[0];
  if(dot.type!=='dot')throw Error('SF16 missing priest DOT');
  return [x[0],{...dot,total:Math.max(1,Math.round(dot.total*.65)),
   duration:dot.duration,interval:dot.interval}];
 }
 if(id==='hf_priest_s3'){
  const hot=y[0];if(hot.type!=='hot')throw Error('SF16 missing priest HOT');
  return [{...x[0],auraId:id+'_shield'},
   {...hot,total:Math.max(1,Math.round(hot.total*.65))}];
 }
 if(id==='hf_shaman_s2'){
  if(x[0].type!=='directDamage'||y[0].type!=='directDamage')
   throw Error('SF16 fire direct mismatch');
  return [{...x[0],min:x[0].min+Math.round(y[0].min*.35),
    max:x[0].max+Math.round(y[0].max*.35)},x[1]];
 }
 if(id==='hf_shaman_s3'){
  if(x[0].type!=='heal'||y[0].type!=='heal')throw Error('SF16 heal mismatch');
  return [{...x[0],min:x[0].min+Math.round(y[0].min*.35),
    max:x[0].max+Math.round(y[0].max*.35)}];
 }
 if(id==='hf_mage_s3')return [x[0],{...y[0],duration:Math.min(3,y[0].duration)}];
 if(id==='hf_warlock_s1'){
  if(x[0].type!=='directDamage'||y[0].type!=='directDamage')
   throw Error('SF16 warlock damage mismatch');
  return [{...x[0],min:x[0].min+Math.round(y[0].min*.35),
   max:x[0].max+Math.round(y[0].max*.35)}];
 }
 throw Error('SF16 invalid effect '+id);
}
function build(s:HighflyFusionSpec,a:AbilityDef,b:AbilityDef):AbilityDef{
 inspect(s,a,b);
 const stages=[...new Set([s.unlockLevel,...[a,b].flatMap(d=>(d.ranks??[])
  .map(r=>r.level).filter(l=>l>s.unlockLevel&&l<=99))])].sort((a,b)=>a-b);
 const snap=stages.map(lv=>({lv,fx:mix(s,a,b,lv),
  cost:costAt(a,lv)+Math.ceil(costAt(b,lv)*.2),cast:castAt(a,lv)}));
 const cooldown:Record<typeof SF16_IDS[number],number>={
  hf_warrior_u1:180,hf_paladin_s5:35,hf_priest_s2:8,hf_priest_s3:12,
  hf_shaman_s2:8,hf_shaman_s3:12,hf_mage_s3:30,hf_warlock_s1:8
 };
 const patch:Partial<AbilityDef>={
  specs:undefined,excludeSpecs:undefined,excludeSpecsAtLevel:undefined,
  maxCharges:undefined,actionReplacement:undefined,
  requiresAuraKind:undefined,requiresStealth:undefined,
  learnLevel:s.unlockLevel,cooldown:cooldown[s.id as keyof typeof cooldown],
  cost:snap[0].cost,castTime:snap[0].cast,
  description:'HIGHFLY SF16: '+s.name+'. Fusión nativa comprobable de '+
   s.donors.join(' + ')+'. Los procs exclusivos del ID donante no se transfieren.'
 };
 if(s.id==='hf_paladin_s5')Object.assign(patch,{requiresTarget:true,range:10,school:'holy'});
 if(s.id==='hf_priest_s3')Object.assign(patch,{targetType:'friendly'});
 return {...a,...patch,id:s.id,name:s.name,class:s.classId,effects:snap[0].fx,
  ranks:snap.slice(1).map((r,i)=>({rank:i+2,level:r.lv,cost:r.cost,
   castTime:r.cast,effects:r.fx}))};
}
export function installSf16EightNative(abilities:Registry,classes:Classes):string[]{
 const catalog=Object.values(HIGHFLY_FUSED_SKILLS).flat();
 const staged:{id:string;cls:HighflyClass;def:AbilityDef}[]=[];
 for(const id of SF16_IDS){
  const s=catalog.find(x=>x.id===id);
  if(!s||s.donors.length!==2||abilities[id]||
   !classes[s.classId]?.abilities||classes[s.classId].abilities.includes(id))
   throw Error('SF16 missing/duplicate catalog '+id);
  const [a,b]=s.donors.map(d=>abilities[d]);
  if(!a||!b||a.id!==s.donors[0]||b.id!==s.donors[1])
   throw Error('SF16 missing exact original donor '+id);
  staged.push({id,cls:s.classId,def:build(s,a,b)});
 }
 if(staged.length!==8)throw Error('SF16 did not stage 8');
 for(const x of staged){abilities[x.id]=x.def;classes[x.cls].abilities.push(x.id);}
 return staged.map(x=>x.id);
}
