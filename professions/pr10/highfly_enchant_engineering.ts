/**
 * HIGHFLY PR-10: authentic ENCHANTING actions + ENGINEERING mechanisms.
 *
 * Reuse donor successful-action call sites only. A craft → enchant →
 * disenchant laundering attempt must NEVER earn Enchanting career progress:
 * donor already skips grantEnchantingSkill for crafted-provenance victims.
 *
 * PR-10 never touches weapon stat payloads, RNG, material yields, formulas,
 * equipment, Hunter XP, STR/AGI/VIT/PER/INT or equipment's derived stats.
 * Recipe acquisition stays in Claude's knownRecipes.
 */
import { recipeById } from '../content/recipes';
import type { ProfessionRecipeRecord } from './types';
import type { SavedHighflyProfessionStateV1 } from './highfly_profession_state';
import { recordHighflyProfessionProgress } from './highfly_profession_progress';

export type EnchantAction = 'disenchant' | 'apply';

export const ENGINEERING_REAL_CHAIN = {
  cogwheel:'recipe_cogwheel_blank',
  ocular:'recipe_copperlens_ocular',
  pick:'recipe_thorium_mining_pick',
  chassis:'recipe_precision_chassis',
} as const;

const ENGINEERING_PROOFS: Readonly<Record<string,string>> = {
  recipe_cogwheel_blank:'engineering.mechanism.cogwheel',
  recipe_copperlens_ocular:'engineering.mechanism.ocular',
  recipe_thorium_mining_pick:'engineering.tool.thorium_pick',
  recipe_precision_chassis:'engineering.infrastructure.precision_chassis',
};
const PROOF_CAP = 256;
const ACTION_COUNT_CAP = 1_000_000_000;

function addEvidence(
  existing:SavedHighflyProfessionStateV1,
  key:string,
):SavedHighflyProfessionStateV1 {
  const prev=existing.evidence?.[key]??0;
  if(prev>=ACTION_COUNT_CAP)return existing;
  if(!(key in (existing.evidence??{})) &&
    Object.keys(existing.evidence??{}).length>=PROOF_CAP)return existing;
  return {...existing,evidence:{
    ...(existing.evidence??{}),
    [key]:Math.min(ACTION_COUNT_CAP,Math.max(0,prev)+1),
  }};
}
function addKnowledge(
  existing:SavedHighflyProfessionStateV1,
  knowledgeId:string,
):SavedHighflyProfessionStateV1 {
  if(existing.knowledge?.includes(knowledgeId))return existing;
  if((existing.knowledge?.length??0)>=PROOF_CAP)return existing;
  return {...existing,knowledge:[...(existing.knowledge??[]),knowledgeId]};
}

function earnedKnowledge(state:SavedHighflyProfessionStateV1):SavedHighflyProfessionStateV1 {
  const e=state.evidence??{};
  let next=state;
  if((e['enchanting.action.disenchant']??0)>0)
    next=addKnowledge(next,'technique.arcane_salvage');
  if((e['enchanting.action.disenchant']??0)>0 &&
    (e['enchanting.action.apply']??0)>0)
    next=addKnowledge(next,'technique.basic_enchanting');
  if((e['engineering.mechanism.cogwheel']??0)>0 &&
    (e['engineering.mechanism.ocular']??0)>0)
    next=addKnowledge(next,'technique.mechanical_assembly');
  if((e['engineering.infrastructure.precision_chassis']??0)>0 &&
    (e['engineering.mechanism.cogwheel']??0)>0)
    next=addKnowledge(next,'technique.precision_chassis');
  return next;
}

/**
 * Called once, exclusively by Claude's existing grantEnchantingSkill. That
 * function fires only AFTER an enchanting action commits. Input tier comes
 * from donor quality/enchant reagent ladder; zero delta is "gray": action
 * still counts Practice but awards ZERO XP, exactly like PR-3 crafting.
 *
 * Teaching an enchanting action does not add a second raw enchant skill gain.
 */
export function recordHighflyEnchantAction(
  old:SavedHighflyProfessionStateV1|undefined,
  action:EnchantAction,
  donorSkillDelta:number,
  inputTier:number,
):SavedHighflyProfessionStateV1|undefined {
  if(!Number.isInteger(inputTier)||inputTier<0||inputTier>4)return old;
  if(!Number.isFinite(donorSkillDelta)||donorSkillDelta<0)return old;
  const earned=recordHighflyProfessionProgress(old,{
    professionId:'enchanting',
    skillDelta:donorSkillDelta,
    practiceKey:`action:${action}:tier:${inputTier}`,
  }).state;
  if(!earned)return old;
  return earnedKnowledge(addEvidence(earned,`enchanting.action.${action}`));
}

/** Engineering success-only supplement; PR-3 already awards its craft XP.
 * This must NOT call the career XP bridge again (double-credit). */
export function recordHighflyEngineeringCraft(
  old:SavedHighflyProfessionStateV1|undefined,
  recipe:Pick<ProfessionRecipeRecord,'id'|'professionId'>,
):SavedHighflyProfessionStateV1|undefined {
  if(!old||recipe.professionId!=='engineering')return old;
  const key=ENGINEERING_PROOFS[recipe.id];
  return key?earnedKnowledge(addEvidence(old,key)):old;
}

export interface EnchantEngineeringStatus {
  enchanting:{
    disenchants:number;
    appliedEnchantments:number;
    practiceTracked:number;
    knowsEnchantmentProcess:boolean;
  };
  engineering:{
    cogwheels:number;
    ocularDevices:number;
    thoriumPicks:number;
    precisionChassis:number;
    knowsMechanisms:boolean;
  };
  extraEnchantStatsGranted:false;
  newGemSocketsGranted:false;
}
/** Read-only LAB profile; nothing unlocked by simply opening this surface. */
export function highflyEnchantEngineeringStatus(
  career:SavedHighflyProfessionStateV1|undefined,
):EnchantEngineeringStatus {
  const e=career?.evidence??{},k=career?.knowledge??[],p=career?.practice??{};
  return {
    enchanting:{
      disenchants:e['enchanting.action.disenchant']??0,
      appliedEnchantments:e['enchanting.action.apply']??0,
      practiceTracked:Object.entries(p).reduce((total,[id,count])=>
        id.startsWith('action:')?total+count:total,0),
      knowsEnchantmentProcess:k.includes('technique.basic_enchanting'),
    },
    engineering:{
      cogwheels:e['engineering.mechanism.cogwheel']??0,
      ocularDevices:e['engineering.mechanism.ocular']??0,
      thoriumPicks:e['engineering.tool.thorium_pick']??0,
      precisionChassis:e['engineering.infrastructure.precision_chassis']??0,
      knowsMechanisms:k.includes('technique.mechanical_assembly'),
    },
    extraEnchantStatsGranted:false,
    newGemSocketsGranted:false,
  };
}

/** Cross-check catalog IDs/ingredient links against the actual donor.
 * The precision chassis is NOT free or an independent recipe shortcut. */
export function highflyEngineeringChainValid():boolean {
  const cog=recipeById(ENGINEERING_REAL_CHAIN.cogwheel);
  const eye=recipeById(ENGINEERING_REAL_CHAIN.ocular);
  const pick=recipeById(ENGINEERING_REAL_CHAIN.pick);
  const chassis=recipeById(ENGINEERING_REAL_CHAIN.chassis);
  return !!cog&&!!eye&&!!pick&&!!chassis &&
    [cog,eye,pick,chassis].every(r=>r.professionId==='engineering'&&
      r.stationType==='toolworks') &&
    cog.skillReq===0 &&
    eye.skillReq===25 &&
    eye.reagents.some(r=>r.itemId==='cogwheel_blank'&&r.count===1) &&
    pick.skillReq===75 &&
    chassis.skillReq===75 &&
    chassis.reagents.some(r=>r.itemId==='quickening_catalyst'&&r.count===1) &&
    chassis.reagents.some(r=>r.itemId==='cogwheel_blank'&&r.count===1);
}
