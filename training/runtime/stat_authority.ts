import {
  HIGHFLY_CORE_STATS,
  HIGHFLY_NORMAL_MAX_LEVEL,
  type HighflyAwakeningClassId,
  type HighflyCoreVector,
  type HighflyHunterProfile,
  isAwakeningClassId,
  naturalLevelGrowthFor,
} from './core';
import { getActiveHighflyHunterProfile } from './profile_store';

export const HIGHFLY_CORE_STAT_AUTHORITY_V1 = 'pf5-stat-bible-v1' as const;

/**
 * PF-5 Stat Bible v1.
 *
 * Every class can benefit from every Core stat. Affinity changes efficiency,
 * never eligibility. Primary combat math remains ClaudeCraft's single
 * recalcPlayerStats pass; this table only weights HIGHFLY-only side mechanics
 * that Claude does not natively derive from STR/AGI/VIT/PER/INT.
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

export interface HighflyUniqueCoreModifiers {
  /** STR-only HIGHFLY seam reserved for stagger/poise systems. Not AP. */
  staggerBonus: number;
  /** AGI-only HIGHFLY mobility seam. Not crit/dodge/armor, which recalc owns. */
  moveSpeedBonus: number;
  /** VIT-only HIGHFLY seam reserved for future control resistance. Not HP. */
  tenacityBonus: number;
  /** PER accuracy bonus layered on top of gear Hit Rating. */
  hitBonus: number;
  /** PER weak-point bonus, mapped to crit-damage channels until weak-point is native. */
  weakPointBonus: number;
  /** INT resource-cost reduction; useful to mana/rage/energy/focus users. */
  resourceCostReduction: number;
  /** INT natural-resource recovery multiplier bonus. */
  resourceRecoveryBonus: number;
}

let bootstrapArmed = false;
let boundEntityId: number | null = null;

function finiteNonNegative(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

function saturating(value: number, pivot: number): number {
  const v = Math.max(0, finiteNonNegative(value));
  return v <= 0 ? 0 : v / (v + pivot);
}

export function armHighflyLocalStatAuthority(): void {
  bootstrapArmed = true;
  boundEntityId = null;
}

export function bindHighflyLocalStatAuthority(entityId: number): void {
  if (!Number.isFinite(entityId)) return;
  boundEntityId = entityId;
  bootstrapArmed = false;
}

export function clearHighflyLocalStatAuthority(): void {
  bootstrapArmed = false;
  boundEntityId = null;
}

export function highflyCoreVectorAtLevel(
  profile: HighflyHunterProfile,
  classId: HighflyAwakeningClassId,
  level: number,
): HighflyCoreVector {
  const natural = naturalLevelGrowthFor(classId, level);
  return Object.fromEntries(
    HIGHFLY_CORE_STATS.map((stat) => [
      stat,
      finiteNonNegative(profile.awakening.base[stat]) +
        finiteNonNegative(natural[stat]) +
        finiteNonNegative(profile.training.core[stat].trainingAllocated),
    ]),
  ) as HighflyCoreVector;
}

/**
 * Resolve the primary Core seed for the ONE local Hunter.
 *
 * Bootstrap is armed immediately before the offline Sim is created, so the
 * first matching player stat pass claims the entity id. Every later recalc
 * requires that exact id. Character-sheet probes/previews and other players
 * therefore cannot inherit the active Hunter's Core.
 */
export function resolveHighflyPrimaryCoreForEntity(
  entityId: number,
  classId: string,
  level: number,
): HighflyCoreVector | null {
  const profile = getActiveHighflyHunterProfile();
  if (!profile?.awakening.initialized || !profile.awakening.classId) return null;
  if (!isAwakeningClassId(classId) || profile.awakening.classId !== classId) return null;

  if (boundEntityId !== null) {
    if (entityId !== boundEntityId) return null;
  } else {
    if (!bootstrapArmed) return null;
    boundEntityId = entityId;
    bootstrapArmed = false;
  }

  return highflyCoreVectorAtLevel(profile, profile.awakening.classId, level);
}

export function highflyUniqueCoreModifiers(
  profile: HighflyHunterProfile,
): HighflyUniqueCoreModifiers {
  const classId = profile.awakening.classId;
  if (!profile.awakening.initialized || !classId) {
    return {
      staggerBonus: 0,
      moveSpeedBonus: 0,
      tenacityBonus: 0,
      hitBonus: 0,
      weakPointBonus: 0,
      resourceCostReduction: 0,
      resourceRecoveryBonus: 0,
    };
  }

  const affinity = HIGHFLY_STAT_BIBLE_V1[classId];
  const core = Object.fromEntries(
    HIGHFLY_CORE_STATS.map((stat) => [stat, finiteNonNegative(profile.training.core[stat].current)]),
  ) as HighflyCoreVector;

  // Saturating curves: large Training investment remains meaningful without
  // percentage stats exploding on the road to LV99/Extended.
  const str = saturating(core.STR, 140) * affinity.STR;
  const agi = saturating(core.AGI, 140) * affinity.AGI;
  const vit = saturating(core.VIT, 150) * affinity.VIT;
  const per = saturating(core.PER, 135) * affinity.PER;
  const int = saturating(core.INT, 135) * affinity.INT;

  return {
    staggerBonus: Math.min(0.18, 0.16 * str),
    moveSpeedBonus: Math.min(0.08, 0.065 * agi),
    tenacityBonus: Math.min(0.12, 0.10 * vit),
    hitBonus: Math.min(0.06, 0.05 * per),
    weakPointBonus: Math.min(0.18, 0.15 * per),
    resourceCostReduction: Math.min(0.12, 0.10 * int),
    resourceRecoveryBonus: Math.min(0.18, 0.15 * int),
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

export const HIGHFLY_STAT_AUTHORITY_NORMAL_MAX_LEVEL = HIGHFLY_NORMAL_MAX_LEVEL;
