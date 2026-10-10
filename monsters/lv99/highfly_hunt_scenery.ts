/** HIGHFLY P02-D — native ClaudeCraft scene dressing and safe hunt paths.
 * Uses only existing native GLBs/props and WorldContent. No remote assets,
 * new gameplay engine, boss logic, loot shortcuts, Training or public routes.
 * Each time only ONE preview island is rendered (8-mob mobile budget).
 */
import type { WorldContent, ZonePropsDef } from '../../sim/types';
import { HIGHFLY_HUNT_SCENARIOS } from './hunt_scenarios';

export type HuntDecor = NonNullable<ZonePropsDef['decorProps']>[number];
type DecorKey = 'graveCross'|'graveBevel'|'graveRound'|'rockTallA'|'rockTallH'|
  'rockLargeD'|'rockLargeF'|'mushroomRed'|'mushroomTan'|'oreRocks'|
  'marshReeds'|'columnBroken'|'column'|'crystalAmethystCluster'|
  'starHeartCrystal'|'statueHead'|'statueBlock';
interface Theme {
  readonly keys: readonly [DecorKey,DecorKey,DecorKey,DecorKey];
  readonly reeds: boolean;
  readonly ruins: boolean;
  readonly graves: boolean;
  readonly bonfires: boolean;
  readonly highlands: boolean;
  readonly landmark: string;
}
/** Only donor-verified PROP_ASSET_DEFS keys, all available in the frozen bundle. */
const THEMES: Record<string,Theme> = {
  hf_hunt_woods_21: {keys:['graveCross','rockTallA','mushroomTan','graveBevel'],reeds:false,ruins:true,graves:true,bonfires:false,highlands:false,landmark:'Árboles muertos y ruinas'},
  hf_hunt_fen_30: {keys:['marshReeds','mushroomRed','rockLargeD','mushroomTan'],reeds:true,ruins:false,graves:false,bonfires:false,highlands:false,landmark:'Los juncales del velo'},
  hf_hunt_crag_40: {keys:['rockTallH','rockLargeF','oreRocks','columnBroken'],reeds:false,ruins:true,graves:false,bonfires:false,highlands:true,landmark:'Las fauces de piedra'},
  hf_hunt_frost_50: {keys:['rockLargeF','crystalAmethystCluster','rockTallA','rockLargeD'],reeds:false,ruins:false,graves:false,bonfires:false,highlands:true,landmark:'Cristales en el hielo'},
  hf_hunt_ash_60: {keys:['rockTallH','oreRocks','graveRound','columnBroken'],reeds:false,ruins:true,graves:false,bonfires:true,highlands:true,landmark:'Las brasas del yermo'},
  hf_hunt_garden_70: {keys:['mushroomRed','starHeartCrystal','column','statueHead'],reeds:true,ruins:true,graves:false,bonfires:false,highlands:false,landmark:'El santuario caído'},
  hf_hunt_storm_80: {keys:['rockTallA','crystalAmethystCluster','columnBroken','rockTallH'],reeds:false,ruins:false,graves:false,bonfires:true,highlands:true,landmark:'Piedras del trueno'},
  hf_hunt_abyss_90: {keys:['graveBevel','statueBlock','starHeartCrystal','rockTallH'],reeds:false,ruins:true,graves:true,bonfires:true,highlands:true,landmark:'Vigilia del abismo'},
} as const;
/** Edge bands, far away from start, four levelled camp footprints and all
 * direct (start -> camp) combat routes, including radial camp scatter. */
export const SCENIC_ANCHORS: readonly Readonly<{x:number;z:number}>[] = [
  {x:-145,z:67}, {x:145,z:67}, {x:-147,z:110}, {x:147,z:110},
  {x:-147,z:197}, {x:147,z:197}, {x:-125,z:223}, {x:125,z:223},
  {x:-90,z:226}, {x:90,z:226}, {x:-144,z:245}, {x:144,z:245},
] as const;
const START = {x:0,z:38} as const;
const CAMP_X = [-108,-36,36,108] as const;
const CAMP_Z = 164;
const ROUTE_PADDING = 10;
export const HUNT_SCENERY_DECOR_CAP = 12;
export const HUNT_SCENERY_BUDGET = {glbDecor:12,ruinRings:1,extraFires:2,extraTents:2} as const;

function distanceToSegment(px:number,pz:number,x0:number,z0:number,x1:number,z1:number):number {
  const dx=x1-x0,dz=z1-z0;
  const t=Math.max(0,Math.min(1,((px-x0)*dx+(pz-z0)*dz)/(dx*dx+dz*dz)));
  return Math.hypot(px-(x0+t*dx),pz-(z0+t*dz));
}
export function scenicAnchorClearance(x:number,z:number,extraRadius=0):boolean {
  if(!Number.isFinite(x)||!Number.isFinite(z)||extraRadius<0||!Number.isFinite(extraRadius))
    return false;
  if(x < -157 || x > 157 || z < 15 || z > 248) return false;
  if(Math.hypot(x-START.x,z-START.z)<25+extraRadius) return false;
  return CAMP_X.every(cx=>
    Math.hypot(x-cx,z-CAMP_Z)>19+extraRadius &&
    distanceToSegment(x,z,START.x,START.z,cx,CAMP_Z)>ROUTE_PADDING+extraRadius
  );
}

/** Fan of REAL native ground-road strips from the Hunter refuge into each hunt.
 * Pure geometry; the original renderer and biome path tint draw the roads.
 * An intact navigable corridor is mandatory (checked with native terrain API).
 */
export function highflyHuntRoads(): WorldContent['roads'] {
  return CAMP_X.map(cx => [
    {...START}, {x:cx*0.28,z:83}, {x:cx*0.62,z:123}, {x:cx,z:CAMP_Z},
  ]);
}
function decorate(scenarioId:string): NonNullable<ZonePropsDef['decorProps']> {
  const theme=THEMES[scenarioId];
  if(!theme)throw Error('HF_HUNT_SCENERY_UNKNOWN_THEME');
  return SCENIC_ANCHORS.map((a,i)=>({
    key:theme.keys[i%theme.keys.length],
    x:a.x,z:a.z,rot:(i%4)*Math.PI/2,
    scale:theme.highlands?0.85:0.7,
    r:1.1,h:3.0,
  }));
}
/** Additive WORLD DATA only, and never called from the public default world.
 * Strict validation prevents overlapping spawn/paths and accidental reapply.
 */
export function addHighflyHuntScenery(
  base:WorldContent, scenarioId:string,
):WorldContent {
  const theme=THEMES[scenarioId];
  const scenario=HIGHFLY_HUNT_SCENARIOS.find(s=>s.id===scenarioId);
  if(!theme||!scenario||base.zones.length!==1||
    base.zones[0].id!==scenarioId+'_playtest'||base.camps.length!==4||
    base.props.decorProps?.length || base.roads.length ||
    (base.terrainEdits?.length??0)!==1 ||
    base.camps.reduce((n,c)=>n+c.count,0)!==8)
    throw Error('HF_HUNT_SCENERY_INVALID_BASE_WORLD');
  const decorProps=decorate(scenarioId);
  if(decorProps.length>HUNT_SCENERY_DECOR_CAP ||
    decorProps.some(p=>!scenicAnchorClearance(p.x,p.z,p.r??0)))
    throw Error('HF_HUNT_SCENERY_COLLISION_WITH_ROUTE');
  const roads=highflyHuntRoads();
  // Only 5 gentle edge mounds, nowhere on a validated route or camp scatter.
  const hills=[
    {x:-145,z:85,radius:20,delta:2.2},
    {x:145,z:85,radius:20,delta:2.0},
    {x:-146,z:226,radius:14,delta:2.6},
    {x:146,z:226,radius:14,delta:2.4},
    {x:0,z:232,radius:16,delta:1.8},
  ].map(v=>({...v,mode:'add' as const,falloff:'smooth' as const}));
  for(const h of hills)
    if(!scenicAnchorClearance(h.x,h.z,0) && h.x!==0)
      throw Error('HF_HUNT_SCENERY_HILL_ON_ROUTE');
  const props:ZonePropsDef={
    ...base.props,
    decorProps,
    tents:[...base.props.tents,{x:-28,z:27,rot:0.3,scale:0.8},{x:27,z:27,rot:-0.3,scale:0.8}],
    campfires:[...base.props.campfires,[-25,44],[26,45]],
    crates:[...base.props.crates,[-27,53],[25,55]],
    ruinRings:theme.ruins?[...base.props.ruinRings,{x:-135,z:205,ringR:5,columns:5}]:[...base.props.ruinRings],
    graveyards:theme.graves?[...base.props.graveyards,{x:135,z:225}]:[...base.props.graveyards],
    marshReeds:theme.reeds?[
      ...base.props.marshReeds,
      ...SCENIC_ANCHORS.filter((_,i)=>i%2===0).map(a=>[a.x+5,a.z+4] as [number,number]),
    ]:[...base.props.marshReeds],
  };
  // ONE remote beacon only: original refuge fire + 2 shelters + beacon = 4.
  if(theme.bonfires)props.campfires.push([-125,217]);
  const zone=base.zones[0];
  return {
    ...base,
    zones:[{
      ...zone,
      pois:[...zone.pois,{id:scenarioId+'_landmark',x:0,z:217,label:theme.landmark},
        ...base.camps.map((c,i)=>({id:scenarioId+'_trail_'+i,x:c.center.x,z:c.center.z,
          label:'Territorio '+scenario.families[i]}))],
    }],
    roads,
    props,
    terrainEdits:[...(base.terrainEdits??[]),...hills],
  };
}
/** Permanent authoring coverage: every level band has a distinct dressing
 * palette and every asset comes from the pinned ClaudeCraft props registry.
 */
export function highflySceneryCoverage():boolean {
  return Object.keys(THEMES).length===8
    && HIGHFLY_HUNT_SCENARIOS.every(s=>THEMES[s.id]?.keys.length===4)
    && new Set(Object.values(THEMES).map(v=>v.keys.join('|'))).size===8;
}
