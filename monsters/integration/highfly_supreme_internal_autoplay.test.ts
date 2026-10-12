/** HIGHFLY SUPREME — internal 9-character NORMAL 1-99 compatibility autoplayer.
 * This is an INTERNAL regression test, never a second game or a public LAB.
 * Uses one genuine donor Sim per class; original XP award method at each level,
 * real instances, mob attacks, corpse loot, and an offline save/relog.
 * ACCELERATION: explicitly grants XP thresholds instead of earning every point
 * through thousands of naturally timed combats; uses HP=1 on sampled targets.
 * Thus success certifies cross-system wiring, NOT complete natural economy,
 * combat difficulty, controller usability, navigation time, or S23 performance.
 */
import {describe,it,expect} from 'vitest';
import {Sim} from '../src/sim/sim';
import {createMob} from '../src/sim/entity';
import {meleeSwing} from '../src/sim/combat/auto_attack';
import {BUILTIN_WORLD,DUNGEONS,MOBS} from '../src/sim/data';
import {MAX_LEVEL,xpForLevel,type PlayerClass} from '../src/sim/types';
import {HIGHFLY_HUNT_SCENARIOS} from '../src/highfly/monsters/hunt_scenarios';
import {highflyNativeHuntDungeonId} from '../src/highfly/monsters/hunt_dungeon_registry';
import {HIGHFLY_PF6_EXTENDED_ENABLED} from '../src/highfly/training/pf6_xp_curve';

const CLASSES:PlayerClass[]=['warrior','paladin','hunter','rogue','priest',
  'shaman','mage','warlock','druid'];
const WORLD={...BUILTIN_WORLD,camps:[]};
type Gate={cls:PlayerClass;level:number;scenario:string;door:boolean;
  mob:string;nativeAttack:boolean;nativeCorpse:boolean;oneHunter:boolean};
type ClassResult={cls:PlayerClass;level:number;xpGrants:number;dungeons:number;
  mobKills:number;trainUnchanged:boolean;postCapStable:boolean;
  savedAndRestored:boolean;errors:string[]};
function oneHunter(sim:Sim):boolean {
  return [...sim.entities.values()].filter(x=>x.kind==='player').length===1;
}
function trainingOf(state:unknown):unknown {
  return JSON.parse(JSON.stringify(state??{})).trainingProfile;
}
function stage(sim:Sim,pid:number,cls:PlayerClass,idx:number):Gate {
  const sc=HIGHFLY_HUNT_SCENARIOS[idx];
  const actor=sim.entities.get(pid)!;
  const dungeon=DUNGEONS[highflyNativeHuntDungeonId(sc.id)];
  expect(dungeon,'MISSING_INSTANCE_'+sc.id).toBeDefined();
  expect(actor.level,'UNDERLEVEL_'+sc.id).toBeGreaterThanOrEqual(sc.minLevel);
  const door=sim.enterDungeon(dungeon.id,pid);
  expect(door,'DUNGEON_INACCESSIBLE_'+sc.id+'_'+cls).toBe(true);
  const instance=sim.instances.find(i=>i.dungeonId===dungeon.id&&i.enteredBy.has(pid));
  expect(instance?.mobIds,'NO_8_NATIVE_SPAWNS_'+sc.id).toHaveLength(8);
  const normal=dungeon.spawns.find(sp=>{
    const def=MOBS[sp.mobId];return def&&!def.elite&&!def.boss&&!def.worldBoss;
  });
  expect(normal,'MISSING_NORMAL_MOB_'+sc.id).toBeDefined();
  expect(sim.leaveDungeon(pid),'CANNOT_LEAVE_'+sc.id).toBe(true);
  const def=MOBS[normal!.mobId];
  const mob=createMob(sim.nextId++,def,Math.min(actor.level,sc.maxLevel),{
    x:actor.pos.x+1,y:actor.pos.y,z:actor.pos.z+1});
  // Acceleration fixture only: tests authentic hit/kill/XP/loot plumbing,
  // NOT native time-to-kill, mob survival or 1v1 combat balance.
  mob.hp=1;
  mob.hostile=true;
  sim.addEntity(mob);
  actor.facing=Math.atan2(mob.pos.x-actor.pos.x,mob.pos.z-actor.pos.z);
  for(let i=0;i<120&&!mob.dead;i++)
    meleeSwing(sim.ctx,actor,mob,0,null,{});
  const nativeAttack=mob.dead;
  const nativeCorpse=mob.lootable&&sim.lootCorpse(mob.id,pid);
  return {cls,level:actor.level,scenario:sc.id,door,mob:def.id,
    nativeAttack,nativeCorpse,oneHunter:oneHunter(sim)};
}

describe('HIGHFLY SUPREME INTERNAL AUTOPLAY: 9 classes x 1-99, no deploy',()=>{
  it('runs 9 real Hunters through 98 XP transitions and 8 native instances each',()=>{
    expect(MAX_LEVEL).toBe(99);
    expect(HIGHFLY_PF6_EXTENDED_ENABLED).toBe(false);
    expect(CLASSES).toHaveLength(9);
    expect(HIGHFLY_HUNT_SCENARIOS).toHaveLength(8);
    const gates:Gate[]=[],characters:ClassResult[]=[];
    for(const [index,cls] of CLASSES.entries()){
      const result:ClassResult={cls,level:1,xpGrants:0,dungeons:0,mobKills:0,
        trainUnchanged:false,postCapStable:false,savedAndRestored:false,
        errors:[]};
      characters.push(result);
      try{
        const sim=new Sim({seed:20261012+index*8191,playerClass:cls,
          noPlayer:true,autoEquip:false,world:WORLD,
          compulsoryTutorial:false,riftPortals:false});
        const pid=sim.addPlayer(cls,'HF_INTERNAL_AUTOPLAY_'+cls,
          {tutorialGreetingSent:true});
        const actor=sim.entities.get(pid)!;
        const meta=sim.players.get(pid)!;
        const originalProfile=JSON.stringify(trainingOf(sim.serializeCharacter(pid)));
        expect(actor.level).toBe(1);
        expect(oneHunter(sim)).toBe(true);
        let nextStage=0;
        // Sim advances using the ORIGINAL xp grant -> level-up -> ability ->
        // class-stat recompute pipeline. XP threshold amounts are CI fixtures;
        // they do NOT claim these XP were collected from actual adventures.
        for(let safety=0;actor.level<99&&safety<120;safety++){
          while(nextStage<HIGHFLY_HUNT_SCENARIOS.length&&
              actor.level>=HIGHFLY_HUNT_SCENARIOS[nextStage].minLevel){
            const evidence=stage(sim,pid,cls,nextStage++);
            gates.push(evidence);
            result.dungeons++;
            if(evidence.nativeAttack&&evidence.nativeCorpse)result.mobKills++;
            expect(evidence.nativeAttack,'ATTACK_FAILED_'+cls+'_'+evidence.scenario).toBe(true);
            expect(evidence.nativeCorpse,'CORPSE_FAILED_'+cls+'_'+evidence.scenario).toBe(true);
            expect(evidence.oneHunter).toBe(true);
          }
          const before=actor.level;
          const needed=Math.max(1,xpForLevel(actor.level)-meta.xp);
          sim.grantXp(needed,meta);
          result.xpGrants++;
          expect(actor.level,'XP_DID_NOT_ADVANCE_'+cls+'_'+before).toBeGreaterThan(before);
          expect(actor.level).toBeLessThanOrEqual(99);
          expect(meta.known.length,'NO_KNOWN_ABILITIES_'+cls).toBeGreaterThan(0);
        }
        // Last stage can become eligible upon the final transition.
        while(nextStage<HIGHFLY_HUNT_SCENARIOS.length&&
            actor.level>=HIGHFLY_HUNT_SCENARIOS[nextStage].minLevel){
          const evidence=stage(sim,pid,cls,nextStage++);
          gates.push(evidence);result.dungeons++;
          if(evidence.nativeAttack&&evidence.nativeCorpse)result.mobKills++;
          expect(evidence.nativeAttack).toBe(true);
          expect(evidence.nativeCorpse).toBe(true);
          expect(evidence.oneHunter).toBe(true);
        }
        result.level=actor.level;
        expect(result.level).toBe(99);
        expect(result.dungeons).toBe(8);
        result.trainUnchanged=JSON.stringify(
          trainingOf(sim.serializeCharacter(pid)))===originalProfile;
        const before=meta.lifetimeXp;
        sim.grantXp(1000,meta); // Native original LV99 lifetime XP/cosmetic path
        result.postCapStable=actor.level===99&&meta.lifetimeXp>=before+1000;
        const saved=JSON.parse(JSON.stringify(sim.serializeCharacter(pid)));
        const reloaded=new Sim({seed:20269999+index,playerClass:cls,noPlayer:true,
          autoEquip:false,world:WORLD,compulsoryTutorial:false,riftPortals:false});
        const rid=reloaded.addPlayer(cls,'HF_INTERNAL_AUTOPLAY_'+cls,
          {state:saved,tutorialGreetingSent:true});
        const loaded=reloaded.serializeCharacter(rid);
        result.savedAndRestored=loaded?.level===99&&oneHunter(reloaded)&&
          JSON.stringify(trainingOf(loaded))===originalProfile&&
          loaded?.lifetimeXp===saved.lifetimeXp;
        expect(result.trainUnchanged).toBe(true);
        expect(result.postCapStable).toBe(true);
        expect(result.savedAndRestored).toBe(true);
      }catch(error){
        result.errors.push(String(error instanceof Error?error.message:error));
      }
    }
    const reds=characters.filter(c=>c.errors.length>0||
      c.level!==99||c.dungeons!==8||c.mobKills!==8||
      !c.trainUnchanged||!c.postCapStable||!c.savedAndRestored);
    const summary={test:'INTERNAL_9_CLASSES_NORMAL_1_99_COMPRESSED',
      acceleration:'native-XP-threshold-fixtures + 1HP-native-corpse combat; NOT NATURAL FULL PLAYTHROUGH',
      noMainOrPagesChanges:true,productionBalanceUntouched:true,
      certified:'XP LEVEL-UP + CLASS ABILITIES + EIGHT INSTANCES + BASIC NATIVE KILL/LOOT + CAP + OFFLINE SAVE',
      notCertified:'NATURAL XP PACE, GOLD, ALL MATERIALS, EVERY RECIPE, BOSS FAIRNESS, PATHFINDING, MOBILE HUD, PHYSICAL S23',
      classes:characters.length,checkpointGates:gates.length,
      expectedCheckpointGates:9*8,
      green:characters.length-reds.length,red:reds.length,
      yellow:'END-TO-END NATURAL XP + GEAR ECONOMY + PLAYER-PILOT COMBAT NOT YET RUN',
      characters,failedGates:gates.filter(g=>!g.door||!g.nativeAttack||
        !g.nativeCorpse||!g.oneHunter)};
    console.info('HIGHFLY_INTERNAL_NINE_CLASS_AUTOPLAY='+JSON.stringify(summary));
    expect(gates.length,'INCOMPLETE_9x8_STAGE_MATRIX').toBe(72);
    expect(reds,'REAL_CROSS_SYSTEM_INCOMPATIBILITIES').toEqual([]);
  },240000);
});
