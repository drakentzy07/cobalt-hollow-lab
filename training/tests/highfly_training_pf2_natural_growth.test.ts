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

function coreTotal(profile: ReturnType<typeof createHighflyHunterProfile>): number {
  return HIGHFLY_CORE_STATS.reduce((sum, stat) => sum + profile.training.core[stat].current, 0);
}

describe('HIGHFLY PF-2/PF-5 level isolation 1-99', () => {
  it('level 1, 20, 50 and 99 grant zero Core for every class', () => {
    expect(HIGHFLY_NATURAL_GROWTH_BUDGET).toBe(0);
    expect(HIGHFLY_NORMAL_MAX_LEVEL).toBe(99);
    for (const level of [1, 20, 50, 99]) {
      for (const classId of HIGHFLY_AWAKENING_CLASSES) {
        const profile = createHighflyHunterProfile({ profileId: classId + level, classId, level });
        expect(profile.hunter.level).toBe(level);
        expect(coreTotal(profile)).toBe(0);
        for (const stat of HIGHFLY_CORE_STATS) {
          expect(profile.training.core[stat].naturalLevelGrowth).toBe(0);
          expect(naturalLevelGrowthFor(classId, level)[stat]).toBe(0);
        }
      }
    }
  });

  it('keeps real Training exact when level changes', () => {
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
    expect(coreTotal(leveled)).toBeCloseTo(0.4, 10);
  });

  it('still clamps conventional character progression to LV99', () => {
    const profile = createHighflyHunterProfile({ profileId: 'cap', classId: 'druid', level: 500 });
    expect(profile.hunter.level).toBe(99);
    expect(coreTotal(profile)).toBe(0);
    const capped = applyHunterProgression(profile, { level: 1000 });
    expect(capped.hunter.level).toBe(99);
    expect(coreTotal(capped)).toBe(0);
  });
});
