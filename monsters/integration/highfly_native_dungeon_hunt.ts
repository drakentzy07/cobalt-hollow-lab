/** HIGHFLY V4-03 P02 — Native dungeon monster admission (internal prototype).
 * USES donor Sim ENTER/EXIT, real instance ownership and original mob templates.
 * Does not create a second player, world, loot engine or XP system.
 * This is never called on public Pages until dungeon art/rules and human QA pass.
 */
import type { Sim, InstanceSlot } from '../../sim/sim';
import { createMob } from '../../sim/entity';
import { DUNGEONS, MOBS, instanceOrigin } from '../../sim/data';
import { HIGHFLY_HUNT_SCENARIOS } from './hunt_scenarios';

export interface HighflyNativeHuntAdmission {
  readonly scenarioId:string;
  readonly dungeonId:string;
  readonly level:number;
  readonly mobIds:readonly string[];
}
export type HighflyWaveResult =
  | {ok:true; spawnedIds:readonly number[]; playerId:number}
  | {ok:false; reason:string};

/** Weakly bound to ONE Sim. Claim once per live native dungeon instance.
 * No entries are persisted: leaving/relogin uses the donor's own dungeon reset.
 */
const emitted = new WeakMap<Sim, WeakSet<InstanceSlot>>();

export function admitHighflyNativeDungeonWave(
  sim:Sim, pid:number, req:HighflyNativeHuntAdmission,
):HighflyWaveResult {
  const p=sim.entities.get(pid),meta=sim.players.get(pid);
  if(!p||p.kind!=='player'||!meta||p.dead||p.ghost)
    return {ok:false,reason:'NO_LIVING_NATIVE_HUNTER'};
  const scenario=HIGHFLY_HUNT_SCENARIOS.find(s=>s.id===req.scenarioId);
  if(!scenario||req.level<scenario.minLevel||req.level>scenario.maxLevel||
     !Number.isInteger(req.level)||p.level<scenario.minLevel||p.level>99)
    return {ok:false,reason:'LEVEL_OR_SCENARIO_NOT_AUTHORIZED'};
  const dungeon=DUNGEONS[req.dungeonId];
  // P02 only certifies existing native donor interiors. Not a world gate.
  if(!dungeon||dungeon.id!==req.dungeonId)
    return {ok:false,reason:'DUNGEON_NOT_NATIVE'};
  if(!req.mobIds.length||req.mobIds.length>scenario.populationBudget)
    return {ok:false,reason:'POPULATION_BUDGET'};
  const unique=new Set(req.mobIds);
  if(unique.size!==req.mobIds.length)
    return {ok:false,reason:'DUPLICATE_TEMPLATE'};
  for(const id of unique){
    const template=MOBS[id];
    if(!template || !id.startsWith('hf_hunt_') ||
       template.minLevel!==scenario.minLevel ||
       template.maxLevel!==scenario.maxLevel ||
       template.dummy||template.ambient||template.boss)
      return {ok:false,reason:'NON_NATIVE_HF_TEMPLATE'};
  }
  // Claim is made ONLY by sim.enterDungeon / native portal, with a real pid.
  const inst=sim.instances.find(slot=>{
    if(slot.dungeonId!==req.dungeonId||slot.partyKey===null||
       !slot.enteredBy.has(pid))return false;
    const o=instanceOrigin(dungeon.index,slot.slot);
    return Math.abs(p.pos.x-o.x)<100&&Math.abs(p.pos.z-o.z)<220;
  });
  if(!inst)return {ok:false,reason:'NOT_INSIDE_NATIVE_INSTANCE'};
  let seen=emitted.get(sim);
  if(!seen){seen=new WeakSet();emitted.set(sim,seen);}
  if(seen.has(inst))return {ok:false,reason:'WAVE_ALREADY_CLAIMED'};
  // Guard against any native room already hosting HF enemies (including
  // a previous attempt whose session-local receipt was lost).
  if(inst.mobIds.some(id=>sim.entities.get(id)?.templateId.startsWith('hf_hunt_')))
    return {ok:false,reason:'HF_WAVE_ALREADY_REGISTERED'};
  const o=instanceOrigin(dungeon.index,inst.slot);
  const claimedIds:number[]=[];
  for(let i=0;i<req.mobIds.length;i++){
    const template=MOBS[req.mobIds[i]];
    // Keep a compact authored corridor pack. The chosen dungeon has to pass
    // physical navigation/placement before a production activation.
    const x=o.x+(i%2===0?-4:4),z=o.z+20+Math.floor(i/2)*12;
    const pos=sim.groundPos(x,z);
    if(!Number.isFinite(pos.y))
      throw Error('HF_V403_DUNGEON_BAD_GROUND');
    const mob=createMob(sim.nextId++,template,req.level,pos);
    mob.dungeonId=req.dungeonId;
    sim.addEntity(mob);
    inst.mobIds.push(mob.id); // donor instance owns cleanup/respawn
    claimedIds.push(mob.id);
  }
  seen.add(inst);
  return {ok:true,spawnedIds:claimedIds,playerId:pid};
}
