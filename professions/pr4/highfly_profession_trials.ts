/**
 * HIGHFLY PR-4 — authored promotion trial engine.
 *
 * Exactly five promotion boundaries; reaching skill 125 is NOT the separate
 * Grandmaster Proof. The initial opt-in rollout is COOKING 24 -> 25 only.
 * No global gating, no RNG, no new recipe IDs/items, no forced skill reset.
 */
import type { SavedHighflyProfessionStateV1 } from './highfly_profession_state';
import { professionXpCurvePreview } from './highfly_profession_progress';

export const PROFESSION_TRIAL_THRESHOLDS = [25, 50, 75, 100, 125] as const;
export type ProfessionTrialThreshold = (typeof PROFESSION_TRIAL_THRESHOLDS)[number];

export interface ProfessionTrialDefinition {
  professionId: string;
  targetSkill: ProfessionTrialThreshold;
  trialId: string;
  /** The LAST recipe/tier needed MUST be available below the target skill. */
  maxPrerequisiteSkill: number;
  requiredEvidence: readonly string[];
}

export const COOKING_APPRENTICE_TRIAL: ProfessionTrialDefinition = {
  professionId: 'cooking',
  targetSkill: 25,
  trialId: 'trial.cooking.25',
  maxPrerequisiteSkill: 0,
  // Both recipes are actual ClaudeCraft content, with skillReq 0.
  // The second teaches a fish source; the first, a monster ingredient source.
  requiredEvidence: [
    'trial.cooking.25.recipe_tough_jerky',
    'trial.cooking.25.recipe_pan_seared_perch',
  ],
};

const COOKING_PROOFS: Readonly<Record<string, string>> = {
  recipe_tough_jerky: 'trial.cooking.25.recipe_tough_jerky',
  recipe_pan_seared_perch: 'trial.cooking.25.recipe_pan_seared_perch',
};

export function professionTrialId(professionId: string, targetSkill: ProfessionTrialThreshold): string {
  return `trial.${professionId}.${targetSkill}`;
}

export function professionTrialXpThreshold(targetSkill: ProfessionTrialThreshold): number {
  return professionXpCurvePreview(targetSkill);
}

/** A trial cannot depend on a recipe that requires the blocked tier. */
export function trialIsReachable(def: ProfessionTrialDefinition): boolean {
  return PROFESSION_TRIAL_THRESHOLDS.includes(def.targetSkill) &&
    def.trialId === professionTrialId(def.professionId, def.targetSkill) &&
    def.maxPrerequisiteSkill < def.targetSkill &&
    def.requiredEvidence.length > 0 &&
    new Set(def.requiredEvidence).size === def.requiredEvidence.length;
}

/** NEW enrollments are opt-in and restricted to the pilot. Old saves untouched. */
export function enrollCookingTrialPilot(
  old: SavedHighflyProfessionStateV1 | undefined,
  currentSkill: number,
): SavedHighflyProfessionStateV1 | undefined {
  if (!Number.isFinite(currentSkill) || currentSkill < 0 || currentSkill >= 25)
    return undefined;
  if (old?.trialTracks?.includes('cooking')) return old;
  return { ...(old ?? { version: 1 }), version: 1,
    trialTracks: [...(old?.trialTracks ?? []), 'cooking'] };
}

export function cookingTrialIsEnrolled(s: SavedHighflyProfessionStateV1 | undefined): boolean {
  return s?.trialTracks?.includes('cooking') === true;
}

export function cookingTrialIsPending(s: SavedHighflyProfessionStateV1 | undefined): boolean {
  return cookingTrialIsEnrolled(s) &&
    s?.completedTrials?.includes(COOKING_APPRENTICE_TRIAL.trialId) !== true;
}

/** Do not let a completed character retroactively lose skill on load. */
export function trialLimitedCookingGain(
  s: SavedHighflyProfessionStateV1 | undefined,
  professionId: string,
  currentSkill: number,
  originalAmount: number,
): number {
  if (professionId !== 'cooking' || !cookingTrialIsPending(s))
    return originalAmount;
  if (!Number.isFinite(currentSkill) || !Number.isFinite(originalAmount) || originalAmount <= 0)
    return originalAmount;
  return Math.min(originalAmount, Math.max(0, 24 - currentSkill));
}

/** Preserve only the completing action's overflow; freeze ALL subsequent XP. */
export function cookingTrialXpFrozen(s: SavedHighflyProfessionStateV1 | undefined): boolean {
  if (!cookingTrialIsPending(s)) return false;
  return (s?.craftXp?.cooking ?? 0) >= professionTrialXpThreshold(25);
}

export function recordCookingTrialProof(
  s: SavedHighflyProfessionStateV1 | undefined,
  professionId: string,
  recipeId: string,
): SavedHighflyProfessionStateV1 | undefined {
  if (!s || professionId !== 'cooking' || !cookingTrialIsPending(s)) return s;
  const proof = COOKING_PROOFS[recipeId];
  if (!proof || s?.evidence?.[proof] === 1) return s;
  const evidence = { ...(s?.evidence ?? {}) };
  // Upper bound matches PR-1's persisted evidence limits.
  if (!(proof in evidence) && Object.keys(evidence).length >= 256) return s;
  evidence[proof] = 1;
  return { ...s, evidence };
}

export interface CookingTrialStatus {
  enrolled: boolean;
  completed: boolean;
  ready: boolean;
  skillMet: boolean;
  xpMet: boolean;
  evidenceMet: boolean;
  xp: number;
  xpRequired: number;
  proofs: number;
  proofsRequired: number;
}

/** Source of truth is the existing Claude craftSkills and PR-3 career XP. */
export function cookingTrialStatus(
  s: SavedHighflyProfessionStateV1 | undefined,
  currentSkill: number,
): CookingTrialStatus {
  const evidence = COOKING_APPRENTICE_TRIAL.requiredEvidence;
  const proofs = evidence.filter(key => (s?.evidence?.[key] ?? 0) >= 1).length;
  const xpRequired = professionTrialXpThreshold(25);
  const xp = s?.craftXp?.cooking ?? 0;
  const completed = s?.completedTrials?.includes(COOKING_APPRENTICE_TRIAL.trialId) === true;
  const enrolled = cookingTrialIsEnrolled(s);
  const skillMet = Number.isFinite(currentSkill) && currentSkill >= 24;
  const xpMet = xp >= xpRequired;
  const evidenceMet = proofs === evidence.length;
  return {
    enrolled, completed,
    ready: enrolled && !completed && skillMet && xpMet && evidenceMet,
    skillMet, xpMet, evidenceMet, xp, xpRequired,
    proofs, proofsRequired: evidence.length,
  };
}

/** An explicit player CLAIM only; successful crafting alone never auto-promotes. */
export function claimCookingTrialPilot(
  old: SavedHighflyProfessionStateV1 | undefined,
  currentSkill: number,
): SavedHighflyProfessionStateV1 | undefined {
  if (!cookingTrialStatus(old, currentSkill).ready || !old) return undefined;
  return {
    ...old,
    completedTrials: [...(old.completedTrials ?? []), COOKING_APPRENTICE_TRIAL.trialId],
  };
}
