/** HIGHFLY P02D: concrete native biome dressing + navigability + phone budget.
 * This asserts data in the actual WorldContent consumed by offline Sim and renderer.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { getActiveWorldContent, BUILTIN_WORLD, ZONES, CAMPS } from '../src/sim/data';
import { HIGHFLY_HUNT_SCENARIOS } from '../src/highfly/monsters/hunt_scenarios';
import { createHighflyHuntBrowserSession, nativeHighflyHuntSurfaceProbe } from '../src/highfly/monsters/hunt_browser_pilot';
import {
  addHighflyHuntScenery, highflySceneryCoverage, scenicAnchorClearance,
  SCENIC_ANCHORS, HUNT_SCENERY_DECOR_CAP, highflyHuntRoads,
} from '../src/highfly/monsters/hunt_scenery';
import { setActiveWorldContent } from '../src/sim/data';

const distToSegment=(px:number,pz:number,a:{x:number;z:number},b:{x:number;z:number})=>{
  const dx=b.x-a.x,dz=b.z-a.z;
  const t=Math.min(1,Math.max(0,((px-a.x)*dx+(pz-a.z)*dz)/(dx*dx+dz*dz)));
  return Math.hypot(px-a.x-t*dx,pz-a.z-t*dz);
};

describe('HIGHFLY P02D donor-native scenic zones, route safety and 8-mob budget',()=>{
  it('all eight level bands have exclusive, distinct native themed asset palettes',()=>{
    expect(highflySceneryCoverage()).toBe(true);
    expect(highflyHuntRoads()).toHaveLength(4);
    const actualSource = readFileSync(new URL('../src/render/props.ts', import.meta.url),'utf8');
    for(const s of HIGHFLY_HUNT_SCENARIOS) {
      const world=createHighflyHuntBrowserSession(s.minLevel).world;
      const decor=world.props.decorProps??[];
      expect(decor).toHaveLength(HUNT_SCENERY_DECOR_CAP);
      expect(new Set(decor.map(p=>p.key)).size).toBe(4);
      for(const p of decor) {
        // Verify every GLB key is an actual shipped donor asset, not a placeholder.
        expect(actualSource).toContain(p.key+': { url:');
        expect(p.r).toBeGreaterThan(0);
        expect(p.scale).toBeGreaterThan(0);
        expect(scenicAnchorClearance(p.x,p.z,p.r??0)).toBe(true);
      }
      expect(world.camps.reduce((n,c)=>n+c.count,0)).toBe(8);
      expect(world.camps.every(c=>c.offStream)).toBe(true);
      expect(world.zones[0].pois).toHaveLength(6); // refuge + landmark + 4 trails
    }
  });

  it('all four roads have a wide safe corridor, no camp- or prop-overlap and valid native heights',()=>{
    const start=getActiveWorldContent(),defaultZones=ZONES.length,defaultCamps=CAMPS.length;
    try {
      for(const s of HIGHFLY_HUNT_SCENARIOS) {
        const {world,seed}=createHighflyHuntBrowserSession(s.minLevel);
        setActiveWorldContent(world);
        const probe=nativeHighflyHuntSurfaceProbe(seed);
        expect(world.roads).toHaveLength(4);
        expect(world.terrainEdits).toHaveLength(6);
        const decor=world.props.decorProps??[];
        for(let campIndex=0;campIndex<4;campIndex++){
          const road=world.roads[campIndex],camp=world.camps[campIndex];
          expect(road[0]).toEqual(world.playerStart);
          expect(road.at(-1)).toEqual(camp.center);
          for(let part=1;part<road.length;part++) {
            const a=road[part-1],b=road[part];
            for(let n=0;n<=30;n++) {
              const t=n/30,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;
              const surface=probe(x,z);
              expect(surface.walkable).toBe(true);
              expect(surface.groundY).toBeGreaterThan(surface.waterY+0.7);
              for(const prop of decor) {
                expect(Math.hypot(prop.x-x,prop.z-z)).toBeGreaterThan((prop.r??0)+7.5);
              }
            }
            for(const prop of decor) {
              expect(distToSegment(prop.x,prop.z,a,b)).toBeGreaterThan((prop.r??0)+7.5);
            }
          }
        }
      }
    } finally {
      setActiveWorldContent(start);
    }
    expect(start).toBe(BUILTIN_WORLD);
    expect(ZONES).toHaveLength(defaultZones);
    expect(CAMPS).toHaveLength(defaultCamps);
  });

  it('rejects malformed, duplicated, and public donor worlds without changing default arrays',()=>{
    const start=getActiveWorldContent(),base=createHighflyHuntBrowserSession(21).world;
    expect(()=>addHighflyHuntScenery(base,'hf_hunt_woods_21')).toThrow('HF_HUNT_SCENERY_INVALID_BASE_WORLD');
    expect(()=>addHighflyHuntScenery(BUILTIN_WORLD,'hf_hunt_woods_21')).toThrow('HF_HUNT_SCENERY_INVALID_BASE_WORLD');
    expect(()=>addHighflyHuntScenery(base,'hf_hunt_bad')).toThrow('HF_HUNT_SCENERY_INVALID_BASE_WORLD');
    expect(scenicAnchorClearance(0,38,1)).toBe(false);
    expect(scenicAnchorClearance(-108,164,1)).toBe(false);
    expect(scenicAnchorClearance(-999,999,1)).toBe(false);
    expect(SCENIC_ANCHORS.every(v=>scenicAnchorClearance(v.x,v.z,1.1))).toBe(true);
    expect(getActiveWorldContent()).toBe(start);
  });

  it('native renderer decorations are modest: max 12 GLBs, 1 ruin, 4 fires + 3 tents',()=>{
    for(const s of HIGHFLY_HUNT_SCENARIOS){
      const w=createHighflyHuntBrowserSession(s.minLevel).world;
      expect(w.props.decorProps?.length).toBeLessThanOrEqual(12);
      expect(w.props.ruinRings.length).toBeLessThanOrEqual(1);
      expect(w.props.campfires.length).toBeLessThanOrEqual(4);
      expect(w.props.tents.length).toBe(3);
      expect(w.props.graveyards.length).toBeLessThanOrEqual(1);
      expect(w.props.marshReeds.length).toBeLessThanOrEqual(6);
      expect(w.placements).toEqual([]);
      expect(w.npcs).toEqual({});
      expect(w.services).toBeUndefined();
    }
  });
});
