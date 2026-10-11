/** V4-03 P04: Eight opt-in native dungeon *prototypes* built from the real
 * ClaudeCraft dungeon engine. NOT the finished outdoor biome maps.
 * Native loot, XP, AI and cleanup remain untouched. Register before the
 * donor builds DUNGEON_LIST and dungeon index lookup.
 */
import type { DungeonDef } from '../../sim/types';
import { HIGHFLY_HUNT_SCENARIOS } from './hunt_scenarios';

export function highflyNativeHuntDungeonId(scenarioId:string):string {
  return 'hf_dungeon_'+scenarioId;
}
export function buildHighflyNativeHuntDungeons(
  existing:Readonly<Record<string,DungeonDef>>,
):Record<string,DungeonDef> {
  const occupied=new Set(Object.values(existing).map(d=>d.index));
  const nextBase=Math.max(...occupied)+1;
  const prototypes:Record<string,DungeonDef>={};
  const interiors:DungeonDef['interior'][]=[
    'crypt','crypt','sanctum','sanctum',
    'temple','temple','sanctum','crypt',
  ];
  for(let i=0;i<HIGHFLY_HUNT_SCENARIOS.length;i++){
    const s=HIGHFLY_HUNT_SCENARIOS[i],id=highflyNativeHuntDungeonId(s.id);
    const index=nextBase+i;
    if(existing[id]||occupied.has(index))throw Error('HF_V403_DUPLICATE_DUNGEON');
    if(index>48)throw Error('HF_V403_UNSAFE_OVERFLOW_INDEX');
    // Every hunt has an own claim/slot and native exit, with no overworld
    // portal. Admission is exclusively via a level-gated HIGHFLY UI action.
    prototypes[id]={
      id,name:'Expedición: '+s.title,index,
      doorPos:{x:0,z:60},overworldDoor:false,guideVisible:false,
      // Never auto-claim a second instance. Native personal/party dungeon
      // rules remain the authority for resets, deaths and entry.
      entry:{x:0,z:-2},exitOffset:{x:0,z:-6},
      spawns:[],interior:interiors[i],
      suggestedPlayers:1,
      enterText:'Iniciás la expedición '+s.title+'.',
      leaveText:'Regresás de '+s.title+'.',
    };
  }
  if(Object.keys(prototypes).length!==8)throw Error('HF_V403_HUNT_COVERAGE_NOT_8');
  return prototypes;
}
