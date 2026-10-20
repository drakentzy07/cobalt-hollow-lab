// Projectile travel timing: defer a projectile's damage until it visually lands.
//
// The sim was hitscan: a ranged cast / shot / pet bolt emitted its `fx:'projectile'`
// visual AND resolved its damage in the SAME 20 Hz tick, while the renderer
// (src/render/vfx.ts) flew the bolt at PROJECTILE_SPEED yd/s toward the target. The
// damage number therefore popped before the bolt arrived. This leaf re-times that:
// the call site emits the visual now and schedules the WHOLE resolution (hit roll,
// crit/damage rng draws, dealDamage / runEffects) to run when the bolt reaches the
// target, one or more ticks later. Because every rng draw is deferred to the landing
// tick, a projectile whose caster or target dies or despawns mid-flight FIZZLES: it
// draws nothing and deals nothing (the alive guard in advancePendingProjectiles).
//
// The bolt HOMES on its live target, exactly like the renderer: each tick it steps
// PROJECTILE_SPEED * DT yards toward the target's CURRENT position and impacts on the
// tick it comes within reach. Storing a fixed launch-time landing tick would desync
// from the visual whenever the target moves during flight (a target kiting away pushes
// the bolt's real impact later; running in pulls it earlier); stepping toward the live
// position tracks the renderer's homing instead.
//
// `src/sim`-pure: the homing math (stepProjectile + constants) is a pure function of
// numbers a Vitest drives directly; scheduleProjectile/advance take the SimContext seam
// by TYPE only (no DOM/Three/Math.random/Date.now), so the architecture guard
// (tests/architecture.test.ts) stays green.

import type { SimContext } from './sim_context';
import {lineOfSightClear} from './colliders';
import {groundHeight} from './world';
import {highflyF26SegmentSphereHit, highflyF262GroundContact, HIGHFLY_F263_GROUND_HIT_RADIUS, highflyF26TrajectoryPoint, type HighflyF26Point} from '../highfly/combat/f26_skillshot_core';
import { DT, type Entity } from './types';

// Yards per second. Matches the homing projectile speed in src/render/vfx.ts so the
// damage lands in step with the bolt the player actually sees. Keep the two in sync.
export const PROJECTILE_SPEED = 26;

// Impact radius in yards: the bolt lands once it is within this of the live target (or
// one tick's step, whichever is larger). Mirrors the `Math.max(0.7, step)` arrival test
// in src/render/vfx.ts so the sim resolves on the same tick the visual flashes.
export const PROJECTILE_REACH = 0.7;

// Seconds a bolt may spend chasing before it lands by force. A released projectile can
// never be escaped, so a target kiting at or above PROJECTILE_SPEED (which the homing can
// never physically catch) takes the hit at this deadline rather than getting away. Matches
// the bolt's ttl in src/render/vfx.ts, so the damage lands as the visual gives up.
export const PROJECTILE_MAX_FLIGHT = 3;

/** One tick of homing: move (x, z) toward (tx, tz) by `step` yards. Returns the new
 *  position and whether the bolt is now within reach (it impacts this tick). Pure:
 *  same inputs give the same output, so a bolt's whole flight is deterministic. */
export function stepProjectile(
  x: number,
  z: number,
  tx: number,
  tz: number,
  step: number,
): { x: number; z: number; hit: boolean } {
  const dx = tx - x;
  const dz = tz - z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  if (dist <= Math.max(PROJECTILE_REACH, step)) return { x: tx, z: tz, hit: true };
  const k = step / dist;
  return { x: x + dx * k, z: z + dz * k, hit: false };
}

// A projectile in flight: re-resolved by id at the landing tick so a stale Entity ref
// can never be hit. `resolve` runs only when both ends are still alive (see advance).
// `x`/`z` are the bolt's live horizontal position, stepped toward the target each tick.
export type PendingProjectile = {
  x: number;
  z: number;
  sourceId: number;
  targetId: number;
  ttl: number; // seconds of flight remaining before the bolt gives up and fizzles
  resolve: (source: Entity, target: Entity) => void;
  fizzle?: () => void;
};

/** Queue a projectile launched now from `origin` (the source position by default) at
 *  `target`; `resolve` runs at the landing tick with the still-live authority source and
 *  target. A custom origin lets ricochets travel from the previous impact while caster
 *  liveness and attribution remain authoritative. The caller emits the `fx:'projectile'`
 *  visual itself (the renderer needs it immediately at launch). */
export function scheduleProjectile(
  ctx: SimContext,
  source: Entity,
  target: Entity,
  resolve: (source: Entity, target: Entity) => void,
  origin: Readonly<{ x: number; z: number }> = source.pos,
  fizzle?: () => void,
): void {
  ctx.pendingProjectiles.push({
    x: origin.x,
    z: origin.z,
    sourceId: source.id,
    targetId: target.id,
    ttl: PROJECTILE_MAX_FLIGHT,
    resolve,
    fizzle,
  });
}

/** Advance every in-flight projectile one tick toward its live target, in launch order
 *  (reordering IS drift), resolving the ones that arrive. A bolt that chases past
 *  PROJECTILE_MAX_FLIGHT without catching the target lands by force at the deadline: once
 *  released, a projectile cannot be escaped by outrunning it (the only escape is being out
 *  of cast range when it fires, gated at the launch sites). A bolt fizzles (resolves to
 *  nothing) ONLY when its caster or target has died or despawned mid-flight, so no damage,
 *  threat, or kill credit ever lands on a corpse. */
/** F2.6 free-flight shots are stored per SimContext, NEVER in the donor's
 * homing queue. This prevents a target lock or forced impact after timeout. */
interface HighflyFreeShot {
  sourceId:number;
  pos:HighflyF26Point;
  endpoint:HighflyF26Point;
  length:number;
  traveled:number;
  bend:number;
  onHit:(source:Entity,target:Entity)=>void;
}
const highflyFreeShots=new WeakMap<SimContext,HighflyFreeShot[]>();
export function scheduleHighflyFreeProjectile(
  ctx:SimContext,source:Entity,aim:{x:number;z:number},
  onHit:(source:Entity,target:Entity)=>void,range=30,bend=0,
):void{
  const dx=aim.x-source.pos.x,dz=aim.z-source.pos.z;
  const d=Math.hypot(dx,dz);
  if(!Number.isFinite(d)||d<0.001)return;
  const len=Math.min(range,d);
  const endY=groundHeight(source.pos.x+dx/d*len,source.pos.z+dz/d*len,ctx.cfg.seed)+1.15;
  const shot:HighflyFreeShot={
    sourceId:source.id,pos:{x:source.pos.x,y:source.pos.y+1.15,z:source.pos.z},
    endpoint:{x:source.pos.x+dx/d*len,y:endY,z:source.pos.z+dz/d*len},
    length:len,traveled:0,bend,onHit,
  };
  const queue=highflyFreeShots.get(ctx)??[];
  queue.push(shot);
  highflyFreeShots.set(ctx,queue);
}
function advanceHighflyFreeProjectiles(ctx:SimContext):void{
  const queue=highflyFreeShots.get(ctx);
  if(!queue?.length)return;
  const survivors:HighflyFreeShot[]=[];
  for(const shot of queue){
    const source=ctx.entities.get(shot.sourceId);
    if(!source||source.dead)continue;
    const distance=Math.min(PROJECTILE_SPEED*DT,shot.length-shot.traveled);
    const startT=shot.traveled/shot.length;
    const endT=Math.min(1,(shot.traveled+distance)/shot.length);
    const from=highflyF26TrajectoryPoint(shot.pos,shot.endpoint,startT,shot.bend);
    const next=highflyF26TrajectoryPoint(shot.pos,shot.endpoint,endT,shot.bend);
    // Native world sight collision also blocks the shot. No homing, no forced hit.
    if(!lineOfSightClear(ctx.cfg.seed,from,next,0.12)){
      ctx.emit({type:'highflyF26ProjectileImpact',sourceId:source.id,
        x:from.x,y:from.y,z:from.z});
      continue;
    }
    let victim:Entity|null=null,first=Infinity;
    for(const target of ctx.entities.values()){
      if(target.id===source.id||target.dead||
         (target.kind!=='mob'&&target.kind!=='player')||
         !ctx.isHostileTo(source,target))continue;
      // F2.6.2: a small, honest XZ aiming tolerance for ground mobs.
      // This also prevents jumping above a short monster from falsely
      // missing it when the ground preview passes directly over its feet.
      // Airborne mobs still require real 3D contact.
      const t=(source.highflyF263ContactAssist===true || source.highflyF262ContactAssist===true) && target.onGround
        ? highflyF262GroundContact(from,next,target.pos,
          source.highflyF263ContactAssist===true?HIGHFLY_F263_GROUND_HIT_RADIUS:1.35)
        : highflyF26SegmentSphereHit(from,next,
          {x:target.pos.x,y:target.pos.y+1.12,z:target.pos.z},0.95);
      if(t!==null&&t<first){first=t;victim=target;}
    }
    if(victim){
      ctx.emit({type:'highflyF26ProjectileImpact',sourceId:source.id,
        x:from.x+(next.x-from.x)*first,y:from.y+(next.y-from.y)*first,
        z:from.z+(next.z-from.z)*first});
      shot.onHit(source,victim);continue;
    }
    shot.traveled+=distance;
    if(shot.traveled<shot.length-0.0001)survivors.push(shot);
  }
  highflyFreeShots.set(ctx,survivors);
}

export function advancePendingProjectiles(ctx: SimContext): void {
  advanceHighflyFreeProjectiles(ctx);
  if (ctx.pendingProjectiles.length === 0) return;
  const step = PROJECTILE_SPEED * DT;
  const launchedBeforeTick = ctx.pendingProjectiles;
  ctx.pendingProjectiles = [];
  const stillFlying: PendingProjectile[] = [];
  for (const proj of launchedBeforeTick) {
    const source = ctx.entities.get(proj.sourceId);
    const target = ctx.entities.get(proj.targetId);
    if (!source || source.dead || !target || target.dead) {
      proj.fizzle?.();
      continue;
    }
    const next = stepProjectile(proj.x, proj.z, target.pos.x, target.pos.z, step);
    if (next.hit) {
      proj.resolve(source, target);
      continue;
    }
    proj.ttl -= DT;
    if (proj.ttl <= 0) {
      // A released projectile cannot be escaped: a target faster than the bolt can never
      // be physically caught, so at the flight deadline the bolt lands anyway rather than
      // giving up. The only way to avoid a projectile is to be out of cast range when it
      // FIRES (gated at every launch site), not to outrun it after launch.
      proj.resolve(source, target);
      continue;
    }
    proj.x = next.x;
    proj.z = next.z;
    stillFlying.push(proj);
  }
  ctx.pendingProjectiles = [...stillFlying, ...ctx.pendingProjectiles];
}
