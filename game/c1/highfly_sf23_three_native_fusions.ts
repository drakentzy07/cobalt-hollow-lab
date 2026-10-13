/** HIGHFLY SF23: three pinned ORIGINAL ClaudeCraft effect combinations.
 * Safe isolated opt-in only. No parallel Sim, no new VFX/render code.
 * Notes: original ID-specific procs and independent element VFX are NOT certified.
 */
import type {AbilityDef,AbilityEffect} from '../sim/types';
import {HIGHFLY_FUSED_SKILLS,type HighflyClass,type HighflyFusionSpec} from './sf3_skill_catalog';
type Registry=Record<string,AbilityDef>;
type Classes=Record<HighflyClass,{abilities:string[]}>;
export const SF23_IDS=['hf_warrior_s1','hf_rogue_s2','hf_mage_s5'] as const;
type Id=typeof SF23_IDS[number];
const CONTRACT:Record<Id,string>={
 hf_warrior_s1:'heroic_strike,sunder_armor',
 hf_rogue_s2:'sinister_strike,eviscerate',
 hf_mage_s5:'arcane_surge,scorch,flurry'
};
function effects(d:AbilityDef,lv:number):AbilityEffect[]{
 let fx=d.effects;
 for(const r of d.ranks??[])if(r.level<=lv)fx=r.effects;
 return fx.map(x=>({...x}));
}
function levels(s:HighflyFusionSpec,ds:AbilityDef[]):number[]{
 return [...new Set([s.unlockLevel,...ds.flatMap(d=>(d.ranks??[])
  .filter(r=>r.level>s.unlockLevel&&r.level<=99).map(r=>r.level))])]
  .sort((a,b)=>a-b);
}
function fuse(s:HighflyFusionSpec,ds:AbilityDef[],lv:number):AbilityEffect[]{
 const [a,b,c]=ds.map(d=>effects(d,lv));
 if(s.id==='hf_warrior_s1'){
  if(a.length!==1||a[0].type!=='weaponDamage'||
     b.length!==1||b[0].type!=='sunder'||b[0].maxStacks!==5)
   throw Error('SF23 Warrior ORIGINAL source shapes changed at '+lv);
  // Reuse the heroic bonus through original instant weaponStrike dispatcher.
  // Native onNextSwing is a QUEUED hit and cannot stack with an immediate
  // independent Sunder in one cast. Preserve the source damage + sunder.
  return [{type:'weaponStrike',bonus:a[0].bonus},b[0]];
 }
 if(s.id==='hf_rogue_s2'){
  if(a.length!==1||a[0].type!=='weaponStrike'||
     b.length!==1||b[0].type!=='finisherDamage')
   throw Error('SF23 Rogue ORIGINAL source shapes changed at '+lv);
  // Original Sim snapshots combo BEFORE the cast; first cast builds,
  // subsequent casts cash out preexisting combo and award a new builder pip.
  return [a[0],b[0]];
 }
 if(s.id==='hf_mage_s5'){
  if(a.length!==1||a[0].type!=='directDamage'||
     b.length!==2||b[0].type!=='directDamage'||
     b[1].type!=='selfBuff'||b[1].kind!=='buff_speed'||
     c.length!==3||c.some(e=>e.type!=='directDamage'))
   throw Error('SF23 Mage ORIGINAL native effects changed at '+lv);
  // 5 original damage packets and original movement-speed aura;
  // SINGLE source ability school. No fabricated 3-school/VFX claim.
  return [a[0],b[0],...c,b[1]];
 }
 throw Error('SF23 unexpected id '+s.id);
}
function build(s:HighflyFusionSpec,ds:AbilityDef[]):AbilityDef{
 const id=s.id as Id,[a,b,c]=ds;
 if(!CONTRACT[id]||s.donors.join(',')!==CONTRACT[id]||
  ds.length!==(id==='hf_mage_s5'?3:2)||
  ds.some((d,i)=>!d||d.id!==s.donors[i]||d.class!==s.classId||
    d.passive||d.hiddenFromPlayer||d.channel||d.requiresQuest||
    d.requiresAuraKind||d.requiresStealth||d.requiresForm))
  throw Error('SF23 original donor missing or changed '+s.id);
 if(id==='hf_warrior_s1'&&(
  !a.onNextSwing||!a.offGcd||!a.requiresTarget||!b.requiresTarget||
  a.range!==0||b.range!==0||a.school!=='physical'||b.school!=='physical'||
  a.effects[0].type!=='weaponDamage'||b.effects[0].type!=='sunder'))
  throw Error('SF23 Warrior original swing contract drift');
 if(id==='hf_rogue_s2'&&(
  !a.awardsCombo||a.awardsCombo!==1||!b.spendsCombo||
  !a.requiresTarget||!b.requiresTarget||a.range!==0||b.range!==0||
  a.school!=='physical'||b.school!=='physical'||
  a.onNextSwing||b.onNextSwing))
  throw Error('SF23 Rogue original combo contract drift');
 if(id==='hf_mage_s5'&&(
  ds.some(d=>!d.requiresTarget||d.range!==30||d.onNextSwing)||
  a.school!=='arcane'||b.school!=='fire'||c.school!=='frost'||
  a.effects[0].type!=='directDamage'||b.effects[0].type!=='directDamage'))
  throw Error('SF23 Mage donor target/school contract drift');
 const costs:Record<Id,number>={hf_warrior_s1:15,hf_rogue_s2:45,hf_mage_s5:60};
 const cd:Record<Id,number>={hf_warrior_s1:4,hf_rogue_s2:5,hf_mage_s5:18};
 const rows=levels(s,ds).map(lv=>({lv,fx:fuse(s,ds,lv)}));
 const fields:Partial<AbilityDef>={
  specs:undefined,excludeSpecs:undefined,excludeSpecsAtLevel:undefined,
  hiddenFromPlayer:undefined,requiresQuest:undefined,
  requiresAuraKind:undefined,actionReplacement:undefined,
  maxCharges:undefined,channel:undefined,offGcd:undefined,
  requiresStealth:undefined,requiresForm:undefined,
  onNextSwing:undefined,projectile:false,
  cost:costs[id],cooldown:cd[id],castTime:0,
  requiresTarget:true,targetMode:undefined,
  range:id==='hf_mage_s5'?30:0,minRange:undefined,
  school:id==='hf_mage_s5'?'arcane':'physical',
  awardsCombo:id==='hf_rogue_s2'?1:undefined,
  spendsCombo:id==='hf_rogue_s2'?true:undefined,
  comboOptional:id==='hf_rogue_s2'?true:undefined,
  description:'HIGHFLY SF23 '+s.name+': native original '+s.donors.join(' + ')+
   '. Source-ID-special procs and final multi-element VFX NOT claimed.'
 };
 return {...a,...fields,id:s.id,class:s.classId,name:s.name,
  learnLevel:s.unlockLevel,effects:rows[0].fx,
  ranks:rows.slice(1).map((r,i)=>({
   rank:i+2,level:r.lv,cost:costs[id],effects:r.fx
  }))};
}
export function installSf23ThreeNative(abilities:Registry,classes:Classes):string[]{
 const all=Object.values(HIGHFLY_FUSED_SKILLS).flat();
 const batch:{id:string;cls:HighflyClass;def:AbilityDef}[]=[];
 for(const id of SF23_IDS){
  const s=all.find(x=>x.id===id);
  if(!s||abilities[id]||!classes[s.classId]?.abilities||
    classes[s.classId].abilities.includes(id)||
    s.donors.join(',')!==CONTRACT[id])
   throw Error('SF23 duplicate/missing catalog '+id);
  batch.push({id,cls:s.classId,def:build(s,s.donors.map(x=>abilities[x]))});
 }
 if(batch.length!==3)throw Error('SF23 expected exactly three');
 for(const x of batch){abilities[x.id]=x.def;classes[x.cls].abilities.push(x.id);}
 return batch.map(x=>x.id);
}
