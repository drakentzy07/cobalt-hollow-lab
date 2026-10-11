/** P09 feature flag ON — native Sim accepts monster lab elites and captains
 * without increasing 8-mob budget, replacing Hunter, spoofing training, XP,
 * recipes, loot or spawning any special legendary creature.
 */
import {describe,expect,it} from 'vitest';
import {DUNGEONS,DUNGEON_LIST,ZONES,BUILTIN_WORLD,MOBS} from '../src/sim/data';
import {Sim} from '../src/sim/sim';
import type {PlayerClass} from '../src/sim/types';
import {HIGHFLY_HUNT_SCENARIOS} from '../src/highfly/monsters/hunt_scenarios';
import {highflyNativeHuntDungeonId} from '../src/highfly/monsters/hunt_dungeon_registry';
import {highflyEncounterId} from '../src/highfly/monsters/hunt_encounters';
import {promoteHighflyNativeDungeonChallenges,HIGHFLY_P09_NATIVE_CAP}
  from '../src/highfly/monsters/hunt_p09_challenges';

const CLASSES:PlayerClass[]=[
  'warrior','paladin','hunter','rogue','priest',
  'shaman','mage','warlock','druid',
];
describe('HIGHFLY P09 — MONSTRUOS 6 local challenges in SAME native dungeon + Hunter',()=>{
  it('preserves original 15 zones and all donor dungeon definitions; challenge has 0 extra world mobs',()=>{
    expect(import.meta.env.VITE_HIGHFLY_CHALLENGE_ENCOUNTERS).toBe('1');
    expect(DUNGEONS.hollow_crypt.index).toBe(0);
    // P07 intentionally clones zones to append portal/camp POIs. Preserve IDs,
    // original town hubs and native zone geometry, NOT array object identity.
    expect(BUILTIN_WORLD.zones).toHaveLength(ZONES.length);
    expect(BUILTIN_WORLD.zones.map(z=>z.id)).toEqual(ZONES.map(z=>z.id));
    for(let i=0;i<ZONES.length;i++){
      expect(BUILTIN_WORLD.zones[i].hub).toEqual(ZONES[i].hub);
      expect(BUILTIN_WORLD.zones[i].zMin).toBe(ZONES[i].zMin);
      expect(BUILTIN_WORLD.zones[i].zMax).toBe(ZONES[i].zMax);
    }
    expect(ZONES.length).toBe(15);
    expect(HIGHFLY_P09_NATIVE_CAP).toMatchObject({
      dungeons:8,perDungeon:8,ordinary:6,elite:1,captain:1,addedWorldPopulation:0,newLegendaryBosses:0,
    });
    expect(HIGHFLY_HUNT_SCENARIOS).toHaveLength(8);
    expect(CLASS_ES.length).toBe(9);
    expect([...DUNGEON_LIST].filter(d=>d.id.startsWith('hf_dungeon_'))).toHaveLength(8);
    expect(()=>promoteHighflyNativeDungeonChallenges(DUNGEONS,MOBS))
      .toThrow('HF_P09_EXPECTED_UNTOUCHED_NATIVE_DUNGEON');
  });
  for(const scenario of HIGHFLY_HUNT_SCENARIOS){
    it('LV'+scenario.minLevel+': real Sim, 6 normal + 1 local elite + 1 local captain; original native exit',()=>{
      const dungeonId=highflyNativeHuntDungeonId(scenario.id);
      const dungeon=DUNGEONS[dungeonId];
      expect(DUNGEON_LIST).toContain(dungeon);
      expect(dungeon.spawns).toHaveLength(8);
      const normal=dungeon.spawns.filter(x=>x.mobId.startsWith('hf_hunt_'));
      const eliteId=highflyEncounterId('elite',scenario.minLevel);
      const captainId=highflyEncounterId('captain',scenario.minLevel);
      expect(normal).toHaveLength(6);
      expect(new Set(normal.map(x=>x.mobId)).size).toBe(4);
      expect(dungeon.spawns[5].mobId).toBe(eliteId);
      expect(dungeon.spawns[7].mobId).toBe(captainId);
      expect(MOBS[eliteId]).toMatchObject({id:eliteId,elite:true,boss:false,worldBoss:false});
      expect(MOBS[captainId]).toMatchObject({id:captainId,elite:true,boss:true,worldBoss:false});
      const sim=new Sim({
        seed:91090+scenario.minLevel,playerClass:'warrior',noPlayer:true,autoEquip:false,
        world:{...BUILTIN_WORLD,camps:[]},compulsoryTutorial:false,riftPortals:false,
      });
      const pid=sim.addPlayer('warrior','P09 Same Hunter',{tutorialGreetingSent:true});
      const hunter=sim.entities.get(pid)!,meta=sim.players.get(pid)!;
      expect(sim.enterDungeon(dungeonId,pid)).toBe(false);
      sim.setPlayerLevel(scenario.minLevel,pid); // TEST FIXTURE ONLY!
      expect(sim.enterDungeon(dungeonId,pid)).toBe(true);
      const inst=sim.instances.find(x=>x.dungeonId===dungeonId&&x.enteredBy.has(pid));
      expect(inst?.mobIds).toHaveLength(8);
      const mobIds=(inst?.mobIds??[]).map(id=>sim.entities.get(id)!.templateId);
      expect(mobIds.filter(id=>id.startsWith('hf_hunt_'))).toHaveLength(6);
      expect(mobIds.filter(id=>id===eliteId)).toHaveLength(1);
      expect(mobIds.filter(id=>id===captainId)).toHaveLength(1);
      expect(sim.entities.get(pid)).toBe(hunter);
      expect(sim.players.get(pid)).toBe(meta);
      expect(sim.leaveDungeon(pid)).toBe(true);
      expect([...sim.entities.values()].filter(x=>x.kind==='player')).toHaveLength(1);
      const saved=JSON.parse(JSON.stringify(sim.serializeCharacter(pid)));
      const loaded=new Sim({
        seed:92090+scenario.minLevel,playerClass:'warrior',noPlayer:true,autoEquip:false,
        world:{...BUILTIN_WORLD,camps:[]},compulsoryTutorial:false,riftPortals:false,
      });
      const rid=loaded.addPlayer('warrior','P09 Same Hunter',{state:saved,tutorialGreetingSent:true});
      expect(loaded.players.get(rid)?.equipment).toEqual(meta.equipment);
      expect(loaded.serializeCharacter(rid)?.level).toBe(scenario.minLevel);
    });
  }
  for(const cls of CLASSES){
    it(cls+': authentic P09 entry/exit with its original Hunter',()=>{
      const scenario=HIGHFLY_HUNT_SCENARIOS[0],id=highflyNativeHuntDungeonId(scenario.id);
      const sim=new Sim({seed:92012,playerClass:cls,noPlayer:true,autoEquip:false,
        world:{...BUILTIN_WORLD,camps:[]},compulsoryTutorial:false,riftPortals:false});
      const pid=sim.addPlayer(cls,'P09 '+cls,{tutorialGreetingSent:true});
      sim.setPlayerLevel(scenario.minLevel,pid);
      const hunter=sim.entities.get(pid)!,meta=sim.players.get(pid)!;
      expect(sim.enterDungeon(id,pid)).toBe(true);
      const inst=sim.instances.find(x=>x.dungeonId===id&&x.enteredBy.has(pid));
      expect(inst?.mobIds).toHaveLength(8);
      expect(sim.leaveDungeon(pid)).toBe(true);
      expect(sim.entities.get(pid)).toBe(hunter);
      expect(sim.players.get(pid)).toBe(meta);
    });
  }
});
const CLASS_ES=['Warrior','Paladin','Hunter','Rogue','Priest','Shaman','Mage','Warlock','Druid'];
