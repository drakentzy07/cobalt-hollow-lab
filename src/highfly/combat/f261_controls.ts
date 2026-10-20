/** F2.6.1 — player-feedback-tuned Android gestures; visual-only direction
 * selection. Sim locomotion and donor F2.6 aim remain unchanged elsewhere. */
export const HIGHFLY_F261_AIM_DIRECTION_MULT = 0.68;
export const HIGHFLY_F261_AIM_DRAG_PX = 145;
export function highflyF261Aim(from:{x:number;z:number},camYaw:number,dx:number,dy:number,range:number){
  const drag=Math.hypot(dx,dy);
  // The mobile camera view is mirrored relative to the older F2.4 pointer X.
  // Invert that ONE axis for F2.6.1, then soften angular sensitivity.
  const facing=camYaw+(drag>=12?Math.atan2(-dx,-dy)*HIGHFLY_F261_AIM_DIRECTION_MULT:0);
  const reach=Math.max(2,range>0?range:8);
  const distance=reach*(0.30+0.70*Math.min(1,drag/HIGHFLY_F261_AIM_DRAG_PX));
  return {x:from.x+Math.sin(facing)*distance,
    z:from.z+Math.cos(facing)*distance,facing,range:distance};
}
export function highflyF261FlipDirection(stick:{x:number;y:number}):'forward'|'back'|'left'|'right'{
  const ax=Math.abs(stick.x),ay=Math.abs(stick.y);
  if(Math.hypot(ax,ay)<0.15)return 'forward';
  // Forward/back have priority while primarily travelling in that direction.
  // A modest accidental lateral tilt must NOT steal the forward flip.
  if(ay>=0.25&&ay>=ax*0.82)return stick.y<0?'forward':'back';
  if(ax>=0.3)return stick.x>0?'right':'left';
  return stick.y<0?'forward':'back';
}
