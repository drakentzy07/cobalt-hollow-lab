import { describe, expect, it } from 'vitest';
import {
  HIGHFLY_CORE_STATS,
  HIGHFLY_NATURAL_GROWTH_BUDGET,
  HIGHFLY_TRAINING_SCORING_VERSION,
  applyHunterProgression,
  commitTrainingCoreStat,
  coreSnapshot,
  createHighflyHunterProfile,
} from '../src/highfly/training/core';
import {
  HF_REFERENCE_5D_SUPREME_V1,
  HIGHFLY_BASE_MESOCYCLE,
} from '../src/highfly/training/reference_routine';

describe('HIGHFLY Training Core RUN138', () => {
  it('starts with Awakening + level-derived natural Core while Training Growth is zero', () => {
    const profile = createHighflyHunterProfile({
      profileId: 'test-hunter',
      createdAt: '2026-09-29T00:00:00.000Z',
      level: 25,
      classId: 'warrior',
    });
    expect(profile.hunter.level).toBe(25);
    const naturalTotal = HIGHFLY_CORE_STATS.reduce(
      (sum, stat) => sum + profile.training.core[stat].naturalLevelGrowth,
      0,
    );
    expect(naturalTotal).toBeCloseTo(24, 10);
    for (const stat of HIGHFLY_CORE_STATS) {
      const state = profile.training.core[stat];
      expect(state.current).toBeCloseTo(
        state.awakeningBase + state.naturalLevelGrowth,
        10,
      );
      expect(state.trainingAllocated).toBe(0);
      expect(state.trainingGrowth).toBe(0);
      expect(state.calibrated).toBe(false);
    }
    expect(profile.training.points.earned).toBe(0);
    expect(profile.training.points.available).toBe(0);
    expect(Object.values(profile.training.points.allocated).reduce((a, b) => a + b, 0)).toBe(0);
    expect(profile.training.points.freeResetUsed).toBe(false);
  });

  it('level changes only natural Core; debug class/rank/spec never re-roll Awakening or Training', () => {
    const profile = createHighflyHunterProfile({ profileId: 'ownership', classId: 'rogue' });
    const leveled = applyHunterProgression(profile, {
      level: 26, xp: 9999, classId: 'mage', subclassId: 'shadow_dancer', rank: 'D',
    });
    expect(leveled.awakening.classId).toBe('rogue');
    const naturalTotal = HIGHFLY_CORE_STATS.reduce(
      (sum, stat) => sum + leveled.training.core[stat].naturalLevelGrowth,
      0,
    );
    expect(naturalTotal).toBeCloseTo(25, 10);
    expect(leveled.training.core.AGI.naturalLevelGrowth)
      .toBeGreaterThan(leveled.training.core.STR.naturalLevelGrowth);
    expect(leveled.training.points.earned).toBe(0);
    expect(leveled.training.points.available).toBe(0);
    expect(HIGHFLY_NATURAL_GROWTH_BUDGET).toBe(98);
  });

  it('only Training authority may add decimal growth', () => {
    const profile = createHighflyHunterProfile({ profileId: 'gate', classId: 'warrior' });
    const before = profile.training.core.STR.current;
    expect(() =>
      commitTrainingCoreStat(profile, 'STR', before + 0.4, {
        source: 'level-up',
        scoringVersion: HIGHFLY_TRAINING_SCORING_VERSION,
        evidenceId: 'bad',
      } as never),
    ).toThrow(/only be committed by Training Core/);

    const trained = commitTrainingCoreStat(
      profile, 'STR', before + 0.4,
      {
        source: 'training-performance-gate',
        scoringVersion: HIGHFLY_TRAINING_SCORING_VERSION,
        evidenceId: 'real',
      },
      { progress: 4, confidence: 0.82, readiness: 0.74 },
    );
    expect(trained.training.core.STR.current).toBeCloseTo(before + 0.4, 10);
    expect(trained.training.core.STR.trainingAllocated).toBeCloseTo(0.4, 10);
    expect(trained.training.core.STR.trainingGrowth).toBeCloseTo(0.4, 10);
    expect(trained.training.points.earned).toBeCloseTo(0.4, 10);
    expect(trained.training.points.available).toBe(0);
    expect(trained.training.points.allocated.STR).toBeCloseTo(0.4, 10);
  });

  it('keeps the official five-day reference and 3+1 base mesocycle', () => {
    expect(HF_REFERENCE_5D_SUPREME_V1).toHaveLength(5);
    expect(HIGHFLY_BASE_MESOCYCLE).toEqual({ weeks: 4, loadingWeeks: 3, deloadWeeks: 1 });
  });
});
