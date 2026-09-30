import type { MovementPattern, TrainingIntent } from './reference_routine';

export const HF_HIGHFLY_PERSONAL_5D_V1_ID = 'HF_HIGHFLY_PERSONAL_5D_V1' as const;
export const HIGHFLY_TM_FACTOR = 0.9 as const;
/** RUN1-J follows the kilograms written in the supplied HIGHFLY sheet. */
export const HIGHFLY_LOAD_ROUND_KG = 1 as const;

export type HighflyCycleWeek = 1 | 2 | 3 | 4;
export type HighflyLoadAuthority =
  | 'system_percent'
  | 'system_fixed'
  | 'editable_accessory';

export interface HighflyCycleWeekDefinition {
  week: HighflyCycleWeek;
  block: 'Carga' | 'Descarga';
  objective: string;
}

export interface HighflyWeekPrescription {
  sets: number;
  reps: number;
  percent?: number;
  /** Exact first-cycle kilograms from the supplied HIGHFLY routine. */
  loadKg?: number;
}

export interface HighflyRoutineExercise {
  exerciseId: string;
  label: string;
  pattern: MovementPattern;
  intent: TrainingIntent;
  authority: HighflyLoadAuthority;
  restSec: number;
  weekly: Readonly<Record<HighflyCycleWeek, HighflyWeekPrescription | null>>;
  /** 100% RM printed in the supplied sheet, when present. */
  referenceRmKg?: number;
  /** 90% working RM / Training Max printed in the supplied sheet, when present. */
  referenceTrainingMaxKg?: number;
  /** Increase applied after a successful four-week cycle. */
  cycleIncrementKg?: number;
  target?: string;
}

export interface HighflyRoutineDay {
  day: 1 | 2 | 3 | 4 | 5;
  name:
    | 'Pierna + Hombro (Estabilidad)'
    | 'Pecho + Hombro'
    | 'Front + Potencia'
    | 'Hombros (Fuerza + Completo)'
    | 'Posterior + Fuerza';
  exercises: readonly HighflyRoutineExercise[];
}

export const HIGHFLY_4_WEEK_CYCLE: readonly HighflyCycleWeekDefinition[] = [
  { week: 1, block: 'Carga', objective: 'Base del ciclo' },
  { week: 2, block: 'Carga', objective: 'Progresión' },
  { week: 3, block: 'Carga', objective: 'Pico del ciclo' },
  { week: 4, block: 'Descarga', objective: 'Descarga y consolidación' },
] as const;

const p = (
  sets: number,
  reps: number,
  loadKg?: number,
  percent?: number,
): HighflyWeekPrescription => ({
  sets,
  reps,
  ...(loadKg === undefined ? {} : { loadKg }),
  ...(percent === undefined ? {} : { percent }),
});

export const HIGHFLY_PERSONAL_5D_ROUTINE: readonly HighflyRoutineDay[] = [
  {
    day: 1,
    name: 'Pierna + Hombro (Estabilidad)',
    exercises: [
      {
        exerciseId: 'd1_hang_power_clean',
        label: 'Hang Power Clean',
        pattern: 'hinge',
        intent: 'power',
        authority: 'system_percent',
        restSec: 150,
        referenceTrainingMaxKg: 72,
        referenceRmKg: 80,
        cycleIncrementKg: 2.5,
        target: 'Explosivo · técnica limpia',
        weekly: {
          1: p(4, 3, 50, .70),
          2: p(4, 3, 54, .75),
          3: p(4, 2, 58, .80),
          4: p(3, 3, 47, .65),
        },
      },
      {
        exerciseId: 'd1_back_squat_top',
        label: 'Sentadilla Top Set',
        pattern: 'squat',
        intent: 'strength',
        authority: 'system_percent',
        restSec: 180,
        referenceTrainingMaxKg: 108,
        referenceRmKg: 120,
        cycleIncrementKg: 5,
        target: 'Top set de fuerza',
        weekly: {
          1: p(1, 6, 86, .80),
          2: p(1, 4, 92, .85),
          3: p(1, 2, 97, .90),
          4: null,
        },
      },
      {
        exerciseId: 'd1_back_squat',
        label: 'Sentadilla',
        pattern: 'squat',
        intent: 'strength',
        authority: 'system_percent',
        restSec: 180,
        referenceTrainingMaxKg: 108,
        referenceRmKg: 120,
        cycleIncrementKg: 5,
        target: 'Back-off de fuerza',
        weekly: {
          1: p(3, 6, 76, .70),
          2: p(3, 4, 81, .75),
          3: p(3, 2, 86, .80),
          4: p(3, 5, 76, .70),
        },
      },
      {
        exerciseId: 'd1_zercher_squat',
        label: 'Zercher Sentadilla',
        pattern: 'squat',
        intent: 'strength',
        authority: 'system_fixed',
        restSec: 180,
        cycleIncrementKg: 2.5,
        weekly: {
          1: p(3, 8, 60),
          2: p(3, 6, 65),
          3: p(3, 4, 70),
          4: p(3, 5, 60),
        },
      },
      {
        exerciseId: 'd1_hamstrings',
        label: 'Isquios',
        pattern: 'isolation',
        intent: 'hypertrophy',
        authority: 'editable_accessory',
        restSec: 90,
        weekly: {
          1: p(3, 15, 40),
          2: p(3, 12),
          3: p(3, 10),
          4: p(2, 15, 40),
        },
      },
      {
        exerciseId: 'd1_lateral_raise',
        label: 'Elevaciones laterales',
        pattern: 'isolation',
        intent: 'accessory',
        authority: 'editable_accessory',
        restSec: 75,
        weekly: {
          1: p(3, 20),
          2: p(3, 15),
          3: p(3, 12),
          4: p(2, 15),
        },
      },
      {
        exerciseId: 'd1_facepull',
        label: 'Facepull',
        pattern: 'isolation',
        intent: 'accessory',
        authority: 'editable_accessory',
        restSec: 75,
        weekly: {
          1: p(3, 20),
          2: p(3, 18),
          3: p(3, 15),
          4: p(2, 20),
        },
      },
    ],
  },
  {
    day: 2,
    name: 'Pecho + Hombro',
    exercises: [
      {
        exerciseId: 'd2_push_press',
        label: 'Push Press',
        pattern: 'vertical_push',
        intent: 'power',
        authority: 'system_percent',
        restSec: 150,
        referenceTrainingMaxKg: 63,
        referenceRmKg: 70,
        cycleIncrementKg: 2.5,
        weekly: {
          1: p(5, 2, 47, .75),
          2: p(5, 2, 50, .80),
          3: p(4, 2, 54, .85),
          4: p(3, 2, 41, .65),
        },
      },
      {
        exerciseId: 'd2_bench_top',
        label: 'Banco Plano Top Set',
        pattern: 'horizontal_push',
        intent: 'strength',
        authority: 'system_percent',
        restSec: 180,
        referenceTrainingMaxKg: 67.5,
        referenceRmKg: 75,
        cycleIncrementKg: 2.5,
        weekly: {
          1: p(1, 6, 54, .80),
          2: p(1, 4, 57, .85),
          3: p(1, 2, 61, .90),
          4: null,
        },
      },
      {
        exerciseId: 'd2_bench',
        label: 'Banco Plano',
        pattern: 'horizontal_push',
        intent: 'strength',
        authority: 'system_percent',
        restSec: 180,
        referenceTrainingMaxKg: 67.5,
        referenceRmKg: 75,
        cycleIncrementKg: 2.5,
        weekly: {
          1: p(3, 6, 47, .70),
          2: p(3, 4, 51, .75),
          3: p(3, 2, 54, .80),
          4: p(3, 5, 47, .70),
        },
      },
      {
        exerciseId: 'd2_incline_db',
        label: 'Banco Inclinado Mancuernas',
        pattern: 'horizontal_push',
        intent: 'hypertrophy',
        authority: 'editable_accessory',
        restSec: 90,
        weekly: {
          1: p(4, 10),
          2: p(4, 8),
          3: p(4, 6),
          4: p(3, 10),
        },
      },
      {
        exerciseId: 'd2_db_row',
        label: 'Remo con Mancuernas',
        pattern: 'horizontal_pull',
        intent: 'hypertrophy',
        authority: 'system_fixed',
        restSec: 90,
        referenceTrainingMaxKg: 58.5,
        referenceRmKg: 65,
        cycleIncrementKg: 2.5,
        weekly: {
          1: p(4, 10, 40),
          2: p(4, 8, 45),
          3: p(4, 6, 50),
          4: p(3, 10, 43),
        },
      },
      {
        exerciseId: 'd2_military_db',
        label: 'Press Militar Mancuernas',
        pattern: 'vertical_push',
        intent: 'hypertrophy',
        authority: 'editable_accessory',
        restSec: 90,
        weekly: {
          1: p(3, 12),
          2: p(3, 10),
          3: p(3, 8),
          4: p(2, 12),
        },
      },
      {
        exerciseId: 'd2_gironda_row',
        label: 'Remo Gironda',
        pattern: 'horizontal_pull',
        intent: 'hypertrophy',
        authority: 'editable_accessory',
        restSec: 90,
        weekly: {
          1: p(3, 10),
          2: p(3, 8),
          3: p(3, 6),
          4: p(2, 10),
        },
      },
      {
        exerciseId: 'd2_arms',
        label: 'Tríceps + bíceps',
        pattern: 'isolation',
        intent: 'accessory',
        authority: 'editable_accessory',
        restSec: 75,
        weekly: {
          1: p(3, 15),
          2: p(3, 12),
          3: p(3, 10),
          4: p(2, 15),
        },
      },
    ],
  },
  {
    day: 3,
    name: 'Front + Potencia',
    exercises: [
      {
        exerciseId: 'd3_hang_power_clean',
        label: 'Hang Power Clean',
        pattern: 'hinge',
        intent: 'power',
        authority: 'system_percent',
        restSec: 150,
        referenceTrainingMaxKg: 72,
        referenceRmKg: 80,
        cycleIncrementKg: 2.5,
        weekly: {
          1: p(4, 3, 43, .60),
          2: p(4, 3, 47, .65),
          3: p(4, 3, 50, .70),
          4: p(3, 3, 43, .60),
        },
      },
      {
        exerciseId: 'd3_deadlift_top',
        label: 'Peso Muerto / Rack Pull Top Set',
        pattern: 'hinge',
        intent: 'strength',
        authority: 'system_percent',
        restSec: 180,
        referenceTrainingMaxKg: 103.5,
        referenceRmKg: 115,
        cycleIncrementKg: 5,
        weekly: {
          1: p(1, 3, 88, .85),
          2: p(1, 2, 93, .90),
          3: p(1, 1, 98, .95),
          4: null,
        },
      },
      {
        exerciseId: 'd3_deadlift',
        label: 'Peso Muerto / Rack Pull',
        pattern: 'hinge',
        intent: 'strength',
        authority: 'system_percent',
        restSec: 180,
        referenceTrainingMaxKg: 103.5,
        referenceRmKg: 115,
        cycleIncrementKg: 5,
        weekly: {
          1: p(3, 5, 78, .75),
          2: p(3, 4, 83, .80),
          3: p(3, 3, 88, .85),
          4: p(3, 5, 72, .70),
        },
      },
      {
        exerciseId: 'd3_pendlay',
        label: 'Remo Pendlay',
        pattern: 'horizontal_pull',
        intent: 'strength',
        authority: 'system_percent',
        restSec: 180,
        referenceTrainingMaxKg: 67.5,
        referenceRmKg: 75,
        cycleIncrementKg: 2.5,
        weekly: {
          1: p(3, 8, 41, .60),
          2: p(3, 6, 44, .65),
          3: p(3, 4, 47, .70),
          4: p(2, 8, 41, .60),
        },
      },
      {
        exerciseId: 'd3_leg_press',
        label: 'Prensa',
        pattern: 'squat',
        intent: 'hypertrophy',
        authority: 'editable_accessory',
        restSec: 90,
        weekly: {
          1: p(3, 15),
          2: p(3, 12),
          3: p(3, 10),
          4: p(2, 15),
        },
      },
      {
        exerciseId: 'd3_quads',
        label: 'Cuádriceps',
        pattern: 'isolation',
        intent: 'accessory',
        authority: 'editable_accessory',
        restSec: 75,
        weekly: {
          1: p(3, 25),
          2: p(3, 20),
          3: p(3, 15),
          4: p(2, 25),
        },
      },
      {
        exerciseId: 'd3_hamstrings',
        label: 'Isquios',
        pattern: 'isolation',
        intent: 'hypertrophy',
        authority: 'editable_accessory',
        restSec: 90,
        weekly: {
          1: p(3, 15),
          2: p(3, 12),
          3: p(3, 10),
          4: p(2, 15),
        },
      },
    ],
  },
  {
    day: 4,
    name: 'Hombros (Fuerza + Completo)',
    exercises: [
      {
        exerciseId: 'd4_push_press',
        label: 'Push Press',
        pattern: 'vertical_push',
        intent: 'power',
        authority: 'system_percent',
        restSec: 150,
        referenceTrainingMaxKg: 63,
        referenceRmKg: 70,
        cycleIncrementKg: 2.5,
        weekly: {
          1: p(4, 3, 44, .70),
          2: p(4, 3, 47, .75),
          3: p(4, 2, 50, .80),
          4: p(3, 3, 41, .65),
        },
      },
      {
        exerciseId: 'd4_military_top',
        label: 'Press Militar Top Set',
        pattern: 'vertical_push',
        intent: 'strength',
        authority: 'system_percent',
        restSec: 180,
        referenceTrainingMaxKg: 54,
        referenceRmKg: 60,
        cycleIncrementKg: 2.5,
        weekly: {
          1: p(1, 6, 43, .80),
          2: p(1, 4, 46, .85),
          3: p(1, 2, 49, .90),
          4: null,
        },
      },
      {
        exerciseId: 'd4_military',
        label: 'Press Militar',
        pattern: 'vertical_push',
        intent: 'strength',
        authority: 'system_percent',
        restSec: 180,
        referenceTrainingMaxKg: 54,
        referenceRmKg: 60,
        cycleIncrementKg: 2.5,
        weekly: {
          1: p(3, 6, 38, .70),
          2: p(3, 4, 41, .75),
          3: p(3, 2, 43, .80),
          4: p(3, 5, 38, .70),
        },
      },
      {
        exerciseId: 'd4_incline_barbell',
        label: 'Banco Inclinado con Barra',
        pattern: 'horizontal_push',
        intent: 'strength',
        authority: 'system_percent',
        restSec: 180,
        referenceTrainingMaxKg: 67.5,
        referenceRmKg: 75,
        cycleIncrementKg: 2.5,
        weekly: {
          1: p(4, 8, 41, .60),
          2: p(4, 6, 44, .65),
          3: p(4, 4, 47, .70),
          4: p(3, 8, 41, .60),
        },
      },
      {
        exerciseId: 'd4_lat_pulldown',
        label: 'Jalón al pecho',
        pattern: 'vertical_pull',
        intent: 'hypertrophy',
        authority: 'editable_accessory',
        restSec: 90,
        weekly: {
          1: p(3, 10),
          2: p(3, 8),
          3: p(3, 6),
          4: p(2, 10),
        },
      },
      {
        exerciseId: 'd4_military_machine',
        label: 'Press Militar Máquina',
        pattern: 'vertical_push',
        intent: 'hypertrophy',
        authority: 'editable_accessory',
        restSec: 90,
        weekly: {
          1: p(3, 15),
          2: p(3, 12),
          3: p(3, 10),
          4: p(2, 15),
        },
      },
      {
        exerciseId: 'd4_gironda_row',
        label: 'Remo Gironda',
        pattern: 'horizontal_pull',
        intent: 'hypertrophy',
        authority: 'editable_accessory',
        restSec: 90,
        weekly: {
          1: p(3, 12),
          2: p(3, 10),
          3: p(3, 8),
          4: p(2, 12),
        },
      },
      {
        exerciseId: 'd4_arms',
        label: 'Tríceps + bíceps',
        pattern: 'isolation',
        intent: 'accessory',
        authority: 'editable_accessory',
        restSec: 75,
        weekly: {
          1: p(3, 15),
          2: p(3, 12),
          3: p(3, 10),
          4: p(2, 15),
        },
      },
    ],
  },
  {
    day: 5,
    name: 'Posterior + Fuerza',
    exercises: [
      {
        exerciseId: 'd5_hang_power_clean',
        label: 'Hang Power Clean',
        pattern: 'hinge',
        intent: 'power',
        authority: 'system_percent',
        restSec: 150,
        referenceTrainingMaxKg: 72,
        referenceRmKg: 80,
        cycleIncrementKg: 2.5,
        weekly: {
          1: p(5, 2, 54, .75),
          2: p(5, 2, 58, .80),
          3: p(4, 2, 61, .85),
          4: p(3, 2, 47, .65),
        },
      },
      {
        exerciseId: 'd5_front_squat_top',
        label: 'Sentadilla Frontal Top Set',
        pattern: 'squat',
        intent: 'strength',
        authority: 'system_percent',
        restSec: 180,
        referenceTrainingMaxKg: 67.5,
        referenceRmKg: 75,
        cycleIncrementKg: 2.5,
        weekly: {
          1: p(1, 6, 54, .80),
          2: p(1, 4, 57, .85),
          3: p(1, 2, 61, .90),
          4: null,
        },
      },
      {
        exerciseId: 'd5_front_squat',
        label: 'Sentadilla Frontal',
        pattern: 'squat',
        intent: 'strength',
        authority: 'system_percent',
        restSec: 180,
        referenceTrainingMaxKg: 67.5,
        referenceRmKg: 75,
        cycleIncrementKg: 2.5,
        weekly: {
          1: p(3, 6, 47, .70),
          2: p(3, 4, 51, .75),
          3: p(3, 2, 54, .80),
          4: p(3, 5, 47, .70),
        },
      },
      {
        exerciseId: 'd5_zercher_good_morning',
        label: 'Buenos días Zercher',
        pattern: 'hinge',
        intent: 'strength',
        authority: 'system_percent',
        restSec: 180,
        referenceTrainingMaxKg: 67.5,
        referenceRmKg: 75,
        cycleIncrementKg: 2.5,
        weekly: {
          1: p(3, 8, 41, .60),
          2: p(3, 6, 44, .65),
          3: p(3, 4, 47, .70),
          4: p(2, 8, 41, .60),
        },
      },
      {
        exerciseId: 'd5_bulgarian',
        label: 'Búlgara',
        pattern: 'unilateral',
        intent: 'hypertrophy',
        authority: 'editable_accessory',
        restSec: 90,
        weekly: {
          1: p(3, 8),
          2: p(3, 6),
          3: p(3, 4),
          4: p(2, 8),
        },
      },
      {
        exerciseId: 'd5_front_raise',
        label: 'Elevaciones Frontales',
        pattern: 'isolation',
        intent: 'accessory',
        authority: 'editable_accessory',
        restSec: 75,
        weekly: {
          1: p(3, 20),
          2: p(3, 15),
          3: p(3, 12),
          4: p(2, 15),
        },
      },
      {
        exerciseId: 'd5_facepull',
        label: 'Facepull',
        pattern: 'isolation',
        intent: 'accessory',
        authority: 'editable_accessory',
        restSec: 75,
        weekly: {
          1: p(2, 20),
          2: p(2, 20),
          3: p(2, 20),
          4: p(2, 20),
        },
      },
    ],
  },
] as const;

export function roundHighflyLoadKg(
  value: number,
  increment = HIGHFLY_LOAD_ROUND_KG,
): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value / increment) * increment;
}

export function trainingMaxKg(oneRmKg: number): number {
  return roundHighflyLoadKg(oneRmKg * HIGHFLY_TM_FACTOR, 0.5);
}

export function macrocycleWeek(week: number): HighflyCycleWeekDefinition {
  const normalized = Math.max(1, Math.min(4, Math.trunc(week))) as HighflyCycleWeek;
  return HIGHFLY_4_WEEK_CYCLE[normalized - 1];
}

export function prescriptionForWeek(
  exercise: HighflyRoutineExercise,
  week: number,
): HighflyWeekPrescription | null {
  const normalized = Math.max(1, Math.min(4, Math.trunc(week))) as HighflyCycleWeek;
  return exercise.weekly[normalized];
}

export function progressedTrainingMaxKg(
  exercise: HighflyRoutineExercise,
  successfulCycles: number,
): number | null {
  if (!exercise.referenceTrainingMaxKg) return null;
  const increment = Math.max(0, exercise.cycleIncrementKg ?? 0);
  return exercise.referenceTrainingMaxKg + Math.max(0, Math.trunc(successfulCycles)) * increment;
}

/**
 * Cycle 0 returns the exact kilograms in the supplied routine. Later successful
 * cycles increase the working TM a little and recompute percentage-driven rows.
 * A repeated cycle passes the same successfulCycles value, therefore loads stay identical.
 */
export function plannedLoadKg(
  exercise: HighflyRoutineExercise,
  week: number,
  successfulCycles = 0,
): number {
  const prescription = prescriptionForWeek(exercise, week);
  if (!prescription) return 0;

  if (
    exercise.authority === 'system_percent' &&
    prescription.percent !== undefined &&
    exercise.referenceTrainingMaxKg
  ) {
    const tm = progressedTrainingMaxKg(exercise, successfulCycles) ?? exercise.referenceTrainingMaxKg;
    return roundHighflyLoadKg(tm * prescription.percent);
  }

  if (prescription.loadKg !== undefined) {
    const increment = Math.max(0, exercise.cycleIncrementKg ?? 0);
    return roundHighflyLoadKg(
      prescription.loadKg + Math.max(0, Math.trunc(successfulCycles)) * increment,
      increment > 0 ? 0.5 : 1,
    );
  }

  return 0;
}

export function isEditableAccessory(exercise: HighflyRoutineExercise): boolean {
  return exercise.authority === 'editable_accessory';
}

export function restClockLabel(seconds: number): string {
  const safe = Math.max(0, Math.trunc(seconds));
  const mm = Math.floor(safe / 60);
  const ss = String(safe % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}
