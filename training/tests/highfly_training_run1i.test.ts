import { describe, expect, it } from 'vitest';
import {
  HIGHFLY_4_WEEK_CYCLE,
  HIGHFLY_PERSONAL_5D_ROUTINE,
  HF_HIGHFLY_PERSONAL_5D_V1_ID,
  isEditableAccessory,
  macrocycleWeek,
  plannedLoadKg,
  prescriptionForWeek,
  restClockLabel,
} from '../src/highfly/training/personal_routine';
import { createHighflyHunterProfile } from '../src/highfly/training/core';
import { runTrainingSessionPipeline } from '../src/highfly/training/pipeline';

function exercise(day: number, id: string) {
  const found = HIGHFLY_PERSONAL_5D_ROUTINE
    .find((candidate) => candidate.day === day)
    ?.exercises.find((candidate) => candidate.exerciseId === id);
  if (!found) throw new Error(`missing fixture exercise ${day}/${id}`);
  return found;
}

describe('HIGHFLY Training RUN1-J routine authority', () => {
  it('locks the supplied five-day HIGHFLY routine names and order', () => {
    expect(HF_HIGHFLY_PERSONAL_5D_V1_ID).toBe('HF_HIGHFLY_PERSONAL_5D_V1');
    expect(HIGHFLY_PERSONAL_5D_ROUTINE.map((day) => day.name)).toEqual([
      'Pierna + Hombro (Estabilidad)',
      'Pecho + Hombro',
      'Front + Potencia',
      'Hombros (Fuerza + Completo)',
      'Posterior + Fuerza',
    ]);
  });

  it('uses exactly 3 loading weeks + 1 deload instead of the provisional 12-week macro', () => {
    expect(HIGHFLY_4_WEEK_CYCLE).toHaveLength(4);
    expect(macrocycleWeek(1)).toMatchObject({ block: 'Carga' });
    expect(macrocycleWeek(3)).toMatchObject({ block: 'Carga' });
    expect(macrocycleWeek(4)).toMatchObject({ block: 'Descarga' });
    expect(macrocycleWeek(99).week).toBe(4);
  });

  it('matches the supplied Day 1 squat and clean prescriptions exactly', () => {
    expect(prescriptionForWeek(exercise(1, 'd1_hang_power_clean'), 1)).toMatchObject({
      sets: 4,
      reps: 3,
      percent: 0.70,
      loadKg: 50,
    });
    expect(plannedLoadKg(exercise(1, 'd1_back_squat_top'), 1, 0)).toBe(86);
    expect(plannedLoadKg(exercise(1, 'd1_back_squat_top'), 2, 0)).toBe(92);
    expect(plannedLoadKg(exercise(1, 'd1_back_squat_top'), 3, 0)).toBe(97);
    expect(prescriptionForWeek(exercise(1, 'd1_back_squat_top'), 4)).toBeNull();
    expect(plannedLoadKg(exercise(1, 'd1_back_squat'), 4, 0)).toBe(76);
  });

  it('matches representative exact loads from Days 2 to 5', () => {
    expect(plannedLoadKg(exercise(2, 'd2_push_press'), 3, 0)).toBe(54);
    expect(plannedLoadKg(exercise(2, 'd2_bench'), 2, 0)).toBe(51);
    expect(plannedLoadKg(exercise(3, 'd3_deadlift_top'), 3, 0)).toBe(98);
    expect(plannedLoadKg(exercise(3, 'd3_pendlay'), 4, 0)).toBe(41);
    expect(plannedLoadKg(exercise(4, 'd4_military_top'), 2, 0)).toBe(46);
    expect(plannedLoadKg(exercise(4, 'd4_incline_barbell'), 3, 0)).toBe(47);
    expect(plannedLoadKg(exercise(5, 'd5_hang_power_clean'), 2, 0)).toBe(58);
    expect(plannedLoadKg(exercise(5, 'd5_front_squat'), 4, 0)).toBe(47);
  });

  it('increases percentage-driven loads only after a successful cycle', () => {
    const squat = exercise(1, 'd1_back_squat');
    expect(plannedLoadKg(squat, 1, 0)).toBe(76);
    expect(plannedLoadKg(squat, 1, 1)).toBe(79);
    expect(plannedLoadKg(squat, 1, 2)).toBe(83);

    const bench = exercise(2, 'd2_bench');
    expect(plannedLoadKg(bench, 1, 0)).toBe(47);
    expect(plannedLoadKg(bench, 1, 1)).toBe(49);
  });

  it('keeps blank accessory weights editable instead of inventing kilograms', () => {
    const lateral = exercise(1, 'd1_lateral_raise');
    expect(isEditableAccessory(lateral)).toBe(true);
    expect(prescriptionForWeek(lateral, 1)).toMatchObject({ sets: 3, reps: 20 });
    expect(plannedLoadKg(lateral, 1, 0)).toBe(0);

    const hamstrings = exercise(1, 'd1_hamstrings');
    expect(plannedLoadKg(hamstrings, 1, 0)).toBe(40);
    expect(prescriptionForWeek(hamstrings, 2)?.loadKg).toBeUndefined();
  });

  it('formats authoritative rest clocks', () => {
    expect(restClockLabel(180)).toBe('3:00');
    expect(restClockLabel(150)).toBe('2:30');
    expect(restClockLabel(90)).toBe('1:30');
    expect(restClockLabel(75)).toBe('1:15');
  });

  it('derives PER and INT from completed ordered work and real rest, not subjective readiness', () => {
    const profile = createHighflyHunterProfile({ profileId: 'run1j' });
    const definition = {
      exerciseId: 'd1_back_squat',
      pattern: 'squat' as const,
      role: 'strength' as const,
      loadMode: 'external_kg' as const,
      rmReferenceKg: 108,
    };

    const make = (readiness: number) =>
      runTrainingSessionPipeline({
        profile,
        session: {
          sessionId: `run1j-${readiness}`,
          routineId: HF_HIGHFLY_PERSONAL_5D_V1_ID,
          block: 'Carga',
          week: 1,
          day: 1,
          readiness,
          isDeload: false,
          completed: true,
          plannedSets: 2,
          completedSets: 2,
          plannedExercises: 1,
          completedExercises: 1,
          sequentialCompletion: true,
          prescriptionCompliance: 1,
          sets: [
            {
              setId: 's1',
              exerciseId: 'd1_back_squat',
              reps: 6,
              loadKg: 76,
              restSec: 180,
              intent: 'strength',
              quality: 1,
            },
            {
              setId: 's2',
              exerciseId: 'd1_back_squat',
              reps: 6,
              loadKg: 76,
              restSec: 180,
              intent: 'strength',
              quality: 1,
            },
          ],
        },
        definitions: new Map([['d1_back_squat', definition]]),
      });

    const low = make(0.1);
    const high = make(1);
    expect(low.sessionResult.stimulus.STR).toBeCloseTo(high.sessionResult.stimulus.STR, 8);
    expect(high.sessionResult.behavioralPerformance.PER).toBe(100);
    expect(high.sessionResult.behavioralPerformance.INT).toBe(100);
    expect(high.sessionResult.stimulus.PER).toBeGreaterThan(0);
    expect(high.sessionResult.stimulus.INT).toBeGreaterThan(0);
  });
});
