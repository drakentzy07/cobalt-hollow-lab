/** HIGHFLY V4-03 P08 regression: 9 classes x 8 LIVE donor portal bands.
 * Native Sim and CharacterState only. setPlayerLevel is test fixture setup.
 * Proves entry / claim / exit / serialization; not navigation, balance or S23 hardware.
 */
import {describe,it,expect} from 'vitest';
import {Sim} from '../src/sim/sim';
import {BUILTIN_WORLD,CAMPS,DUNGEONS,MOBS,ZONES} from '../src/sim/data';
import {HIGHFLY_HUNT_SCENARIOS} from '../src/highfly/monsters/hunt_scenarios';
import {highflyNativeHuntDungeonId} from '../src/highfly/monsters/hunt_dungeon_registry';
import type {PlayerClass} from '../src/sim/types';

const classes:PlayerClass[]=['warrior','paladin','hunter','rogue','priest','shaman','mage','warlock','druid'];
const countPlayers=(sim:Sim)=>[...sim.entities.values()].filter(e=>e.kind==='player').length;

describe('HIGHFLY P08: real runtime regression / no second Hunter',()=>{
  it('retains the complete native map and budgeted habitat and door manifests',()=>{
    expect(BUILTIN_WORLD.zones).toHaveLength(ZONES.length);
    expect(BUILTIN_WORLD.camps).toHaveLength(CAMPS.length+16);
    const extra=BUILTIN_WORLD.camps.slice(CAMPS.length);
    expect(extra.every(c=>c.mobId.startsWith('hf_hunt_')&&c.offStream&&c.count===2)).toBe(true);
    expect(extra.reduce((n,c)=>n+c.count,0)).toBe(32);
    const sim=new Sim({seed:80301,playerClass:'warrior',noPlayer:true,
      world:{...BUILTIN_WORLD,camps:[]},compulsoryTutorial:false,riftPortals:false});
    for(let i=0;i<HIGHFLY_HUNT_SCENARIOS.length;i++){
      const s=HIGHFLY_HUNT_SCENARIOS[i],z=ZONES[i+3];
      const dungeon=DUNGEONS[highflyNativeHuntDungeonId(s.id)];
      expect(dungeon?.overworldDoor).toBe(true);
      expect(dungeon?.spawns).toHaveLength(8);
      expect(dungeon.doorPos.z).toBeGreaterThanOrEqual(z.zMin);
      expect(dungeon.doorPos.z).toBeLessThan(z.zMax);
      expect(Number.isFinite(sim.groundPos(dungeon.doorPos.x,dungeon.doorPos.z).y)).toBe(true);
      for(const c of extra.filter(x=>x.mobId.endsWith('_'+s.minLevel))){
        expect(Number.isFinite(sim.groundPos(c.center.x,c.center.z).y)).toBe(true);
        expect(Math.hypot(c.center.x-z.hub.x,c.center.z-z.hub.z)).toBeGreaterThan(z.hub.radius+38);
        expect(MOBS[c.mobId]?.loot.some(r=>typeof r.copper==='number'&&r.chance===1)).toBe(true);
      }
      expect(extra.filter(x=>x.mobId.endsWith('_'+s.minLevel))).toHaveLength(2);
      expect(BUILTIN_WORLD.zones[i+3].pois.filter(p=>p.id?.startsWith('hf_habitat_'+s.id+'_'))).toHaveLength(2);
    }
  });
  for(const cls of classes) for(const stage of HIGHFLY_HUNT_SCENARIOS){
    it(cls+' LV'+stage.minLevel+' native portal -> instance -> world -> JSON save/reload',()=>{
      const seed=80400+stage.minLevel+classes.indexOf(cls);
      // Camp removal belongs to the TEST fixture to keep the 72 cases lean;
      // dungeon spawns, WorldContent and the Hunter remain authentic.
      const world={...BUILTIN_WORLD,camps:[]};
      const sim=new Sim({seed,playerClass:cls,noPlayer:true,world,
        compulsoryTutorial:false,riftPortals:false});
      const pid=sim.addPlayer(cls,'P08'+cls,{tutorialGreetingSent:true});
      expect(sim.serializeCharacter(pid)?.level).toBe(1);
      expect(countPlayers(sim)).toBe(1);
      sim.setPlayerLevel(stage.minLevel,pid);
      const hunter=sim.entities.get(pid)!,meta=sim.players.get(pid)!;
      const health=hunter.maxHp;
      const id=highflyNativeHuntDungeonId(stage.id);
      expect(sim.enterDungeon(id,pid)).toBe(true);
      const slot=sim.instances.find(x=>x.dungeonId===id&&x.enteredBy.has(pid));
      expect(slot?.mobIds).toHaveLength(8);
      for(const entityId of slot?.mobIds??[]){
        const mob=sim.entities.get(entityId);
        expect(mob?.kind).toBe('mob');
        expect(mob?.templateId.startsWith('hf_hunt_')).toBe(true);
      }
      expect(sim.entities.get(pid)).toBe(hunter);
      expect(sim.players.get(pid)).toBe(meta);
      expect(hunter.maxHp).toBe(health);
      expect(countPlayers(sim)).toBe(1);
      expect(sim.leaveDungeon(pid)).toBe(true);
      const state=JSON.parse(JSON.stringify(sim.serializeCharacter(pid)));
      expect(state.level).toBe(stage.minLevel);
      const resumed=new Sim({seed,playerClass:cls,noPlayer:true,world,
        compulsoryTutorial:false,riftPortals:false});
      const newPid=resumed.addPlayer(cls,'P08'+cls,{state,tutorialGreetingSent:true});
      const after=resumed.serializeCharacter(newPid)!;
      expect(after.level).toBe(state.level);
      expect(after.xp).toBe(state.xp);
      expect(after.copper).toBe(state.copper);
      expect(after.inventory).toEqual(state.inventory);
      expect(after.equipment).toEqual(state.equipment);
      expect(after.gatheringProficiency).toEqual(state.gatheringProficiency);
      expect(countPlayers(resumed)).toBe(1);
    });
  }
});
