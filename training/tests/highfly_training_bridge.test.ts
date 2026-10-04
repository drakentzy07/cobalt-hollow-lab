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
  physicalAP: 100, stagger: 100, power: 100, moveSpeed: 5, maxHP: 1000,
  precision: 1, weakPointMultiplier: 1, critChance: 0.05,
  resourceCostMultiplier: 1, resourceRecovery: 10,
};

function profileWithGrowth(values: Partial<Record<'STR'|'AGI'|'VIT'|'PER'|'INT', number>>) {
  let profile = createHighflyHunterProfile({ profileId: 'bridge', classId: 'warrior' });
  for (const stat of ['STR','AGI','VIT','PER','INT'] as const) {
    const growth = values[stat] ?? 0;
    if (growth <= 0) continue;
    profile = commitTrainingCoreStat(
      profile, stat, profile.training.core[stat].current + growth,
      {
        source: 'training-performance-gate',
        scoringVersion: HIGHFLY_TRAINING_SCORING_VERSION,
        evidenceId: 'growth-' + stat,
      },
    );
  }
  return profile;
}

describe('HIGHFLY TrainingBridge RUN138', () => {
  it('fresh Awakening is neutral because Claude already owns the class chassis', () => {
    const profile = profileWithGrowth({});
    const result = applyTrainingBridge({
      baseline, core: profile.training.core,
      flags: { enabled: true, applyMovement: true, applyPerception: true, applyIntelligence: true },
    });
    expect(result.combat).toEqual(baseline);
    expect(result.audit.gains).toEqual({ STR: 0, AGI: 0, VIT: 0, PER: 0, INT: 0 });
  });

  it('applies STR from Training Growth, not Awakening Base', () => {
    const profile = profileWithGrowth({ STR: 60 });
    const result = applyTrainingBridge({
      baseline, core: profile.training.core,
      flags: { enabled: true, applyMovement: false, applyPerception: false, applyIntelligence: false },
    });
    const g = trainingGain(60);
    expect(result.combat.physicalAP).toBeCloseTo(
      100 * (1 + HIGHFLY_TRAINING_BRIDGE_LAB_TUNING.strPhysicalApCoef * g), 8,
    );
  });

  it('same derived baseline becomes stronger with more internal Training Growth', () => {
    const low = applyTrainingBridge({
      baseline, core: profileWithGrowth({ INT: 20 }).training.core,
      flags: { enabled: true, applyMovement: false, applyPerception: false, applyIntelligence: true },
    });
    const high = applyTrainingBridge({
      baseline, core: profileWithGrowth({ INT: 60 }).training.core,
      flags: { enabled: true, applyMovement: false, applyPerception: false, applyIntelligence: true },
    });
    expect(high.combat.resourceCostMultiplier).toBeLessThan(low.combat.resourceCostMultiplier);
    expect(high.combat.resourceRecovery).toBeGreaterThan(low.combat.resourceRecovery);
  });
});
