import type { HighflyCoreStat } from './core';

export const HF_REFERENCE_5D_SUPREME_V1_ID = 'HF_REFERENCE_5D_SUPREME_V1' as const;

export type TrainingIntent = 'strength' | 'power' | 'hypertrophy' | 'accessory' | 'recovery';
export type MovementPattern =
  | 'squat'
  | 'hinge'
  | 'horizontal_push'
  | 'vertical_push'
  | 'horizontal_pull'
  | 'vertical_pull'
  | 'unilateral'
  | 'carry_core'
  | 'isolation';

export interface ReferenceExercise {
  exerciseId: string;
  label: string;
  pattern: MovementPattern;
  intent: TrainingIntent;
  sets: string;
  target: string;
  primaryCore: HighflyCoreStat[];
  optional?: boolean;
}

export interface ReferenceTrainingDay {
  day: 1 | 2 | 3 | 4 | 5;
  name: string;
  exercises: readonly ReferenceExercise[];
}

/**
 * Public calibration structure only.
 *
 * Deliberately contains no personal load/1RM values. Those belong in the
 * private/offline Hunter profile, never in the public source repository.
 *
 * Base periodization contract: 3 loading weeks + 1 deload week.
 */
export const HF_REFERENCE_5D_SUPREME_V1: readonly ReferenceTrainingDay[] = [
  {
    day: 1,
    name: 'Pierna A',
    exercises: [
      { exerciseId: 'back_squat', label: 'Sentadilla', pattern: 'squat', intent: 'strength', sets: 'top + back-off', target: '1-6 reps heavy + productive back-off', primaryCore: ['STR', 'VIT'] },
      { exerciseId: 'hip_thrust', label: 'Hip thrust', pattern: 'hinge', intent: 'hypertrophy', sets: '3x8', target: 'RPE 7-8', primaryCore: ['STR', 'VIT'] },
      { exerciseId: 'split_squat', label: 'Split squat / Búlgara', pattern: 'unilateral', intent: 'hypertrophy', sets: '3x8', target: 'RPE 7-8', primaryCore: ['STR', 'AGI', 'VIT'] },
      { exerciseId: 'db_row', label: 'Remo mancuerna', pattern: 'horizontal_pull', intent: 'hypertrophy', sets: '3x8-10', target: 'pesado controlado', primaryCore: ['STR', 'VIT'] },
      { exerciseId: 'lateral_raise', label: 'Elevaciones laterales', pattern: 'isolation', intent: 'accessory', sets: '3x15-20', target: 'casi al fallo técnico', primaryCore: ['VIT'] },
    ],
  },
  {
    day: 2,
    name: 'Torso A',
    exercises: [
      { exerciseId: 'bench_press', label: 'Press banca', pattern: 'horizontal_push', intent: 'strength', sets: 'top + back-off', target: '1-6 reps heavy + productive back-off', primaryCore: ['STR', 'VIT'] },
      { exerciseId: 'pendlay_row', label: 'Remo Pendlay', pattern: 'horizontal_pull', intent: 'strength', sets: '4x5-6', target: 'progresivo', primaryCore: ['STR', 'VIT'] },
      { exerciseId: 'pulldown_pullup', label: 'Jalón / dominadas', pattern: 'vertical_pull', intent: 'hypertrophy', sets: '3x8-12', target: 'controlado', primaryCore: ['STR', 'VIT'] },
      { exerciseId: 'incline_press', label: 'Press inclinado', pattern: 'horizontal_push', intent: 'hypertrophy', sets: '3x8-10', target: 'RPE 8', primaryCore: ['STR', 'VIT'] },
      { exerciseId: 'rear_or_lateral', label: 'Lateral o posterior', pattern: 'isolation', intent: 'accessory', sets: '3x15-20', target: 'bombeo', primaryCore: ['VIT'], optional: true },
    ],
  },
  {
    day: 3,
    name: 'Combinado',
    exercises: [
      { exerciseId: 'hang_power_clean', label: 'Hang power clean', pattern: 'hinge', intent: 'power', sets: '5x2-3', target: 'técnico y explosivo; no al fallo', primaryCore: ['AGI', 'STR'] },
      { exerciseId: 'front_squat', label: 'Front squat', pattern: 'squat', intent: 'strength', sets: '4x4-6', target: '75-85% técnico', primaryCore: ['STR', 'VIT'] },
      { exerciseId: 'zercher_or_good_morning', label: 'Zercher o buenos días', pattern: 'hinge', intent: 'strength', sets: '3x6', target: 'controlado', primaryCore: ['STR', 'VIT'] },
      { exerciseId: 'leg_curl', label: 'Curl femoral', pattern: 'isolation', intent: 'hypertrophy', sets: '3x10', target: 'RPE 8', primaryCore: ['VIT'] },
      { exerciseId: 'one_arm_row', label: 'Remo unilateral', pattern: 'horizontal_pull', intent: 'hypertrophy', sets: '3x8-10', target: 'controlado', primaryCore: ['STR', 'VIT'] },
    ],
  },
  {
    day: 4,
    name: 'Torso B',
    exercises: [
      { exerciseId: 'overhead_press', label: 'Press militar', pattern: 'vertical_push', intent: 'strength', sets: 'top + back-off', target: '1-6 reps heavy + productive back-off', primaryCore: ['STR', 'VIT'] },
      { exerciseId: 'cable_row', label: 'Remo máquina / cable', pattern: 'horizontal_pull', intent: 'hypertrophy', sets: '4x8-10', target: 'controlado', primaryCore: ['STR', 'VIT'] },
      { exerciseId: 'lat_pulldown', label: 'Jalón', pattern: 'vertical_pull', intent: 'hypertrophy', sets: '3x10-12', target: 'controlado', primaryCore: ['STR', 'VIT'] },
      { exerciseId: 'lateral_raise_b', label: 'Elevaciones laterales', pattern: 'isolation', intent: 'accessory', sets: '4x15-20', target: 'bombeo', primaryCore: ['VIT'] },
      { exerciseId: 'rear_delt', label: 'Posterior hombro', pattern: 'isolation', intent: 'accessory', sets: '3x15-20', target: 'bombeo', primaryCore: ['VIT'] },
    ],
  },
  {
    day: 5,
    name: 'Posterior',
    exercises: [
      { exerciseId: 'deadlift', label: 'Peso muerto', pattern: 'hinge', intent: 'strength', sets: 'top + back-off', target: '1-6 reps heavy + productive back-off', primaryCore: ['STR', 'VIT'] },
      { exerciseId: 'speed_squat', label: 'Sentadilla velocidad / técnica', pattern: 'squat', intent: 'power', sets: '6x2', target: '60-70% con intención explosiva', primaryCore: ['AGI', 'STR'], optional: true },
      { exerciseId: 'rdl', label: 'RDL', pattern: 'hinge', intent: 'hypertrophy', sets: '3x6-8', target: 'RPE 7-8', primaryCore: ['STR', 'VIT'] },
      { exerciseId: 'leg_press', label: 'Prensa', pattern: 'squat', intent: 'hypertrophy', sets: '3x10', target: 'RPE 8', primaryCore: ['STR', 'VIT'] },
      { exerciseId: 'core_stability', label: 'Core', pattern: 'carry_core', intent: 'accessory', sets: '3x12-15', target: 'controlado', primaryCore: ['VIT'] },
    ],
  },
] as const;

export const HIGHFLY_BASE_MESOCYCLE = {
  weeks: 4,
  loadingWeeks: 3,
  deloadWeeks: 1,
} as const;
