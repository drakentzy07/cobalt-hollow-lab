import { highflyUniqueCoreModifiers } from './stat_authority';
import { getActiveHighflyHunterProfile } from './profile_store';

export interface HighflyBridgeEntity {
  id: number;
  attackPower: number;
  // Donor-owned derived fields are declared for safe typing, not recalculated
  // by HIGHFLY: the original ClaudeCraft combat pipeline remains authoritative.
  rangedPower?: number;
  spellPower?: number;
  healPower?: number;
  dodgeChance?: number;
  critDmgSpellBonus?: number;
  critDmgHealBonus?: number;
  maxHp: number;
  hp: number;
  critChance: number;
  moveSpeed: number;
  dead: boolean;
  hitBonus?: number;
  critDmgPhysBonus?: number;
  highflyResourceCostMultiplier?: number;
  highflyResourceRecoveryMultiplier?: number;
}

export interface ActiveTrainingBridgeFlags {
  enabled: boolean;
  applyMovement: boolean;
  applyPerception: boolean;
  applyIntelligence: boolean;
}

interface CombatBaselineSnapshot {
  attackPower: number;
  maxHp: number;
  critChance: number;
  moveSpeed: number;
  hitBonus: number | undefined;
  critDmgPhysBonus: number | undefined;
  highflyResourceCostMultiplier: number | undefined;
  highflyResourceRecoveryMultiplier: number | undefined;
}

let activeEntityId: number | null = null;
let activeEntity: HighflyBridgeEntity | null = null;
let lastClaudeBaseline: CombatBaselineSnapshot | null = null;
let flags: ActiveTrainingBridgeFlags = {
  enabled: false,
  applyMovement: false,
  applyPerception: true,
  applyIntelligence: false,
};

export function bindActiveTrainingCombatEntity(entity: HighflyBridgeEntity): void {
  activeEntityId = entity.id;
  activeEntity = entity;
  lastClaudeBaseline = null;
}

export function setActiveTrainingBridgeFlags(
  next: Partial<ActiveTrainingBridgeFlags>,
): void {
  flags = { ...flags, ...next };
}

export function getActiveTrainingBridgeFlags(): ActiveTrainingBridgeFlags {
  return { ...flags };
}

export function clearActiveTrainingCombatBinding(): void {
  activeEntityId = null;
  activeEntity = null;
  lastClaudeBaseline = null;
}

function applyFromBaseline(
  entity: HighflyBridgeEntity,
  baseline: CombatBaselineSnapshot,
  hpFraction: number,
): void {
  entity.attackPower = baseline.attackPower;
  entity.maxHp = baseline.maxHp;
  entity.critChance = baseline.critChance;
  entity.moveSpeed = baseline.moveSpeed;
  // Always reconstruct side effects from the donor baseline, never from a
  // previously bridged result (refreshes must be strictly idempotent).
  entity.hitBonus = baseline.hitBonus;
  entity.critDmgPhysBonus = baseline.critDmgPhysBonus;
  entity.highflyResourceCostMultiplier = baseline.highflyResourceCostMultiplier;
  entity.highflyResourceRecoveryMultiplier = baseline.highflyResourceRecoveryMultiplier;

  if (!flags.enabled) {
    entity.hp = entity.dead
      ? 0
      : Math.max(1, Math.min(entity.maxHp, Math.round(entity.maxHp * hpFraction)));
    return;
  }

  const profile = getActiveHighflyHunterProfile();
  if (!profile) return;

  // Primary-derived AP, HP, crit and dodge belong to ClaudeCraft's recalc.
  // HIGHFLY applies only unique side mechanics absent from that native recalc.
  const modifiers = highflyUniqueCoreModifiers(profile);
  if (flags.applyMovement) {
    entity.moveSpeed = Math.max(0, baseline.moveSpeed * (1 + modifiers.moveSpeedBonus));
  }
  if (flags.applyPerception) {
    entity.hitBonus = (baseline.hitBonus ?? 0) + modifiers.hitBonus;
    // Weak-point training augments physical critical impact, not crit chance.
    entity.critDmgPhysBonus = (baseline.critDmgPhysBonus ?? 0) + modifiers.weakPointBonus;
  }
  if (flags.applyIntelligence) {
    entity.highflyResourceCostMultiplier =
      (baseline.highflyResourceCostMultiplier ?? 1) * (1 - modifiers.resourceCostReduction);
    entity.highflyResourceRecoveryMultiplier =
      (baseline.highflyResourceRecoveryMultiplier ?? 1) * (1 + modifiers.resourceRecoveryBonus);
  }
  entity.hp = entity.dead
    ? 0
    : Math.max(1, Math.min(entity.maxHp, Math.round(entity.maxHp * hpFraction)));
}

/**
 * Called at the END of ClaudeCraft recalcPlayerStats. At that moment the entity
 * contains a fresh donor baseline, so it becomes the authoritative snapshot
 * that future Training refreshes re-use instead of stacking multipliers.
 */
export function applyActiveTrainingBridgeToEntity(entity: HighflyBridgeEntity): void {
  if (activeEntityId === null || entity.id !== activeEntityId) return;
  activeEntity = entity;

  const hpFraction = entity.maxHp > 0 ? entity.hp / entity.maxHp : 1;
  lastClaudeBaseline = {
    attackPower: entity.attackPower,
    maxHp: entity.maxHp,
    critChance: entity.critChance,
    moveSpeed: entity.moveSpeed,
    hitBonus: entity.hitBonus,
    critDmgPhysBonus: entity.critDmgPhysBonus,
    highflyResourceCostMultiplier: entity.highflyResourceCostMultiplier,
    highflyResourceRecoveryMultiplier: entity.highflyResourceRecoveryMultiplier,
  };
  applyFromBaseline(entity, lastClaudeBaseline, hpFraction);
}

/**
 * Re-apply after a Training profile change without waiting for equipment/aura
 * churn. Restores the last Claude baseline first, so bridge bonuses never
 * multiply on top of themselves.
 */
export function refreshActiveTrainingCombatBridge(): void {
  if (!activeEntity || !lastClaudeBaseline) return;
  const hpFraction = activeEntity.maxHp > 0 ? activeEntity.hp / activeEntity.maxHp : 1;
  applyFromBaseline(activeEntity, lastClaudeBaseline, hpFraction);
}
