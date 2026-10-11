/** HIGHFLY V4-03 P01 — same-Sim, same-Hunter travel coordinator.
 * This is NOT the old HuntPilot. No new Sim, no level stamp, no HP multiplier,
 * no currency/item/XP award. The native Sim remains the sole authority.
 *
 * Deliberately NOT wired into public menus: encounter world/terrain and
 * persistent host save admission must independently pass P02 and S23 gates.
 */
import type { Sim } from '../../sim/sim';
import type { CharacterState } from '../../sim/character_state';

export interface HighflyHuntDoor {
  readonly scenarioId: string;
  readonly zoneId: string;
  readonly minLevel: number;
  readonly maxLevel: number;
  readonly arrival: Readonly<{x:number;z:number}>;
}
interface ActiveVisit {
  readonly sim: Sim;
  readonly pid: number;
  readonly scenarioId: string;
  readonly source: {x:number;z:number};
  readonly player: object;
}
export type HuntAdmit =
  | {ok:true;scenarioId:string}
  | {ok:false;reason:string};
export const HIGHFLY_V403_TRAVEL_REVISION = 1;

/** Per-host adapter; NEVER a cross-player global. One instance per game host,
 * and each character gets at most one active trip at a time.
 */
export class HighflyPersistentHuntBridge {
  private readonly active = new Map<number, ActiveVisit>();
  private readonly seenLoot = new Map<number,Set<number>>();
  constructor(private readonly sim: Sim, private readonly doors: readonly HighflyHuntDoor[]) {
    if(new Set(doors.map(d=>d.scenarioId)).size!==doors.length)throw Error('HF_V403_DUPLICATE_DOOR');
    for(const door of doors){
      if(!door.scenarioId.startsWith('hf_hunt_') ||
         !door.zoneId.startsWith('hf_hunt_') ||
         !Number.isInteger(door.minLevel) || !Number.isInteger(door.maxLevel) ||
         door.minLevel<21 || door.maxLevel>99 || door.maxLevel<door.minLevel ||
         !Number.isFinite(door.arrival.x) || !Number.isFinite(door.arrival.z))
        throw Error('HF_V403_INVALID_DOOR');
    }
  }

  enter(pid:number,scenarioId:string):HuntAdmit {
    const p=this.sim.entities.get(pid),m=this.sim.players.get(pid);
    if(!p||p.kind!=='player'||!m)return {ok:false,reason:'NO_REAL_PLAYER'};
    if(p.dead||p.ghost)return {ok:false,reason:'PLAYER_DEAD'};
    if(this.active.has(pid))return {ok:false,reason:'ALREADY_VISITING'};
    const door=this.doors.find(x=>x.scenarioId===scenarioId);
    if(!door)return {ok:false,reason:'UNKNOWN_SCENARIO'};
    if(p.level<door.minLevel||p.level>99)return {ok:false,reason:'LEVEL_LOCKED'};
    // Native content must already be registered when constructing THIS Sim.
    // Refuse a data-only LAB id if no live zone and camp coexist in world cfg.
    const world=this.sim.cfg.world;
    const zone=world?.zones.find(z=>z.id===door.zoneId);
    if(!zone || zone.levelRange[0]!==door.minLevel ||
       zone.levelRange[1]!==door.maxLevel ||
       door.arrival.x<(zone.xMin??-180) ||
       door.arrival.x>(zone.xMax??180) ||
       door.arrival.z<zone.zMin || door.arrival.z>=zone.zMax ||
       !world!.camps.some(c=>c.mobId.startsWith('hf_')&&
          c.center.x>=(zone.xMin??-180)&&c.center.x<=(zone.xMax??180)&&
          c.center.z>=zone.zMin&&c.center.z<zone.zMax))
      return {ok:false,reason:'SCENARIO_NOT_INSTALLED'};
    // Dead-simple and self-contained fail-close: travel only if not combat.
    if(p.targetId!==null && this.sim.entities.get(p.targetId)?.kind==='mob')
      return {ok:false,reason:'TARGET_ACTIVE'};
    const original=p.pos;
    const source={x:original.x,z:original.z};
    const destination=this.sim.groundPos(door.arrival.x,door.arrival.z);
    if(!Number.isFinite(destination.y))return {ok:false,reason:'UNSAFE_DESTINATION'};
    // Own one authoritative entity; never issue addPlayer or new Sim.
    this.active.set(pid,{sim:this.sim,pid,scenarioId,source,player:p});
    p.pos={...destination};
    p.prevPos={...destination};
    this.sim.rebucket(p);
    this.seenLoot.set(pid,new Set());
    return {ok:true,scenarioId};
  }

  /** Use native corpse ownership, RNG and inventory; never roll rewards here.
   * The Set is a double-tap guard in ADDITION to donor's corpse-looted flag.
   */
  lootNativeCorpse(pid:number,mobEntityId:number):boolean {
    const visit=this.active.get(pid);
    if(!visit||visit.sim!==this.sim||this.sim.entities.get(pid)!==visit.player)
      return false;
    const seen=this.seenLoot.get(pid);
    if(!seen||seen.has(mobEntityId))return false;
    const mob=this.sim.entities.get(mobEntityId);
    if(!mob||mob.kind!=='mob'||!mob.dead)return false;
    const taken=this.sim.lootCorpse(mobEntityId,pid);
    if(taken)seen.add(mobEntityId);
    return taken;
  }

  exit(pid:number):HuntAdmit {
    const visit=this.active.get(pid);
    if(!visit||visit.sim!==this.sim)return {ok:false,reason:'NO_ACTIVE_VISIT'};
    const p=this.sim.entities.get(pid);
    if(p!==visit.player || p?.dead || p?.ghost)
      return {ok:false,reason:'PLAYER_NOT_SAFE_TO_EXIT'};
    const dest=this.sim.groundPos(visit.source.x,visit.source.z);
    if(!Number.isFinite(dest.y))return {ok:false,reason:'BAD_RETURN_SURFACE'};
    p.pos={...dest};
    p.prevPos={...dest};
    this.sim.rebucket(p);
    this.active.delete(pid);
    this.seenLoot.delete(pid);
    return {ok:true,scenarioId:visit.scenarioId};
  }

  /** Native CharacterState, never a parallel wallet/progression/save schema.
   * On a crash inside a hunt, the save's position points to the ORIGINAL
   * world to prevent an unavailable future instance from trapping the Hunter.
   * The production host must adopt this method INSTEAD OF a raw save while
   * a trip is active; until that host wiring exists, promotion is blocked.
   */
  safeCharacterForSave(pid:number):CharacterState|null {
    const source=this.sim.serializeCharacter(pid);
    if(!source)return null;
    const visit=this.active.get(pid);
    if(!visit)return source;
    if(visit.sim!==this.sim || this.sim.entities.get(pid)!==visit.player)
      throw Error('HF_V403_HUNTER_IDENTITY_CHANGED');
    return {...source,pos:{...visit.source}};
  }

  isVisiting(pid:number):boolean {
    return this.active.get(pid)?.sim===this.sim;
  }

  getActiveScenario(pid:number):string|null {
    return this.active.get(pid)?.scenarioId??null;
  }
}
