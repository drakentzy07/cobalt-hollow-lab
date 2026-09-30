import { applyTrainingBridge } from './bridge';
import { getActiveHighflyHunterProfile } from './profile_store';

export interface HighflyBridgeEntity {
  id: number;
  attackPower: number;
  maxHp: number;
  hp: number;
  critChance: number;
  moveSpeed: number;
  dead: boolean;
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

  if (!flags.enabled) {
    entity.hp = entity.dead
      ? 0
      : Math.max(1, Math.min(entity.maxHp, Math.round(entity.maxHp * hpFraction)));
    return;
  }

  const profile = getActiveHighflyHunterProfile();
  if (!profile) return;

  const result = applyTrainingBridge({
    baseline: {
      physicalAP: baseline.attackPower,
      stagger: 1,
      power: 1,
      moveSpeed: baseline.moveSpeed,
      maxHP: baseline.maxHp,
      precision: 1,
      weakPointMultiplier: 1,
      critChance: baseline.critChance,
      resourceCostMultiplier: 1,
      resourceRecovery: 1,
    },
    core: profile.training.core,
    flags,
  });

  entity.attackPower = Math.max(0, result.combat.physicalAP);
  entity.maxHp = Math.max(1, Math.round(result.combat.maxHP));
  entity.critChance = Math.max(0, Math.min(1, result.combat.critChance));
  if (flags.applyMovement) entity.moveSpeed = Math.max(0, result.combat.moveSpeed);
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
