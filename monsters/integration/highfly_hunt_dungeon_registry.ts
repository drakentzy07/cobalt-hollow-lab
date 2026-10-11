/** HIGHFLY V4-03 P06 — WALKABLE WORLD PORTALS AND TRUE NATIVE SPAWNS.
 * Reuses ClaudeCraft DUNGEON_LIST -> world door objects -> native auto-trigger ->
 * claimInstance() -> createMob() -> kill/XP/corpse/loot -> original exit.
 *
 * All 8 stage interiors are donor dungeon PROTOTYPES, not the intended
 * custom P02I biome landscapes. This does not add any new gameplay economy.
 */
import type { DungeonDef, DungeonSpawn, ZoneDef } from '../../sim/types';
import { HIGHFLY_HUNT_SCENARIOS } from './hunt_scenarios';
import { highflyMonsterId } from './level99';

export function highflyNativeHuntDungeonId(scenarioId:string):string {
  return 'hf_dungeon_'+scenarioId;
}
export interface HighflyPortalPlacement {
  readonly scenarioId:string;
  readonly dungeonId:string;
  readonly zoneId:string;
  readonly worldX:number;
  readonly worldZ:number;
  readonly minLevel:number;
}
/** The 8 native non-tutorial regions form a deterministic "portal trail".
 * This leverages EXISTING terrain instead of shipping empty disconnected maps.
 */
export const HIGHFLY_WORLD_GATE_ZONE_OFFSET=3;

export function buildHighflyNativeHuntDungeons(
  existing:Readonly<Record<string,DungeonDef>>,
  zones:readonly ZoneDef[],
):Record<string,DungeonDef> {
  const occupied=new Set(Object.values(existing).map(d=>d.index));
  const nextBase=Math.max(...occupied)+1;
  const prototypes:Record<string,DungeonDef>={};
  const interiors:DungeonDef['interior'][]=[
    'crypt','crypt','sanctum','sanctum',
    'temple','temple','sanctum','crypt',
  ];
  if(zones.length<HIGHFLY_WORLD_GATE_ZONE_OFFSET+HIGHFLY_HUNT_SCENARIOS.length)
    throw Error('HF_V403_NOT_ENOUGH_DONOR_ZONES');
  const occupiedDoors=Object.values(existing)
    .filter(x=>x.overworldDoor!==false)
    .map(x=>x.doorPos);
  const newDoors:Array<{x:number;z:number}>=[];
  for(let i=0;i<HIGHFLY_HUNT_SCENARIOS.length;i++){
    const s=HIGHFLY_HUNT_SCENARIOS[i],id=highflyNativeHuntDungeonId(s.id);
    const index=nextBase+i, zone=zones[HIGHFLY_WORLD_GATE_ZONE_OFFSET+i];
    if(!zone||!zone.id||existing[id]||occupied.has(index))
      throw Error('HF_V403_DUPLICATE_DUNGEON');
    if(index>48)throw Error('HF_V403_UNSAFE_OVERFLOW_INDEX');
    // World-gate sites remain fully inside an ALREADY REAL existing terrain
    // rectangle. Avoid settlements, lakes, donor doors, and other hunt gates.
    const minX=(zone.xMin??-180)+24,maxX=(zone.xMax??180)-24;
    const minZ=zone.zMin+25,maxZ=zone.zMax-25;
    const candidates:Array<{x:number;z:number}>=[];
    for(const dz of [65,-65,95,-95,130,-130,40,-40,155,-155]){
      for(const dx of [85,-85,110,-110,65,-65,130,-130,0]){
        candidates.push({x:Math.min(maxX,Math.max(minX,zone.hub.x+dx)),
          z:Math.min(maxZ,Math.max(minZ,zone.hub.z+dz))});
      }
    }
    const inWaterOrCamp=(p:{x:number;z:number})=>
      Math.hypot(p.x-zone.hub.x,p.z-zone.hub.z)<zone.hub.radius+18 ||
      zone.lakes.some(l=>Math.hypot(p.x-l.x,p.z-l.z)<l.radius+18);
    const closeToDoor=(p:{x:number;z:number})=>
      [...occupiedDoors,...newDoors].some(d=>Math.hypot(p.x-d.x,p.z-d.z)<28);
    const selected=candidates.find(p=>
      p.x>=minX&&p.x<=maxX&&p.z>=minZ&&p.z<=maxZ &&
      !inWaterOrCamp(p)&&!closeToDoor(p));
    if(!selected)throw Error('HF_V403_NO_SAFE_NATIVE_WORLD_GATE:'+zone.id);
    newDoors.push(selected);
    const spawns:DungeonSpawn[]=s.families.flatMap((family,n)=>[
      {mobId:highflyMonsterId(family,s.minLevel),x:-4,z:26+n*19,
        idleStationary:true,packId:'hf_pack_'+n},
      {mobId:highflyMonsterId(family,s.minLevel),x:4,z:28+n*19,
        idleStationary:true,packId:'hf_pack_'+n},
    ]);
    if(spawns.length> s.populationBudget)throw Error('HF_V403_PHONE_SPAWN_OVERLOAD');
    // Portal has a physically placed native world object. On walk-up
    // the ORIGINAL updateDoorTriggers/enterDungeon/claimInstance resolves
    // an instance with eight REAL killable mobs and a native exit.
    prototypes[id]={
      id,name:'Expedición: '+s.title,index,
      doorPos:selected,overworldDoor:true,guideVisible:false,
      entry:{x:0,z:-2},exitOffset:{x:0,z:-6},
      spawns,interior:interiors[i],
      suggestedPlayers:1,
      enterText:'Ingresás a '+s.title+'.',
      leaveText:'Regresás de '+s.title+'.',
    };
  }
  if(Object.keys(prototypes).length!==8)throw Error('HF_V403_HUNT_COVERAGE_NOT_8');
  return prototypes;
}

export function highflyPortalManifest(dungeons:Readonly<Record<string,DungeonDef>>,
  zones:readonly ZoneDef[]):HighflyPortalPlacement[] {
  return HIGHFLY_HUNT_SCENARIOS.map((s,i)=>{
    const dungeonId=highflyNativeHuntDungeonId(s.id);
    const d=dungeons[dungeonId],zone=zones[HIGHFLY_WORLD_GATE_ZONE_OFFSET+i];
    if(!d||!zone||d.overworldDoor!==true||
      !(d.doorPos.z>=zone.zMin&&d.doorPos.z<zone.zMax))
      throw Error('HF_V403_UNREGISTERED_WORLD_PORTAL:'+s.id);
    return {scenarioId:s.id,dungeonId,zoneId:zone.id,
      worldX:d.doorPos.x,worldZ:d.doorPos.z,minLevel:s.minLevel};
  });
}
