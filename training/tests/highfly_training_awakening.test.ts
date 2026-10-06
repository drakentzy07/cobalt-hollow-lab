import { describe, expect, it } from 'vitest';
import {
  HIGHFLY_AWAKENING_BASES,
  HIGHFLY_AWAKENING_BUDGET,
  HIGHFLY_AWAKENING_CLASSES,
  HIGHFLY_CORE_STATS,
  HIGHFLY_TRAINING_SCORING_VERSION,
  applyHunterProgression,
  commitTrainingCoreStat,
  createHighflyHunterProfile,
} from '../src/highfly/training/core';

describe('HIGHFLY Awakening Stats RUN138', () => {
  it('gives all nine classes one equal 50-point budget with different identities', () => {
    for (const classId of HIGHFLY_AWAKENING_CLASSES) {
      const profile = createHighflyHunterProfile({ profileId: classId, classId });
      const total = HIGHFLY_CORE_STATS.reduce(
        (sum, stat) => sum + profile.training.core[stat].current,
        0,
      );
      expect(profile.awakening.initialized).toBe(true);
      expect(profile.awakening.classId).toBe(classId);
      expect(total).toBeCloseTo(HIGHFLY_AWAKENING_BUDGET, 8);
      for (const stat of HIGHFLY_CORE_STATS) {
        const state = profile.training.core[stat];
        expect(state.current).toBe(HIGHFLY_AWAKENING_BASES[classId][stat]);
        expect(state.awakeningBase).toBe(HIGHFLY_AWAKENING_BASES[classId][stat]);
        expect(state.naturalLevelGrowth).toBe(0);
        expect(state.trainingAllocated).toBe(0);
        expect(state.trainingGrowth).toBe(0);
      }
    }
    expect(HIGHFLY_AWAKENING_BASES.warrior.STR).toBeGreaterThan(HIGHFLY_AWAKENING_BASES.warrior.INT);
    expect(HIGHFLY_AWAKENING_BASES.mage.INT).toBeGreaterThan(HIGHFLY_AWAKENING_BASES.mage.STR);
    expect(HIGHFLY_AWAKENING_BASES.rogue.AGI).toBeGreaterThan(HIGHFLY_AWAKENING_BASES.rogue.VIT);
    expect(HIGHFLY_AWAKENING_BASES.priest.PER).toBeGreaterThan(HIGHFLY_AWAKENING_BASES.priest.STR);
  });

  it('initializes Awakening once; later level grows its original class affinity without re-roll', () => {
    const blank = createHighflyHunterProfile({ profileId: 'late-awaken' });
    const awakened = applyHunterProgression(blank, { classId: 'hunter' });
    const beforeBase = JSON.stringify(awakened.awakening.base);
    const later = applyHunterProgression(awakened, {
      classId: 'mage',
      level: 50,
      subclassId: 'debug',
      xp: 999999,
    });
    expect(later.awakening.classId).toBe('hunter');
    expect(JSON.stringify(later.awakening.base)).toBe(beforeBase);
    const naturalTotal = HIGHFLY_CORE_STATS.reduce(
      (sum, stat) => sum + later.training.core[stat].naturalLevelGrowth,
      0,
    );
    expect(naturalTotal).toBeCloseTo(49, 10);
    expect(later.training.core.AGI.naturalLevelGrowth)
      .toBeGreaterThan(later.training.core.INT.naturalLevelGrowth);
  });

  it('preserves decimal Training Growth without integer rounding', () => {
    const profile = createHighflyHunterProfile({
      profileId: 'decimal',
      classId: 'mage',
    });
    const before = profile.training.core.STR.current;
    const trained = commitTrainingCoreStat(
      profile,
      'STR',
      before + 0.35,
      {
        source: 'training-performance-gate',
        scoringVersion: HIGHFLY_TRAINING_SCORING_VERSION,
        evidenceId: 'real-session',
      },
    );
    expect(trained.training.core.STR.trainingAllocated).toBeCloseTo(0.35, 10);
    expect(trained.training.core.STR.trainingGrowth).toBeCloseTo(0.35, 10);
    expect(trained.training.core.STR.current).toBeCloseTo(before + 0.35, 10);
    expect(trained.training.points.earned).toBeCloseTo(0.35, 10);
    expect(trained.training.points.allocated.STR).toBeCloseTo(0.35, 10);
  });

  it('forbids Core decreases; fatigue belongs in readiness instead', () => {
    const profile = createHighflyHunterProfile({ profileId: 'no-down', classId: 'warrior' });
    const current = profile.training.core.STR.current;
    expect(() =>
      commitTrainingCoreStat(profile, 'STR', current - 0.1, {
        source: 'training-performance-gate',
        scoringVersion: HIGHFLY_TRAINING_SCORING_VERSION,
        evidenceId: 'bad-down',
      }),
    ).toThrow(/cannot decrease/);
  });
});
