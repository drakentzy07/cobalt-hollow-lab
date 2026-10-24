/**
 * HIGHFLY G2-01 deterministic gameplay test.
 * Copied into candidate/tests/ by the isolated G2 overlay.
 * Proof target: no gear, aim, actual airborne travel, landing and AoE damage.
 * Does NOT claim launch/knock-up or mobile touch testing.
 */
import {describe,expect,it} from 'vitest';
import {Sim} from '../src/sim/sim';
import {MOBS} from '../src/sim/data';
import {createMob} from '../src/sim/entity';
import {heroicLeapPlacementPreview} from '../src/sim/combat/heroic_leap';
import type {Entity} from '../src/sim/types';
import {EMPTY_TEST_WORLD} from './sim_shared';

type SimWithMob = Sim & {nextId:number; addEntity(e:Entity):void};

describe('HIGHFLY — Impacto Astral G2-01', () => {
  it('casts with empty hands and a level-one Hunter fixture; arcs, lands and hurts a wolf', () => {
    const sim = new Sim({seed:7,playerClass:'warrior',world:EMPTY_TEST_WORLD}) as SimWithMob;
    const p = sim.player;
    sim.unequipItem('mainhand',p.id);
    sim.unequipItem('offhand',p.id);
    sim.unequipItem('chest',p.id);
    const start={...p.pos};
    const aim={x:start.x+10,z:start.z};
    const mob=createMob(sim.nextId++,MOBS.forest_wolf,1,{x:aim.x,y:start.y,z:aim.z+1});
    mob.maxHp=1e6;mob.hp=1e6;mob.hostile=true;
    sim.addEntity(mob);
    const before=mob.hp;
    p.gcdRemaining=0;
    sim.castAbility('hf_impacto_astral',p.id,aim);
    expect(p.leap).not.toBeNull();
    expect(p.pos.x).toBeCloseTo(start.x,4);
    expect(mob.hp).toBe(before);
    sim.tick();
    expect(p.pos.y).toBeGreaterThan(start.y);
    expect(p.onGround).toBe(false);
    expect(mob.hp).toBe(before);
    for(let i=0;i<30 && p.leap;i++)sim.tick();
    expect(p.leap).toBeNull();
    expect(p.onGround).toBe(true);
    expect(Math.hypot(p.pos.x-aim.x,p.pos.z-aim.z)).toBeLessThan(3);
    expect(mob.hp).toBeLessThan(before);
  });
  it('uses the same collision-safe landing preview as native Heroic Leap', () => {
    const source={pos:{x:0,y:1,z:0},onGround:true};
    const aim={x:10,z:0};
    expect(heroicLeapPlacementPreview(7,source,'hf_impacto_astral',aim))
      .toEqual(heroicLeapPlacementPreview(7,source,'heroic_leap',aim));
  });
});
