/** V4-03 P01 — REAL donor Sim lifecycle, original Hunter identity, real
 * native save/restore. This first gate explicitly does NOT certify kill/loot
 * or phone UX; those require production host wiring plus longer playtests.
 */
import { describe,it,expect } from 'vitest';
import { Sim } from '../src/sim/sim';
import { BUILTIN_WORLD,MOBS,ZONES,setActiveWorldContent } from '../src/sim/data';
import type { PlayerClass,WorldContent } from '../src/sim/types';
import { HIGHFLY_HUNT_SCENARIOS } from '../src/highfly/monsters/hunt_scenarios';
import { highflyMonsterId } from '../src/highfly/monsters/level99';
import { HighflyPersistentHuntBridge } from '../src/highfly/monsters/hunt_persistent';

const classes:PlayerClass[]=['warrior','paladin','hunter','rogue','priest','shaman','mage','warlock','druid'];
const prototype=HIGHFLY_HUNT_SCENARIOS[0];
const baseZ=Math.max(...ZONES.map(z=>z.zMax))+500;
const zoneId='hf_hunt_woods_21_proto';
const origin={x:28,z:baseZ+70};
const protoZone={
  ...ZONES[0],id:zoneId,biome:prototype.biome,
  xMin:-170,xMax:170,zMin:baseZ,zMax:baseZ+210,
  levelRange:[21,29] as [number,number],
  hub:{x:0,z:baseZ+34,radius:12,name:'P01 Test-only Hunter camp'},
  graveyard:{x:0,z:baseZ+37},
  lakes:[],pois:[],worldPvp:'sanctuary' as const,
  riftPortalEligible:false,
};
const hfMobId=highflyMonsterId('wolf',21);
const originalCampCount=BUILTIN_WORLD.camps.length;
function makeWorld():WorldContent{
  // A test-only zone, no public map, portal or renderer claim.
  return {...BUILTIN_WORLD,zones:[...BUILTIN_WORLD.zones,protoZone],
    // One verified native donor camp + one real registered HF camp, not 714
    // unrelated mobs that would only slow this Sim consistency test.
    camps:[BUILTIN_WORLD.camps[0],{
      mobId:hfMobId,center:{x:31,z:baseZ+110},radius:4,count:1,offStream:true,
    }],
    terrainEdits:[...(BUILTIN_WORLD.terrainEdits??[]),{
      x:0,z:baseZ+104,radius:180,delta:8,falloff:'flat' as const,mode:'level' as const,
    }],
  };
}
describe('V4-03 P01: original Sim authoritative Hunter transition',()=>{
  it('rejects invalid/uninstalled content, level spoofing and double admission',()=>{
    expect(MOBS[hfMobId]).toBeDefined();
    const world=makeWorld();setActiveWorldContent(world);
    try{
      const sim=new Sim({seed:320091,playerClass:'warrior',playerName:'PersistentHunter',world,
        compulsoryTutorial:false,riftPortals:false});
      const pid=sim.playerId;
      const bridge=new HighflyPersistentHuntBridge(sim,[{
        scenarioId:prototype.id,zoneId,minLevel:21,maxLevel:29,arrival:origin,
      }]);
      expect(bridge.enter(pid,prototype.id)).toEqual({ok:false,reason:'LEVEL_LOCKED'});
      sim.setPlayerLevel(21,pid); // fixture ONLY; never an entry mechanic
      expect(bridge.enter(pid,'no-authorization')).toEqual({ok:false,reason:'UNKNOWN_SCENARIO'});
      const beforePlayer=sim.entities.get(pid),beforeMeta=sim.players.get(pid);
      const beforeMaxHp=beforePlayer?.maxHp;
      expect(bridge.enter(pid,prototype.id).ok).toBe(true);
      expect(bridge.enter(pid,prototype.id)).toEqual({ok:false,reason:'ALREADY_VISITING'});
      expect(sim.entities.get(pid)).toBe(beforePlayer);
      expect(sim.players.get(pid)).toBe(beforeMeta);
      expect(sim.entities.get(pid)?.maxHp).toBe(beforeMaxHp);
      expect([...sim.entities.values()].filter(e=>e.kind==='player')).toHaveLength(1);
      expect(bridge.isVisiting(pid)).toBe(true);
      expect(bridge.getActiveScenario(pid)).toBe(prototype.id);
      expect(bridge.exit(pid).ok).toBe(true);
      expect(bridge.isVisiting(pid)).toBe(false);
      expect(bridge.exit(pid)).toEqual({ok:false,reason:'NO_ACTIVE_VISIT'});
    }finally{setActiveWorldContent(null);}
    expect(BUILTIN_WORLD.camps).toHaveLength(originalCampCount);
  });

  for(const cls of classes){
    it('same Hunter/'+cls+' maintains native equipment, inventory/XP and safe exit-save across reload',()=>{
      const world=makeWorld();setActiveWorldContent(world);
      try{
        const sim=new Sim({seed:40931,playerClass:cls,playerName:'Hunter'+cls,
          world,compulsoryTutorial:false,riftPortals:false});
        const pid=sim.playerId;
        sim.setPlayerLevel(21,pid); // test setup, NEVER part of entrance
        const character=sim.entities.get(pid);
        expect(character).toBeDefined();
        if(!character)throw Error('missing hunter');
        const originalPosition={x:character.pos.x,z:character.pos.z};
        const nativeInventory=sim.serializeCharacter(pid)?.inventory;
        const realHp=character.maxHp;
        const meta=sim.players.get(pid);
        if(!meta)throw Error('missing native meta');
        const bridge=new HighflyPersistentHuntBridge(sim,[{
          scenarioId:prototype.id,zoneId,minLevel:21,maxLevel:29,arrival:origin,
        }]);
        expect(bridge.enter(pid,prototype.id).ok).toBe(true);
        expect(character.maxHp).toBe(realHp); // no +3x LAB HP
        expect(sim.serializeCharacter(pid)?.pos.z).not.toBe(originalPosition.z);
        const whileInside=bridge.safeCharacterForSave(pid);
        expect(whileInside?.pos).toEqual(originalPosition);
        expect(whileInside?.inventory).toEqual(nativeInventory);
        expect(whileInside?.level).toBe(21);
        expect(bridge.exit(pid).ok).toBe(true);
        expect(bridge.safeCharacterForSave(pid)?.pos.x).toBe(originalPosition.x);
        // Full host reload necessarily creates a new Sim, NOT a second
        // active Hunter during one instance visit.
        const saved=bridge.safeCharacterForSave(pid);
        expect(saved).not.toBeNull();
        const loaded=new Sim({seed:40931,playerClass:cls,noPlayer:true,world,
          compulsoryTutorial:false,riftPortals:false});
        const loadedPid=loaded.addPlayer(cls,'Hunter'+cls,{
          state:saved!,tutorialGreetingSent:true,
        });
        const restored=loaded.serializeCharacter(loadedPid);
        expect(restored?.level).toBe(saved?.level);
        expect(restored?.xp).toBe(saved?.xp);
        expect(restored?.inventory).toEqual(saved?.inventory);
        expect(restored?.copper).toBe(saved?.copper);
        expect(restored?.gatheringProficiency).toEqual(saved?.gatheringProficiency);
        expect(loaded.entities.get(loadedPid)?.maxHp).toBeGreaterThan(0);
        expect([...loaded.entities.values()].filter(e=>e.kind==='player')).toHaveLength(1);
      }finally{setActiveWorldContent(null);}
    });
  }
  it('never claims P01 has real player-mob kill, loot-roll or physical Android proof',()=>{
    expect(prototype.minLevel).toBe(21);
    expect(prototype.populationBudget).toBe(8);
    expect(BUILTIN_WORLD.zones.some(z=>z.id===zoneId)).toBe(false);
  });
});
