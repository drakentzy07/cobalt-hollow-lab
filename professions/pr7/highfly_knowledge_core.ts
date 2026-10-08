/**
 * HIGHFLY PR-7 — Authored Knowledge Core, small Smith + Cooking pilot.
 *
 * Knowledge is NOT knownRecipes, Recipe Patterns, Discovery or a stat wallet.
 * Source of truth: PR-1 sparse, versioned highflyProfessions.known? NO:
 * existing highflyProfessions.knowledge list. Claude's knownRecipes, skill,
 * XP, attunements, item mint and RNG never change here.
 *
 * No procedural secrets, no invented content, no hidden catalogue totals.
 * Transfer policies are authored METADATA, not a document mint/transfer API.
 */
import type { SavedHighflyProfessionStateV1 } from './highfly_profession_state';
import type { ProfessionRecipeRecord } from './types';

export const KNOWLEDGE_CATEGORIES = [
  'MATERIAL', 'SOURCE', 'TECHNIQUE', 'CREATURE',
  'WORLD', 'RECIPE', 'AFFINITY',
] as const;
export type KnowledgeCategory = typeof KNOWLEDGE_CATEGORIES[number];
export const KNOWLEDGE_TRANSFER_POLICIES = [
  'NONE', 'DOCUMENT', 'RECIPE_PATTERN', 'MENTOR',
] as const;
export type KnowledgeTransferPolicy = typeof KNOWLEDGE_TRANSFER_POLICIES[number];

export interface KnowledgeDefinition {
  id: string;
  category: KnowledgeCategory;
  professionTags: readonly string[];
  unlockConditions: {
    /** EVIDENCE keys; derived strictly from real, committed actions. */
    allEvidence?: readonly string[];
    anyEvidence?: readonly string[];
  };
  transferPolicy: KnowledgeTransferPolicy;
  /** Informational catalog refs ONLY — no actual recipe acquisition. */
  reveals?: readonly string[];
}

const PREFIX = 'knowledge.craft.';
export const KNOWLEDGE_CRAFT_PROOF_IDS = [
  'recipe_eastbrook_arming_sword',
  'recipe_copper_bearded_axe',
  'recipe_eastbrook_chain_vest',
  'recipe_eastbrook_warded_leggings',
] as const;
const KEYS: Record<string,string> = Object.fromEntries(
  KNOWLEDGE_CRAFT_PROOF_IDS.map(id=>[id,`${PREFIX}${id}`]),
);

export const HIGHFLY_KNOWLEDGE_PILOT: readonly KnowledgeDefinition[] = [
  {
    id:'material.copper_ore', category:'MATERIAL',
    professionTags:['weaponcrafting','armorcrafting'], transferPolicy:'DOCUMENT',
    unlockConditions:{anyEvidence:[
      KEYS.recipe_copper_bearded_axe,KEYS.recipe_eastbrook_chain_vest,
    ]},reveals:['material.copper_ore'],
  },
  {
    id:'technique.basic_forging',category:'TECHNIQUE',
    professionTags:['weaponcrafting'], transferPolicy:'MENTOR',
    unlockConditions:{allEvidence:[
      KEYS.recipe_eastbrook_arming_sword,KEYS.recipe_copper_bearded_axe,
    ]},
  },
  {
    id:'technique.basic_armoring',category:'TECHNIQUE',
    professionTags:['armorcrafting'],transferPolicy:'MENTOR',
    unlockConditions:{allEvidence:[
      KEYS.recipe_eastbrook_chain_vest,KEYS.recipe_eastbrook_warded_leggings,
    ]},
  },
  {
    id:'source.river_perch',category:'SOURCE',
    professionTags:['cooking'],transferPolicy:'DOCUMENT',
    unlockConditions:{allEvidence:['cooking.source.fishing']},
  },
  {
    id:'source.monster_provisions',category:'SOURCE',
    professionTags:['cooking'],transferPolicy:'NONE',
    unlockConditions:{allEvidence:['cooking.source.monster']},
  },
  {
    id:'source.farm_produce',category:'SOURCE',
    professionTags:['cooking'],transferPolicy:'DOCUMENT',
    unlockConditions:{allEvidence:['cooking.source.farming']},
  },
  {
    id:'technique.diverse_provisions',category:'TECHNIQUE',
    professionTags:['cooking'],transferPolicy:'MENTOR',
    unlockConditions:{allEvidence:[
      'cooking.source.farming','cooking.source.fishing','cooking.source.monster',
    ]},
  },
];

const MAX_EVIDENCE_KEYS=256;
const MAX_KNOWLEDGE=256;

function addEarnedRecipeProof(
  career: SavedHighflyProfessionStateV1,
  recipe: Pick<ProfessionRecipeRecord,'id'|'professionId'>,
): SavedHighflyProfessionStateV1 {
  const key = KEYS[recipe.id];
  if (!key || career.evidence?.[key] === 1) return career;
  const requiredProfession = recipe.id === 'recipe_eastbrook_arming_sword' ||
    recipe.id === 'recipe_copper_bearded_axe' ? 'weaponcrafting' : 'armorcrafting';
  if (recipe.professionId !== requiredProfession) return career;
  const evidence={...(career.evidence??{})};
  if (Object.keys(evidence).length>=MAX_EVIDENCE_KEYS) return career;
  evidence[key]=1; // one-time learning proof, not repeatable craft XP
  return {...career,evidence};
}

function earned(def: KnowledgeDefinition, evidence: Record<string,number>): boolean {
  const all=def.unlockConditions.allEvidence;
  const any=def.unlockConditions.anyEvidence;
  if (!all?.length && !any?.length) return false;
  if (all?.length && !all.every(key=>(evidence[key]??0)>=1)) return false;
  if (any?.length && !any.some(key=>(evidence[key]??0)>=1)) return false;
  return true;
}

/** Called AFTER one real, successful craft. Deterministic and RNG-free. */
export function recordHighflyKnowledgeFromCraft(
  existing: SavedHighflyProfessionStateV1 | undefined,
  recipe: Pick<ProfessionRecipeRecord,'id'|'professionId'>,
): SavedHighflyProfessionStateV1 | undefined {
  if (!existing) return undefined;
  const afterProof=addEarnedRecipeProof(existing,recipe);
  const available=afterProof.evidence??{};
  const knowledge=[...(afterProof.knowledge??[])];
  let added=false;
  for(const def of HIGHFLY_KNOWLEDGE_PILOT) {
    if (knowledge.includes(def.id) || !earned(def,available)) continue;
    if(knowledge.length>=MAX_KNOWLEDGE) break;
    knowledge.push(def.id);
    added=true;
  }
  return added ? {...afterProof,knowledge} : afterProof;
}

export interface KnowledgeReadout {
  /** Only previously acquired knowledge — never expose secret total. */
  learned: {id:string;category:KnowledgeCategory;transferPolicy:KnowledgeTransferPolicy}[];
  learnedCount:number;
}

/** Public-facing safe readout: no undiscovered entries/counts. */
export function highflyKnowledgeReadout(
  career: SavedHighflyProfessionStateV1 | undefined,
): KnowledgeReadout {
  const learned=HIGHFLY_KNOWLEDGE_PILOT.filter(def=>career?.knowledge?.includes(def.id))
    .map(def=>({id:def.id,category:def.category,transferPolicy:def.transferPolicy}));
  return {learned,learnedCount:career?.knowledge?.length??0};
}

/** Integrity check: authoring mistakes fail CI, never hide impossible gates. */
export function highflyKnowledgeCatalogValid(): boolean {
  const ids=HIGHFLY_KNOWLEDGE_PILOT.map(def=>def.id);
  if(new Set(ids).size!==ids.length) return false;
  return HIGHFLY_KNOWLEDGE_PILOT.every(def=>
    KNOWLEDGE_CATEGORIES.includes(def.category) &&
    KNOWLEDGE_TRANSFER_POLICIES.includes(def.transferPolicy) &&
    def.professionTags.length>0 &&
    !!(def.unlockConditions.allEvidence?.length || def.unlockConditions.anyEvidence?.length) &&
    [...(def.unlockConditions.allEvidence??[]),...(def.unlockConditions.anyEvidence??[])]
      .every(key=>typeof key==='string'&&key.length>0&&key.length<=128));
}
