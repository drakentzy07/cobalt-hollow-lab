/** HIGHFLY F2.4: a manual strike owns its hit acquisition, not the target UI.
 * Pure deterministic selection using the ONE native Sim's entity collection.
 * A manual target is still honored when it is in actual melee range. A stale
 * locked target cannot block another nearby enemy or an empty-space swing. */
export interface HighflyFreeTarget {
  id:number; pos:{x:number;z:number};
}
export function pickHighflyFreeTarget<T extends HighflyFreeTarget>(
  entities:Iterable<T>, from:{x:number;z:number}, facing:number,
  canHit:(candidate:T)=>boolean, reach:(candidate:T)=>number,
):T|null {
  let picked:T|null=null;let best=-Infinity;
  const fx=Math.sin(facing),fz=Math.cos(facing);
  for(const entity of entities){
    if(!canHit(entity))continue;
    const dx=entity.pos.x-from.x,dz=entity.pos.z-from.z;
    const d=Math.hypot(dx,dz);
    if(d>reach(entity)||d<0.0001)continue;
    const align=(dx*fx+dz*fz)/d;
    // Favor stick-facing targets, but still acquire enemies immediately behind:
    // ATK cannot silently miss simply because no manual lock was selected.
    const score=-d+align*0.85;
    if(score>best || (score===best&&entity.id<(picked?.id??Infinity))){
      best=score;picked=entity;
    }
  }
  return picked;
}
