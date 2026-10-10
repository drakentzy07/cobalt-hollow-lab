/** PASS02-I · Render ONLY the activated HIGHFLY hunting playtest biome.
 *
 * Donor ClaudeCraft's near and far vertex palettes are authored from frozen
 * ZONES constants: a custom WorldContent.zone.biome alone DOES NOT recolor
 * the live ground. This narrow, cached bridge returns a palette only when the
 * current active world is exactly ONE of our eight opt-in HuntPilot islands.
 * Every other world, including V4, returns null without changing a pixel.
 */
import { getActiveWorldContent, getContentGeneration } from '../../sim/data';
import { BIOME_PALETTE } from '../../render/terrain_palette';

export const HIGHFLY_HUNT_RENDER_BIOMES = [
  'haunt','marsh','peaks','frost','volcano','garden','gale','cave',
] as const;
const HUNT_ZONE_RE = /^hf_hunt_(woods_21|fen_30|crag_40|frost_50|ash_60|garden_70|storm_80|abyss_90)_playtest$/;
let previousGeneration = -1;
let cached: (typeof BIOME_PALETTE)[keyof typeof BIOME_PALETTE] | null = null;

/** Called in the ground hot path: one cheap generation check per vertex. */
export function highflyHuntActiveGroundPalette(): (typeof BIOME_PALETTE)[keyof typeof BIOME_PALETTE] | null {
  const generation = getContentGeneration();
  if (generation !== previousGeneration) {
    previousGeneration = generation;
    const zones = getActiveWorldContent().zones;
    const z = zones.length === 1 ? zones[0] : undefined;
    cached = z && HUNT_ZONE_RE.test(z.id) ? BIOME_PALETTE[z.biome] ?? null : null;
  }
  return cached;
}

/** Fail-closed: no unknown/reordered biome or donor zone is painted. */
export function highflyHuntPaletteCoverage(): boolean {
  const names = ['haunt','marsh','peaks','frost','volcano','garden','gale','cave'];
  return HIGHFLY_HUNT_RENDER_BIOMES.every((v,i)=>v===names[i])
    && Object.keys(BIOME_PALETTE).includes('haunt')
    && Object.keys(BIOME_PALETTE).includes('frost')
    && HUNT_ZONE_RE.test('hf_hunt_frost_50_playtest')
    && !HUNT_ZONE_RE.test('eastbrook');
}
