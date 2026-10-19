// Picking an enemy for a pad player who pressed an ability without one.
//
// A mouse player targets by clicking what they can see, so a targetless cast is a
// slip. A pad player has no such gesture: they see a wolf, press the attack they
// know, and the cast refuses. That is the first thing a new controller player
// hits, so the press selects for them rather than answering with an error.
//
// FFXIV added exactly this in 6.1 (Auto-Target Settings), with the same choice of
// priority; nearest is the arm implemented here.
//
// Pure: the caller supplies the attackable predicate (the client already owns one)
// and the entity list, so no world handle and no DOM.

import { isDualPurposeHeal } from '../sim/combat/dual_purpose_target';

/** The little the picker reads off an entity. */
export interface AutoTargetEntity {
  id: number;
  pos: { x: number; z: number };
  hp?: number;
  maxHp?: number;
}

/** The ability fields that decide whether a target is needed at all. */
export interface AutoTargetAbility {
  requiresTarget?: boolean;
  targetType?: string;
  effects?: readonly { readonly type: string }[];
}

/** How far out to look, in yards. Matches the client's own attack-nearest reach,
 *  so the press picks the same enemy that key would. */
export const AUTO_TARGET_RANGE = 40;

/**
 * Whether this press should choose an enemy first.
 *
 * Only for abilities that actually need a hostile target: a heal or a buff would
 * otherwise yank the player off the ally they meant, and an untargeted AoE is
 * already legal and must stay that way. A dual-purpose heal (Solar Invocation,
 * Scouring Mercy) casts on either side, so it is a heal whenever an ally is held:
 * only an empty or hostile-less selection still picks an enemy for it.
 */
export function shouldAutoTarget(
  ability: AutoTargetAbility | null | undefined,
  hasLiveHostileTarget: boolean,
  hasLiveFriendlyTarget = false,
): boolean {
  if (!ability?.requiresTarget) return false;
  if (ability.targetType === 'friendly') return false;
  if (hasLiveFriendlyTarget && isDualPurposeHeal(ability)) return false;
  return !hasLiveHostileTarget;
}


/**
 * HIGHFLY mobile soft-target. Distance remains the dominant signal, but a
 * hostile in front of the Hunter receives a strong preference over one behind
 * them. Pure and renderer-free: facing is the deterministic gameplay proxy for
 * what the player is looking at.
 *
 * Manual LOCK/current valid targets never reach this picker: callers invoke it
 * only when they have no living hostile target.
 */
function highflyFinisherBias(e: AutoTargetEntity): number {
  if (!Number.isFinite(e.hp) || !Number.isFinite(e.maxHp) || (e.maxHp ?? 0) <= 0) {
    return 0;
  }
  const ratio = Math.max(0, Math.min(1, (e.hp ?? 0) / (e.maxHp ?? 1)));
  // Max 0.45 score points: enough to break a close geometric tie, never enough
  // to pull the Hunter away from the close/front intent tier.
  return (1 - ratio) * 0.45;
}

export function bestSoftAutoTarget(
  entities: Iterable<AutoTargetEntity>,
  origin: { x: number; z: number },
  facing: number,
  isAttackable: (e: AutoTargetEntity) => boolean,
  range = AUTO_TARGET_RANGE,
): number | null {
  let priorityBest: number | null = null;
  let priorityScore = Number.POSITIVE_INFINITY;
  let fallbackBest: number | null = null;
  let fallbackScore = Number.POSITIVE_INFINITY;
  const fx = Math.sin(facing);
  const fz = Math.cos(facing);

  // C2.5 keeps C2.4 intent sacred: close + frontal is the hard first tier.
  // HP only nudges ties inside a tier; it never outranks player direction.
  const priorityRange = Math.min(range, 12);
  const priorityConeDot = Math.cos((32 * Math.PI) / 180);
  const coneDot = Math.cos((42 * Math.PI) / 180);

  for (const e of entities) {
    if (!isAttackable(e)) continue;
    const dx = e.pos.x - origin.x;
    const dz = e.pos.z - origin.z;
    const distance = Math.hypot(dx, dz);
    if (distance <= 0.0001 || distance > range) continue;
    const forwardDot = (dx * fx + dz * fz) / distance;
    if (forwardDot < coneDot) continue;
    const finisherBias = highflyFinisherBias(e);

    if (distance <= priorityRange && forwardDot >= priorityConeDot) {
      const score = distance * 0.55 + (1 - forwardDot) * 18 - finisherBias;
      if (score < priorityScore) {
        priorityBest = e.id;
        priorityScore = score;
      }
    }

    const score = (1 - forwardDot) * 40 + distance * 0.08 - finisherBias;
    if (score < fallbackScore) {
      fallbackBest = e.id;
      fallbackScore = score;
    }
  }
  return priorityBest ?? fallbackBest;
}

/**
 * The nearest attackable entity, or null when nothing qualifies. `isAttackable` is
 * the caller's own rule (faction, dead, pvp opt-in), so this never second-guesses
 * who may be attacked; it only answers which of them is closest.
 */
export function nearestAutoTarget(
  entities: Iterable<AutoTargetEntity>,
  origin: { x: number; z: number },
  isAttackable: (e: AutoTargetEntity) => boolean,
  range = AUTO_TARGET_RANGE,
): number | null {
  let best: number | null = null;
  let bestDistance = range;
  for (const e of entities) {
    if (!isAttackable(e)) continue;
    const d = Math.hypot(origin.x - e.pos.x, origin.z - e.pos.z);
    if (d < bestDistance) {
      best = e.id;
      bestDistance = d;
    }
  }
  return best;
}
