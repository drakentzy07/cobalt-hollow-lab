import { describe, expect, it } from 'vitest';
import {
  HIGHFLY_DONOR_XP_1_TO_20,
  HIGHFLY_PF6_EXTENDED_ENABLED,
  HIGHFLY_PF6_NORMAL_MAX_LEVEL,
  HIGHFLY_PF6_XP_TABLE,
  highflyPf6CumulativeXpToLevel,
  highflyPf6ResolveLevelAfterXp,
  highflyPf6XpForLevel,
} from '../src/highfly/training/pf6_xp_curve';

describe('HIGHFLY PF-6 isolated XP curve and hard LV99 cap', () => {
  it('keeps every historical ClaudeCraft LV1-20 cost', () => {
    expect(HIGHFLY_PF6_XP_TABLE.slice(0, 20)).toEqual(HIGHFLY_DONOR_XP_1_TO_20);
    expect(highflyPf6XpForLevel(1)).toBe(400);
    expect(highflyPf6XpForLevel(20)).toBe(23200);
  });

  it('is deterministic, strictly increasing, positive and safe for 1-99', () => {
    expect(HIGHFLY_PF6_NORMAL_MAX_LEVEL).toBe(99);
    expect(HIGHFLY_PF6_XP_TABLE).toHaveLength(99);
    for (let index = 0; index < HIGHFLY_PF6_XP_TABLE.length; index++) {
      const cost = HIGHFLY_PF6_XP_TABLE[index];
      expect(Number.isSafeInteger(cost)).toBe(true);
      expect(cost).toBeGreaterThan(0);
      if (index > 0) expect(cost).toBeGreaterThan(HIGHFLY_PF6_XP_TABLE[index - 1]);
    }
    expect(highflyPf6XpForLevel(99)).toBeLessThan(500_000);
    expect(highflyPf6CumulativeXpToLevel(99)).toBeGreaterThan(1_000_000);
    expect(Number.isSafeInteger(highflyPf6CumulativeXpToLevel(99))).toBe(true);
  });

  it('computes cumulative XP exactly, with no extra threshold at level 1', () => {
    expect(highflyPf6CumulativeXpToLevel(1)).toBe(0);
    expect(highflyPf6CumulativeXpToLevel(2)).toBe(400);
    expect(highflyPf6CumulativeXpToLevel(3)).toBe(1300);
    for (let level = 1; level < 99; level++) {
      expect(highflyPf6CumulativeXpToLevel(level + 1) - highflyPf6CumulativeXpToLevel(level))
        .toBe(highflyPf6XpForLevel(level));
    }
  });

  it('supports exact leveling, leftover XP, and multi-level grants', () => {
    expect(highflyPf6ResolveLevelAfterXp(1, 0, 399)).toEqual({ level: 1, barXp: 399 });
    expect(highflyPf6ResolveLevelAfterXp(1, 399, 1)).toEqual({ level: 2, barXp: 0 });
    expect(highflyPf6ResolveLevelAfterXp(1, 0, 400 + 900 + 25))
      .toEqual({ level: 3, barXp: 25 });
    expect(highflyPf6ResolveLevelAfterXp(98, 0, highflyPf6XpForLevel(98) - 1))
      .toEqual({ level: 98, barXp: highflyPf6XpForLevel(98) - 1 });
  });

  it('never enters Extended or leaves residual XP at LV99', () => {
    expect(HIGHFLY_PF6_EXTENDED_ENABLED).toBe(false);
    expect(highflyPf6ResolveLevelAfterXp(98, 0, highflyPf6XpForLevel(98) + 9000))
      .toEqual({ level: 99, barXp: 0 });
    expect(highflyPf6ResolveLevelAfterXp(99, 5000, 1000000))
      .toEqual({ level: 99, barXp: 0 });
    expect(highflyPf6XpForLevel(999)).toBe(highflyPf6XpForLevel(99));
  });

  it('sanitizes malformed inputs safely, without minting XP', () => {
    expect(highflyPf6ResolveLevelAfterXp(-999, NaN, -100)).toEqual({ level: 1, barXp: 0 });
    expect(highflyPf6ResolveLevelAfterXp(1, 0, Number.POSITIVE_INFINITY))
      .toEqual({ level: 1, barXp: 0 });
    expect(highflyPf6CumulativeXpToLevel(Number.NaN)).toBe(0);
  });
});
