import {
  HIGHFLY_CORE_STATS,
  HIGHFLY_TRAINING_SCORING_VERSION,
  type HighflyCoreStat,
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

/**
 * RM does not grant Core by itself. It only gives physical authority to work
 * that was actually completed. Sex/age remain plausibility context only;
 * bodyweight is used solely to normalize relative physical capacity.
 */
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

/**
 * The session card and first Core baseline are the same earned values.
 * No fixed 10 exists in RUN1-B.
 */
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

/**
 * Productive work still needs time to consolidate. Higher Core values reduce
 * how much of a session becomes pending adaptation, so experienced Hunters do
 * not improve at the same rate as beginners.
 */
export function adaptationStimulusForCurrent(
  current: number,
  earnedSessionScore: number,
): number {
  const factor = clamp(1 / (1 + Math.max(0, current) / 20), 0.35, 1);
  return round2(Math.max(0, earnedSessionScore) * factor);
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
 * RUN1-A used a fixed 10 for first calibration. Reconstruct those saves from
 * their own recorded first-session stimulus, preserving RM, history, cycle,
 * pending progress and real Stat Ups.
 */
export function migrateLegacyFixedCoreBaseline(
  profile: HighflyHunterProfile,
): HighflyHunterProfile {
  if (profile.scoringVersion === HIGHFLY_TRAINING_SCORING_VERSION) return profile;

  const nextCore = { ...profile.training.core };
  let changed = false;

  for (const stat of HIGHFLY_CORE_STATS) {
    const state = profile.training.core[stat];
    const first = legacyCalibratedHistory(profile, stat);
    if (!state.calibrated || !first || !(first.stimulus > 0)) continue;

    const reconstructed =
      round2(first.stimulus * sessionCapacityFactor(profile, stat)) +
      legacyStatUps(profile, stat);

    nextCore[stat] = {
      ...state,
      current: round2(reconstructed),
      peak: round2(Math.max(reconstructed, 0)),
      // Keep pending adaptation already earned after the first session.
      progress: Math.max(0, state.progress),
      calibrated: true,
    };
    changed = true;
  }

  return {
    ...profile,
    scoringVersion: HIGHFLY_TRAINING_SCORING_VERSION,
    training: changed
      ? {
          ...profile.training,
          core: nextCore,
        }
      : profile.training,
  };
}
