import { describe, expect, it } from 'vitest';
import { createHighflyHunterProfile } from '../src/highfly/training/core';
import {
  estimateEpleyOneRmKg,
  evaluationDaysRemaining,
  submitRmCalibration,
} from '../src/highfly/training/rm_calibration';

describe('HIGHFLY RM calibration authority', () => {
  it('uses Epley only inside the approved 2-6 rep window', () => {
    expect(estimateEpleyOneRmKg(100, 5)).toBe(116.7);
    expect(() => estimateEpleyOneRmKg(100, 1)).toThrow(/2 y 6/);
    expect(() => estimateEpleyOneRmKg(100, 7)).toThrow(/2 y 6/);
  });

  it('verifies a plausible first calibration immediately without touching Core Stats', () => {
    const profile = createHighflyHunterProfile({ profileId: 'rm-normal' });
    const result = submitRmCalibration(profile, 'bench_press', {
      sex: 'male',
      ageYears: 30,
      bodyweightKg: 80,
      loadKg: 90,
      reps: 5,
      recordedAt: '2026-10-03T12:00:00.000Z',
    });
    expect(result.status).toBe('verified');
    expect(result.entry.oneRmKg).toBe(105);
    expect(result.profile.training.core.STR.current).toBe(0);
    expect(result.profile.training.core.AGI.current).toBe(0);
  });

  it('holds an extraordinary first mark at moderate authority for seven days', () => {
    const profile = createHighflyHunterProfile({ profileId: 'rm-review' });
    const result = submitRmCalibration(profile, 'bench_press', {
      sex: 'male',
      ageYears: 30,
      bodyweightKg: 80,
      loadKg: 180,
      reps: 5,
      recordedAt: '2026-10-03T12:00:00.000Z',
    });
    expect(result.status).toBe('evaluation');
    expect(result.entry.estimatedOneRmKg).toBe(210);
    expect(result.entry.oneRmKg).toBe(96);
    expect(evaluationDaysRemaining(result.entry, '2026-10-03T12:00:00.000Z')).toBe(7);
  });

  it('releases an extraordinary mark only after a compatible second sample one week later', () => {
    const profile = createHighflyHunterProfile({ profileId: 'rm-confirm' });
    const first = submitRmCalibration(profile, 'deadlift', {
      sex: 'male',
      ageYears: 32,
      bodyweightKg: 80,
      loadKg: 240,
      reps: 4,
      recordedAt: '2026-10-03T12:00:00.000Z',
    });
    expect(first.status).toBe('evaluation');

    const second = submitRmCalibration(first.profile, 'deadlift', {
      sex: 'male',
      ageYears: 32,
      bodyweightKg: 80,
      loadKg: 235,
      reps: 5,
      recordedAt: '2026-10-10T12:00:01.000Z',
    });
    expect(second.status).toBe('verified');
    expect(second.entry.oneRmKg).toBeGreaterThan(260);
    expect(second.entry.verifiedOneRmKg).toBe(second.entry.oneRmKg);
  });

  it('treats sex, age and bodyweight as plausibility context, never direct Core grants', () => {
    const profile = createHighflyHunterProfile({ profileId: 'rm-context' });
    const result = submitRmCalibration(profile, 'overhead_press', {
      sex: 'female',
      ageYears: 52,
      bodyweightKg: 60,
      loadKg: 25,
      reps: 6,
      recordedAt: '2026-10-03T12:00:00.000Z',
    });
    expect(result.profile.training.loadCalibration?.athlete?.sex).toBe('female');
    expect(result.profile.training.loadCalibration?.athlete?.ageYears).toBe(52);
    expect(result.profile.training.loadCalibration?.athlete?.bodyweightKg).toBe(60);
    expect(result.profile.training.core.INT.current).toBe(0);
  });
});
