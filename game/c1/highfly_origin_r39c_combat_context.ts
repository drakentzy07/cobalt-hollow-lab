/** HIGHFLY R39C-P1: contextual manual ATK is one native Sim strike.
 * This is presentation-only classification; no extra swing, damage or cost.
 * Advanced parry/dodge/break branches are NOT unlocked here.
 */
export type R39CStrikeContext='ground'|'running'|'air'|'plunge';
export interface R39CPhysicalState {
  onGround:boolean;
  vy:number;
  horizontalSpeed:number;
  attackLocked?:boolean;
  dead?:boolean;
  swimming?:boolean;
}
export function r39CClassifyStrike(x:R39CPhysicalState):R39CStrikeContext|null {
  if(x.dead||x.attackLocked||x.swimming)return null;
  if(!x.onGround)return Number.isFinite(x.vy)&&x.vy<-.5?'plunge':'air';
  if(Number.isFinite(x.horizontalSpeed)&&x.horizontalSpeed>1.15)return 'running';
  return 'ground';
}
/** A step remains exactly 1-2-3-4; no free action or fifth slot. */
export function r39CNativeBasicCue(step:1|2|3|4):string {
  return 'highfly_basic_'+step;
}
export function r39CIsNativeBasicCue(abilityId:string|undefined):boolean {
  return abilityId!==undefined && /^highfly_basic_[1-4]$/.test(abilityId);
}
/** HUD may indicate a branch, but the Sim's existing swing/stamina/attack
 * server admission is authoritative; this does NOT schedule any inputs.
 */
export function r39CConnectWindow(
  previousStep:1|2|3,
  nextStep:2|3|4,
  elapsedMs:number,
  options:{originalAccepted:boolean;grounded:boolean;gemReady:boolean},
):boolean {
  if(!Number.isFinite(elapsedMs)||elapsedMs<0)return false;
  if(!options.originalAccepted)return false;
  if(nextStep===4&&!options.gemReady)return false;
  if(nextStep!==previousStep+1)return false;
  // Mobile-friendly, conservative design threshold: only records whether a
  // later explicit press falls in a trial connect interval. No auto-cast.
  const start=previousStep===3?190:160;
  return options.grounded && elapsedMs>=start && elapsedMs<=start+240;
}
