/** SF22: original ClaudeCraft Sim effects, 3 native HIGHFLY fusions. */
import type {AbilityDef,AbilityEffect} from '../sim/types';
import {HIGHFLY_FUSED_SKILLS,type HighflyClass,type HighflyFusionSpec} from './sf3_skill_catalog';
type Registry=Record<string,AbilityDef>;
type Classes=Record<HighflyClass,{abilities:string[]}>;
export const SF22_IDS=['hf_paladin_u1','hf_hunter_s4','hf_mage_u2'] as const;
const CONTRACT:Record<typeof SF22_IDS[number],string>={
 hf_paladin_u1:'final_edict,sun_gods_verdict',
 hf_hunter_s4:'shrapnel_charge,volley',
 hf_mage_u2:'temporal_hourglass,combustion'
};
function effects(d:AbilityDef,level:number):AbilityEffect[]{
 let e=d.effects;for(const r of d.ranks??[])if(r.level<=level)e=r.effects;
 return e.map(x=>({...x}));
}
function fused(s:HighflyFusionSpec,a:AbilityDef,b:AbilityDef,level:number):AbilityEffect[]{
 const x=effects(a,level),y=effects(b,level);
 if(s.id==='hf_paladin_u1'){
  if(x.length!==1||x[0].type!=='weaponStrike'||y.length!==1||y[0].type!=='sunGodVerdict')
   throw Error('SF22 paladin original effects changed');
  // Apply the original verdict mark first. Then land the original Edict strike.
  // Source-ID bridge in the isolated test worktree credits this as Final Edict.
  return [y[0],x[0]];
 }
 if(s.id==='hf_hunter_s4'){
  if(x.length!==1||x[0].type!=='hunterShrapnel'||y.length!==1||
   y[0].type!=='aoeDamage'||y[0].radius!==8)
   throw Error('SF22 hunter original effects changed');
  // One native volley pulse, not an invented six-tick instant channel.
  // Native AoE center bridge uses the selected enemy, not the caster.
  return [x[0],y[0]];
 }
 if(s.id==='hf_mage_u2'){
  if(x.length!==1||x[0].type!=='temporalHourglass'||y.length!==1||
   y[0].type!=='selfBuff'||y[0].kind!=='combustion')
   throw Error('SF22 mage original effects changed');
  // The native hourglass area and native Phoenix aura stay independent.
  return [x[0],{...y[0],auraId:s.id+'_phoenix'}];
 }
 throw Error('SF22 unknown fusion '+s.id);
}
function build(s:HighflyFusionSpec,a:AbilityDef,b:AbilityDef):AbilityDef{
 const id=s.id as typeof SF22_IDS[number];
 if(!CONTRACT[id]||s.donors.join(',')!==CONTRACT[id]||!a||!b||
  a.id!==s.donors[0]||b.id!==s.donors[1]||a.class!==s.classId||
  b.class!==s.classId||a.passive||b.passive||a.hiddenFromPlayer||b.hiddenFromPlayer||
  a.requiresQuest||b.requiresQuest||a.requiresAuraKind||b.requiresAuraKind)
  throw Error('SF22 original donor missing or changed '+s.id);
 if(id==='hf_paladin_u1'&&(
   !a.requiresTarget||!b.requiresTarget||a.range!==0||b.range!==30||
   a.school!=='physical'||b.school!=='holy'||a.onNextSwing||a.channel||b.channel))
  throw Error('SF22 original Paladin source-target mismatch');
 if(id==='hf_hunter_s4'&&(
   !a.requiresTarget||a.range!==25||b.requiresTarget||
   b.targetMode!=='position'||!b.channel||b.channel.ticks!==6||
   a.school!=='physical'||b.school!=='physical'))
  throw Error('SF22 original Hunter source-target mismatch');
 if(id==='hf_mage_u2'&&(
   a.requiresTarget||b.requiresTarget||a.targetMode!=='position'||
   a.range!==28||b.range!==0||a.school!=='arcane'||b.school!=='fire'||
   a.channel||b.channel))
  throw Error('SF22 original Mage source-target mismatch');
 const cost=id==='hf_paladin_u1'?25:id==='hf_hunter_s4'?60:110;
 const lvls=[...new Set([s.unlockLevel,...[a,b].flatMap(d=>(d.ranks??[])
  .filter(r=>r.level>s.unlockLevel&&r.level<=99).map(r=>r.level))])].sort((x,y)=>x-y);
 const rows=lvls.map(l=>({level:l,fx:fused(s,a,b,l)}));
 const fields:Partial<AbilityDef>={
  specs:undefined,excludeSpecs:undefined,excludeSpecsAtLevel:undefined,
  hiddenFromPlayer:undefined,requiresQuest:undefined,requiresAuraKind:undefined,
  consumesRequiredAura:undefined,actionReplacement:undefined,
  onNextSwing:undefined,offGcd:undefined,channel:undefined,maxCharges:undefined,
  cost,cooldown:id==='hf_paladin_u1'?8:id==='hf_hunter_s4'?15:120,
  castTime:0,projectile:false,
  requiresTarget:id!=='hf_mage_u2',
  targetMode:id==='hf_mage_u2'?'position':undefined,
  range:id==='hf_paladin_u1'?0:id==='hf_hunter_s4'?25:28,
  minRange:undefined,school:id==='hf_mage_u2'?'arcane':'physical',
  description:'HIGHFLY SF22 '+s.name+': native ClaudeCraft '+s.donors.join(' + ')+
   '. No new renderer. Original donor-ID extras and final VFX remain separate QA.'
 };
 return {...a,...fields,id:s.id,class:s.classId,name:s.name,
  learnLevel:s.unlockLevel,effects:rows[0].fx,
  ranks:rows.slice(1).map((x,i)=>({rank:i+2,level:x.level,cost,effects:x.fx}))};
}
export function installSf22ThreeNative(abilities:Registry,classes:Classes):string[]{
 const all=Object.values(HIGHFLY_FUSED_SKILLS).flat();
 const batch:{id:string;cls:HighflyClass;def:AbilityDef}[]=[];
 for(const id of SF22_IDS){
  const s=all.find(x=>x.id===id);
  if(!s||abilities[id]||!classes[s.classId]?.abilities||
   classes[s.classId].abilities.includes(id)||s.donors.length!==2)
   throw Error('SF22 duplicate/missing catalog '+id);
  batch.push({id,cls:s.classId,def:build(s,abilities[s.donors[0]],abilities[s.donors[1]])});
 }
 if(batch.length!==3)throw Error('SF22 expected 3');
 for(const x of batch){abilities[x.id]=x.def;classes[x.cls].abilities.push(x.id);}
 return batch.map(x=>x.id);
}
