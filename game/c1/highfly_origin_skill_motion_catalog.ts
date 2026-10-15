/**
 * HIGHFLY ORIGIN R1-2 P0 — read-only native animation donor registry.
 *
 * ORIGIN gameplay identity is classless. The original AbilityDef.class remains
 * metadata for locating the animation donor ONLY, not permission to cast.
 * The authoritative learned-skill gate is a later independent server stage.
 * No GLB eager loading, no new rig or animations, no skills granted.
 */
import { ABILITIES } from '../sim/content/classes';
import { VISUALS } from '../render/characters/manifest';
import type { PlayerClass } from '../sim/types';

export type OriginSkillMotion = {
  abilityId: string;
  legacyDonor: PlayerClass;
  /** Every one of these must remain lazy until the skill is equipped. */
  possibleClipGlbs: readonly string[];
  /** Present only for an explicitly authored ability gesture. */
  abilityClip: string | null;
  /** Normalized generic cast fallback; may not be appropriate to melee. */
  castClip: string | null;
  /** Native armed attack mapping; actual weapon choice happens at use. */
  weaponAttacks: readonly string[];
  weaponTwohand: string | null;
  weaponDualwield: string | null;
};

/** Resolves only a visual contract, never skill authority or weapon eligibility. */
export function originNativeSkillMotion(abilityId: string): OriginSkillMotion | null {
  const ability = ABILITIES[abilityId];
  if (!ability) return null;
  const donor = ability.class;
  const def = VISUALS[`player_${donor}`];
  if (!def) return null;
  return {
    abilityId,
    legacyDonor: donor,
    possibleClipGlbs: [def.url, ...(def.animUrls ?? [])],
    abilityClip: def.clips.attackByAbility?.[abilityId] ??
      def.clips.castByAbility?.[abilityId] ?? null,
    castClip: def.clips.cast ?? null,
    weaponAttacks: def.clips.attack,
    weaponTwohand: def.clips.attackByHand?.twohand ?? null,
    weaponDualwield: def.clips.attackByHand?.dualwield ?? null,
  };
}

/** Upper bound for the clip donors that an *equipped* loadout might require.
 * Does not fetch files. Each unique URL is returned once, sorted for stable QA.
 */
export function originEquippedSkillDonorUrls(ids: readonly string[]): string[] {
  const donors = new Set<string>();
  for (const id of ids) {
    const motion = originNativeSkillMotion(id);
    if (!motion) continue;
    for (const url of motion.possibleClipGlbs) donors.add(url);
  }
  return [...donors].sort();
}
