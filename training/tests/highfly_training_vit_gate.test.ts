import { describe, expect, it } from 'vitest';
import { deriveComparablePerformance } from '../src/highfly/training/pipeline';
import type { SessionTrainingResult } from '../src/highfly/training/engine';

function result(reps: number, intensity: number | null): SessionTrainingResult {
  return {
    evidence: [{
      setId: 's1',
      exerciseId: 'accessory',
      observedRole: 'hypertrophy',
      reps,
      loadKg: 40,
      volumeLoadKg: 400,
      estimated1RmKg: 53.3,
      relativeIntensity: intensity,
      executionQuality: 1,
      restCompliance: 1,
      recoveryModifier: 1,
      score: 1,
      confidence: 1,
    }],
    stimulus: { STR: 0, AGI: 0, VIT: 2, PER: 1, INT: 1 },
    fatigue: { local: 1, systemic: 1, trend: 1, deloadFlag: false },
    diagnosticTonnageKg: 400,
    behavioralPerformance: { PER: 100, INT: 100, completion: 1, rest: 1, prescription: 1 },
  };
}

describe('HIGHFLY VIT performance gate', () => {
  it('creates a VIT performance sample from valid 7+ rep endurance work', () => {
    expect(deriveComparablePerformance(result(10, 0.55)).VIT).toBe(100);
  });

  it('does not treat low-rep strength work as VIT calibration evidence', () => {
    expect(deriveComparablePerformance(result(5, 0.85)).VIT).toBeUndefined();
  });
});
