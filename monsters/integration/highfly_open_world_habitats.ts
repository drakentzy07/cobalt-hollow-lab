/** HIGHFLY V4-03 P07 — original open world + 8 optional dangerous wilderness pockets.
 * Donor ClaudeCraft zones/POIs/camps/quests/portals are copied, not replaced.
 * Reused mob templates, original native Sim camp spawning, AI/XP/corpses/loot.
 * Each camp uses its own private RNG stream. NO level/HP/item/stats modifiers.
 * Off by default (VITE_HIGHFLY_OPEN_WORLD_HUNTS=1 in isolated candidate).
 */
import type { CampDef, DungeonDef, MobTemplate, WorldContent, ZoneDef } from '../../sim/types';
import { HIGHFLY_HUNT_SCENARIOS } from './hunt_scenarios';
import { highflyMonsterId } from './level99';
import { highflyNativeHuntDungeonId } from './hunt_dungeon_registry';

export interface HighflyHabitat {
  readonly scenarioId:string;
  readonly zoneId:string;
  readonly minLevel:number;
  readonly center:Readonly<{x:number;z:number}>;
  readonly mobId:string;
  readonly count:number;
  readonly portal:Readonly<{x:number;z:number}>;
}
export interface HighflyHabitatWorld {
  readonly world:WorldContent;
  readonly habitats:readonly HighflyHabitat[];
}
const ORIGINAL_ZONE_OFFSET=3;
const PACKS_PER_HABITAT=2;
const MOBS_PER_PACK=2;
const CAMP_RADIUS=4;
const DANGER_MARGIN=38;
function dist(a:{x:number;z:number},b:{x:number;z:number}){
  return Math.hypot(a.x-b.x,a.z-b.z);
}
function candidatePositions(zone:ZoneDef, portal:{x:number;z:number}){
  const minX=(zone.xMin??-180)+27,maxX=(zone.xMax??180)-27;
  const minZ=zone.zMin+35,maxZ=zone.zMax-35;
  const anchors=[
    portal,{x:zone.hub.x,z:(zone.zMin+zone.zMax)/2},
    {x:0,z:(zone.zMin+zone.zMax)/2},
  ];
  const offsets=[
    [-120,80],[120,80],[-120,-80],[120,-80],
    [-95,110],[95,110],[-95,-110],[95,-110],
    [-140,140],[140,140],[-140,-140],[140,-140],
    [-65,125],[65,125],[-65,-125],[65,-125],
    [-150,35],[150,35],[-150,-35],[150,-35],
    [-80,170],[80,170],[-80,-170],[80,-170],
    [-48,170],[48,170],[-48,-170],[48,-170],
  ] as const;
  const result:{x:number;z:number}[]=[];
  for(const anchor of anchors)for(const [dx,dz] of offsets){
    const p={x:Math.max(minX,Math.min(maxX,anchor.x+dx)),
      z:Math.max(minZ,Math.min(maxZ,anchor.z+dz))};
    if(p.x>=minX&&p.x<=maxX&&p.z>=minZ&&p.z<=maxZ &&
       !result.some(q=>dist(p,q)<6))result.push(p);
  }
  return result;
}
export function prepareHighflyOpenWorldHabitats(
  original:WorldContent,
  dungeons:Readonly<Record<string,DungeonDef>>,
  mobs:Readonly<Record<string,MobTemplate>>,
):HighflyHabitatWorld {
  if(original.zones.length<ORIGINAL_ZONE_OFFSET+HIGHFLY_HUNT_SCENARIOS.length)
    throw Error('HF_P07_MISSING_DONOR_WORLD_ZONES');
  if(original.camps.some(c=>c.mobId.startsWith('hf_hunt_')))
    throw Error('HF_P07_ALREADY_INSTALLED');
  const occupied:CampDef[]=[...original.camps];
  const camps:CampDef[]=[];
  const habitats:HighflyHabitat[]=[];
  const zones:ZoneDef[]=[...original.zones];
  const otherDoors=Object.values(dungeons).filter(d=>d.overworldDoor!==false)
    .map(d=>d.doorPos);

  for(let i=0;i<HIGHFLY_HUNT_SCENARIOS.length;i++){
    const scenario=HIGHFLY_HUNT_SCENARIOS[i],zone=zones[ORIGINAL_ZONE_OFFSET+i];
    const portal=dungeons[highflyNativeHuntDungeonId(scenario.id)]?.doorPos;
    if(!portal)throw Error('HF_P07_NO_PHYSICAL_PORTAL:'+scenario.id);
    if(portal.z<zone.zMin||portal.z>=zone.zMax)
      throw Error('HF_P07_PORTAL_NOT_IN_DONOR_ZONE');
    const packCenters:{x:number;z:number}[]=[];
    for(let n=0;n<PACKS_PER_HABITAT;n++){
      const family=scenario.families[n];
      const mobId=highflyMonsterId(family,scenario.minLevel);
      const mob=mobs[mobId];
      if(!mob || mob.minLevel!==scenario.minLevel ||
        mob.maxLevel!==scenario.maxLevel || mob.boss || mob.dummy || mob.ambient)
        throw Error('HF_P07_INVALID_NATIVE_MOB:'+mobId);
      const candidates=candidatePositions(zone,portal);
      const selected=candidates.find(p=>
        dist(p,zone.hub)>zone.hub.radius+DANGER_MARGIN &&
        zone.lakes.every(l=>dist(p,l)>l.radius+DANGER_MARGIN/2) &&
        // Important: NO level-90 wolves adjacent to existing town paths,
        // quest camps, previously seeded monsters or donor/our dungeon gates.
        occupied.every(c=>dist(p,c.center)>c.radius+CAMP_RADIUS+35) &&
        otherDoors.every(d=>dist(p,d)>DANGER_MARGIN+12) &&
        packCenters.every(c=>dist(p,c)>34) &&
        // Existing POI labels remain visible and no lvl90 cluster may
        // occupy the immediate landmark visit trigger.
        zone.pois.every(x=>dist(p,x)>22));
      if(!selected)throw Error('HF_P07_NO_SAFE_CAMP_FOR:'+scenario.id+':'+n);
      const camp:CampDef={mobId,center:selected,radius:CAMP_RADIUS,
        count:MOBS_PER_PACK,offStream:true};
      occupied.push(camp);camps.push(camp);packCenters.push(selected);
      habitats.push({scenarioId:scenario.id,zoneId:zone.id,minLevel:scenario.minLevel,
        center:{...selected},mobId,count:MOBS_PER_PACK,portal:{...portal}});
    }
    zones[ORIGINAL_ZONE_OFFSET+i]={
      ...zone,pois:[
        ...zone.pois,{
          x:portal.x,z:portal.z,
          id:'hf_world_portal_'+scenario.id,
          label:'⚔ Portal '+scenario.minLevel+'–'+scenario.maxLevel,
        },
        ...packCenters.map((p,n)=>({
          x:p.x,z:p.z,
          id:'hf_habitat_'+scenario.id+'_'+n,
          label:'⚠ Cacería LV'+scenario.minLevel+'–'+scenario.maxLevel,
        })),
      ],
    };
  }
  if(camps.length!==16||camps.reduce((v,c)=>v+c.count,0)!==32)
    throw Error('HF_P07_BUDGET_DRIFT');
  // Keep original arrays intact; only replace the fields of the new
  // opt-in instance of WorldContent. No second Sim, map editor or loot engine.
  const world:WorldContent={...original,zones,camps:[...original.camps,...camps]};
  return {world,habitats};
}
