import { afterEach, describe, expect, it } from 'vitest';
import { createPlayer, recalcPlayerStats } from '../src/sim/entity';
import {
  HIGHFLY_AWAKENING_BUDGET,
  HIGHFLY_AWAKENING_CLASSES,
  HIGHFLY_CORE_STATS,
  HIGHFLY_NATURAL_GROWTH_BUDGET,
  allocateTrainingPoints,
  applyHunterProgression,
  createHighflyHunterProfile,
  earnTrainingPoints,
  HIGHFLY_TRAINING_SCORING_VERSION,
} from '../src/highfly/training/core';
import {
  HIGHFLY_CORE_STAT_AUTHORITY_V1,
  HIGHFLY_STAT_BIBLE_V1,
  armHighflyLocalStatAuthority,
  bindHighflyLocalStatAuthority,
  clearHighflyLocalStatAuthority,
  highflyCoreVectorAtLevel,
  highflyUniqueCoreModifiers,
} from '../src/highfly/training/stat_authority';
import {
  clearActiveHighflyHunterProfile,
  setActiveHighflyHunterProfile,
} from '../src/highfly/training/profile_store';

afterEach(() => {
  clearHighflyLocalStatAuthority();
  clearActiveHighflyHunterProfile();
});

const proof = {
  source: 'training-performance-gate' as const,
  scoringVersion: HIGHFLY_TRAINING_SCORING_VERSION,
  evidenceId: 'pf5-c21',
};

describe('HIGHFLY PF-5 permanent Core authority', () => {
  it('starts every class with a 50-point class base and reaches +98 natural growth at LV99', () => {
    expect(HIGHFLY_AWAKENING_BUDGET).toBe(50);
    expect(HIGHFLY_NATURAL_GROWTH_BUDGET).toBe(98);
    for (const cls of HIGHFLY_AWAKENING_CLASSES) {
      const lv1 = createHighflyHunterProfile({ profileId: cls + '-1', classId: cls, level: 1 });
      const lv99 = createHighflyHunterProfile({ profileId: cls + '-99', classId: cls, level: 99 });
      const total1 = HIGHFLY_CORE_STATS.reduce((sum, stat) => sum + lv1.training.core[stat].current, 0);
      const total99 = HIGHFLY_CORE_STATS.reduce((sum, stat) => sum + lv99.training.core[stat].current, 0);
      expect(total1).toBeCloseTo(50, 2);
      expect(total99).toBeCloseTo(148, 2);
    }
  });

  it('keeps Training allocation manual and allows off-meta builds on top of natural class growth', () => {
    let mage = createHighflyHunterProfile({ profileId: 'strong-mage', classId: 'mage', level: 40 });
    const naturalStr = mage.training.core.STR.current;
    mage = earnTrainingPoints(mage, 25, proof);
    mage = allocateTrainingPoints(mage, 'STR', 25);
    expect(mage.training.core.STR.trainingAllocated).toBe(25);
    expect(mage.training.core.STR.current).toBeCloseTo(naturalStr + 25, 8);
    expect(mage.training.points.available).toBe(0);

    const lv60 = applyHunterProgression(mage, { level: 60 });
    expect(lv60.training.core.STR.trainingAllocated).toBe(25);
    expect(lv60.training.core.STR.current).toBeGreaterThan(mage.training.core.STR.current);
  });

  it('keeps every stat viable for every class', () => {
    expect(HIGHFLY_CORE_STAT_AUTHORITY_V1).toBe('pf5-permanent-core-v2');
    for (const cls of HIGHFLY_AWAKENING_CLASSES) {
      for (const stat of HIGHFLY_CORE_STATS) {
        expect(HIGHFLY_STAT_BIBLE_V1[cls][stat]).toBeGreaterThan(0);
      }
    }
  });

  it('seeds only the bound local Hunter primary recalc with permanent Core', () => {
    let profile = createHighflyHunterProfile({ profileId: 'local', classId: 'warrior', level: 60 });
    profile = earnTrainingPoints(profile, 12, proof);
    profile = allocateTrainingPoints(profile, 'INT', 12);
    setActiveHighflyHunterProfile(profile);

    armHighflyLocalStatAuthority();
    bindHighflyLocalStatAuthority(777);

    const local = createPlayer(777, 'warrior', { x: 0, y: 0, z: 0 }, 'Local');
    local.level = 60;
    recalcPlayerStats(local, 'warrior', {}, undefined, {});

    const expected = highflyCoreVectorAtLevel(profile, 'warrior', 60);
    expect(local.stats.str).toBeCloseTo(expected.STR, 8);
    expect(local.stats.agi).toBeCloseTo(expected.AGI, 8);
    expect(local.stats.sta).toBeCloseTo(expected.VIT, 8);
    expect(local.stats.spi).toBeCloseTo(expected.PER, 8);
    expect(local.stats.int).toBeCloseTo(expected.INT, 8);

    const probe = createPlayer(778, 'warrior', { x: 0, y: 0, z: 0 }, 'Probe');
    probe.level = 60;
    recalcPlayerStats(probe, 'warrior', {}, undefined, {});
    expect(probe.stats.int).not.toBeCloseTo(expected.INT, 4);
  });

  it('uses bounded side mechanics without double-counting AP/HP/crit', () => {
    const profile = createHighflyHunterProfile({ profileId: 'mods', classId: 'hunter', level: 99 });
    const mods = highflyUniqueCoreModifiers(profile);
    expect(mods.moveSpeedBonus).toBeGreaterThan(0);
    expect(mods.hitBonus).toBeGreaterThan(0);
    expect(mods.resourceCostReduction).toBeGreaterThan(0);
    expect(mods.moveSpeedBonus).toBeLessThanOrEqual(0.08);
    expect(mods.hitBonus).toBeLessThanOrEqual(0.06);
    expect(mods.resourceCostReduction).toBeLessThanOrEqual(0.12);
  });
});
