import { afterEach, describe, expect, it } from 'vitest';
import { createPlayer, recalcPlayerStats } from '../src/sim/entity';
import {
  HIGHFLY_AWAKENING_CLASSES,
  HIGHFLY_CORE_STATS,
  allocateTrainingPoints,
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

describe('HIGHFLY Progression Foundation PF-5 stat authority', () => {
  it('keeps all five Core stats useful for all nine classes without flattening affinity', () => {
    expect(HIGHFLY_CORE_STAT_AUTHORITY_V1).toBe('pf5-stat-bible-v1');
    for (const cls of HIGHFLY_AWAKENING_CLASSES) {
      for (const stat of HIGHFLY_CORE_STATS) {
        expect(HIGHFLY_STAT_BIBLE_V1[cls][stat]).toBeGreaterThan(0);
      }
    }
    expect(HIGHFLY_STAT_BIBLE_V1.warrior.STR).toBeGreaterThan(HIGHFLY_STAT_BIBLE_V1.mage.STR);
    expect(HIGHFLY_STAT_BIBLE_V1.mage.INT).toBeGreaterThan(HIGHFLY_STAT_BIBLE_V1.warrior.INT);
    expect(HIGHFLY_STAT_BIBLE_V1.rogue.AGI).toBeGreaterThan(HIGHFLY_STAT_BIBLE_V1.priest.AGI);
    expect(HIGHFLY_STAT_BIBLE_V1.priest.PER).toBeGreaterThan(HIGHFLY_STAT_BIBLE_V1.warrior.PER);
  });

  it('seeds the bound local player with Awakening + LV growth + Training before Claude derives combat', () => {
    let profile = createHighflyHunterProfile({ profileId: 'offline:pf5', classId: 'warrior', level: 60 });
    profile = earnTrainingPoints(profile, 12, {
      source: 'training-performance-gate',
      scoringVersion: HIGHFLY_TRAINING_SCORING_VERSION,
      evidenceId: 'pf5-earned',
    });
    profile = allocateTrainingPoints(profile, 'INT', 12);
    setActiveHighflyHunterProfile(profile);

    armHighflyLocalStatAuthority();
    const player = createPlayer(777, 'warrior', { x: 0, y: 0, z: 0 }, 'PF5');
    player.level = 60;
    recalcPlayerStats(player, 'warrior', {}, undefined, {});

    const expected = highflyCoreVectorAtLevel(profile, 'warrior', 60);
    expect(player.stats.str).toBeCloseTo(expected.STR, 8);
    expect(player.stats.agi).toBeCloseTo(expected.AGI, 8);
    expect(player.stats.sta).toBeCloseTo(expected.VIT, 8);
    expect(player.stats.spi).toBeCloseTo(expected.PER, 8);
    expect(player.stats.int).toBeCloseTo(expected.INT, 8);
  });

  it('never leaks the active Hunter Core into another player/probe after binding', () => {
    const profile = createHighflyHunterProfile({ profileId: 'offline:bound', classId: 'mage', level: 40 });
    setActiveHighflyHunterProfile(profile);
    armHighflyLocalStatAuthority();
    bindHighflyLocalStatAuthority(10);

    const local = createPlayer(10, 'mage', { x: 0, y: 0, z: 0 }, 'Local');
    local.level = 40;
    recalcPlayerStats(local, 'mage', {}, undefined, {});
    const probe = createPlayer(11, 'mage', { x: 0, y: 0, z: 0 }, 'Probe');
    probe.level = 40;
    recalcPlayerStats(probe, 'mage', {}, undefined, {});

    const expected = highflyCoreVectorAtLevel(profile, 'mage', 40);
    expect(local.stats.int).toBeCloseTo(expected.INT, 8);
    expect(probe.stats.int).not.toBeCloseTo(expected.INT, 4);
  });

  it('uses diminishing returns for HIGHFLY-only side mechanics', () => {
    let low = createHighflyHunterProfile({ profileId: 'low', classId: 'mage' });
    let high = createHighflyHunterProfile({ profileId: 'high', classId: 'mage' });
    low.training.core.INT.current = 50;
    high.training.core.INT.current = 5000;
    low.training.core.PER.current = 50;
    high.training.core.PER.current = 5000;
    low.training.core.AGI.current = 50;
    high.training.core.AGI.current = 5000;

    const lowMods = highflyUniqueCoreModifiers(low);
    const highMods = highflyUniqueCoreModifiers(high);
    expect(highMods.resourceCostReduction).toBeGreaterThan(lowMods.resourceCostReduction);
    expect(highMods.hitBonus).toBeGreaterThan(lowMods.hitBonus);
    expect(highMods.moveSpeedBonus).toBeGreaterThan(lowMods.moveSpeedBonus);
    expect(highMods.resourceCostReduction).toBeLessThanOrEqual(0.12);
    expect(highMods.hitBonus).toBeLessThanOrEqual(0.06);
    expect(highMods.moveSpeedBonus).toBeLessThanOrEqual(0.08);
  });
});
