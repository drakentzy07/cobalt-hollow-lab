/**
 * HIGHFLY ORIGIN R1-2C — resource safety until the Hunter's HP/MP/Stamina
 * bridge (R1-4). Learning a native spell is not permission to spend another
 * class's legacy rage, energy, focus or mana pool as if it were equivalent.
 *
 * Pure server-side authorization guard, ONLY for opt-in ORIGIN Hunters.
 * Legacy players are untouched. Do NOT translate or silently discount costs.
 */
import { CLASSES } from './content/classes';
import type { AbilityDef, ResourceType } from './types';

export type OriginResourceAdmission =
  | { allowed: true }
  | { allowed: false; required: ResourceType; available: ResourceType };

/** Fail closed on mismatched class-specific resources until R1-4 owns all three. */
export function originResourceAdmission(
  original: AbilityDef,
  activePool: ResourceType,
): OriginResourceAdmission {
  const required = CLASSES[original.class].resourceType;
  return required === activePool
    ? { allowed: true }
    : { allowed: false, required, available: activePool };
}
