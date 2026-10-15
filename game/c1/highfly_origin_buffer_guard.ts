/** HIGHFLY ORIGIN OR-1: bounded manual ATK buffer and explicit interruption.
 * This module NEVER authorizes a swing; it only declines stale queued intents.
 * No per-frame polling, no player saves, no changes to the original Sim.
 */
export type OriginBufferedStrike = {
  queuedEpoch: number;
  currentEpoch: number;
  queuedTargetId: number | null;
  currentTargetId: number | null;
  nowMs: number;
  deadlineMs: number;
  blocked: boolean;
};

/** A queued attack is still manual ONLY when it follows the same explicit
 * tap, target, and uninterrupted context before the short expiry deadline.
 */
export function highflyOriginBufferedStrikeAllowed(x: OriginBufferedStrike): boolean {
  return x.queuedEpoch === x.currentEpoch &&
    x.queuedTargetId !== null &&
    x.currentTargetId === x.queuedTargetId &&
    Number.isFinite(x.nowMs) &&
    Number.isFinite(x.deadlineMs) &&
    x.nowMs <= x.deadlineMs &&
    !x.blocked;
}

/** Ephemeral gesture epoch shared across HUD and mobile pointer capture.
 * Intentionally not persisted to profiles, saves, nor remote commands.
 */
export function highflyOriginReadCombatInterruptEpoch(): number {
  if (typeof document === 'undefined' || !document.body) return 0;
  return Number(document.body.dataset.hfOriginCombatInterruptEpoch ?? '0') || 0;
}
export function highflyOriginBumpCombatInterruptEpoch(): number {
  if (typeof document === 'undefined' || !document.body) return 0;
  const next = highflyOriginReadCombatInterruptEpoch() + 1;
  document.body.dataset.hfOriginCombatInterruptEpoch = String(next);
  return next;
}
