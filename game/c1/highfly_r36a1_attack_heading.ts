/** ORIGIN R36A.1: attack heading follows GOLDEN camera-relative joystick.
 * The camera itself is always free; only ATK's one-off strike facing follows
 * the player's movement when no hostile is within authentic melee reach.
 */
export function highflyR36A1AttackHeading(
  cameraYaw:number,
  move:{x:number;y:number},
  lastFacing:number,
):number {
  if(!Number.isFinite(cameraYaw)||!Number.isFinite(lastFacing)||
     !Number.isFinite(move.x)||!Number.isFinite(move.y))return lastFacing;
  const mag=Math.hypot(move.x,move.y);
  if(mag<.08)return lastFacing;
  const localForward=-move.y, localRight=-move.x;
  const desired=cameraYaw+Math.atan2(localRight,localForward);
  return Math.atan2(Math.sin(desired),Math.cos(desired));
}
export function highflyR36A1EnemyInMeleeRange(
  a:{x:number;z:number},b:{x:number;z:number},maxReach=5
):boolean {
  return Number.isFinite(a.x)&&Number.isFinite(a.z)&&
    Number.isFinite(b.x)&&Number.isFinite(b.z)&&
    Math.hypot(b.x-a.x,b.z-a.z)<=maxReach;
}
