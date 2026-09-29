import type { HighflyCoreStat } from './core';
import type { MovementPattern, TrainingIntent } from './reference_routine';

export type LoadMode = 'external_kg' | 'bodyweight' | 'assisted' | 'timed';
export type ObservedTrainingRole = 'strength' | 'power' | 'hypertrophy' | 'accessory' | 'recovery';

export interface ExerciseDefinition {
  exerciseId: string;
  pattern: MovementPattern;
  role: TrainingIntent;
  loadMode: LoadMode;
  /** Optional current comparable 1RM/e1RM anchor for intensity classification. */
  rmReferenceKg?: number;
}

export interface SetRecord {
  setId: string;
  exerciseId: string;
  reps: number;
  loadKg: number;
  restSec: number;
  /** Athlete/plan intent. Power requires explicit explosive intent. */
  intent: TrainingIntent;
  /** 0..1 execution quality; defaults to 1 when omitted. */
  quality?: number;
  /** Optional repetitions in reserve. Diagnostic in RUN1-B. */
  rir?: number;
  /** Optional perceived exertion. Diagnostic in RUN1-B. */
  rpe?: number;
  /** Optional multiplier reserved for later history-aware novelty logic. */
  noveltyModifier?: number;
}

export interface SessionRecord {
  sessionId: string;
  routineId: string;
  block: string;
  week: number;
  day: number;
  readiness: number;
  isDeload: boolean;
  completed: boolean;
  sets: readonly SetRecord[];
}

export interface ExerciseEvidence {
  setId: string;
  exerciseId: string;
  observedRole: ObservedTrainingRole;
  reps: number;
  loadKg: number;
  volumeLoadKg: number;
  estimated1RmKg: number | null;
  relativeIntensity: number | null;
  executionQuality: number;
  restCompliance: number;
  recoveryModifier: number;
  score: number;
  confidence: number;
}

export type StimulusVector = Record<HighflyCoreStat, number>;

export interface FatigueState {
  local: number;
  systemic: number;
  trend: number;
  deloadFlag: boolean;
}

export interface SessionTrainingResult {
  evidence: ExerciseEvidence[];
  stimulus: StimulusVector;
  fatigue: FatigueState;
  diagnosticTonnageKg: number;
}

const ZERO_STIMULUS: StimulusVector = { STR: 0, AGI: 0, VIT: 0, PER: 0, INT: 0 };

const ROLE_WEIGHTS: Record<ObservedTrainingRole, StimulusVector> = {
  strength: { STR: 1, AGI: 0.12, VIT: 0.28, PER: 0, INT: 0 },
  power: { STR: 0.38, AGI: 1, VIT: 0.18, PER: 0, INT: 0 },
  hypertrophy: { STR: 0.3, AGI: 0.04, VIT: 1, PER: 0, INT: 0 },
  accessory: { STR: 0.08, AGI: 0.02, VIT: 0.42, PER: 0, INT: 0 },
  recovery: { STR: 0, AGI: 0, VIT: 0.08, PER: 0, INT: 0 },
};

const SESSION_CAP: StimulusVector = {
  STR: 5.5,
  AGI: 4.5,
  VIT: 6.5,
  PER: 2,
  INT: 2,
};

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function safeNonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function estimateE1RmKg(loadKg: number, reps: number): number | null {
  if (!Number.isFinite(loadKg) || loadKg <= 0 || !Number.isFinite(reps) || reps < 1) return null;
  if (reps === 1) return loadKg;
  // Epley estimate. Evidence only; never itself grants a Core Stat.
  return loadKg * (1 + reps / 30);
}

export function relativeIntensity(loadKg: number, rmReferenceKg?: number): number | null {
  if (!rmReferenceKg || !Number.isFinite(rmReferenceKg) || rmReferenceKg <= 0) return null;
  return clamp(loadKg / rmReferenceKg, 0, 1.5);
}

function intendedPower(set: SetRecord): boolean {
  return set.intent === 'power' && set.reps >= 1 && set.reps <= 6;
}

export function classifyObservedRole(
  definition: ExerciseDefinition,
  set: SetRecord,
): ObservedTrainingRole {
  if (set.intent === 'recovery' || definition.role === 'recovery') return 'recovery';

  const intensity = relativeIntensity(set.loadKg, definition.rmReferenceKg);

  // Explicit explosive intent plus the HIGHFLY power band.
  if (
    intendedPower(set) &&
    (intensity === null || (intensity >= 0.6 && intensity <= 0.82))
  ) {
    return 'power';
  }

  // Demonstrated heavy strength work: low reps + high relative intensity.
  if (set.reps >= 1 && set.reps <= 6 && intensity !== null && intensity >= 0.8) {
    return 'strength';
  }

  // When no RM anchor exists, preserve authored heavy-strength intent but lower confidence later.
  if (set.reps >= 1 && set.reps <= 6 && intensity === null && definition.role === 'strength') {
    return 'strength';
  }

  if (set.reps >= 7 && set.reps <= 14) return 'hypertrophy';
  if (set.reps >= 15) return 'accessory';

  // Safe fallback for low-rep technique work that is neither heavy nor explosive.
  return definition.role === 'power'
    ? 'power'
    : definition.role === 'strength'
      ? 'strength'
      : definition.role === 'hypertrophy'
        ? 'hypertrophy'
        : 'accessory';
}

function usefulWork(role: ObservedTrainingRole, reps: number): number {
  const r = safeNonNegative(reps);
  switch (role) {
    case 'strength':
      return clamp(r / 5, 0.35, 1);
    case 'power':
      return clamp(r / 3, 0.45, 1);
    case 'hypertrophy':
      return clamp(r / 10, 0.35, 1);
    case 'accessory':
      return clamp(r / 18, 0.2, 0.72);
    case 'recovery':
      return clamp(r / 12, 0.15, 0.5);
  }
}

function intensityFit(role: ObservedTrainingRole, intensity: number | null): number {
  if (intensity === null) return role === 'strength' || role === 'power' ? 0.72 : 0.82;

  switch (role) {
    case 'strength':
      if (intensity >= 0.8 && intensity <= 1.05) return 1;
      if (intensity >= 0.7) return 0.65;
      return 0.35;
    case 'power':
      if (intensity >= 0.6 && intensity <= 0.82) return 1;
      if (intensity >= 0.5 && intensity <= 0.9) return 0.65;
      return 0.3;
    case 'hypertrophy':
      if (intensity >= 0.4 && intensity <= 0.78) return 1;
      return 0.68;
    case 'accessory':
      return intensity <= 0.75 ? 0.9 : 0.6;
    case 'recovery':
      return intensity <= 0.6 ? 1 : 0.45;
  }
}

function targetRestSeconds(role: ObservedTrainingRole): number {
  switch (role) {
    case 'strength':
      return 180;
    case 'power':
      return 120;
    case 'hypertrophy':
      return 90;
    case 'accessory':
      return 60;
    case 'recovery':
      return 45;
  }
}

function restCompliance(role: ObservedTrainingRole, restSec: number): number {
  const target = targetRestSeconds(role);
  return clamp(safeNonNegative(restSec) / target, 0.55, 1);
}

function recoveryModifier(readiness: number): number {
  // Readiness affects productive adaptation, but never turns a session negative.
  return 0.65 + 0.35 * clamp(readiness, 0, 1);
}

function saturate(value: number, cap: number): number {
  if (value <= 0) return 0;
  return cap * (1 - Math.exp(-value / cap));
}

function roleFatigue(role: ObservedTrainingRole): { local: number; systemic: number } {
  switch (role) {
    case 'strength':
      return { local: 0.72, systemic: 1 };
    case 'power':
      return { local: 0.55, systemic: 0.82 };
    case 'hypertrophy':
      return { local: 1, systemic: 0.72 };
    case 'accessory':
      return { local: 0.45, systemic: 0.3 };
    case 'recovery':
      return { local: 0.1, systemic: 0.08 };
  }
}

export function scoreTrainingSet(
  definition: ExerciseDefinition,
  set: SetRecord,
  readiness: number,
  isDeload: boolean,
): { evidence: ExerciseEvidence; stimulus: StimulusVector; fatigue: FatigueState } {
  const role = classifyObservedRole(definition, set);
  const intensity = relativeIntensity(set.loadKg, definition.rmReferenceKg);
  const quality = clamp(set.quality ?? 1, 0.4, 1);
  const rest = restCompliance(role, set.restSec);
  const recovery = recoveryModifier(readiness);
  const novelty = clamp(set.noveltyModifier ?? 1, 0.5, 1.15);

  const rawScore =
    usefulWork(role, set.reps) *
    intensityFit(role, intensity) *
    quality *
    rest *
    recovery *
    novelty;

  // A deload is valid training, but heavy work during it never gains a bonus.
  const score = rawScore * (isDeload ? 0.62 : 1);
  const base = ROLE_WEIGHTS[role];
  const stimulus: StimulusVector = {
    STR: score * base.STR,
    AGI: score * base.AGI,
    VIT: score * base.VIT,
    PER: 0,
    INT: 0,
  };

  const fatigueFactor = roleFatigue(role);
  const fatigueScale = isDeload ? 0.6 : 1;
  const fatigue: FatigueState = {
    local: score * fatigueFactor.local * fatigueScale,
    systemic: score * fatigueFactor.systemic * fatigueScale,
    trend: 0,
    deloadFlag: isDeload,
  };

  const evidence: ExerciseEvidence = {
    setId: set.setId,
    exerciseId: set.exerciseId,
    observedRole: role,
    reps: set.reps,
    loadKg: set.loadKg,
    volumeLoadKg: safeNonNegative(set.loadKg) * safeNonNegative(set.reps),
    estimated1RmKg: estimateE1RmKg(set.loadKg, set.reps),
    relativeIntensity: intensity,
    executionQuality: quality,
    restCompliance: rest,
    recoveryModifier: recovery,
    score,
    confidence: intensity === null ? 0.68 : 0.92,
  };

  return { evidence, stimulus, fatigue };
}

export function evaluateTrainingSession(
  session: SessionRecord,
  definitions: ReadonlyMap<string, ExerciseDefinition>,
): SessionTrainingResult {
  const raw = { ...ZERO_STIMULUS };
  const evidence: ExerciseEvidence[] = [];
  let localFatigue = 0;
  let systemicFatigue = 0;
  let diagnosticTonnageKg = 0;

  if (!session.completed) {
    return {
      evidence,
      stimulus: raw,
      fatigue: { local: 0, systemic: 0, trend: 0, deloadFlag: session.isDeload },
      diagnosticTonnageKg: 0,
    };
  }

  for (const set of session.sets) {
    const definition = definitions.get(set.exerciseId);
    if (!definition) throw new Error(`Unknown HIGHFLY exerciseId: ${set.exerciseId}`);

    const scored = scoreTrainingSet(definition, set, session.readiness, session.isDeload);
    evidence.push(scored.evidence);
    diagnosticTonnageKg += scored.evidence.volumeLoadKg;

    raw.STR += scored.stimulus.STR;
    raw.AGI += scored.stimulus.AGI;
    raw.VIT += scored.stimulus.VIT;
    // PER and INT intentionally remain zero for ordinary resistance-training sets.
    localFatigue += scored.fatigue.local;
    systemicFatigue += scored.fatigue.systemic;
  }

  const stimulus: StimulusVector = {
    STR: saturate(raw.STR, SESSION_CAP.STR),
    AGI: saturate(raw.AGI, SESSION_CAP.AGI),
    VIT: saturate(raw.VIT, SESSION_CAP.VIT),
    PER: 0,
    INT: 0,
  };

  return {
    evidence,
    stimulus,
    fatigue: {
      local: saturate(localFatigue, 8),
      systemic: saturate(systemicFatigue, 7),
      trend: systemicFatigue,
      deloadFlag: session.isDeload,
    },
    diagnosticTonnageKg,
  };
}
