/** R39 FINAL — actual ephemeral combat authority, never a second Sim.
 * The calling native Sim alone admits actions, damage and guard control.
 * WeakMaps mean no new saves, wire fields, scene entities or class restrictions.
 */
import type { Entity } from './types';
export type R39DefenseResult = 'perfect-dodge' | 'parry';
type PlayerWindow = {
  evadeUntil:number; parryUntil:number; counterUntil:number;
  lastStep:0|1|2|3|4; lastAt:number; chain:number;
};
type GuardWindow = {pressure:number;recoverAt:number;brokenUntil:number};
const players=new WeakMap<Entity,PlayerWindow>();
const guards=new WeakMap<Entity,GuardWindow>();
const windowFor=(p:Entity):PlayerWindow=>{
  let x=players.get(p);
  if(!x){x={evadeUntil:-1,parryUntil:-1,counterUntil:-1,lastStep:0,lastAt:-1,chain:0};players.set(p,x);}
  return x;
};
const finiteTime=(t:number)=>Number.isFinite(t)&&t>=0;
const meleeDistance=(a:Entity,b:Entity)=>Math.hypot(a.pos.x-b.pos.x,a.pos.z-b.pos.z);
const frontal=(p:Entity,mob:Entity)=>{
  const angle=Math.atan2(mob.pos.x-p.pos.x,mob.pos.z-p.pos.z);
  const delta=Math.atan2(Math.sin(angle-p.facing),Math.cos(angle-p.facing));
  return Math.abs(delta)<=Math.PI*.65;
};
export function r39AcceptedEvade(p:Entity,now:number):void {
  if(!finiteTime(now)||p.dead||!p.originResources)return;
  // Called only by native legal evade edge AFTER the real 14 stamina payment.
  const x=windowFor(p);x.evadeUntil=now+.18;x.parryUntil=-1;
}
export function r39PhysicalDefense(p:Entity,mob:Entity,now:number):R39DefenseResult|null {
  if(!finiteTime(now)||p.kind!=='player'||!p.originResources||p.dead||
     mob.kind!=='mob'||!mob.hostile||mob.dead||meleeDistance(p,mob)>4.2)return null;
  const x=players.get(p);
  if(!x)return null;
  if(x.evadeUntil>=now)return 'perfect-dodge';
  if(x.parryUntil>=now&&frontal(p,mob)){
    x.parryUntil=-1; // each deliberate input can parry exactly one hit
    x.counterUntil=now+.90;
    return 'parry';
  }
  return null;
}
export function r39RecordBasic(
  p:Entity,target:Entity|null,step:1|2|3|4,now:number,
  actualHpLoss:number,immuneGuard:boolean,
):{connected:boolean;guardBroken:boolean;counter:boolean}{
  if(!finiteTime(now)||p.dead||!p.originResources)return {connected:false,guardBroken:false,counter:false};
  const x=windowFor(p);
  const connected=x.lastStep===step-1&&x.lastAt>=0&&now-x.lastAt<=.95;
  x.chain=connected?Math.min(4,x.chain+1):1;
  x.lastStep=step===4?0:step;
  x.lastAt=now;
  // The ATK itself is the explicit parry input: only a <=120 ms collision
  // with an approaching frontal hostile will count. It does not grant damage.
  x.parryUntil=now+.12;
  const counter=x.counterUntil>=now;
  if(counter)x.counterUntil=-1;
  if(!target||target.kind!=='mob'||target.dead||!target.hostile||
     !Number.isFinite(actualHpLoss)||actualHpLoss<=0||meleeDistance(p,target)>4.2)
    return {connected,guardBroken:false,counter};
  const pressure=Math.max(4,Math.min(70,actualHpLoss*.18))*
    (step===3?1.5:step===4?1.8:1)+(connected?8:0)+(counter?22:0);
  return {connected,guardBroken:r39AddGuardPressure(target,now,pressure,immuneGuard),counter};
}
export function r39AddGuardPressure(
  mob:Entity,now:number,amount:number,immune:boolean,
):boolean {
  if(immune||mob.dead||mob.kind!=='mob'||!mob.hostile||
     !finiteTime(now)||!Number.isFinite(amount)||amount<=0)return false;
  const cap=Math.min(240,Math.max(35,mob.maxHp*.06));
  let x=guards.get(mob);
  if(!x||x.recoverAt<now){x={pressure:0,recoverAt:now+5,brokenUntil:-1};guards.set(mob,x);}
  if(x.brokenUntil>now)return false;
  x.pressure+=amount;
  x.recoverAt=now+5;
  if(x.pressure<cap)return false;
  x.pressure=0;x.brokenUntil=now+1.1;x.recoverAt=now+2.5;
  return true;
}
/** Native-Rig_Medium-only presentation; return null for non-contextual/unknown. */
export function r39ContextualAttackClip(
 step:1|2|3|4, airborne:boolean, falling:boolean,
):string|null {
  if(!airborne)return null; // original weapon-specific ground attack owns it
  if(falling)return step===3||step===4?'2H_Melee_Attack_Chop':'1H_Melee_Attack_Slice_Diagonal';
  return step===2||step===4?'Dualwield_Melee_Attack_Chop':'1H_Melee_Attack_Slice_Diagonal';
}
