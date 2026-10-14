/** HIGHFLY V13 Skill Lab ONLY: isolate authored skill VFX from ordinary white swings.
 * Pure predicate makes the same guard usable by attack-start and swing execution.
 * Nothing changes for the normal game, SF28, server, or any other URL.
 */
export function highflyV13MuteNormalAttack(
  search: string, actorId: number, primaryId: number,
): boolean {
  return new URLSearchParams(search).get('hf-v13') === '1' && actorId === primaryId;
}

export function highflyV13MuteNormalAttackHere(
  actorId: number, primaryId: number,
): boolean {
  return typeof window !== 'undefined'
    && highflyV13MuteNormalAttack(window.location.search,actorId,primaryId);
}
