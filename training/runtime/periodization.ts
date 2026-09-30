import type { HighflyCoreStat } from './core';
import type { SessionTrainingResult, StimulusVector } from './engine';
import { HF_REFERENCE_5D_SUPREME_V1_ID } from './reference_routine';

export const HIGHFLY_PERIODIZATION_VERSION = 'run1-d-lab-v1' as const;

export type RoutineDays = 2 | 3 | 4 | 5;
export type MesocycleWeek = 1 | 2 | 3 | 4;
export type WeekKind = 'load' | 'deload';

export interface ReferenceEnvelope {
  referenceEnvelopeId: string;
  weeklyStimulusCap: StimulusVector;
}

export interface WeeklySessionContribution {
  sessionId: string;
  result: SessionTrainingResult;
}

export interface WeeklyTrainingSummary {
  routineDays: RoutineDays;
  week: MesocycleWeek;
  weekKind: WeekKind;
  envelopeFactor: number;
  uniqueSessions: number;
  rawStimulus: StimulusVector;
  productiveStimulus: StimulusVector;
  cappedByEnvelope: Record<HighflyCoreStat, boolean>;
  referenceEnvelopeId: string;
}

/**
 * Upper bound from the approved design ranges.
 *
 * 2D: 45-65% -> cap 0.65
 * 3D: 60-78% -> cap 0.78
 * 4D: 75-92% -> cap 0.92
 * 5D: official reference -> 1.00
 *
 * This is a CEILING, not a multiplier that grants free stimulus.
 */
export const ROUTINE_ENVELOPE_MAX: Record<RoutineDays, number> = {
  2: 0.65,
  3: 0.78,
  4: 0.92,
  5: 1,
};

export function weekKind(week: MesocycleWeek): WeekKind {
  return week === 4 ? 'deload' : 'load';
}

/**
 * Deload preserves the 3:1 architecture. It cannot be used to create a fourth
 * full loading week by simply logging more work.
 */
export function weekEnvelopeMultiplier(week: MesocycleWeek): number {
  return week === 4 ? 0.6 : 1;
}

function zero(): StimulusVector {
  return { STR: 0, AGI: 0, VIT: 0, PER: 0, INT: 0 };
}

function add(target: StimulusVector, source: StimulusVector): void {
  target.STR += source.STR;
  target.AGI += source.AGI;
  target.VIT += source.VIT;
  target.PER += source.PER;
  target.INT += source.INT;
}

function clampNonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

/**
 * Aggregates a week with duplicate-session protection and a routine envelope.
 *
 * The caller supplies the official 5D weekly reference cap. That keeps the
 * engine relative to an audited reference instead of baking arbitrary absolute
 * physiology numbers into code.
 */
export function summarizeTrainingWeek(args: {
  routineDays: RoutineDays;
  week: MesocycleWeek;
  sessions: readonly WeeklySessionContribution[];
  referenceEnvelope: ReferenceEnvelope;
}): WeeklyTrainingSummary {
  const raw = zero();
  const seen = new Set<string>();

  for (const entry of args.sessions) {
    if (seen.has(entry.sessionId)) continue;
    seen.add(entry.sessionId);
    add(raw, entry.result.stimulus);
  }

  const routineFactor = ROUTINE_ENVELOPE_MAX[args.routineDays];
  const factor = routineFactor * weekEnvelopeMultiplier(args.week);

  const productive = zero();
  const cappedByEnvelope: Record<HighflyCoreStat, boolean> = {
    STR: false,
    AGI: false,
    VIT: false,
    PER: false,
    INT: false,
  };

  for (const stat of ['STR', 'AGI', 'VIT', 'PER', 'INT'] as const) {
    const referenceCap = clampNonNegative(args.referenceEnvelope.weeklyStimulusCap[stat]);
    const cap = referenceCap * factor;
    const value = clampNonNegative(raw[stat]);
    productive[stat] = Math.min(value, cap);
    cappedByEnvelope[stat] = value > cap;
  }

  return {
    routineDays: args.routineDays,
    week: args.week,
    weekKind: weekKind(args.week),
    envelopeFactor: factor,
    uniqueSessions: seen.size,
    rawStimulus: raw,
    productiveStimulus: productive,
    cappedByEnvelope,
    referenceEnvelopeId: args.referenceEnvelope.referenceEnvelopeId,
  };
}

export function createOfficialReferenceEnvelope(
  weeklyStimulusCap: StimulusVector,
): ReferenceEnvelope {
  return {
    referenceEnvelopeId: HF_REFERENCE_5D_SUPREME_V1_ID,
    weeklyStimulusCap: {
      STR: clampNonNegative(weeklyStimulusCap.STR),
      AGI: clampNonNegative(weeklyStimulusCap.AGI),
      VIT: clampNonNegative(weeklyStimulusCap.VIT),
      PER: clampNonNegative(weeklyStimulusCap.PER),
      INT: clampNonNegative(weeklyStimulusCap.INT),
    },
  };
}

/**
 * Returns true when the canonical 4-week mesocycle remains exactly 3 load + 1
 * deload. Kept explicit so future schedule generation can assert this contract.
 */
export function isCanonicalThreeToOneMesocycle(
  weeks: readonly MesocycleWeek[],
): boolean {
  if (weeks.length !== 4) return false;
  return (
    weeks[0] === 1 &&
    weeks[1] === 2 &&
    weeks[2] === 3 &&
    weeks[3] === 4 &&
    weeks.slice(0, 3).every((week) => weekKind(week) === 'load') &&
    weekKind(weeks[3]) === 'deload'
  );
}
