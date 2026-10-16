import {describe,it,expect,vi} from 'vitest';
import {readFileSync} from 'node:fs';
import type {Entity} from '../src/sim/types';
import type {SimContext} from '../src/sim/sim_context';
import {
 ORIGIN_SHOT_SPEED,originSegmentCircle,originFirstContact,originNextShot,
 originNormalizeDirection
} from '../src/sim/highfly_origin_r24a_skillshot_physics';
import {
 originCanFreeFire,originRememberFreeAim,originHasFreeAim,originTakeFreeAim,
 originScheduleFreeShot,originAdvanceFreeShots
} from '../src/sim/highfly_origin_r24a_native_skillshot';
function mockWorld(){
 const hero={id:1,kind:'player',dead:false,hp:100,pos:{x:0,y:0,z:0},
  originResources:{mana:200,stamina:100}} as unknown as Entity;
 const mob={id:88,kind:'mob',dead:false,hp:100,pos:{x:0,y:0,z:8}} as Entity;
 const entities=new Map([[1,hero],[88,mob]]);
 const ctx={entities,isHostileTo:(a:Entity,b:Entity)=>a.id!==b.id,
  hasLineOfSight:()=>true} as unknown as SimContext;
 return {ctx,hero,mob};
}
describe('R24A: REAL ballistic collision, no homing, no magic hit on miss',()=>{
 it('precise continuous segment collision catches a thin enemy crossing between ticks',()=>{
  expect(originSegmentCircle({x:0,z:0},{x:0,z:2},{x:0.7,z:1},.82)).not.toBeNull();
  expect(originSegmentCircle({x:0,z:0},{x:0,z:2},{x:1.4,z:1},.82)).toBeNull();
  expect(originSegmentCircle({x:0,z:0},{x:0,z:2},{x:0,z:10},.82)).toBeNull();
 });
 it('collision chooses FIRST enemy in corridor rather than nearest selected target',()=>{
  const a={x:0,z:0},b={x:0,z:10};
  const hit=originFirstContact(a,b,[{id:9,pos:{x:.2,z:6}},{id:3,pos:{x:.25,z:3}}]);
  expect(hit?.id).toBe(3);
 });
 it('trajectory is fixed and range-limited regardless of moving enemy positions',()=>{
  const dir=originNormalizeDirection({x:0,z:0},{x:12,z:0})!;
  let state={point:{x:0,z:0},dir,distance:0,reach:15,radius:.82};
  for(let i=0;i<30;i++){const next=originNextShot(state,.05);state=next.next;if(next.expired)break;}
  expect(state.point.x).toBeCloseTo(15,4);
  expect(state.point.z).toBe(0);
  expect(ORIGIN_SHOT_SPEED).toBe(26);
 });
 it('EMPTY SPACE still launches; has a real fizzle and zero impact callback',()=>{
  const {ctx,hero,mob}=mockWorld();mob.pos.x=10;
  const impact=vi.fn(),miss=vi.fn();
  originScheduleFreeShot(ctx,hero,'fireball',{x:0,z:1},12,impact,miss);
  for(let i=0;i<30;i++)originAdvanceFreeShots(ctx);
  expect(impact).not.toHaveBeenCalled();expect(miss).toHaveBeenCalledTimes(1);
  expect(mob.hp).toBe(100);
 });
 it('TARGET MOVES OFF THE LANE in flight: it MISSES even if the selected target was previously aligned',()=>{
  const {ctx,hero,mob}=mockWorld(); const impact=vi.fn(),miss=vi.fn();
  originScheduleFreeShot(ctx,hero,'shadow_bolt',{x:0,z:1},14,impact,miss);
  for(let i=0;i<2;i++)originAdvanceFreeShots(ctx);
  mob.pos.x=4;
  for(let i=0;i<30;i++)originAdvanceFreeShots(ctx);
  expect(impact).not.toHaveBeenCalled();expect(miss).toHaveBeenCalledTimes(1);
 });
 it('TARGET MOVES INTO the collision corridor after the shot launched: it hits ONCE',()=>{
  const {ctx,hero,mob}=mockWorld(); const impact=vi.fn(),miss=vi.fn();
  mob.pos.x=4;
  originScheduleFreeShot(ctx,hero,'fireball',{x:0,z:1},14,impact,miss);
  for(let i=0;i<2;i++)originAdvanceFreeShots(ctx);
  mob.pos.x=.4;
  for(let i=0;i<30;i++)originAdvanceFreeShots(ctx);
  expect(impact).toHaveBeenCalledTimes(1);expect(impact.mock.calls[0][1].id).toBe(88);
  expect(miss).not.toHaveBeenCalled();
 });
 it('only opted-in Origin Hunter spells get free-aim; original legacy classes are unchanged',()=>{
  const {hero}=mockWorld();
  expect(originCanFreeFire(hero,'fireball',{x:0,z:30})).toBe(true);
  expect(originCanFreeFire(hero,'shadow_bolt',{x:0,z:30})).toBe(true);
  expect(originCanFreeFire(hero,'fear',{x:0,z:30})).toBe(false);
  expect(originCanFreeFire({...hero,originResources:undefined} as Entity,'fireball',{x:0,z:30})).toBe(false);
  expect(originCanFreeFire(hero,'fireball',{x:0,z:0})).toBe(false);
  originRememberFreeAim(hero,'fireball',{x:0,z:30});
  expect(originHasFreeAim(hero,'fireball')).toBe(true);
  expect(originTakeFreeAim(hero,'fireball')).toEqual({x:0,z:1});
  expect(originHasFreeAim(hero,'fireball')).toBe(false);
 });
 it('native cast remains economic authority; R24 integrates BEFORE generic homing path',()=>{
  const lifecycle=readFileSync('src/sim/combat/casting_lifecycle.ts','utf8');
  const projectile=readFileSync('src/sim/projectile_travel.ts','utf8');
  const hud=readFileSync('src/highfly/highfly_origin_r17_hud.ts','utf8');
  expect(lifecycle).toContain('originScheduleFreeShot(ctx,p,ability.id,freeHeading,reach,');
  expect(lifecycle).toContain('spendAbilityCost(ctx,p,meta,res,null)');
  expect(lifecycle).toContain('armAbilityCooldownWithReflection(ctx,p,meta,res,togglingOff)');
  expect(lifecycle.indexOf('originScheduleFreeShot(ctx,p,ability.id')).toBeLessThan(lifecycle.indexOf('const firesProjectile ='));
  expect(projectile).toContain('originAdvanceFreeShots(ctx)');
  expect(hud).toContain('ORIGIN_FREE_SKILLS.has(def.id)');
  expect(hud).toContain('h.castAt(def.id,aimed.point)');
 });
});
