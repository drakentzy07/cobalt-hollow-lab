/**
 * HIGHFLY WORLD0: authoring preset for ClaudeCraft's real Editor/Sim/Renderer.
 * Full built-in zones and terrain, with no inherited NPCs/mob camps/objects.
 * NEW port, city and single native wolf, using only catalogued original GLBs.
 * All assets are source assets; this is not a replacement game engine.
 */
import { BUILTIN_WORLD } from '../../sim/data';
import { WORLD_SEED } from '../../sim/world_seed';
import { MAP_DOC_VERSION, type MapPlacement } from '../../sim/map_doc';
import { emptyZoneProps, type NpcDef, type WorldContent, type BlockerDef } from '../../sim/types';
import { customMapToWorldContent, type CustomMap } from '../../editor/custom_map';

export const WORLD0_ID = 'highfly-world0-coast-v1';
export const WORLD0_GREETER_ID = 'hf_world0_greeter';
export const WORLD0_HUNTER_SPAWN = {x:-104,z:-52} as const;
export const WORLD0_WOLF_POS = {x:27,z:-43} as const;
export const WORLD0_CITY_CENTER = {x:-13,z:-110} as const;
const clone=<T>(v:T):T=>JSON.parse(JSON.stringify(v)) as T;
const at=(assetId:string,x:number,z:number,scale:number,rotY=0,collide=false):MapPlacement=>
  ({assetId,x,z,scale,rotY,collide});
const WALL='biome/hex_wall';
function spacedWall(ax:number,az:number,bx:number,bz:number,count:number):MapPlacement[]{
  const rotation=Math.atan2(bz-az,bx-ax);
  return Array.from({length:count},(_,i)=>at(WALL,ax+(bx-ax)*(i+.5)/count,az+(bz-az)*(i+.5)/count,7.1,rotation));
}
export function makeWorld0Map():CustomMap {
  const cx=WORLD0_CITY_CENTER.x,cz=WORLD0_CITY_CENTER.z;
  const left=cx-40,right=cx+40,south=cz-35,north=cz+35;
  const placements:MapPlacement[]=[
    // The full native world is kept; only our intentionally placed structures
    // are added to this zero-population authoring layer.
    at('biome/hex_ship_blue',-140,-68,7.8,.15),
    at('biome/hex_ship_green',-142,-51,7.8,-.13),
    at('biome/hex_ship_red',-144,-34,7.8,.10),
    at('biome/beach_dock',-119,-60,5.8,Math.PI/2),
    at('biome/hexb_docks',-119,-45,6,Math.PI/2),
    at('props/dock_platform',-117,-33,5.5,Math.PI/2),
    at('biome/beach_house',-96,-69,5.8,0,true),
    at('props/rowboat',-121,-27,3.5,.45),
    // First city: four towers, enclosing walls with an actual west gate gap
    ...spacedWall(left,south,right,south,8),
    ...spacedWall(left,north,right,north,8),
    ...spacedWall(right,south,right,north,7),
    ...spacedWall(left,south,left,cz-9,3),
    ...spacedWall(left,cz+9,left,north,3),
    at('biome/hex_tower',left,south,12,0,true),
    at('biome/hex_tower',right,south,12,0,true),
    at('biome/hex_tower',left,north,12,0,true),
    at('biome/hex_tower',right,north,12,0,true),
    at('props/fenbridge_gate_arch',left,cz,9,Math.PI/2),
    at('props/inn',cx-15,cz-14,9,0,true),
    at('biome/hex_tavern',cx+15,cz+15,9,Math.PI,true),
  ];
  const walls:BlockerDef[]=[
    {x1:left,z1:south,x2:right,z2:south},
    {x1:left,z1:north,x2:right,z2:north},
    {x1:right,z1:south,x2:right,z2:north},
    {x1:left,z1:south,x2:left,z2:cz-9},
    {x1:left,z1:cz+9,x2:left,z2:north},
  ];
  const npc:NpcDef={
    id:WORLD0_GREETER_ID,name:'Guardián del Desembarco',
    title:'Bienvenida al mundo',pos:{x:-101,z:-52},facing:0,color:0xd3ac69,questIds:[],
    greeting:'Bienvenido a HIGHFLY. Este continente es tuyo. Son tres barcos, un sendero, una ciudad amurallada y un lobo de entrenamiento. Elegí tu camino.'
  };
  const zones=clone(BUILTIN_WORLD.zones);
  // Keep region definitions, seeds and terrain generation exactly as authored.
  // Old POI labels reference built-in stories, so hide them for this clean test.
  for (const zone of zones) zone.pois=[];
  zones[0].pois=[
    {id:'hf0_harbor',x:-112,z:-52,label:'Puerto del Desembarco'},
    {id:'hf0_city',x:cx,z:cz,label:'Primera Ciudad'},
    {id:'hf0_wolf',x:WORLD0_WOLF_POS.x,z:WORLD0_WOLF_POS.z,label:'Lobo de Entrenamiento'}
  ];
  return {
    version:MAP_DOC_VERSION,
    meta:{id:WORLD0_ID,name:'HIGHFLY WORLD 0 — Costa del Desembarco',
      description:'ClaudeCraft completo despoblado. Puerto con tres barcos, un guardián, un lobo, muralla, cuatro torres y dos edificios.',
      createdAt:1,updatedAt:1,seed:WORLD_SEED,parentId:''},
    content:{
      zones,
      camps:[{mobId:'forest_wolf',center:{...WORLD0_WOLF_POS},radius:.5,count:1}],
      npcs:{[WORLD0_GREETER_ID]:npc},
      objects:[],
      roads:[[
        {x:WORLD0_HUNTER_SPAWN.x,z:WORLD0_HUNTER_SPAWN.z},
        {x:-91,z:-65},{x:-77,z:-79},{x:-60,z:-94},{x:left-2,z:cz},
        {x:left+13,z:cz},{x:cx,z:cz}
      ]]
    },
    terrainEdits:[],placements,blockers:walls,
    playerStart:{...WORLD0_HUNTER_SPAWN},
  };
}
/** Discard built-in world props/services for the game-side isolated trial. */
export function makeWorld0Content():WorldContent {
  const content=customMapToWorldContent(makeWorld0Map());
  return {...content,props:emptyZoneProps(),services:undefined};
}
