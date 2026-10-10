/** HIGHFLY P02-C: native terrain + exact opt-in browser entry, no normal-world mutation. */
import { describe, expect, it } from 'vitest';
import { BUILTIN_WORLD, CAMPS, getActiveWorldContent, MOBS, setActiveWorldContent, ZONES } from '../src/sim/data';
import { HIGHFLY_HUNT_SCENARIOS } from '../src/highfly/monsters/hunt_scenarios';
import {
  createHighflyHuntBrowserSession, highflyHuntBrowserRequest,
  nativeHighflyHuntSurfaceProbe,
} from '../src/highfly/monsters/hunt_browser_pilot';

describe('HIGHFLY P02C native offline hunt preview', () => {
  it('requires explicit build and canonical URL band; rejects Extended', () => {
    expect(highflyHuntBrowserRequest(new URLSearchParams('hfHunt=21'),false)).toBeNull();
    for (const raw of ['20','22','99','100','-1','21foo','','01','999999999']) {
      expect(highflyHuntBrowserRequest(new URLSearchParams('hfHunt='+raw),true)).toBeNull();
    }
    expect(highflyHuntBrowserRequest(new URLSearchParams('other=21'),true)).toBeNull();
    expect(() => createHighflyHuntBrowserSession(100)).toThrow('HF_HUNT_BROWSER_INVALID_BAND');
  });

  it('generates each authentic 21–99 isolated native terrain preview without modifying default world', () => {
    const original = getActiveWorldContent();
    const campsBefore=CAMPS.length,zonesBefore=ZONES.length;
    for(const s of HIGHFLY_HUNT_SCENARIOS) {
      const preview=createHighflyHuntBrowserSession(s.minLevel);
      expect(preview.hunterLevel).toBe(s.minLevel);
      expect(preview.seed).toBe(20061);
      expect(preview.world.zones).toHaveLength(1);
      expect(preview.world.zones[0].biome).toBe(s.biome);
      expect(preview.world.camps.reduce((n,c)=>n+c.count,0)).toBe(8);
      expect(preview.world.camps.every(c=>c.offStream)).toBe(true);
      expect(preview.world.terrainEdits).toHaveLength(1);
      expect(preview.world.playerStart).toEqual({x:0,z:38});
      expect(preview.world.npcs).toEqual({});
      expect(preview.world.roads).toEqual([]);
      expect(preview.world.placements).toEqual([]);
      expect(preview.world.services).toBeUndefined();
      expect(getActiveWorldContent()).toBe(original);
      // Verify the *final* world samples (not a dryFlat surrogate).
      setActiveWorldContent(preview.world);
      try {
        const surface=nativeHighflyHuntSurfaceProbe(preview.seed);
        for(const pt of [[0,38],[-108,164],[-36,164],[36,164],[108,164]] as const) {
          const sample=surface(pt[0],pt[1]);
          expect(sample.walkable).toBe(true);
          expect(sample.groundY).toBeGreaterThan(sample.waterY+0.7);
          expect(Number.isFinite(sample.groundY)).toBe(true);
        }
        expect(preview.world.camps.every(c=>MOBS[c.mobId])).toBe(true);
      } finally {
        setActiveWorldContent(original);
      }
    }
    expect(getActiveWorldContent()).toBe(original);
    expect(original).toBe(BUILTIN_WORLD);
    expect(CAMPS).toHaveLength(campsBefore);
    expect(ZONES).toHaveLength(zonesBefore);
  });

  it('exact URL + explicit build activates only one LV21 pilot and restores terrain registry', () => {
    const before=getActiveWorldContent();
    const session=highflyHuntBrowserRequest(new URLSearchParams('hfHunt=21'),true);
    expect(session?.scenarioId).toBe('hf_hunt_woods_21');
    expect(session?.hunterLevel).toBe(21);
    expect(session?.world.camps).toHaveLength(4);
    expect(getActiveWorldContent()).toBe(before);
  });
});
