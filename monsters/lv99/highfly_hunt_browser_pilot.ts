/** HIGHFLY P02-C: browser-only native terrain hunt entry; opt-in CI preview.
 * No default world mutation, no public Pages activation, no V4 promotion.
 */
import {
  BUILTIN_WORLD, getActiveWorldContent, MOBS, setActiveWorldContent, ZONES,
} from '../../sim/data';
import { WORLD_SEED } from '../../sim/world_seed';
import { terrainHeight, waterLevelAt } from '../../sim/world';
import type { WorldContent } from '../../sim/types';
import { HIGHFLY_HUNT_SCENARIOS } from './hunt_scenarios';
import { addHighflyHuntScenery } from './hunt_scenery';
import { buildHighflyHuntPlaytestWorld, type HighflyHuntSurfaceProbe } from './hunt_playtest_world';

export interface HighflyHuntBrowserSession {
  readonly world: WorldContent;
  readonly seed: number;
  readonly hunterLevel: number;
  readonly scenarioId: string;
}
export const HIGHFLY_HUNT_BROWSER_FLAG = 'hfHunt';
/** Only canonical level-band beginnings allowed; Extended and arbitrary IDs denied. */
const ALLOWED_START_LEVELS = new Set(HIGHFLY_HUNT_SCENARIOS.map(s => s.minLevel));
const originalZoneIds = new Set(ZONES.map(z => z.id));

/** Native terrain probe. Every sampled route point checks slope on both axes.
 * The same native height/water functions are used by Sim and the renderer.
 */
export function nativeHighflyHuntSurfaceProbe(seed: number): HighflyHuntSurfaceProbe {
  return (x, z) => {
    const groundY = terrainHeight(x, z, seed);
    const waterY = waterLevelAt(x, z, seed);
    const offsets = [[x+1,z], [x-1,z], [x,z+1], [x,z-1]] as const;
    const slopeOK = offsets.every(([xx,zz]) => {
      const sample = terrainHeight(xx,zz,seed);
      return Number.isFinite(sample) && Number.isFinite(groundY)
        && Math.abs(sample - groundY) < 0.43;
    });
    return { groundY, waterY, walkable: slopeOK };
  };
}

/** Shared seed-matched preview world: one flat, dry, deliberately small safe
 * combat field. This level stamp is preview geometry only, not a world biome
 * or a generated high-level open-world island. Forest/decoration art is future.
 * The level-mode plateau is verified with real native height and water probes.
 */
export function createHighflyHuntBrowserSession(
  startLevel: number,
  seed = WORLD_SEED,
): HighflyHuntBrowserSession {
  if (!Number.isInteger(startLevel) || !ALLOWED_START_LEVELS.has(startLevel))
    throw new Error('HF_HUNT_BROWSER_INVALID_BAND');
  if (!Number.isSafeInteger(seed) || seed < 0)
    throw new Error('HF_HUNT_BROWSER_INVALID_SEED');
  const s = HIGHFLY_HUNT_SCENARIOS.find(v => v.minLevel === startLevel);
  if (!s) throw new Error('HF_HUNT_BROWSER_SCENARIO_MISSING');
  // A strictly data-only initial draft allocates no Sim/renderer and does not
  // mutate game state. The native verification below is the actual admission.
  const draft = buildHighflyHuntPlaytestWorld(
    s.id, startLevel, BUILTIN_WORLD, MOBS, originalZoneIds,
    () => ({groundY:8, waterY:-Infinity, walkable:true}),
  );
  const props = {
    ...draft.world.props,
    tents: [{x: -16,z: 30,rot:0,scale:0.9}],
    campfires: [[12, 37]] as [number,number][],
    crates: [[-12, 52]] as [number,number][],
  };
  const world: WorldContent = addHighflyHuntScenery({
    ...draft.world,
    props,
    // Explicit single field: no imported camps, NPCs, bosses or public roads.
    terrainEdits: [
      { x:0, z:128, radius:240, delta:8, falloff:'flat', mode:'level' },
    ],
    // Keep native open-sea detection dry, even along old built-in map coast.
    waterLevel: -20,
  }, s.id);
  const before = getActiveWorldContent();
  setActiveWorldContent(world);
  try {
    const actual = buildHighflyHuntPlaytestWorld(
      s.id, startLevel, world, MOBS, originalZoneIds,
      nativeHighflyHuntSurfaceProbe(seed),
    );
    if (actual.world.camps.length !== world.camps.length
      || actual.world.camps.some((c,i) => c.mobId !== world.camps[i].mobId))
      throw new Error('HF_HUNT_BROWSER_CAMP_DRIFT');
    // Native navigability of each SCENIC road segment (not merely the direct
    // start-to-camp routes checked by the inherited P02B validator).
    const probe=nativeHighflyHuntSurfaceProbe(seed);
    for(const road of world.roads) {
      for(let i=1;i<road.length;i++) {
        const a=road[i-1],b=road[i];
        let previous:number|null=null;
        for(let step=0;step<=32;step++){
          const t=step/32;
          const p=probe(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t);
          if(!p.walkable||!Number.isFinite(p.groundY)||p.groundY<=p.waterY+0.7)
            throw Error('HF_HUNT_SCENIC_ROAD_NOT_WALKABLE');
          if(previous!==null && Math.abs(p.groundY-previous)>0.48*Math.hypot(b.x-a.x,b.z-a.z)/32)
            throw Error('HF_HUNT_SCENIC_ROAD_TOO_STEEP');
          previous=p.groundY;
        }
      }
    }
  } finally {
    setActiveWorldContent(before);
  }
  return {world,seed,hunterLevel:startLevel,scenarioId:s.id};
}

/** Only a known, explicit build-flag AND exact URL parameter can open this.
 * An unconfigured/public V4 build returns null even for ?hfHunt=21.
 */
export function highflyHuntBrowserRequest(
  urlParams: URLSearchParams,
  previewBuildEnabled: boolean,
): HighflyHuntBrowserSession | null {
  if (!previewBuildEnabled || !urlParams.has(HIGHFLY_HUNT_BROWSER_FLAG)) return null;
  const raw = urlParams.get(HIGHFLY_HUNT_BROWSER_FLAG);
  if (!raw || !/^(21|30|40|50|60|70|80|90)$/.test(raw)) return null;
  try {
    return createHighflyHuntBrowserSession(Number(raw));
  } catch {
    return null; // fail closed: never boot unsafe preview geometry
  }
}
