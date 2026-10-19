import { describe, expect, it } from 'vitest';
import {
  classifyObservedRole,
  estimateE1RmKg,
  evaluateTrainingSession,
  scoreTrainingSet,
  type ExerciseDefinition,
  type SetRecord,
} from '../src/highfly/training/engine';

const squat: ExerciseDefinition = {
  exerciseId: 'back_squat',
  pattern: 'squat',
  role: 'strength',
  loadMode: 'external_kg',
  rmReferenceKg: 100,
};

function set(overrides: Partial<SetRecord> = {}): SetRecord {
  return {
    setId: 'set-1',
    exerciseId: 'back_squat',
    reps: 5,
    loadKg: 85,
    restSec: 180,
    intent: 'strength',
    quality: 1,
    ...overrides,
  };
}

describe('HIGHFLY Training Engine RUN1-B', () => {
  it('treats heavy 1-6 rep work as STR-dominant evidence', () => {
    const result = scoreTrainingSet(squat, set(), 1, false);
    expect(result.evidence.observedRole).toBe('strength');
    expect(result.stimulus.STR).toBeGreaterThan(result.stimulus.VIT);
    expect(result.stimulus.STR).toBeGreaterThan(result.stimulus.AGI);
    expect(result.stimulus.PER).toBe(0);
    expect(result.stimulus.INT).toBe(0);
  });

  it('treats explosive 60-80% work as AGI-dominant power evidence', () => {
    const powerSet = set({
      reps: 3,
      loadKg: 70,
      restSec: 150,
      intent: 'power',
    });
    const result = scoreTrainingSet(squat, powerSet, 1, false);
    expect(result.evidence.observedRole).toBe('power');
    expect(result.stimulus.AGI).toBeGreaterThan(result.stimulus.STR);
    expect(result.stimulus.AGI).toBeGreaterThan(result.stimulus.VIT);
  });

  it('treats 7+ productive reps as VIT-dominant volume support instead of farming STR', () => {
    const volumeSet = set({
      reps: 10,
      loadKg: 60,
      restSec: 90,
      intent: 'hypertrophy',
    });
    const result = scoreTrainingSet(squat, volumeSet, 1, false);
    expect(result.evidence.observedRole).toBe('hypertrophy');
    expect(result.stimulus.VIT).toBeGreaterThan(result.stimulus.STR);
  });

  it('keeps 15+ accessory work contribution limited', () => {
    const accessorySet = set({
      reps: 20,
      loadKg: 25,
      restSec: 60,
      intent: 'accessory',
    });
    const accessory = scoreTrainingSet(squat, accessorySet, 1, false);
    const heavy = scoreTrainingSet(squat, set(), 1, false);
    expect(accessory.evidence.observedRole).toBe('accessory');
    expect(accessory.stimulus.STR).toBeLessThan(heavy.stimulus.STR * 0.25);
  });

  it('uses tonnage only as a diagnostic while productive stimulus saturates', () => {
    const definitions = new Map([[squat.exerciseId, squat]]);
    const one = evaluateTrainingSession(
      {
        sessionId: 'one',
        routineId: 'ref',
        block: 'base',
        week: 1,
        day: 1,
        readiness: 1,
        isDeload: false,
        completed: true,
        sets: [set({ setId: '1' })],
      },
      definitions,
    );
    const many = evaluateTrainingSession(
      {
        sessionId: 'many',
        routineId: 'ref',
        block: 'base',
        week: 1,
        day: 1,
        readiness: 1,
        isDeload: false,
        completed: true,
        sets: Array.from({ length: 20 }, (_, i) => set({ setId: String(i + 1) })),
      },
      definitions,
    );

    expect(many.diagnosticTonnageKg).toBe(one.diagnosticTonnageKg * 20);
    expect(many.stimulus.STR).toBeLessThan(one.stimulus.STR * 8);
  });

  it('does not reward heavy deload work above the same normal set', () => {
    const normal = scoreTrainingSet(squat, set(), 1, false);
    const deload = scoreTrainingSet(squat, set(), 1, true);
    expect(deload.stimulus.STR).toBeLessThan(normal.stimulus.STR);
    expect(deload.fatigue.deloadFlag).toBe(true);
  });

  it('captures comparable e1RM evidence without directly granting a Stat Up', () => {
    expect(estimateE1RmKg(100, 1)).toBe(100);
    expect(estimateE1RmKg(80, 5)).toBeCloseTo(93.333333, 4);
    expect(classifyObservedRole(squat, set({ loadKg: 85, reps: 5 }))).toBe('strength');
  });

  it('returns zero productive stimulus for an incomplete session', () => {
    const result = evaluateTrainingSession(
      {
        sessionId: 'incomplete',
        routineId: 'ref',
        block: 'base',
        week: 1,
        day: 1,
        readiness: 1,
        isDeload: false,
        completed: false,
        sets: [set()],
      },
      new Map([[squat.exerciseId, squat]]),
    );
    expect(result.stimulus).toEqual({ STR: 0, AGI: 0, VIT: 0, PER: 0, INT: 0 });
    expect(result.evidence).toHaveLength(0);
  });
});
