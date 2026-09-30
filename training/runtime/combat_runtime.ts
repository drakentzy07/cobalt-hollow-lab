import {
  applyTrainingBridge,
  HIGHFLY_TRAINING_BRIDGE_LAB_TUNING,
} from './bridge';
import { getActiveHighflyHunterProfile } from './profile_store';

export interface HighflyBridgeEntity {
  id: number;
  attackPower: number;
  /** Optional only for backwards-compatible LAB mocks; real Claude entities provide these. */
  rangedPower?: number;
  spellPower?: number;
  healPower?: number;
  maxHp: number;
  hp: number;
  maxResource?: number;
  resource?: number;
  resourceType?: string | null;
  critChance: number;
  hitBonus?: number;
  dodgeChance?: number;
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
  rangedPower: number;
  spellPower: number;
  healPower: number;
  maxHp: number;
  maxResource: number;
  resourceType: string | null;
  critChance: number;
  hitBonus: number;
  dodgeChance: number;
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

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

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

function restoreBaseline(entity: HighflyBridgeEntity, baseline: CombatBaselineSnapshot): void {
  entity.attackPower = baseline.attackPower;
  entity.rangedPower = baseline.rangedPower;
  entity.spellPower = baseline.spellPower;
  entity.healPower = baseline.healPower;
  entity.maxHp = baseline.maxHp;
  entity.maxResource = baseline.maxResource;
  entity.critChance = baseline.critChance;
  entity.hitBonus = baseline.hitBonus;
  entity.dodgeChance = baseline.dodgeChance;
  entity.moveSpeed = baseline.moveSpeed;
}

function applyFromBaseline(
  entity: HighflyBridgeEntity,
  baseline: CombatBaselineSnapshot,
  hpFraction: number,
  resourceFraction: number,
): void {
  restoreBaseline(entity, baseline);

  if (!flags.enabled) {
    entity.hp = entity.dead
      ? 0
      : Math.max(1, Math.min(entity.maxHp, Math.round(entity.maxHp * hpFraction)));
    if ((entity.maxResource ?? 0) > 0) {
      const maxResource = entity.maxResource ?? 0;
      entity.resource = Math.max(
        0,
        Math.min(maxResource, Math.round(maxResource * resourceFraction)),
      );
    }
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

  const gains = result.audit.gains;
  const tuning = HIGHFLY_TRAINING_BRIDGE_LAB_TUNING;

  // RUN1-J REUSE FIRST bridge. Never mutates ClaudeCraft's native STR/AGI/STA/INT,
  // level, gear or talents. It only derives bounded outputs AFTER donor recalc.
  entity.attackPower = Math.max(0, result.combat.physicalAP);

  // AGI: real donor seams are ranged power, dodge and movement.
  entity.rangedPower = Math.max(
    0,
    baseline.rangedPower * (1 + tuning.agiPowerCoef * gains.AGI),
  );
  entity.dodgeChance = clamp(
    baseline.dodgeChance + Math.min(0.06, 0.04 * gains.AGI),
    0,
    0.5,
  );
  if (flags.applyMovement) {
    entity.moveSpeed = Math.max(0, result.combat.moveSpeed);
  }

  // VIT: donor max HP. Preserve current HP percentage; no free heal on recalculation.
  entity.maxHp = Math.max(1, Math.round(result.combat.maxHP));

  // PER: donor hit + crit are the actual accuracy/precision combat seams.
  if (flags.applyPerception) {
    entity.hitBonus = clamp(
      baseline.hitBonus + Math.min(0.08, tuning.perPrecisionCoef * gains.PER),
      0,
      0.25,
    );
    entity.critChance = clamp(result.combat.critChance, 0, 1);
  }

  // INT: donor spell/heal output + mana pool. Rage/energy/focus pools stay untouched.
  if (flags.applyIntelligence) {
    const intOutputBonus = Math.min(
      tuning.intRecoveryCap,
      tuning.intRecoveryCoef * gains.INT,
    );
    entity.spellPower = Math.max(0, baseline.spellPower * (1 + intOutputBonus));
    entity.healPower = Math.max(0, baseline.healPower * (1 + intOutputBonus));
    if (baseline.resourceType === 'mana') {
      entity.maxResource = Math.max(
        1,
        Math.round(baseline.maxResource * (1 + intOutputBonus)),
      );
    }
  }

  entity.hp = entity.dead
    ? 0
    : Math.max(1, Math.min(entity.maxHp, Math.round(entity.maxHp * hpFraction)));

  if ((entity.maxResource ?? 0) > 0) {
    const maxResource = entity.maxResource ?? 0;
    entity.resource = Math.max(
      0,
      Math.min(maxResource, Math.round(maxResource * resourceFraction)),
    );
  }
}

/**
 * Called at the END of ClaudeCraft recalcPlayerStats. At that moment the entity
 * contains a fresh donor baseline, so it becomes the authoritative snapshot.
 */
export function applyActiveTrainingBridgeToEntity(entity: HighflyBridgeEntity): void {
  if (activeEntityId === null || entity.id !== activeEntityId) return;
  activeEntity = entity;

  const hpFraction = entity.maxHp > 0 ? entity.hp / entity.maxHp : 1;
  const maxResource = entity.maxResource ?? 0;
  const resource = entity.resource ?? 0;
  const resourceFraction = maxResource > 0 ? resource / maxResource : 0;
  lastClaudeBaseline = {
    attackPower: entity.attackPower,
    rangedPower: entity.rangedPower ?? 0,
    spellPower: entity.spellPower ?? 0,
    healPower: entity.healPower ?? 0,
    maxHp: entity.maxHp,
    maxResource,
    resourceType: entity.resourceType ?? null,
    critChance: entity.critChance,
    hitBonus: entity.hitBonus ?? 0,
    dodgeChance: entity.dodgeChance ?? 0.05,
    moveSpeed: entity.moveSpeed,
  };
  applyFromBaseline(entity, lastClaudeBaseline, hpFraction, resourceFraction);
}

/**
 * Re-apply after a Training profile change without waiting for equipment/aura
 * churn. Always starts from the last fresh Claude baseline, so bonuses never stack.
 */
export function refreshActiveTrainingCombatBridge(): void {
  if (!activeEntity || !lastClaudeBaseline) return;
  const hpFraction = activeEntity.maxHp > 0 ? activeEntity.hp / activeEntity.maxHp : 1;
  const maxResource = activeEntity.maxResource ?? 0;
  const resourceFraction =
    maxResource > 0 ? (activeEntity.resource ?? 0) / maxResource : 0;
  applyFromBaseline(activeEntity, lastClaudeBaseline, hpFraction, resourceFraction);
}
