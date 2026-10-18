/** R39C3: presentation policy only. Sim remains the sole authority for swings. */
import {r39CClassifyStrike, type R39CPhysicalState, type R39CStrikeContext} from './highfly_origin_r39c_combat_context';
export type R39C3MotionCue = {kind:'native-basic';step:1|2|3|4;context:R39CStrikeContext;clip:string};
export function r39C3AcceptedMotion(step:1|2|3|4, state:R39CPhysicalState, acceptedBySim:boolean, gemReady:boolean):R39C3MotionCue|null {
  if(!acceptedBySim || (step===4&&!gemReady))return null;
  const context=r39CClassifyStrike(state);
  if(context===null)return null;
  return {kind:'native-basic',step,context,clip:'highfly_basic_'+step};
}
