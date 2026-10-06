import { afterEach, describe, expect, it } from 'vitest';
import { createPlayer, recalcPlayerStats } from '../src/sim/entity';
import {
  bindActiveTrainingCombatEntity,
  clearActiveTrainingCombatBinding,
  setActiveTrainingBridgeFlags,
} from '../src/highfly/training/combat_runtime';
import {
  clearActiveHighflyHunterProfile,
  setActiveHighflyHunterProfile,
} from '../src/highfly/training/profile_store';
import {
  HIGHFLY_AWAKENING_CLASSES,
  HIGHFLY_CORE_STATS,
  allocateTrainingPoints,
  applyHunterProgression,
  createHighflyHunterProfile,
  earnTrainingPoints,
  HIGHFLY_TRAINING_SCORING_VERSION,
} from '../src/highfly/training/core';
import {
  HIGHFLY_CORE_STAT_AUTHORITY_V1,
  HIGHFLY_STAT_BIBLE_V1,
  highflyTrainingDerivedModifiers,
  trainingCoreVector,
} from '../src/highfly/training/stat_authority';


afterEach(() => {
  clearActiveTrainingCombatBinding();
  clearActiveHighflyHunterProfile();
});

const proof = {
  source: 'training-performance-gate' as const,
  scoringVersion: HIGHFLY_TRAINING_SCORING_VERSION,
  evidenceId: 'pf5',
};

describe('HIGHFLY PF-5 Training -> derived game authority', () => {
  it('has no dead stat in any of the nine classes', () => {
    expect(HIGHFLY_CORE_STAT_AUTHORITY_V1).toBe('pf5-training-only-derived-v1');
    for (const cls of HIGHFLY_AWAKENING_CLASSES) {
      for (const stat of HIGHFLY_CORE_STATS) {
        expect(HIGHFLY_STAT_BIBLE_V1[cls][stat]).toBeGreaterThan(0);
      }
    }
  });

  it('a level-99 Hunter with no real Training still has 0/0/0/0/0 Core', () => {
    const profile = createHighflyHunterProfile({ profileId: 'zero', classId: 'mage', level: 99 });
    expect(trainingCoreVector(profile)).toEqual({ STR: 0, AGI: 0, VIT: 0, PER: 0, INT: 0 });
    expect(highflyTrainingDerivedModifiers(profile)).toEqual({
      physicalAttackBonus: 0,
      rangedAttackBonus: 0,
      spellPowerBonus: 0,
      healingPowerBonus: 0,
      maxHpBonus: 0,
      critChanceBonus: 0,
      dodgeChanceBonus: 0,
      moveSpeedBonus: 0,
      hitBonus: 0,
      weakPointBonus: 0,
      resourceCostReduction: 0,
      resourceRecoveryBonus: 0,
    });
  });

  it('level progression does not move Core after Training allocation', () => {
    let profile = createHighflyHunterProfile({ profileId: 'isolated', classId: 'warrior' });
    profile = earnTrainingPoints(profile, 5, proof);
    profile = allocateTrainingPoints(profile, 'INT', 5);
    const before = trainingCoreVector(profile);
    const lv99 = applyHunterProgression(profile, { level: 99, xp: 123456 });
    expect(trainingCoreVector(lv99)).toEqual(before);
    expect(lv99.training.core.INT.current).toBe(5);
  });

  it('keeps Claude internal primaries as chassis while Training changes only derived outputs', () => {
    let profile = createHighflyHunterProfile({ profileId: 'runtime', classId: 'warrior', level: 20 });
    profile = earnTrainingPoints(profile, 20, proof);
    profile = allocateTrainingPoints(profile, 'STR', 20);
    setActiveHighflyHunterProfile(profile);

    const control = createPlayer(9001, 'warrior', { x: 0, y: 0, z: 0 }, 'Control');
    control.level = 20;
    recalcPlayerStats(control, 'warrior', {}, undefined, {});

    const trained = createPlayer(9002, 'warrior', { x: 0, y: 0, z: 0 }, 'Trained');
    trained.level = 20;
    bindActiveTrainingCombatEntity(trained);
    setActiveTrainingBridgeFlags({
      enabled: true,
      applyMovement: true,
      applyPerception: true,
      applyIntelligence: true,
    });
    recalcPlayerStats(trained, 'warrior', {}, undefined, {});

    // Donor primaries are chassis internals, not HIGHFLY Training Core.
    expect(trained.stats.str).toBe(control.stats.str);
    expect(trained.stats.agi).toBe(control.stats.agi);
    expect(trained.stats.sta).toBe(control.stats.sta);
    expect(profile.training.core.STR.current).toBe(20);

    // Training is felt only through derived outputs.
    expect(trained.attackPower).toBeGreaterThan(control.attackPower);
    expect(trained.maxHp).toBeGreaterThan(control.maxHp);
  });

  it('converts allocated Core into derived power with diminishing percentage caps', () => {
    let profile = createHighflyHunterProfile({ profileId: 'power', classId: 'hunter' });
    profile = earnTrainingPoints(profile, 500, proof);
    for (const stat of HIGHFLY_CORE_STATS) profile = allocateTrainingPoints(profile, stat, 100);
    const mods = highflyTrainingDerivedModifiers(profile);
    expect(mods.physicalAttackBonus).toBeGreaterThan(0);
    expect(mods.rangedAttackBonus).toBeGreaterThan(0);
    expect(mods.spellPowerBonus).toBeGreaterThan(0);
    expect(mods.maxHpBonus).toBeGreaterThan(0);
    expect(mods.hitBonus).toBeGreaterThan(0);
    expect(mods.critChanceBonus).toBeLessThanOrEqual(0.06);
    expect(mods.dodgeChanceBonus).toBeLessThanOrEqual(0.06);
    expect(mods.moveSpeedBonus).toBeLessThanOrEqual(0.08);
    expect(mods.resourceCostReduction).toBeLessThanOrEqual(0.12);
  });
});
