import { describe, expect, it } from 'vitest';
import {
  HIGHFLY_TRAINING_SCHEMA_VERSION,
  HIGHFLY_TRAINING_SCORING_VERSION,
  applyHunterProgression,
  commitTrainingCoreStat,
  createHighflyHunterProfile,
} from '../src/highfly/training/core';
import {
  clearActiveHighflyHunterProfile,
  getActiveHighflyHunterProfile,
  setActiveHighflyHunterProfile,
  updateActiveHighflyHunterProfile,
} from '../src/highfly/training/profile_store';

describe('HIGHFLY Training persistence PF-5', () => {
  it('preserves decimal Training Core across progression changes', () => {
    clearActiveHighflyHunterProfile();
    let profile = createHighflyHunterProfile({ profileId: 'offline:hunter', classId: 'warrior' });
    profile = commitTrainingCoreStat(
      profile, 'STR', 0.37,
      {
        source: 'training-performance-gate',
        scoringVersion: HIGHFLY_TRAINING_SCORING_VERSION,
        evidenceId: 'persisted-strength',
      },
      { progress: 7, confidence: 0.91, readiness: 0.72 },
    );
    setActiveHighflyHunterProfile(profile);
    updateActiveHighflyHunterProfile((current) =>
      applyHunterProgression(current, { classId: 'mage', level: 99, xp: 321 }),
    );
    const switched = getActiveHighflyHunterProfile()!;
    expect(switched.awakening.classId).toBe('warrior');
    expect(switched.training.core.STR.current).toBeCloseTo(0.37, 10);
    expect(switched.training.core.STR.trainingGrowth).toBeCloseTo(0.37, 10);
    expect(switched.training.core.STR.trainingAllocated).toBeCloseTo(0.37, 10);
    expect(switched.training.core.STR.awakeningBase).toBe(0);
    expect(switched.training.core.STR.naturalLevelGrowth).toBe(0);
  });

  it('save/load is exact and class identity does not inject Core', () => {
    clearActiveHighflyHunterProfile();
    const before = createHighflyHunterProfile({ profileId: 'offline:persist', classId: 'hunter' });
    setActiveHighflyHunterProfile(before);
    const first = getActiveHighflyHunterProfile()!;
    const serialized = JSON.stringify(first);
    setActiveHighflyHunterProfile(JSON.parse(serialized));
    const restored = getActiveHighflyHunterProfile()!;
    expect(restored).toEqual(first);
    expect(restored.schemaVersion).toBe(HIGHFLY_TRAINING_SCHEMA_VERSION);
    expect(Object.values(restored.awakening.base).reduce((a, b) => a + b, 0)).toBe(0);
    expect(Object.values(restored.training.points.allocated).reduce((a, b) => a + b, 0)).toBe(0);
  });
});
