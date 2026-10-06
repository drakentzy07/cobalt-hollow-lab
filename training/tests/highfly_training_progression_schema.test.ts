import { describe, expect, it } from 'vitest';
import {
  HIGHFLY_AWAKENING_BASES,
  HIGHFLY_CORE_STATS,
  HIGHFLY_TRAINING_SCHEMA_VERSION,
  createHighflyHunterProfile,
  migrateAwakeningStats,
  naturalLevelGrowthFor,
} from '../src/highfly/training/core';

describe('HIGHFLY Progression schema v5 permanent Core restoration', () => {
  it('restores class base + level growth to schema-4 Training-only saves without minting TP', () => {
    const current = createHighflyHunterProfile({ profileId: 'schema4', classId: 'warrior', level: 20 });
    const legacy = JSON.parse(JSON.stringify(current)) as any;
    legacy.schemaVersion = 4;
    const training = 3.5;
    legacy.awakening.budget = 0;
    legacy.awakening.base = { STR: 0, AGI: 0, VIT: 0, PER: 0, INT: 0 };
    for (const stat of HIGHFLY_CORE_STATS) {
      legacy.training.core[stat].awakeningBase = 0;
      legacy.training.core[stat].naturalLevelGrowth = 0;
      legacy.training.core[stat].current = stat === 'STR' ? training : 0;
      legacy.training.core[stat].peak = stat === 'STR' ? training : 0;
      legacy.training.core[stat].trainingAllocated = stat === 'STR' ? training : 0;
      legacy.training.core[stat].trainingGrowth = stat === 'STR' ? training : 0;
      legacy.training.points.allocated[stat] = stat === 'STR' ? training : 0;
    }
    legacy.training.points.earned = training;
    legacy.training.points.available = 0;

    const migrated = migrateAwakeningStats(legacy);
    const natural = naturalLevelGrowthFor('warrior', 20);
    expect(migrated.schemaVersion).toBe(HIGHFLY_TRAINING_SCHEMA_VERSION);
    expect(migrated.awakening.base.STR).toBeCloseTo(HIGHFLY_AWAKENING_BASES.warrior.STR, 8);
    expect(migrated.training.core.STR.current).toBeCloseTo(
      HIGHFLY_AWAKENING_BASES.warrior.STR + natural.STR + training,
      8,
    );
    expect(migrated.training.core.STR.trainingAllocated).toBeCloseTo(training, 8);
    expect(migrated.training.points.earned).toBeCloseTo(training, 8);
  });

  it('new Hunters have permanent class Core and an empty conserved Training wallet', () => {
    const profile = createHighflyHunterProfile({ profileId: 'new', classId: 'mage', level: 1 });
    const coreTotal = HIGHFLY_CORE_STATS.reduce(
      (sum, stat) => sum + profile.training.core[stat].current,
      0,
    );
    const allocated = Object.values(profile.training.points.allocated).reduce(
      (sum, value) => sum + value,
      0,
    );
    expect(coreTotal).toBeCloseTo(50, 2);
    expect(profile.training.points.earned).toBe(0);
    expect(profile.training.points.available).toBe(0);
    expect(allocated).toBe(0);
  });
});
