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
  it('returns every allocated TP without touching level/class/history metadata', () => {
    const base = createHighflyHunterProfile({ profileId: 'pf4-free-reset', classId: 'warrior', level: 50 });
    const allocated = allocateTrainingPoints(
      allocateTrainingPoints(earnTrainingPoints(base, 6.25, proof), 'STR', 4),
      'INT',
      2.25,
    );
    const awakeningBefore = structuredClone(allocated.awakening);
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
      expect(state.current).toBe(0);
      expect(state.awakeningBase).toBe(0);
      expect(state.naturalLevelGrowth).toBe(0);
      expect(state.trainingAllocated).toBe(0);
      expect(state.trainingGrowth).toBe(0);
      expect(reset.training.points.allocated[stat]).toBe(0);
      expect(state.peak).toBeCloseTo(peaksBefore[stat] as number, 10);
    }
  });

  it('cannot consume the free reset twice', () => {
    const base = createHighflyHunterProfile({ profileId: 'pf4-once', classId: 'mage' });
    const reset = useFreeTrainingReset(
      allocateTrainingPoints(earnTrainingPoints(base, 1, proof), 'VIT', 1),
    );
    expect(() => useFreeTrainingReset(reset)).toThrow(/already been used/);
  });

  it('does not waste the free reset when nothing is allocated', () => {
    const earned = earnTrainingPoints(
      createHighflyHunterProfile({ profileId: 'pf4-empty', classId: 'rogue' }),
      2,
      proof,
    );
    expect(() => useFreeTrainingReset(earned)).toThrow(/requires at least one allocated/);
    expect(earned.training.points.freeResetUsed).toBe(false);
  });
});
