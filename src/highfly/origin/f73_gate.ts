/** HIGHFLY ORIGIN Gate 01: shared ClaudeCraft instancing, not a second world.
 * Walk-up portal off Highwatch's eastern approach (-X). LAB has an optional
 * instant-entry shortcut. All combat/loot/professions use native Sim authority.
 *
 * Index 15 is the first available dungeon overflow band: 14 belongs to
 * Ignivar's Forge-Lift. The pre-existing instance origins remain untouched.
 */
import type { DungeonDef, DungeonSpawn } from '../../sim/types';

export const HIGHFLY_GATE_ID = 'hf_gate_colmillo_gris';
export const HIGHFLY_GATE_DOOR = { x: -20, z: 689 } as const;

/** Three deliberate stages inside ClaudeCraft's existing 131yd crypt layout.
 * All spawns stay inside the centre lane (the existing pillars are at +/-14).
 * The entrance at local z=-2 is well clear of the first pack at z=18.
 * Pack spacing limits simultaneous aggro: no new overworld camp overlaps.
 */
export const HIGHFLY_GATE_SPAWNS: DungeonSpawn[] = [
  // Approach: five level 21–24 ridge hounds, two controllable pulls.
  { mobId: 'hf_f72_ridge_hound', x: -6, z: 18, packId: 'hound_a', idleStationary: true },
  { mobId: 'hf_f72_ridge_hound', x: 0, z: 19, packId: 'hound_a', idleStationary: true },
  { mobId: 'hf_f72_ridge_hound', x: 6, z: 18, packId: 'hound_a', idleStationary: true },
  { mobId: 'hf_f72_ridge_hound', x: -5, z: 38, packId: 'hound_b', idleStationary: true },
  { mobId: 'hf_f72_ridge_hound', x: 5, z: 38, packId: 'hound_b', idleStationary: true },

  // Deep gallery: five level 25–28 burrowers, two more pulls.
  { mobId: 'hf_f72_crag_burrower', x: -6, z: 57, packId: 'crag_a', idleStationary: true },
  { mobId: 'hf_f72_crag_burrower', x: 0, z: 58, packId: 'crag_a', idleStationary: true },
  { mobId: 'hf_f72_crag_burrower', x: 6, z: 57, packId: 'crag_a', idleStationary: true },
  { mobId: 'hf_f72_crag_burrower', x: -5, z: 76, packId: 'crag_b', idleStationary: true },
  { mobId: 'hf_f72_crag_burrower', x: 5, z: 76, packId: 'crag_b', idleStationary: true },

  // Finale: the level-30 named captain, on the existing raised dais.
  { mobId: 'hf_f72_ridge_captain', x: 0, z: 96, packId: 'finale', idleStationary: true },
];

export const HIGHFLY_GATE_DUNGEONS: Record<string, DungeonDef> = {
  [HIGHFLY_GATE_ID]: {
    id: HIGHFLY_GATE_ID,
    name: 'HIGHFLY · Grieta del Colmillo Gris (LV21–30)',
    index: 15,
    doorPos: HIGHFLY_GATE_DOOR,
    leaveOffset: { x: -3, z: -5 },
    entry: { x: 0, z: -2 },
    exitOffset: { x: 0, z: -6 },
    bossExitPortal: { x: 0, z: 105 },
    finalBossId: 'hf_f72_ridge_captain',
    spawns: HIGHFLY_GATE_SPAWNS,
    interior: 'crypt',
    tombDressing: 'cargo',
    suggestedPlayers: 1,
    enterText: 'HIGHFLY · Atravesás la Grieta del Colmillo Gris. Tu cacería comienza.',
    leaveText: 'HIGHFLY · Regresás a Highwatch con lo que hayas ganado.',
  },
};
