import {
  HIGHFLY_TRAINING_SCORING_VERSION,
  commitTrainingCoreStat,
  updateTrainingTelemetry,
  type HighflyCoreStat,
  type HighflyHunterProfile,
} from './core';

export const HIGHFLY_ADAPTATION_VERSION = 'run1-c-lab-v1' as const;

export interface AdaptationInput {
  stat: HighflyCoreStat;
  /** Productive stimulus accumulated for this stat during the evaluated block. */
  productiveStimulus: number;
  /** Previous comparable performance anchor for this stat/movement family. */
  previousPerformanceIndex: number | null;
  /** Current comparable performance anchor measured under similar conditions. */
  currentPerformanceIndex: number | null;
  /** 0..1 evidence trust for this evaluation window. */
  confidence: number;
  /** 0..1 short-term readiness after the block/deload. */
  readiness: number;
  /** Stable audit/evidence identifier. */
  evidenceId: string;
}

export type AdaptationStatus =
  | 'progress_only'
  | 'awaiting_performance'
  | 'awaiting_confidence'
  | 'maintenance'
  | 'stat_up';

export interface AdaptationResult {
  profile: HighflyHunterProfile;
  status: AdaptationStatus;
  stat: HighflyCoreStat;
  progressBefore: number;
  progressAfter: number;
  progressCost: number;
  performanceGateRatio: number;
  performanceImprovementRatio: number | null;
  statDelta: 0 | 1;
  reason: string;
}

/**
 * Versioned LAB candidate. This is a game/training scoring curve, not a
 * physiological law. It intentionally becomes more expensive as Current rises.
 */
export function progressCostForCurrent(current: number): number {
  const safe = Math.max(0, current);
  return 12 + safe * 0.8 + safe * safe * 0.018;
}

/**
 * Versioned LAB candidate for comparable block-to-block evidence.
 * Beginners require a clearer change; advanced profiles can consolidate a
 * smaller relative improvement because meaningful gains become slower.
 */
export function performanceGateRatioForCurrent(current: number): number {
  const safe = Math.max(0, current);
  if (safe < 20) return 1.02;
  if (safe < 40) return 1.015;
  if (safe < 60) return 1.01;
  return 1.005;
}

export function performanceImprovementRatio(
  previous: number | null,
  current: number | null,
): number | null {
  if (
    previous === null ||
    current === null ||
    !Number.isFinite(previous) ||
    !Number.isFinite(current) ||
    previous <= 0 ||
    current <= 0
  ) {
    return null;
  }
  return current / previous;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

/**
 * RUN1-C adaptation contract:
 *
 * - Stimulus can build Progress.
 * - Progress alone NEVER grants a Stat Up.
 * - A Stat Up requires enough Progress + comparable performance improvement +
 *   sufficient Confidence.
 * - One evaluation can consolidate at most +1 Current.
 * - Repeating the same performance keeps Progress pending (maintenance).
 * - Peak is preserved by commitTrainingCoreStat().
 */
export function evaluateAdaptation(
  profile: HighflyHunterProfile,
  input: AdaptationInput,
): AdaptationResult {
  const previousState = profile.training.core[input.stat];
  if (!previousState.calibrated) {
    throw new Error(
      `HIGHFLY ${input.stat} must be calibrated before adaptation can consolidate Stat Ups`,
    );
  }
  if (!input.evidenceId.trim()) {
    throw new Error('HIGHFLY adaptation evidenceId is required');
  }

  const progressBefore = previousState.progress;
  const addedProgress = Math.max(0, Number.isFinite(input.productiveStimulus) ? input.productiveStimulus : 0);
  const accumulatedProgress = progressBefore + addedProgress;
  const confidence = clamp01(input.confidence);
  const readiness = clamp01(input.readiness);
  const progressCost = progressCostForCurrent(previousState.current);
  const performanceGateRatio = performanceGateRatioForCurrent(previousState.current);
  const performanceImprovement = performanceImprovementRatio(
    input.previousPerformanceIndex,
    input.currentPerformanceIndex,
  );

  let telemetryProfile = updateTrainingTelemetry(profile, input.stat, {
    progress: accumulatedProgress,
    confidence,
    readiness,
  });

  if (accumulatedProgress < progressCost) {
    return {
      profile: telemetryProfile,
      status: 'progress_only',
      stat: input.stat,
      progressBefore,
      progressAfter: accumulatedProgress,
      progressCost,
      performanceGateRatio,
      performanceImprovementRatio: performanceImprovement,
      statDelta: 0,
      reason: 'Productive Progress accumulated; Performance Gate is not evaluated until cost is met.',
    };
  }

  if (confidence < 0.6) {
    return {
      profile: telemetryProfile,
      status: 'awaiting_confidence',
      stat: input.stat,
      progressBefore,
      progressAfter: accumulatedProgress,
      progressCost,
      performanceGateRatio,
      performanceImprovementRatio: performanceImprovement,
      statDelta: 0,
      reason: 'Enough Progress exists, but evidence Confidence is below the consolidation threshold.',
    };
  }

  if (performanceImprovement === null) {
    return {
      profile: telemetryProfile,
      status: 'awaiting_performance',
      stat: input.stat,
      progressBefore,
      progressAfter: accumulatedProgress,
      progressCost,
      performanceGateRatio,
      performanceImprovementRatio: null,
      statDelta: 0,
      reason: 'Enough Progress exists, but no comparable performance pair is available.',
    };
  }

  if (performanceImprovement < performanceGateRatio) {
    return {
      profile: telemetryProfile,
      status: 'maintenance',
      stat: input.stat,
      progressBefore,
      progressAfter: accumulatedProgress,
      progressCost,
      performanceGateRatio,
      performanceImprovementRatio: performanceImprovement,
      statDelta: 0,
      reason: 'Training maintained capacity, but comparable performance did not clear the Stat Up gate.',
    };
  }

  const remainder = Math.max(0, accumulatedProgress - progressCost);
  telemetryProfile = commitTrainingCoreStat(
    telemetryProfile,
    input.stat,
    previousState.current + 1,
    {
      source: 'training-performance-gate',
      scoringVersion: HIGHFLY_TRAINING_SCORING_VERSION,
      evidenceId: input.evidenceId,
    },
    {
      progress: remainder,
      confidence,
      readiness,
    },
  );

  return {
    profile: telemetryProfile,
    status: 'stat_up',
    stat: input.stat,
    progressBefore,
    progressAfter: remainder,
    progressCost,
    performanceGateRatio,
    performanceImprovementRatio: performanceImprovement,
    statDelta: 1,
    reason: 'Progress cost and comparable Performance Gate were both satisfied.',
  };
}
