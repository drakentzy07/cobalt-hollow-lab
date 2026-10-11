/** HIGHFLY V4-03 P09: reuse MONSTRUOS 6's ORIGINAL registered 8 elites
 * and 8 local captains in the existing 8 native dungeon instances.
 *
 * Separate opt-in flag: VITE_HIGHFLY_CHALLENGE_ENCOUNTERS=1.
 * Replace TWO normal spawns, never add a mob or change the original map.
 * Retain 8 total; 6 normal + 1 elite + 1 local captain per expedition.
 * None of the five legendary/special creatures, no boss loot guarantees.
 */
import type {DungeonDef,MobTemplate} from '../../sim/types';
import {HIGHFLY_HUNT_SCENARIOS} from './hunt_scenarios';
import {highflyNativeHuntDungeonId} from './hunt_dungeon_registry';
import {highflyEncounterId} from './hunt_encounters';

export const HIGHFLY_P09_NATIVE_CAP = Object.freeze({
  dungeons:8,perDungeon:8,ordinary:6,elite:1,captain:1,
  addedWorldPopulation:0,newLegendaryBosses:0,
});

/** Immutable patch: only the eight opt-in HIGHFLY DungeonDefs are cloned.
 * If a donor definition, a special or a campaign quest drifts, refuse to
 * activate instead of changing live drops or the original dungeon registry.
 */
export function promoteHighflyNativeDungeonChallenges(
  dungeons:Readonly<Record<string,DungeonDef>>,
  mobs:Readonly<Record<string,MobTemplate>>,
):Record<string,DungeonDef>{
  const next:Record<string,DungeonDef>={};
  for(const s of HIGHFLY_HUNT_SCENARIOS){
    const id=highflyNativeHuntDungeonId(s.id),def=dungeons[id];
    if(!def||!def.overworldDoor||def.spawns.length!==8||
      def.spawns.some(x=>!x.mobId.startsWith('hf_hunt_')||
        !mobs[x.mobId] || Boolean(mobs[x.mobId].boss)||Boolean(mobs[x.mobId].elite)))
      throw Error('HF_P09_EXPECTED_UNTOUCHED_NATIVE_DUNGEON:'+id);
    const eliteId=highflyEncounterId('elite',s.minLevel);
    const captainId=highflyEncounterId('captain',s.minLevel);
    const elite=mobs[eliteId],captain=mobs[captainId];
    if(!elite||!captain||!elite.elite||elite.boss||elite.worldBoss||
      !captain.elite||!captain.boss||captain.worldBoss||
      elite.minLevel!==s.minLevel||captain.minLevel!==s.minLevel||
      elite.maxLevel!==s.maxLevel||captain.maxLevel!==s.maxLevel||
      elite.loot.some(l=>l.questId!==undefined)||
      captain.loot.some(l=>l.questId!==undefined))
      throw Error('HF_P09_MONSTER6_NATIVE_CHALLENGE_NOT_SAFE:'+s.id);
    // Late in the corridor for a readable challenge. Preserve one or more
    // of EACH original family and all original eight spawn coordinates.
    // Avoid original pack aggro for a boss/elite to keep mobile combat legible.
    const spawns=def.spawns.map((x,i)=>
      i===5 ? {...x,mobId:eliteId,packId:undefined,idleStationary:true}
      : i===7 ? {...x,mobId:captainId,packId:undefined,idleStationary:true}
      : {...x});
    const originals=new Set(spawns.filter(x=>x.mobId.startsWith('hf_hunt_'))
      .map(x=>x.mobId));
    if(originals.size!==4||
      spawns.length!==HIGHFLY_P09_NATIVE_CAP.perDungeon||
      spawns.filter(x=>x.mobId===eliteId).length!==1||
      spawns.filter(x=>x.mobId===captainId).length!==1)
      throw Error('HF_P09_EIGHT_MOB_OR_FAMILY_BUDGET_VIOLATION:'+s.id);
    next[id]={...def,spawns};
  }
  if(Object.keys(next).length!==HIGHFLY_P09_NATIVE_CAP.dungeons)
    throw Error('HF_P09_DUNGEON_COVERAGE_DRIFT');
  return next;
}
