/** HIGHFLY ORIGIN F1 — the one-Hunter birth contract.
 * One compatibility carrier class remains inside ClaudeCraft's Sim. It is NOT
 * the Hunter's identity, not a future skill gate, and never selectable on UI.
 */
export const ORIGIN_HUNTER_CARRIER_CLASS = 'warrior' as const;
export const ORIGIN_F1_SCHEMA = 1 as const;
export const ORIGIN_F1_SCHOOLS = ['warrior','mage','rogue','paladin','hunter','priest','shaman','warlock','druid'] as const;
export const ORIGIN_STARTER_WEAPONS = [
  { id: 'worn_sword', label: 'Espada de viaje' },
  { id: 'rusty_hatchet', label: 'Hacha de viaje' },
  { id: 'training_mace', label: 'Maza de entrenamiento' },
] as const;
export type OriginStarterId = (typeof ORIGIN_STARTER_WEAPONS)[number]['id'];

export interface OriginResources {
  mana: number;
  maxMana: number;
  stamina: number;
  maxStamina: number;
}
export interface OriginF1Save {
  version: typeof ORIGIN_F1_SCHEMA;
  starterClaimed: boolean;
  starterWeaponId: OriginStarterId | null;
  resources: OriginResources;
}

export function f1StartState(): OriginF1Save {
  return { version: ORIGIN_F1_SCHEMA, starterClaimed: false, starterWeaponId: null,
    resources: { mana: 200, maxMana: 200, stamina: 100, maxStamina: 100 } };
}
const finite = (n: unknown, fallback: number): number =>
  typeof n === 'number' && Number.isFinite(n) ? n : fallback;
const clamp = (n: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, n));
export function normalizeOriginF1Save(value: unknown): OriginF1Save | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<OriginF1Save>;
  if (raw.version !== ORIGIN_F1_SCHEMA) return null;
  const fresh = f1StartState();
  const r = raw.resources;
  const maxMana = clamp(finite(r?.maxMana, fresh.resources.maxMana), 10, 10000);
  const maxStamina = clamp(finite(r?.maxStamina, fresh.resources.maxStamina), 10, 10000);
  const starterId = ORIGIN_STARTER_WEAPONS.find(w => w.id === raw.starterWeaponId)?.id ?? null;
  return {
    version: ORIGIN_F1_SCHEMA,
    starterClaimed: raw.starterClaimed === true,
    starterWeaponId: raw.starterClaimed === true ? starterId : null,
    resources: {
      mana: clamp(finite(r?.mana, maxMana), 0, maxMana), maxMana,
      stamina: clamp(finite(r?.stamina, maxStamina), 0, maxStamina), maxStamina,
    },
  };
}
export function tickF1Resources(state: OriginResources, seconds: number): OriginResources {
  const dt = clamp(finite(seconds, 0), 0, 0.25);
  return {
    ...state,
    mana: clamp(state.mana + 4 * dt, 0, state.maxMana),
    stamina: clamp(state.stamina + 10 * dt, 0, state.maxStamina),
  };
}
export function consumeF1Resource(
  state: OriginResources, kind: 'mana'|'stamina', amount: number,
): OriginResources | null {
  if (!Number.isFinite(amount) || amount < 0) return null;
  if (state[kind] + 0.000001 < amount) return null;
  return { ...state, [kind]: Math.max(0, state[kind] - amount) };
}
/** Swap one already-claimed starter for another, never grant an additional
 * weapon. The live Sim verifies and exchanges the actual equipped item. */
export function swapOriginStarter(state: OriginF1Save, itemId: string): OriginF1Save | null {
  if (!state.starterClaimed || state.starterWeaponId === null) return null;
  const starter = ORIGIN_STARTER_WEAPONS.find(w => w.id === itemId);
  if (!starter || starter.id === state.starterWeaponId) return null;
  return { ...state, starterWeaponId: starter.id };
}
export function claimOriginStarter(state: OriginF1Save, itemId: string): OriginF1Save | null {
  if (state.starterClaimed) return null;
  const starter = ORIGIN_STARTER_WEAPONS.find(w => w.id === itemId);
  if (!starter) return null;
  return { ...state, starterClaimed: true, starterWeaponId: starter.id };
}
export function originF1CanMakeFresh(legacySlot: unknown): boolean {
  // Do not silently replace a pre-Foundation Hunter's class-scoped save.
  return legacySlot === null || legacySlot === undefined ||
    normalizeOriginF1Save((legacySlot as {originF1?: unknown}).originF1) !== null;
}
