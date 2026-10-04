import type {
  HighflyAccessoryEquipmentKind,
  HighflyAccessoryLoadAttempt,
  HighflyAccessoryLoadEntry,
} from './core';

const HISTORY_LIMIT = 20;

function finitePositive(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function roundHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

export function inferAccessoryEquipmentKind(
  exerciseId: string,
): HighflyAccessoryEquipmentKind {
  if (
    exerciseId.includes('_db') ||
    exerciseId.includes('lateral_raise') ||
    exerciseId.includes('front_raise') ||
    exerciseId.includes('bulgarian')
  ) return 'dumbbell';
  if (
    exerciseId.includes('facepull') ||
    exerciseId.includes('lat_pulldown') ||
    exerciseId.includes('gironda')
  ) return 'cable';
  if (
    exerciseId.includes('machine') ||
    exerciseId.includes('leg_press') ||
    exerciseId.includes('hamstrings') ||
    exerciseId.includes('quads') ||
    exerciseId.includes('arms')
  ) return 'machine';
  return 'other';
}

export function defaultAccessoryStepKg(kind: HighflyAccessoryEquipmentKind): number {
  if (kind === 'dumbbell') return 2;
  if (kind === 'machine' || kind === 'cable') return 5;
  return 2.5;
}

export function normalizeAccessoryEntry(
  exerciseId: string,
  entry: HighflyAccessoryLoadEntry,
): HighflyAccessoryLoadEntry {
  const equipmentKind = entry.equipmentKind ?? inferAccessoryEquipmentKind(exerciseId);
  const progressionStepKg = finitePositive(entry.progressionStepKg)
    ? entry.progressionStepKg
    : defaultAccessoryStepKg(equipmentKind);
  return { ...entry, equipmentKind, progressionStepKg };
}

function appendAttempt(
  entry: HighflyAccessoryLoadEntry,
  attempt: HighflyAccessoryLoadAttempt,
): HighflyAccessoryLoadAttempt[] {
  return [...(entry.history ?? []), attempt].slice(-HISTORY_LIMIT);
}

export function recordAccessoryCompletion(
  exerciseId: string,
  entry: HighflyAccessoryLoadEntry,
  args: {
    sets: number;
    reps: number;
    nextReps: number | null;
    recordedAt: string;
  },
): HighflyAccessoryLoadEntry {
  const normalized = normalizeAccessoryEntry(exerciseId, entry);
  const step = normalized.progressionStepKg ?? 2.5;
  const shouldProgress =
    !normalized.repeatRequested &&
    args.nextReps !== null &&
    args.nextReps <= args.reps;
  const nextSuggestedKg = roundHalf(
    shouldProgress ? normalized.kg + step : normalized.kg,
  );
  return {
    ...normalized,
    updatedAt: args.recordedAt,
    lastSets: args.sets,
    lastReps: args.reps,
    nextSuggestedKg,
    repeatRequested: false,
    history: appendAttempt(normalized, {
      recordedAt: args.recordedAt,
      kg: normalized.kg,
      sets: args.sets,
      reps: args.reps,
      outcome: 'completed',
    }),
  };
}

export function markAccessoryRepeat(
  exerciseId: string,
  entry: HighflyAccessoryLoadEntry,
  args: { sets: number; reps: number; recordedAt: string },
): HighflyAccessoryLoadEntry {
  const normalized = normalizeAccessoryEntry(exerciseId, entry);
  return {
    ...normalized,
    updatedAt: args.recordedAt,
    nextSuggestedKg: normalized.kg,
    repeatRequested: true,
    lastSets: args.sets,
    lastReps: args.reps,
    history: appendAttempt(normalized, {
      recordedAt: args.recordedAt,
      kg: normalized.kg,
      sets: args.sets,
      reps: args.reps,
      outcome: 'repeat',
    }),
  };
}

export function acceptAccessorySuggestion(
  exerciseId: string,
  entry: HighflyAccessoryLoadEntry,
  recordedAt: string,
): HighflyAccessoryLoadEntry {
  const normalized = normalizeAccessoryEntry(exerciseId, entry);
  const suggested = finitePositive(normalized.nextSuggestedKg)
    ? normalized.nextSuggestedKg
    : normalized.kg;
  return {
    ...normalized,
    kg: suggested,
    nextSuggestedKg: undefined,
    repeatRequested: false,
    updatedAt: recordedAt,
  };
}
