/** C5: custom MOBA firing line, grounded in native mob positions; no target snap. */
export type Point2 = {x:number;z:number};
export type Mob2 = {id:number;pos:Point2;dead:boolean;hostile?:boolean;radius?:number};
export function lineSkillHit(origin:Point2, aim:Point2, mobs:Iterable<Mob2>, range:number, width=1):number|null{
  const vx=aim.x-origin.x, vz=aim.z-origin.z;
  const len=Math.hypot(vx,vz);
  if(len<0.01)return null;
  const dx=vx/len,dz=vz/len;
  let hit:number|null=null;
  let bestDistance=Infinity;
  for(const mob of mobs){
    if(!mob.hostile || mob.dead)continue;
    const ox=mob.pos.x-origin.x,oz=mob.pos.z-origin.z;
    const along=ox*dx+oz*dz;
    if(along<0 || along>range || along>=bestDistance)continue;
    const side=Math.abs(ox*dz-oz*dx);
    const hitRadius=Math.max(0,mob.radius??0);
    if(side<=width+hitRadius){bestDistance=along;hit=mob.id;}
  }
  return hit;
}
