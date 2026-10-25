/** HIGHFLY Reborn: display-only directional somersault. Sim owns physics. */
export const SOMERSAULT_SECONDS = 0.72;
export type FlipDir = 'forward' | 'back' | 'left' | 'right';
export interface FlipPose {pitch:number; roll:number}
export function directionalSomersault(seconds:number, dir:FlipDir, reducedMotion=false):FlipPose {
  if(reducedMotion || !Number.isFinite(seconds) || seconds<=0 || seconds>=SOMERSAULT_SECONDS)
    return {pitch:0,roll:0};
  const u=Math.max(0,Math.min(1,seconds/SOMERSAULT_SECONDS));
  const turn=2*Math.PI*(u*u*(3-2*u));
  if(dir==='forward')return {pitch:-turn,roll:0};
  if(dir==='back')return {pitch:turn,roll:0};
  if(dir==='left')return {pitch:0,roll:-turn};
  return {pitch:0,roll:turn};
}
