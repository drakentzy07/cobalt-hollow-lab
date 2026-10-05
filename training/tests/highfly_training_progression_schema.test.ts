import { describe, expect, it } from 'vitest';
import {
  HIGHFLY_AWAKENING_BASES,
  createHighflyHunterProfile,
  migrateAwakeningStats,
} from '../src/highfly/training/core';

describe('HIGHFLY Progression Foundation schema PF-1', () => {
  it('migrates schema-2 Training Growth into wallet-backed allocation without changing Core', () => {
    const current = createHighflyHunterProfile({
      profileId: 'pf1-migration',
      classId: 'warrior',
    });

    const legacy = JSON.parse(JSON.stringify(current)) as any;
    legacy.schemaVersion = 2;
    delete legacy.training.points;

    for (const state of Object.values(legacy.training.core) as any[]) {
      delete state.naturalLevelGrowth;
      delete state.trainingAllocated;
    }

    const delta = 0.35;
    legacy.training.core.STR.trainingGrowth = delta;
    legacy.training.core.STR.current = HIGHFLY_AWAKENING_BASES.warrior.STR + delta;
    legacy.training.core.STR.peak = legacy.training.core.STR.current;

    const migrated = migrateAwakeningStats(legacy);

    expect(migrated.training.core.STR.current).toBeCloseTo(
      HIGHFLY_AWAKENING_BASES.warrior.STR + delta,
      10,
    );
    expect(migrated.training.core.STR.naturalLevelGrowth).toBe(0);
    expect(migrated.training.core.STR.trainingAllocated).toBeCloseTo(delta, 10);
    expect(migrated.training.core.STR.trainingGrowth).toBeCloseTo(delta, 10);

    expect(migrated.training.points.earned).toBeCloseTo(delta, 10);
    expect(migrated.training.points.available).toBe(0);
    expect(migrated.training.points.allocated.STR).toBeCloseTo(delta, 10);
    expect(migrated.training.points.freeResetUsed).toBe(false);
  });

  it('starts new Hunters with a conserved empty Training Point wallet', () => {
    const profile = createHighflyHunterProfile({
      profileId: 'pf1-new',
      classId: 'mage',
    });

    const allocated = Object.values(profile.training.points.allocated).reduce(
      (sum, value) => sum + value,
      0,
    );

    expect(profile.training.points.earned).toBe(0);
    expect(profile.training.points.available).toBe(0);
    expect(allocated).toBe(0);
    expect(profile.training.points.earned).toBe(
      profile.training.points.available + allocated,
    );
  });
});
