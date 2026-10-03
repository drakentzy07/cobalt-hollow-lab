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
  const profile = createHighflyHunterProfile({ profileId: 'rm-profile' });
  profile.training.loadCalibration = {
    tmFactor: 0.9,
    roundKg: 2.5,
    athlete: {
      sex: 'male',
      ageYears: 32,
      bodyweightKg: 80,
      updatedAt: '2026-10-03T00:00:00.000Z',
    },
    lifts: {
      back_squat: {
        oneRmKg,
        estimatedOneRmKg: oneRmKg,
        verifiedOneRmKg: oneRmKg,
        relativeToBodyweight: oneRmKg / 80,
        status: 'verified',
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
  behavioralPerformance: {
    PER: 100,
    INT: 100,
    completion: 1,
    rest: 1,
    prescription: 1,
  },
};

describe('HIGHFLY RUN1-B real session Core', () => {
  it('gives stronger calibrated work more physical authority without changing PER/INT', () => {
    const novice = withSquatRm(80);
    const advanced = withSquatRm(160);
    const noviceResult = applySessionCapacityAuthority(novice, rawResult);
    const advancedResult = applySessionCapacityAuthority(advanced, rawResult);

    expect(sessionCapacityFactor(advanced, 'STR')).toBeGreaterThan(
      sessionCapacityFactor(novice, 'STR'),
    );
    expect(advancedResult.stimulus.STR).toBeGreaterThan(noviceResult.stimulus.STR);
    expect(advancedResult.stimulus.PER).toBe(noviceResult.stimulus.PER);
    expect(advancedResult.stimulus.INT).toBe(noviceResult.stimulus.INT);
  });

  it('slows pending adaptation as consolidated Core gets higher', () => {
    expect(adaptationStimulusForCurrent(35, 3)).toBeLessThan(
      adaptationStimulusForCurrent(3, 3),
    );
  });

  it('migrates the old fixed-10 save from its own recorded session instead of wiping RM/cycle', () => {
    const legacy = withSquatRm(160);
    (legacy as { scoringVersion: string }).scoringVersion = 'run1-a';
    legacy.training.core.STR = {
      current: 10,
      peak: 10,
      progress: 2.4,
      confidence: 0.92,
      readiness: 1,
      calibrated: true,
    };
    legacy.training.history = [{
      sessionId: 'legacy-first',
      recordedAt: '2026-10-02T00:00:00.000Z',
      stat: 'STR',
      stimulus: 3,
      performanceIndex: 120,
      outcome: 'calibrated',
    }];
    legacy.training.cycleProgression!.completedSessions = ['1:1'];

    const migrated = migrateLegacyFixedCoreBaseline(legacy);
    expect(migrated.scoringVersion).toBe(HIGHFLY_TRAINING_SCORING_VERSION);
    expect(migrated.training.core.STR.current).not.toBe(10);
    expect(migrated.training.core.STR.current).toBeGreaterThan(3);
    expect(migrated.training.core.STR.progress).toBe(2.4);
    expect(migrated.training.loadCalibration?.lifts.back_squat?.oneRmKg).toBe(160);
    expect(migrated.training.cycleProgression?.completedSessions).toEqual(['1:1']);
  });

  it('sets first STR Core to the earned first-session result, never a fixed 10', () => {
    const profile = withSquatRm(160);
    const result = runTrainingSessionPipeline({
      profile,
      session: {
        sessionId: 'first-real-session',
        routineId: 'HF_HIGHFLY_PERSONAL_5D_V1',
        block: 'Carga',
        week: 1,
        day: 1,
        readiness: 1,
        isDeload: false,
        completed: true,
        sets: [{
          setId: 'sq-1',
          exerciseId: 'back_squat',
          reps: 5,
          loadKg: 128,
          restSec: 180,
          intent: 'strength',
          quality: 1,
        }],
      },
      definitions: new Map([['back_squat', {
        exerciseId: 'back_squat',
        pattern: 'squat',
        role: 'strength',
        loadMode: 'external_kg',
        rmReferenceKg: 160,
      }]]),
      recordedAt: '2026-10-03T00:00:00.000Z',
    });

    expect(result.profile.training.core.STR.current).toBeCloseTo(
      result.sessionResult.stimulus.STR,
      2,
    );
    expect(result.profile.training.core.STR.current).not.toBe(10);
    expect(result.profile.training.core.STR.progress).toBe(0);
  });
});
