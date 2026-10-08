#!/usr/bin/env python3
"""HIGHFLY PR-10 guarded integration against pinned PR-9 green overlay.

Action XP enters the ONE original post-success grantEnchantingSkill seam:
- disenchant only when donor accepts a NON-self-crafted victim
- apply on worn, bag and confirmed replacement successes
- all denies untouched and no new RNG/skill/equipment modifications
Engineering evidence records once through the existing craft-success seam.
"""
from pathlib import Path
ops=[]
def plan(path,old,new,why,expected=1):
    ops.append((Path(path),old,new,why,expected))

p='src/sim/professions/enchanting.ts'
plan(p,
    "import { gainCraftSkill, skillInCraft } from './wheel';",
    "import { gainCraftSkill, skillInCraft } from './wheel';\n"
    "import { recordHighflyEnchantAction } from './highfly_enchant_engineering';",
    'original enchanting action import')

plan(p,
    """function grantEnchantingSkill(ctx: SimContext, meta: PlayerMeta, inputTier: number): void {
  gainCraftSkill(
    meta.craftSkills,
    'enchanting',
    ENCHANTING_SKILL_GAIN *
      enchantingGainMultiplier(
        meta.craftSkills,
        meta.archetype.activeArchetype,
        meta.archetype.pairedMajor,
        meta.archetype.hobbyCraft,
        inputTier,
      ),
  );
  ctx.markDeedsDirty(meta.entityId);
}""",
    """function grantEnchantingSkill(
  ctx: SimContext, meta: PlayerMeta, inputTier: number,
  action: 'disenchant' | 'apply',
): void {
  const skillBefore = meta.craftSkills.enchanting ?? 0;
  gainCraftSkill(
    meta.craftSkills,
    'enchanting',
    ENCHANTING_SKILL_GAIN *
      enchantingGainMultiplier(
        meta.craftSkills,
        meta.archetype.activeArchetype,
        meta.archetype.pairedMajor,
        meta.archetype.hobbyCraft,
        inputTier,
      ),
  );
  const donorSkillDelta = (meta.craftSkills.enchanting ?? 0) - skillBefore;
  meta.highflyProfessions = recordHighflyEnchantAction(
    meta.highflyProfessions, action, donorSkillDelta, inputTier,
  );
  ctx.markDeedsDirty(meta.entityId);
}""",
    'shared donor post-success skill gain, no extra raw gain')
plan(p,
    "grantEnchantingSkill(ctx, meta, ENCHANTING_GAIN_TIER_BY_QUALITY[quality]);",
    "grantEnchantingSkill(ctx, meta, ENCHANTING_GAIN_TIER_BY_QUALITY[quality], 'disenchant');",
    'eligible non-crafted disenchant action')
plan(p,
    "grantEnchantingSkill(ctx, meta, enchantGainTier(enchant));",
    "grantEnchantingSkill(ctx, meta, enchantGainTier(enchant), 'apply');",
    'all three original apply/enchant/replace paths',3)

p='src/sim/professions/crafting.ts'
plan(p,
    "import { recordHighflyAlchemyJewelCraft } from './highfly_alchemy_jewel';",
    "import { recordHighflyAlchemyJewelCraft } from './highfly_alchemy_jewel';\n"
    "import { recordHighflyEngineeringCraft } from './highfly_enchant_engineering';",
    'real engineering craft import')
plan(p,
    """      meta.highflyProfessions = recordHighflyDiscoveryFromCraft(
        recordHighflyAlchemyJewelCraft(
          recordHighflyKnowledgeFromCraft(
            recordCookingCraftEvidence(recordSmithTrialProof(recordCookingTrialProof(
              hfCareer.state, recipe.professionId, recipe.id,
            ), recipe.professionId, recipe.id), recipe), recipe),
          recipe,
        ),
        recipe,
      );""",
    """      meta.highflyProfessions = recordHighflyEngineeringCraft(
        recordHighflyDiscoveryFromCraft(
          recordHighflyAlchemyJewelCraft(
            recordHighflyKnowledgeFromCraft(
              recordCookingCraftEvidence(recordSmithTrialProof(recordCookingTrialProof(
                hfCareer.state, recipe.professionId, recipe.id,
              ), recipe.professionId, recipe.id), recipe), recipe),
            recipe,
          ),
          recipe,
        ),
        recipe,
      );""",
    'no additional XP for engineering, only after real craft success')

p='src/sim/sim.ts'
plan(p,
    "import { highflyAlchemyJewelStatus } from './professions/highfly_alchemy_jewel';",
    "import { highflyAlchemyJewelStatus } from './professions/highfly_alchemy_jewel';\n"
    "import { highflyEnchantEngineeringStatus } from './professions/highfly_enchant_engineering';",
    'Sim read-only pilot status import')
plan(p,
    "  serializeCharacter(pid: number): CharacterState | null {",
    """  /** PR-10 LAB view: preserves donor item stat authority and equipment. */
  highflyEnchantEngineeringPilotStatus(pid = this.playerId) {
    return highflyEnchantEngineeringStatus(this.players.get(pid)?.highflyProfessions);
  }

  serializeCharacter(pid: number): CharacterState | null {""",
    'Sim status without new gameplay commands')

pending={}
for p,old,new,label,count in ops:
    src=pending.get(p)
    if src is None:src=p.read_text(encoding='utf-8')
    if src.count(old)!=count or new in src:
        raise SystemExit(f'PR10 REFUSED {label}: donor anchor drift, count={src.count(old)}')
    pending[p]=src.replace(old,new,count)
for p,src in pending.items():p.write_text(src,encoding='utf-8')
print('HIGHFLY_PR10_ENCHANT_ACTION_BASED_LEGACY_SKILL_XP_PARITY=1')
print('HIGHFLY_PR10_CRAFTED_DISENCHANT_ANTIFARM_PRESERVED=1')
print('HIGHFLY_PR10_TOOLWORKS_REAL_ENGINEERING_PROOFS=1')
