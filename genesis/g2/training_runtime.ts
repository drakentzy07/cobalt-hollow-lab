/**
 * HIGHFLY GENESIS G2: OFFLINE-ONLY native-entity training attachment.
 *
 * One player entity owns a profile, identified by class+name at the UI edge.
 * The donor continues to author all nine class bases, spec effects and gear
 * bonuses. At the END of each native recalc the trained part is applied from
 * that fresh baseline exactly once. Nothing mutates the native class tables.
 *
 * Do not enable this in a server until the server persists/validates training.
 */
import type { Entity, PlayerClass } from '../../sim/types';
import {
  applyHunterProgression,
  type HighflyHunterProfile,
} from '../training/core';
import { genesisTrainingProjection } from './class_training';

type Binding = { playerClass: PlayerClass; profile: HighflyHunterProfile };
const bound = new WeakMap<Entity, Binding>();

export function genesisAttachTraining(
  entity: Entity, playerClass: PlayerClass, profile: HighflyHunterProfile,
): void {
  if (entity.kind !== 'player' || profile.awakening.classId !== playerClass) {
    throw new Error('GENESIS: training identity/class mismatch');
  }
  bound.set(entity, { playerClass, profile });
}

export function genesisDetachTraining(entity: Entity): void {
  bound.delete(entity);
}

export function genesisApplyTrainingAfterNativeRecalc(entity: Entity, playerClass: PlayerClass): void {
  const binding = bound.get(entity);
  if (!binding || entity.kind !== 'player' || binding.playerClass !== playerClass) return;
  if (entity.level < 1 || entity.level > 20) return;

  // Rebase growth on the live native level; do not change the native level.
  const profile = binding.profile.hunter.level === entity.level
    ? binding.profile
    : applyHunterProgression(binding.profile, { level: entity.level });
  binding.profile = profile;
  const hpFraction = entity.maxHp > 0 ? Math.max(0, Math.min(1, entity.hp / entity.maxHp)) : 1;
  const projected = genesisTrainingProjection({
    playerClass, level: entity.level, profile, enabled: true,
    baseline: {
      physicalAP: entity.attackPower,
      stagger: 0,
      power: entity.rangedPower,
      moveSpeed: entity.moveSpeed,
      maxHP: entity.maxHp,
      precision: 1 + entity.hitBonus,
      weakPointMultiplier: 1 + entity.critDmgPhysBonus,
      critChance: entity.critChance,
      resourceCostMultiplier: 1,
      resourceRecovery: 1,
    },
  });
  // Training creates distinct, bounded increments, NOT a replacement of
  // class/talent/equipment math. No resources or spell costs are modified
  // until both native local Sim and authoritative server support that hook.
  entity.attackPower = Math.round(projected.physicalAP);
  entity.rangedPower = Math.round(projected.power);
  entity.moveSpeed = projected.moveSpeed;
  entity.maxHp = Math.max(1, Math.round(projected.maxHP));
  entity.hp = entity.dead ? 0 : Math.max(1, Math.round(entity.maxHp * hpFraction));
  entity.hitBonus = Math.max(0, projected.precision - 1);
  entity.critChance = projected.critChance;
}

export function genesisBoundProfile(entity: Entity): HighflyHunterProfile | null {
  return bound.get(entity)?.profile ?? null;
}
