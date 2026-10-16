/**
 * HIGHFLY ORIGIN R32 - pure, side-effect-free HUD projection.
 * No DOM, Sim, storage, saves, rewards or unlock authority.
 * The caller MUST supply UNIQUE unlocks already validated by the authoritative Sim.
 * Until the first discovery, no unique-slot property exists in the public model.
 */
export const R32_BASE_SLOT_COUNT = 4;
export const R32_UNIQUE_SLOT_CAP = 3;

const distinctIds = (values) => {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.filter((v) => typeof v === 'string' && v.length > 0))];
};

export function projectR32CombatHud({
  baseEquippedIds = [],
  validatedUniqueUnlockIds = [],
  uniqueEquippedIds = [],
} = {}) {
  const base = distinctIds(baseEquippedIds).slice(0, R32_BASE_SLOT_COUNT);
  const unlocked = distinctIds(validatedUniqueUnlockIds).slice(0, R32_UNIQUE_SLOT_CAP);
  const chosen = distinctIds(uniqueEquippedIds).filter((id) => unlocked.includes(id));
  const model = {
    baseSlots: Array.from({length: R32_BASE_SLOT_COUNT}, (_, slot) => ({
      slot: slot + 1, abilityId: base[slot] ?? null,
    })),
    controls: Object.freeze(['move', 'camera', 'attack', 'dash', 'jump', 'aux']),
  };
  if (unlocked.length > 0) {
    model.uniqueSlots = unlocked.map((_, slot) => ({
      slot: slot + 1, abilityId: chosen[slot] ?? null,
    }));
  }
  return model;
}
