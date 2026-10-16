/**
 * R24A native deterministic projectile admission and collision coordinator.
 * Small opt-in for HIGHFLY ORIGIN Hunter. Existing ClaudeCraft projectiles
 * remain homing and unchanged; custom ballistic branch never auto-targets.
 */
import type {SimContext} from './sim_context';
import type {Entity} from './types';
import {DT} from './types';
import {
 ORIGIN_FREE_SKILLS, ORIGIN_SHOT_RADIUS,
 originNormalizeDirection,originNextShot,originFirstContact,
 type ShotPoint,type ShotState,
} from './highfly_origin_r24a_skillshot_physics';

type StoredAim={abilityId:string;dir:ShotPoint;point:ShotPoint};
type PendingShot={
 sourceId:number;abilityId:string;state:ShotState;
 resolve:(source:Entity,target:Entity,at:ShotPoint)=>void;
 fizzle:(at:ShotPoint)=>void;
};
const aimByCaster=new WeakMap<Entity,StoredAim>();
const queued=new WeakMap<SimContext,PendingShot[]>();
export function originCanFreeFire(p:Entity,id:string,aim?:ShotPoint|null):boolean {
 return p.kind==='player'&&Boolean(p.originResources)&&ORIGIN_FREE_SKILLS.has(id)
   &&Boolean(aim&&Number.isFinite(aim.x)&&Number.isFinite(aim.z));
}
export function originRememberFreeAim(p:Entity,abilityId:string,to:ShotPoint):void {
 const dir=originNormalizeDirection(p.pos,to);
 if(!dir)return;
 aimByCaster.set(p,{abilityId,dir,point:{...to}});
}
export function originHasFreeAim(p:Entity,id:string):boolean {
 return aimByCaster.get(p)?.abilityId===id;
}
export function originTakeFreeAim(p:Entity,id:string):ShotPoint|null {
 const v=aimByCaster.get(p);
 if(!v||v.abilityId!==id)return null;
 aimByCaster.delete(p);
 return {...v.dir};
}
/** Source/target checks and costs happen in the native casting lifecycle.
 * This queue changes only delivery: ray in fixed launch direction, then one
 * swept-circle hit, NEVER tracking a previously selected enemy.
 */
export function originScheduleFreeShot(
 ctx:SimContext,source:Entity,abilityId:string,dir:ShotPoint,reach:number,
 resolve:(source:Entity,target:Entity,at:ShotPoint)=>void,
 fizzle:(at:ShotPoint)=>void,
):void {
 const current=queued.get(ctx)??[];
 current.push({
   sourceId:source.id,abilityId,
   state:{point:{x:source.pos.x,z:source.pos.z},dir:{...dir},distance:0,
    reach:Math.max(.5,Math.min(80,reach)),radius:ORIGIN_SHOT_RADIUS},
   resolve,fizzle
 });
 queued.set(ctx,current);
}
export function originAdvanceFreeShots(ctx:SimContext):void {
 const current=queued.get(ctx);
 if(!current?.length)return;
 const survivors:PendingShot[]=[];
 for(const shot of current){
   const source=ctx.entities.get(shot.sourceId);
   if(!source||source.dead)continue;
   const step=originNextShot(shot.state,DT);
   const candidates=[...ctx.entities.values()].filter(e=>
     !e.dead && e.hp>0 && e.id!==source.id &&
     ctx.isHostileTo(source,e) &&
     ctx.hasLineOfSight(source,e)
   ).map(e=>({id:e.id,pos:e.pos,radius:0}));
   const contact=originFirstContact(step.from,step.to,candidates,shot.state.radius);
   if(contact){
     const target=ctx.entities.get(contact.id);
     if(target&&!target.dead)shot.resolve(source,target,contact.point);
     continue;
   }
   if(step.expired){shot.fizzle(step.to);continue;}
   shot.state=step.next;survivors.push(shot);
 }
 // Keep emitted-during-resolution shots ordered AFTER the currently flying ones.
 const newDuringTick=queued.get(ctx)??current;
 queued.set(ctx,[...survivors,...newDuringTick.filter(s=>!current.includes(s))]);
}
