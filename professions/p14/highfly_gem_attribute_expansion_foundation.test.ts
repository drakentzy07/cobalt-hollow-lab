/** HIGHFLY DEV P14 foundation — ONE real native equipped slot, 3 elements,
 * no Training Core permanent stat modifications, no parallel Sim/Inventory.
 * Future attribute-effect gems must reuse this original inlay transaction.
 * Test fixture supplies physical bag gem+weapon ONLY; never shipped.
 */
import {describe,it,expect} from 'vitest';
import {Sim} from '../src/sim/sim';
import {BUILTIN_WORLD,STATIONS} from '../src/sim/data';
import {highflyElementalFinisherReady,highflyWeaponElement} from
  '../src/sim/combat/highfly_elemental_basic';

const GEMS=[
  {id:'highfly_fire_gem',element:'fire'},
  {id:'highfly_frost_gem',element:'frost'},
  {id:'highfly_lightning_gem',element:'lightning'},
] as const;
const WEAPON='ironedge_longsword';
describe('HIGHFLY DEV P14 — native physical gemstone persistence foundation',()=>{
  it.each(GEMS)('$element consumed, socketed, ATK4 enabled; same Hunter and Training after relog',
    ({id,element})=>{
      const sim=new Sim({seed:141414,playerClass:'warrior',noPlayer:true,autoEquip:false,
        compulsoryTutorial:false,riftPortals:false,
        world:{...BUILTIN_WORLD,camps:[]}});
      const pid=sim.addPlayer('warrior','P14Gem_'+element,{tutorialGreetingSent:true});
      const entity=sim.entities.get(pid)!;
      const station=STATIONS.find(s=>s.id==='station_eastbrook_forge')!;
      expect(station).toBeDefined();
      sim.addItem(WEAPON,1,pid);
      sim.equipItem(WEAPON,pid);
      expect(highflyElementalFinisherReady(entity)).toBe(false);
      const prior=JSON.parse(JSON.stringify(sim.serializeCharacter(pid)));
      sim.addItem(id,1,pid);
      entity.pos={...sim.groundPos(station.pos.x,station.pos.z)};
      entity.prevPos={...entity.pos};
      const inlay=sim.inlayHighflyGem(id,pid);
      expect(inlay).toMatchObject({ok:true,gem:element,weaponId:WEAPON});
      expect(sim.countItem(id,pid)).toBe(0);
      expect(sim.inlayHighflyGem(id,pid)).toMatchObject({ok:false,reason:'already_socketed'});
      expect(highflyWeaponElement(entity)).toBe(element);
      expect(highflyElementalFinisherReady(entity)).toBe(true);
      const after=JSON.parse(JSON.stringify(sim.serializeCharacter(pid)));
      expect(after.xp).toBe(prior.xp);
      expect(after.level).toBe(prior.level);
      expect(after.craftSkills).toEqual(prior.craftSkills);
      expect(after.gatheringProficiency).toEqual(prior.gatheringProficiency);
      expect(after.trainingProfile).toEqual(prior.trainingProfile);
      expect(after.equipmentInstance?.mainhand?.highflyGem).toBe(element);
      const again=new Sim({seed:141415,playerClass:'warrior',noPlayer:true,autoEquip:false,
        compulsoryTutorial:false,riftPortals:false,
        world:{...BUILTIN_WORLD,camps:[]}});
      const newPid=again.addPlayer('warrior','P14Gem_'+element,{state:after,tutorialGreetingSent:true});
      expect(again.serializeCharacter(newPid)!.equipmentInstance?.mainhand?.highflyGem).toBe(element);
      expect(highflyElementalFinisherReady(again.entities.get(newPid)!)).toBe(true);
      expect([...again.entities.values()].filter(e=>e.kind==='player')).toHaveLength(1);
    });
});
