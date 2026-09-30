import { describe, expect, it } from 'vitest';
import {
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

describe('HIGHFLY Training persistence RUN1-F', () => {
  it('keeps one active Training profile independently from CharacterState', () => {
    clearActiveHighflyHunterProfile();
    const profile = createHighflyHunterProfile({
      profileId: 'offline:hunter',
      createdAt: '2026-09-29T00:00:00.000Z',
      classId: 'warrior',
    });
    setActiveHighflyHunterProfile(profile);
    expect(getActiveHighflyHunterProfile()?.profileId).toBe('offline:hunter');
  });

  it('preserves Core Stats when class changes', () => {
    clearActiveHighflyHunterProfile();
    let profile = createHighflyHunterProfile({
      profileId: 'offline:hunter',
      createdAt: '2026-09-29T00:00:00.000Z',
      classId: 'warrior',
    });
    profile = commitTrainingCoreStat(profile, 'STR', 42, {
      source: 'training-performance-gate',
      scoringVersion: HIGHFLY_TRAINING_SCORING_VERSION,
      evidenceId: 'persisted-strength',
    }, {
      progress: 7,
      confidence: 0.91,
      readiness: 0.72,
    });
    setActiveHighflyHunterProfile(profile);

    updateActiveHighflyHunterProfile((current) =>
      applyHunterProgression(current, {
        classId: 'mage',
        level: 14,
        xp: 321,
      }),
    );

    const switched = getActiveHighflyHunterProfile();
    expect(switched?.hunter.classId).toBe('mage');
    expect(switched?.hunter.level).toBe(14);
    expect(switched?.training.core.STR.current).toBe(42);
    expect(switched?.training.core.STR.peak).toBe(42);
    expect(switched?.training.core.STR.progress).toBe(7);
    expect(switched?.training.core.STR.confidence).toBeCloseTo(0.91);
    expect(switched?.training.core.STR.readiness).toBeCloseTo(0.72);
  });

  it('can replace the active snapshot after reload without changing schema', () => {
    clearActiveHighflyHunterProfile();
    const before = createHighflyHunterProfile({
      profileId: 'offline:persist',
      createdAt: '2026-09-29T00:00:00.000Z',
    });
    setActiveHighflyHunterProfile(before);

    const serialized = JSON.stringify(getActiveHighflyHunterProfile());
    const restored = JSON.parse(serialized);
    setActiveHighflyHunterProfile(restored);

    expect(getActiveHighflyHunterProfile()).toEqual(before);
    expect(getActiveHighflyHunterProfile()?.schemaVersion).toBe(1);
  });
});
