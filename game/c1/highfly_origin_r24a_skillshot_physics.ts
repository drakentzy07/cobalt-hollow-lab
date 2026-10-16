/**
 * HIGHFLY ORIGIN R24A: deterministic, non-homing 2D skillshot collision.
 * No Three, DOM, real time, RNG or damage logic. Sim remains authoritative.
 */
export const ORIGIN_FREE_SKILLS = new Set(['fireball','shadow_bolt']);
export const ORIGIN_SHOT_SPEED = 26; // donor projectile velocity in world-units/s
export const ORIGIN_SHOT_RADIUS = 0.82;
export interface ShotPoint {x:number;z:number}
export interface ShotTarget {id:number;pos:ShotPoint;radius?:number}
export interface ShotContact {id:number; t:number; point:ShotPoint}
export interface ShotState {point:ShotPoint;dir:ShotPoint;distance:number;reach:number;radius:number}

/** Circle intersection along a swept missile segment, first entry t in [0,1].
 * Exact segment quadratic, rather than angle snapping or endpoint sampling.
 */
export function originSegmentCircle(a:ShotPoint,b:ShotPoint,c:ShotPoint,radius:number):number|null {
  if(![a.x,a.z,b.x,b.z,c.x,c.z,radius].every(Number.isFinite)||radius<0)return null;
  const dx=b.x-a.x,dz=b.z-a.z,ox=a.x-c.x,oz=a.z-c.z;
  const A=dx*dx+dz*dz;
  const C=ox*ox+oz*oz-radius*radius;
  if(C<=0)return 0;
  if(A<1e-10)return null;
  const B=2*(ox*dx+oz*dz);
  const D=B*B-4*A*C;
  if(D<0)return null;
  const enter=(-B-Math.sqrt(D))/(2*A);
  return enter>=0&&enter<=1?enter:null;
}
export function originFirstContact(a:ShotPoint,b:ShotPoint,targets:readonly ShotTarget[],radius=ORIGIN_SHOT_RADIUS):ShotContact|null {
  let hit:ShotContact|null=null;
  for(const t of targets){
    const entry=originSegmentCircle(a,b,t.pos,radius+Math.max(0,t.radius??0));
    if(entry===null)continue;
    // Stable id for deterministic ties (e.g. two overlapping mobs)
    if(hit===null||entry<hit.t-1e-9||(Math.abs(entry-hit.t)<=1e-9&&t.id<hit.id)){
      hit={id:t.id,t:entry,point:{x:a.x+(b.x-a.x)*entry,z:a.z+(b.z-a.z)*entry}};
    }
  }
  return hit;
}
export function originNormalizeDirection(from:ShotPoint,to:ShotPoint):ShotPoint|null {
  const dx=to.x-from.x,dz=to.z-from.z,mag=Math.hypot(dx,dz);
  return mag>1e-6&&Number.isFinite(mag)?{x:dx/mag,z:dz/mag}:null;
}
export function originNextShot(state:ShotState,dt:number):{from:ShotPoint;to:ShotPoint;next:ShotState;expired:boolean} {
  const distance=Math.max(0,Math.min(state.reach-state.distance,ORIGIN_SHOT_SPEED*Math.max(0,dt)));
  const from={...state.point};
  const to={x:from.x+state.dir.x*distance,z:from.z+state.dir.z*distance};
  const next={...state,point:to,distance:state.distance+distance};
  return {from,to,next,expired:next.distance>=state.reach-1e-6};
}
