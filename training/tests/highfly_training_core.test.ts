import { describe, expect, it } from 'vitest';
import {
  HIGHFLY_CORE_STATS,
  HIGHFLY_NATURAL_GROWTH_BUDGET,
  HIGHFLY_TRAINING_SCORING_VERSION,
  applyHunterProgression,
  commitTrainingCoreStat,
  createHighflyHunterProfile,
} from '../src/highfly/training/core';
import {
  HF_REFERENCE_5D_SUPREME_V1,
  HIGHFLY_BASE_MESOCYCLE,
} from '../src/highfly/training/reference_routine';

describe('HIGHFLY Training Core PF-5 authority', () => {
  it('starts all five real Core Stats at zero regardless of class or level', () => {
    const profile = createHighflyHunterProfile({
      profileId: 'test-hunter',
      createdAt: '2026-09-29T00:00:00.000Z',
      level: 25,
      classId: 'warrior',
    });
    expect(profile.hunter.level).toBe(25);
    expect(HIGHFLY_NATURAL_GROWTH_BUDGET).toBe(0);
    for (const stat of HIGHFLY_CORE_STATS) {
      const state = profile.training.core[stat];
      expect(state.current).toBe(0);
      expect(state.awakeningBase).toBe(0);
      expect(state.naturalLevelGrowth).toBe(0);
      expect(state.trainingAllocated).toBe(0);
      expect(state.trainingGrowth).toBe(0);
    }
    expect(profile.training.points.earned).toBe(0);
  });

  it('level/rank/spec/class metadata never changes Training Core', () => {
    const profile = createHighflyHunterProfile({ profileId: 'ownership', classId: 'rogue' });
    const leveled = applyHunterProgression(profile, {
      level: 99, xp: 9999, classId: 'mage', subclassId: 'shadow_dancer', rank: 'D',
    });
    for (const stat of HIGHFLY_CORE_STATS) expect(leveled.training.core[stat].current).toBe(0);
    expect(leveled.training.points.earned).toBe(0);
    expect(leveled.training.points.available).toBe(0);
  });

  it('only Training authority may add decimal Core', () => {
    const profile = createHighflyHunterProfile({ profileId: 'gate', classId: 'warrior' });
    expect(() =>
      commitTrainingCoreStat(profile, 'STR', 0.4, {
        source: 'level-up',
        scoringVersion: HIGHFLY_TRAINING_SCORING_VERSION,
        evidenceId: 'bad',
      } as never),
    ).toThrow(/only be committed by Training Core/);

    const trained = commitTrainingCoreStat(
      profile, 'STR', 0.4,
      {
        source: 'training-performance-gate',
        scoringVersion: HIGHFLY_TRAINING_SCORING_VERSION,
        evidenceId: 'real',
      },
      { progress: 4, confidence: 0.82, readiness: 0.74 },
    );
    expect(trained.training.core.STR.current).toBeCloseTo(0.4, 10);
    expect(trained.training.core.STR.trainingAllocated).toBeCloseTo(0.4, 10);
    expect(trained.training.points.earned).toBeCloseTo(0.4, 10);
    expect(trained.training.points.available).toBe(0);
  });

  it('keeps the official five-day reference and 3+1 base mesocycle untouched', () => {
    expect(HF_REFERENCE_5D_SUPREME_V1).toHaveLength(5);
    expect(HIGHFLY_BASE_MESOCYCLE).toEqual({ weeks: 4, loadingWeeks: 3, deloadWeeks: 1 });
  });
});
