/** P08 OFF/OFF rollback gate: neither experimental HF dungeon nor
 * outdoor monster content can silently leak into the original WebGL game.
 * Run in a separate vitest process with BOTH opt-in flags set to 0.
 */
import {describe,it,expect} from 'vitest';
import {Sim} from '../src/sim/sim';
import {BUILTIN_WORLD,CAMPS,DUNGEONS,ZONES} from '../src/sim/data';

describe('HIGHFLY P08 production-safe V4-03 feature rollback',()=>{
  it('keeps donor world content untouched and adds no native HF doors or packs',()=>{
    expect(BUILTIN_WORLD.zones).toBe(ZONES);
    expect(BUILTIN_WORLD.camps).toBe(CAMPS);
    expect(BUILTIN_WORLD.camps.some(c=>c.mobId.startsWith('hf_hunt_'))).toBe(false);
    expect(Object.keys(DUNGEONS).some(id=>id.startsWith('hf_dungeon_'))).toBe(false);
    expect(ZONES.every(z=>z.pois.every(p=>!p.id?.startsWith('hf_habitat_')&&!p.id?.startsWith('hf_world_portal_')))).toBe(true);
  });
  it('creates exactly one LV1 Hunter with the original save and its authentic world',()=>{
    const sim=new Sim({seed:80303,playerClass:'warrior',noPlayer:true,
      world:BUILTIN_WORLD,compulsoryTutorial:false,riftPortals:false});
    const pid=sim.addPlayer('warrior','P08Baseline',{tutorialGreetingSent:true});
    expect(sim.serializeCharacter(pid)?.level).toBe(1);
    expect([...sim.entities.values()].filter(e=>e.kind==='player')).toHaveLength(1);
    expect(sim.enterDungeon('hf_dungeon_hf_hunt_wolves_21',pid)).toBe(false);
  });
});
