import {
  HIGHFLY_CORE_STATS,
  HIGHFLY_TRAINING_SCORING_VERSION,
  commitTrainingCoreStat,
  updateTrainingTelemetry,
  type HighflyCoreStat,
  type HighflyHunterProfile,
  type HighflyTrainingHistoryEntry,
} from './core';
import {
  evaluateTrainingSession,
  type ExerciseDefinition,
  type SessionRecord,
  type SessionTrainingResult,
} from './engine';
import { evaluateAdaptation, type AdaptationStatus } from './adaptation';

export const HIGHFLY_INITIAL_CALIBRATED_CORE_BASELINE = 10 as const;
export const HIGHFLY_TRAINING_HISTORY_LIMIT = 200 as const;

export interface TrainingSessionPipelineInput {
  profile: HighflyHunterProfile;
  session: SessionRecord;
  definitions: ReadonlyMap<string, ExerciseDefinition>;
  /** Optional explicit comparable tests from drills/sensors/future screens. */
  performanceSamples?: Partial<Record<HighflyCoreStat, number>>;
  recordedAt?: string;
}

export interface TrainingStatPipelineOutcome {
  stat: HighflyCoreStat;
  stimulus: number;
  performanceIndex: number | null;
  outcome: HighflyTrainingHistoryEntry['outcome'];
  statDelta: 0 | 1;
  reason: string;
}

export interface TrainingSessionPipelineResult {
  profile: HighflyHunterProfile;
  sessionResult: SessionTrainingResult;
  outcomes: TrainingStatPipelineOutcome[];
}

function validPositive(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function evidenceConfidence(result: SessionTrainingResult): number {
  if (result.evidence.length === 0) return 0;
  return Math.max(
    0,
    Math.min(
      1,
      result.evidence.reduce((sum, e) => sum + e.confidence, 0) / result.evidence.length,
    ),
  );
}

/**
 * RUN1-J automatic evidence:
 * - STR: comparable heavy e1RM anchors from the authored main rows.
 * - AGI: power-row e1RM proxy until velocity sensing exists.
 * - VIT: 7+ rep endurance quality under comparable moderate-intensity work.
 * - PER: ordered adherence/completion quality.
 * - INT: recovery + prescription management quality.
 */
export function deriveComparablePerformance(
  result: SessionTrainingResult,
): Partial<Record<HighflyCoreStat, number>> {
  const comparableStrengthIds = new Set([
    'back_squat',
    'bench_press',
    'overhead_press',
    'deadlift',
    'd1_back_squat_top',
    'd1_back_squat',
    'd2_bench_top',
    'd2_bench',
    'd3_deadlift_top',
    'd3_deadlift',
    'd4_military_top',
    'd4_military',
    'd5_front_squat_top',
    'd5_front_squat',
  ]);
  const strengthE1Rm = result.evidence
    .filter(
      (e) =>
        e.observedRole === 'strength' &&
        comparableStrengthIds.has(e.exerciseId) &&
        validPositive(e.estimated1RmKg),
    )
    .map((e) => e.estimated1RmKg as number);

  const powerE1Rm = result.evidence
    .filter((e) => e.observedRole === 'power' && validPositive(e.estimated1RmKg))
    .map((e) => e.estimated1RmKg as number);

  const enduranceEvidence = result.evidence.filter(
    (e) =>
      e.reps >= 7 &&
      (e.relativeIntensity === null ||
        (e.relativeIntensity >= 0.35 && e.relativeIntensity <= 0.7)),
  );
  const vitPerformance =
    enduranceEvidence.length > 0
      ? 100 *
        result.behavioralPerformance.completion *
        (enduranceEvidence.reduce(
          (sum, e) => sum + e.executionQuality * (0.6 + 0.4 * e.restCompliance),
          0,
        ) /
          enduranceEvidence.length)
      : 0;

  return {
    ...(strengthE1Rm.length > 0 ? { STR: Math.max(...strengthE1Rm) } : {}),
    ...(powerE1Rm.length > 0 ? { AGI: Math.max(...powerE1Rm) } : {}),
    ...(vitPerformance > 0 ? { VIT: vitPerformance } : {}),
    ...(result.behavioralPerformance.PER > 0
      ? { PER: result.behavioralPerformance.PER }
      : {}),
    ...(result.behavioralPerformance.INT > 0
      ? { INT: result.behavioralPerformance.INT }
      : {}),
  };
}

function appendHistory(
  profile: HighflyHunterProfile,
  entry: HighflyTrainingHistoryEntry,
): HighflyHunterProfile {
  const history = [...(profile.training.history ?? []), entry].slice(
    -HIGHFLY_TRAINING_HISTORY_LIMIT,
  );
  return {
    ...profile,
    training: {
      ...profile.training,
      history,
    },
  };
}

function setPerformanceAnchor(
  profile: HighflyHunterProfile,
  stat: HighflyCoreStat,
  args: {
    baseline?: number;
    latest: number;
    evidenceId: string;
    recordedAt: string;
  },
): HighflyHunterProfile {
  const previous = profile.training.performance?.[stat];
  const baseline = args.baseline ?? previous?.baseline ?? args.latest;
  return {
    ...profile,
    training: {
      ...profile.training,
      performance: {
        ...(profile.training.performance ?? {}),
        [stat]: {
          baseline,
          latest: args.latest,
          evidenceId: args.evidenceId,
          updatedAt: args.recordedAt,
        },
      },
    },
  };
}

function outcomeFromAdaptation(status: AdaptationStatus): HighflyTrainingHistoryEntry['outcome'] {
  return status;
}

export function runTrainingSessionPipeline(
  input: TrainingSessionPipelineInput,
): TrainingSessionPipelineResult {
  const sessionResult = evaluateTrainingSession(input.session, input.definitions);
  const autoSamples = deriveComparablePerformance(sessionResult);
  const samples = { ...autoSamples, ...(input.performanceSamples ?? {}) };
  const confidence = evidenceConfidence(sessionResult);
  const readiness = Math.max(0, Math.min(1, input.session.readiness));
  const recordedAt = input.recordedAt ?? new Date().toISOString();
  let profile = input.profile;
  const outcomes: TrainingStatPipelineOutcome[] = [];

  for (const stat of HIGHFLY_CORE_STATS) {
    const stimulus = Math.max(0, sessionResult.stimulus[stat]);
    const sample = samples[stat];
    if (stimulus <= 0 && !validPositive(sample)) continue;

    const evidenceId = `${input.session.sessionId}:${stat}`;
    const state = profile.training.core[stat];
    const anchor = profile.training.performance?.[stat];

    if (!state.calibrated) {
      if (!validPositive(sample)) {
        profile = updateTrainingTelemetry(profile, stat, {
          progress: state.progress + stimulus,
          confidence,
          readiness,
        });
        const outcome: TrainingStatPipelineOutcome = {
          stat,
          stimulus,
          performanceIndex: null,
          outcome: 'awaiting_performance',
          statDelta: 0,
          reason: 'Stimulus recorded, but initial calibration needs a valid comparable performance sample.',
        };
        profile = appendHistory(profile, {
          sessionId: input.session.sessionId,
          recordedAt,
          stat,
          stimulus,
          performanceIndex: null,
          outcome: outcome.outcome,
        });
        outcomes.push(outcome);
        continue;
      }

      profile = commitTrainingCoreStat(
        profile,
        stat,
        HIGHFLY_INITIAL_CALIBRATED_CORE_BASELINE,
        {
          source: 'training-performance-gate',
          scoringVersion: HIGHFLY_TRAINING_SCORING_VERSION,
          evidenceId,
        },
        {
          progress: state.progress + stimulus,
          confidence,
          readiness,
        },
      );
      profile = setPerformanceAnchor(profile, stat, {
        latest: sample,
        baseline: sample,
        evidenceId,
        recordedAt,
      });
      const outcome: TrainingStatPipelineOutcome = {
        stat,
        stimulus,
        performanceIndex: sample,
        outcome: 'calibrated',
        statDelta: 0,
        reason:
          'Initial real training established the Core baseline and activated the Training Bridge.',
      };
      profile = appendHistory(profile, {
        sessionId: input.session.sessionId,
        recordedAt,
        stat,
        stimulus,
        performanceIndex: sample,
        outcome: outcome.outcome,
      });
      outcomes.push(outcome);
      continue;
    }

    // A migrated/calibrated profile may not have the RUN1-H performance anchor yet.
    // The first valid sample seeds it without granting a Stat Up.
    if (!anchor && validPositive(sample)) {
      profile = updateTrainingTelemetry(profile, stat, {
        progress: state.progress + stimulus,
        confidence,
        readiness,
      });
      profile = setPerformanceAnchor(profile, stat, {
        latest: sample,
        baseline: sample,
        evidenceId,
        recordedAt,
      });
      const outcome: TrainingStatPipelineOutcome = {
        stat,
        stimulus,
        performanceIndex: sample,
        outcome: 'progress_only',
        statDelta: 0,
        reason: 'Comparable baseline seeded for an already-calibrated legacy profile.',
      };
      profile = appendHistory(profile, {
        sessionId: input.session.sessionId,
        recordedAt,
        stat,
        stimulus,
        performanceIndex: sample,
        outcome: outcome.outcome,
      });
      outcomes.push(outcome);
      continue;
    }

    const adaptation = evaluateAdaptation(profile, {
      stat,
      productiveStimulus: stimulus,
      previousPerformanceIndex: anchor?.baseline ?? null,
      currentPerformanceIndex: validPositive(sample) ? sample : null,
      confidence,
      readiness,
      evidenceId,
      ...(stat === 'VIT'
        ? { absolutePerformanceGate: 75 }
        : stat === 'PER'
          ? { absolutePerformanceGate: 90 }
          : stat === 'INT'
            ? { absolutePerformanceGate: 85 }
            : {}),
    });
    profile = adaptation.profile;

    if (validPositive(sample)) {
      profile = setPerformanceAnchor(profile, stat, {
        latest: sample,
        baseline: adaptation.status === 'stat_up' ? sample : anchor?.baseline,
        evidenceId,
        recordedAt,
      });
    }

    const outcome: TrainingStatPipelineOutcome = {
      stat,
      stimulus,
      performanceIndex: validPositive(sample) ? sample : null,
      outcome: outcomeFromAdaptation(adaptation.status),
      statDelta: adaptation.statDelta,
      reason: adaptation.reason,
    };
    profile = appendHistory(profile, {
      sessionId: input.session.sessionId,
      recordedAt,
      stat,
      stimulus,
      performanceIndex: outcome.performanceIndex,
      outcome: outcome.outcome,
    });
    outcomes.push(outcome);
  }

  return { profile, sessionResult, outcomes };
}
