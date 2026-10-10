/** HIGHFLY P02-F — 8 native hunt elites + 8 LOCAL captains, not legendary bosses.
 * Strict optional browser encounters only. No new AI, skill, assets, boss
 * schedules, raids, scenario entrance, Training stats, loot tables or RNG.
 * Native MobTemplate flags, HP formula, ranged cast telegraph, elite bonus,
 * melee/kill/corpse, XP and crafting reagents remain the sole authorities.
 */
import type { MobTemplate, WorldContent } from '../../sim/types';
import { HIGHFLY_HUNT_SCENARIOS } from './hunt_scenarios';
import { highflyMonsterId } from './level99';

export type HighflyHuntEncounterMode = 'elite'|'captain';
export const HIGHFLY_ENCOUNTER_CAP = {
  simultaneousMobs:8, extraCampMobs:1, nativeBossSchedules:0,
  encounterLevels:8, variantsPerLevel:2,
} as const;
export function highflyEncounterId(mode:HighflyHuntEncounterMode,level:number):string {
  if((mode!=='elite'&&mode!=='captain')||
    !HIGHFLY_HUNT_SCENARIOS.some(s=>s.minLevel===level))
    throw Error('HF_HUNT_ENCOUNTER_INVALID_KIND_OR_LEVEL');
  return 'hf_enc_'+mode+'_'+level;
}

/** Use existing hunt mob templates that have passed P02-E recipe+loot audits.
 * Captain is a self-contained, telegraphed local mini-boss, NOT worldBoss,
 * a raid, a dungeon endboss or any of our five legendary monsters.
 * Avoid summonAdds, lethal zones, one-hit kills, world-wide announcements,
 * loot-gates and quest/pet/rare logic. Native engine owns the actual AI.
 */
export function buildHighflyHuntEncounters(
  normalRoster:Readonly<Record<string,MobTemplate>>,
):Record<string,MobTemplate> {
  const added:Record<string,MobTemplate>={};
  for(const s of HIGHFLY_HUNT_SCENARIOS) {
    for(const mode of ['elite','captain'] as const) {
      const family=s.families[mode==='elite'?1:0];
      const source=normalRoster[highflyMonsterId(family,s.minLevel)];
      if(!source||source.minLevel!==s.minLevel||
        source.maxLevel!==s.maxLevel||source.boss||source.elite||
        source.rare||source.worldBoss||source.requiresQuestId||
        source.loot.some(v=>v.questId!==undefined))
        throw Error('HF_HUNT_ENCOUNTER_SOURCE_NOT_SAFE:'+s.id+':'+mode);
      const id=highflyEncounterId(mode,s.minLevel);
      if(normalRoster[id]||added[id])throw Error('HF_HUNT_ENCOUNTER_ID_COLLISION:'+id);
      const isCaptain=mode==='captain';
      added[id]={
        ...source,
        id,
        name:(isCaptain?'Capitán de la región':'Élite del territorio')+
          ' — '+s.title+' (LV'+s.minLevel+'–'+s.maxLevel+')',
        // createMob applies Claude's native elite scaling (HP, damage, XP).
        elite:true,
        boss:isCaptain,
        rare:false,
        worldBoss:false,
        ccImmune:false,
        slowImmune:false,
        untameable:true,
        offStreamIdle:true,
        idleStationary:true,
        hardLeashRadius:38,
        aggroRadius:isCaptain?13:11,
        scale:Math.min(1.8,source.scale*(isCaptain?1.26:1.12)),
        // Most families already carry native skills; only the local captain
        // gets a readable telegraph + late enrage with an escape window.
        bigCast:isCaptain?{
          castId:'hf_hunt_captain_pulse_'+s.minLevel,
          name:'Onda de amenaza',castTime:2.5,every:19,radius:5,
          min:6+Math.floor(s.minLevel*0.4),
          max:10+Math.floor(s.minLevel*0.55),
          school:'physical',
        }:undefined,
        enrage:isCaptain?{belowHpPct:0.3,dmgMult:1.14,hasteMult:1.08}:undefined,
        // Do not inherit a donor summon/quest/boss-specific mechanic.
        summonAdds:undefined,
        requiresQuestId:undefined,
        broodEgg:undefined,
        meleeBomb:undefined,
        deathZoneCast:undefined,
        deathZoneStrike:undefined,
        infernoChannel:undefined,
        damageFloorPct:undefined,
        // Monetary/reagent guarantees are NOT increased; elite/boss
        // challenge XP and monster quality are still the native engines.
        loot:source.loot.map(entry=>({...entry})),
        componentTags:source.componentTags?[...source.componentTags]:undefined,
      };
    }
  }
  if(Object.keys(added).length!==16)throw Error('HF_HUNT_ENCOUNTER_COVERAGE_DRIFT');
  return added;
}

/** Replace a single native trash spawn with ONE native elite/captain on
 * validated custom terrain, never append to default world. All four original
 * camp families remain present (the last camp drops from 2 to 1).
 * This preserves 8 simultaneous monsters and the P02-D scenic path budget.
 */
export function addHighflyHuntEncounterWorld(
  world:WorldContent,
  scenarioId:string,
  mode:HighflyHuntEncounterMode,
  mobs:Readonly<Record<string,MobTemplate>>,
):WorldContent {
  const s=HIGHFLY_HUNT_SCENARIOS.find(x=>x.id===scenarioId);
  if(!s||!['elite','captain'].includes(mode)||world.zones.length!==1||
    world.zones[0].id!==s.id+'_playtest'||world.camps.length!==4||
    world.camps.some(c=>!c.offStream||c.count!==2)||
    world.roads.length!==4||world.props.decorProps?.length!==12||
    world.camps.reduce((n,c)=>n+c.count,0)!==8)
    throw Error('HF_HUNT_ENCOUNTER_UNSAFE_WORLD');
  const id=highflyEncounterId(mode,s.minLevel);
  const m=mobs[id];
  if(!m||m.id!==id||m.minLevel!==s.minLevel||m.maxLevel!==s.maxLevel||
    !m.elite||(mode==='captain')!==Boolean(m.boss)||m.worldBoss)
    throw Error('HF_HUNT_ENCOUNTER_MOB_NOT_REGISTERED');
  const last=world.camps[3];
  const specialCenter={x:0,z:202};
  if(world.camps.some(c=>Math.hypot(c.center.x-specialCenter.x,c.center.z-specialCenter.z)<c.radius+25))
    throw Error('HF_HUNT_ENCOUNTER_CAMP_OVERLAP');
  return {
    ...world,
    camps:[
      ...world.camps.slice(0,3).map(c=>({...c})),
      {...last,count:1},
      {mobId:id,center:specialCenter,radius:2,count:1,offStream:true},
    ],
    zones:[{...world.zones[0],pois:[
      ...world.zones[0].pois,
      {id:s.id+'_encounter_'+mode,x:specialCenter.x,z:specialCenter.z,
        label:mode==='elite'?'Guarida de élite':'Desafío del capitán'},
    ]}],
  };
}
