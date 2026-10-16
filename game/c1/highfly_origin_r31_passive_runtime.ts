/**
 * HIGHFLY ORIGIN R31 — disposable 9-passive runtime.
 * Each passive is independent and server-owned. In the R31 QA LAB only, all
 * nine are temporarily on to test their measurable effect. No permanent
 * mastery unlock, equipment stat, source skill, or public save is changed.
 */
import { ABILITIES } from './content/classes';
import { R30_PASSIVE_DESIGNS } from './highfly_origin_r30_curated77';

export const R31_LAB_PASSIVES=R30_PASSIVE_DESIGNS.map(x=>x.id);
const value=(id:string)=>R30_PASSIVE_DESIGNS.find(x=>x.id===id)?.value??0;

/** Called only for a genuine, non-copied outgoing Hunter hit by damage.ts. */
export function r31OutgoingDamageMultiplier(school:string,abilityId:string|null):number{
 const def=abilityId?ABILITIES[abilityId]:undefined;
 const ranged=Boolean(def && (def.scalesWith==='ranged' ||
   (def.class==='hunter'&&def.range>=15&&def.requiresTarget)));
 const magic=school!=='physical';
 const bonus=
   (school==='physical'?value('hf_passive_warrior_resolve'):0)+
   (ranged?value('hf_passive_hunter_precision'):0)+
   (magic?value('hf_passive_priest_devotion')+value('hf_passive_mage_conduit'):0)+
   (school==='nature'?value('hf_passive_shaman_resonance'):0)+
   (school==='shadow'?value('hf_passive_warlock_shadow'):0);
 return 1+bonus;
}
export function r31IncomingDamageMultiplier():number{
 return 1-value('hf_passive_paladin_grace');
}
export function r31MovementSpeedBonus():number{
 return value('hf_passive_rogue_footwork');
}
export function r31ManaRegenMultiplier():number{
 return 1+value('hf_passive_druid_regrowth');
}
export function r31PassiveLabAudit(){
 const ids=new Set(R31_LAB_PASSIVES);
 if(ids.size!==9||R30_PASSIVE_DESIGNS.length!==9||
    !R30_PASSIVE_DESIGNS.every(p=>p.value>0 && p.value<=0.15))
   throw Error('R31_PASSIVE_MANIFEST_INVALID');
 return {
  passives:ids.size,mode:'ephemeral-all-on-only',
  outgoingPhysical:r31OutgoingDamageMultiplier('physical',null),
  outgoingFire:r31OutgoingDamageMultiplier('fire',null),
  outgoingNature:r31OutgoingDamageMultiplier('nature',null),
  outgoingShadow:r31OutgoingDamageMultiplier('shadow',null),
  incoming:r31IncomingDamageMultiplier(),speed:r31MovementSpeedBonus(),
  manaRegen:r31ManaRegenMultiplier()
 };
}
