import { describe, expect, it } from 'vitest';
import {
  HIGHFLY_CORE_STATS,
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
  it('starts with class Awakening Stats, not zero, while Training Growth is zero', () => {
    const profile = createHighflyHunterProfile({
      profileId: 'test-hunter',
      createdAt: '2026-09-29T00:00:00.000Z',
      level: 25,
      classId: 'warrior',
    });
    expect(profile.hunter.level).toBe(25);
    for (const stat of HIGHFLY_CORE_STATS) {
      expect(profile.training.core[stat].current).toBeGreaterThan(0);
      expect(profile.training.core[stat].trainingGrowth).toBe(0);
      expect(profile.training.core[stat].calibrated).toBe(false);
    }
  });

  it('level, rank and later class/debug progression cannot mutate awakened Core', () => {
    const profile = createHighflyHunterProfile({ profileId: 'ownership', classId: 'rogue' });
    const before = coreSnapshot(profile);
    const leveled = applyHunterProgression(profile, {
      level: 26, xp: 9999, classId: 'mage', subclassId: 'shadow_dancer', rank: 'D',
    });
    expect(coreSnapshot(leveled)).toBe(before);
    expect(leveled.awakening.classId).toBe('rogue');
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
    expect(trained.training.core.STR.trainingGrowth).toBeCloseTo(0.4, 10);
  });

  it('keeps the official five-day reference and 3+1 base mesocycle', () => {
    expect(HF_REFERENCE_5D_SUPREME_V1).toHaveLength(5);
    expect(HIGHFLY_BASE_MESOCYCLE).toEqual({ weeks: 4, loadingWeeks: 3, deloadWeeks: 1 });
  });
});
