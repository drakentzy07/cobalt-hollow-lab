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

function naturalTotal(profile: ReturnType<typeof createHighflyHunterProfile>): number {
  return HIGHFLY_CORE_STATS.reduce(
    (sum, stat) => sum + profile.training.core[stat].naturalLevelGrowth,
    0,
  );
}

describe('HIGHFLY PF-2 natural level growth 1-99', () => {
  it('gives every class the same total natural budget at LV1/LV20/LV50/LV99', () => {
    for (const level of [1, 20, 50, 99]) {
      for (const classId of HIGHFLY_AWAKENING_CLASSES) {
        const profile = createHighflyHunterProfile({
          profileId: `${classId}-lv${level}`,
          classId,
          level,
        });
        expect(profile.hunter.level).toBe(level);
        expect(naturalTotal(profile)).toBeCloseTo(level - 1, 10);
      }
    }
    expect(HIGHFLY_NATURAL_GROWTH_BUDGET).toBe(98);
    expect(HIGHFLY_NORMAL_MAX_LEVEL).toBe(99);
  });

  it('preserves Claude class identity after normalization', () => {
    const warrior = naturalLevelGrowthFor('warrior', 99);
    const mage = naturalLevelGrowthFor('mage', 99);
    const rogue = naturalLevelGrowthFor('rogue', 99);
    const priest = naturalLevelGrowthFor('priest', 99);

    expect(warrior.STR).toBeCloseTo(warrior.VIT, 10);
    expect(warrior.STR).toBeGreaterThan(warrior.AGI);
    expect(warrior.PER).toBe(0);
    expect(warrior.INT).toBe(0);

    expect(mage.INT).toBeGreaterThan(mage.VIT);
    expect(mage.INT).toBeGreaterThan(mage.PER);
    expect(rogue.AGI).toBeGreaterThan(rogue.STR);
    expect(rogue.AGI).toBeGreaterThan(rogue.VIT);
    expect(priest.PER).toBeGreaterThan(priest.INT);
    expect(priest.PER).toBeGreaterThan(priest.VIT);
  });

  it('keeps Training allocation exact while level changes only Natural Growth', () => {
    let profile = createHighflyHunterProfile({
      profileId: 'training-plus-level',
      classId: 'warrior',
      level: 1,
    });
    const base = profile.training.core.STR.current;
    profile = commitTrainingCoreStat(
      profile,
      'STR',
      base + 0.4,
      {
        source: 'training-performance-gate',
        scoringVersion: HIGHFLY_TRAINING_SCORING_VERSION,
        evidenceId: 'pf2-training',
      },
    );

    const leveled = applyHunterProgression(profile, { level: 99 });

    expect(leveled.training.core.STR.trainingAllocated).toBeCloseTo(0.4, 10);
    expect(leveled.training.core.STR.trainingGrowth).toBeCloseTo(0.4, 10);
    expect(leveled.training.points.earned).toBeCloseTo(0.4, 10);
    expect(leveled.training.points.allocated.STR).toBeCloseTo(0.4, 10);
    expect(naturalTotal(leveled)).toBeCloseTo(98, 10);
    expect(leveled.training.core.STR.current).toBeCloseTo(
      leveled.training.core.STR.awakeningBase +
        leveled.training.core.STR.naturalLevelGrowth +
        0.4,
      10,
    );
  });

  it('clamps conventional progression to LV99', () => {
    const profile = createHighflyHunterProfile({
      profileId: 'cap',
      classId: 'druid',
      level: 500,
    });
    expect(profile.hunter.level).toBe(99);
    expect(naturalTotal(profile)).toBeCloseTo(98, 10);

    const capped = applyHunterProgression(profile, { level: 1000 });
    expect(capped.hunter.level).toBe(99);
    expect(naturalTotal(capped)).toBeCloseTo(98, 10);
  });
});
