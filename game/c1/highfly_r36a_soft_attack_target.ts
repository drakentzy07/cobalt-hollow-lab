/** HIGHFLY R36A: manual ATK near-forward fallback, only on actual press.
 * Used on ORIGIN Hunter when there is no manually selected/locked target.
 * NOT a per-frame auto-target and never modifies camera, velocity, or Sim HP.
 */
export interface R36ANearEnemy {
 id:number;pos:{x:number;z:number};
}
export function highflyR36ANearbyTarget<T extends R36ANearEnemy>(
  entities:Iterable<T>,
  at:{x:number;z:number},
  facing:number,
  isAttackable:(e:T)=>boolean,
  reach=5,
):number|null {
  if(!Number.isFinite(facing)||!Number.isFinite(reach)||reach<=0)return null;
  const dxFace=Math.sin(facing),dzFace=Math.cos(facing);
  const minDot=Math.cos(75*Math.PI/180);
  let picked:number|null=null,score=Number.POSITIVE_INFINITY;
  for(const e of entities){
    if(!isAttackable(e))continue;
    const dx=e.pos.x-at.x,dz=e.pos.z-at.z,d=Math.hypot(dx,dz);
    if(d<=0.01||d>reach)continue;
    const dot=(dx*dxFace+dz*dzFace)/d;
    if(dot<minDot)continue; // never silently select someone behind
    const s=d+(1-dot)*1.25;
    if(s<score){picked=e.id;score=s}
  }
  return picked;
}
