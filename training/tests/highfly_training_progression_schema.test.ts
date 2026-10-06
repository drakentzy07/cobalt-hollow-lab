import { describe, expect, it } from 'vitest';
import {
  HIGHFLY_AWAKENING_BASES,
  HIGHFLY_TRAINING_SCHEMA_VERSION,
  createHighflyHunterProfile,
  migrateAwakeningStats,
} from '../src/highfly/training/core';

describe('HIGHFLY Progression schema v4 Training-only Core', () => {
  it('migrates old synthetic Awakening Core into Training-only allocation without losing real growth', () => {
    const current = createHighflyHunterProfile({ profileId: 'pf1-migration', classId: 'warrior' });
    const legacy = JSON.parse(JSON.stringify(current)) as any;
    legacy.schemaVersion = 2;
    delete legacy.training.points;

    const delta = 0.35;
    legacy.training.core.STR.awakeningBase = HIGHFLY_AWAKENING_BASES.warrior.STR;
    legacy.training.core.STR.trainingGrowth = delta;
    legacy.training.core.STR.current = HIGHFLY_AWAKENING_BASES.warrior.STR + delta;
    legacy.training.core.STR.peak = legacy.training.core.STR.current;
    delete legacy.training.core.STR.trainingAllocated;
    delete legacy.training.core.STR.naturalLevelGrowth;

    const migrated = migrateAwakeningStats(legacy);
    expect(migrated.schemaVersion).toBe(HIGHFLY_TRAINING_SCHEMA_VERSION);
    expect(migrated.training.core.STR.current).toBeCloseTo(delta, 10);
    expect(migrated.training.core.STR.awakeningBase).toBe(0);
    expect(migrated.training.core.STR.naturalLevelGrowth).toBe(0);
    expect(migrated.training.core.STR.trainingAllocated).toBeCloseTo(delta, 10);
    expect(migrated.training.points.earned).toBeCloseTo(delta, 10);
    expect(migrated.training.points.allocated.STR).toBeCloseTo(delta, 10);
    expect(Object.values(migrated.awakening.base).reduce((a, b) => a + b, 0)).toBe(0);
  });

  it('starts new Hunters with a conserved empty Training Point wallet', () => {
    const profile = createHighflyHunterProfile({ profileId: 'pf1-new', classId: 'mage' });
    const allocated = Object.values(profile.training.points.allocated).reduce(
      (sum, value) => sum + value,
      0,
    );
    expect(profile.training.points.earned).toBe(0);
    expect(profile.training.points.available).toBe(0);
    expect(allocated).toBe(0);
  });
});
