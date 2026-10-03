import type {
  HighflyAthleteCalibrationProfile,
  HighflyHunterProfile,
  HighflyRmCalibrationEntry,
  HighflyRmLiftId,
  HighflySex,
} from './core';

export const HIGHFLY_RM_MIN_REPS = 2 as const;
export const HIGHFLY_RM_MAX_REPS = 6 as const;
export const HIGHFLY_RM_EVALUATION_DAYS = 7 as const;
export const HIGHFLY_RM_CONFIRM_TOLERANCE = 0.12 as const;

export const HIGHFLY_RM_LIFT_ORDER: readonly HighflyRmLiftId[] = [
  'bench_press',
  'back_squat',
  'deadlift',
  'overhead_press',
  'barbell_row',
  'front_squat',
  'hang_power_clean',
] as const;

export const HIGHFLY_RM_LIFT_LABELS: Readonly<Record<HighflyRmLiftId, string>> = {
  bench_press: 'Banco plano',
  back_squat: 'Sentadilla',
  deadlift: 'Peso muerto',
  overhead_press: 'Press militar',
  barbell_row: 'Remo con barra',
  front_squat: 'Sentadilla frontal',
  hang_power_clean: 'Hang Power Clean',
};

type StandardRow = { intermediate: number; advanced: number };

const STANDARDS: Readonly<
  Record<HighflySex, Readonly<Record<HighflyRmLiftId, StandardRow>>>
> = {
  male: {
    bench_press: { intermediate: 1.2, advanced: 1.5 },
    back_squat: { intermediate: 1.5, advanced: 2.0 },
    deadlift: { intermediate: 1.8, advanced: 2.5 },
    overhead_press: { intermediate: 0.75, advanced: 1.0 },
    barbell_row: { intermediate: 0.9, advanced: 1.2 },
    front_squat: { intermediate: 1.2, advanced: 1.6 },
    hang_power_clean: { intermediate: 0.85, advanced: 1.15 },
  },
  female: {
    bench_press: { intermediate: 0.7, advanced: 1.0 },
    back_squat: { intermediate: 1.1, advanced: 1.5 },
    deadlift: { intermediate: 1.4, advanced: 2.0 },
    overhead_press: { intermediate: 0.45, advanced: 0.65 },
    barbell_row: { intermediate: 0.55, advanced: 0.8 },
    front_squat: { intermediate: 0.9, advanced: 1.2 },
    hang_power_clean: { intermediate: 0.55, advanced: 0.8 },
  },
};

export interface HighflyRmCalibrationInput {
  sex: HighflySex;
  ageYears: number;
  bodyweightKg: number;
  loadKg: number;
  reps: number;
  recordedAt?: string;
}

export interface HighflyRmCalibrationResult {
  profile: HighflyHunterProfile;
  entry: HighflyRmCalibrationEntry;
  status: 'verified' | 'evaluation';
  reason: string;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function estimateEpleyOneRmKg(loadKg: number, reps: number): number {
  if (!Number.isFinite(loadKg) || loadKg <= 0) {
    throw new Error('HIGHFLY RM: el peso debe ser mayor a 0 kg');
  }
  if (!Number.isInteger(reps) || reps < HIGHFLY_RM_MIN_REPS || reps > HIGHFLY_RM_MAX_REPS) {
    throw new Error('HIGHFLY RM: la calibración requiere entre 2 y 6 repeticiones');
  }
  return round1(loadKg * (1 + reps / 30));
}

export function validateAthleteCalibrationProfile(
  athlete: HighflyAthleteCalibrationProfile,
): HighflyAthleteCalibrationProfile {
  if (athlete.sex !== 'male' && athlete.sex !== 'female') {
    throw new Error('HIGHFLY RM: seleccioná sexo masculino o femenino');
  }
  if (!Number.isFinite(athlete.ageYears) || athlete.ageYears < 14 || athlete.ageYears > 100) {
    throw new Error('HIGHFLY RM: edad fuera de rango');
  }
  if (
    !Number.isFinite(athlete.bodyweightKg) ||
    athlete.bodyweightKg < 30 ||
    athlete.bodyweightKg > 350
  ) {
    throw new Error('HIGHFLY RM: peso corporal fuera de rango');
  }
  return {
    ...athlete,
    ageYears: Math.trunc(athlete.ageYears),
    bodyweightKg: round1(athlete.bodyweightKg),
  };
}

/**
 * Age is only an anomaly-context factor. It NEVER changes earned Core Stats.
 * An extraordinary result is reviewed, not rejected.
 */
function ageReviewFactor(ageYears: number): number {
  if (ageYears < 40) return 1;
  if (ageYears < 50) return 0.97;
  if (ageYears < 60) return 0.93;
  return 0.88;
}

export function rmReviewThresholdMultiple(
  lift: HighflyRmLiftId,
  athlete: HighflyAthleteCalibrationProfile,
): number {
  const standard = STANDARDS[athlete.sex][lift];
  return standard.advanced * 1.25 * ageReviewFactor(athlete.ageYears);
}

export function rmModerateAuthorityKg(
  lift: HighflyRmLiftId,
  athlete: HighflyAthleteCalibrationProfile,
): number {
  return round1(STANDARDS[athlete.sex][lift].intermediate * athlete.bodyweightKg);
}

function isoPlusDays(iso: string, days: number): string {
  const ms = new Date(iso).getTime();
  return new Date(ms + days * 86_400_000).toISOString();
}

function closeEnough(a: number, b: number): boolean {
  if (a <= 0 || b <= 0) return false;
  return Math.abs(a - b) / Math.max(a, b) <= HIGHFLY_RM_CONFIRM_TOLERANCE;
}

export function evaluationDaysRemaining(
  entry: HighflyRmCalibrationEntry,
  nowIso = new Date().toISOString(),
): number {
  if (entry.status !== 'evaluation' || !entry.evaluationUntil) return 0;
  const remaining = new Date(entry.evaluationUntil).getTime() - new Date(nowIso).getTime();
  return Math.max(0, Math.ceil(remaining / 86_400_000));
}

export function submitRmCalibration(
  profile: HighflyHunterProfile,
  lift: HighflyRmLiftId,
  input: HighflyRmCalibrationInput,
): HighflyRmCalibrationResult {
  const recordedAt = input.recordedAt ?? new Date().toISOString();
  const athlete = validateAthleteCalibrationProfile({
    sex: input.sex,
    ageYears: input.ageYears,
    bodyweightKg: input.bodyweightKg,
    updatedAt: recordedAt,
  });
  const estimatedOneRmKg = estimateEpleyOneRmKg(input.loadKg, input.reps);
  const relativeToBodyweight = estimatedOneRmKg / athlete.bodyweightKg;
  const previous = profile.training.loadCalibration?.lifts?.[lift];
  const previousVerified =
    previous?.verifiedOneRmKg ??
    (previous?.status === 'verified' ? previous.oneRmKg : undefined);

  const extraordinary =
    relativeToBodyweight > rmReviewThresholdMultiple(lift, athlete) ||
    (previousVerified !== undefined && estimatedOneRmKg > previousVerified * 1.2);

  let status: 'verified' | 'evaluation' = 'verified';
  let effectiveOneRmKg = estimatedOneRmKg;
  let verifiedOneRmKg = estimatedOneRmKg;
  let evaluationUntil: string | undefined;
  let reason =
    'e1RM verificada por Epley. El valor queda disponible para las cargas HIGHFLY.';

  if (extraordinary) {
    const canConfirmPrevious =
      previous?.status === 'evaluation' &&
      previous.estimatedOneRmKg !== undefined &&
      previous.evaluationUntil !== undefined &&
      new Date(recordedAt).getTime() >= new Date(previous.evaluationUntil).getTime() &&
      closeEnough(estimatedOneRmKg, previous.estimatedOneRmKg);

    if (canConfirmPrevious) {
      verifiedOneRmKg = round1((estimatedOneRmKg + (previous.estimatedOneRmKg ?? estimatedOneRmKg)) / 2);
      effectiveOneRmKg = verifiedOneRmKg;
      status = 'verified';
      evaluationUntil = undefined;
      reason =
        'Marca extraordinaria confirmada por una segunda evidencia compatible después de 7 días.';
    } else {
      status = 'evaluation';
      verifiedOneRmKg = previousVerified ?? 0;
      effectiveOneRmKg =
        previousVerified ?? rmModerateAuthorityKg(lift, athlete);
      evaluationUntil =
        previous?.status === 'evaluation' &&
        previous.evaluationUntil &&
        closeEnough(estimatedOneRmKg, previous.estimatedOneRmKg ?? estimatedOneRmKg)
          ? previous.evaluationUntil
          : isoPlusDays(recordedAt, HIGHFLY_RM_EVALUATION_DAYS);
      reason =
        'Marca extraordinaria en evaluación. Durante 7 días HIGHFLY congela una autoridad moderada y espera una segunda evidencia compatible.';
    }
  }

  const sample = {
    loadKg: round1(input.loadKg),
    reps: input.reps,
    estimatedOneRmKg,
    recordedAt,
  };
  const samples = [...(previous?.samples ?? []), sample].slice(-8);
  const entry: HighflyRmCalibrationEntry = {
    oneRmKg: round1(effectiveOneRmKg),
    estimatedOneRmKg,
    verifiedOneRmKg: round1(verifiedOneRmKg),
    relativeToBodyweight: round1(relativeToBodyweight),
    status,
    ...(evaluationUntil ? { evaluationUntil } : {}),
    samples,
    updatedAt: recordedAt,
  };

  const previousCalibration = profile.training.loadCalibration ?? {
    tmFactor: 0.9,
    roundKg: 2.5,
    lifts: {},
  };

  const nextProfile: HighflyHunterProfile = {
    ...profile,
    training: {
      ...profile.training,
      loadCalibration: {
        ...previousCalibration,
        athlete,
        lifts: {
          ...previousCalibration.lifts,
          [lift]: entry,
        },
      },
    },
  };

  return { profile: nextProfile, entry, status, reason };
}
