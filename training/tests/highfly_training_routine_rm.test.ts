import { describe, expect, it } from 'vitest';
import {
  HIGHFLY_PERSONAL_5D_ROUTINE,
  plannedLoadKg,
  rmLiftForExercise,
} from '../src/highfly/training/personal_routine';
import { estimateEpleyOneRmKg } from '../src/highfly/training/rm_calibration';

function exercise(id: string) {
  for (const day of HIGHFLY_PERSONAL_5D_ROUTINE) {
    const found = day.exercises.find((item) => item.exerciseId === id);
    if (found) return found;
  }
  throw new Error('missing exercise ' + id);
}

describe('HIGHFLY calibrated routine authority', () => {
  it('derives week-1 system loads from Epley e1RM instead of stale sheet defaults', () => {
    const cleanE1rm = estimateEpleyOneRmKg(80, 5);
    const squatE1rm = estimateEpleyOneRmKg(96, 5);

    expect(cleanE1rm).toBe(93.3);
    expect(squatE1rm).toBe(112);
    expect(plannedLoadKg(exercise('d1_hang_power_clean'), 1, 0, cleanE1rm)).toBe(59);
    expect(plannedLoadKg(exercise('d1_back_squat_top'), 1, 0, squatE1rm)).toBe(81);
  });

  it('never aliases dumbbell row to barbell-row RM authority', () => {
    expect(rmLiftForExercise('d2_db_row')).toBeNull();
    expect(rmLiftForExercise('d3_pendlay')).toBe('barbell_row');
  });
});
