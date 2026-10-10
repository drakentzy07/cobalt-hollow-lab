/** HIGHFLY P02A: zone/encounter authoring contract LV21–99.
 * No camps are installed into the default world: V4 level zones require terrain,
 * access, nav and mobile validation. Geometry is always supplied by a caller.
 * Source of truth remains ClaudeCraft Sim spawning and original MOBS.
 */
import type { CampDef, MobTemplate, ZoneDef } from '../../sim/types';
import { HIGHFLY_MONSTER_BANDS, highflyMonsterId } from './level99';

type HuntBiome = 'haunt' | 'marsh' | 'peaks' | 'frost' | 'ember' | 'garden' | 'gale' | 'vale';
export interface HighflyHuntScenario {
  readonly id: string;
  readonly title: string;
  readonly minLevel: number;
  readonly maxLevel: number;
  readonly biome: HuntBiome;
  /** A progression tier label, not an override to the Hunter's rank. */
  readonly tierLabel: string;
  /** Meaningful habitats and adaptations for re-used ClaudeCraft mobs. */
  readonly families: readonly string[];
  /** Max simultaneous nonboss inhabitants of this scenario, Android conservative. */
  readonly populationBudget: number;
  readonly requiresWorldGate: true;
}
export const HIGHFLY_HUNT_SCENARIOS: readonly HighflyHuntScenario[] = [
  { id: 'hf_hunt_woods_21', title: 'Umbral de los Aullidos', minLevel: 21, maxLevel: 29, biome: 'haunt', tierLabel: 'E-D', families: ['wolf', 'spider', 'skeleton', 'stalker'], populationBudget: 8, requiresWorldGate: true },
  { id: 'hf_hunt_fen_30', title: 'Marisma del Velo', minLevel: 30, maxLevel: 39, biome: 'marsh', tierLabel: 'D', families: ['spider', 'wolf', 'revenant', 'elemental'], populationBudget: 8, requiresWorldGate: true },
  { id: 'hf_hunt_crag_40', title: 'Desfiladero Colmillo', minLevel: 40, maxLevel: 49, biome: 'peaks', tierLabel: 'C', families: ['ogre', 'stalker', 'skeleton', 'elemental'], populationBudget: 8, requiresWorldGate: true },
  { id: 'hf_hunt_frost_50', title: 'Tundra del Silencio', minLevel: 50, maxLevel: 59, biome: 'frost', tierLabel: 'B', families: ['wolf', 'stalker', 'revenant', 'elemental'], populationBudget: 8, requiresWorldGate: true },
  { id: 'hf_hunt_ash_60', title: 'Yermo de las Escamas', minLevel: 60, maxLevel: 69, biome: 'ember', tierLabel: 'B-A', families: ['dragonkin', 'ogre', 'elemental', 'revenant'], populationBudget: 8, requiresWorldGate: true },
  { id: 'hf_hunt_garden_70', title: 'Jardín Marchito', minLevel: 70, maxLevel: 79, biome: 'garden', tierLabel: 'A', families: ['spider', 'wolf', 'elemental', 'revenant'], populationBudget: 8, requiresWorldGate: true },
  { id: 'hf_hunt_storm_80', title: 'Cresta del Trueno', minLevel: 80, maxLevel: 89, biome: 'gale', tierLabel: 'S', families: ['elemental', 'dragonkin', 'ogre', 'stalker'], populationBudget: 8, requiresWorldGate: true },
  { id: 'hf_hunt_abyss_90', title: 'Orilla del Abismo', minLevel: 90, maxLevel: 99, biome: 'haunt', tierLabel: 'S-Nacional', families: ['dragonkin', 'revenant', 'skeleton', 'ogre'], populationBudget: 8, requiresWorldGate: true },
] as const;

export interface HighflyHuntPlacement {
  readonly scenarioId: string;
  readonly zoneId: string;
  /** Positions must be authored inside a validated, NEW high-level zone. */
  readonly camps: ReadonlyArray<{ readonly family: string; readonly x: number; readonly z: number; readonly radius: number; readonly count: number }>;
}
export interface HighflyHuntPrepared {
  readonly scenarioId: string;
  readonly zoneId: string;
  readonly camps: readonly CampDef[];
}

/** Fail closed when a stage is placed in an original zone, missing new terrain,
 * uses IDs from a different level band, or exceeds phone population budget.
 * Does not mutate the donor's arrays or spawn any mob.
 */
export function prepareHighflyHuntCamps(
  placement: HighflyHuntPlacement,
  zones: readonly ZoneDef[],
  mobs: Readonly<Record<string, MobTemplate>>,
  originalZoneIds: ReadonlySet<string>,
): HighflyHuntPrepared {
  const scenario = HIGHFLY_HUNT_SCENARIOS.find(s => s.id === placement.scenarioId);
  if (!scenario) throw new Error('HF_HUNT_UNKNOWN_SCENARIO');
  if (originalZoneIds.has(placement.zoneId)) throw new Error('HF_HUNT_DONOR_ZONE_FORBIDDEN');
  const zone = zones.find(z => z.id === placement.zoneId);
  if (!zone || zone.levelRange[0] !== scenario.minLevel || zone.levelRange[1] !== scenario.maxLevel
    || zone.biome !== scenario.biome) throw new Error('HF_HUNT_ZONE_NOT_CERTIFIED');
  if (!placement.camps.length || placement.camps.length > scenario.families.length)
    throw new Error('HF_HUNT_CAMP_COUNT_INVALID');
  const families = new Set<string>();
  let population = 0;
  const camps: CampDef[] = [];
  for (const c of placement.camps) {
    if (!scenario.families.includes(c.family) || families.has(c.family))
      throw new Error('HF_HUNT_FAMILY_INVALID');
    families.add(c.family);
    if (![c.x, c.z, c.radius, c.count].every(Number.isFinite) || !Number.isInteger(c.count)
      || c.count < 1 || c.radius < 0 || c.radius > 18)
      throw new Error('HF_HUNT_CAMP_GEOMETRY_INVALID');
    population += c.count;
    // Whole camp scatter including nearest-neighbor jitter must be inside the
    // actual rectangular zone. A terrain/water/nav gate still has to run.
    if (c.x - c.radius < (zone.xMin ?? -180) + 20 ||
      c.x + c.radius >= (zone.xMax ?? 180) - 20 ||
      c.z - c.radius < zone.zMin + 20 ||
      c.z + c.radius >= zone.zMax - 20)
      throw new Error('HF_HUNT_CAMP_OUTSIDE_ZONE');
    const mobId = highflyMonsterId(c.family, scenario.minLevel);
    const mob = mobs[mobId];
    if (!mob || mob.minLevel !== scenario.minLevel || mob.maxLevel !== scenario.maxLevel)
      throw new Error('HF_HUNT_MOB_NOT_REGISTERED');
    camps.push({ mobId, center: {x:c.x,z:c.z}, radius:c.radius, count:c.count, offStream:true });
  }
  if (population > scenario.populationBudget) throw new Error('HF_HUNT_PHONE_POPULATION_EXCEEDED');
  return {scenarioId:scenario.id,zoneId:placement.zoneId,camps};
}
export function highflyHuntCoverageValid(): boolean {
  return HIGHFLY_HUNT_SCENARIOS.length === HIGHFLY_MONSTER_BANDS.length
    && HIGHFLY_HUNT_SCENARIOS.every((s,i) => s.minLevel===HIGHFLY_MONSTER_BANDS[i]?.[0]
      && s.maxLevel===HIGHFLY_MONSTER_BANDS[i]?.[1]
      && s.populationBudget<=8 && s.requiresWorldGate);
}
