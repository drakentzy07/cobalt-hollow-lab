/** V4-03 P06 — REAL physical world portals + donor native 8 mob spawns.
 * Uses Sim.updateDoorTriggers tick, never menu travel or another Sim.
 * Original world LV1-20 and all nine classes remain untouched.
 */
import {describe,it,expect} from 'vitest';
import {Sim} from '../src/sim/sim';
import {BUILTIN_WORLD,DUNGEONS,DUNGEON_LIST,ZONES} from '../src/sim/data';
import type {PlayerClass} from '../src/sim/types';
import {HIGHFLY_HUNT_SCENARIOS} from '../src/highfly/monsters/hunt_scenarios';
import {highflyNativeHuntDungeonId,highflyPortalManifest}
  from '../src/highfly/monsters/hunt_dungeon_registry';

const classes:PlayerClass[]=['warrior','paladin','hunter','rogue','priest','shaman','mage','warlock','druid'];
const make=(cls:PlayerClass,level:number)=>{
  const sim=new Sim({seed:11091+level,playerClass:cls,noPlayer:true,
    world:{...BUILTIN_WORLD,camps:[]},compulsoryTutorial:false,riftPortals:false});
  const pid=sim.addPlayer(cls,'HF_P06_'+cls,{tutorialGreetingSent:true});
  sim.setPlayerLevel(level,pid); // fixture only; production never stamps a level.
  return {sim,pid};
};
describe('HIGHFLY P06 — eight physically walkable original-world native dungeon doors',()=>{
  it('all original world zones and donor dungeons remain intact',()=>{
    expect(DUNGEONS.hollow_crypt.index).toBe(0);
    expect(BUILTIN_WORLD.zones).toBe(ZONES);
    expect(ZONES).toHaveLength(15);
    const newDungeons=HIGHFLY_HUNT_SCENARIOS.map(s=>DUNGEONS[highflyNativeHuntDungeonId(s.id)]);
    expect(newDungeons).toHaveLength(8);
    expect(new Set(newDungeons.map(x=>x.index)).size).toBe(8);
    expect(newDungeons.every(d=>d.overworldDoor===true&&d.spawns.length===8)).toBe(true);
    const portals=highflyPortalManifest(DUNGEONS,ZONES);
    expect(portals).toHaveLength(8);
    expect(new Set(portals.map(x=>x.zoneId)).size).toBe(8);
    for(let i=0;i<8;i++){
      const zone=ZONES[i+3],d=newDungeons[i],s=HIGHFLY_HUNT_SCENARIOS[i];
      expect(DUNGEON_LIST).toContain(d);
      expect(portals[i].minLevel).toBe(s.minLevel);
      expect(portals[i].worldZ).toBeGreaterThanOrEqual(zone.zMin);
      expect(portals[i].worldZ).toBeLessThan(zone.zMax);
      expect(portals[i].worldX).toBeGreaterThanOrEqual((zone.xMin??-180)+20);
      expect(portals[i].worldX).toBeLessThanOrEqual((zone.xMax??180)-20);
      expect(d.spawns.every(x=>x.mobId.startsWith('hf_hunt_'))).toBe(true);
      expect(new Set(d.spawns.map(x=>x.mobId)).size).toBe(4);
    }
  });
  for(const s of HIGHFLY_HUNT_SCENARIOS){
    it(s.id+': real world portal physically entered; level locked; eight native mobs and clean return',()=>{
      const d=DUNGEONS[highflyNativeHuntDungeonId(s.id)];
      const {sim,pid}=make('warrior',Math.max(1,s.minLevel-1));
      const hunter=sim.entities.get(pid)!;
      const meta=sim.players.get(pid)!;
      expect(sim.enterDungeon(d.id,pid)).toBe(false); // backend-level gate, not mere button.
      expect([...sim.entities.values()].filter(x=>x.kind==='player')).toHaveLength(1);
      sim.setPlayerLevel(s.minLevel,pid);
      const hp=hunter.maxHp;
      const door=[...sim.entities.values()].find(e=>e.templateId==='dungeon_door'&&e.dungeonId===d.id);
      expect(door).toBeDefined();
      if(!door)throw Error('P06 native door not spawned');
      expect(door.pos.x).toBeCloseTo(d.doorPos.x,4);
      expect(door.pos.z).toBeCloseTo(d.doorPos.z,4);
      // Test-only approach fixture at the physical entrance: from here ON,
      // the actual Sim.tick/updateDoorTriggers auto-enters the dungeon.
      hunter.pos=sim.groundPos(door.pos.x,door.pos.z);
      hunter.prevPos={...hunter.pos};
      sim.rebucket(hunter);
      for(let i=0;i<10;i++){
        sim.tick();
        if(sim.instances.some(inst=>inst.dungeonId===d.id&&inst.enteredBy.has(pid)))break;
      }
      const claim=sim.instances.find(inst=>inst.dungeonId===d.id&&inst.enteredBy.has(pid));
      expect(claim).toBeDefined();
      expect(claim?.mobIds).toHaveLength(8);
      for(const id of claim?.mobIds??[]){
        const enemy=sim.entities.get(id);
        expect(enemy?.kind).toBe('mob');
        expect(enemy?.templateId.startsWith('hf_hunt_')).toBe(true);
        expect(enemy?.level).toBeGreaterThanOrEqual(s.minLevel);
        expect(enemy?.level).toBeLessThanOrEqual(s.maxLevel);
      }
      expect(sim.entities.get(pid)).toBe(hunter);
      expect(sim.players.get(pid)).toBe(meta);
      expect(hunter.maxHp).toBe(hp);
      expect(sim.leaveDungeon(pid)).toBe(true);
      expect([...sim.entities.values()].filter(x=>x.kind==='player')).toHaveLength(1);
      const save=sim.serializeCharacter(pid)!;
      expect(save.level).toBe(s.minLevel);
      expect(save.pos.x).toBeCloseTo(d.doorPos.x,0);
      expect(save.pos.z).toBeCloseTo(d.doorPos.z-4,0);
      console.info('V403_P06_PORTAL_NATIVE_PASS='+JSON.stringify({
        stage:s.id,zone:ZONES[HIGHFLY_HUNT_SCENARIOS.indexOf(s)+3].name,
        doorX:d.doorPos.x,doorZ:d.doorPos.z,
        spawned:claim?.mobIds.length??0,oneHunter:true,return:true}));
    });
  }
  for(const cls of classes){
    it(cls+': keeps the SAME native Hunter through portal and native instance',()=>{
      const s=HIGHFLY_HUNT_SCENARIOS[0],d=DUNGEONS[highflyNativeHuntDungeonId(s.id)];
      const {sim,pid}=make(cls,21),hunter=sim.entities.get(pid),meta=sim.players.get(pid);
      expect(sim.enterDungeon(d.id,pid)).toBe(true);
      expect(sim.entities.get(pid)).toBe(hunter);
      expect(sim.players.get(pid)).toBe(meta);
      const claim=sim.instances.find(x=>x.dungeonId===d.id&&x.enteredBy.has(pid));
      expect(claim?.mobIds).toHaveLength(8);
      expect(sim.leaveDungeon(pid)).toBe(true);
    });
  }
});
