/** R39D: pure combat-defense admission policy. Never mutates Sim state.
 * The caller must pass a real authoritative Sim action acceptance; this
 * helper only selects presentation cues, never grants invulnerability,
 * spends resources, schedules an attack or deals damage.
 */
export type R39DDefense='perfect-dodge'|'parry'|'break';
export interface R39DDefenseInput {
  action:R39DDefense;
  acceptedBySim:boolean;
  alive:boolean;
  interrupted:boolean;
  staminaAvailable:boolean;
  attackTelegraphMs:number;
  impactDeltaMs:number;
  targetGuardBroken?:boolean;
}
export interface R39DDefenseCue {action:R39DDefense;cue:string;}
export function r39DDefenseCue(x:R39DDefenseInput):R39DDefenseCue|null {
  if(!x.acceptedBySim||!x.alive||x.interrupted||!x.staminaAvailable)return null;
  if(!Number.isFinite(x.attackTelegraphMs)||!Number.isFinite(x.impactDeltaMs))return null;
  if(x.attackTelegraphMs<0||x.impactDeltaMs<0)return null;
  if(x.action==='perfect-dodge'&&x.impactDeltaMs<=180)return {action:x.action,cue:'highfly_defense_perfect_dodge'};
  if(x.action==='parry'&&x.impactDeltaMs<=120)return {action:x.action,cue:'highfly_defense_parry'};
  if(x.action==='break'&&x.targetGuardBroken===true)return {action:x.action,cue:'highfly_defense_break'};
  return null;
}
