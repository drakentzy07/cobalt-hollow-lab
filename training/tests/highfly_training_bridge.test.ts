import { describe, expect, it } from 'vitest';
import {
  HIGHFLY_TRAINING_BRIDGE_LAB_TUNING,
  applyTrainingBridge,
  trainingGain,
  type HighflyCombatBaseline,
} from '../src/highfly/training/bridge';
import {
  HIGHFLY_TRAINING_SCORING_VERSION,
  commitTrainingCoreStat,
  createHighflyHunterProfile,
} from '../src/highfly/training/core';

const baseline: HighflyCombatBaseline = {
  physicalAP: 100,
  stagger: 100,
  power: 100,
  moveSpeed: 5,
  maxHP: 1000,
  precision: 1,
  weakPointMultiplier: 1,
  critChance: 0.05,
  resourceCostMultiplier: 1,
  resourceRecovery: 10,
};

function profileWithStats(values: Partial<Record<'STR'|'AGI'|'VIT'|'PER'|'INT', number>>) {
  let profile = createHighflyHunterProfile({
    profileId: 'bridge',
    createdAt: '2026-09-29T00:00:00.000Z',
  });
  for (const stat of ['STR','AGI','VIT','PER','INT'] as const) {
    profile = commitTrainingCoreStat(profile, stat, values[stat] ?? 10, {
      source: 'training-performance-gate',
      scoringVersion: HIGHFLY_TRAINING_SCORING_VERSION,
      evidenceId: 'cal-' + stat,
    });
  }
  return profile;
}

describe('HIGHFLY TrainingBridge RUN1-E', () => {
  it('is exactly neutral when the feature flag is OFF', () => {
    const profile = profileWithStats({ STR: 100, AGI: 100, VIT: 100, PER: 100, INT: 100 });
    const result = applyTrainingBridge({
      baseline,
      core: profile.training.core,
      flags: {
        enabled: false,
        applyMovement: true,
        applyPerception: true,
        applyIntelligence: true,
      },
    });

    expect(result.combat).toEqual(baseline);
    expect(result.audit.enabled).toBe(false);
  });

  it('uses the approved open-scale logarithmic gain with no Core Stat hard cap', () => {
    expect(trainingGain(10)).toBe(0);
    expect(trainingGain(20)).toBeGreaterThan(0);
    expect(trainingGain(1000)).toBeGreaterThan(trainingGain(100));
  });

  it('applies the exact v0.7 STR candidate to Physical AP and Stagger', () => {
    const profile = profileWithStats({ STR: 60 });
    const result = applyTrainingBridge({
      baseline,
      core: profile.training.core,
      flags: {
        enabled: true,
        applyMovement: false,
        applyPerception: false,
        applyIntelligence: false,
      },
    });

    const g = trainingGain(60);
    expect(result.combat.physicalAP).toBeCloseTo(
      100 * (1 + HIGHFLY_TRAINING_BRIDGE_LAB_TUNING.strPhysicalApCoef * g),
      8,
    );
    expect(result.combat.stagger).toBeCloseTo(
      100 * (1 + HIGHFLY_TRAINING_BRIDGE_LAB_TUNING.strStaggerCoef * g),
      8,
    );
  });

  it('applies AGI power while keeping movement behind a separate functional flag/cap', () => {
    const profile = profileWithStats({ AGI: 1000 });
    const off = applyTrainingBridge({
      baseline,
      core: profile.training.core,
      flags: {
        enabled: true,
        applyMovement: false,
        applyPerception: false,
        applyIntelligence: false,
      },
    });
    const on = applyTrainingBridge({
      baseline,
      core: profile.training.core,
      flags: {
        enabled: true,
        applyMovement: true,
        applyPerception: false,
        applyIntelligence: false,
      },
    });

    expect(off.combat.power).toBeGreaterThan(baseline.power);
    expect(off.combat.moveSpeed).toBe(baseline.moveSpeed);
    expect(on.combat.moveSpeed).toBeLessThanOrEqual(
      baseline.moveSpeed * (1 + HIGHFLY_TRAINING_BRIDGE_LAB_TUNING.agiMoveCap),
    );
  });

  it('applies the v0.7 VIT candidate only to derived HP, not back into Training Core', () => {
    const profile = profileWithStats({ VIT: 80 });
    const before = JSON.stringify(profile.training.core);
    const result = applyTrainingBridge({
      baseline,
      core: profile.training.core,
      flags: {
        enabled: true,
        applyMovement: false,
        applyPerception: false,
        applyIntelligence: false,
      },
    });

    expect(result.combat.maxHP).toBeGreaterThan(baseline.maxHP);
    expect(JSON.stringify(profile.training.core)).toBe(before);
  });

  it('keeps PER and INT sub-bridges independently switchable', () => {
    const profile = profileWithStats({ PER: 100, INT: 100 });
    const disabled = applyTrainingBridge({
      baseline,
      core: profile.training.core,
      flags: {
        enabled: true,
        applyMovement: false,
        applyPerception: false,
        applyIntelligence: false,
      },
    });
    const enabled = applyTrainingBridge({
      baseline,
      core: profile.training.core,
      flags: {
        enabled: true,
        applyMovement: false,
        applyPerception: true,
        applyIntelligence: true,
      },
    });

    expect(disabled.combat.precision).toBe(baseline.precision);
    expect(disabled.combat.resourceCostMultiplier).toBe(baseline.resourceCostMultiplier);
    expect(enabled.combat.precision).toBeGreaterThan(baseline.precision);
    expect(enabled.combat.weakPointMultiplier).toBeGreaterThan(baseline.weakPointMultiplier);
    expect(enabled.combat.resourceCostMultiplier).toBeLessThan(baseline.resourceCostMultiplier);
    expect(enabled.combat.resourceRecovery).toBeGreaterThan(baseline.resourceRecovery);
  });

  it('caps sensitive PER/INT derived effects without capping the Core Stats themselves', () => {
    const profile = profileWithStats({ PER: 100000, INT: 100000 });
    const result = applyTrainingBridge({
      baseline,
      core: profile.training.core,
      flags: {
        enabled: true,
        applyMovement: false,
        applyPerception: true,
        applyIntelligence: true,
      },
    });

    expect(result.combat.critChance).toBeLessThanOrEqual(
      baseline.critChance + HIGHFLY_TRAINING_BRIDGE_LAB_TUNING.perCritBonusCap,
    );
    expect(result.combat.resourceCostMultiplier).toBeGreaterThanOrEqual(
      baseline.resourceCostMultiplier *
        (1 - HIGHFLY_TRAINING_BRIDGE_LAB_TUNING.intCostReductionCap),
    );
  });
});
