import { highflyUniqueCoreModifiers } from './stat_authority';
import { getActiveHighflyHunterProfile } from './profile_store';

export interface HighflyBridgeEntity {
  id: number;
  attackPower: number;
  rangedPower: number;
  spellPower: number;
  healPower: number;
  maxHp: number;
  hp: number;
  critChance: number;
  dodgeChance: number;
  hitBonus: number;
  critDmgPhysBonus: number;
  critDmgSpellBonus: number;
  critDmgHealBonus: number;
  moveSpeed: number;
  dead: boolean;
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
  rangedPower: number;
  spellPower: number;
  healPower: number;
  maxHp: number;
  critChance: number;
  dodgeChance: number;
  hitBonus: number;
  critDmgPhysBonus: number;
  critDmgSpellBonus: number;
  critDmgHealBonus: number;
  moveSpeed: number;
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
  entity.rangedPower = baseline.rangedPower;
  entity.spellPower = baseline.spellPower;
  entity.healPower = baseline.healPower;
  entity.maxHp = baseline.maxHp;
  entity.critChance = baseline.critChance;
  entity.dodgeChance = baseline.dodgeChance;
  entity.hitBonus = baseline.hitBonus;
  entity.critDmgPhysBonus = baseline.critDmgPhysBonus;
  entity.critDmgSpellBonus = baseline.critDmgSpellBonus;
  entity.critDmgHealBonus = baseline.critDmgHealBonus;
  entity.moveSpeed = baseline.moveSpeed;
  entity.highflyResourceCostMultiplier = 1;
  entity.highflyResourceRecoveryMultiplier = 1;

  if (!flags.enabled) {
    entity.hp = entity.dead
      ? 0
      : Math.max(1, Math.min(entity.maxHp, Math.round(entity.maxHp * hpFraction)));
    return;
  }

  const profile = getActiveHighflyHunterProfile();
  if (!profile) return;

  const unique = highflyUniqueCoreModifiers(profile);

  // AP/SP/HP/crit/dodge already came from the full permanent Core inside
  // recalcPlayerStats. Never count them a second time here.
  entity.attackPower = baseline.attackPower;
  entity.rangedPower = baseline.rangedPower;
  entity.spellPower = baseline.spellPower;
  entity.healPower = baseline.healPower;
  entity.maxHp = baseline.maxHp;
  entity.critChance = baseline.critChance;
  entity.dodgeChance = baseline.dodgeChance;

  if (flags.applyMovement) {
    entity.moveSpeed = Math.max(0, baseline.moveSpeed * (1 + unique.moveSpeedBonus));
  }
  if (flags.applyPerception) {
    entity.hitBonus = Math.max(0, Math.min(1, baseline.hitBonus + unique.hitBonus));
    entity.critDmgPhysBonus = Math.max(0, baseline.critDmgPhysBonus + unique.weakPointBonus);
    entity.critDmgSpellBonus = Math.max(0, baseline.critDmgSpellBonus + unique.weakPointBonus);
    entity.critDmgHealBonus = Math.max(0, baseline.critDmgHealBonus + unique.weakPointBonus);
  }
  if (flags.applyIntelligence) {
    entity.highflyResourceCostMultiplier = Math.max(0.1, 1 - unique.resourceCostReduction);
    entity.highflyResourceRecoveryMultiplier = Math.max(1, 1 + unique.resourceRecoveryBonus);
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
    rangedPower: entity.rangedPower,
    spellPower: entity.spellPower,
    healPower: entity.healPower,
    maxHp: entity.maxHp,
    critChance: entity.critChance,
    dodgeChance: entity.dodgeChance,
    hitBonus: entity.hitBonus,
    critDmgPhysBonus: entity.critDmgPhysBonus,
    critDmgSpellBonus: entity.critDmgSpellBonus,
    critDmgHealBonus: entity.critDmgHealBonus,
    moveSpeed: entity.moveSpeed,
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
