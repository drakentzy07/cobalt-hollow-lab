/** P02: One TRUE ClaudeCraft dungeon instance and registered HIGHFLY mob.
 * Neither an added Hunter nor parallel loot. No public runtime patch.
 */
import {describe,it,expect} from 'vitest';
import {Sim} from '../src/sim/sim';
import {BUILTIN_WORLD,MOBS} from '../src/sim/data';
import type {PlayerClass} from '../src/sim/types';
import {highflyMonsterId} from '../src/highfly/monsters/level99';
import {HIGHFLY_HUNT_SCENARIOS} from '../src/highfly/monsters/hunt_scenarios';
import {admitHighflyNativeDungeonWave} from '../src/highfly/monsters/hunt_native_dungeon';

const classes:PlayerClass[]=['warrior','paladin','hunter','rogue','priest','shaman','mage','warlock','druid'];
const scenario=HIGHFLY_HUNT_SCENARIOS[0];
const wolf=highflyMonsterId('wolf',21);
const spider=highflyMonsterId('spider',21);
const request={scenarioId:scenario.id,dungeonId:'hollow_crypt',level:21,mobIds:[wolf,spider]};

function mk(cls:PlayerClass){
  const sim=new Sim({seed:14091,playerClass:cls,noPlayer:true,
    world:{...BUILTIN_WORLD,camps:[]},riftPortals:false,compulsoryTutorial:false});
  const pid=sim.addPlayer(cls,'P02Native'+cls,{tutorialGreetingSent:true});
  sim.setPlayerLevel(21,pid); // TEST FIXTURE ONLY; no level change in game admission
  return {sim,pid};
}
describe('V4-03 P02 — donor native dungeon + HIGHFLY real mob',()=>{
  it('requires native entry, real lvl21 template and rejects duplicates',()=>{
    expect(MOBS[wolf]).toBeDefined();
    expect(MOBS[spider]).toBeDefined();
    const {sim,pid}=mk('warrior');
    expect(admitHighflyNativeDungeonWave(sim,pid,request))
      .toEqual({ok:false,reason:'NOT_INSIDE_NATIVE_INSTANCE'});
    expect(sim.enterDungeon('hollow_crypt',pid)).toBe(true);
    const result=admitHighflyNativeDungeonWave(sim,pid,request);
    expect(result.ok).toBe(true);
    if(!result.ok)throw Error(result.reason);
    expect(result.spawnedIds).toHaveLength(2);
    expect(new Set(result.spawnedIds).size).toBe(2);
    const inst=sim.instances.find(i=>i.dungeonId==='hollow_crypt'&&i.enteredBy.has(pid));
    expect(inst).toBeDefined();
    for(let i=0;i<result.spawnedIds.length;i++){
      const id=result.spawnedIds[i];
      const m=sim.entities.get(id);
      expect(m?.kind).toBe('mob');
      expect(m?.templateId).toBe(request.mobIds[i]);
      expect(m?.dungeonId).toBe('hollow_crypt');
      expect(inst?.mobIds).toContain(id);
    }
    expect(admitHighflyNativeDungeonWave(sim,pid,request))
      .toEqual({ok:false,reason:'WAVE_ALREADY_CLAIMED'});
    expect(sim.leaveDungeon(pid)).toBe(true);
  });

  for(const cls of classes){
    it('preserves same Hunter/Sim/HP/XP/bag under real dungeon entry for '+cls,()=>{
      const {sim,pid}=mk(cls);
      const p=sim.entities.get(pid);
      const meta=sim.players.get(pid);
      if(!p||!meta)throw Error('native player missing');
      const before=sim.serializeCharacter(pid);
      expect(before).not.toBeNull();
      const baseHp=p.maxHp;
      expect(sim.enterDungeon('hollow_crypt',pid)).toBe(true);
      const result=admitHighflyNativeDungeonWave(sim,pid,{
        ...request,mobIds:[wolf],
      });
      expect(result.ok).toBe(true);
      expect(sim.entities.get(pid)).toBe(p);
      expect(sim.players.get(pid)).toBe(meta);
      expect(p.maxHp).toBe(baseHp);
      expect([...sim.entities.values()].filter(e=>e.kind==='player')).toHaveLength(1);
      const whileInside=sim.serializeCharacter(pid);
      expect(whileInside?.level).toBe(21);
      expect(whileInside?.inventory).toEqual(before?.inventory);
      expect(whileInside?.xp).toBe(before?.xp);
      expect(sim.leaveDungeon(pid)).toBe(true);
      const after=sim.serializeCharacter(pid);
      expect(after?.level).toBe(before?.level);
      expect(after?.xp).toBe(before?.xp);
      expect(after?.copper).toBe(before?.copper);
      expect(after?.inventory).toEqual(before?.inventory);
      expect(after?.gatheringProficiency).toEqual(before?.gatheringProficiency);
    });
  }
});
