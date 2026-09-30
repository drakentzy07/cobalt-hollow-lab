import { describe, expect, it } from 'vitest';
import {
  ROUTINE_ENVELOPE_MAX,
  createOfficialReferenceEnvelope,
  isCanonicalThreeToOneMesocycle,
  summarizeTrainingWeek,
  weekEnvelopeMultiplier,
} from '../src/highfly/training/periodization';
import type { SessionTrainingResult } from '../src/highfly/training/engine';

function result(str: number, agi: number, vit: number): SessionTrainingResult {
  return {
    evidence: [],
    stimulus: { STR: str, AGI: agi, VIT: vit, PER: 0, INT: 0 },
    fatigue: { local: 0, systemic: 0, trend: 0, deloadFlag: false },
    diagnosticTonnageKg: 0,
  };
}

const reference = createOfficialReferenceEnvelope({
  STR: 100,
  AGI: 100,
  VIT: 100,
  PER: 100,
  INT: 100,
});

describe('HIGHFLY Training Periodization RUN1-D', () => {
  it('locks the canonical mesocycle to 3 load weeks + 1 deload', () => {
    expect(isCanonicalThreeToOneMesocycle([1, 2, 3, 4])).toBe(true);
    expect(weekEnvelopeMultiplier(1)).toBe(1);
    expect(weekEnvelopeMultiplier(2)).toBe(1);
    expect(weekEnvelopeMultiplier(3)).toBe(1);
    expect(weekEnvelopeMultiplier(4)).toBeLessThan(1);
  });

  it('caps 2D/3D/4D below the official 5D envelope', () => {
    expect(ROUTINE_ENVELOPE_MAX[2]).toBe(0.65);
    expect(ROUTINE_ENVELOPE_MAX[3]).toBe(0.78);
    expect(ROUTINE_ENVELOPE_MAX[4]).toBe(0.92);
    expect(ROUTINE_ENVELOPE_MAX[5]).toBe(1);
  });

  it('prevents 20 sessions from exceeding the weekly envelope', () => {
    const sessions = Array.from({ length: 20 }, (_, i) => ({
      sessionId: 's-' + i,
      result: result(20, 20, 20),
    }));
    const week = summarizeTrainingWeek({
      routineDays: 5,
      week: 1,
      sessions,
      referenceEnvelope: reference,
    });

    expect(week.productiveStimulus.STR).toBe(100);
    expect(week.productiveStimulus.AGI).toBe(100);
    expect(week.productiveStimulus.VIT).toBe(100);
    expect(week.cappedByEnvelope.STR).toBe(true);
  });

  it('prevents duplicate logging of the same session from duplicating stimulus', () => {
    const r = result(25, 10, 30);
    const week = summarizeTrainingWeek({
      routineDays: 5,
      week: 1,
      sessions: [
        { sessionId: 'same', result: r },
        { sessionId: 'same', result: r },
      ],
      referenceEnvelope: reference,
    });

    expect(week.uniqueSessions).toBe(1);
    expect(week.rawStimulus.STR).toBe(25);
    expect(week.rawStimulus.VIT).toBe(30);
  });

  it('lets a strong 3D week progress substantially but never above 5D potential', () => {
    const sessions = [
      { sessionId: 'a', result: result(100, 100, 100) },
      { sessionId: 'b', result: result(100, 100, 100) },
      { sessionId: 'c', result: result(100, 100, 100) },
    ];
    const three = summarizeTrainingWeek({
      routineDays: 3,
      week: 1,
      sessions,
      referenceEnvelope: reference,
    });
    const five = summarizeTrainingWeek({
      routineDays: 5,
      week: 1,
      sessions,
      referenceEnvelope: reference,
    });

    expect(three.productiveStimulus.STR).toBe(78);
    expect(five.productiveStimulus.STR).toBe(100);
    expect(three.productiveStimulus.STR).toBeLessThan(five.productiveStimulus.STR);
  });

  it('reduces the productive envelope during deload instead of rewarding extra work', () => {
    const sessions = [{ sessionId: 'heavy-deload', result: result(100, 100, 100) }];
    const normal = summarizeTrainingWeek({
      routineDays: 5,
      week: 3,
      sessions,
      referenceEnvelope: reference,
    });
    const deload = summarizeTrainingWeek({
      routineDays: 5,
      week: 4,
      sessions,
      referenceEnvelope: reference,
    });

    expect(deload.productiveStimulus.STR).toBeLessThan(normal.productiveStimulus.STR);
    expect(deload.weekKind).toBe('deload');
  });

  it('uses the official reference ID for the current 5D envelope', () => {
    expect(reference.referenceEnvelopeId).toBe('HF_REFERENCE_5D_SUPREME_V1');
  });
});
