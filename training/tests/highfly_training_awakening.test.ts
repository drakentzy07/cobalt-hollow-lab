import { describe, expect, it } from 'vitest';
import {
  HIGHFLY_AWAKENING_BUDGET,
  HIGHFLY_AWAKENING_CLASSES,
  HIGHFLY_CORE_STATS,
  HIGHFLY_TRAINING_SCORING_VERSION,
  applyHunterProgression,
  commitTrainingCoreStat,
  createHighflyHunterProfile,
} from '../src/highfly/training/core';

describe('HIGHFLY class identity + Training-only Core PF-5', () => {
  it('initializes all nine class identities with ZERO Core power', () => {
    expect(HIGHFLY_AWAKENING_BUDGET).toBe(0);
    for (const classId of HIGHFLY_AWAKENING_CLASSES) {
      const profile = createHighflyHunterProfile({ profileId: classId, classId });
      expect(profile.awakening.initialized).toBe(true);
      expect(profile.awakening.classId).toBe(classId);
      expect(profile.awakening.budget).toBe(0);
      for (const stat of HIGHFLY_CORE_STATS) {
        const state = profile.training.core[stat];
        expect(state.current).toBe(0);
        expect(state.peak).toBe(0);
        expect(state.awakeningBase).toBe(0);
        expect(state.naturalLevelGrowth).toBe(0);
        expect(state.trainingAllocated).toBe(0);
        expect(profile.awakening.base[stat]).toBe(0);
      }
    }
  });

  it('class/level/spec metadata never grants Core', () => {
    const blank = createHighflyHunterProfile({ profileId: 'identity' });
    const warrior = applyHunterProgression(blank, { classId: 'warrior' });
    const later = applyHunterProgression(warrior, {
      classId: 'mage',
      level: 99,
      subclassId: 'debug',
      xp: 999999,
    });
    expect(later.awakening.classId).toBe('warrior');
    expect(later.hunter.level).toBe(99);
    for (const stat of HIGHFLY_CORE_STATS) {
      expect(later.training.core[stat].current).toBe(0);
      expect(later.training.core[stat].naturalLevelGrowth).toBe(0);
    }
  });

  it('preserves decimal Training Core without integer rounding', () => {
    const profile = createHighflyHunterProfile({ profileId: 'decimal', classId: 'mage' });
    const trained = commitTrainingCoreStat(
      profile,
      'STR',
      0.35,
      {
        source: 'training-performance-gate',
        scoringVersion: HIGHFLY_TRAINING_SCORING_VERSION,
        evidenceId: 'real-session',
      },
    );
    expect(trained.training.core.STR.current).toBeCloseTo(0.35, 10);
    expect(trained.training.core.STR.trainingAllocated).toBeCloseTo(0.35, 10);
    expect(trained.training.points.earned).toBeCloseTo(0.35, 10);
    expect(trained.training.points.allocated.STR).toBeCloseTo(0.35, 10);
  });

  it('forbids Training Core decreases outside authorized respec', () => {
    const profile = createHighflyHunterProfile({ profileId: 'no-down', classId: 'warrior' });
    expect(() =>
      commitTrainingCoreStat(profile, 'STR', -0.1, {
        source: 'training-performance-gate',
        scoringVersion: HIGHFLY_TRAINING_SCORING_VERSION,
        evidenceId: 'bad-down',
      }),
    ).toThrow(/finite and non-negative/);
  });
});
