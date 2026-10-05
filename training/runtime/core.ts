export const HIGHFLY_TRAINING_SCHEMA_VERSION = 3 as const;
export const HIGHFLY_PROGRESSION_SCHEMA_VERSION = 2 as const;
export const HIGHFLY_TRAINING_SCORING_VERSION = 'run2-awakening-v1' as const;

export const HIGHFLY_CORE_STATS = ['STR', 'AGI', 'VIT', 'PER', 'INT'] as const;
export type HighflyCoreStat = (typeof HIGHFLY_CORE_STATS)[number];
export type HighflyCoreVector = Record<HighflyCoreStat, number>;

export const HIGHFLY_AWAKENING_STATS_VERSION = 1 as const;
export const HIGHFLY_AWAKENING_BUDGET = 50 as const;
export const HIGHFLY_AWAKENING_CLASSES = [
  'warrior',
  'mage',
  'rogue',
  'paladin',
  'hunter',
  'priest',
  'shaman',
  'warlock',
  'druid',
] as const;
export type HighflyAwakeningClassId = (typeof HIGHFLY_AWAKENING_CLASSES)[number];

export const HIGHFLY_NORMAL_MAX_LEVEL = 99 as const;
/** LV2..99 grants one normalized natural Core point per level: 98 total. */
export const HIGHFLY_NATURAL_GROWTH_BUDGET = 98 as const;

/**
 * ClaudeCraft v0.44.0 donor statsPerLevel remapped to HIGHFLY:
 * STA -> VIT, SPI -> PER, INT -> INT.
 * Raw totals differ by class in Claude; HIGHFLY uses only these ratios.
 */
export const HIGHFLY_NATURAL_GROWTH_WEIGHTS: Readonly<
  Record<HighflyAwakeningClassId, Readonly<HighflyCoreVector>>
> = {
  warrior: { STR: 2, AGI: 1, VIT: 2, PER: 0, INT: 0 },
  mage:    { STR: 0, AGI: 0, VIT: 2, PER: 2, INT: 3 },
  rogue:   { STR: 1, AGI: 3, VIT: 2, PER: 0, INT: 0 },
  paladin: { STR: 2, AGI: 1, VIT: 2, PER: 1, INT: 1 },
  hunter:  { STR: 1, AGI: 3, VIT: 2, PER: 1, INT: 1 },
  priest:  { STR: 0, AGI: 0, VIT: 2, PER: 3, INT: 2 },
  shaman:  { STR: 1, AGI: 1, VIT: 2, PER: 2, INT: 2 },
  warlock: { STR: 0, AGI: 0, VIT: 2, PER: 2, INT: 3 },
  druid:   { STR: 1, AGI: 1, VIT: 2, PER: 2, INT: 2 },
} as const;

/**
 * Awakening v1 reuses ClaudeCraft's class identity, normalized to an equal
 * 50-point HIGHFLY budget. Claude STA maps to VIT and SPI maps to PER.
 * These are versioned birth aptitudes, not Training rewards.
 */
export const HIGHFLY_AWAKENING_BASES: Readonly<
  Record<HighflyAwakeningClassId, Readonly<HighflyCoreVector>>
> = {
  warrior: { STR: 13.37, AGI: 11.63, VIT: 12.79, PER: 6.40, INT: 5.81 },
  mage:    { STR: 6.10,  AGI: 7.32,  VIT: 8.54,  PER: 13.41, INT: 14.63 },
  rogue:   { STR: 10.37, AGI: 15.24, VIT: 10.37, PER: 7.32,  INT: 6.70 },
  paladin: { STR: 12.50, AGI: 9.66,  VIT: 12.50, PER: 7.95,  INT: 7.39 },
  hunter:  { STR: 8.24,  AGI: 14.71, VIT: 11.18, PER: 8.24,  INT: 7.63 },
  priest:  { STR: 6.25,  AGI: 6.88,  VIT: 8.12,  PER: 15.00, INT: 13.75 },
  shaman:  { STR: 10.00, AGI: 8.89,  VIT: 11.11, PER: 10.00, INT: 10.00 },
  warlock: { STR: 6.88,  AGI: 7.50,  VIT: 9.38,  PER: 13.12, INT: 13.12 },
  druid:   { STR: 8.72,  AGI: 8.72,  VIT: 9.88,  PER: 11.63, INT: 11.05 },
} as const;

const ZERO_CORE_VECTOR: HighflyCoreVector = {
  STR: 0, AGI: 0, VIT: 0, PER: 0, INT: 0,
};

export interface HighflyAwakeningState {
  version: typeof HIGHFLY_AWAKENING_STATS_VERSION;
  initialized: boolean;
  classId: HighflyAwakeningClassId | null;
  initializedAt: string | null;
  budget: number;
  base: HighflyCoreVector;
}

export interface HighflyCoreStatState {
  /** Final internal Hunter Stat = Awakening + Natural Level Growth + allocated Training. */
  current: number;
  /** Historical best final value. Core never decreases outside an authorized Training respec. */
  peak: number;
  /** Immutable class aptitude written once by Awakening. */
  awakeningBase: number;
  /** Automatic class-affinity growth earned by real character levels. PF-2 owns the curve. */
  naturalLevelGrowth: number;
  /** Training Points currently allocated to this primary stat. */
  trainingAllocated: number;
  /**
   * Transitional alias retained while RUN1-J consumers migrate. It MUST mirror
   * trainingAllocated and will be removed only after bridge/UI/pipeline callers
   * have moved to the wallet-backed field.
   */
  trainingGrowth: number;
  /** Pending adaptation evidence toward a future Performance Gate. */
  progress: number;
  /** 0..1 trust in the underlying evidence. */
  confidence: number;
  /** 0..1 short-term readiness. It may vary without changing Core. */
  readiness: number;
  /** False until Training establishes a comparable performance anchor. */
  calibrated: boolean;
}

export type HighflyCoreStatsState = Record<HighflyCoreStat, HighflyCoreStatState>;

export interface HighflyTrainingPointWallet {
  /** Lifetime Training Points consolidated by validated real Training. */
  earned: number;
  /** Earned points not currently assigned to a Core stat. */
  available: number;
  /** Current manual allocation. Sum + available must equal earned. */
  allocated: HighflyCoreVector;
  /** Exactly one full Training allocation reset is free per Hunter. */
  freeResetUsed: boolean;
}

export interface HighflyResolveState {
  adherence28d: number;
  adherence90d: number;
  adherence180d: number;
  returnConsistency: number;
}

export interface HighflyPerformanceAnchor {
  baseline: number;
  latest: number;
  evidenceId: string;
  updatedAt: string;
}

export interface HighflyTrainingHistoryEntry {
  sessionId: string;
  recordedAt: string;
  stat: HighflyCoreStat;
  stimulus: number;
  performanceIndex: number | null;
  outcome:
    | 'calibrated'
    | 'progress_only'
    | 'awaiting_performance'
    | 'awaiting_confidence'
    | 'maintenance'
    | 'stat_up';
}

export type HighflyRmLiftId =
  | 'back_squat'
  | 'front_squat'
  | 'bench_press'
  | 'barbell_row'
  | 'overhead_press'
  | 'deadlift'
  | 'hang_power_clean';

export type HighflySex = 'male' | 'female';

export interface HighflyAthleteCalibrationProfile {
  sex: HighflySex;
  ageYears: number;
  bodyweightKg: number;
  updatedAt: string;
}

export interface HighflyRmCalibrationSample {
  loadKg: number;
  reps: number;
  estimatedOneRmKg: number;
  recordedAt: string;
}

export interface HighflyRmCalibrationEntry {
  oneRmKg: number;
  estimatedOneRmKg?: number;
  verifiedOneRmKg?: number;
  relativeToBodyweight?: number;
  status?: 'verified' | 'evaluation';
  evaluationUntil?: string;
  samples?: HighflyRmCalibrationSample[];
  updatedAt: string;
}

export interface HighflyLoadCalibrationState {
  tmFactor: number;
  roundKg: number;
  athlete?: HighflyAthleteCalibrationProfile;
  lifts: Partial<Record<HighflyRmLiftId, HighflyRmCalibrationEntry>>;
}

export type HighflyAccessoryEquipmentKind =
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'other';

export interface HighflyAccessoryLoadAttempt {
  recordedAt: string;
  kg: number;
  sets: number;
  reps: number;
  outcome: 'completed' | 'repeat';
}

export interface HighflyAccessoryLoadEntry {
  kg: number;
  updatedAt: string;
  equipmentKind?: HighflyAccessoryEquipmentKind;
  progressionStepKg?: number;
  nextSuggestedKg?: number;
  repeatRequested?: boolean;
  lastSets?: number;
  lastReps?: number;
  history?: HighflyAccessoryLoadAttempt[];
}

export interface HighflyHunterProgressionState {
  level: number;
  xp: number;
  rank: 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'NACIONAL';
  classId: string | null;
  subclassId: string | null;
}

export interface HighflyCycleResetEntry {
  cycle: number;
  resetAt: string;
  reason: string;
  completedSessions: string[];
  activeWeek: 1 | 2 | 3 | 4;
}

export interface HighflyCycleProgressionState {
  currentCycle: number;
  activeWeek?: 1 | 2 | 3 | 4;
  successfulCycles: number;
  repeatedCycles: number;
  lastDecision: 'advance' | 'repeat' | null;
  completedSessions: string[];
  resetHistory?: HighflyCycleResetEntry[];
}

export interface HighflyHunterProfile {
  schemaVersion: typeof HIGHFLY_TRAINING_SCHEMA_VERSION;
  scoringVersion: typeof HIGHFLY_TRAINING_SCORING_VERSION;
  profileId: string;
  createdAt: string;
  awakening: HighflyAwakeningState;
  training: {
    core: HighflyCoreStatsState;
    points: HighflyTrainingPointWallet;
    resolve: HighflyResolveState;
    performance?: Partial<Record<HighflyCoreStat, HighflyPerformanceAnchor>>;
    history?: HighflyTrainingHistoryEntry[];
    loadCalibration?: HighflyLoadCalibrationState;
    accessoryLoads?: Record<string, HighflyAccessoryLoadEntry>;
    cycleProgression?: HighflyCycleProgressionState;
  };
  hunter: HighflyHunterProgressionState;
}

export interface TrainingAuthorityProof {
  source: 'training-performance-gate';
  scoringVersion: typeof HIGHFLY_TRAINING_SCORING_VERSION;
  evidenceId: string;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function finiteNonNegative(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

export function isAwakeningClassId(value: unknown): value is HighflyAwakeningClassId {
  return typeof value === 'string' &&
    (HIGHFLY_AWAKENING_CLASSES as readonly string[]).includes(value);
}

export function clampHighflyNormalLevel(value: unknown): number {
  const numeric = typeof value === 'number' && Number.isFinite(value) ? value : 1;
  return Math.max(1, Math.min(HIGHFLY_NORMAL_MAX_LEVEL, Math.trunc(numeric)));
}

export function naturalLevelGrowthFor(
  classId: HighflyAwakeningClassId,
  level: number,
): HighflyCoreVector {
  const normalizedLevel = clampHighflyNormalLevel(level);
  const totalGrowth =
    HIGHFLY_NATURAL_GROWTH_BUDGET *
    ((normalizedLevel - 1) / (HIGHFLY_NORMAL_MAX_LEVEL - 1));
  const weights = HIGHFLY_NATURAL_GROWTH_WEIGHTS[classId];
  const weightTotal = HIGHFLY_CORE_STATS.reduce((sum, stat) => sum + weights[stat], 0);
  if (weightTotal <= 0) return { ...ZERO_CORE_VECTOR };
  return Object.fromEntries(
    HIGHFLY_CORE_STATS.map((stat) => [
      stat,
      totalGrowth * (weights[stat] / weightTotal),
    ]),
  ) as HighflyCoreVector;
}

function blankCoreStat(
  awakeningBase = 0,
  naturalLevelGrowth = 0,
  trainingAllocated = 0,
): HighflyCoreStatState {
  const current = awakeningBase + naturalLevelGrowth + trainingAllocated;
  return {
    current,
    peak: current,
    awakeningBase,
    naturalLevelGrowth,
    trainingAllocated,
    trainingGrowth: trainingAllocated,
    progress: 0,
    confidence: 0,
    readiness: 1,
    calibrated: false,
  };
}

function emptyTrainingPointWallet(): HighflyTrainingPointWallet {
  return {
    earned: 0,
    available: 0,
    allocated: { ...ZERO_CORE_VECTOR },
    freeResetUsed: false,
  };
}

function walletAllocatedTotal(wallet: HighflyTrainingPointWallet): number {
  return HIGHFLY_CORE_STATS.reduce((sum, stat) => sum + finiteNonNegative(wallet.allocated[stat]), 0);
}

export function assertTrainingPointConservation(wallet: HighflyTrainingPointWallet): void {
  const earned = finiteNonNegative(wallet.earned);
  const available = finiteNonNegative(wallet.available);
  const allocated = walletAllocatedTotal(wallet);
  if (Math.abs(earned - available - allocated) > 1e-8) {
    throw new Error(
      `HIGHFLY Training Point conservation violated: earned=${earned}, available=${available}, allocated=${allocated}`,
    );
  }
}

function emptyAwakening(): HighflyAwakeningState {
  return {
    version: HIGHFLY_AWAKENING_STATS_VERSION,
    initialized: false,
    classId: null,
    initializedAt: null,
    budget: 0,
    base: { ...ZERO_CORE_VECTOR },
  };
}

export function initializeAwakeningStats(
  profile: HighflyHunterProfile,
  classId: HighflyAwakeningClassId,
  initializedAt = profile.createdAt,
): HighflyHunterProfile {
  if (profile.awakening?.initialized) return profile;
  const base = HIGHFLY_AWAKENING_BASES[classId];
  const naturalGrowth = naturalLevelGrowthFor(classId, profile.hunter.level);
  const nextCore = {} as HighflyCoreStatsState;
  for (const stat of HIGHFLY_CORE_STATS) {
    const previous = profile.training.core[stat];
    const naturalLevelGrowth = naturalGrowth[stat];
    const trainingAllocated = finiteNonNegative(
      (previous as Partial<HighflyCoreStatState> | undefined)?.trainingAllocated ??
        previous?.trainingGrowth ??
        previous?.current,
    );
    const legacyPeakGrowth = finiteNonNegative(previous?.peak);
    const current = base[stat] + naturalLevelGrowth + trainingAllocated;
    nextCore[stat] = {
      ...previous,
      current,
      peak: Math.max(current, legacyPeakGrowth),
      awakeningBase: base[stat],
      naturalLevelGrowth,
      trainingAllocated,
      trainingGrowth: trainingAllocated,
      progress: finiteNonNegative(previous?.progress),
      confidence: clamp01(previous?.confidence ?? 0),
      readiness: clamp01(previous?.readiness ?? 1),
      calibrated: previous?.calibrated ?? false,
    };
  }
  return {
    ...profile,
    schemaVersion: HIGHFLY_TRAINING_SCHEMA_VERSION,
    awakening: {
      version: HIGHFLY_AWAKENING_STATS_VERSION,
      initialized: true,
      classId,
      initializedAt,
      budget: HIGHFLY_AWAKENING_BUDGET,
      base: { ...base },
    },
    training: {
      ...profile.training,
      core: nextCore,
      points: (() => {
        const existing = profile.training.points;
        const allocated = { ...ZERO_CORE_VECTOR };
        for (const stat of HIGHFLY_CORE_STATS) {
          allocated[stat] = nextCore[stat].trainingAllocated;
        }
        const available = finiteNonNegative(existing?.available);
        const points: HighflyTrainingPointWallet = {
          earned:
            available +
            HIGHFLY_CORE_STATS.reduce((sum, stat) => sum + allocated[stat], 0),
          available,
          allocated,
          freeResetUsed: existing?.freeResetUsed ?? false,
        };
        assertTrainingPointConservation(points);
        return points;
      })(),
    },
  };
}

export function createHighflyHunterProfile(args: {
  profileId: string;
  createdAt?: string;
  level?: number;
  classId?: string | null;
}): HighflyHunterProfile {
  const createdAt = args.createdAt ?? new Date().toISOString();
  const level = clampHighflyNormalLevel(args.level ?? 1);
  let profile: HighflyHunterProfile = {
    schemaVersion: HIGHFLY_TRAINING_SCHEMA_VERSION,
    scoringVersion: HIGHFLY_TRAINING_SCORING_VERSION,
    profileId: args.profileId,
    createdAt,
    awakening: emptyAwakening(),
    training: {
      core: {
        STR: blankCoreStat(),
        AGI: blankCoreStat(),
        VIT: blankCoreStat(),
        PER: blankCoreStat(),
        INT: blankCoreStat(),
      },
      points: emptyTrainingPointWallet(),
      resolve: {
        adherence28d: 0,
        adherence90d: 0,
        adherence180d: 0,
        returnConsistency: 0,
      },
      performance: {},
      history: [],
      loadCalibration: { tmFactor: 0.9, roundKg: 2.5, lifts: {} },
      accessoryLoads: {},
      cycleProgression: {
        currentCycle: 1,
        activeWeek: 1,
        successfulCycles: 0,
        repeatedCycles: 0,
        lastDecision: null,
        completedSessions: [],
        resetHistory: [],
      },
    },
    hunter: {
      level,
      xp: 0,
      rank: 'F',
      classId: args.classId ?? null,
      subclassId: null,
    },
  };
  if (isAwakeningClassId(args.classId)) {
    profile = initializeAwakeningStats(profile, args.classId, createdAt);
  }
  return profile;
}

/**
 * Migration is intentionally power-preserving:
 * - schema 1 zero-origin values became Training Growth in schema 2;
 * - schema 2 Training Growth becomes wallet-backed Training allocation in schema 3;
 * - Natural Level Growth starts at zero until PF-2 owns the 1..99 curve.
 * No existing Hunter gains or loses Core merely by loading a newer schema.
 */
export function migrateAwakeningStats(profile: HighflyHunterProfile): HighflyHunterProfile {
  const legacy = profile as HighflyHunterProfile & {
    schemaVersion: number;
    awakening?: HighflyAwakeningState;
  };
  const completeV3 =
    legacy.schemaVersion === HIGHFLY_TRAINING_SCHEMA_VERSION &&
    legacy.awakening?.version === HIGHFLY_AWAKENING_STATS_VERSION &&
    legacy.training.points !== undefined &&
    HIGHFLY_CORE_STATS.every((stat) => {
      const state = legacy.training.core[stat] as Partial<HighflyCoreStatState>;
      return (
        Number.isFinite(state.awakeningBase) &&
        Number.isFinite(state.naturalLevelGrowth) &&
        Number.isFinite(state.trainingAllocated) &&
        Number.isFinite(state.trainingGrowth)
      );
    });
  if (completeV3) {
    assertTrainingPointConservation(legacy.training.points);
    return profile;
  }

  const classId = isAwakeningClassId(legacy.hunter?.classId)
    ? legacy.hunter.classId
    : null;
  const base = classId ? HIGHFLY_AWAKENING_BASES[classId] : ZERO_CORE_VECTOR;
  const nextCore = {} as HighflyCoreStatsState;
  const allocated = { ...ZERO_CORE_VECTOR };

  for (const stat of HIGHFLY_CORE_STATS) {
    const previous = legacy.training.core[stat] as Partial<HighflyCoreStatState>;
    const legacyCurrent = finiteNonNegative(previous.current);
    const legacyPeak = Math.max(legacyCurrent, finiteNonNegative(previous.peak));
    const naturalLevelGrowth = finiteNonNegative(previous.naturalLevelGrowth);
    const trainingAllocated = finiteNonNegative(
      previous.trainingAllocated ??
        previous.trainingGrowth ??
        (legacy.schemaVersion < 2
          ? legacyCurrent
          : Math.max(0, legacyCurrent - base[stat] - naturalLevelGrowth)),
    );
    allocated[stat] = trainingAllocated;
    const current = base[stat] + naturalLevelGrowth + trainingAllocated;
    nextCore[stat] = {
      current,
      peak: Math.max(current, legacyPeak),
      awakeningBase: base[stat],
      naturalLevelGrowth,
      trainingAllocated,
      trainingGrowth: trainingAllocated,
      progress: finiteNonNegative(previous.progress),
      confidence: clamp01(previous.confidence ?? 0),
      readiness: clamp01(previous.readiness ?? 1),
      calibrated: previous.calibrated ?? false,
    };
  }

  return {
    ...profile,
    schemaVersion: HIGHFLY_TRAINING_SCHEMA_VERSION,
    awakening: classId
      ? {
          version: HIGHFLY_AWAKENING_STATS_VERSION,
          initialized: true,
          classId,
          initializedAt: profile.createdAt,
          budget: HIGHFLY_AWAKENING_BUDGET,
          base: { ...base },
        }
      : emptyAwakening(),
    training: {
      ...profile.training,
      core: nextCore,
      points: {
        earned: HIGHFLY_CORE_STATS.reduce((sum, stat) => sum + allocated[stat], 0),
        available: 0,
        allocated,
        freeResetUsed: (profile.training as { points?: HighflyTrainingPointWallet }).points?.freeResetUsed ?? false,
      },
    },
  };
}

export function coreSnapshot(profile: HighflyHunterProfile): string {
  return JSON.stringify(profile.training.core);
}

export function applyNaturalLevelGrowth(
  profile: HighflyHunterProfile,
  level = profile.hunter.level,
): HighflyHunterProfile {
  if (!profile.awakening.initialized || !profile.awakening.classId) return profile;
  const normalizedLevel = clampHighflyNormalLevel(level);
  const growth = naturalLevelGrowthFor(profile.awakening.classId, normalizedLevel);
  const nextCore = {} as HighflyCoreStatsState;

  for (const stat of HIGHFLY_CORE_STATS) {
    const previous = profile.training.core[stat];
    const naturalLevelGrowth = growth[stat];
    const current =
      previous.awakeningBase +
      naturalLevelGrowth +
      previous.trainingAllocated;
    nextCore[stat] = {
      ...previous,
      current,
      peak: Math.max(previous.peak, current),
      naturalLevelGrowth,
      trainingGrowth: previous.trainingAllocated,
    };
  }

  return {
    ...profile,
    hunter: { ...profile.hunter, level: normalizedLevel },
    training: { ...profile.training, core: nextCore },
  };
}

/**
 * PF-2: real level owns only Natural Level Growth. Rank/spec/debug class changes
 * never re-roll Awakening and never move Training allocation. Natural affinity
 * always follows the immutable Awakening class.
 */
export function applyHunterProgression(
  profile: HighflyHunterProfile,
  patch: Partial<HighflyHunterProgressionState>,
): HighflyHunterProfile {
  let next: HighflyHunterProfile = {
    ...profile,
    hunter: {
      ...profile.hunter,
      ...patch,
      level: patch.level === undefined
        ? profile.hunter.level
        : clampHighflyNormalLevel(patch.level),
    },
  };
  const requestedClass = next.hunter.classId;
  if (!profile.awakening.initialized && isAwakeningClassId(requestedClass)) {
    return initializeAwakeningStats(next, requestedClass);
  }
  if (profile.awakening.initialized) {
    next = applyNaturalLevelGrowth(next, next.hunter.level);
  }
  return next;
}

/**
 * Only Training may increase final Core after Awakening. Decimals are stored as
 * JS numbers without integer rounding. Temporary fatigue belongs in readiness,
 * never by reducing Core.
 */
export function commitTrainingCoreStat(
  profile: HighflyHunterProfile,
  stat: HighflyCoreStat,
  nextCurrent: number,
  proof: TrainingAuthorityProof,
  opts?: {
    progress?: number;
    confidence?: number;
    readiness?: number;
  },
): HighflyHunterProfile {
  if (proof.source !== 'training-performance-gate') {
    throw new Error('HIGHFLY Core Stats may only be committed by Training Core');
  }
  if (proof.scoringVersion !== HIGHFLY_TRAINING_SCORING_VERSION) {
    throw new Error('HIGHFLY Training scoring version mismatch');
  }
  if (!proof.evidenceId.trim()) {
    throw new Error('HIGHFLY Training evidenceId is required');
  }
  if (!profile.awakening.initialized) {
    throw new Error('HIGHFLY Hunter must complete Awakening before Training can modify Core');
  }
  if (!Number.isFinite(nextCurrent) || nextCurrent < 0) {
    throw new Error('HIGHFLY Core Stat must be finite and non-negative');
  }

  const previous = profile.training.core[stat];
  if (nextCurrent + 1e-9 < previous.current) {
    throw new Error('HIGHFLY Core Stats cannot decrease outside an authorized Training respec');
  }
  const trainingAllocated =
    nextCurrent - previous.awakeningBase - previous.naturalLevelGrowth;
  if (trainingAllocated + 1e-9 < previous.trainingAllocated) {
    throw new Error('HIGHFLY Training allocation cannot decrease outside an authorized respec');
  }
  const delta = Math.max(0, trainingAllocated - previous.trainingAllocated);
  const previousWallet = profile.training.points ?? emptyTrainingPointWallet();
  const nextAllocated = {
    ...previousWallet.allocated,
    [stat]: finiteNonNegative(previousWallet.allocated[stat]) + delta,
  };
  const nextWallet: HighflyTrainingPointWallet = {
    ...previousWallet,
    earned: finiteNonNegative(previousWallet.earned) + delta,
    available: finiteNonNegative(previousWallet.available),
    allocated: nextAllocated,
  };
  assertTrainingPointConservation(nextWallet);

  const nextState: HighflyCoreStatState = {
    ...previous,
    current: nextCurrent,
    peak: Math.max(previous.peak, nextCurrent),
    trainingAllocated,
    trainingGrowth: trainingAllocated,
    progress: Math.max(0, opts?.progress ?? previous.progress),
    confidence: clamp01(opts?.confidence ?? previous.confidence),
    readiness: clamp01(opts?.readiness ?? previous.readiness),
    calibrated: true,
  };

  return {
    ...profile,
    training: {
      ...profile.training,
      core: { ...profile.training.core, [stat]: nextState },
      points: nextWallet,
    },
  };
}

export function updateTrainingTelemetry(
  profile: HighflyHunterProfile,
  stat: HighflyCoreStat,
  patch: Partial<Pick<HighflyCoreStatState, 'progress' | 'confidence' | 'readiness'>>,
): HighflyHunterProfile {
  const previous = profile.training.core[stat];
  return {
    ...profile,
    training: {
      ...profile.training,
      core: {
        ...profile.training.core,
        [stat]: {
          ...previous,
          progress: Math.max(0, patch.progress ?? previous.progress),
          confidence: clamp01(patch.confidence ?? previous.confidence),
          readiness: clamp01(patch.readiness ?? previous.readiness),
        },
      },
    },
  };
}
