import { describe, expect, it } from 'vitest';
import {
  HIGHFLY_AWAKENING_CLASSES,
  HIGHFLY_CORE_STATS,
  HIGHFLY_NATURAL_GROWTH_BUDGET,
  HIGHFLY_NORMAL_MAX_LEVEL,
  HIGHFLY_TRAINING_SCORING_VERSION,
  applyHunterProgression,
  commitTrainingCoreStat,
  createHighflyHunterProfile,
  naturalLevelGrowthFor,
} from '../src/highfly/training/core';

describe('HIGHFLY PF-2 compatibility: level is isolated from Core', () => {
  it('keeps every class at zero Core from LV1 through LV99 without Training', () => {
    expect(HIGHFLY_NATURAL_GROWTH_BUDGET).toBe(0);
    expect(HIGHFLY_NORMAL_MAX_LEVEL).toBe(99);
    for (const level of [1, 20, 50, 99]) {
      for (const classId of HIGHFLY_AWAKENING_CLASSES) {
        const profile = createHighflyHunterProfile({ profileId: classId + level, classId, level });
        for (const stat of HIGHFLY_CORE_STATS) {
          expect(profile.training.core[stat].current).toBe(0);
          expect(naturalLevelGrowthFor(classId, level)[stat]).toBe(0);
        }
      }
    }
  });

  it('preserves Training allocation exactly across level changes', () => {
    let profile = createHighflyHunterProfile({ profileId: 'training-plus-level', classId: 'warrior' });
    profile = commitTrainingCoreStat(
      profile,
      'STR',
      0.4,
      {
        source: 'training-performance-gate',
        scoringVersion: HIGHFLY_TRAINING_SCORING_VERSION,
        evidenceId: 'pf2-training',
      },
    );
    const leveled = applyHunterProgression(profile, { level: 99 });
    expect(leveled.training.core.STR.current).toBeCloseTo(0.4, 10);
    expect(leveled.training.core.STR.trainingAllocated).toBeCloseTo(0.4, 10);
    expect(leveled.training.points.allocated.STR).toBeCloseTo(0.4, 10);
  });
});
