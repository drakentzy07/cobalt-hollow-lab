#!/usr/bin/env python3
"""PR-5: safe Smith overlay — independent weaponcrafting/armorcrafting trials.

Runs on PR-4 green replay, never on public branch. Validates all anchors.
Every default/unenrolled character keeps previous Claude/PR4 behavior.
"""
from pathlib import Path

changes = []
def splice(path, old, new, label):
    p = Path(path)
    src = p.read_text(encoding='utf-8')
    if src.count(old) != 1 or new in src:
        raise SystemExit(f'PR5 REFUSED {label}: upstream drift count={src.count(old)}')
    changes.append((p,old,new,label))

c='src/sim/professions/crafting.ts'
splice(c,
  "import { cookingTrialIsPending, cookingTrialXpFrozen, recordCookingTrialProof, trialLimitedCookingGain } from './highfly_profession_trials';",
  "import { cookingTrialIsPending, cookingTrialXpFrozen, recordCookingTrialProof, trialLimitedCookingGain } from './highfly_profession_trials';\n"
  "import { smithTrialPending, smithTrialXpFrozen, smithTrialLimitedGain, recordSmithTrialProof } from './highfly_smith_pilot';",
  "crafting Smith imports")
splice(c,
  """    gainCraftSkill(meta.craftSkills, recipe.professionId, allowedSkillGain);
    const skillLearned = (meta.craftSkills[recipe.professionId] ?? 0) - skillBefore;""",
  """    const smithAllowedSkillGain = smithTrialLimitedGain(
      meta.highflyProfessions, recipe.professionId, skillBefore, allowedSkillGain,
    );
    gainCraftSkill(meta.craftSkills, recipe.professionId, smithAllowedSkillGain);
    const skillLearned = (meta.craftSkills[recipe.professionId] ?? 0) - skillBefore;""",
  "smith raw gain")
splice(c,
  """    const potentialCredit = pendingCookingTrial
      ? (cookingTrialXpFrozen(meta.highflyProfessions) ? 0 : Math.min(
          rawSkillGain, Math.max(0, 125 - skillBefore),
        ))
      : skillLearned;""",
  """    const pendingSmithTrial = smithTrialPending(meta.highflyProfessions, recipe.professionId);
    const potentialCredit = pendingSmithTrial
      ? (smithTrialXpFrozen(meta.highflyProfessions, recipe.professionId) ? 0 : Math.min(
          rawSkillGain, Math.max(0, 125 - skillBefore),
        ))
      : pendingCookingTrial
        ? (cookingTrialXpFrozen(meta.highflyProfessions) ? 0 : Math.min(
            rawSkillGain, Math.max(0, 125 - skillBefore),
          ))
        : skillLearned;""",
  "smith profession XP pending credit")
splice(c,
  """      meta.highflyProfessions = recordCookingTrialProof(
        hfCareer.state, recipe.professionId, recipe.id,
      );""",
  """      meta.highflyProfessions = recordSmithTrialProof(recordCookingTrialProof(
        hfCareer.state, recipe.professionId, recipe.id,
      ), recipe.professionId, recipe.id);""",
  "smith proof on real successful craft")

b='src/sim/professions/battlefield_xp.ts'
splice(b,
  "import { trialLimitedCookingGain } from './highfly_profession_trials';",
  "import { trialLimitedCookingGain } from './highfly_profession_trials';\n"
  "import { smithTrialLimitedGain } from './highfly_smith_pilot';",
  "battlefield smith import")
splice(b,
  """  gainCraftSkill(craftSkills, recipe.professionId, permitted);
  return permitted;""",
  """  const smithPermitted = smithTrialLimitedGain(
    highflyCareer, recipe.professionId, craftSkills[recipe.professionId] ?? 0, permitted,
  );
  gainCraftSkill(craftSkills, recipe.professionId, smithPermitted);
  return smithPermitted;""",
  "battlefield smith cap")

s='src/sim/sim.ts'
splice(s,
  "import { enrollCookingTrialPilot, claimCookingTrialPilot, cookingTrialStatus } from './professions/highfly_profession_trials';",
  "import { enrollCookingTrialPilot, claimCookingTrialPilot, cookingTrialStatus } from './professions/highfly_profession_trials';\n"
  "import { highflySmithSnapshot, smithCraftId, smithPilotEnroll, smithPilotClaim } from './professions/highfly_smith_pilot';",
  "Sim smith import")
splice(s,
  "  serializeCharacter(pid: number): CharacterState | null {",
  """  /** PR-5 LAB only: opt-in independent weapon or armor trial, no public command. */
  enrollHighflySmithTrialPilot(professionId: string, pid = this.playerId): boolean {
    if (!smithCraftId(professionId)) return false;
    const meta = this.players.get(pid);
    if (!meta) return false;
    const next = smithPilotEnroll(meta.highflyProfessions, professionId,
      meta.craftSkills[professionId] ?? 0);
    if (!next) return false;
    meta.highflyProfessions = next;
    return true;
  }

  /** Independent, explicit claim; does NOT attune the existing Smith archetype. */
  claimHighflySmithTrialPilot(professionId: string, pid = this.playerId): boolean {
    if (!smithCraftId(professionId)) return false;
    const meta = this.players.get(pid);
    if (!meta) return false;
    const next = smithPilotClaim(meta.highflyProfessions, professionId,
      meta.craftSkills[professionId] ?? 0);
    if (!next) return false;
    meta.highflyProfessions = next;
    return true;
  }

  /** LAB read model; all canonical skill and title data stays Claude-owned. */
  highflySmithPilotStatus(pid = this.playerId) {
    const meta = this.players.get(pid);
    return meta ? highflySmithSnapshot(
      meta.craftSkills, meta.archetype, meta.highflyProfessions,
    ) : null;
  }

  serializeCharacter(pid: number): CharacterState | null {""",
  "Sim Smith pilot facade")

# Apply every operation to a staged buffer and write only if EVERY guard passes.
pending={}
for p,old,new,label in changes:
    src=pending.get(p)
    if src is None: src=p.read_text(encoding='utf-8')
    if src.count(old)!=1 or new in src:
        raise SystemExit(f'PR5 REFUSED staged edit {label}')
    pending[p]=src.replace(old,new,1)
for p,updated in pending.items():
    p.write_text(updated,encoding='utf-8')
print('HIGHFLY_PR5_WEAPON_ARMOR_INDEPENDENT_TRIAL_HOOKS=1')
print('HIGHFLY_PR5_NO_NEW_SKILL_WALLET_NO_NEW_RNG=1')
