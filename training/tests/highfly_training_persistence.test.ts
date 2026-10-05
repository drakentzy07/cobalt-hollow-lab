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

describe('HIGHFLY Training persistence RUN138', () => {
  it('preserves Awakening + decimal Training Growth across progression changes', () => {
    clearActiveHighflyHunterProfile();
    let profile = createHighflyHunterProfile({ profileId: 'offline:hunter', classId: 'warrior' });
    const base = profile.training.core.STR.current;
    profile = commitTrainingCoreStat(
      profile, 'STR', base + 0.37,
      {
        source: 'training-performance-gate',
        scoringVersion: HIGHFLY_TRAINING_SCORING_VERSION,
        evidenceId: 'persisted-strength',
      },
      { progress: 7, confidence: 0.91, readiness: 0.72 },
    );
    setActiveHighflyHunterProfile(profile);
    updateActiveHighflyHunterProfile((current) =>
      applyHunterProgression(current, { classId: 'mage', level: 14, xp: 321 }),
    );
    const switched = getActiveHighflyHunterProfile()!;
    expect(switched.awakening.classId).toBe('warrior');
    expect(switched.training.core.STR.current).toBeCloseTo(base + 0.37, 10);
    expect(switched.training.core.STR.trainingGrowth).toBeCloseTo(0.37, 10);
  });

  it('save/load is exact and does not duplicate Awakening', () => {
    clearActiveHighflyHunterProfile();
    const before = createHighflyHunterProfile({ profileId: 'offline:persist', classId: 'hunter' });
    setActiveHighflyHunterProfile(before);
    const first = getActiveHighflyHunterProfile()!;
    const serialized = JSON.stringify(first);
    setActiveHighflyHunterProfile(JSON.parse(serialized));
    const restored = getActiveHighflyHunterProfile()!;
    expect(restored).toEqual(first);
    expect(restored.schemaVersion).toBe(HIGHFLY_TRAINING_SCHEMA_VERSION);
    const total = Object.values(restored.awakening.base).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(50, 8);
  });
});
