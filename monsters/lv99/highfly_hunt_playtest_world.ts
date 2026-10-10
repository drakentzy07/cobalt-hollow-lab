/** HIGHFLY P02-B — opt-in hunting INSTANCE world for native Sim/renderer playtests.
 * NEVER appends to the shipped ZONES/CAMPS or changes default world creation.
 * A host must validate actual terrain/water/navigation before opening this world.
 * This is a custom WorldContent playtest, NOT a V4 public travel portal.
 */
import { emptyZoneProps } from '../../sim/types';
import type { MobTemplate, WorldContent, ZoneDef } from '../../sim/types';
import { HIGHFLY_HUNT_SCENARIOS, prepareHighflyHuntCamps } from './hunt_scenarios';

export interface HighflyHuntSurface {
  readonly groundY: number;
  readonly waterY: number;
  readonly walkable: boolean;
}
/** Host must sample the SAME world/seed used by both terrain and Sim.
 * waterY can be -Infinity to denote dry land, like native waterLevelAt().
 */
export type HighflyHuntSurfaceProbe = (x: number, z: number) => HighflyHuntSurface;
export interface HighflyHuntPlaytest {
  readonly scenarioId: string;
  readonly zoneId: string;
  readonly start: Readonly<{ x: number; z: number }>;
  readonly world: WorldContent;
}

const HUNT_START = Object.freeze({ x: 0, z: 38 });
const CAMP_X = [-108, -36, 36, 108] as const;
const CAMP_Z = 164;
const CAMP_RADIUS = 7;

/** Check accessible direct routes plus the complete scatter footprint.
 * Reject unwalkable/wet surfaces, cliffs, NaN, and interrupted routes.
 * Not a substitute for human Android navigation or actual GLB visuals.
 */
function requireSafeSurface(probe: HighflyHuntSurfaceProbe, destX: number, destZ: number): void {
  const dx = destX - HUNT_START.x;
  const dz = destZ - HUNT_START.z;
  let previous: HighflyHuntSurface | null = null;
  for (let step = 0; step <= 32; step++) {
    const t = step / 32;
    const point = probe(HUNT_START.x + dx * t, HUNT_START.z + dz * t);
    if (!point || !Number.isFinite(point.groundY)
      || !(Number.isFinite(point.waterY) || point.waterY === -Infinity)
      || point.walkable !== true || point.groundY <= point.waterY + 0.7) {
      throw new Error('HF_HUNT_SURFACE_UNSAFE');
    }
    if (previous) {
      const stride = Math.hypot(dx, dz) / 32;
      if (stride <= 0 || Math.abs(point.groundY - previous.groundY) / stride > 0.48)
        throw new Error('HF_HUNT_ROUTE_TOO_STEEP');
    }
    previous = point;
  }
}

/** Fully isolated 8-mob WorldContent, one of eight level bands at a time.
 * Only construct when caller provides the actual preview seed's terrain probe.
 * Default live map, quests, NPCs, professions, bags, XP and Training untouched.
 */
export function buildHighflyHuntPlaytestWorld(
  scenarioId: string,
  hunterLevel: number,
  sourceWorld: WorldContent,
  mobs: Readonly<Record<string, MobTemplate>>,
  originalZoneIds: ReadonlySet<string>,
  surface: HighflyHuntSurfaceProbe,
): HighflyHuntPlaytest {
  const scenario = HIGHFLY_HUNT_SCENARIOS.find(s => s.id === scenarioId);
  if (!scenario) throw new Error('HF_HUNT_UNKNOWN_SCENARIO');
  if (!Number.isInteger(hunterLevel) || hunterLevel < scenario.minLevel || hunterLevel > 99)
    throw new Error('HF_HUNT_HUNTER_LEVEL_LOCKED');
  if (typeof surface !== 'function') throw new Error('HF_HUNT_SURFACE_PROBE_REQUIRED');
  const zoneId = scenario.id + '_playtest';
  const zone: ZoneDef = {
    id: zoneId, name: scenario.title, biome: scenario.biome,
    xMin: -170, xMax: 170, zMin: 0, zMax: 260,
    levelRange: [scenario.minLevel, scenario.maxLevel],
    hub: { ...HUNT_START, radius: 14, name: 'Refugio del Hunter' },
    graveyard: { x: 0, z: 45 }, lakes: [],
    pois: [{ x: 0, z: 38, id: zoneId + '_camp', label: 'Refugio de caza' }],
    welcome: scenario.title,
    worldPvp: 'sanctuary',
    riftPortalEligible: false,
  };
  const prepared = prepareHighflyHuntCamps({
    scenarioId, zoneId,
    camps: scenario.families.map((family, i) => ({
      family, x: CAMP_X[i], z: CAMP_Z, radius: CAMP_RADIUS, count: 2,
    })),
  }, [zone], mobs, originalZoneIds);
  requireSafeSurface(surface, HUNT_START.x, HUNT_START.z + 8);
  for (const camp of prepared.camps) {
    requireSafeSurface(surface, camp.center.x, camp.center.z);
    for (const [x, z] of [[camp.center.x - camp.radius, camp.center.z],
                           [camp.center.x + camp.radius, camp.center.z],
                           [camp.center.x, camp.center.z - camp.radius],
                           [camp.center.x, camp.center.z + camp.radius]]) {
      requireSafeSurface(surface, x, z);
    }
  }
  // Source supplies only the interface defaults; NO source-world arrays are mutated.
  // Empty ZoneProps keeps old settlements/props out of this stand-alone instance.
  const world: WorldContent = {
    ...sourceWorld,
    zones: [zone],
    camps: [...prepared.camps],
    npcs: {},
    groundObjects: [],
    roads: [],
    props: emptyZoneProps(),
    playerStart: { ...HUNT_START },
    services: undefined,
    placements: [],
    blockers: [],
    terrainEdits: [],
    biomePaint: undefined,
  };
  return { scenarioId, zoneId, start: { ...HUNT_START }, world };
}
