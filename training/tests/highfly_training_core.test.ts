import { describe, expect, it } from 'vitest';
import {
  HIGHFLY_CORE_STATS,
  HIGHFLY_TRAINING_SCORING_VERSION,
  applyHunterProgression,
  commitTrainingCoreStat,
  coreSnapshot,
  createHighflyHunterProfile,
} from '../src/highfly/training/core';
import {
  HF_REFERENCE_5D_SUPREME_V1,
  HIGHFLY_BASE_MESOCYCLE,
} from '../src/highfly/training/reference_routine';

describe('HIGHFLY Training Core RUN1-A', () => {
  it('starts all Core Stats uncalibrated and independent from Hunter level', () => {
    const profile = createHighflyHunterProfile({
      profileId: 'test-hunter',
      createdAt: '2026-09-29T00:00:00.000Z',
      level: 25,
      classId: 'warrior',
    });

    expect(profile.hunter.level).toBe(25);
    expect(HIGHFLY_CORE_STATS).toEqual(['STR', 'AGI', 'VIT', 'PER', 'INT']);
    for (const stat of HIGHFLY_CORE_STATS) {
      expect(profile.training.core[stat]).toEqual({
        current: 0,
        peak: 0,
        progress: 0,
        confidence: 0,
        readiness: 1,
        calibrated: false,
      });
    }
  });

  it('level, class and subclass progression cannot mutate Training Core', () => {
    const profile = createHighflyHunterProfile({
      profileId: 'ownership',
      createdAt: '2026-09-29T00:00:00.000Z',
      level: 1,
    });
    const before = coreSnapshot(profile);

    const leveled = applyHunterProgression(profile, {
      level: 26,
      xp: 9999,
      classId: 'rogue',
      subclassId: 'shadow_dancer',
      rank: 'D',
    });

    expect(leveled.hunter.level).toBe(26);
    expect(leveled.hunter.classId).toBe('rogue');
    expect(leveled.hunter.subclassId).toBe('shadow_dancer');
    expect(coreSnapshot(leveled)).toBe(before);
  });

  it('only a Training Performance Gate proof may consolidate a Core Stat', () => {
    const profile = createHighflyHunterProfile({
      profileId: 'gate',
      createdAt: '2026-09-29T00:00:00.000Z',
    });

    expect(() =>
      commitTrainingCoreStat(
        profile,
        'STR',
        20,
        {
          source: 'level-up',
          scoringVersion: HIGHFLY_TRAINING_SCORING_VERSION,
          evidenceId: 'bad',
        } as never,
      ),
    ).toThrow(/only be committed by Training Core/);

    const calibrated = commitTrainingCoreStat(
      profile,
      'STR',
      20,
      {
        source: 'training-performance-gate',
        scoringVersion: HIGHFLY_TRAINING_SCORING_VERSION,
        evidenceId: 'block-001-strength-gate',
      },
      { confidence: 0.82, readiness: 0.74, progress: 4 },
    );

    expect(calibrated.training.core.STR.current).toBe(20);
    expect(calibrated.training.core.STR.peak).toBe(20);
    expect(calibrated.training.core.STR.calibrated).toBe(true);
    expect(calibrated.training.core.STR.confidence).toBeCloseTo(0.82);
  });

  it('preserves historical Peak if Current later drops', () => {
    const profile = createHighflyHunterProfile({
      profileId: 'peak',
      createdAt: '2026-09-29T00:00:00.000Z',
    });
    const high = commitTrainingCoreStat(profile, 'VIT', 30, {
      source: 'training-performance-gate',
      scoringVersion: HIGHFLY_TRAINING_SCORING_VERSION,
      evidenceId: 'vit-high',
    });
    const lower = commitTrainingCoreStat(high, 'VIT', 27, {
      source: 'training-performance-gate',
      scoringVersion: HIGHFLY_TRAINING_SCORING_VERSION,
      evidenceId: 'vit-return',
    });

    expect(lower.training.core.VIT.current).toBe(27);
    expect(lower.training.core.VIT.peak).toBe(30);
  });

  it('keeps the official reference at five days with a 3+1 base mesocycle', () => {
    expect(HF_REFERENCE_5D_SUPREME_V1).toHaveLength(5);
    expect(HIGHFLY_BASE_MESOCYCLE).toEqual({
      weeks: 4,
      loadingWeeks: 3,
      deloadWeeks: 1,
    });

    const ids = HF_REFERENCE_5D_SUPREME_V1.flatMap((day) =>
      day.exercises.map((exercise) => exercise.exerciseId),
    );
    expect(ids).toContain('back_squat');
    expect(ids).toContain('bench_press');
    expect(ids).toContain('hang_power_clean');
    expect(ids).toContain('overhead_press');
    expect(ids).toContain('deadlift');
  });

  it('does not publish personal kilogram loads inside the public reference source', () => {
    const serialized = JSON.stringify(HF_REFERENCE_5D_SUPREME_V1);
    expect(serialized).not.toContain('100 kg');
    expect(serialized).not.toContain('120 kg');
    expect(serialized).not.toContain('80 kg');
    expect(serialized).not.toContain('55 kg');
  });
});
