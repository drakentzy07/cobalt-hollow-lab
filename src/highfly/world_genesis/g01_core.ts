/**
 * HIGHFLY WORLD GENESIS G01 — player identity, not a ClaudeCraft class carrier.
 * Staged pure domain contract. It does not modify the live Sim or existing saves.
 * An eventual game adapter must use one authoritative combat/stat/save pipeline.
 */
export const G01_STAT_NAMES = ['STR', 'AGI', 'VIT', 'PER', 'INT'] as const;
export type G01Stat = (typeof G01_STAT_NAMES)[number];
export type G01StatVector = Record<G01Stat, number>;
export type G01Body = 'male' | 'female';

export interface G01Hunter {
  readonly schemaVersion: 1;
  readonly identity: { readonly hunterId: string; readonly name: string; readonly body: G01Body };
  readonly base: G01StatVector;
  /** Credited exclusively by validated Training Core workouts. */
  readonly training: G01StatVector;
  /** Small, separately audited in-world activity credits, NOT character XP or mastery. */
  readonly adventure: G01StatVector;
}
export const G01_STAT_WEIGHT_EXPERIMENT = { training: 1, adventure: 0.25 } as const;
/** Provisional tuning only: no effect on production balance or persistent data. */
const ZERO = (): G01StatVector => ({ STR: 0, AGI: 0, VIT: 0, PER: 0, INT: 0 });
const BASE = (): G01StatVector => ({ STR: 10, AGI: 10, VIT: 10, PER: 10, INT: 10 });

export function createG01Hunter(hunterId: string, name: string, body: G01Body): G01Hunter {
  if (!hunterId.trim() || !name.trim() || (body !== 'male' && body !== 'female')) {
    throw new Error('G01: identity requires a Hunter id, name and male/female body');
  }
  return {
    schemaVersion: 1,
    identity: { hunterId: hunterId.trim(), name: name.trim(), body },
    base: BASE(),
    training: ZERO(),
    adventure: ZERO(),
  };
}
export function creditG01Stat(
  profile: G01Hunter, channel: 'training' | 'adventure', stat: G01Stat, amount: number,
): G01Hunter {
  if (!G01_STAT_NAMES.includes(stat) || !Number.isFinite(amount) || amount <= 0) {
    throw new Error('G01: only positive finite credits to the five universal stats');
  }
  return {
    ...profile,
    [channel]: { ...profile[channel], [stat]: profile[channel][stat] + amount },
  };
}
export function deriveG01Stats(profile: G01Hunter): G01StatVector {
  const result = BASE();
  for (const stat of G01_STAT_NAMES) {
    const base = profile.base[stat], train = profile.training[stat], adventure = profile.adventure[stat];
    if (![base, train, adventure].every(n => Number.isFinite(n) && n >= 0)) {
      throw new Error('G01: invalid stat ledger');
    }
    result[stat] = Math.round(100 * (
      base + train * G01_STAT_WEIGHT_EXPERIMENT.training +
      adventure * G01_STAT_WEIGHT_EXPERIMENT.adventure
    )) / 100;
  }
  return result;
}
