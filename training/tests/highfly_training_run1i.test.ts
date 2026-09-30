import { describe, expect, it } from 'vitest';
import {
  HIGHFLY_12_WEEK_MACROCYCLE,
  HIGHFLY_PERSONAL_5D_ROUTINE,
  HF_HIGHFLY_PERSONAL_5D_V1_ID,
  derivedLoadRangeKg,
  isEditableAccessory,
  macrocycleWeek,
  mainPrescription,
  restClockLabel,
  trainingMaxKg,
} from '../src/highfly/training/personal_routine';
import { createHighflyHunterProfile } from '../src/highfly/training/core';
import { runTrainingSessionPipeline } from '../src/highfly/training/pipeline';

describe('HIGHFLY Training RUN1-I routine authority', () => {
  it('keeps the exact 5-day HIGHFLY day order', () => {
    expect(HF_HIGHFLY_PERSONAL_5D_V1_ID).toBe('HF_HIGHFLY_PERSONAL_5D_V1');
    expect(HIGHFLY_PERSONAL_5D_ROUTINE.map((day) => day.name)).toEqual([
      'Pierna A',
      'Torso A',
      'Combinado',
      'Torso B',
      'Posterior',
    ]);
  });

  it('keeps the 12-week macrocycle and exact main percentages', () => {
    expect(HIGHFLY_12_WEEK_MACROCYCLE).toHaveLength(12);
    expect(macrocycleWeek(1)).toMatchObject({
      block: 'Base',
      topReps: 5,
      backoffPercent: 0.7,
      backoffSets: 4,
      backoffReps: 5,
    });
    expect(macrocycleWeek(7).topPercent).toEqual({
      back_squat: 0.95,
      bench_press: 0.9,
      overhead_press: 0.9,
      deadlift: 0.95,
    });
    expect(macrocycleWeek(11).backoffSets).toBe(0);
    expect(macrocycleWeek(12).topReps).toBe('TEST');
  });

  it('calculates main loads from private RM through TM without public personal loads', () => {
    expect(trainingMaxKg(100)).toBe(90);
    expect(mainPrescription('back_squat', 100, 1)).toMatchObject({
      topKg: 67.5,
      topReps: 5,
      backoffKg: 62.5,
      backoffSets: 4,
      backoffReps: 5,
    });
    expect(mainPrescription('bench_press', 80, 1)).toMatchObject({
      topKg: 55,
      backoffKg: 50,
    });
  });

  it('derives technical ranges instead of exposing free main-load editing', () => {
    expect(derivedLoadRangeKg(100, [0.75, 0.85])).toEqual([67.5, 77.5]);
    expect(derivedLoadRangeKg(100, [0.6, 0.7])).toEqual([55, 62.5]);
  });

  it('only marks approved dumbbell/machine accessory loads editable', () => {
    const editable = HIGHFLY_PERSONAL_5D_ROUTINE.flatMap((day) => day.exercises)
      .filter(isEditableAccessory)
      .map((exercise) => exercise.exerciseId);

    expect(editable).toContain('db_row');
    expect(editable).toContain('cable_row');
    expect(editable).toContain('leg_press');
    expect(editable).not.toContain('back_squat');
    expect(editable).not.toContain('bench_press');
    expect(editable).not.toContain('overhead_press');
    expect(editable).not.toContain('deadlift');
    expect(editable).not.toContain('front_squat');
    expect(editable).not.toContain('speed_squat');
  });

  it('formats authoritative rest clocks', () => {
    expect(restClockLabel(180)).toBe('3:00');
    expect(restClockLabel(150)).toBe('2:30');
    expect(restClockLabel(90)).toBe('1:30');
    expect(restClockLabel(75)).toBe('1:15');
  });

  it('does not let non-main strength exercises create automatic STR calibration', () => {
    const profile = createHighflyHunterProfile({ profileId: 'run1i' });
    const result = runTrainingSessionPipeline({
      profile,
      session: {
        sessionId: 'pendlay-only',
        routineId: HF_HIGHFLY_PERSONAL_5D_V1_ID,
        block: 'Base',
        week: 1,
        day: 2,
        readiness: 1,
        isDeload: false,
        completed: true,
        sets: [
          {
            setId: 'pendlay-1',
            exerciseId: 'pendlay_row',
            reps: 5,
            loadKg: 70,
            restSec: 180,
            intent: 'strength',
            quality: 1,
          },
        ],
      },
      definitions: new Map([
        [
          'pendlay_row',
          {
            exerciseId: 'pendlay_row',
            pattern: 'horizontal_pull',
            role: 'strength',
            loadMode: 'external_kg',
            rmReferenceKg: 80,
          },
        ],
      ]),
    });

    expect(result.profile.training.core.STR.calibrated).toBe(false);
    expect(result.outcomes.find((outcome) => outcome.stat === 'STR')?.outcome).toBe(
      'awaiting_performance',
    );
  });
});
