import {r39DDefenseCue,type R39DDefenseInput,type R39DDefenseCue} from './highfly_origin_r39d_defense_policy';
/** Only server/Sim-confirmed defensive results can create presentation cues.
 * This bridge never resolves a hit, spends stamina or grants i-frames.
 */
export interface R39FAuthoritativeDefenseEvent {
  acceptedBySim:boolean;
  simTick:number;
  source:'sim';
  defense:R39DDefenseInput;
}
export function r39FDefensePresentation(event:R39FAuthoritativeDefenseEvent):R39DDefenseCue|null {
  if(event.source!=='sim'||!Number.isSafeInteger(event.simTick)||event.simTick<0)return null;
  if(event.acceptedBySim!==event.defense.acceptedBySim)return null;
  return r39DDefenseCue(event.defense);
}
