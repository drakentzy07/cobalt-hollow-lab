import { describe, expect, it } from 'vitest';
import {
  applyActiveTrainingBridgeToEntity,
  bindActiveTrainingCombatEntity,
  clearActiveTrainingCombatBinding,
  refreshActiveTrainingCombatBridge,
  setActiveTrainingBridgeFlags,
} from '../src/highfly/training/combat_runtime';
import {
  HIGHFLY_TRAINING_SCORING_VERSION,
  commitTrainingCoreStat,
  createHighflyHunterProfile,
} from '../src/highfly/training/core';
import {
  clearActiveHighflyHunterProfile,
  setActiveHighflyHunterProfile,
} from '../src/highfly/training/profile_store';

function fullTrainingProfile() {
  let profile = createHighflyHunterProfile({
    profileId: 'j3b-native',
    createdAt: '2026-09-30T00:00:00.000Z',
    classId: 'warrior',
  });
  for (const stat of ['STR', 'AGI', 'VIT', 'PER', 'INT'] as const) {
    profile = commitTrainingCoreStat(
      profile,
      stat,
      profile.training.core[stat].current + 60,
      {
        source: 'training-performance-gate',
        scoringVersion: HIGHFLY_TRAINING_SCORING_VERSION,
        evidenceId: 'j3b-' + stat,
      },
    );
  }
  return profile;
}

describe('HIGHFLY RUN1-J J3B post-PF5 compatibility bridge', () => {
  it('adds only HIGHFLY-exclusive seams and never double-counts Claude-derived combat stats', () => {
    clearActiveHighflyHunterProfile();
    clearActiveTrainingCombatBinding();
    setActiveHighflyHunterProfile(fullTrainingProfile());

    const entity = {
      id: 3301,
      attackPower: 100,
      rangedPower: 80,
      spellPower: 60,
      healPower: 70,
      maxHp: 1000,
      hp: 800,
      critChance: 0.05,
      dodgeChance: 0.05,
      hitBonus: 0,
      critDmgPhysBonus: 0,
      critDmgSpellBonus: 0,
      critDmgHealBonus: 0,
      moveSpeed: 7,
      dead: false,
      highflyResourceCostMultiplier: 1,
      highflyResourceRecoveryMultiplier: 1,
    };

    bindActiveTrainingCombatEntity(entity);
    setActiveTrainingBridgeFlags({
      enabled: true,
      applyMovement: true,
      applyPerception: true,
      applyIntelligence: true,
    });
    applyActiveTrainingBridgeToEntity(entity);

    // PF-5 single authority: these already came from permanent Core through
    // recalcPlayerStats and MUST remain untouched by the compatibility bridge.
    expect(entity.attackPower).toBe(100);
    expect(entity.rangedPower).toBe(80);
    expect(entity.spellPower).toBe(60);
    expect(entity.healPower).toBe(70);
    expect(entity.maxHp).toBe(1000);
    expect(entity.critChance).toBe(0.05);
    expect(entity.dodgeChance).toBe(0.05);

    // Only mechanics not natively derived by Claude stay in this bridge.
    expect(entity.moveSpeed).toBeGreaterThan(7);
    expect(entity.hitBonus).toBeGreaterThan(0);
    expect(entity.critDmgPhysBonus).toBeGreaterThan(0);
    expect(entity.critDmgSpellBonus).toBeGreaterThan(0);
    expect(entity.critDmgHealBonus).toBeGreaterThan(0);
    expect(entity.highflyResourceCostMultiplier).toBeLessThan(1);
    expect(entity.highflyResourceRecoveryMultiplier).toBeGreaterThan(1);

    const once = { ...entity };
    refreshActiveTrainingCombatBridge();
    refreshActiveTrainingCombatBridge();

    expect(entity.attackPower).toBeCloseTo(once.attackPower, 8);
    expect(entity.rangedPower).toBeCloseTo(once.rangedPower, 8);
    expect(entity.spellPower).toBeCloseTo(once.spellPower, 8);
    expect(entity.healPower).toBeCloseTo(once.healPower, 8);
    expect(entity.maxHp).toBe(once.maxHp);
    expect(entity.moveSpeed).toBeCloseTo(once.moveSpeed, 8);
    expect(entity.hitBonus).toBeCloseTo(once.hitBonus, 8);
    expect(entity.highflyResourceCostMultiplier).toBeCloseTo(
      once.highflyResourceCostMultiplier,
      8,
    );
  });
});
