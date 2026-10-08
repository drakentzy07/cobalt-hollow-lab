/**
 * HIGHFLY PR-12 — Inscription documents with canonical ClaudeCraft authority.
 *
 * Real items: tomes = EQUIPMENT; scrolls = consumable buffs; Sablewax Vellum =
 * advanced reagent; Voidbound Grimoire = high-tier gear; Deed of Making =
 * ingredient actually spent by donor's orange legendary promotion.
 *
 * NOT a magical Knowledge-transfer API. Creating/reading/trading a document
 * must not automatically teach another Hunter a Knowledge, Recipe or Skill.
 * There is no simulated grant, extra crafting XP, bonus stats or item mint.
 */
import { recipeById } from '../content/recipes';
import type { ProfessionRecipeRecord } from './types';
import type { SavedHighflyProfessionStateV1 } from './highfly_profession_state';

type DocumentRole = 'equipment_tome' | 'buff_scroll' | 'advanced_reagent' | 'promotion_deed';
export interface InscriptionAuthoredDocument {
  recipeId:string;
  role:DocumentRole;
  evidenceId:string;
  skillRequirement:number;
}

export const INSCRIPTION_REAL_DOCUMENTS:readonly InscriptionAuthoredDocument[] = [
  {recipeId:'recipe_silverleaf_primer',role:'equipment_tome',
    evidenceId:'inscription.tome.silverleaf',skillRequirement:0},
  {recipeId:'recipe_silverleaf_scroll',role:'buff_scroll',
    evidenceId:'inscription.scroll.silverleaf',skillRequirement:0},
  {recipeId:'recipe_goldleaf_folio',role:'equipment_tome',
    evidenceId:'inscription.tome.goldleaf',skillRequirement:25},
  {recipeId:'recipe_goldleaf_scroll',role:'buff_scroll',
    evidenceId:'inscription.scroll.goldleaf',skillRequirement:25},
  {recipeId:'recipe_sunpetal_grimoire',role:'equipment_tome',
    evidenceId:'inscription.tome.sunpetal',skillRequirement:50},
  {recipeId:'recipe_sunpetal_scroll',role:'buff_scroll',
    evidenceId:'inscription.scroll.sunpetal',skillRequirement:50},
  {recipeId:'recipe_sablewax_vellum',role:'advanced_reagent',
    evidenceId:'inscription.reagent.sablewax',skillRequirement:75},
  {recipeId:'recipe_voidbound_grimoire',role:'equipment_tome',
    evidenceId:'inscription.tome.voidbound',skillRequirement:100},
  {recipeId:'recipe_deed_of_making',role:'promotion_deed',
    evidenceId:'inscription.deed.making',skillRequirement:125},
];

const MAX_FIELD_ENTRIES=256, MAX_COUNT=1_000_000_000;
function addEvidence(
  s:SavedHighflyProfessionStateV1,
  id:string,
):SavedHighflyProfessionStateV1 {
  const e=s.evidence??{},prev=e[id]??0;
  if(prev>=MAX_COUNT || (!(id in e)&&Object.keys(e).length>=MAX_FIELD_ENTRIES))return s;
  return {...s,evidence:{...e,[id]:Math.min(MAX_COUNT,Math.max(0,prev)+1)}};
}
function addKnowledge(
  s:SavedHighflyProfessionStateV1,
  id:string,
):SavedHighflyProfessionStateV1 {
  const list=s.knowledge??[];
  if(list.includes(id)||list.length>=MAX_FIELD_ENTRIES)return s;
  return {...s,knowledge:[...list,id]};
}
function earned(
  s:SavedHighflyProfessionStateV1,
):SavedHighflyProfessionStateV1 {
  const e=s.evidence??{},has=(id:string)=>(e[id]??0)>=1;
  let out=s;
  if(has('inscription.tome.silverleaf')&&has('inscription.scroll.silverleaf'))
    out=addKnowledge(out,'technique.basic_inscription');
  if(has('inscription.tome.goldleaf')&&has('inscription.scroll.goldleaf'))
    out=addKnowledge(out,'technique.goldleaf_transcription');
  if(has('inscription.tome.sunpetal')&&has('inscription.scroll.sunpetal'))
    out=addKnowledge(out,'technique.sunpetal_transcription');
  if(has('inscription.reagent.sablewax'))
    out=addKnowledge(out,'material.sablewax_vellum');
  if(has('inscription.tome.voidbound')&&has('inscription.reagent.sablewax'))
    out=addKnowledge(out,'technique.voidbound_binding');
  if(has('inscription.deed.making'))
    out=addKnowledge(out,'technique.deed_of_making');
  return out;
}

/** Called after existing REAL craft commit. PR-3 already awarded eligible
 * career XP; this only records proof of actual item creation.
 * Deliberately does NOT trigger item use, trade, buffs, recipe unlock or
 * world/gear authority. */
export function recordHighflyInscriptionCraft(
  old:SavedHighflyProfessionStateV1|undefined,
  recipe:Pick<ProfessionRecipeRecord,'id'|'professionId'>,
):SavedHighflyProfessionStateV1|undefined {
  if(!old||recipe.professionId!=='inscription')return old;
  const def=INSCRIPTION_REAL_DOCUMENTS.find(d=>d.recipeId===recipe.id);
  return def?earned(addEvidence(old,def.evidenceId)):old;
}

export interface HighflyInscriptionReadout {
  tomesMade:number;buffScrollsMade:number;
  vellumMade:number;voidboundGrimoiresMade:number;deedsMade:number;
  learnedTranscription:boolean;learnedAdvancedBinding:boolean;
  knowledgeTransferImplemented:false;
  newPromotionGranted:false;
}
export function highflyInscriptionStatus(
  old:SavedHighflyProfessionStateV1|undefined,
):HighflyInscriptionReadout {
  const e=old?.evidence??{},k=old?.knowledge??[];
  const cnt=(key:string)=>e[key]??0;
  return {
    tomesMade:INSCRIPTION_REAL_DOCUMENTS.filter(d=>d.role==='equipment_tome')
      .reduce((n,d)=>n+cnt(d.evidenceId),0),
    buffScrollsMade:INSCRIPTION_REAL_DOCUMENTS.filter(d=>d.role==='buff_scroll')
      .reduce((n,d)=>n+cnt(d.evidenceId),0),
    vellumMade:cnt('inscription.reagent.sablewax'),
    voidboundGrimoiresMade:cnt('inscription.tome.voidbound'),
    deedsMade:cnt('inscription.deed.making'),
    learnedTranscription:k.includes('technique.basic_inscription'),
    learnedAdvancedBinding:k.includes('technique.voidbound_binding'),
    knowledgeTransferImplemented:false,
    newPromotionGranted:false,
  };
}

/** Frozen donor catalog must supply all actual recipes, stations and caps.
 * Important: the Deed is a 125 crafting output, NOT a free or auto-promotion.
 * No claim of knowledge-transfer functionality is made. */
export function highflyInscriptionCatalogValid():boolean {
  const ids=INSCRIPTION_REAL_DOCUMENTS.map(d=>d.recipeId);
  if(new Set(ids).size!==ids.length ||
    new Set(INSCRIPTION_REAL_DOCUMENTS.map(d=>d.evidenceId)).size!==ids.length)
    return false;
  if(!INSCRIPTION_REAL_DOCUMENTS.every(def=>{
    const r=recipeById(def.recipeId);
    return !!r&&r.professionId==='inscription'&&r.stationType==='apothecary'&&
      r.skillReq===def.skillRequirement&&!!r.resultItemId&&
      (def.role==='buff_scroll' ? r.resultItemId.endsWith('_scroll'):true);
  }))return false;
  const vellum=recipeById('recipe_sablewax_vellum');
  const grimoire=recipeById('recipe_voidbound_grimoire');
  const deed=recipeById('recipe_deed_of_making');
  return !!vellum&&!!grimoire&&!!deed &&
    vellum.reagents.some(x=>x.itemId==='quickening_catalyst'&&x.count===1) &&
    grimoire.reagents.some(x=>x.itemId==='sablewax_vellum'&&x.count===3) &&
    deed.reagents.some(x=>x.itemId==='sablewax_vellum'&&x.count===3) &&
    grimoire.acquisition?.includes('drop')===true &&
    deed.resultItemId==='deed_of_making' &&
    deed.skillReq===125;
}
