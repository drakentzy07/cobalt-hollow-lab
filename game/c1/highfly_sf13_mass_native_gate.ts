/**
 * HIGHFLY SF13 — strict, donor-preserving batch of the remaining 47 recipes.
 * Unverified/incompatible compositions are NEVER installed as placeholder skills.
 * Separate no-deploy test gate; unaffected 16 previously tested fusions.
 */
import type { AbilityDef, AbilityEffect } from '../sim/types';
import { HIGHFLY_FUSED_SKILLS, type HighflyClass, type HighflyFusionSpec } from './sf3_skill_catalog';

type Registry = Record<string, AbilityDef>;
type Classes = Record<HighflyClass,{abilities:string[]}>;
export type Sf13ReportRow = {id:string; classId:HighflyClass; donors:readonly string[];
  status:'candidate'|'blocked'; reasons:string[]; effects:string[]};
const CORE = new Set<AbilityEffect['type']>([
 'directDamage','dot','heal','hot','absorb','slow','stun','sunder','aoeDamage','aoeHeal'
]);
const FRAGILE = [
 'passive','hiddenFromPlayer','onNextSwing','requiresForm','requiresStealth',
 'requiresOutOfCombat','requiresQuest','requiresShield','requiresAuraKind',
 'requiresDodgeProc','requiresTargetHpBelow','spendsCombo','awardsCombo',
 'spendsAllResource','channel','empowerStages','actionReplacement','maxCharges',
 'requiresOutsideInstance','soulFragmentCost','devotionCost','ruinCost',
 'offGcd','usableWhileCasting','requiresCombat','targetsDead'
] as const;
function fxAt(d:AbilityDef,lv:number):AbilityEffect[]{
 let result=d.effects;
 for(const rank of d.ranks??[])if(rank.level<=lv)result=rank.effects;
 return result.map(e=>({...e}));
}
function costAt(d:AbilityDef,lv:number):number{
 let c=d.cost;for(const r of d.ranks??[])if(r.level<=lv)c=r.cost;return c;
}
function castAt(d:AbilityDef,lv:number):number{
 let t=d.castTime;for(const r of d.ranks??[])if(r.level<=lv&&r.castTime!==undefined)t=r.castTime;return t;
}
function sampleLevels(s:HighflyFusionSpec,defs:AbilityDef[]):number[]{
 return [...new Set([s.unlockLevel,99,...defs.flatMap(d=>(d.ranks??[])
   .map(r=>r.level).filter(l=>l>s.unlockLevel&&l<=99))])].sort((a,b)=>a-b);
}
function compatibleTarget(a:AbilityDef,b:AbilityDef):boolean {
 return a.requiresTarget===b.requiresTarget &&
   (a.targetMode??'entity')===(b.targetMode??'entity') &&
   (a.targetType??'enemy')===(b.targetType??'enemy') &&
   a.range===b.range && a.minRange===b.minRange &&
   a.selfCentered===b.selfCentered &&
   a.partyOnlyTarget===b.partyOnlyTarget;
}
function scaled(e:AbilityEffect):AbilityEffect {
 const c={...e} as Record<string,unknown>;
 for(const k of ['min','max','total','amount']){
  if(typeof c[k]==='number')c[k]=Math.max(1,Math.round((c[k] as number)*.25));
 }
 if(typeof c.duration==='number'&&(e.type==='stun'||e.type==='slow'))
  c.duration=Math.min(1.5,c.duration as number);
 return c as unknown as AbilityEffect;
}
function merge(base:AbilityEffect[],extra:AbilityEffect[]):AbilityEffect[]|null {
 const out=base.map(e=>({...e}));
 if(!base.length||!extra.length||[...base,...extra].some(e=>!CORE.has(e.type)))return null;
 let contribution=0;
 for(const e of extra) {
  const scaledEffect=scaled(e);
  const at=out.findIndex(v=>v.type===e.type);
  if(at>=0) {
   // Each original action may only apply one aura/effect of each kind:
   // fold the second source into the original numeric effect, no double AP/SP.
   const a=out[at] as unknown as Record<string,unknown>;
   const b=scaledEffect as unknown as Record<string,unknown>;
   let changed=false;
   for(const k of ['min','max','total','amount']) {
    if(typeof a[k]==='number'&&typeof b[k]==='number') {
     a[k]=(a[k] as number)+(b[k] as number); changed=true;
    }
   }
   if(!changed)return null;
   contribution++;
  }else{
   // Coexisting HoT/DoT/absorb auras require distinct stable IDs to avoid
   // native same-cast aura-key overwrite; reject before writing.
   if(['dot','hot','absorb'].includes(e.type) &&
      out.some(x=>['dot','hot','absorb'].includes(x.type))) return null;
   out.push(scaledEffect);contribution++;
  }
 }
 return contribution===extra.length?out:null;
}
function blockers(s:HighflyFusionSpec,defs:AbilityDef[]):string[]{
 const problems:string[]=[];
 if(defs.length!==s.donors.length||defs.some(d=>!d))return ['MISSING_DONOR'];
 for(let i=0;i<defs.length;i++) {
  const d=defs[i];
  if(d.id!==s.donors[i]||d.class!==s.classId)problems.push('SOURCE_ID_OR_CLASS_CHANGED:'+s.donors[i]);
  for(const field of FRAGILE)if(Boolean((d as unknown as Record<string,unknown>)[field]))
    problems.push('REQUIRES_CUSTOM_ADAPTER:'+d.id+':'+field);
  if(d.specs?.length||d.excludeSpecs?.length||d.excludeSpecsAtLevel?.length)
    problems.push('SPEC_GATED:'+d.id);
  if(!d.effects.length)problems.push('PROCEDURAL_EFFECTS:'+d.id);
  if(d.effects.some(e=>!CORE.has(e.type)))problems.push('CUSTOM_EFFECT_TYPE:'+d.id);
 }
 const p=defs[0];
 for(const d of defs.slice(1)) {
  if(!compatibleTarget(p,d))problems.push('TARGET_RANGE_MISMATCH:'+d.id);
  if(p.school!==d.school)problems.push('SCHOOL_MISMATCH:'+d.id);
 }
 for(const lv of sampleLevels(s,defs)) {
  if(!merge(fxAt(p,lv),defs.slice(1).flatMap(d=>fxAt(d,lv))))
    problems.push('EFFECT_COLLISION_OR_RANK_DRIFT:LV'+lv);
 }
 return [...new Set(problems)];
}
function build(s:HighflyFusionSpec,defs:AbilityDef[]):AbilityDef{
 const lead=defs[0];
 const snaps=sampleLevels(s,defs).map(lv=>{
  const effects=merge(fxAt(lead,lv),defs.slice(1).flatMap(d=>fxAt(d,lv)));
  if(!effects)throw Error('SF13 unsafe rank effect '+s.id+' LV'+lv);
  return {lv,effects,cost:costAt(lead,lv)+Math.ceil(defs.slice(1).reduce((n,d)=>n+costAt(d,lv),0)*.25),
    castTime:castAt(lead,lv)};
 });
 return {...lead,id:s.id,name:s.name,class:s.classId,learnLevel:s.unlockLevel,
  specs:undefined,excludeSpecs:undefined,excludeSpecsAtLevel:undefined,
  requiresQuest:undefined,hiddenFromPlayer:undefined,passive:undefined,
  cooldown:Math.max(5,...defs.map(d=>d.cooldown),s.ultimate?25:0),
  cost:snaps[0].cost,castTime:snaps[0].castTime,effects:snaps[0].effects,
  ranks:snaps.slice(1).map((x,i)=>({
   rank:i+2,level:x.lv,cost:x.cost,castTime:x.castTime,effects:x.effects
  })),
  description:'HIGHFLY SF13 laboratorio, composición conservadora de efectos nativos de: '+
   s.donors.join(' + ')+'. El segundo donante contribuye 25% a un efecto seguro; '+
   'sin procs por ID, sin certificación de VFX ni balance final.'
 };
}
/** Exhaustive 47-row audit. Never promote an incompatible recipe by copying a donor. */
export function auditSf13FortySeven(abilities:Readonly<Registry>):Sf13ReportRow[]{
 const catalog=Object.values(HIGHFLY_FUSED_SKILLS).flat();
 const pending=catalog.filter(s=>!abilities[s.id]);
 if(pending.length!==47)throw Error('SF13 expected 16 existing genuine skills, found '+(63-pending.length));
 return pending.map(s=>{
  const defs=s.donors.map(id=>abilities[id]);
  const reasons=blockers(s,defs);
  return {id:s.id,classId:s.classId,donors:s.donors,
   status:reasons.length?'blocked':'candidate',reasons,
   effects:defs.flatMap(d=>d?.effects.map(e=>e.type)??[])};
 });
}
/** Atomic, LAB-ONLY install for safe additive recipes; returns exact IDs. */
export function installSf13Compatible(abilities:Registry,classes:Classes):string[]{
 const report=auditSf13FortySeven(abilities);
 const catalog=Object.values(HIGHFLY_FUSED_SKILLS).flat();
 const prepared:{id:string;cls:HighflyClass;def:AbilityDef}[]=[];
 for(const row of report.filter(r=>r.status==='candidate')){
  const s=catalog.find(x=>x.id===row.id)!;
  const cl=classes[s.classId];
  if(!cl?.abilities||cl.abilities.includes(s.id)||abilities[s.id])
   throw Error('SF13 duplicate/absent class '+s.id);
  prepared.push({id:s.id,cls:s.classId,def:build(s,s.donors.map(x=>abilities[x]))});
 }
 for(const x of prepared){abilities[x.id]=x.def;classes[x.cls].abilities.push(x.id);}
 return prepared.map(x=>x.id);
}
