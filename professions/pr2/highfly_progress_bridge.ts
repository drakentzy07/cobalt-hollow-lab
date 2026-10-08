/**
 * HIGHFLY PR-2: observational bridge around ClaudeCraft's ONE existing
 * gainCraftSkill primitive. Shadow/equivalence mode, not an XP system.
 *
 * The provided legacy gain function is called EXACTLY once. This bridge
 * allocates no independent skill wallet, makes no RNG draw, grants no XP,
 * does not touch CharacterState/Training, and adds no new save keys.
 *
 * PR-3 may consume learningCredit to implement authored profession XP, AFTER
 * these identity-mode invariants are certified. Not activated here.
 */
export interface LegacyProfessionProgress {
  skillDelta: number;
  learningCredit: number;
  professionXpGranted: 0;
  promotionReady: false;
}

/** Observe Claude's actual post-clamp delta, NEVER simulate its rules. */
export function observeLegacyProfessionProgress(
  skills: Record<string, number>,
  craftId: string,
  _requestedAmount: number,
  applyOriginalGain: () => void,
): LegacyProfessionProgress {
  const before = skills[craftId];
  // Strict authority: Claude's original gain body remains the only write.
  applyOriginalGain();
  const after = skills[craftId];
  const delta = typeof before === 'number' && typeof after === 'number'
    ? after - before
    : 0;
  return {
    skillDelta: delta,
    learningCredit: delta,
    professionXpGranted: 0,
    promotionReady: false,
  };
}
