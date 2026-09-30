import type { MovementPattern, TrainingIntent } from './reference_routine';
import type { HighflyRmLiftId } from './core';

export const HF_HIGHFLY_PERSONAL_5D_V2_ID = 'HF_HIGHFLY_PERSONAL_5D_V2' as const;
export const HIGHFLY_TM_FACTOR = 0.9 as const;
/** The current sheet rounds programmed barbell work to the nearest whole kg. */
export const HIGHFLY_LOAD_ROUND_KG = 1 as const;

export type HighflyLoadAuthority =
  | 'percent_tm'
  | 'fixed_locked'
  | 'editable_accessory';

export interface HighflySetPlan {
  sets: number;
  reps: number;
  percentTm?: number;
  fixedKg?: number;
  suggestedKg?: number;
}

export interface HighflyWeekPrescription {
  week: 1 | 2 | 3 | 4;
  top?: HighflySetPlan;
  work: HighflySetPlan;
}

export interface HighflyRoutineExercise {
  exerciseId: string;
  label: string;
  pattern: MovementPattern;
  intent: TrainingIntent;
  authority: HighflyLoadAuthority;
  rmLift?: HighflyRmLiftId;
  restSec: number;
  notes?: string;
  weeks: readonly [
    HighflyWeekPrescription,
    HighflyWeekPrescription,
    HighflyWeekPrescription,
    HighflyWeekPrescription,
  ];
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

const wp = (
  week: 1 | 2 | 3 | 4,
  work: HighflySetPlan,
  top?: HighflySetPlan,
): HighflyWeekPrescription => ({ week, work, ...(top ? { top } : {}) });

export const HIGHFLY_4_WEEK_BLOCK = [
  { week: 1, label: 'Semana 1', phase: 'Carga 1' },
  { week: 2, label: 'Semana 2', phase: 'Carga 2' },
  { week: 3, label: 'Semana 3', phase: 'Carga 3' },
  { week: 4, label: 'Semana 4', phase: 'Descarga' },
] as const;

export const HIGHFLY_PERSONAL_5D_ROUTINE: readonly HighflyRoutineDay[] = [
  {
    day: 1,
    name: 'Pierna + Hombro (Estabilidad)',
    exercises: [
      {
        exerciseId: 'hang_power_clean_d1',
        label: 'Hang Power Clean',
        pattern: 'hinge',
        intent: 'power',
        authority: 'percent_tm',
        rmLift: 'hang_power_clean',
        restSec: 150,
        weeks: [
          wp(1, { sets: 4, reps: 3, percentTm: .70 }),
          wp(2, { sets: 4, reps: 3, percentTm: .75 }),
          wp(3, { sets: 4, reps: 2, percentTm: .80 }),
          wp(4, { sets: 3, reps: 3, percentTm: .65 }),
        ],
      },
      {
        exerciseId: 'back_squat',
        label: 'Sentadilla',
        pattern: 'squat',
        intent: 'strength',
        authority: 'percent_tm',
        rmLift: 'back_squat',
        restSec: 180,
        notes: 'Top set + trabajo',
        weeks: [
          wp(1, { sets: 3, reps: 6, percentTm: .70 }, { sets: 1, reps: 6, percentTm: .80 }),
          wp(2, { sets: 3, reps: 4, percentTm: .75 }, { sets: 1, reps: 4, percentTm: .85 }),
          wp(3, { sets: 3, reps: 2, percentTm: .80 }, { sets: 1, reps: 2, percentTm: .90 }),
          wp(4, { sets: 3, reps: 5, percentTm: .70 }),
        ],
      },
      {
        exerciseId: 'zercher_squat',
        label: 'Zercher Sentadilla',
        pattern: 'squat',
        intent: 'hypertrophy',
        authority: 'fixed_locked',
        restSec: 90,
        weeks: [
          wp(1, { sets: 3, reps: 8, fixedKg: 60 }),
          wp(2, { sets: 3, reps: 6, fixedKg: 65 }),
          wp(3, { sets: 3, reps: 4, fixedKg: 70 }),
          wp(4, { sets: 3, reps: 5, fixedKg: 60 }),
        ],
      },
      {
        exerciseId: 'hamstring_machine_d1',
        label: 'Isquios',
        pattern: 'isolation',
        intent: 'accessory',
        authority: 'editable_accessory',
        restSec: 75,
        weeks: [
          wp(1, { sets: 3, reps: 15, suggestedKg: 40 }),
          wp(2, { sets: 3, reps: 12 }),
          wp(3, { sets: 3, reps: 10 }),
          wp(4, { sets: 2, reps: 15, suggestedKg: 40 }),
        ],
      },
      {
        exerciseId: 'lateral_raise_d1',
        label: 'Elevaciones laterales',
        pattern: 'isolation',
        intent: 'accessory',
        authority: 'editable_accessory',
        restSec: 75,
        weeks: [
          wp(1, { sets: 3, reps: 20 }),
          wp(2, { sets: 3, reps: 15 }),
          wp(3, { sets: 3, reps: 12 }),
          wp(4, { sets: 2, reps: 15 }),
        ],
      },
      {
        exerciseId: 'facepull_d1',
        label: 'Facepull',
        pattern: 'horizontal_pull',
        intent: 'accessory',
        authority: 'editable_accessory',
        restSec: 75,
        weeks: [
          wp(1, { sets: 3, reps: 20 }),
          wp(2, { sets: 3, reps: 18 }),
          wp(3, { sets: 3, reps: 15 }),
          wp(4, { sets: 2, reps: 20 }),
        ],
      },
    ],
  },
  {
    day: 2,
    name: 'Pecho + Hombro',
    exercises: [
      {
        exerciseId: 'push_press_d2',
        label: 'Push Press',
        pattern: 'vertical_push',
        intent: 'power',
        authority: 'percent_tm',
        rmLift: 'push_press',
        restSec: 150,
        weeks: [
          wp(1, { sets: 5, reps: 2, percentTm: .75 }),
          wp(2, { sets: 5, reps: 2, percentTm: .80 }),
          wp(3, { sets: 4, reps: 2, percentTm: .85 }),
          wp(4, { sets: 3, reps: 2, percentTm: .65 }),
        ],
      },
      {
        exerciseId: 'bench_press',
        label: 'Banco Plano',
        pattern: 'horizontal_push',
        intent: 'strength',
        authority: 'percent_tm',
        rmLift: 'bench_press',
        restSec: 180,
        notes: 'Top set + trabajo',
        weeks: [
          wp(1, { sets: 3, reps: 6, percentTm: .70 }, { sets: 1, reps: 6, percentTm: .80 }),
          wp(2, { sets: 3, reps: 4, percentTm: .75 }, { sets: 1, reps: 4, percentTm: .85 }),
          wp(3, { sets: 3, reps: 2, percentTm: .80 }, { sets: 1, reps: 2, percentTm: .90 }),
          wp(4, { sets: 3, reps: 5, percentTm: .70 }),
        ],
      },
      {
        exerciseId: 'incline_db_press',
        label: 'Banco Inclinado Mancuernas',
        pattern: 'horizontal_push',
        intent: 'hypertrophy',
        authority: 'editable_accessory',
        restSec: 90,
        weeks: [
          wp(1, { sets: 4, reps: 10 }),
          wp(2, { sets: 4, reps: 8 }),
          wp(3, { sets: 4, reps: 6 }),
          wp(4, { sets: 3, reps: 10 }),
        ],
      },
      {
        exerciseId: 'db_row',
        label: 'Remo con Mancuernas',
        pattern: 'horizontal_pull',
        intent: 'hypertrophy',
        authority: 'editable_accessory',
        restSec: 90,
        weeks: [
          wp(1, { sets: 4, reps: 10, suggestedKg: 40 }),
          wp(2, { sets: 4, reps: 8, suggestedKg: 45 }),
          wp(3, { sets: 4, reps: 6, suggestedKg: 50 }),
          wp(4, { sets: 3, reps: 10, suggestedKg: 43 }),
        ],
      },
      {
        exerciseId: 'db_overhead_press',
        label: 'Press Militar Mancuernas',
        pattern: 'vertical_push',
        intent: 'hypertrophy',
        authority: 'editable_accessory',
        restSec: 90,
        weeks: [
          wp(1, { sets: 3, reps: 12 }),
          wp(2, { sets: 3, reps: 10 }),
          wp(3, { sets: 3, reps: 8 }),
          wp(4, { sets: 2, reps: 12 }),
        ],
      },
      {
        exerciseId: 'gironda_row_d2',
        label: 'Remo Gironda',
        pattern: 'horizontal_pull',
        intent: 'hypertrophy',
        authority: 'editable_accessory',
        restSec: 90,
        weeks: [
          wp(1, { sets: 3, reps: 10 }),
          wp(2, { sets: 3, reps: 8 }),
          wp(3, { sets: 3, reps: 6 }),
          wp(4, { sets: 2, reps: 10 }),
        ],
      },
      {
        exerciseId: 'arms_d2',
        label: 'Tríceps + Bíceps',
        pattern: 'isolation',
        intent: 'accessory',
        authority: 'editable_accessory',
        restSec: 75,
        weeks: [
          wp(1, { sets: 3, reps: 15 }),
          wp(2, { sets: 3, reps: 12 }),
          wp(3, { sets: 3, reps: 10 }),
          wp(4, { sets: 2, reps: 15 }),
        ],
      },
    ],
  },
  {
    day: 3,
    name: 'Front + Potencia',
    exercises: [
      {
        exerciseId: 'hang_power_clean_d3',
        label: 'Hang Power Clean',
        pattern: 'hinge',
        intent: 'power',
        authority: 'percent_tm',
        rmLift: 'hang_power_clean',
        restSec: 150,
        weeks: [
          wp(1, { sets: 4, reps: 3, percentTm: .60 }),
          wp(2, { sets: 4, reps: 3, percentTm: .65 }),
          wp(3, { sets: 4, reps: 3, percentTm: .70 }),
          wp(4, { sets: 3, reps: 3, percentTm: .60 }),
        ],
      },
      {
        exerciseId: 'deadlift_rack_pull',
        label: 'Peso Muerto / Rack Pull',
        pattern: 'hinge',
        intent: 'strength',
        authority: 'percent_tm',
        rmLift: 'deadlift_rack_pull',
        restSec: 180,
        notes: 'Top set + trabajo',
        weeks: [
          wp(1, { sets: 3, reps: 5, percentTm: .75 }, { sets: 1, reps: 3, percentTm: .85 }),
          wp(2, { sets: 3, reps: 4, percentTm: .80 }, { sets: 1, reps: 2, percentTm: .90 }),
          wp(3, { sets: 3, reps: 3, percentTm: .85 }, { sets: 1, reps: 1, percentTm: .95 }),
          wp(4, { sets: 3, reps: 5, percentTm: .70 }),
        ],
      },
      {
        exerciseId: 'pendlay_row',
        label: 'Remo Pendlay',
        pattern: 'horizontal_pull',
        intent: 'strength',
        authority: 'percent_tm',
        rmLift: 'pendlay_row',
        restSec: 180,
        weeks: [
          wp(1, { sets: 3, reps: 8, percentTm: .60 }),
          wp(2, { sets: 3, reps: 6, percentTm: .65 }),
          wp(3, { sets: 3, reps: 4, percentTm: .70 }),
          wp(4, { sets: 2, reps: 8, percentTm: .60 }),
        ],
      },
      {
        exerciseId: 'leg_press_d3',
        label: 'Prensa',
        pattern: 'squat',
        intent: 'hypertrophy',
        authority: 'editable_accessory',
        restSec: 90,
        weeks: [
          wp(1, { sets: 3, reps: 15 }),
          wp(2, { sets: 3, reps: 12 }),
          wp(3, { sets: 3, reps: 10 }),
          wp(4, { sets: 2, reps: 15 }),
        ],
      },
      {
        exerciseId: 'quads_machine_d3',
        label: 'Cuádriceps',
        pattern: 'isolation',
        intent: 'accessory',
        authority: 'editable_accessory',
        restSec: 75,
        weeks: [
          wp(1, { sets: 3, reps: 25 }),
          wp(2, { sets: 3, reps: 20 }),
          wp(3, { sets: 3, reps: 15 }),
          wp(4, { sets: 2, reps: 25 }),
        ],
      },
      {
        exerciseId: 'hamstring_machine_d3',
        label: 'Isquios',
        pattern: 'isolation',
        intent: 'accessory',
        authority: 'editable_accessory',
        restSec: 75,
        weeks: [
          wp(1, { sets: 3, reps: 15 }),
          wp(2, { sets: 3, reps: 12 }),
          wp(3, { sets: 3, reps: 10 }),
          wp(4, { sets: 2, reps: 15 }),
        ],
      },
    ],
  },
  {
    day: 4,
    name: 'Hombros (Fuerza + Completo)',
    exercises: [
      {
        exerciseId: 'push_press_d4',
        label: 'Push Press',
        pattern: 'vertical_push',
        intent: 'power',
        authority: 'percent_tm',
        rmLift: 'push_press',
        restSec: 150,
        weeks: [
          wp(1, { sets: 4, reps: 3, percentTm: .70 }),
          wp(2, { sets: 4, reps: 3, percentTm: .75 }),
          wp(3, { sets: 4, reps: 2, percentTm: .80 }),
          wp(4, { sets: 3, reps: 3, percentTm: .65 }),
        ],
      },
      {
        exerciseId: 'overhead_press',
        label: 'Press Militar',
        pattern: 'vertical_push',
        intent: 'strength',
        authority: 'percent_tm',
        rmLift: 'overhead_press',
        restSec: 180,
        notes: 'Top set + trabajo',
        weeks: [
          wp(1, { sets: 3, reps: 6, percentTm: .70 }, { sets: 1, reps: 6, percentTm: .80 }),
          wp(2, { sets: 3, reps: 4, percentTm: .75 }, { sets: 1, reps: 4, percentTm: .85 }),
          wp(3, { sets: 3, reps: 2, percentTm: .80 }, { sets: 1, reps: 2, percentTm: .90 }),
          wp(4, { sets: 3, reps: 5, percentTm: .70 }),
        ],
      },
      {
        exerciseId: 'incline_barbell',
        label: 'Banco Inclinado con Barra',
        pattern: 'horizontal_push',
        intent: 'strength',
        authority: 'percent_tm',
        rmLift: 'incline_barbell',
        restSec: 180,
        weeks: [
          wp(1, { sets: 4, reps: 8, percentTm: .60 }),
          wp(2, { sets: 4, reps: 6, percentTm: .65 }),
          wp(3, { sets: 4, reps: 4, percentTm: .70 }),
          wp(4, { sets: 3, reps: 8, percentTm: .60 }),
        ],
      },
      {
        exerciseId: 'lat_pulldown_d4',
        label: 'Jalón al pecho',
        pattern: 'vertical_pull',
        intent: 'hypertrophy',
        authority: 'editable_accessory',
        restSec: 90,
        weeks: [
          wp(1, { sets: 3, reps: 10 }),
          wp(2, { sets: 3, reps: 8 }),
          wp(3, { sets: 3, reps: 6 }),
          wp(4, { sets: 2, reps: 10 }),
        ],
      },
      {
        exerciseId: 'machine_overhead_press_d4',
        label: 'Press Militar Máquina',
        pattern: 'vertical_push',
        intent: 'accessory',
        authority: 'editable_accessory',
        restSec: 75,
        weeks: [
          wp(1, { sets: 3, reps: 15 }),
          wp(2, { sets: 3, reps: 12 }),
          wp(3, { sets: 3, reps: 10 }),
          wp(4, { sets: 2, reps: 15 }),
        ],
      },
      {
        exerciseId: 'gironda_row_d4',
        label: 'Remo Gironda',
        pattern: 'horizontal_pull',
        intent: 'hypertrophy',
        authority: 'editable_accessory',
        restSec: 90,
        weeks: [
          wp(1, { sets: 3, reps: 12 }),
          wp(2, { sets: 3, reps: 10 }),
          wp(3, { sets: 3, reps: 8 }),
          wp(4, { sets: 2, reps: 12 }),
        ],
      },
      {
        exerciseId: 'arms_d4',
        label: 'Tríceps + Bíceps',
        pattern: 'isolation',
        intent: 'accessory',
        authority: 'editable_accessory',
        restSec: 75,
        weeks: [
          wp(1, { sets: 3, reps: 15 }),
          wp(2, { sets: 3, reps: 12 }),
          wp(3, { sets: 3, reps: 10 }),
          wp(4, { sets: 2, reps: 15 }),
        ],
      },
    ],
  },
  {
    day: 5,
    name: 'Posterior + Fuerza',
    exercises: [
      {
        exerciseId: 'hang_power_clean_d5',
        label: 'Hang Power Clean',
        pattern: 'hinge',
        intent: 'power',
        authority: 'percent_tm',
        rmLift: 'hang_power_clean',
        restSec: 150,
        weeks: [
          wp(1, { sets: 5, reps: 2, percentTm: .75 }),
          wp(2, { sets: 5, reps: 2, percentTm: .80 }),
          wp(3, { sets: 4, reps: 2, percentTm: .85 }),
          wp(4, { sets: 3, reps: 2, percentTm: .65 }),
        ],
      },
      {
        exerciseId: 'front_squat',
        label: 'Sentadilla Frontal',
        pattern: 'squat',
        intent: 'strength',
        authority: 'percent_tm',
        rmLift: 'front_squat',
        restSec: 180,
        notes: 'Top set + trabajo',
        weeks: [
          wp(1, { sets: 3, reps: 6, percentTm: .70 }, { sets: 1, reps: 6, percentTm: .80 }),
          wp(2, { sets: 3, reps: 4, percentTm: .75 }, { sets: 1, reps: 4, percentTm: .85 }),
          wp(3, { sets: 3, reps: 2, percentTm: .80 }, { sets: 1, reps: 2, percentTm: .90 }),
          wp(4, { sets: 3, reps: 5, percentTm: .70 }),
        ],
      },
      {
        exerciseId: 'zercher_good_morning',
        label: 'Buenos días Zercher',
        pattern: 'hinge',
        intent: 'strength',
        authority: 'percent_tm',
        rmLift: 'zercher_good_morning',
        restSec: 180,
        weeks: [
          wp(1, { sets: 3, reps: 8, percentTm: .60 }),
          wp(2, { sets: 3, reps: 6, percentTm: .65 }),
          wp(3, { sets: 3, reps: 4, percentTm: .70 }),
          wp(4, { sets: 2, reps: 8, percentTm: .60 }),
        ],
      },
      {
        exerciseId: 'bulgarian_split_squat_d5',
        label: 'Búlgara',
        pattern: 'unilateral',
        intent: 'hypertrophy',
        authority: 'editable_accessory',
        restSec: 90,
        weeks: [
          wp(1, { sets: 3, reps: 8 }),
          wp(2, { sets: 3, reps: 6 }),
          wp(3, { sets: 3, reps: 4 }),
          wp(4, { sets: 2, reps: 8 }),
        ],
      },
      {
        exerciseId: 'front_raise_d5',
        label: 'Elevaciones Frontales',
        pattern: 'isolation',
        intent: 'accessory',
        authority: 'editable_accessory',
        restSec: 75,
        weeks: [
          wp(1, { sets: 3, reps: 20 }),
          wp(2, { sets: 3, reps: 15 }),
          wp(3, { sets: 3, reps: 12 }),
          wp(4, { sets: 2, reps: 15 }),
        ],
      },
      {
        exerciseId: 'facepull_d5',
        label: 'Facepull',
        pattern: 'horizontal_pull',
        intent: 'accessory',
        authority: 'editable_accessory',
        restSec: 75,
        weeks: [
          wp(1, { sets: 2, reps: 20 }),
          wp(2, { sets: 2, reps: 20 }),
          wp(3, { sets: 2, reps: 20 }),
          wp(4, { sets: 2, reps: 20 }),
        ],
      },
    ],
  },
] as const;

export function roundHighflyLoadKg(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value / HIGHFLY_LOAD_ROUND_KG) * HIGHFLY_LOAD_ROUND_KG;
}

export function trainingMaxKg(oneRmKg: number): number {
  if (!Number.isFinite(oneRmKg) || oneRmKg <= 0) return 0;
  return oneRmKg * HIGHFLY_TM_FACTOR;
}

export function prescriptionForWeek(
  exercise: HighflyRoutineExercise,
  week: number,
): HighflyWeekPrescription {
  const index = Math.max(1, Math.min(4, Math.trunc(week))) - 1;
  return exercise.weeks[index];
}

export function planLoadKg(
  plan: HighflySetPlan,
  oneRmKg?: number | null,
): number {
  if (typeof plan.fixedKg === 'number') return plan.fixedKg;
  if (typeof plan.percentTm === 'number' && oneRmKg && oneRmKg > 0) {
    return roundHighflyLoadKg(trainingMaxKg(oneRmKg) * plan.percentTm);
  }
  return Math.max(0, plan.suggestedKg ?? 0);
}

export function plannedSetCount(exercise: HighflyRoutineExercise, week: number): number {
  const p = prescriptionForWeek(exercise, week);
  return (p.top?.sets ?? 0) + p.work.sets;
}

export function flattenSetPlans(
  exercise: HighflyRoutineExercise,
  week: number,
): readonly HighflySetPlan[] {
  const p = prescriptionForWeek(exercise, week);
  const plans: HighflySetPlan[] = [];
  if (p.top) {
    for (let i = 0; i < p.top.sets; i++) plans.push(p.top);
  }
  for (let i = 0; i < p.work.sets; i++) plans.push(p.work);
  return plans;
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
