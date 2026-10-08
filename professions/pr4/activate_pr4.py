#!/usr/bin/env python3
"""PR-4: guarded, opt-in Cooking Trial pilot across ALL inherited skill sources.

No changed behavior for pre-PR4/un-enrolled characters. The legacy source
remains authoritative for recipes, outputs, material spend, RNG, Hunter XP.
"""
from pathlib import Path

def replace_one(path: str, old: str, new: str, reason: str) -> None:
    p = Path(path)
    s = p.read_text(encoding='utf-8')
    if s.count(old) != 1 or s.count(new) != 0:
        raise SystemExit(f"PR4 REFUSED {reason}: anchor drifted")
    p.write_text(s.replace(old, new, 1), encoding='utf-8')

# Extend the PR-1 *existing version-1 optional state*, rather than creating
# another save authority or adding defaults to old character JSONB blobs.
replace_one('src/sim/professions/highfly_profession_state.ts',
    "  completedTrials?: string[];",
    "  /** Explicit lab enrollment; unset in every older save. */\n"
    "  trialTracks?: string[];\n"
    "  completedTrials?: string[];",
    'career v1 enrollment type')
replace_one('src/sim/professions/highfly_profession_state.ts',
    "const LISTS = [\n  'completedTrials',",
    "const LISTS = [\n  'trialTracks',\n  'completedTrials',",
    'bounded career enrollment normalization')

# Career XP is separate from applied raw skill, and can be awarded for a
# *legitimate* learning attempt while waiting at a promotion skill cap.
# We never alter the actual Claude raw skill delta/character XP path.
replace_one('src/sim/professions/highfly_profession_progress.ts',
    "  skillDelta: number;\n  /** Stable content identity",
    "  skillDelta: number;\n"
    "  /** Optional potential learning for explicitly trial-enrolled crafts. */\n"
    "  learningCredit?: number;\n  /** Stable content identity",
    'optional learning credit')
replace_one('src/sim/professions/highfly_profession_progress.ts',
    "  const empty: ProfessionLearningResult = {\n"
    "    professionXpGranted: 0, skillDelta: delta,\n"
    "    learningCredit: delta, promotionReady: false,",
    "  const credit = event.learningCredit === undefined ? delta :\n"
    "    (Number.isFinite(event.learningCredit) ?\n"
    "      Math.max(0, Math.min(1, event.learningCredit)) : 0);\n"
    "  const empty: ProfessionLearningResult = {\n"
    "    professionXpGranted: 0, skillDelta: delta,\n"
    "    learningCredit: credit, promotionReady: false,",
    'learned-vs-potential delta')
replace_one('src/sim/professions/highfly_profession_progress.ts',
    "  const xpRaw = Math.round(HIGHFLY_BASE_PROFESSION_XP * delta * practiceMultiplier(oldCount));",
    "  const xpRaw = Math.round(HIGHFLY_BASE_PROFESSION_XP * credit * practiceMultiplier(oldCount));",
    'career XP credit')

replace_one('src/sim/professions/crafting.ts',
    "import { recordHighflyProfessionProgress } from './highfly_profession_progress';",
    "import { recordHighflyProfessionProgress } from './highfly_profession_progress';\n"
    "import { cookingTrialIsPending, cookingTrialXpFrozen, recordCookingTrialProof, "
    "trialLimitedCookingGain } from './highfly_profession_trials';",
    'shared trial import')
replace_one('src/sim/professions/crafting.ts',
    """    const skillBefore = meta.craftSkills[recipe.professionId] ?? 0;
    gainCraftSkill(meta.craftSkills, recipe.professionId, CRAFT_SKILL_GAIN * multiplier);
    const skillLearned = (meta.craftSkills[recipe.professionId] ?? 0) - skillBefore;""",
    """    const skillBefore = meta.craftSkills[recipe.professionId] ?? 0;
    const rawSkillGain = CRAFT_SKILL_GAIN * multiplier;
    // Inert for ALL characters not explicitly enrolled in the Cooking pilot.
    const allowedSkillGain = trialLimitedCookingGain(
      meta.highflyProfessions, recipe.professionId, skillBefore, rawSkillGain,
    );
    gainCraftSkill(meta.craftSkills, recipe.professionId, allowedSkillGain);
    const skillLearned = (meta.craftSkills[recipe.professionId] ?? 0) - skillBefore;""",
    'exact original gain call')
replace_one('src/sim/professions/crafting.ts',
    """    const hfCareer = recordHighflyProfessionProgress(meta.highflyProfessions, {
      professionId: recipe.professionId,
      skillDelta: skillLearned,
      practiceKey: `recipe:${recipe.id}`,
    });
    if (hfCareer.state !== undefined) meta.highflyProfessions = hfCareer.state;""",
    """    const pendingCookingTrial = recipe.professionId === 'cooking' &&
      cookingTrialIsPending(meta.highflyProfessions);
    const potentialCredit = pendingCookingTrial
      ? (cookingTrialXpFrozen(meta.highflyProfessions) ? 0 : Math.min(
          rawSkillGain, Math.max(0, 125 - skillBefore),
        ))
      : skillLearned;
    const hfCareer = recordHighflyProfessionProgress(meta.highflyProfessions, {
      professionId: recipe.professionId,
      skillDelta: skillLearned,
      learningCredit: potentialCredit,
      practiceKey: `recipe:${recipe.id}`,
    });
    if (hfCareer.state !== undefined) {
      meta.highflyProfessions = recordCookingTrialProof(
        hfCareer.state, recipe.professionId, recipe.id,
      );
    }""",
    'success-only trial learning plus proof')

# The *other* canonical skill source is a rare self-made item's battlefield
# observation. Pass the optional career state from its single REAL player
# caller, never change the original two-argument tests.
replace_one('src/sim/professions/battlefield_xp.ts',
    "import { gainCraftSkill } from './wheel';",
    "import { gainCraftSkill } from './wheel';\n"
    "import { trialLimitedCookingGain } from './highfly_profession_trials';\n"
    "import type { SavedHighflyProfessionStateV1 } from './highfly_profession_state';",
    'battlefield skill cap import')
replace_one('src/sim/professions/battlefield_xp.ts',
    """  observation: BattlefieldXpObservation,
): number {""",
    """  observation: BattlefieldXpObservation,
  highflyCareer?: SavedHighflyProfessionStateV1,
): number {""",
    'battlefield pilot optional parameter')
replace_one('src/sim/professions/battlefield_xp.ts',
    """  gainCraftSkill(craftSkills, recipe.professionId, BATTLEFIELD_XP_TRICKLE);
  return BATTLEFIELD_XP_TRICKLE;""",
    """  const permitted = trialLimitedCookingGain(
    highflyCareer, recipe.professionId,
    craftSkills[recipe.professionId] ?? 0, BATTLEFIELD_XP_TRICKLE,
  );
  gainCraftSkill(craftSkills, recipe.professionId, permitted);
  return permitted;""",
    'battlefield cap on Cooking pilot')
replace_one('src/sim/items.ts',
    """        observerPairedMajor: meta.archetype.pairedMajor,
      });
      // A nonzero trickle""",
    """        observerPairedMajor: meta.archetype.pairedMajor,
      }, meta.highflyProfessions);
      // A nonzero trickle""",
    'real potion battlefield observation')

# Provide guarded *manual* enrollment and claim in the real Sim facade;
# no public UI or network command is exposed at this pilot stage.
replace_one('src/sim/sim.ts',
    "import { normalizeHighflyProfessionState, savedHighflyProfessionFragment } "
    "from './professions/highfly_profession_state';",
    "import { normalizeHighflyProfessionState, savedHighflyProfessionFragment } "
    "from './professions/highfly_profession_state';\n"
    "import { enrollCookingTrialPilot, claimCookingTrialPilot, cookingTrialStatus } "
    "from './professions/highfly_profession_trials';",
    'Sim trial import')
replace_one('src/sim/sim.ts',
    "  serializeCharacter(pid: number): CharacterState | null {",
    """  /** PR-4 LAB only: explicit enrollment, never an automatic migration. */
  enrollHighflyCookingTrialPilot(pid = this.playerId): boolean {
    const meta = this.players.get(pid);
    if (!meta) return false;
    const enrolled = enrollCookingTrialPilot(
      meta.highflyProfessions, meta.craftSkills.cooking ?? 0,
    );
    if (!enrolled) return false;
    meta.highflyProfessions = enrolled;
    return true;
  }

  /** PR-4 LAB only: claim AFTER actual crafting proofs and XP are met. */
  claimHighflyCookingTrialPilot(pid = this.playerId): boolean {
    const meta = this.players.get(pid);
    if (!meta) return false;
    const claimed = claimCookingTrialPilot(
      meta.highflyProfessions, meta.craftSkills.cooking ?? 0,
    );
    if (!claimed) return false;
    meta.highflyProfessions = claimed;
    return true;
  }

  /** Read-only result for a future quest/UI interaction in PR-6. */
  highflyCookingTrialPilotStatus(pid = this.playerId) {
    const meta = this.players.get(pid);
    return cookingTrialStatus(
      meta?.highflyProfessions, meta?.craftSkills.cooking ?? 0,
    );
  }

  serializeCharacter(pid: number): CharacterState | null {""",
    'real Sim opt-in/claim facades')

print('HIGHFLY_PR4_OPTIN_COOKING_TRIAL_GUARDED=1')
print('HIGHFLY_PR4_NO_LEGACY_GLOBAL_GATE_NO_NEW_RNG=1')
