/** HIGHFLY P02A: real LV21–99 scenario/camp authoring guards. */
import { describe, expect, it } from 'vitest';
import { MOBS, ZONES, CAMPS } from '../src/sim/data';
import type { ZoneDef } from '../src/sim/types';
import {
  HIGHFLY_HUNT_SCENARIOS, highflyHuntCoverageValid, prepareHighflyHuntCamps,
} from '../src/highfly/monsters/hunt_scenarios';

const originalZoneIds = new Set(ZONES.map(z=>z.id));
function newZone(s: (typeof HIGHFLY_HUNT_SCENARIOS)[number]): ZoneDef {
  return {id: s.id+'_region',name:s.title,biome:s.biome,
    xMin:600,xMax:950,zMin:0,zMax:250,levelRange:[s.minLevel,s.maxLevel],
    hub:{x:630,z:30,radius:14,name:'Hunter Outpost'},
    graveyard:{x:630,z:40},lakes:[],pois:[],
    welcome:'A HIGHFLY hunt begins.'};
}
function placement(s: (typeof HIGHFLY_HUNT_SCENARIOS)[number]) {
  return {scenarioId:s.id,zoneId:s.id+'_region',
    camps: s.families.map((family,i)=>({family,x:650+i*65,z:125,radius:8,count:2}))};
}
describe('HIGHFLY hunting regions 21-99 (data-only, world gate required)',()=>{
  it('covers every band exactly once and never silently injects camps',()=>{
    expect(highflyHuntCoverageValid()).toBe(true);
    expect(HIGHFLY_HUNT_SCENARIOS).toHaveLength(8);
    expect(new Set(HIGHFLY_HUNT_SCENARIOS.map(s=>s.id)).size).toBe(8);
    expect(CAMPS.some(c=>c.mobId.startsWith('hf_hunt_'))).toBe(false);
    for(const s of HIGHFLY_HUNT_SCENARIOS){
      expect(s.populationBudget).toBeLessThanOrEqual(8);
      expect(s.families).toHaveLength(4);
      expect(s.requiresWorldGate).toBe(true);
    }
  });
  it('creates off-stream valid camps for each matched higher-level zone',()=>{
    for(const s of HIGHFLY_HUNT_SCENARIOS){
      const actual = prepareHighflyHuntCamps(
        placement(s),[...ZONES,newZone(s)],MOBS,originalZoneIds);
      expect(actual.camps).toHaveLength(4);
      expect(actual.camps.every(c=>c.offStream)).toBe(true);
      expect(actual.camps.reduce((n,c)=>n+c.count,0)).toBe(8);
      for(const camp of actual.camps){
        expect(camp.mobId).toContain('_'+s.minLevel);
        const mob=MOBS[camp.mobId];
        expect(mob.minLevel).toBe(s.minLevel);
        expect(mob.maxLevel).toBe(s.maxLevel);
      }
    }
  });
  it('refuses to place LV99 mobs in original zones and rejects mislabelled level bands',()=>{
    const s=HIGHFLY_HUNT_SCENARIOS[7];
    const mock=newZone(s);
    expect(()=>prepareHighflyHuntCamps(
      {...placement(s),zoneId:ZONES[0].id},[...ZONES,mock],MOBS,originalZoneIds))
      .toThrow('HF_HUNT_DONOR_ZONE_FORBIDDEN');
    expect(()=>prepareHighflyHuntCamps(
      placement(s),[...ZONES,{...mock,levelRange:[1,20]}],MOBS,originalZoneIds))
      .toThrow('HF_HUNT_ZONE_NOT_CERTIFIED');
    expect(()=>prepareHighflyHuntCamps(
      {...placement(s),camps:placement(s).camps.map(c=>({...c,count:3}))},
      [...ZONES,mock],MOBS,originalZoneIds))
      .toThrow('HF_HUNT_PHONE_POPULATION_EXCEEDED');
    expect(()=>prepareHighflyHuntCamps(
      {...placement(s),camps:[{family:'wolf',x:650,z:125,radius:8,count:1}]},
      [...ZONES,mock],MOBS,originalZoneIds))
      .toThrow('HF_HUNT_FAMILY_INVALID');
    expect(()=>prepareHighflyHuntCamps(
      {...placement(s),camps:[{family:'ogre',x:900,z:9999,radius:8,count:1}]},
      [...ZONES,mock],MOBS,originalZoneIds))
      .toThrow('HF_HUNT_CAMP_OUTSIDE_ZONE');
  });
});
