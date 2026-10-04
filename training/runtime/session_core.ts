import {
  HIGHFLY_CORE_STATS,
  HIGHFLY_TRAINING_SCHEMA_VERSION,
  HIGHFLY_TRAINING_SCORING_VERSION,
  migrateAwakeningStats,
  type HighflyCoreStat,
  type HighflyCoreStatsState,
  type HighflyHunterProfile,
  type HighflyRmLiftId,
} from './core';
import type { SessionTrainingResult, StimulusVector } from './engine';

const STRENGTH_LIFTS: readonly HighflyRmLiftId[] = [
  'back_squat',
  'front_squat',
  'bench_press',
  'barbell_row',
  'overhead_press',
  'deadlift',
] as const;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function effectiveRelativeRm(
  profile: HighflyHunterProfile,
  lift: HighflyRmLiftId,
): number | null {
  const athlete = profile.training.loadCalibration?.athlete;
  const entry = profile.training.loadCalibration?.lifts?.[lift];
  if (!athlete || !entry || athlete.bodyweightKg <= 0 || entry.oneRmKg <= 0) return null;
  return entry.oneRmKg / athlete.bodyweightKg;
}

function mean(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function sessionCapacityFactor(
  profile: HighflyHunterProfile,
  stat: HighflyCoreStat,
): number {
  if (stat === 'PER' || stat === 'INT') return 1;
  const strength = mean(
    STRENGTH_LIFTS
      .map((lift) => effectiveRelativeRm(profile, lift))
      .filter((value): value is number => value !== null),
  );
  const power = effectiveRelativeRm(profile, 'hang_power_clean');
  if (stat === 'STR') {
    if (strength === null) return 1;
    return clamp(0.4 + 0.8 * Math.sqrt(strength), 0.8, 1.75);
  }
  if (stat === 'AGI') {
    if (power === null) return 1;
    return clamp(0.5 + 0.9 * Math.sqrt(power), 0.8, 1.65);
  }
  if (stat === 'VIT') {
    if (strength === null) return 1;
    return clamp(0.75 + 0.3 * Math.sqrt(strength), 0.9, 1.3);
  }
  return 1;
}

export function applySessionCapacityAuthority(
  profile: HighflyHunterProfile,
  result: SessionTrainingResult,
): SessionTrainingResult {
  const stimulus = Object.fromEntries(
    HIGHFLY_CORE_STATS.map((stat) => [
      stat,
      round2(result.stimulus[stat] * sessionCapacityFactor(profile, stat)),
    ]),
  ) as StimulusVector;
  return { ...result, stimulus };
}

export function adaptationStimulusForCurrent(
  current: number,
  earnedSessionScore: number,
): number {
  const factor = clamp(1 / (1 + Math.max(0, current) / 20), 0.35, 1);
  return round2(Math.max(0, earnedSessionScore) * factor);
}

/**
 * The first valid real session preserves the Awakening and earns a small,
 * visible decimal increment. The divisor is a versioned game tuning constant,
 * not a physiological claim.
 */
export function initialTrainingGrowthDelta(
  current: number,
  earnedSessionScore: number,
): number {
  const productive = adaptationStimulusForCurrent(current, earnedSessionScore);
  return clamp(productive / 6, 0, 0.75);
}

function legacyCalibratedHistory(
  profile: HighflyHunterProfile,
  stat: HighflyCoreStat,
) {
  return (profile.training.history ?? []).find(
    (entry) => entry.stat === stat && entry.outcome === 'calibrated',
  );
}

function legacyStatUps(profile: HighflyHunterProfile, stat: HighflyCoreStat): number {
  return (profile.training.history ?? []).filter(
    (entry) => entry.stat === stat && entry.outcome === 'stat_up',
  ).length;
}

/**
 * Migration order matters:
 * 1) RUN1-A fixed-10 profiles are first reconstructed from their own evidence.
 * 2) Every schema-1 earned Current becomes Training Growth.
 * 3) The class Awakening base is added ONCE by migrateAwakeningStats().
 */
export function migrateLegacyFixedCoreBaseline(
  profile: HighflyHunterProfile,
): HighflyHunterProfile {
  const legacy = profile as HighflyHunterProfile & {
    schemaVersion: number;
    scoringVersion: string;
  };
  if (
    legacy.schemaVersion === HIGHFLY_TRAINING_SCHEMA_VERSION &&
    legacy.scoringVersion === HIGHFLY_TRAINING_SCORING_VERSION &&
    legacy.awakening?.version === 1
  ) {
    return profile;
  }

  let working = profile;
  if (legacy.scoringVersion === 'run1-a') {
    const nextCore = { ...legacy.training.core } as HighflyCoreStatsState;
    for (const stat of HIGHFLY_CORE_STATS) {
      const state = legacy.training.core[stat] as any;
      const first = legacyCalibratedHistory(legacy, stat);
      if (!state?.calibrated || !first || !(first.stimulus > 0)) continue;
      const reconstructed =
        round2(first.stimulus * sessionCapacityFactor(legacy, stat)) +
        legacyStatUps(legacy, stat);
      nextCore[stat] = {
        ...state,
        current: reconstructed,
        peak: Math.max(reconstructed, 0),
        progress: Math.max(0, state.progress ?? 0),
        calibrated: true,
      } as any;
    }
    working = {
      ...legacy,
      training: { ...legacy.training, core: nextCore },
    } as HighflyHunterProfile;
  }

  working = {
    ...working,
    scoringVersion: HIGHFLY_TRAINING_SCORING_VERSION,
  };
  return migrateAwakeningStats(working);
}
