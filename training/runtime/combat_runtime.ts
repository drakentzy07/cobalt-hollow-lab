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

let activeEntityId: number | null = null;
let flags: ActiveTrainingBridgeFlags = {
  enabled: false,
  applyMovement: false,
  applyPerception: true,
  applyIntelligence: false,
};

export function bindActiveTrainingCombatEntity(entityId: number): void {
  activeEntityId = entityId;
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
}

/**
 * Applies HIGHFLY after ClaudeCraft has completed its normal derived-stat pass.
 * It only touches the explicitly bound local Hunter; server/mob/other-player
 * entities are left unchanged.
 */
export function applyActiveTrainingBridgeToEntity(entity: HighflyBridgeEntity): void {
  if (!flags.enabled || activeEntityId === null || entity.id !== activeEntityId) return;

  const profile = getActiveHighflyHunterProfile();
  if (!profile) return;

  const hpFraction = entity.maxHp > 0 ? entity.hp / entity.maxHp : 1;
  const result = applyTrainingBridge({
    baseline: {
      physicalAP: entity.attackPower,
      stagger: 1,
      power: 1,
      moveSpeed: entity.moveSpeed,
      maxHP: entity.maxHp,
      precision: 1,
      weakPointMultiplier: 1,
      critChance: entity.critChance,
      resourceCostMultiplier: 1,
      resourceRecovery: 1,
    },
    core: profile.training.core,
    flags,
  });

  entity.attackPower = Math.max(0, Math.round(result.combat.physicalAP));
  entity.maxHp = Math.max(1, Math.round(result.combat.maxHP));
  entity.critChance = Math.max(0, Math.min(1, result.combat.critChance));
  if (flags.applyMovement) {
    entity.moveSpeed = Math.max(0, result.combat.moveSpeed);
  }
  entity.hp = entity.dead
    ? 0
    : Math.max(1, Math.min(entity.maxHp, Math.round(entity.maxHp * hpFraction)));
}
