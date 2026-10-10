/** HIGHFLY P02M: opt-in overlevel challenge rewards POLICY only.
 * No global drop table mutation, no native RNG override, no public deployment.
 * A V4 adapter must use kill-time authoritative solo ownership and roll native
 * loot per owner; otherwise do NOT apply the improved chance.
 */
export interface HighflyChallengeKillEvidence {
  hunterLevel: number;
  mobLevel: number;
  mobId: string;
  hunterId: number;
  tapOwnerId: number;
  contributors: number;
  mobMaxHp: number;
  hunterDamageToMob: number;
  combatSeconds: number;
  legitimateKill: boolean;
  kind: 'normal' | 'elite' | 'captain' | 'boss' | 'rare' | 'worldBoss' | 'dummy';
}
export interface HighflyChallengeAssessment {
  qualified: boolean;
  overlevel: number;
  /** Multiplier applies ONLY to an existing native crafting REAGENT's chance. */
  reagentChanceMultiplier: number;
  reason: string;
}
export const HIGHFLY_CHALLENGE_LOOT_POLICY = Object.freeze({
  minimumGap: 3,
  maximumGapForScaling: 10,
  minimumHunterDamageFraction: 0.65,
  minimumCombatSeconds: 3,
  maximumCombatSeconds: 360,
  maximumChanceMultiplier: 1.50,
  maximumReagentChance: 0.26,
});

/** Overlevel is not a gate to combat: defeating even LV+11 stays possible.
 * Only the reward premium is capped, so even a LV1-vs-LV99 claim
 * cannot create unbounded materials. The skill challenge remains optional.
 */
export function assessHighflyChallengeKill(e: HighflyChallengeKillEvidence): HighflyChallengeAssessment {
  const gap = e.mobLevel - e.hunterLevel;
  const denied = (reason: string): HighflyChallengeAssessment => ({
    qualified: false, overlevel: Number.isFinite(gap) ? gap : 0,
    reagentChanceMultiplier: 1, reason,
  });
  if (![e.hunterLevel,e.mobLevel,e.hunterId,e.tapOwnerId,e.contributors,
    e.mobMaxHp,e.hunterDamageToMob,e.combatSeconds].every(Number.isFinite))
    return denied('INVALID_FINITE_EVIDENCE');
  if (!Number.isInteger(e.hunterLevel) || e.hunterLevel < 1 || e.hunterLevel > 99 ||
      !Number.isInteger(e.mobLevel) || e.mobLevel < 1 || e.mobLevel > 99)
    return denied('OUT_OF_NORMAL_LEVEL_RANGE');
  const normal = /^hf_hunt_(wolf|spider|skeleton|ogre|revenant|dragonkin|elemental|stalker)_(21|30|40|50|60|70|80|90)$/.exec(e.mobId);
  const special = /^hf_enc_(elite|captain)_(21|30|40|50|60|70|80|90)$/.exec(e.mobId);
  if (!normal && !special) return denied('NOT_REGISTERED_HIGHFLY_HUNT');
  const expectedKind = normal ? 'normal' : special![1];
  if (e.kind !== expectedKind) return denied('MOB_ID_AND_KIND_MISMATCH');
  const bandLow = Number((normal ?? special)![normal ? 2 : 2]);
  const bandHigh = bandLow === 21 ? 29 : bandLow + 9;
  if (e.mobLevel < bandLow || e.mobLevel > bandHigh)
    return denied('MOB_LEVEL_OUTSIDE_AUTHORED_TEMPLATE_BAND');
  if (!e.legitimateKill || e.hunterId !== e.tapOwnerId || e.hunterId <= 0 ||
      e.contributors !== 1) return denied('KILL_CREDIT_OR_SOLO_UNVERIFIED');
  if (!(e.mobMaxHp > 0) || e.hunterDamageToMob < HIGHFLY_CHALLENGE_LOOT_POLICY.minimumHunterDamageFraction * e.mobMaxHp)
    return denied('INSUFFICIENT_COMBAT_CONTRIBUTION');
  if (e.combatSeconds < HIGHFLY_CHALLENGE_LOOT_POLICY.minimumCombatSeconds ||
      e.combatSeconds > HIGHFLY_CHALLENGE_LOOT_POLICY.maximumCombatSeconds)
    return denied('COMBAT_DURATION_NOT_VERIFIED');
  if (gap < HIGHFLY_CHALLENGE_LOOT_POLICY.minimumGap && e.kind === 'normal')
    return denied('NO_HIGHER_LEVEL_CHALLENGE');
  // Elite and local captain get a small quality-of-risk premium even at parity.
  // Never reclassify a native world boss or quest mob as an optional captain.
  const specialPremium = e.kind === 'captain' ? 0.20 : e.kind === 'elite' ? 0.10 : 0;
  const cappedGap = Math.min(Math.max(2,gap),HIGHFLY_CHALLENGE_LOOT_POLICY.maximumGapForScaling);
  const multiplier = Math.min(HIGHFLY_CHALLENGE_LOOT_POLICY.maximumChanceMultiplier,
    1 + (cappedGap - 2) * 0.0625 + specialPremium);
  return {qualified:true,overlevel:gap,reagentChanceMultiplier:multiplier,reason:'VERIFIED_SOLO_OVERLEVEL'};
}
/** Returns a bounded new PROBABILITY; caller must replace the original reagent
 * row's chance at a verified owner-specific loot-roll seam, not add a duplicate
 * roll or mutate MOBS at runtime. Quest/boss/rare/equipment drops excluded.
 */
export function highflyChallengeReagentProbability(
  baseChance: number, assessment: HighflyChallengeAssessment,
): number {
  if (!Number.isFinite(baseChance) || baseChance < 0 || baseChance > 1)
    throw Error('HF_CHALLENGE_INVALID_BASE_CHANCE');
  if (baseChance > 0.18) throw Error('HF_CHALLENGE_ONLY_REGISTERED_EXTRA_REAGENTS');
  return Math.min(HIGHFLY_CHALLENGE_LOOT_POLICY.maximumReagentChance,
    Math.round(baseChance * (assessment.qualified ? assessment.reagentChanceMultiplier : 1) * 1e6)/1e6);
}
