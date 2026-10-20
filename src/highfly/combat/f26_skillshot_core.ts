/** F2.6: deterministic swept-sphere hit test. No target lock, no homing,
 * no RNG. The earliest intersection on each simulation step wins. */
export interface HighflyF26Point {x:number;y:number;z:number}
/** One quadratic flight path, shared unchanged by sim and renderer.
 * The bend is a lateral distance, not a steering correction toward a mob. */
export function highflyF26TrajectoryPoint(
  from:HighflyF26Point,to:HighflyF26Point,t:number,bend:number,
):HighflyF26Point{
  const u=Math.max(0,Math.min(1,t)),dx=to.x-from.x,dz=to.z-from.z;
  const length=Math.hypot(dx,dz),side=length>0?4*u*(1-u)*bend/length:0;
  return {x:from.x+dx*u-dz*side,y:from.y+(to.y-from.y)*u,z:from.z+dz*u+dx*side};
}
export function highflyF26SegmentSphereHit(
  from:HighflyF26Point,to:HighflyF26Point,
  center:HighflyF26Point,radius:number,
):number|null{
  if(!Number.isFinite(radius)||radius<=0)return null;
  const dx=to.x-from.x,dy=to.y-from.y,dz=to.z-from.z;
  const ox=from.x-center.x,oy=from.y-center.y,oz=from.z-center.z;
  const a=dx*dx+dy*dy+dz*dz;
  if(ox*ox+oy*oy+oz*oz<=radius*radius)return 0;
  if(a<=1e-10)return null;
  const b=2*(ox*dx+oy*dy+oz*dz),c=ox*ox+oy*oy+oz*oz-radius*radius;
  const discriminant=b*b-4*a*c;
  if(discriminant<0)return null;
  const t=(-b-Math.sqrt(discriminant))/(2*a);
  return t>=0&&t<=1?t:null;
}
