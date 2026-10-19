import { describe, expect, it } from 'vitest';
import {
  HIGHFLY_CORE_STATS,
  HIGHFLY_TRAINING_SCORING_VERSION,
  allocateTrainingPoints,
  createHighflyHunterProfile,
  earnTrainingPoints,
  useFreeTrainingReset,
} from '../src/highfly/training/core';

const proof = {
  source: 'training-performance-gate' as const,
  scoringVersion: HIGHFLY_TRAINING_SCORING_VERSION,
  evidenceId: 'pf4-reset-proof',
};

describe('HIGHFLY Progression Foundation PF-4 Training respec', () => {
  it('returns every allocated TP to the wallet without touching Awakening or Natural Level Growth', () => {
    const base = createHighflyHunterProfile({
      profileId: 'pf4-free-reset',
      classId: 'warrior',
      level: 50,
    });
    const earned = earnTrainingPoints(base, 6.25, proof);
    const str = allocateTrainingPoints(earned, 'STR', 4);
    const allocated = allocateTrainingPoints(str, 'INT', 2.25);

    const awakeningBefore = structuredClone(allocated.awakening);
    const naturalBefore = Object.fromEntries(
      HIGHFLY_CORE_STATS.map((stat) => [stat, allocated.training.core[stat].naturalLevelGrowth]),
    );
    const peaksBefore = Object.fromEntries(
      HIGHFLY_CORE_STATS.map((stat) => [stat, allocated.training.core[stat].peak]),
    );

    const reset = useFreeTrainingReset(allocated);

    expect(reset.awakening).toEqual(awakeningBefore);
    expect(reset.hunter.level).toBe(50);
    expect(reset.training.points.earned).toBeCloseTo(6.25, 10);
    expect(reset.training.points.available).toBeCloseTo(6.25, 10);
    expect(reset.training.points.freeResetUsed).toBe(true);

    for (const stat of HIGHFLY_CORE_STATS) {
      const state = reset.training.core[stat];
      expect(state.naturalLevelGrowth).toBeCloseTo(naturalBefore[stat] as number, 10);
      expect(state.trainingAllocated).toBe(0);
      expect(state.trainingGrowth).toBe(0);
      expect(reset.training.points.allocated[stat]).toBe(0);
      expect(state.current).toBeCloseTo(state.awakeningBase + state.naturalLevelGrowth, 10);
      expect(state.peak).toBeCloseTo(peaksBefore[stat] as number, 10);
    }
  });

  it('cannot consume the free reset twice', () => {
    const base = createHighflyHunterProfile({ profileId: 'pf4-once', classId: 'mage' });
    const earned = earnTrainingPoints(base, 1, proof);
    const allocated = allocateTrainingPoints(earned, 'VIT', 1);
    const reset = useFreeTrainingReset(allocated);

    expect(() => useFreeTrainingReset(reset)).toThrow(/already been used/);
  });

  it('does not waste the free reset when nothing is allocated', () => {
    const base = createHighflyHunterProfile({ profileId: 'pf4-empty', classId: 'rogue' });
    const earned = earnTrainingPoints(base, 2, proof);

    expect(() => useFreeTrainingReset(earned)).toThrow(/requires at least one allocated/);
    expect(earned.training.points.freeResetUsed).toBe(false);
    expect(earned.training.points.available).toBe(2);
  });
});
