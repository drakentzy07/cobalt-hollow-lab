import { describe, expect, it } from 'vitest';
import {
  HIGHFLY_TRAINING_SCORING_VERSION,
  createHighflyHunterProfile,
  type HighflyHunterProfile,
} from '../src/highfly/training/core';
import type { SessionTrainingResult } from '../src/highfly/training/engine';
import {
  adaptationStimulusForCurrent,
  applySessionCapacityAuthority,
  migrateLegacyFixedCoreBaseline,
  sessionCapacityFactor,
} from '../src/highfly/training/session_core';
import { runTrainingSessionPipeline } from '../src/highfly/training/pipeline';

function withSquatRm(oneRmKg: number): HighflyHunterProfile {
  const profile = createHighflyHunterProfile({ profileId: 'rm-profile', classId: 'warrior' });
  profile.training.loadCalibration = {
    tmFactor: 0.9, roundKg: 2.5,
    athlete: { sex: 'male', ageYears: 32, bodyweightKg: 80, updatedAt: '2026-10-03T00:00:00.000Z' },
    lifts: {
      back_squat: {
        oneRmKg, estimatedOneRmKg: oneRmKg, verifiedOneRmKg: oneRmKg,
        relativeToBodyweight: oneRmKg / 80, status: 'verified',
        updatedAt: '2026-10-03T00:00:00.000Z',
      },
    },
  };
  return profile;
}

const rawResult: SessionTrainingResult = {
  evidence: [],
  stimulus: { STR: 3, AGI: 2, VIT: 4, PER: 1.2, INT: 1.1 },
  fatigue: { local: 1, systemic: 1, trend: 1, deloadFlag: false },
  diagnosticTonnageKg: 3000,
  behavioralPerformance: { PER: 100, INT: 100, completion: 1, rest: 1, prescription: 1 },
};

describe('HIGHFLY Training-only Core migration + session authority', () => {
  it('stronger real RM gives stronger session authority without granting stats by itself', () => {
    const novice = withSquatRm(80);
    const advanced = withSquatRm(160);
    expect(sessionCapacityFactor(advanced, 'STR')).toBeGreaterThan(sessionCapacityFactor(novice, 'STR'));
    expect(applySessionCapacityAuthority(advanced, rawResult).stimulus.STR)
      .toBeGreaterThan(applySessionCapacityAuthority(novice, rawResult).stimulus.STR);
  });

  it('slows adaptation as final Core gets higher', () => {
    expect(adaptationStimulusForCurrent(35, 3)).toBeLessThan(adaptationStimulusForCurrent(15, 3));
  });

  it('migrates old earned Core into Training-only allocation and is idempotent', () => {
    const legacy = withSquatRm(160) as any;
    legacy.schemaVersion = 1;
    legacy.scoringVersion = 'run1-b';
    delete legacy.awakening;
    for (const stat of ['STR','AGI','VIT','PER','INT']) {
      legacy.training.core[stat] = {
        current: stat === 'STR' ? 2.9 : 1.1,
        peak: stat === 'STR' ? 2.9 : 1.1,
        progress: 2.4, confidence: 0.92, readiness: 1, calibrated: true,
      };
    }
    legacy.training.cycleProgression.completedSessions = ['1:1'];

    const migrated = migrateLegacyFixedCoreBaseline(legacy);
    expect(migrated.scoringVersion).toBe(HIGHFLY_TRAINING_SCORING_VERSION);
    expect(migrated.training.core.STR.trainingGrowth).toBeCloseTo(2.9, 10);
    expect(migrated.training.core.STR.trainingAllocated).toBeCloseTo(2.9, 10);
    expect(migrated.training.core.STR.current).toBeCloseTo(2.9, 10);
    expect(migrated.training.core.STR.awakeningBase).toBe(0);
    expect(migrated.training.core.STR.naturalLevelGrowth).toBe(0);
    expect(migrated.awakening.budget).toBe(0);
    expect(Object.values(migrated.awakening.base).reduce((sum, value) => sum + value, 0)).toBe(0);
    expect(migrated.training.points.earned).toBeGreaterThan(0);
    expect(migrated.training.points.allocated.STR).toBeCloseTo(2.9, 10);
    expect(migrated.training.cycleProgression?.completedSessions).toEqual(['1:1']);
    expect(migrateLegacyFixedCoreBaseline(migrated)).toEqual(migrated);
  });

  it('first valid session preserves Core and earns decimal unallocated Training Points', () => {
    const profile = withSquatRm(160);
    const before = profile.training.core.STR.current;
    const result = runTrainingSessionPipeline({
      profile,
      session: {
        sessionId: 'first-real-session', routineId: 'HF_HIGHFLY_PERSONAL_5D_V1',
        block: 'Carga', week: 1, day: 1, readiness: 1, isDeload: false, completed: true,
        sets: [{ setId: 'sq-1', exerciseId: 'back_squat', reps: 5, loadKg: 128, restSec: 180, intent: 'strength', quality: 1 }],
      },
      definitions: new Map([['back_squat', {
        exerciseId: 'back_squat', pattern: 'squat', role: 'strength',
        loadMode: 'external_kg', rmReferenceKg: 160,
      }]]),
      recordedAt: '2026-10-03T00:00:00.000Z',
    });
    const state = result.profile.training.core.STR;
    expect(state.current).toBeCloseTo(before, 10);
    expect(state.trainingGrowth).toBe(0);
    expect(state.trainingAllocated).toBe(0);
    expect(state.calibrated).toBe(true);
    expect(result.profile.training.points.available).toBeGreaterThan(0);
    expect(result.profile.training.points.available).toBeLessThan(1);
    expect(state.progress).toBe(0);
  });
});
