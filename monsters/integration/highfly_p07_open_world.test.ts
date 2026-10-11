/** P07 real HIGHFLY LV21-99 wilderness from the original ClaudeCraft
 * runtime, alongside eight native physical portals. NO map replacement.
 */
import {describe,it,expect} from 'vitest';
import {BUILTIN_WORLD,CAMPS,ZONES,DUNGEONS,MOBS} from '../src/sim/data';
import {Sim} from '../src/sim/sim';
import {HIGHFLY_HUNT_SCENARIOS} from '../src/highfly/monsters/hunt_scenarios';
import {highflyNativeHuntDungeonId} from '../src/highfly/monsters/hunt_dungeon_registry';
describe('HIGHFLY V4-03 P07: eight dangerous ORIGINAL world habitat zones',()=>{
  it('never replaced ClaudeCraft map/quest camp arrays and adds 16 bounded native camps',()=>{
    expect(BUILTIN_WORLD.zones).toHaveLength(ZONES.length);
    expect(BUILTIN_WORLD.zones.map(z=>z.id)).toEqual(ZONES.map(z=>z.id));
    expect(BUILTIN_WORLD.camps.length).toBe(CAMPS.length+16);
    expect(BUILTIN_WORLD.camps.slice(0,CAMPS.length)).toEqual(CAMPS);
    const added=BUILTIN_WORLD.camps.slice(CAMPS.length);
    expect(added).toHaveLength(16);
    expect(added.every(c=>c.offStream===true && c.count===2 && c.radius===4)).toBe(true);
    expect(added.reduce((acc,c)=>acc+c.count,0)).toBe(32);
    expect(CAMPS.every(c=>!c.mobId.startsWith('hf_hunt_'))).toBe(true);
    expect(BUILTIN_WORLD.zones.slice(0,3)).toEqual(ZONES.slice(0,3));
  });
  for(let i=0;i<HIGHFLY_HUNT_SCENARIOS.length;i++){
    const stage=HIGHFLY_HUNT_SCENARIOS[i];
    it(stage.id+' has two safe open-world native HF camps AND one walk-up portal',()=>{
      const zone=BUILTIN_WORLD.zones[i+3];
      const existing=ZONES[i+3];
      expect(zone.id).toBe(existing.id);
      const dungeon=DUNGEONS[highflyNativeHuntDungeonId(stage.id)];
      expect(dungeon.overworldDoor).toBe(true);
      const camps=BUILTIN_WORLD.camps.slice(CAMPS.length)
        .filter(c=>c.center.z>=zone.zMin&&c.center.z<zone.zMax &&
          (zone.xMin===undefined || c.center.x>=zone.xMin) &&
          (zone.xMax===undefined || c.center.x<zone.xMax));
      // Zone bands may overlap in x/z; all actual chosen placements belong
      // to their map area, and both family template ids are exact tier.
      for(const family of stage.families.slice(0,2)){
        const id='hf_hunt_'+family+'_'+stage.minLevel;
        const camp=BUILTIN_WORLD.camps.slice(CAMPS.length).find(x=>x.mobId===id);
        expect(camp).toBeDefined();
        if(!camp)throw Error('missing authored stage camp');
        expect(camp.center.z).toBeGreaterThanOrEqual(zone.zMin);
        expect(camp.center.z).toBeLessThan(zone.zMax);
        expect(Math.hypot(camp.center.x-dungeon.doorPos.x,camp.center.z-dungeon.doorPos.z)).toBeGreaterThan(50);
        expect(Math.hypot(camp.center.x-zone.hub.x,camp.center.z-zone.hub.z)).toBeGreaterThan(zone.hub.radius+38);
        expect(MOBS[camp.mobId]?.minLevel).toBe(stage.minLevel);
        expect(MOBS[camp.mobId]?.maxLevel).toBe(stage.maxLevel);
      }
      expect(zone.pois.some(p=>p.id==='hf_world_portal_'+stage.id)).toBe(true);
      expect(zone.pois.filter(p=>p.id?.startsWith('hf_habitat_'+stage.id+'_'))).toHaveLength(2);
      // Original map labels weren't replaced by new ones.
      expect(zone.pois.slice(0,existing.pois.length)).toEqual(existing.pois);
    });
  }
  it('real donor Sim spawns HIGHFLY pack in the outdoor world (no second Hunter)',()=>{
    const c=BUILTIN_WORLD.camps.find(x=>x.mobId==='hf_hunt_wolf_21');
    expect(c).toBeDefined();
    const sim=new Sim({seed:716543,playerClass:'warrior',noPlayer:true,
      world:{...BUILTIN_WORLD,camps:[c!]},
      compulsoryTutorial:false,riftPortals:false});
    const pid=sim.addPlayer('warrior','P07OutdoorHunter',{tutorialGreetingSent:true});
    const hunter=sim.entities.get(pid);
    expect(hunter?.kind).toBe('player');
    let mobCount=[...sim.entities.values()].filter(e=>e.kind==='mob'&&e.templateId===c?.mobId).length;
    for(let i=0;i<60&&mobCount===0;i++){
      sim.tick();
      mobCount=[...sim.entities.values()].filter(e=>e.kind==='mob'&&e.templateId===c?.mobId).length;
    }
    expect(mobCount).toBe(2);
    expect([...sim.entities.values()].filter(e=>e.kind==='player')).toHaveLength(1);
    expect(sim.entities.get(pid)).toBe(hunter);
    expect(sim.serializeCharacter(pid)?.level).toBe(1);
    expect(sim.serializeCharacter(pid)?.copper).toBeGreaterThanOrEqual(0);
  });
});
