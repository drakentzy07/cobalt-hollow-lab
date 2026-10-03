import type { HighflyCoreStatsState } from './core';

export const HIGHFLY_TRAINING_BRIDGE_VERSION = 'run1-k-zero-origin-v1' as const;

export interface TrainingBridgeFeatureFlags {
  enabled: boolean;
  applyMovement: boolean;
  applyPerception: boolean;
  applyIntelligence: boolean;
}

export interface TrainingBridgeTuning {
  /** Exact v0.7 candidate coefficients from the approved Training reference. */
  strPhysicalApCoef: number;
  strStaggerCoef: number;
  agiPowerCoef: number;
  agiMoveCoef: number;
  agiMoveCap: number;
  vitHpCoef: number;

  /**
   * PER / INT were intentionally left as "curves over G()" in v0.7.
   * These are explicit LAB defaults, not locked production constants.
   */
  perPrecisionCoef: number;
  perWeakPointCoef: number;
  perCritBonusCoef: number;
  perCritBonusCap: number;
  intCostReductionCoef: number;
  intCostReductionCap: number;
  intRecoveryCoef: number;
  intRecoveryCap: number;
}

export const HIGHFLY_TRAINING_BRIDGE_LAB_TUNING: TrainingBridgeTuning = {
  strPhysicalApCoef: 0.34,
  strStaggerCoef: 0.42,
  agiPowerCoef: 0.28,
  agiMoveCoef: 0.10,
  agiMoveCap: 0.15,
  vitHpCoef: 0.25,

  // PROVISIONAL LAB defaults pending Combat Lab validation.
  perPrecisionCoef: 0.16,
  perWeakPointCoef: 0.18,
  perCritBonusCoef: 0.06,
  perCritBonusCap: 0.08,
  intCostReductionCoef: 0.12,
  intCostReductionCap: 0.15,
  intRecoveryCoef: 0.18,
  intRecoveryCap: 0.22,
};

export interface HighflyCombatBaseline {
  physicalAP: number;
  stagger: number;
  power: number;
  moveSpeed: number;
  maxHP: number;
  precision: number;
  weakPointMultiplier: number;
  critChance: number;
  resourceCostMultiplier: number;
  resourceRecovery: number;
}

export interface TrainingBridgeAudit {
  version: typeof HIGHFLY_TRAINING_BRIDGE_VERSION;
  enabled: boolean;
  gains: {
    STR: number;
    AGI: number;
    VIT: number;
    PER: number;
    INT: number;
  };
  modifiers: {
    physicalAP: number;
    stagger: number;
    power: number;
    moveSpeed: number;
    maxHP: number;
    precision: number;
    weakPointMultiplier: number;
    critChance: number;
    resourceCostMultiplier: number;
    resourceRecovery: number;
  };
}

export interface TrainingBridgeResult {
  combat: HighflyCombatBaseline;
  audit: TrainingBridgeAudit;
}

function safe(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

/**
 * HIGHFLY zero-origin bridge basis:
 * G(s)=ln(1 + max(0,s)/25)
 *
 * A Hunter with no real Training evidence stays at exactly zero bonus. The first
 * valid calibration (current=10 in RUN1-J) now activates a meaningful derived
 * boost instead of being a hidden neutral point. Core Stats still have no hard
 * cap; only sensitive derived outputs may be capped.
 */
export function trainingGain(stat: number): number {
  const s = Math.max(0, safe(stat));
  return Math.log1p(s / 25);
}

function current(core: HighflyCoreStatsState, stat: keyof HighflyCoreStatsState): number {
  return Math.max(0, safe(core[stat].current));
}

function unchangedAudit(baseline: HighflyCombatBaseline): TrainingBridgeAudit {
  return {
    version: HIGHFLY_TRAINING_BRIDGE_VERSION,
    enabled: false,
    gains: { STR: 0, AGI: 0, VIT: 0, PER: 0, INT: 0 },
    modifiers: { ...baseline },
  };
}

/**
 * Read-only bridge: it consumes Training Core + existing combat baseline and
 * returns derived combat values. It never writes Training Core, RPG stats,
 * equipment, level or persistence.
 */
export function applyTrainingBridge(args: {
  baseline: HighflyCombatBaseline;
  core: HighflyCoreStatsState;
  flags: TrainingBridgeFeatureFlags;
  tuning?: TrainingBridgeTuning;
}): TrainingBridgeResult {
  const baseline = { ...args.baseline };
  if (!args.flags.enabled) {
    return { combat: baseline, audit: unchangedAudit(baseline) };
  }

  const tuning = args.tuning ?? HIGHFLY_TRAINING_BRIDGE_LAB_TUNING;
  const gSTR = trainingGain(current(args.core, 'STR'));
  const gAGI = trainingGain(current(args.core, 'AGI'));
  const gVIT = trainingGain(current(args.core, 'VIT'));
  const gPER = trainingGain(current(args.core, 'PER'));
  const gINT = trainingGain(current(args.core, 'INT'));

  const physicalAP = safe(baseline.physicalAP) * (1 + tuning.strPhysicalApCoef * gSTR);
  const stagger = safe(baseline.stagger) * (1 + tuning.strStaggerCoef * gSTR);
  const power = safe(baseline.power) * (1 + tuning.agiPowerCoef * gAGI);

  const moveBonus = args.flags.applyMovement
    ? Math.min(tuning.agiMoveCap, tuning.agiMoveCoef * gAGI)
    : 0;
  const moveSpeed = safe(baseline.moveSpeed) * (1 + moveBonus);

  const maxHP = safe(baseline.maxHP) * (1 + tuning.vitHpCoef * gVIT);

  const precisionBonus = args.flags.applyPerception ? tuning.perPrecisionCoef * gPER : 0;
  const weakPointBonus = args.flags.applyPerception ? tuning.perWeakPointCoef * gPER : 0;
  const critBonus = args.flags.applyPerception
    ? Math.min(tuning.perCritBonusCap, tuning.perCritBonusCoef * gPER)
    : 0;

  const precision = safe(baseline.precision) * (1 + precisionBonus);
  const weakPointMultiplier = safe(baseline.weakPointMultiplier) * (1 + weakPointBonus);
  const critChance = clamp(safe(baseline.critChance) + critBonus, 0, 1);

  const costReduction = args.flags.applyIntelligence
    ? Math.min(tuning.intCostReductionCap, tuning.intCostReductionCoef * gINT)
    : 0;
  const recoveryBonus = args.flags.applyIntelligence
    ? Math.min(tuning.intRecoveryCap, tuning.intRecoveryCoef * gINT)
    : 0;

  const resourceCostMultiplier = Math.max(
    0.1,
    safe(baseline.resourceCostMultiplier) * (1 - costReduction),
  );
  const resourceRecovery = safe(baseline.resourceRecovery) * (1 + recoveryBonus);

  const combat: HighflyCombatBaseline = {
    physicalAP,
    stagger,
    power,
    moveSpeed,
    maxHP,
    precision,
    weakPointMultiplier,
    critChance,
    resourceCostMultiplier,
    resourceRecovery,
  };

  return {
    combat,
    audit: {
      version: HIGHFLY_TRAINING_BRIDGE_VERSION,
      enabled: true,
      gains: { STR: gSTR, AGI: gAGI, VIT: gVIT, PER: gPER, INT: gINT },
      modifiers: { ...combat },
    },
  };
}
