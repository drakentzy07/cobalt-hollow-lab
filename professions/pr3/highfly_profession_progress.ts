/**
 * HIGHFLY PR-3 — additive profession XP and deterministic Practice Mastery.
 *
 * Claude's craftSkills / character XP / output / RNG remain authoritative.
 * This first activation records actual XP earned from a COMMITTED craft.
 * PR-4 will introduce XP -> skill promotion gates; NEVER gate here prematurely.
 * No direct primary-stat gains, no RNG draws, no wall-clock dependency.
 */
import { CRAFT_RING } from '../content/professions';
import type { SavedHighflyProfessionStateV1 } from './highfly_profession_state';

export const HIGHFLY_BASE_PROFESSION_XP = 1000;
export const HIGHFLY_PROFESSION_XP_STORAGE_CAP = 1_000_000_000_000;
export const HIGHFLY_PRACTICE_SATURATION = 31;
const MAX_KEYS = 256;
const ID = /^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,127}$/;

/** DESIGN ESTIMATE, not a frozen pacing decision, and not a skill gate in PR-3. */
export const HIGHFLY_PROFESSION_XP_CURVE_DRAFT = [
  { skillFrom: 1, skillTo: 24, xp: 111_500 },
  { skillFrom: 25, skillTo: 49, xp: 200_000 },
  { skillFrom: 50, skillTo: 74, xp: 350_000 },
  { skillFrom: 75, skillTo: 99, xp: 600_000 },
  { skillFrom: 100, skillTo: 124, xp: 1_000_000 },
] as const;

export function professionXpCurvePreview(skill: number): number {
  if (!Number.isFinite(skill)) return 0;
  const s = Math.max(1, Math.min(125, skill));
  let total = 0;
  for (const band of HIGHFLY_PROFESSION_XP_CURVE_DRAFT) {
    const steps = band.skillTo - band.skillFrom + 1;
    const covered = Math.max(0, Math.min(steps, s - band.skillFrom));
    total += band.xp * covered / steps;
  }
  return total;
}

/** Upcoming craft attempt number (1-based), using bounded saved count. */
export function practiceMultiplier(previousCount: number): number {
  const n = Math.max(0, Math.min(HIGHFLY_PRACTICE_SATURATION,
    Number.isFinite(previousCount) ? Math.floor(previousCount) : 0)) + 1;
  if (n === 1) return 1.5;
  if (n <= 5) return 1;
  if (n <= 15) return 0.75;
  if (n <= 30) return 0.5;
  return 0.25;
}

export interface ProfessionLearningEvent {
  professionId: string;
  /** The actually applied post-clamp Claude gain delta. */
  skillDelta: number;
  /** Stable content identity, e.g. recipe:recipe_tough_jerky. */
  practiceKey: string;
}

export interface ProfessionLearningResult {
  professionXpGranted: number;
  skillDelta: number;
  learningCredit: number;
  promotionReady: false; // Trial engine arrives in PR-4.
  state?: SavedHighflyProfessionStateV1;
}

/** Invoked only AFTER successful craft item commit, never on denied attempts. */
export function recordHighflyProfessionProgress(
  existing: SavedHighflyProfessionStateV1 | undefined,
  event: ProfessionLearningEvent,
): ProfessionLearningResult {
  const delta = Number.isFinite(event.skillDelta) && event.skillDelta > 0
    ? Math.min(1, event.skillDelta)
    : 0;
  const empty: ProfessionLearningResult = {
    professionXpGranted: 0, skillDelta: delta,
    learningCredit: delta, promotionReady: false,
    state: existing,
  };
  if (!CRAFT_RING.some(c => c.id === event.professionId)) return empty;
  if (!ID.test(event.practiceKey) ||
      event.practiceKey === '__proto__' ||
      event.practiceKey === 'constructor' ||
      event.practiceKey === 'prototype') return empty;

  const before = existing?.practice?.[event.practiceKey] ?? 0;
  const practice = { ...(existing?.practice ?? {}) };
  const craftXp = { ...(existing?.craftXp ?? {}) };
  if (!(event.practiceKey in practice) && Object.keys(practice).length >= MAX_KEYS)
    return empty;
  const oldCount = Number.isFinite(before) && before >= 0 ? before : 0;
  const xpRaw = Math.round(HIGHFLY_BASE_PROFESSION_XP * delta * practiceMultiplier(oldCount));
  const priorXpRaw = craftXp[event.professionId] ?? 0;
  const previousXp = Number.isFinite(priorXpRaw) && priorXpRaw >= 0 ? priorXpRaw : 0;
  const granted = Math.min(xpRaw, Math.max(0, HIGHFLY_PROFESSION_XP_STORAGE_CAP - previousXp));

  // Count successful attempts (including gray / cap attempts) so players
  // cannot reset first-craft bonuses by intentionally crafting easy items.
  practice[event.practiceKey] = Math.min(HIGHFLY_PRACTICE_SATURATION, Math.floor(oldCount) + 1);
  if (granted > 0) craftXp[event.professionId] = previousXp + granted;
  const state: SavedHighflyProfessionStateV1 = {
    ...(existing ?? { version: 1 }),
    version: 1,
    ...(granted > 0 ? { craftXp } : {}),
    practice,
  };
  return {
    professionXpGranted: granted, skillDelta: delta,
    learningCredit: delta, promotionReady: false, state,
  };
}
