/**
 * HIGHFLY PROFESSIONS PR-9 — Alchemy + Jewelcrafting (Catalyst → Prismglass).
 *
 * Reuses Claude's canonical recipe outputs/ingredients, apothecary/forge,
 * daily catalyst guard, craftSkills, Practice, Character XP and world RNG.
 * Adds only post-success, sparse EVIDENCE and earned MATERIAL Knowledge to
 * the already versioned PR-1 character save. No recipe grants, extra loot,
 * gem core, socket engine, stats or new consumable mechanics.
 */
import { recipeById } from '../content/recipes';
import type { ProfessionRecipeRecord } from './types';
import type { SavedHighflyProfessionStateV1 } from './highfly_profession_state';

export const ALCHEMY_JEWEL_PILOT = {
  alchemy: {
    firstPotion: 'recipe_minor_healing_potion',
    catalyst: 'recipe_quickening_catalyst',
    cauldron: 'recipe_grand_cauldron',
    station: 'apothecary',
  },
  jewelcrafting: {
    copperBand: 'recipe_hammered_copper_band',
    copperLoop: 'recipe_polished_copper_loop',
    setting: 'recipe_prismglass_setting',
    advancedLoop: 'recipe_prismglass_loop',
    station: 'forge',
  },
} as const;

type PilotCraft = 'alchemy' | 'jewelcrafting';
type PilotProof = {
  professionId: PilotCraft;
  recipeId: string;
  evidenceId: string;
};

/** Exact real recipe IDs, NOT heuristic recipe/material-name searches. */
const PILOT_PROOFS: readonly PilotProof[] = [
  {professionId:'alchemy',recipeId:'recipe_minor_healing_potion',
    evidenceId:'alchemy.brewing.minor_healing_potion'},
  {professionId:'alchemy',recipeId:'recipe_quickening_catalyst',
    evidenceId:'alchemy.catalyst.quickening_crafted'},
  {professionId:'jewelcrafting',recipeId:'recipe_hammered_copper_band',
    evidenceId:'jewelcrafting.copper.band_crafted'},
  {professionId:'jewelcrafting',recipeId:'recipe_polished_copper_loop',
    evidenceId:'jewelcrafting.copper.loop_crafted'},
  {professionId:'jewelcrafting',recipeId:'recipe_prismglass_setting',
    evidenceId:'jewelcrafting.prismglass.setting_crafted'},
  {professionId:'jewelcrafting',recipeId:'recipe_prismglass_loop',
    evidenceId:'jewelcrafting.prismglass.loop_crafted'},
];

interface AuthoredMaterialKnowledge {
  id: string;
  /** At least one real crafted proof, never a bought material alone. */
  anyEvidence?: readonly string[];
  allEvidence?: readonly string[];
}
const MATERIAL_KNOWLEDGE: readonly AuthoredMaterialKnowledge[] = [
  {id:'material.silverleaf_herb',
    anyEvidence:['alchemy.brewing.minor_healing_potion']},
  {id:'technique.basic_alchemy',
    allEvidence:['alchemy.brewing.minor_healing_potion']},
  {id:'material.quickening_catalyst',
    allEvidence:['alchemy.catalyst.quickening_crafted']},
  {id:'technique.quickening_catalysis',
    allEvidence:['alchemy.catalyst.quickening_crafted']},
  {id:'technique.copper_jewelry',
    allEvidence:['jewelcrafting.copper.band_crafted','jewelcrafting.copper.loop_crafted']},
  {id:'material.prismglass_setting',
    allEvidence:['jewelcrafting.prismglass.setting_crafted']},
  {id:'technique.prismglass_setting',
    allEvidence:['jewelcrafting.prismglass.setting_crafted',
      'jewelcrafting.copper.band_crafted']},
];

/** Storage caps inherited from PR-1, with no defaults for old save files. */
const MAX_FIELDS = 256;
const MAX_EVIDENCE = 1_000_000_000;
function withProofs(
  old: SavedHighflyProfessionStateV1,
  recipe: Pick<ProfessionRecipeRecord,'id'|'professionId'>,
): SavedHighflyProfessionStateV1 {
  const def=PILOT_PROOFS.find(p=>p.recipeId===recipe.id &&
    p.professionId===recipe.professionId);
  if(!def) return old;
  const previous=old.evidence?.[def.evidenceId]??0;
  if(previous>=MAX_EVIDENCE) return old;
  if(!(def.evidenceId in (old.evidence??{})) &&
    Object.keys(old.evidence??{}).length>=MAX_FIELDS) return old;
  return {...old,evidence:{
    ...(old.evidence??{}),
    [def.evidenceId]:Math.min(MAX_EVIDENCE,Math.max(0,previous)+1),
  }};
}

function qualifies(def:AuthoredMaterialKnowledge,e:Record<string,number>):boolean {
  const all=def.allEvidence,any=def.anyEvidence;
  if(!all?.length&&!any?.length)return false;
  return (!all?.length||all.every(k=>(e[k]??0)>=1)) &&
    (!any?.length||any.some(k=>(e[k]??0)>=1));
}

/** Must be called only after real successful craft commit + existing
 * Knowledge/Discovery hooks. Does not call RNG, mutate recipe or make items. */
export function recordHighflyAlchemyJewelCraft(
  current: SavedHighflyProfessionStateV1 | undefined,
  recipe: Pick<ProfessionRecipeRecord,'id'|'professionId'>,
):SavedHighflyProfessionStateV1 | undefined {
  if(!current) return undefined;
  const proofed=withProofs(current,recipe);
  if(proofed===current)return current;
  const known=[...(proofed.knowledge??[])];
  const evidence=proofed.evidence??{};
  let changed=false;
  for(const def of MATERIAL_KNOWLEDGE) {
    if(known.includes(def.id)||!qualifies(def,evidence)) continue;
    if(known.length>=MAX_FIELDS)break;
    known.push(def.id);
    changed=true;
  }
  return changed?{...proofed,knowledge:known}:proofed;
}

export interface AlchemyJewelReadout {
  alchemy: {
    firstBrews:number;
    catalystsCreated:number;
    knowsCatalyticTechnique:boolean;
  };
  jewelcrafting: {
    copperBands:number;
    copperLoops:number;
    prismglassSettings:number;
    advancedPrismglassLoops:number;
    knowsPrismglassTechnique:boolean;
  };
  gemCoreImplemented:false;
  socketEngineImplemented:false;
}

/** Reads only earned facts; avoid leaked secret totals or fake Gem Core. */
export function highflyAlchemyJewelStatus(
  career:SavedHighflyProfessionStateV1|undefined,
):AlchemyJewelReadout {
  const e=career?.evidence??{},k=career?.knowledge??[];
  return {
    alchemy:{
      firstBrews:e['alchemy.brewing.minor_healing_potion']??0,
      catalystsCreated:e['alchemy.catalyst.quickening_crafted']??0,
      knowsCatalyticTechnique:k.includes('technique.quickening_catalysis'),
    },
    jewelcrafting:{
      copperBands:e['jewelcrafting.copper.band_crafted']??0,
      copperLoops:e['jewelcrafting.copper.loop_crafted']??0,
      prismglassSettings:e['jewelcrafting.prismglass.setting_crafted']??0,
      advancedPrismglassLoops:e['jewelcrafting.prismglass.loop_crafted']??0,
      knowsPrismglassTechnique:k.includes('technique.prismglass_setting'),
    },
    gemCoreImplemented:false,
    socketEngineImplemented:false,
  };
}

/** Ensure real pre-existing chained recipes carry proper inputs, skill and
 * stations. Fails closed in CI if upstream donor content drifts. */
export function highflyAlchemyJewelCatalogValid():boolean {
  const catalyst=recipeById(ALCHEMY_JEWEL_PILOT.alchemy.catalyst);
  const setting=recipeById(ALCHEMY_JEWEL_PILOT.jewelcrafting.setting);
  const loop=recipeById(ALCHEMY_JEWEL_PILOT.jewelcrafting.advancedLoop);
  const real=([...PILOT_PROOFS].every(p=>{
    const r=recipeById(p.recipeId);
    return r?.professionId===p.professionId;
  }));
  return real &&
    catalyst?.professionId==='alchemy' &&
    catalyst.resultItemId==='quickening_catalyst' &&
    catalyst.stationType==='apothecary' &&
    catalyst.skillReq===75 && catalyst.oncePerDay===true &&
    setting?.professionId==='jewelcrafting' &&
    setting.stationType==='forge' &&
    setting.resultItemId==='prismglass_setting' &&
    setting.skillReq===75 &&
    setting.reagents.some(r=>r.itemId==='quickening_catalyst'&&r.count===1) &&
    loop?.reagents.some(r=>r.itemId==='prismglass_setting'&&r.count===3) === true;
}
