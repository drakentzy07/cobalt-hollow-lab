/** F2.4 camera-relative skill aiming. Pure presentation math: no second movement motor. */
export const HIGHFLY_AIM_DRAG_PX=94;
export type HighflyAimShape='line'|'cone'|'circle'|'leap';
export function highflyAimShape(id:string):HighflyAimShape|null{
  if(id==='fireball')return 'line';
  if(id==='charge')return 'cone';
  if(id==='frost_nova')return 'circle';
  if(id==='heroic_leap')return 'leap';
  return null;
}
export function highflyWorldAim(from:{x:number;z:number},camYaw:number,dx:number,dy:number,range:number){
  const drag=Math.hypot(dx,dy);
  const facing=camYaw+(drag>=9?Math.atan2(dx,-dy):0);
  const reach=Math.max(2,range>0?range:8);
  const distance=reach*(0.35+0.65*Math.min(1,drag/HIGHFLY_AIM_DRAG_PX));
  return {x:from.x+Math.sin(facing)*distance,z:from.z+Math.cos(facing)*distance,facing,range:distance};
}
export function highflyAimTarget<T extends {id:number;pos:{x:number;z:number}}>(
  entities:Iterable<T>,from:{x:number;z:number},facing:number,maxRange:number,
  directed:boolean,valid:(e:T)=>boolean,
):T|null{
  let best:T|null=null,score=-Infinity;
  const sin=Math.sin(facing),cos=Math.cos(facing);
  for(const e of entities){
    if(!valid(e))continue;
    const dx=e.pos.x-from.x,dz=e.pos.z-from.z,d=Math.hypot(dx,dz);
    if(d<0.001||d>maxRange)continue;
    const alignment=(dx*sin+dz*cos)/d;
    if(directed&&alignment<0.72)continue;
    const s=-d+(directed?alignment*6:alignment*0.3);
    if(s>score||(s===score&&e.id<(best?.id??Infinity))){best=e;score=s;}
  }
  return best;
}
