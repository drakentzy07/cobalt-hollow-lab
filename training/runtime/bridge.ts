import type { HighflyCoreStatsState } from './core';

export const HIGHFLY_TRAINING_BRIDGE_VERSION = 'run2-awakening-growth-v1' as const;

export interface TrainingBridgeFeatureFlags {
  enabled: boolean;
  applyMovement: boolean;
  applyPerception: boolean;
  applyIntelligence: boolean;
}

export interface TrainingBridgeTuning {
  strPhysicalApCoef: number;
  strStaggerCoef: number;
  agiPowerCoef: number;
  agiMoveCoef: number;
  agiMoveCap: number;
  vitHpCoef: number;
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
  gains: { STR: number; AGI: number; VIT: number; PER: number; INT: number };
  modifiers: HighflyCombatBaseline;
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

/** Zero-origin gain applied to TRAINING GROWTH only. Awakening is already
 * represented by Claude's class chassis and therefore is never double-counted. */
export function trainingGain(trainingGrowth: number): number {
  const s = Math.max(0, safe(trainingGrowth));
  return Math.log1p(s / 25);
}

function growth(
  core: HighflyCoreStatsState,
  stat: keyof HighflyCoreStatsState,
): number {
  const state = core[stat];
  const explicit = safe(state.trainingGrowth);
  if (explicit >= 0) return explicit;
  return Math.max(0, safe(state.current) - safe(state.awakeningBase));
}

function unchangedAudit(baseline: HighflyCombatBaseline): TrainingBridgeAudit {
  return {
    version: HIGHFLY_TRAINING_BRIDGE_VERSION,
    enabled: false,
    gains: { STR: 0, AGI: 0, VIT: 0, PER: 0, INT: 0 },
    modifiers: { ...baseline },
  };
}

export function applyTrainingBridge(args: {
  baseline: HighflyCombatBaseline;
  core: HighflyCoreStatsState;
  flags: TrainingBridgeFeatureFlags;
  tuning?: TrainingBridgeTuning;
}): TrainingBridgeResult {
  const baseline = { ...args.baseline };
  if (!args.flags.enabled) return { combat: baseline, audit: unchangedAudit(baseline) };

  const tuning = args.tuning ?? HIGHFLY_TRAINING_BRIDGE_LAB_TUNING;
  const gSTR = trainingGain(growth(args.core, 'STR'));
  const gAGI = trainingGain(growth(args.core, 'AGI'));
  const gVIT = trainingGain(growth(args.core, 'VIT'));
  const gPER = trainingGain(growth(args.core, 'PER'));
  const gINT = trainingGain(growth(args.core, 'INT'));

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
