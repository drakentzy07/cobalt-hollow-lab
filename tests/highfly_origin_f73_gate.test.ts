import { describe, expect, it } from 'vitest';
import { BUILTIN_WORLD, DUNGEON_LIST, DUNGEONS, ITEMS, MOBS, ZONES } from '../src/sim/data';
import { Sim } from '../src/sim/sim';
import { HIGHFLY_GATE_DOOR, HIGHFLY_GATE_ID, HIGHFLY_GATE_SPAWNS } from '../src/highfly/origin/f73_gate';

describe('HIGHFLY F7.3 — Gate 01: one world, one Sim, 11 instanced LV21–30 enemies', () => {
  it('registers exactly one new native instance without replacing donor dungeons', () => {
    const gate = DUNGEONS[HIGHFLY_GATE_ID];
    expect(gate).toBeDefined();
    expect(gate.index).toBe(15); // Ignivar Forge-Lift owns 14.
    expect(DUNGEON_LIST.filter(x => x.index === gate.index)).toHaveLength(1);
    expect(DUNGEONS.hollow_crypt.index).toBe(0);
    expect(DUNGEONS.gravewyrm_sanctum.index).toBe(2);
    expect(gate.interior).toBe('crypt');
    expect(gate.suggestedPlayers).toBe(1);
    expect(gate.finalBossId).toBe('hf_f72_ridge_captain');
    expect(gate.bossExitPortal).toEqual({ x: 0, z: 105 });
  });

  it('positions the walk-in portal near Highwatch without replacing its native zone', () => {
    const thornpeak = ZONES.find(z => z.id === 'thornpeak_heights')!;
    expect(HIGHFLY_GATE_DOOR.x).toBeGreaterThan(-180);
    expect(HIGHFLY_GATE_DOOR.x).toBeLessThan(180);
    expect(HIGHFLY_GATE_DOOR.z).toBeGreaterThan(thornpeak.zMin);
    expect(HIGHFLY_GATE_DOOR.z).toBeLessThan(thornpeak.zMax);
    expect(BUILTIN_WORLD.camps.some(c => c.mobId.startsWith('hf_f72_'))).toBe(false);
  });

  it('preserves authentic native loot and materials for 5+5+1 combat progression', () => {
    expect(HIGHFLY_GATE_SPAWNS).toHaveLength(11);
    expect(HIGHFLY_GATE_SPAWNS.filter(s => s.mobId === 'hf_f72_ridge_hound')).toHaveLength(5);
    expect(HIGHFLY_GATE_SPAWNS.filter(s => s.mobId === 'hf_f72_crag_burrower')).toHaveLength(5);
    expect(HIGHFLY_GATE_SPAWNS.filter(s => s.mobId === 'hf_f72_ridge_captain')).toHaveLength(1);
    for (const spawn of HIGHFLY_GATE_SPAWNS) {
      const mob = MOBS[spawn.mobId];
      expect(mob).toBeDefined();
      expect(mob.minLevel).toBeGreaterThanOrEqual(21);
      expect(mob.maxLevel).toBeLessThanOrEqual(30);
      expect(spawn.idleStationary).toBe(true);
      for (const drop of mob.loot) {
        if (drop.itemId) expect(ITEMS[drop.itemId]).toBeDefined();
      }
    }
    expect(HIGHFLY_GATE_SPAWNS.every(s => Math.abs(s.x) < 10 && s.z >= 18 && s.z <= 105)).toBe(true);
  });

  it('enters through the LAB shortcut, spawns only instance enemies and returns by native exit', () => {
    const lab = new Sim({
      seed: 731, playerClass: 'warrior', playerName: 'DrakenLAB',
      originUniversalHunter: true, originLabHunter: true, compulsoryTutorial: false,
      world: { ...BUILTIN_WORLD, camps: [], npcs: {}, groundObjects: [] },
    });
    expect(lab.highflyLabTravelToHunt()).toBe(true);
    expect(lab.player.pos.x).toBeGreaterThan(100_000);
    const spawned = [...lab.entities.values()].filter(e => e.kind === 'mob' && e.templateId.startsWith('hf_f72_'));
    expect(spawned).toHaveLength(11);
    expect(lab.leaveDungeon()).toBe(true);
    expect(lab.player.pos.x).toBeLessThan(180);
  });

  it('does not grant World players a LAB shortcut', () => {
    const world = new Sim({
      seed: 732, playerClass: 'warrior', playerName: 'Draken',
      originUniversalHunter: true, compulsoryTutorial: false,
      world: { ...BUILTIN_WORLD, camps: [], npcs: {}, groundObjects: [] },
    });
    expect(world.highflyLabTravelToHunt()).toBe(false);
    expect(world.player.pos.x).toBeLessThan(180);
  });
});
