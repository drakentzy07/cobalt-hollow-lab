import { describe, expect, it } from 'vitest';
import { ALL_CLASSES, MAX_LEVEL } from '../src/sim/types';
import {
  genesisTrainingProjection,
  genesisMobileMove,
  GENESIS_G1_NATIVE_CAP,
  GENESIS_G1_NATIVE_CLASSES,
} from '../src/highfly/genesis/class_training';
import {
  commitTrainingCoreStat,
  createHighflyHunterProfile,
  HIGHFLY_TRAINING_SCORING_VERSION,
} from '../src/highfly/training/core';

const baseline = {
  physicalAP: 100, stagger: 100, power: 100, moveSpeed: 7,
  maxHP: 500, precision: 1, weakPointMultiplier: 1, critChance: 0.05,
  resourceCostMultiplier: 1, resourceRecovery: 10,
};

describe('HIGHFLY GENESIS G1 native class + training compatibility', () => {
  it('keeps every original class and the upstream LV20 ceiling', () => {
    expect(GENESIS_G1_NATIVE_CLASSES).toEqual(ALL_CLASSES);
    expect(ALL_CLASSES).toHaveLength(9);
    expect(GENESIS_G1_NATIVE_CAP).toBe(MAX_LEVEL);
    expect(MAX_LEVEL).toBe(20);
  });

  for (const cls of ALL_CLASSES) {
    it('does not replace native stats for an untrained ' + cls, () => {
      const profile = createHighflyHunterProfile({ profileId: 'g1-' + cls, classId: cls });
      expect(genesisTrainingProjection({
        playerClass: cls, level: profile.hunter.level, profile, baseline, enabled: true,
      })).toEqual(baseline);
    });
  }

  it('awards only recorded training growth; never the original class base twice', () => {
    const initial = createHighflyHunterProfile({ profileId: 'g1-warrior', classId: 'warrior' });
    const trained = commitTrainingCoreStat(
      initial, 'STR', initial.training.core.STR.current + 5,
      { source: 'training-performance-gate', scoringVersion: HIGHFLY_TRAINING_SCORING_VERSION, evidenceId: 'g1-proof' },
    );
    const impact = genesisTrainingProjection({
      playerClass: 'warrior', level: 1, profile: trained, baseline, enabled: true,
    });
    expect(impact.physicalAP).toBeGreaterThan(baseline.physicalAP);
    expect(impact.maxHP).toBeGreaterThanOrEqual(baseline.maxHP);
    expect(genesisTrainingProjection({
      playerClass: 'warrior', level: 1, profile: trained, baseline, enabled: false,
    })).toEqual(baseline);
    expect(genesisTrainingProjection({
      playerClass: 'mage', level: 1, profile: trained, baseline, enabled: true,
    })).toEqual(baseline);
    expect(genesisTrainingProjection({
      playerClass: 'warrior', level: MAX_LEVEL+1, profile: trained, baseline, enabled: true,
    })).toEqual(baseline);
  });

  it('projects full-circle analog mobile movement with independent camera', () => {
    expect(genesisMobileMove({ x: 0, y: 0 }, 0)).toBeNull();
    for (let i=0;i<16;i++) {
      const dir=i*Math.PI/8;
      const projected=genesisMobileMove({x:Math.sin(dir),y:-Math.cos(dir)},0.4);
      expect(projected).not.toBeNull();
      expect(projected!.analog).toBeCloseTo(1,6);
      expect(Math.hypot(projected!.worldX,projected!.worldZ)).toBeCloseTo(1,6);
    }
  });
});
