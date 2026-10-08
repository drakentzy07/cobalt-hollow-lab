/**
 * HIGHFLY PR-5 — Smith first playable LAB pilot, REUSE FIRST.
 * Two real Claude craft authorities: weaponcrafting + armorcrafting.
 * Trial 24→25 pilots only; 50/75/100/125 need authored later-stage proofs.
 *
 * Never clones: craftSkills, archetypes/attunement, Masterwork, commissions,
 * combos, recipes, stations, character XP, permanent Hunter attributes.
 * NO hidden automatic attunement, GM title, new items, or RNG.
 */
import { COMBO_RECIPES } from '../content/recipes';
import { getArchetypeTitle, type ArchetypeState } from './archetype';
import { professionTrialId, professionTrialXpThreshold, trialIsReachable,
  type ProfessionTrialDefinition } from './highfly_profession_trials';
import type { SavedHighflyProfessionStateV1 } from './highfly_profession_state';

export const SMITH_CRAFTS = ['weaponcrafting', 'armorcrafting'] as const;
export type SmithCraftId = typeof SMITH_CRAFTS[number];
export const SMITH_TRIALS: Readonly<Record<SmithCraftId, ProfessionTrialDefinition>> = {
  weaponcrafting: {
    professionId: 'weaponcrafting', targetSkill: 25,
    trialId: 'trial.weaponcrafting.25', maxPrerequisiteSkill: 0,
    requiredEvidence: [
      'trial.weaponcrafting.25.recipe_eastbrook_arming_sword',
      'trial.weaponcrafting.25.recipe_copper_bearded_axe',
    ],
  },
  armorcrafting: {
    professionId: 'armorcrafting', targetSkill: 25,
    trialId: 'trial.armorcrafting.25', maxPrerequisiteSkill: 0,
    requiredEvidence: [
      'trial.armorcrafting.25.recipe_eastbrook_chain_vest',
      'trial.armorcrafting.25.recipe_eastbrook_warded_leggings',
    ],
  },
};

/** Grandmaster Smith is a derived TITLE eligibility, never a granted power. */
export function smithCraftId(id: string): id is SmithCraftId {
  return id === 'weaponcrafting' || id === 'armorcrafting';
}

export function smithIsActive(archetype: Pick<ArchetypeState, 'activeArchetype'|'pairedMajor'>): boolean {
  return (archetype.activeArchetype === 'weaponcrafting' && archetype.pairedMajor === 'armorcrafting') ||
    (archetype.activeArchetype === 'armorcrafting' && archetype.pairedMajor === 'weaponcrafting');
}

export function smithLiveComboRecipeIds(): string[] {
  return COMBO_RECIPES.filter(r => {
    const c = r.comboRequirement;
    return !!c && smithCraftId(c.craftA) && smithCraftId(c.craftB) && c.craftA !== c.craftB;
  }).map(r => r.id);
}

export function smithPilotEnroll(
  old: SavedHighflyProfessionStateV1 | undefined,
  professionId: string,
  skill: number,
): SavedHighflyProfessionStateV1 | undefined {
  if (!smithCraftId(professionId) || !Number.isFinite(skill) || skill < 0 || skill >= 25) return undefined;
  if (old?.trialTracks?.includes(professionId)) return old;
  const tracks = [...(old?.trialTracks ?? [])];
  if (tracks.length >= 256) return undefined;
  return {
    ...(old ?? { version: 1 }), version: 1,
    trialTracks: [...tracks, professionId],
  };
}

export function smithTrialPending(
  s: SavedHighflyProfessionStateV1 | undefined, professionId: string,
): boolean {
  return smithCraftId(professionId) &&
    s?.trialTracks?.includes(professionId) === true &&
    s?.completedTrials?.includes(professionTrialId(professionId,25)) !== true;
}

export function smithTrialLimitedGain(
  s: SavedHighflyProfessionStateV1 | undefined,
  professionId: string, skill: number, legacyAmount: number,
): number {
  if (!smithTrialPending(s, professionId) ||
    !Number.isFinite(skill) || !Number.isFinite(legacyAmount) || legacyAmount <= 0) return legacyAmount;
  return Math.min(legacyAmount, Math.max(0, 24 - skill));
}

export function smithTrialXpFrozen(
  s: SavedHighflyProfessionStateV1 | undefined,
  professionId: string,
): boolean {
  return smithTrialPending(s, professionId) &&
    (s?.craftXp?.[professionId] ?? 0) >= professionTrialXpThreshold(25);
}

export function recordSmithTrialProof(
  s: SavedHighflyProfessionStateV1 | undefined,
  professionId: string, recipeId: string,
): SavedHighflyProfessionStateV1 | undefined {
  if (!s || !smithTrialPending(s,professionId) || !smithCraftId(professionId)) return s;
  const trial=SMITH_TRIALS[professionId];
  const proof=`trial.${professionId}.25.${recipeId}`;
  if (!trial.requiredEvidence.includes(proof) || (s.evidence?.[proof]??0)>=1) return s;
  const evidence={...(s.evidence??{})};
  if (Object.keys(evidence).length>=256) return s;
  evidence[proof]=1;
  return {...s,evidence};
}

export interface SmithTrialStatus {
  craft: SmithCraftId;
  enrolled: boolean;
  completed: boolean;
  ready: boolean;
  skill: number;
  xp: number;
  xpRequired: number;
  proofs: number;
  proofsRequired: number;
}

/** Completely independent progress per branch, not a new pair skill pool. */
export function smithTrialStatus(
  s: SavedHighflyProfessionStateV1 | undefined,
  craft: SmithCraftId, skill: number,
): SmithTrialStatus {
  const d=SMITH_TRIALS[craft];
  const xpRequired=professionTrialXpThreshold(25);
  const xp=s?.craftXp?.[craft]??0;
  const proofs=d.requiredEvidence.filter(k=>(s?.evidence?.[k]??0)>=1).length;
  const enrolled=s?.trialTracks?.includes(craft)===true;
  const completed=s?.completedTrials?.includes(d.trialId)===true;
  return {craft,enrolled,completed,
    ready:enrolled&&!completed&&skill>=24&&xp>=xpRequired&&proofs===d.requiredEvidence.length,
    skill,xp,xpRequired,proofs,proofsRequired:d.requiredEvidence.length};
}

/** Explicit player claim only, NEVER auto-claim after a craft. */
export function smithPilotClaim(
  s: SavedHighflyProfessionStateV1 | undefined,
  craft: SmithCraftId, skill: number,
): SavedHighflyProfessionStateV1 | undefined {
  if(!s||!smithTrialStatus(s,craft,skill).ready)return undefined;
  return {...s,completedTrials:[...(s.completedTrials??[]),SMITH_TRIALS[craft].trialId]};
}

export interface SmithSnapshot {
  titleId: string | null;
  smithActive: boolean;
  weaponcrafting: SmithTrialStatus;
  armorcrafting: SmithTrialStatus;
  comboRecipeIds: string[];
  grandmasterSkillEligible: boolean;
  legendaryAwardedByThisPilot: false;
}

/** Read-only, real Smith profile; NO fabricated skill or archetype state. */
export function highflySmithSnapshot(
  craftSkills: Record<string,number>,
  archetype: Pick<ArchetypeState,'activeArchetype'|'pairedMajor'>,
  career?: SavedHighflyProfessionStateV1,
): SmithSnapshot {
  return {
    titleId: getArchetypeTitle(archetype.activeArchetype,archetype.pairedMajor),
    smithActive:smithIsActive(archetype),
    weaponcrafting:smithTrialStatus(career,'weaponcrafting',craftSkills.weaponcrafting??0),
    armorcrafting:smithTrialStatus(career,'armorcrafting',craftSkills.armorcrafting??0),
    comboRecipeIds:smithLiveComboRecipeIds(),
    grandmasterSkillEligible:(craftSkills.weaponcrafting??0)>=125&&(craftSkills.armorcrafting??0)>=125,
    legendaryAwardedByThisPilot:false,
  };
}

/** Fail closed if any authored trial is impossible or mis-keyed. */
export function smithTrialCatalogValid(): boolean {
  return SMITH_CRAFTS.every(c=>trialIsReachable(SMITH_TRIALS[c]) &&
    SMITH_TRIALS[c].trialId===professionTrialId(c,25) &&
    SMITH_TRIALS[c].requiredEvidence.length===2);
}
