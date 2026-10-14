/** HIGHFLY SF25: source-native weapon unleash and one-demon selector.
 * Exact original donors, original effect shapes; requires the pinned SF25
 * effect_dispatch compatibility bridge to run donor-ID-specific behaviors.
 */
import type {AbilityDef,AbilityEffect} from '../sim/types';
import {HIGHFLY_FUSED_SKILLS,type HighflyClass,type HighflyFusionSpec} from './sf3_skill_catalog';
type Registry=Record<string,AbilityDef>;
type Classes=Record<HighflyClass,{abilities:string[]}>;
export const SF25_IDS=['hf_shaman_s4','hf_warlock_s5'] as const;
type ID=typeof SF25_IDS[number];
const CONTRACT:Record<ID,string>={
 hf_shaman_s4:'unleash_weapon,flametongue_weapon',
 hf_warlock_s5:'summon_imp,summon_voidwalker'
};
function sourceEffects(d:AbilityDef,lv:number):AbilityEffect[]{
 let fx=d.effects;
 for(const r of d.ranks??[])if(r.level<=lv)fx=r.effects;
 return fx.map(e=>({...e}));
}
function fused(s:HighflyFusionSpec,ds:AbilityDef[]):AbilityDef{
 const id=s.id as ID,[a,b]=ds;
 if(!CONTRACT[id]||s.donors.join(',')!==CONTRACT[id]||ds.length!==2||
   ds.some((d,i)=>!d||d.id!==s.donors[i]||d.class!==s.classId||d.passive||
   d.hiddenFromPlayer||d.requiresQuest||d.requiresAuraKind))
  throw Error('SF25 ORIGINAL donor missing/mutated '+s.id);
 if(id==='hf_shaman_s4'){
  if(a.effects.length!==0||a.targetType!=='any'||a.range!==30||
     !a.requiresTarget||a.school!=='nature'||
     b.effects[0]?.type!=='imbue'||b.range!==0||b.requiresTarget||
     b.school!=='fire'||b.class!=='shaman')
   throw Error('SF25 Unleash+Pyrebrand source contract drift');
  const rows=[s.unlockLevel,...(b.ranks??[]).filter(r=>r.level>s.unlockLevel&&r.level<=99).map(r=>r.level)];
  const make=(lv:number)=>{
    const ef=sourceEffects(b,lv);
    if(ef.length!==1||ef[0].type!=='imbue'||ef[0].bonus<=0)
      throw Error('SF25 rank Pyrebrand source mutated '+lv);
    return ef;
  };
  return {...a,id,name:s.name,learnLevel:s.unlockLevel,castTime:0,
   cooldown:15,cost:35,range:30,targetType:undefined,
   specs:undefined,excludeSpecs:undefined,requiresTarget:true,
   // Original Imbue is applied under the ORIGINAL flametongue_weapon ID
   // BEFORE runUnleashWeapon via SF25 source adapter; a normal effect pass
   // explicitly skips its duplicate application.
   effects:make(rows[0]),ranks:rows.slice(1).map((lv,i)=>({
    rank:i+2,level:lv,cost:35,effects:make(lv)
   })),
   description:'HIGHFLY SF25: original Pyrebrand weapon coat plus source Unleash Weapon action. Source-native fire effect, no invented VFX.'};
 }
 if(id==='hf_warlock_s5'){
  const ax=a.effects,bx=b.effects;
  if(!a.requiresTarget===false||a.requiresTarget||b.requiresTarget||
    a.range!==0||b.range!==0||a.castTime!==5||b.castTime!==5||
    ax.length!==1||bx.length!==1||
    ax[0].type!=='summonDemon'||bx[0].type!=='summonDemon'||
    ax[0].mobId!=='emberkin'||bx[0].mobId!=='gloomshade')
    throw Error('SF25 original ONE demon summon contract changed');
  return {...a,id,name:s.name,learnLevel:s.unlockLevel,castTime:5,
   cooldown:8,cost:50,range:0,
   effects:[{...ax[0]}],
   ranks:undefined,specs:undefined,excludeSpecs:undefined,
   excludeSpecsAtLevel:undefined,requiresTarget:false,
   description:'HIGHFLY SF25: one permanent ORIGINAL demon at a time. Recast switches original Emberkin and Duskmurk. Native pet implementation and donor VFX.'};
 }
 throw Error('SF25 unrecognized '+id);
}
export function installSf25TwoNative(abilities:Registry,classes:Classes):string[]{
 const all=Object.values(HIGHFLY_FUSED_SKILLS).flat();
 const staged:{id:string;cls:HighflyClass;def:AbilityDef}[]=[];
 for(const id of SF25_IDS){
  const s=all.find(x=>x.id===id);
  if(!s||abilities[id]||!classes[s.classId]?.abilities||
    classes[s.classId].abilities.includes(id)||s.donors.join(',')!==CONTRACT[id])
   throw Error('SF25 duplicate or missing '+id);
  staged.push({id,cls:s.classId,def:fused(s,s.donors.map(d=>abilities[d]))});
 }
 if(staged.length!==2)throw Error('SF25 expected TWO');
 for(const x of staged){abilities[x.id]=x.def;classes[x.cls].abilities.push(x.id);}
 return staged.map(x=>x.id);
}
