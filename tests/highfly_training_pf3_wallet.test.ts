import { describe, expect, it } from 'vitest';
import {
  HIGHFLY_TRAINING_SCORING_VERSION,
  allocateTrainingPoints,
  applyHunterProgression,
  assertTrainingPointConservation,
  createHighflyHunterProfile,
  earnTrainingPoints,
} from '../src/highfly/training/core';

const proof = {
  source: 'training-performance-gate' as const,
  scoringVersion: HIGHFLY_TRAINING_SCORING_VERSION,
  evidenceId: 'pf3-wallet',
};

describe('HIGHFLY PF-3 Training Point wallet', () => {
  it('earns TP without mutating Core until the player allocates it', () => {
    const profile = createHighflyHunterProfile({
      profileId: 'pf3-earn',
      classId: 'warrior',
      level: 20,
    });
    const before = profile.training.core.STR.current;
    const rewarded = earnTrainingPoints(profile, 0.4, proof);

    expect(rewarded.training.core.STR.current).toBeCloseTo(before, 10);
    expect(rewarded.training.core.STR.trainingAllocated).toBe(0);
    expect(rewarded.training.points.earned).toBeCloseTo(0.4, 10);
    expect(rewarded.training.points.available).toBeCloseTo(0.4, 10);
    assertTrainingPointConservation(rewarded.training.points);
  });

  it('supports deliberate split allocation across Core Stats', () => {
    let profile = createHighflyHunterProfile({
      profileId: 'pf3-split',
      classId: 'mage',
      level: 30,
    });
    profile = earnTrainingPoints(profile, 0.4, proof);

    const strBefore = profile.training.core.STR.current;
    const intBefore = profile.training.core.INT.current;
    profile = allocateTrainingPoints(profile, 'STR', 0.15);
    profile = allocateTrainingPoints(profile, 'INT', 0.25);

    expect(profile.training.points.available).toBeCloseTo(0, 10);
    expect(profile.training.points.allocated.STR).toBeCloseTo(0.15, 10);
    expect(profile.training.points.allocated.INT).toBeCloseTo(0.25, 10);
    expect(profile.training.core.STR.current).toBeCloseTo(strBefore + 0.15, 10);
    expect(profile.training.core.INT.current).toBeCloseTo(intBefore + 0.25, 10);
    expect(profile.training.core.STR.trainingGrowth).toBeCloseTo(0.15, 10);
    expect(profile.training.core.INT.trainingGrowth).toBeCloseTo(0.25, 10);
    assertTrainingPointConservation(profile.training.points);
  });

  it('forbids overspending and preserves wallet conservation', () => {
    const profile = earnTrainingPoints(
      createHighflyHunterProfile({
        profileId: 'pf3-overspend',
        classId: 'hunter',
      }),
      0.2,
      proof,
    );
    expect(() => allocateTrainingPoints(profile, 'AGI', 0.21)).toThrow(/exceeds available/);
    assertTrainingPointConservation(profile.training.points);
  });

  it('keeps allocated Training exact when natural level growth changes', () => {
    let profile = createHighflyHunterProfile({
      profileId: 'pf3-level',
      classId: 'rogue',
      level: 1,
    });
    profile = earnTrainingPoints(profile, 0.3, proof);
    profile = allocateTrainingPoints(profile, 'AGI', 0.3);
    const leveled = applyHunterProgression(profile, { level: 99 });

    expect(leveled.training.points.earned).toBeCloseTo(0.3, 10);
    expect(leveled.training.points.available).toBeCloseTo(0, 10);
    expect(leveled.training.points.allocated.AGI).toBeCloseTo(0.3, 10);
    expect(leveled.training.core.AGI.trainingAllocated).toBeCloseTo(0.3, 10);
    assertTrainingPointConservation(leveled.training.points);
  });
});
