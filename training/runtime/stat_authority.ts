import {
  HIGHFLY_CORE_STATS,
  type HighflyAwakeningClassId,
  type HighflyCoreVector,
  type HighflyHunterProfile,
  isAwakeningClassId,
} from './core';

export const HIGHFLY_CORE_STAT_AUTHORITY_V1 = 'pf5-training-only-derived-v1' as const;

/**
 * Class identity changes how efficiently Training Core converts into DERIVED
 * combat power. It never grants STR/AGI/VIT/PER/INT itself.
 *
 * Every entry is > 0 so off-meta builds remain viable. The spread is deliberately
 * modest: class identity matters without turning a low-affinity stat into a dead stat.
 */
export const HIGHFLY_STAT_BIBLE_V1: Readonly<
  Record<HighflyAwakeningClassId, Readonly<HighflyCoreVector>>
> = {
  warrior: { STR: 1.25, AGI: 0.95, VIT: 1.20, PER: 0.80, INT: 0.75 },
  mage:    { STR: 0.75, AGI: 0.85, VIT: 0.90, PER: 1.15, INT: 1.25 },
  rogue:   { STR: 1.00, AGI: 1.25, VIT: 0.95, PER: 1.10, INT: 0.80 },
  paladin: { STR: 1.15, AGI: 0.90, VIT: 1.20, PER: 0.95, INT: 1.05 },
  hunter:  { STR: 0.90, AGI: 1.25, VIT: 1.00, PER: 1.15, INT: 0.85 },
  priest:  { STR: 0.75, AGI: 0.80, VIT: 0.95, PER: 1.25, INT: 1.20 },
  shaman:  { STR: 1.00, AGI: 0.95, VIT: 1.10, PER: 1.10, INT: 1.10 },
  warlock: { STR: 0.75, AGI: 0.80, VIT: 1.00, PER: 1.15, INT: 1.25 },
  druid:   { STR: 0.95, AGI: 1.00, VIT: 1.10, PER: 1.15, INT: 1.15 },
} as const;

export interface HighflyTrainingDerivedModifiers {
  physicalAttackBonus: number;
  rangedAttackBonus: number;
  spellPowerBonus: number;
  healingPowerBonus: number;
  maxHpBonus: number;
  critChanceBonus: number;
  dodgeChanceBonus: number;
  moveSpeedBonus: number;
  hitBonus: number;
  weakPointBonus: number;
  resourceCostReduction: number;
  resourceRecoveryBonus: number;
}

const ZERO_DERIVED: HighflyTrainingDerivedModifiers = {
  physicalAttackBonus: 0,
  rangedAttackBonus: 0,
  spellPowerBonus: 0,
  healingPowerBonus: 0,
  maxHpBonus: 0,
  critChanceBonus: 0,
  dodgeChanceBonus: 0,
  moveSpeedBonus: 0,
  hitBonus: 0,
  weakPointBonus: 0,
  resourceCostReduction: 0,
  resourceRecoveryBonus: 0,
};

function finiteNonNegative(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

function trainingGain(value: number): number {
  // Unbounded but strongly diminishing. Power-like derived stats can continue
  // growing with long-term Training; percentage-sensitive stats are capped below.
  return Math.log1p(finiteNonNegative(value) / 25);
}

export function trainingCoreVector(profile: HighflyHunterProfile): HighflyCoreVector {
  const wallet = profile.training.points;
  return Object.fromEntries(
    HIGHFLY_CORE_STATS.map((stat) => [
      stat,
      finiteNonNegative(wallet?.allocated?.[stat] ?? profile.training.core[stat].trainingAllocated),
    ]),
  ) as HighflyCoreVector;
}

function authorityClass(profile: HighflyHunterProfile): HighflyAwakeningClassId | null {
  if (isAwakeningClassId(profile.hunter.classId)) return profile.hunter.classId;
  if (isAwakeningClassId(profile.awakening.classId)) return profile.awakening.classId;
  return null;
}

/**
 * The ONE Training -> game conversion contract.
 *
 * ClaudeCraft remains authoritative for its normal class/level/gear/talent/buff
 * baseline. These modifiers are applied afterwards to derived outputs only.
 * Therefore equipment/class/level can never write HIGHFLY Core, and Training
 * can never be accidentally counted once as a primary and again as a bridge.
 */
export function highflyTrainingDerivedModifiers(
  profile: HighflyHunterProfile,
): HighflyTrainingDerivedModifiers {
  const classId = authorityClass(profile);
  if (!classId) return { ...ZERO_DERIVED };

  const core = trainingCoreVector(profile);
  const affinity = HIGHFLY_STAT_BIBLE_V1[classId];

  const str = trainingGain(core.STR) * affinity.STR;
  const agi = trainingGain(core.AGI) * affinity.AGI;
  const vit = trainingGain(core.VIT) * affinity.VIT;
  const per = trainingGain(core.PER) * affinity.PER;
  const int = trainingGain(core.INT) * affinity.INT;

  return {
    // Power channels may keep scaling slowly for long-lived Hunters.
    physicalAttackBonus: 0.30 * str + 0.10 * agi,
    rangedAttackBonus: 0.10 * str + 0.30 * agi + 0.05 * per,
    spellPowerBonus: 0.08 * per + 0.34 * int,
    healingPowerBonus: 0.12 * per + 0.30 * int,
    maxHpBonus: 0.06 * str + 0.28 * vit,

    // Percentage-sensitive channels have explicit ceilings.
    critChanceBonus: Math.min(0.06, 0.025 * agi + 0.015 * per),
    dodgeChanceBonus: Math.min(0.06, 0.03 * agi),
    moveSpeedBonus: Math.min(0.08, 0.045 * agi),
    hitBonus: Math.min(0.06, 0.04 * per),
    weakPointBonus: Math.min(0.18, 0.12 * per),
    resourceCostReduction: Math.min(0.12, 0.08 * int),
    resourceRecoveryBonus: Math.min(0.18, 0.12 * int),
  };
}

export function assertHighflyStatBibleV1(): void {
  for (const [classId, affinities] of Object.entries(HIGHFLY_STAT_BIBLE_V1)) {
    for (const stat of HIGHFLY_CORE_STATS) {
      const value = affinities[stat];
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error(`HIGHFLY Stat Bible dead stat: ${classId}.${stat}`);
      }
      if (value < 0.7 || value > 1.3) {
        throw new Error(`HIGHFLY Stat Bible affinity out of v1 envelope: ${classId}.${stat}=${value}`);
      }
    }
  }
}
assertHighflyStatBibleV1();
