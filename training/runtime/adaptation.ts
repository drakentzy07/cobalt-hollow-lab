import {
  HIGHFLY_TRAINING_SCORING_VERSION,
  commitTrainingCoreStat,
  updateTrainingTelemetry,
  type HighflyCoreStat,
  type HighflyHunterProfile,
} from './core';

export const HIGHFLY_ADAPTATION_VERSION = 'run2-awakening-fractional-v1' as const;

export interface AdaptationInput {
  stat: HighflyCoreStat;
  productiveStimulus: number;
  previousPerformanceIndex: number | null;
  currentPerformanceIndex: number | null;
  confidence: number;
  readiness: number;
  evidenceId: string;
  absolutePerformanceGate?: number;
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
  /** Decimal Core growth; never forced to an integer. */
  statDelta: number;
  reason: string;
}

export function progressCostForCurrent(current: number): number {
  const safe = Math.max(0, current);
  return 12 + safe * 0.8 + safe * safe * 0.018;
}

export function performanceGateRatioForCurrent(current: number): number {
  const safe = Math.max(0, current);
  if (safe < 20) return 1.02;
  if (safe < 40) return 1.015;
  if (safe < 60) return 1.01;
  return 1.005;
}

export function consolidationDeltaForCurrent(current: number): number {
  const cost = progressCostForCurrent(current);
  return Math.max(0.1, Math.min(0.75, 15 / cost));
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
  ) return null;
  return current / previous;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

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
  const addedProgress = Math.max(
    0,
    Number.isFinite(input.productiveStimulus) ? input.productiveStimulus : 0,
  );
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

  const common = {
    stat: input.stat,
    progressBefore,
    progressCost,
    performanceGateRatio,
    performanceImprovementRatio: performanceImprovement,
  };

  if (accumulatedProgress < progressCost) {
    return {
      profile: telemetryProfile,
      status: 'progress_only',
      ...common,
      progressAfter: accumulatedProgress,
      statDelta: 0,
      reason: 'Productive Progress accumulated; Performance Gate is not evaluated until cost is met.',
    };
  }

  if (confidence < 0.6) {
    return {
      profile: telemetryProfile,
      status: 'awaiting_confidence',
      ...common,
      progressAfter: accumulatedProgress,
      statDelta: 0,
      reason: 'Enough Progress exists, but evidence Confidence is below the consolidation threshold.',
    };
  }

  if (input.absolutePerformanceGate !== undefined) {
    const currentPerformance = input.currentPerformanceIndex;
    if (
      currentPerformance === null ||
      !Number.isFinite(currentPerformance) ||
      currentPerformance <= 0
    ) {
      return {
        profile: telemetryProfile,
        status: 'awaiting_performance',
        ...common,
        progressAfter: accumulatedProgress,
        performanceImprovementRatio: null,
        statDelta: 0,
        reason: 'Enough Progress exists, but no valid behavioral performance sample is available.',
      };
    }
    if (currentPerformance < input.absolutePerformanceGate) {
      return {
        profile: telemetryProfile,
        status: 'maintenance',
        ...common,
        progressAfter: accumulatedProgress,
        statDelta: 0,
        reason: `Behavioral gate not cleared: ${currentPerformance.toFixed(1)} < ${input.absolutePerformanceGate.toFixed(1)}.`,
      };
    }

    const remainder = Math.max(0, accumulatedProgress - progressCost);
    const delta = consolidationDeltaForCurrent(previousState.current);
    telemetryProfile = commitTrainingCoreStat(
      telemetryProfile,
      input.stat,
      previousState.current + delta,
      {
        source: 'training-performance-gate',
        scoringVersion: HIGHFLY_TRAINING_SCORING_VERSION,
        evidenceId: input.evidenceId,
      },
      { progress: remainder, confidence, readiness },
    );
    return {
      profile: telemetryProfile,
      status: 'stat_up',
      ...common,
      progressAfter: remainder,
      statDelta: delta,
      reason: `Progress cost and behavioral gate ${input.absolutePerformanceGate.toFixed(1)} were satisfied; decimal Training Growth consolidated.`,
    };
  }

  if (performanceImprovement === null) {
    return {
      profile: telemetryProfile,
      status: 'awaiting_performance',
      ...common,
      progressAfter: accumulatedProgress,
      performanceImprovementRatio: null,
      statDelta: 0,
      reason: 'Enough Progress exists, but no comparable performance pair is available.',
    };
  }

  if (performanceImprovement < performanceGateRatio) {
    return {
      profile: telemetryProfile,
      status: 'maintenance',
      ...common,
      progressAfter: accumulatedProgress,
      statDelta: 0,
      reason: 'Training maintained capacity, but comparable performance did not clear the Stat Up gate.',
    };
  }

  const remainder = Math.max(0, accumulatedProgress - progressCost);
  const delta = consolidationDeltaForCurrent(previousState.current);
  telemetryProfile = commitTrainingCoreStat(
    telemetryProfile,
    input.stat,
    previousState.current + delta,
    {
      source: 'training-performance-gate',
      scoringVersion: HIGHFLY_TRAINING_SCORING_VERSION,
      evidenceId: input.evidenceId,
    },
    { progress: remainder, confidence, readiness },
  );
  return {
    profile: telemetryProfile,
    status: 'stat_up',
    ...common,
    progressAfter: remainder,
    statDelta: delta,
    reason: 'Progress cost and comparable Performance Gate were both satisfied; decimal Training Growth consolidated.',
  };
}
