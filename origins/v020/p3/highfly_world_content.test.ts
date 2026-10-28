import { describe, expect, it } from 'vitest';
import {
  BUILTIN_WORLD, ZONES, CAMPS, DUNGEON_LIST, ITEMS, MOBS, NPCS, QUESTS,
} from '../src/sim/data';
import { Sim } from '../src/sim/sim';

describe('HIGHFLY ORIGIN P3: actual complete v0.20 world', () => {
  it('has the original three zone bands and non-empty towns, monsters, NPCs and missions', () => {
    expect(ZONES).toHaveLength(3);
    expect(new Set(ZONES.map(z => z.id)).size).toBe(3);
    expect(BUILTIN_WORLD.zones).toBe(ZONES);
    expect(BUILTIN_WORLD.camps).toBe(CAMPS);
    expect(Object.keys(NPCS).length).toBeGreaterThan(12);
    expect(Object.keys(QUESTS).length).toBeGreaterThan(40);
    expect(Object.keys(MOBS).length).toBeGreaterThan(15);
    expect(Object.keys(ITEMS).length).toBeGreaterThan(20);
    expect(CAMPS.length).toBeGreaterThan(10);
    expect(BUILTIN_WORLD.props.buildings.length).toBeGreaterThan(0);
    const badCamps=CAMPS.filter(c => !MOBS[c.mobId]);
    expect(badCamps, 'all camp mobs must have real templates').toEqual([]);
    console.log('[HIGHFLY P3 world catalog]',JSON.stringify({
      zones:ZONES.map(z=>z.name),
      camps:CAMPS.length, mobs:Object.keys(MOBS).length,
      npcs:Object.keys(NPCS).length,quests:Object.keys(QUESTS).length,
      items:Object.keys(ITEMS).length,buildings:BUILTIN_WORLD.props.buildings.length,
      dungeons:DUNGEON_LIST.map(d=>d.id),
    }));
  });
  it('spawns actual enemy mobs and NPCs from built-in content, not a blank technical map', () => {
    const sim=new Sim({seed:20061,playerClass:'warrior',playerName:'Draken'});
    const mobCount=[...sim.entities.values()].filter(e=>e.kind==='mob').length;
    const npcCount=[...sim.entities.values()].filter(e=>e.kind==='npc').length;
    expect(sim.playerId).toBeGreaterThan(0);
    expect(sim.player.name).toBe('Draken');
    expect(mobCount).toBeGreaterThan(15);
    expect(npcCount).toBeGreaterThan(10);
  });
  it('retains dungeons, real doors and the instance data',()=>{
    expect(DUNGEON_LIST.length).toBeGreaterThanOrEqual(5);
    const sim=new Sim({seed:20061,playerClass:'warrior',playerName:'Draken'});
    const doors=[...sim.entities.values()].filter(e=>e.templateId==='dungeon_door');
    const outside=DUNGEON_LIST.filter(d=>d.overworldDoor!==false);
    expect(doors.length).toBeGreaterThanOrEqual(outside.length);
    for(const d of outside){
      expect(doors.some(e=>e.dungeonId===d.id), 'missing dungeon door for '+d.id).toBe(true);
    }
  });
});
