import type { MovementPattern, TrainingIntent } from './reference_routine';

export const HF_HIGHFLY_PERSONAL_5D_V1_ID = 'HF_HIGHFLY_PERSONAL_5D_V1' as const;
export const HIGHFLY_TM_FACTOR = 0.9 as const;
export const HIGHFLY_LOAD_ROUND_KG = 2.5 as const;

export type HighflyRmLift =
  | 'back_squat'
  | 'bench_press'
  | 'overhead_press'
  | 'deadlift';

export type HighflyLoadAuthority =
  | 'tm_main'
  | 'derived_percent'
  | 'guided_locked'
  | 'editable_accessory'
  | 'bodyweight_locked';

export interface HighflyLiftCalibration {
  oneRmKg: number;
  updatedAt: string;
}

export type HighflyLoadCalibration = Partial<
  Record<HighflyRmLift, HighflyLiftCalibration>
>;

export interface HighflyMacrocycleWeek {
  week: number;
  block: 'Base' | 'Fuerza' | 'Descarga' | 'Peak' | 'Test';
  objective: string;
  topReps: number | 'TEST';
  backoffPercent: number | null;
  backoffSets: number;
  backoffReps: number;
  topPercent: Record<HighflyRmLift, number | null>;
  accessoryVolume: string;
}

export interface HighflyRoutineExercise {
  exerciseId: string;
  label: string;
  pattern: MovementPattern;
  intent: TrainingIntent;
  prescription: string;
  target: string;
  authority: HighflyLoadAuthority;
  rmLift?: HighflyRmLift;
  /** For derived_percent only. Kept as a range when the source is a range. */
  derivedPercentRange?: readonly [number, number];
  defaultSets: number;
  defaultReps: number;
  repRange?: readonly [number, number];
  restSec: number;
  optional?: boolean;
}

export interface HighflyRoutineDay {
  day: 1 | 2 | 3 | 4 | 5;
  name: 'Pierna A' | 'Torso A' | 'Combinado' | 'Torso B' | 'Posterior';
  exercises: readonly HighflyRoutineExercise[];
}

const same = (value: number): Record<HighflyRmLift, number> => ({
  back_squat: value,
  bench_press: value,
  overhead_press: value,
  deadlift: value,
});

export const HIGHFLY_12_WEEK_MACROCYCLE: readonly HighflyMacrocycleWeek[] = [
  { week: 1, block: 'Base', objective: 'Volumen + técnica', topReps: 5, backoffPercent: .70, backoffSets: 4, backoffReps: 5, topPercent: same(.75), accessoryVolume: 'Normal' },
  { week: 2, block: 'Base', objective: 'Volumen + técnica', topReps: 4, backoffPercent: .75, backoffSets: 4, backoffReps: 4, topPercent: same(.80), accessoryVolume: 'Normal' },
  { week: 3, block: 'Base', objective: 'Volumen + técnica', topReps: 3, backoffPercent: .80, backoffSets: 4, backoffReps: 3, topPercent: same(.85), accessoryVolume: 'Normal' },
  { week: 4, block: 'Descarga', objective: 'Deload', topReps: 5, backoffPercent: .65, backoffSets: 3, backoffReps: 5, topPercent: same(.70), accessoryVolume: 'Bajo' },
  { week: 5, block: 'Fuerza', objective: 'Inicio intensificación', topReps: 3, backoffPercent: .80, backoffSets: 3, backoffReps: 5, topPercent: same(.85), accessoryVolume: 'Moderado' },
  { week: 6, block: 'Fuerza', objective: 'Fuerza media', topReps: 2, backoffPercent: .825, backoffSets: 3, backoffReps: 4, topPercent: same(.90), accessoryVolume: 'Moderado' },
  {
    week: 7,
    block: 'Fuerza',
    objective: 'Pico bloque fuerza',
    topReps: 1,
    backoffPercent: .85,
    backoffSets: 3,
    backoffReps: 3,
    topPercent: {
      back_squat: .95,
      bench_press: .90,
      overhead_press: .90,
      deadlift: .95,
    },
    accessoryVolume: 'Bajo-moderado',
  },
  { week: 8, block: 'Descarga', objective: 'Deload', topReps: 5, backoffPercent: .65, backoffSets: 2, backoffReps: 5, topPercent: same(.70), accessoryVolume: 'Bajo' },
  {
    week: 9,
    block: 'Peak',
    objective: 'Alta intensidad',
    topReps: 2,
    backoffPercent: .80,
    backoffSets: 2,
    backoffReps: 3,
    topPercent: {
      back_squat: .90,
      bench_press: .88,
      overhead_press: .88,
      deadlift: .90,
    },
    accessoryVolume: 'Bajo',
  },
  {
    week: 10,
    block: 'Peak',
    objective: 'Muy alta intensidad',
    topReps: 1,
    backoffPercent: .825,
    backoffSets: 2,
    backoffReps: 2,
    topPercent: {
      back_squat: .93,
      bench_press: .90,
      overhead_press: .90,
      deadlift: .93,
    },
    accessoryVolume: 'Muy bajo',
  },
  {
    week: 11,
    block: 'Peak',
    objective: 'Pico neural',
    topReps: 1,
    backoffPercent: null,
    backoffSets: 0,
    backoffReps: 0,
    topPercent: {
      back_squat: .96,
      bench_press: .92,
      overhead_press: .90,
      deadlift: .96,
    },
    accessoryVolume: 'Mínimo',
  },
  {
    week: 12,
    block: 'Test',
    objective: 'Test de RM',
    topReps: 'TEST',
    backoffPercent: null,
    backoffSets: 0,
    backoffReps: 0,
    topPercent: {
      back_squat: null,
      bench_press: null,
      overhead_press: null,
      deadlift: null,
    },
    accessoryVolume: 'Mínimo',
  },
] as const;

export const HIGHFLY_PERSONAL_5D_ROUTINE: readonly HighflyRoutineDay[] = [
  {
    day: 1,
    name: 'Pierna A',
    exercises: [
      { exerciseId: 'back_squat', label: 'Sentadilla', pattern: 'squat', intent: 'strength', prescription: 'Top + back-off', target: 'Fuerza principal', authority: 'tm_main', rmLift: 'back_squat', defaultSets: 5, defaultReps: 5, restSec: 180 },
      { exerciseId: 'hip_thrust', label: 'Hip thrust', pattern: 'hinge', intent: 'hypertrophy', prescription: '3×8', target: 'RPE 7–8 · glúteo/posterior', authority: 'guided_locked', defaultSets: 3, defaultReps: 8, restSec: 90 },
      { exerciseId: 'split_squat', label: 'Split squat / Búlgara', pattern: 'unilateral', intent: 'hypertrophy', prescription: '3×8', target: 'RPE 7–8 · unilateral', authority: 'guided_locked', defaultSets: 3, defaultReps: 8, restSec: 90 },
      { exerciseId: 'db_row', label: 'Remo mancuerna', pattern: 'horizontal_pull', intent: 'hypertrophy', prescription: '3×8–10', target: 'Pesado controlado', authority: 'editable_accessory', defaultSets: 3, defaultReps: 8, repRange: [8, 10], restSec: 90 },
      { exerciseId: 'lateral_raise', label: 'Elevaciones laterales', pattern: 'isolation', intent: 'accessory', prescription: '3×15–20', target: 'Casi al fallo técnico', authority: 'editable_accessory', defaultSets: 3, defaultReps: 15, repRange: [15, 20], restSec: 75 },
    ],
  },
  {
    day: 2,
    name: 'Torso A',
    exercises: [
      { exerciseId: 'bench_press', label: 'Press banca', pattern: 'horizontal_push', intent: 'strength', prescription: 'Top + back-off', target: 'Fuerza principal', authority: 'tm_main', rmLift: 'bench_press', defaultSets: 5, defaultReps: 5, restSec: 180 },
      { exerciseId: 'pendlay_row', label: 'Remo Pendlay', pattern: 'horizontal_pull', intent: 'strength', prescription: '4×5–6', target: 'Progresivo · espalda fuerte', authority: 'guided_locked', defaultSets: 4, defaultReps: 5, repRange: [5, 6], restSec: 180 },
      { exerciseId: 'pulldown_pullup', label: 'Jalón / dominadas', pattern: 'vertical_pull', intent: 'hypertrophy', prescription: '3×8–12', target: 'Controlado · dorsal', authority: 'editable_accessory', defaultSets: 3, defaultReps: 8, repRange: [8, 12], restSec: 90 },
      { exerciseId: 'incline_press', label: 'Press inclinado', pattern: 'horizontal_push', intent: 'hypertrophy', prescription: '3×8–10', target: 'RPE 8 · pecho/hombro', authority: 'guided_locked', defaultSets: 3, defaultReps: 8, repRange: [8, 10], restSec: 90 },
      { exerciseId: 'rear_or_lateral', label: 'Lateral o posterior', pattern: 'isolation', intent: 'accessory', prescription: '3×15–20', target: 'Bombeo · opcional', authority: 'editable_accessory', defaultSets: 3, defaultReps: 15, repRange: [15, 20], restSec: 75, optional: true },
    ],
  },
  {
    day: 3,
    name: 'Combinado',
    exercises: [
      { exerciseId: 'hang_power_clean', label: 'Hang power clean', pattern: 'hinge', intent: 'power', prescription: '5×2–3', target: 'Técnico, explosivo · no al fallo', authority: 'guided_locked', defaultSets: 5, defaultReps: 2, repRange: [2, 3], restSec: 150 },
      { exerciseId: 'front_squat', label: 'Front squat', pattern: 'squat', intent: 'strength', prescription: '4×4–6', target: '75–85% técnico', authority: 'derived_percent', rmLift: 'back_squat', derivedPercentRange: [.75, .85], defaultSets: 4, defaultReps: 4, repRange: [4, 6], restSec: 180 },
      { exerciseId: 'zercher_or_good_morning', label: 'Zercher o buenos días', pattern: 'hinge', intent: 'strength', prescription: '3×6', target: 'Controlado · core/posterior', authority: 'guided_locked', defaultSets: 3, defaultReps: 6, restSec: 180 },
      { exerciseId: 'leg_curl', label: 'Curl femoral', pattern: 'isolation', intent: 'hypertrophy', prescription: '3×10', target: 'RPE 8 · isquios', authority: 'editable_accessory', defaultSets: 3, defaultReps: 10, restSec: 90 },
      { exerciseId: 'one_arm_row', label: 'Remo unilateral', pattern: 'horizontal_pull', intent: 'hypertrophy', prescription: '3×8–10', target: 'Controlado · espalda', authority: 'editable_accessory', defaultSets: 3, defaultReps: 8, repRange: [8, 10], restSec: 90 },
    ],
  },
  {
    day: 4,
    name: 'Torso B',
    exercises: [
      { exerciseId: 'overhead_press', label: 'Press militar', pattern: 'vertical_push', intent: 'strength', prescription: 'Top + back-off', target: 'Fuerza principal', authority: 'tm_main', rmLift: 'overhead_press', defaultSets: 5, defaultReps: 5, restSec: 180 },
      { exerciseId: 'cable_row', label: 'Remo máquina / cable', pattern: 'horizontal_pull', intent: 'hypertrophy', prescription: '4×8–10', target: 'Controlado · espalda media', authority: 'editable_accessory', defaultSets: 4, defaultReps: 8, repRange: [8, 10], restSec: 90 },
      { exerciseId: 'lat_pulldown', label: 'Jalón', pattern: 'vertical_pull', intent: 'hypertrophy', prescription: '3×10–12', target: 'Controlado · dorsal', authority: 'editable_accessory', defaultSets: 3, defaultReps: 10, repRange: [10, 12], restSec: 90 },
      { exerciseId: 'lateral_raise_b', label: 'Elevaciones laterales', pattern: 'isolation', intent: 'accessory', prescription: '4×15–20', target: 'Bombeo · deltoide medio', authority: 'editable_accessory', defaultSets: 4, defaultReps: 15, repRange: [15, 20], restSec: 75 },
      { exerciseId: 'rear_delt', label: 'Posterior hombro', pattern: 'isolation', intent: 'accessory', prescription: '3×15–20', target: 'Bombeo · salud hombro', authority: 'editable_accessory', defaultSets: 3, defaultReps: 15, repRange: [15, 20], restSec: 75 },
    ],
  },
  {
    day: 5,
    name: 'Posterior',
    exercises: [
      { exerciseId: 'deadlift', label: 'Peso muerto', pattern: 'hinge', intent: 'strength', prescription: 'Top + back-off', target: 'Fuerza principal', authority: 'tm_main', rmLift: 'deadlift', defaultSets: 5, defaultReps: 5, restSec: 180 },
      { exerciseId: 'speed_squat', label: 'Sentadilla velocidad / técnica', pattern: 'squat', intent: 'power', prescription: '6×2', target: '60–70% de sentadilla · explosiva', authority: 'derived_percent', rmLift: 'back_squat', derivedPercentRange: [.60, .70], defaultSets: 6, defaultReps: 2, restSec: 150, optional: true },
      { exerciseId: 'rdl', label: 'RDL', pattern: 'hinge', intent: 'hypertrophy', prescription: '3×6–8', target: 'RPE 7–8 · bisagra', authority: 'guided_locked', defaultSets: 3, defaultReps: 6, repRange: [6, 8], restSec: 90 },
      { exerciseId: 'leg_press', label: 'Prensa', pattern: 'squat', intent: 'hypertrophy', prescription: '3×10', target: 'RPE 8 · cuádriceps', authority: 'editable_accessory', defaultSets: 3, defaultReps: 10, restSec: 90 },
      { exerciseId: 'core_stability', label: 'Core', pattern: 'carry_core', intent: 'accessory', prescription: '3×12–15', target: 'Controlado · estabilidad', authority: 'bodyweight_locked', defaultSets: 3, defaultReps: 12, repRange: [12, 15], restSec: 60 },
    ],
  },
] as const;

export function roundHighflyLoadKg(value: number, increment = HIGHFLY_LOAD_ROUND_KG): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value / increment) * increment;
}

export function trainingMaxKg(oneRmKg: number): number {
  return roundHighflyLoadKg(oneRmKg * HIGHFLY_TM_FACTOR);
}

export function macrocycleWeek(week: number): HighflyMacrocycleWeek {
  const normalized = Math.max(1, Math.min(12, Math.trunc(week)));
  return HIGHFLY_12_WEEK_MACROCYCLE[normalized - 1];
}

export interface HighflyMainPrescription {
  kind: 'main';
  topPercent: number | null;
  topKg: number | null;
  topReps: number | 'TEST';
  backoffPercent: number | null;
  backoffKg: number | null;
  backoffSets: number;
  backoffReps: number;
}

export function mainPrescription(
  lift: HighflyRmLift,
  oneRmKg: number,
  week: number,
): HighflyMainPrescription {
  const plan = macrocycleWeek(week);
  const tm = trainingMaxKg(oneRmKg);
  const topPercent = plan.topPercent[lift];
  return {
    kind: 'main',
    topPercent,
    topKg: topPercent === null ? null : roundHighflyLoadKg(tm * topPercent),
    topReps: plan.topReps,
    backoffPercent: plan.backoffPercent,
    backoffKg:
      plan.backoffPercent === null ? null : roundHighflyLoadKg(tm * plan.backoffPercent),
    backoffSets: plan.backoffSets,
    backoffReps: plan.backoffReps,
  };
}

export function derivedLoadRangeKg(
  oneRmKg: number,
  percentRange: readonly [number, number],
): readonly [number, number] {
  const tm = trainingMaxKg(oneRmKg);
  return [
    roundHighflyLoadKg(tm * percentRange[0]),
    roundHighflyLoadKg(tm * percentRange[1]),
  ] as const;
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
