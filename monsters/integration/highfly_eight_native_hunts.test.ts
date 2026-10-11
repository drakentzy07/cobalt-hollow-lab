/** P04: real ClaudeCraft game-level native dungeon registry + admission.
 * 8 bands LV21..99, no Hunter clone, no HP3, no artificial loot system.
 */
import {describe,it,expect} from 'vitest';
import {Sim} from '../src/sim/sim';
import {BUILTIN_WORLD,DUNGEONS,DUNGEON_LIST,MOBS} from '../src/sim/data';
import type {PlayerClass} from '../src/sim/types';
import {HIGHFLY_HUNT_SCENARIOS} from '../src/highfly/monsters/hunt_scenarios';
import {highflyMonsterId} from '../src/highfly/monsters/level99';
import {highflyNativeHuntDungeonId} from '../src/highfly/monsters/hunt_dungeon_registry';
import {admitHighflyNativeDungeonWave} from '../src/highfly/monsters/hunt_native_dungeon';

const classes:PlayerClass[]=['warrior','paladin','hunter','rogue','priest','shaman','mage','warlock','druid'];
const make=(cls:PlayerClass,level:number)=>{
  const sim=new Sim({seed:15192+level,playerClass:cls,noPlayer:true,world:{...BUILTIN_WORLD,camps:[]},
    compulsoryTutorial:false,riftPortals:false});
  const pid=sim.addPlayer(cls,'HighflyP04'+cls,{tutorialGreetingSent:true});
  sim.setPlayerLevel(level,pid); // TEST-ONLY fixture, NEVER UI entrance
  return {sim,pid};
};
describe('V4-03 P04: opt-in 8 donor dungeons / one persisting Hunter',()=>{
  it('all 8 registered as distinct original Sim instance indexes; zero donor overwrite',()=>{
    expect(HIGHFLY_HUNT_SCENARIOS).toHaveLength(8);
    const indexes=new Set<number>();
    for(const s of HIGHFLY_HUNT_SCENARIOS){
      const d=DUNGEONS[highflyNativeHuntDungeonId(s.id)];
      expect(d).toBeDefined();
      expect(d.id).toMatch(/^hf_dungeon_hf_hunt_/);
      expect(d.overworldDoor).toBe(false);
      expect(d.guideVisible).toBe(false);
      expect(d.spawns).toEqual([]);
      expect(indexes.has(d.index)).toBe(false);
      indexes.add(d.index);
      expect(DUNGEON_LIST).toContain(d);
      expect(MOBS[highflyMonsterId(s.families[0],s.minLevel)]?.minLevel).toBe(s.minLevel);
    }
    expect(DUNGEONS.hollow_crypt?.index).toBe(0);
  });
  for(const scenario of HIGHFLY_HUNT_SCENARIOS){
    it('LV'+scenario.minLevel+'–'+scenario.maxLevel+' true Sim entry, 4 native HF mobs, correct return',()=>{
      const {sim,pid}=make('warrior',scenario.minLevel);
      const player=sim.entities.get(pid)!;
      const native=sim.serializeCharacter(pid)!;
      const hp=player.maxHp;
      const id=highflyNativeHuntDungeonId(scenario.id);
      expect(sim.enterDungeon(id,pid)).toBe(true);
      const wave=admitHighflyNativeDungeonWave(sim,pid,{
        scenarioId:scenario.id,dungeonId:id,level:scenario.minLevel+1,
        mobIds:scenario.families.map(f=>highflyMonsterId(f,scenario.minLevel)),
      });
      expect(wave.ok).toBe(true);
      if(!wave.ok)throw Error(wave.reason);
      expect(wave.spawnedIds).toHaveLength(4);
      expect(player.maxHp).toBe(hp);
      expect([...sim.entities.values()].filter(x=>x.kind==='player')).toHaveLength(1);
      const claim=sim.instances.find(x=>x.dungeonId===id&&x.enteredBy.has(pid));
      expect(claim).toBeDefined();
      for(const eid of wave.spawnedIds){
        expect(claim?.mobIds).toContain(eid);
        expect(sim.entities.get(eid)?.dungeonId).toBe(id);
        expect(sim.entities.get(eid)?.level).toBe(scenario.minLevel+1);
      }
      expect(sim.leaveDungeon(pid)).toBe(true);
      const state=sim.serializeCharacter(pid)!;
      expect(state.inventory).toEqual(native.inventory);
      expect(state.copper).toBe(native.copper);
      expect(state.xp).toBe(native.xp);
      expect(state.level).toBe(native.level);
      console.info('V403_P04_ENTRY_CLAIM_EXIT_GREEN='+scenario.id);
    });
  }
  it('first real dungeon denies underlevel before any wave admission; no free power',()=>{
    const s=HIGHFLY_HUNT_SCENARIOS[0];
    const {sim,pid}=make('warrior',1);
    const hp=sim.player.maxHp;
    const dungeonId=highflyNativeHuntDungeonId(s.id);
    // Native Sim doesn't know HIGHFLY rank; UI admission MUST gate access.
    // Ensure the wave refuses even if a malicious call enters the instance.
    expect(sim.enterDungeon(dungeonId,pid)).toBe(true);
    const admission=admitHighflyNativeDungeonWave(sim,pid,{
      scenarioId:s.id,dungeonId,level:21,mobIds:[highflyMonsterId(s.families[0],21)],
    });
    expect(admission).toEqual({ok:false,reason:'LEVEL_OR_SCENARIO_NOT_AUTHORIZED'});
    expect(sim.player.maxHp).toBe(hp);
  });
  for(const cls of classes){
    it('9-class native P04 admission never clones '+cls,()=>{
      const s=HIGHFLY_HUNT_SCENARIOS[0];
      const {sim,pid}=make(cls,21);
      const original=sim.entities.get(pid),meta=sim.players.get(pid);
      const id=highflyNativeHuntDungeonId(s.id);
      expect(sim.enterDungeon(id,pid)).toBe(true);
      const wave=admitHighflyNativeDungeonWave(sim,pid,{
        scenarioId:s.id,dungeonId:id,level:21,mobIds:[highflyMonsterId('wolf',21)],
      });
      expect(wave.ok).toBe(true);
      expect(sim.entities.get(pid)).toBe(original);
      expect(sim.players.get(pid)).toBe(meta);
      expect([...sim.entities.values()].filter(x=>x.kind==='player')).toHaveLength(1);
      expect(sim.leaveDungeon(pid)).toBe(true);
    });
  }
});
