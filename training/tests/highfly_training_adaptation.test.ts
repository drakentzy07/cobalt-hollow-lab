import { describe, expect, it } from 'vitest';
import {
  consolidationDeltaForCurrent,
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
    classId: 'warrior',
  });
  return commitTrainingCoreStat(
    base, 'STR', current,
    {
      source: 'training-performance-gate',
      scoringVersion: HIGHFLY_TRAINING_SCORING_VERSION,
      evidenceId: 'initial-calibration',
    },
    { progress: 0, confidence: 0.9, readiness: 0.9 },
  );
}

describe('HIGHFLY Training Adaptation RUN138', () => {
  it('gets more expensive as Current rises without hard-capping Core', () => {
    expect(progressCostForCurrent(40)).toBeGreaterThan(progressCostForCurrent(20));
    expect(Number.isFinite(progressCostForCurrent(1000))).toBe(true);
    expect(consolidationDeltaForCurrent(20)).toBeLessThan(1);
    expect(consolidationDeltaForCurrent(70)).toBeLessThan(consolidationDeltaForCurrent(20));
  });

  it('accumulates Progress without fake Core before the gate is met', () => {
    const profile = calibrated(20);
    const result = evaluateAdaptation(profile, {
      stat: 'STR', productiveStimulus: 5,
      previousPerformanceIndex: 100, currentPerformanceIndex: 110,
      confidence: 0.9, readiness: 0.8, evidenceId: 'small',
    });
    expect(result.status).toBe('progress_only');
    expect(result.statDelta).toBe(0);
    expect(result.profile.training.core.STR.current).toBe(20);
  });

  it('repeated performance cannot create infinite stats', () => {
    let profile = calibrated(20);
    profile.training.core.STR.progress = progressCostForCurrent(20);
    const result = evaluateAdaptation(profile, {
      stat: 'STR', productiveStimulus: 0,
      previousPerformanceIndex: 100, currentPerformanceIndex: 100,
      confidence: 0.95, readiness: 0.8, evidenceId: 'same',
    });
    expect(result.status).toBe('maintenance');
    expect(result.statDelta).toBe(0);
  });

  it('consolidates a decimal increment when progress/confidence/performance all pass', () => {
    let profile = calibrated(20);
    profile.training.core.STR.progress = progressCostForCurrent(20) + 8;
    const result = evaluateAdaptation(profile, {
      stat: 'STR', productiveStimulus: 1000,
      previousPerformanceIndex: 100, currentPerformanceIndex: 103,
      confidence: 0.95, readiness: 0.86, evidenceId: 'pr',
    });
    expect(result.status).toBe('stat_up');
    expect(result.statDelta).toBeGreaterThan(0);
    expect(result.statDelta).toBeLessThan(1);
    expect(result.profile.training.core.STR.current).toBeCloseTo(20 + result.statDelta, 10);
  });

  it('advanced Current needs a smaller comparable percentage improvement', () => {
    expect(performanceGateRatioForCurrent(10)).toBeGreaterThan(performanceGateRatioForCurrent(70));
  });

  it('rejects consolidation before a performance anchor exists', () => {
    const profile = createHighflyHunterProfile({ profileId: 'uncal', classId: 'warrior' });
    expect(() => evaluateAdaptation(profile, {
      stat: 'STR', productiveStimulus: 100,
      previousPerformanceIndex: 100, currentPerformanceIndex: 120,
      confidence: 1, readiness: 1, evidenceId: 'bad',
    })).toThrow(/must be calibrated/);
  });
});
