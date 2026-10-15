/**
 * HIGHFLY ORIGIN R1-4 A/B — server-owned universal Hunter vitals.
 * The live Entity.hp/maxHp are THE HP truth (damage, healing and resurrection
 * stay native); mana + stamina persist independently of the legacy carrier bar.
 * No weapon/skill grants stats. No Rage/Energy/Focus conversion.
 */
import type { AbilityDef } from './types';
import type { OriginHunterProfileV1 } from './highfly_origin_hunter_profile';

export interface OriginHunterResourcesV1 {
  mana: number;
  maxMana: number;
  stamina: number;
  maxStamina: number;
}

export type OriginCostPool = 'mana' | 'stamina';
export type OriginCostDecision =
  | { ok: true; pool: OriginCostPool }
  | { ok: false; reason: string };

export const ORIGIN_BASE_MAX_MANA = 200;
export const ORIGIN_BASE_MAX_STAMINA = 100;
export const ORIGIN_MANA_REGEN_PER_SECOND = 2;
export const ORIGIN_STAMINA_REGEN_PER_SECOND = 8;

export function originFreshResources(): OriginHunterResourcesV1 {
  return {
    mana: ORIGIN_BASE_MAX_MANA,
    maxMana: ORIGIN_BASE_MAX_MANA,
    stamina: ORIGIN_BASE_MAX_STAMINA,
    maxStamina: ORIGIN_BASE_MAX_STAMINA,
  };
}

export function originRestoreResources(raw: unknown): OriginHunterResourcesV1 {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    throw new Error('ORIGIN_INVALID_RESOURCE_SAVE');
  const v = raw as Record<string, unknown>;
  const maxMana = v.maxMana;
  const maxStamina = v.maxStamina;
  const mana = v.mana;
  const stamina = v.stamina;
  // Reject corruption instead of allowing negative/NaN resources to fuel casts.
  if (![mana, maxMana, stamina, maxStamina].every((n) =>
    typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 100000)) {
    throw new Error('ORIGIN_INVALID_RESOURCE_AMOUNT');
  }
  const maxMp = maxMana as number;
  const maxSta = maxStamina as number;
  if (maxMp < 1 || maxSta < 1 || (mana as number) > maxMp ||
      (stamina as number) > maxSta)
    throw new Error('ORIGIN_INVALID_RESOURCE_LIMITS');
  return {
    mana: mana as number, maxMana: maxMp,
    stamina: stamina as number, maxStamina: maxSta,
  };
}

/** An original spell's SCHOOL is the base mapping, not its legacy class.
 * Nonstandard legacy mechanics remain blocked until individually audited.
 * This guard runs on the SERVER and does not grant ability knowledge.
 */
export function originCostDecision(ability: AbilityDef): OriginCostDecision {
  if (
    ability.onNextSwing ||
    ability.spendsAllResource ||
    ability.devotionCost ||
    ability.ruinCost ||
    ability.soulFragmentCost ||
    ability.effects.some((effect) =>
      effect.type === 'selfBuff' && effect.kind.startsWith('form_'))
  ) return { ok: false, reason: 'Special legacy resource or form mechanic pending Origin adaptation' };
  return { ok: true, pool: ability.school === 'physical' ? 'stamina' : 'mana' };
}

/** Call only AFTER known-skill and game-specific admission passed. */
export function originAvailable(profile: OriginHunterProfileV1, ability: AbilityDef): number {
  const d = originCostDecision(ability);
  if (!d.ok) return 0;
  return d.pool === 'mana' ? profile.resources.mana : profile.resources.stamina;
}

export function originSpend(
  profile: OriginHunterProfileV1,
  ability: AbilityDef,
  amount: number,
): boolean {
  const d = originCostDecision(ability);
  if (!d.ok || !Number.isFinite(amount) || amount < 0) return false;
  const r = profile.resources;
  if (d.pool === 'mana') {
    if (r.mana + 0.00001 < amount) return false;
    r.mana = Math.max(0, r.mana - amount);
  } else {
    if (r.stamina + 0.00001 < amount) return false;
    r.stamina = Math.max(0, r.stamina - amount);
  }
  return true;
}

/** Tick independent MP and stamina; REAL health comes from Entity.hp. */
export function originRegen(profile: OriginHunterProfileV1, dtSeconds: number): void {
  if (!Number.isFinite(dtSeconds) || dtSeconds <= 0) return;
  const r = profile.resources;
  r.mana = Math.min(r.maxMana, r.mana + ORIGIN_MANA_REGEN_PER_SECOND * dtSeconds);
  r.stamina = Math.min(r.maxStamina, r.stamina + ORIGIN_STAMINA_REGEN_PER_SECOND * dtSeconds);
}
