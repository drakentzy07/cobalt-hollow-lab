export const HIGHFLY_TRAINING_SCHEMA_VERSION = 1 as const;
export const HIGHFLY_TRAINING_SCORING_VERSION = 'run1-a' as const;

export const HIGHFLY_CORE_STATS = ['STR', 'AGI', 'VIT', 'PER', 'INT'] as const;
export type HighflyCoreStat = (typeof HIGHFLY_CORE_STATS)[number];

export interface HighflyCoreStatState {
  /** Consolidated training capability. Never granted by level, gear or class. */
  current: number;
  /** Historical best consolidated value. Never decreases. */
  peak: number;
  /** Pending adaptation evidence toward a future Performance Gate. */
  progress: number;
  /** 0..1 trust in the underlying evidence. */
  confidence: number;
  /** 0..1 short-term readiness. It may vary without changing current/peak. */
  readiness: number;
  /** False until the Training calibration flow establishes a real baseline. */
  calibrated: boolean;
}

export type HighflyCoreStatsState = Record<HighflyCoreStat, HighflyCoreStatState>;

export interface HighflyResolveState {
  adherence28d: number;
  adherence90d: number;
  adherence180d: number;
  returnConsistency: number;
}

export interface HighflyPerformanceAnchor {
  /** Comparable performance baseline held until the next consolidated Stat Up. */
  baseline: number;
  /** Most recent valid comparable performance sample. */
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

export interface HighflyHunterProgressionState {
  level: number;
  xp: number;
  rank: 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'NACIONAL';
  classId: string | null;
  subclassId: string | null;
}

export interface HighflyHunterProfile {
  schemaVersion: typeof HIGHFLY_TRAINING_SCHEMA_VERSION;
  scoringVersion: typeof HIGHFLY_TRAINING_SCORING_VERSION;
  profileId: string;
  createdAt: string;
  training: {
    core: HighflyCoreStatsState;
    resolve: HighflyResolveState;
    /** Optional on legacy saves; RUN1-H lazily initializes when absent. */
    performance?: Partial<Record<HighflyCoreStat, HighflyPerformanceAnchor>>;
    /** Optional on legacy saves; bounded audit history for explainability. */
    history?: HighflyTrainingHistoryEntry[];
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

function blankCoreStat(): HighflyCoreStatState {
  return {
    current: 0,
    peak: 0,
    progress: 0,
    confidence: 0,
    readiness: 1,
    calibrated: false,
  };
}

export function createHighflyHunterProfile(args: {
  profileId: string;
  createdAt?: string;
  level?: number;
  classId?: string | null;
}): HighflyHunterProfile {
  const createdAt = args.createdAt ?? new Date().toISOString();
  const level = Math.max(1, Math.trunc(args.level ?? 1));
  return {
    schemaVersion: HIGHFLY_TRAINING_SCHEMA_VERSION,
    scoringVersion: HIGHFLY_TRAINING_SCORING_VERSION,
    profileId: args.profileId,
    createdAt,
    training: {
      core: {
        STR: blankCoreStat(),
        AGI: blankCoreStat(),
        VIT: blankCoreStat(),
        PER: blankCoreStat(),
        INT: blankCoreStat(),
      },
      resolve: {
        adherence28d: 0,
        adherence90d: 0,
        adherence180d: 0,
        returnConsistency: 0,
      },
      performance: {},
      history: [],
    },
    hunter: {
      level,
      xp: 0,
      rank: 'F',
      classId: args.classId ?? null,
      subclassId: null,
    },
  };
}

export function coreSnapshot(profile: HighflyHunterProfile): string {
  return JSON.stringify(profile.training.core);
}

/**
 * World/RPG progression is intentionally isolated from Training Core.
 * Level/class/subclass changes must never mutate STR/AGI/VIT/PER/INT.
 */
export function applyHunterProgression(
  profile: HighflyHunterProfile,
  patch: Partial<HighflyHunterProgressionState>,
): HighflyHunterProfile {
  const before = coreSnapshot(profile);
  const next: HighflyHunterProfile = {
    ...profile,
    hunter: {
      ...profile.hunter,
      ...patch,
      level:
        patch.level === undefined
          ? profile.hunter.level
          : Math.max(1, Math.trunc(patch.level)),
    },
  };
  if (coreSnapshot(next) !== before) {
    throw new Error('HIGHFLY invariant violated: Hunter progression mutated Training Core');
  }
  return next;
}

/**
 * Only the Training adaptation layer may commit a consolidated Core Stat value.
 * The engine that issues this proof is implemented in later RUN1 stages.
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
  if (!Number.isFinite(nextCurrent) || nextCurrent < 0) {
    throw new Error('HIGHFLY Core Stat must be finite and non-negative');
  }

  const previous = profile.training.core[stat];
  const current = nextCurrent;
  const nextState: HighflyCoreStatState = {
    current,
    peak: Math.max(previous.peak, current),
    progress: Math.max(0, opts?.progress ?? previous.progress),
    confidence: clamp01(opts?.confidence ?? previous.confidence),
    readiness: clamp01(opts?.readiness ?? previous.readiness),
    calibrated: true,
  };

  return {
    ...profile,
    training: {
      ...profile.training,
      core: {
        ...profile.training.core,
        [stat]: nextState,
      },
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
