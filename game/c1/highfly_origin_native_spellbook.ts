/**
 * HIGHFLY ORIGIN R1-2A: native spellbook projection for a persistent Hunter.
 *
 * Reuse the original ABILITIES / CLASSES / rank, quest and specialization
 * gates without giving a Hunter the entire original class kit for free.
 * A learned ID is only a durable entitlement; it still must be native,
 * visible, level-valid, quest-authorized and baseline-spec-compatible.
 * R1-4 bridges the class-specific resource costs before mixed casting UX.
 */
import { ABILITIES, abilitiesKnownAt, type KnownAbility } from './content/classes';
import type { OriginHunterProfileV1 } from './highfly_origin_hunter_profile';

export function highflyOriginNativeLearnable(
  abilityId: string,
  level: number,
  questsDone: ReadonlySet<string>,
): KnownAbility | null {
  const def = ABILITIES[abilityId];
  if (!def || def.hiddenFromPlayer || !Number.isFinite(level) || level < 1 ||
      !Number.isSafeInteger(level)) return null;
  // Respect original class catalogue (no talent-only, seasonal or dev skills).
  // No cross-class talent perks, spec bypass or illicit quest unlock.
  const native = abilitiesKnownAt(def.class, level, undefined, questsDone)
    .find((known) => known.def.id === abilityId);
  return native ?? null;
}

export function highflyOriginKnownAbilities(
  profile: OriginHunterProfileV1,
  level: number,
  questsDone: ReadonlySet<string>,
): KnownAbility[] {
  const out: KnownAbility[] = [];
  // In R1-2A a learned skill is NOT a stat point or an unconditional cast.
  for (const id of profile.learnedSkillIds) {
    const resolved = highflyOriginNativeLearnable(id, level, questsDone);
    if (resolved) out.push(resolved);
  }
  return out;
}
