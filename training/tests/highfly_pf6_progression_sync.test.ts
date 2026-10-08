import { afterEach, describe, expect, it } from 'vitest';
import {
  HIGHFLY_CORE_STATS,
  HIGHFLY_TRAINING_SCORING_VERSION,
  allocateTrainingPoints,
  applyHunterProgression,
  createHighflyHunterProfile,
  earnTrainingPoints,
} from '../src/highfly/training/core';
import {
  clearActiveHighflyHunterProfile,
  getActiveHighflyHunterProfile,
  setActiveHighflyHunterProfile,
} from '../src/highfly/training/profile_store';
import { syncHighflyPf6FromGameplay } from '../src/highfly/training/pf6_progression_sync';

const local = (level: number, barXp: number, eventEntityId = 42) => ({
  localEntityId: 42, eventEntityId, level, barXp, classId: 'warrior',
});

afterEach(() => clearActiveHighflyHunterProfile());

describe('HIGHFLY PF-6 C: single-authority gameplay progression projection', () => {
  it('does not create a profile or mint any XP when no Hunter exists', () => {
    expect(syncHighflyPf6FromGameplay(local(2, 25))).toBeNull();
  });

  it('mirrors a settled gameplay XP event and subsequent levelup', () => {
    setActiveHighflyHunterProfile(createHighflyHunterProfile({
      profileId: 'pf6c-local', classId: 'warrior', level: 1,
    }));
    const a = syncHighflyPf6FromGameplay(local(1, 175));
    expect(a?.hunter).toMatchObject({ level: 1, xp: 175 });
    const b = syncHighflyPf6FromGameplay(local(2, 25));
    expect(b?.hunter).toMatchObject({ level: 2, xp: 25 });
    const sum = HIGHFLY_CORE_STATS.reduce(
      (total, stat) => total + (b?.training.core[stat].naturalLevelGrowth ?? 0), 0,
    );
    expect(sum).toBeCloseTo(1, 9);
    expect(b?.training.points.earned).toBe(0);
  });

  it('preserves every validated Training allocation and exact wallet after leveling', () => {
    let profile = createHighflyHunterProfile({
      profileId: 'pf6c-trained', classId: 'warrior', level: 1,
    });
    profile = earnTrainingPoints(profile, 4.5, {
      source: 'training-performance-gate',
      scoringVersion: HIGHFLY_TRAINING_SCORING_VERSION,
      evidenceId: 'pf6c-existing-real-session',
    });
    profile = allocateTrainingPoints(profile, 'AGI', 4);
    setActiveHighflyHunterProfile(profile);
    const before = getActiveHighflyHunterProfile()!;
    const result = syncHighflyPf6FromGameplay(local(50, 888))!;
    expect(result.hunter).toMatchObject({ level: 50, xp: 888 });
    expect(result.training.points).toEqual(before.training.points);
    expect(result.training.core.AGI.trainingAllocated).toBe(4);
    expect(result.training.core.AGI.current).toBeCloseTo(
      result.training.core.AGI.awakeningBase +
      result.training.core.AGI.naturalLevelGrowth + 4, 8,
    );
    expect(result.training.history).toEqual(before.training.history);
  });

  it('ignores all other entities, classes, malformed values and invalid Extended levels', () => {
    setActiveHighflyHunterProfile(createHighflyHunterProfile({
      profileId: 'pf6c-guards', classId: 'warrior',
    }));
    const before = getActiveHighflyHunterProfile();
    expect(syncHighflyPf6FromGameplay(local(50, 50, 999))).toBeNull();
    expect(syncHighflyPf6FromGameplay({ ...local(50, 50), classId: 'mage' })).toBeNull();
    expect(syncHighflyPf6FromGameplay(local(100, 2))).toBeNull();
    expect(syncHighflyPf6FromGameplay(local(1.5, 2))).toBeNull();
    expect(syncHighflyPf6FromGameplay(local(2, Number.NaN))).toBeNull();
    expect(syncHighflyPf6FromGameplay(local(2, -1))).toBeNull();
    expect(getActiveHighflyHunterProfile()).toBe(before);
  });

  it('caps at LV99, clears bar and is idempotent across repeated replay events', () => {
    setActiveHighflyHunterProfile(createHighflyHunterProfile({
      profileId: 'pf6c-cap', classId: 'warrior', level: 98,
    }));
    const finished = syncHighflyPf6FromGameplay(local(99, 900));
    expect(finished?.hunter.level).toBe(99);
    expect(finished?.hunter.xp).toBe(0);
    const natural = HIGHFLY_CORE_STATS.reduce(
      (sum, stat) => sum + (finished?.training.core[stat].naturalLevelGrowth ?? 0), 0,
    );
    expect(natural).toBeCloseTo(98, 9);
    expect(syncHighflyPf6FromGameplay(local(99, 0))).toBe(finished);
  });

  it('can restore saved XP without touching Training or generating rewards', () => {
    let stored = createHighflyHunterProfile({
      profileId: 'pf6c-save', classId: 'warrior', level: 30,
    });
    stored = applyHunterProgression(stored, { level: 30, xp: 314 });
    setActiveHighflyHunterProfile(JSON.parse(JSON.stringify(stored)));
    expect(syncHighflyPf6FromGameplay(local(30, 314))?.hunter).toMatchObject({ level: 30, xp: 314 });
    expect(getActiveHighflyHunterProfile()?.training.points.earned).toBe(0);
  });
});
