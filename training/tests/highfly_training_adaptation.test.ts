import { describe, expect, it } from 'vitest';
import {
  evaluateAdaptation,
  performanceGateRatioForCurrent,
  progressCostForCurrent,
} from '../src/highfly/training/adaptation';
import {
  HIGHFLY_TRAINING_SCORING_VERSION,
  commitTrainingCoreStat,
  createHighflyHunterProfile,
} from '../src/highfly/training/core';

function calibrated(current = 20) {
  const base = createHighflyHunterProfile({
    profileId: 'adaptation-test',
    createdAt: '2026-09-29T00:00:00.000Z',
  });
  return commitTrainingCoreStat(
    base,
    'STR',
    current,
    {
      source: 'training-performance-gate',
      scoringVersion: HIGHFLY_TRAINING_SCORING_VERSION,
      evidenceId: 'initial-calibration',
    },
    { progress: 0, confidence: 0.9, readiness: 0.9 },
  );
}

describe('HIGHFLY Training Adaptation RUN1-C', () => {
  it('makes higher Current values progressively more expensive without hard-capping stats', () => {
    expect(progressCostForCurrent(40)).toBeGreaterThan(progressCostForCurrent(20));
    expect(progressCostForCurrent(100)).toBeGreaterThan(progressCostForCurrent(60));
    expect(Number.isFinite(progressCostForCurrent(1000))).toBe(true);
  });

  it('accumulates Progress without granting a Stat Up before cost is met', () => {
    const profile = calibrated(20);
    const result = evaluateAdaptation(profile, {
      stat: 'STR',
      productiveStimulus: 5,
      previousPerformanceIndex: 100,
      currentPerformanceIndex: 110,
      confidence: 0.9,
      readiness: 0.8,
      evidenceId: 'block-small',
    });
    expect(result.status).toBe('progress_only');
    expect(result.statDelta).toBe(0);
    expect(result.profile.training.core.STR.current).toBe(20);
    expect(result.profile.training.core.STR.progress).toBeGreaterThan(0);
  });

  it('does not convert repeated identical performance into infinite stats', () => {
    let profile = calibrated(20);
    const cost = progressCostForCurrent(20);
    profile.training.core.STR.progress = cost;

    const result = evaluateAdaptation(profile, {
      stat: 'STR',
      productiveStimulus: 0,
      previousPerformanceIndex: 100,
      currentPerformanceIndex: 100,
      confidence: 0.95,
      readiness: 0.8,
      evidenceId: 'same-performance',
    });

    expect(result.status).toBe('maintenance');
    expect(result.statDelta).toBe(0);
    expect(result.profile.training.core.STR.current).toBe(20);
    expect(result.profile.training.core.STR.progress).toBe(cost);
  });

  it('requires sufficient Confidence even when Progress and performance are strong', () => {
    let profile = calibrated(20);
    profile.training.core.STR.progress = progressCostForCurrent(20);

    const result = evaluateAdaptation(profile, {
      stat: 'STR',
      productiveStimulus: 0,
      previousPerformanceIndex: 100,
      currentPerformanceIndex: 110,
      confidence: 0.4,
      readiness: 0.75,
      evidenceId: 'low-confidence',
    });

    expect(result.status).toBe('awaiting_confidence');
    expect(result.profile.training.core.STR.current).toBe(20);
  });

  it('requires comparable performance evidence before consolidation', () => {
    let profile = calibrated(20);
    profile.training.core.STR.progress = progressCostForCurrent(20);

    const result = evaluateAdaptation(profile, {
      stat: 'STR',
      productiveStimulus: 0,
      previousPerformanceIndex: null,
      currentPerformanceIndex: null,
      confidence: 0.95,
      readiness: 0.9,
      evidenceId: 'missing-comparable',
    });

    expect(result.status).toBe('awaiting_performance');
    expect(result.profile.training.core.STR.current).toBe(20);
  });

  it('consolidates at most +1 when Progress, Confidence and Performance Gate all pass', () => {
    let profile = calibrated(20);
    const cost = progressCostForCurrent(20);
    profile.training.core.STR.progress = cost + 8;

    const result = evaluateAdaptation(profile, {
      stat: 'STR',
      productiveStimulus: 1000,
      previousPerformanceIndex: 100,
      currentPerformanceIndex: 103,
      confidence: 0.95,
      readiness: 0.86,
      evidenceId: 'block-pr',
    });

    expect(result.status).toBe('stat_up');
    expect(result.statDelta).toBe(1);
    expect(result.profile.training.core.STR.current).toBe(21);
    expect(result.profile.training.core.STR.peak).toBe(21);
    expect(result.profile.training.core.STR.progress).toBeGreaterThan(0);
  });

  it('uses a smaller comparable improvement threshold for advanced Current bands', () => {
    expect(performanceGateRatioForCurrent(10)).toBeGreaterThan(
      performanceGateRatioForCurrent(70),
    );
  });

  it('keeps readiness separate from Current', () => {
    let profile = calibrated(20);
    const result = evaluateAdaptation(profile, {
      stat: 'STR',
      productiveStimulus: 1,
      previousPerformanceIndex: 100,
      currentPerformanceIndex: 100,
      confidence: 0.9,
      readiness: 0.25,
      evidenceId: 'fatigued-block',
    });

    expect(result.profile.training.core.STR.current).toBe(20);
    expect(result.profile.training.core.STR.readiness).toBe(0.25);
  });

  it('rejects Stat Up consolidation on an uncalibrated stat', () => {
    const profile = createHighflyHunterProfile({
      profileId: 'uncalibrated',
      createdAt: '2026-09-29T00:00:00.000Z',
    });

    expect(() =>
      evaluateAdaptation(profile, {
        stat: 'STR',
        productiveStimulus: 100,
        previousPerformanceIndex: 100,
        currentPerformanceIndex: 120,
        confidence: 1,
        readiness: 1,
        evidenceId: 'bad',
      }),
    ).toThrow(/must be calibrated/);
  });
});
