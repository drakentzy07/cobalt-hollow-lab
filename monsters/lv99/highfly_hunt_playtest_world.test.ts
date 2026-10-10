/** P02B: isolated native Sim zone + 8 real mob spawn, combat, corpse, save. */
import { describe, expect, it } from 'vitest';
import { BUILTIN_WORLD, CAMPS, MOBS, ZONES, setActiveWorldContent } from '../src/sim/data';
import { Sim } from '../src/sim/sim';
import { meleeSwing } from '../src/sim/combat/auto_attack';
import { HIGHFLY_HUNT_SCENARIOS } from '../src/highfly/monsters/hunt_scenarios';
import {
  buildHighflyHuntPlaytestWorld, type HighflyHuntSurfaceProbe,
} from '../src/highfly/monsters/hunt_playtest_world';

const oldIds = new Set(ZONES.map(z => z.id));
const dryFlat: HighflyHuntSurfaceProbe = () => ({
  groundY: 3, waterY: -Infinity, walkable: true,
});
function makeWorld(index = 0, level?: number, probe = dryFlat) {
  const scenario = HIGHFLY_HUNT_SCENARIOS[index];
  return buildHighflyHuntPlaytestWorld(
    scenario.id, level ?? scenario.minLevel, BUILTIN_WORLD, MOBS, oldIds, probe);
}

describe('HIGHFLY P02B opt-in hunting Sim world (NO PAGES/NO V4)', () => {
  it('materializes all 8 scenarios separately with 8 native off-stream mobs each', () => {
    const originalCount = CAMPS.length;
    const originalZones = ZONES.length;
    for (let i = 0; i < HIGHFLY_HUNT_SCENARIOS.length; i++) {
      const preview = makeWorld(i);
      const s = HIGHFLY_HUNT_SCENARIOS[i];
      expect(preview.world.zones).toHaveLength(1);
      expect(preview.world.zones[0].levelRange).toEqual([s.minLevel, s.maxLevel]);
      expect(preview.world.zones[0].biome).toBe(s.biome);
      expect(preview.world.camps).toHaveLength(4);
      expect(preview.world.camps.reduce((n,c) => n+c.count,0)).toBe(8);
      expect(preview.world.camps.every(c => c.offStream)).toBe(true);
      expect(preview.world.camps.every(c => MOBS[c.mobId]?.minLevel === s.minLevel)).toBe(true);
      expect(preview.world.npcs).toEqual({});
      expect(preview.world.groundObjects).toEqual([]);
      expect(preview.world.roads).toEqual([]);
      expect(preview.world.placements).toEqual([]);
      expect(preview.world.blockers).toEqual([]);
      expect(preview.world.props.buildings).toEqual([]);
    }
    expect(CAMPS).toHaveLength(originalCount);
    expect(ZONES).toHaveLength(originalZones);
    expect(CAMPS.some(c => c.mobId.startsWith('hf_hunt_'))).toBe(false);
  });

  it('locks underlevel / extended and refuses flooded, blocked, steep or unknown arenas', () => {
    expect(() => makeWorld(0, 20)).toThrow('HF_HUNT_HUNTER_LEVEL_LOCKED');
    expect(() => makeWorld(7, 100)).toThrow('HF_HUNT_HUNTER_LEVEL_LOCKED');
    expect(() => buildHighflyHuntPlaytestWorld(
      'not-a-zone', 30, BUILTIN_WORLD, MOBS, oldIds, dryFlat))
      .toThrow('HF_HUNT_UNKNOWN_SCENARIO');
    expect(() => makeWorld(0, 21, () => ({groundY:0,waterY:2,walkable:true})))
      .toThrow('HF_HUNT_SURFACE_UNSAFE');
    expect(() => makeWorld(0, 21, () => ({groundY:5,waterY:-Infinity,walkable:false})))
      .toThrow('HF_HUNT_SURFACE_UNSAFE');
    expect(() => makeWorld(0, 21, (x,z) => ({
      groundY: z > 75 ? 90 : 0, waterY: -Infinity, walkable:true,
    }))).toThrow('HF_HUNT_ROUTE_TOO_STEEP');
  });

  it('runs real native LV21 scenario mobs, melee kill, once-only corpse loot and save', () => {
    const preview = makeWorld();
    setActiveWorldContent(preview.world);
    try {
      const sim = new Sim({
        seed: 73, playerClass:'warrior', noPlayer:true, autoEquip:false,
        world: preview.world, compulsoryTutorial:false, riftPortals:false,
      });
      const spawned = [...sim.entities.values()].filter(e =>
        e.kind === 'mob' && e.templateId.startsWith('hf_hunt_'));
      expect(spawned).toHaveLength(8);
      expect(spawned.every(m => m.level >= 21 && m.level <= 29)).toBe(true);
      const pid = sim.addPlayer('warrior','HunterP02B');
      sim.setPlayerLevel(21,pid);
      const hunter = sim.entities.get(pid), meta = sim.players.get(pid);
      if (!hunter || !meta) throw new Error('HF_HUNT_TEST_HUNTER_MISSING');
      const victim = spawned.find(m => m.templateId === 'hf_hunt_wolf_21') ?? spawned[0];
      victim.hp = 1; // Duration-only test fixture: native damage and loot unchanged.
      victim.hostile = true;
      hunter.pos = { ...victim.pos, z: victim.pos.z - 2 };
      hunter.prevPos = { ...hunter.pos };
      hunter.facing = Math.atan2(victim.pos.x - hunter.pos.x, victim.pos.z - hunter.pos.z);
      sim.targetEntity(victim.id,pid);
      const before = meta.copper;
      expect(sim.lootCorpse(victim.id,pid)).toBe(false);
      for(let i=0;i<80&&!victim.dead;i++)meleeSwing(sim.ctx,hunter,victim,0,null,{});
      expect(victim.dead).toBe(true);
      expect(victim.lootable).toBe(true);
      const coins = victim.loot?.copper ?? 0;
      expect(coins).toBeGreaterThan(0);
      expect(sim.lootCorpse(victim.id,pid)).toBe(true);
      expect(meta.copper).toBe(before+coins);
      sim.lootCorpse(victim.id,pid);
      expect(meta.copper).toBe(before+coins);
      const save = sim.serializeCharacter(pid);
      const loaded = new Sim({seed:91,playerClass:'warrior',noPlayer:true,autoEquip:false,world:preview.world});
      const newId=loaded.addPlayer('warrior','HunterP02B',{state:JSON.parse(JSON.stringify(save))});
      expect(loaded.players.get(newId)?.copper).toBe(before+coins);
    } finally {
      setActiveWorldContent(null);
    }
  });
});
