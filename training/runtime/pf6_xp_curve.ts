/**
 * HIGHFLY PF-6: proposed canonical LV1→99 XP threshold schedule.
 *
 * The original ClaudeCraft 1→20 XP costs stay byte-for-byte identical.
 * For level >=21, use deliberately smooth quadratic growth, avoiding a
 * runaway exponential grind while preserving a long LV99 journey.
 *
 * This module is inert until the PF-6 runtime integration replaces the
 * donor XP_TABLE/xpForLevel authority with this single table.
 * Training rewards NEVER mint this XP.
 */
export const HIGHFLY_PF6_NORMAL_MAX_LEVEL = 99 as const;
export const HIGHFLY_PF6_EXTENDED_ENABLED = false as const;

export const HIGHFLY_DONOR_XP_1_TO_20: readonly number[] = Object.freeze([
  400, 900, 1400, 2100, 2800, 3600, 4500, 5400, 6500, 7600,
  8800, 10100, 11400, 12900, 14400, 16000, 17700, 19400, 21300, 23200,
]);

/** Cost from level L to L+1. The final LV99 cost is retained for donor
 * compatibility but never grants LV100 when Extended is disabled. */
export const HIGHFLY_PF6_XP_TABLE: readonly number[] = Object.freeze(
  Array.from({ length: HIGHFLY_PF6_NORMAL_MAX_LEVEL }, (_, index) => {
    const level = index + 1;
    if (level <= HIGHFLY_DONOR_XP_1_TO_20.length) {
      return HIGHFLY_DONOR_XP_1_TO_20[index];
    }
    const delta = level - 20;
    return Math.round((23200 + 1800 * delta + 45 * delta * delta) / 100) * 100;
  }),
);

function normalizedLevel(level: number): number {
  if (!Number.isFinite(level)) return 1;
  return Math.max(1, Math.min(HIGHFLY_PF6_NORMAL_MAX_LEVEL, Math.trunc(level)));
}

export function highflyPf6XpForLevel(level: number): number {
  return HIGHFLY_PF6_XP_TABLE[normalizedLevel(level) - 1];
}

/** Lifetime XP necessary to enter a level, not its current bar XP. */
export function highflyPf6CumulativeXpToLevel(level: number): number {
  const target = normalizedLevel(level);
  let total = 0;
  for (let i = 0; i < target - 1; i++) {
    total += HIGHFLY_PF6_XP_TABLE[i];
  }
  return total;
}

/** Offline-safe pure preview; grantXp remains the single gameplay authority. */
export function highflyPf6ResolveLevelAfterXp(
  currentLevel: number,
  currentBarXp: number,
  awardedXp: number,
): { level: number; barXp: number } {
  let level = normalizedLevel(currentLevel);
  let barXp = Number.isFinite(currentBarXp) ? Math.max(0, Math.floor(currentBarXp)) : 0;
  const gain = Number.isFinite(awardedXp) ? Math.max(0, Math.floor(awardedXp)) : 0;
  if (level >= HIGHFLY_PF6_NORMAL_MAX_LEVEL) {
    return { level: HIGHFLY_PF6_NORMAL_MAX_LEVEL, barXp: 0 };
  }
  barXp += gain;
  while (level < HIGHFLY_PF6_NORMAL_MAX_LEVEL && barXp >= highflyPf6XpForLevel(level)) {
    barXp -= highflyPf6XpForLevel(level);
    level++;
  }
  return { level, barXp: level === HIGHFLY_PF6_NORMAL_MAX_LEVEL ? 0 : barXp };
}
