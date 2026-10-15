/**
 * HIGHFLY ORIGIN R1-4D: ONE stamina authority for manual basic attacks,
 * grounded jump, double jump and mobile directional evade.
 *
 * These are intentional gameplay actions, not ordinary walk/swim steering.
 * The first accepted edge pays once; no cost on a held input or failed
 * movement gate. Never mutate a legacy rage/energy/focus pool.
 */
import type { OriginHunterResourcesV1 } from './highfly_origin_universal_resources';
import type { OriginHunterProfileV1 } from './highfly_origin_hunter_profile';

export type OriginMotionAction = 'groundJump' | 'airJump' | 'evade';
export const ORIGIN_MOTION_STAMINA_COST: Readonly<Record<OriginMotionAction, number>> = {
  groundJump: 6,
  airJump: 10,
  evade: 14,
};
/** Stamina spent per manually ACCEPTED strike; no auto-attack billing. */
export const ORIGIN_BASIC_STAMINA_COST = [0, 4, 4, 6, 8] as const;

export function originCanSpendStamina(
  resources: OriginHunterResourcesV1 | undefined,
  amount: number,
): boolean {
  return resources === undefined || (
    Number.isFinite(amount) && amount >= 0 &&
    Number.isFinite(resources.stamina) && resources.stamina >= amount
  );
}

/** Invoked exclusively by authoritative Sim, never by ClientWorld prediction. */
export function originSpendMotionStamina(
  profile: OriginHunterProfileV1 | undefined,
  action: OriginMotionAction,
): boolean {
  if (!profile) return true;
  const cost = ORIGIN_MOTION_STAMINA_COST[action];
  if (!originCanSpendStamina(profile.resources, cost)) return false;
  profile.resources.stamina = Math.max(0, profile.resources.stamina - cost);
  return true;
}

/** Native swing guard before the actual damage/attack animation trigger. */
export function originSpendBasicStamina(
  profile: OriginHunterProfileV1 | undefined,
  step: 1 | 2 | 3 | 4,
): boolean {
  if (!profile) return true;
  const cost = ORIGIN_BASIC_STAMINA_COST[step];
  if (!originCanSpendStamina(profile.resources, cost)) return false;
  profile.resources.stamina = Math.max(0, profile.resources.stamina - cost);
  return true;
}
