/**
 * HIGHFLY PR-11 — Leatherworking & Tailoring pilot over the REAL ClaudeCraft
 * tannery/loom, existing equipment, reagent sources and bag capacities.
 *
 * Success-only EVIDENCE and authored Knowledge. Does NOT create new items,
 * recipes, bag slots, NPCs, equipment visuals, loot, raw craft skill or XP.
 * PR-3 remains the sole successful-craft XP/Practice writer.
 */
import { recipeById } from '../content/recipes';
import type { ProfessionRecipeRecord } from './types';
import type { SavedHighflyProfessionStateV1 } from './highfly_profession_state';

type LeatherTextileProfession = 'leatherworking' | 'tailoring';
type AuthoredCraftProof = {
  profession: LeatherTextileProfession;
  recipeId: string;
  evidenceKey: string;
  station: 'tannery' | 'loom';
  minSkill: number;
};
export const LEATHER_TEXTILE_PILOT: readonly AuthoredCraftProof[] = [
  {profession:'leatherworking',recipeId:'recipe_fenbridge_hide_boots',
    evidenceKey:'leatherworking.hide.boots',station:'tannery',minSkill:0},
  {profession:'leatherworking',recipeId:'recipe_fenbridge_hide_leggings',
    evidenceKey:'leatherworking.hide.leggings',station:'tannery',minSkill:0},
  {profession:'leatherworking',recipeId:'recipe_marshstalker_jerkin',
    evidenceKey:'leatherworking.hide.marshstalker',station:'tannery',minSkill:25},
  {profession:'leatherworking',recipeId:'recipe_wyrmhide_cording',
    evidenceKey:'leatherworking.material.wyrmhide_cording',station:'tannery',minSkill:75},
  {profession:'leatherworking',recipeId:'recipe_briarstep_jerkin',
    evidenceKey:'leatherworking.hide.briarstep',station:'tannery',minSkill:100},
  {profession:'tailoring',recipeId:'recipe_homespun_hood',
    evidenceKey:'tailoring.cloth.hood',station:'loom',minSkill:0},
  {profession:'tailoring',recipeId:'recipe_homespun_mitts',
    evidenceKey:'tailoring.cloth.mitts',station:'loom',minSkill:0},
  {profession:'tailoring',recipeId:'recipe_silkspun_satchel',
    evidenceKey:'tailoring.bag.silkspun',station:'loom',minSkill:25},
  {profession:'tailoring',recipeId:'recipe_duskweave_bag',
    evidenceKey:'tailoring.bag.duskweave',station:'loom',minSkill:50},
  {profession:'tailoring',recipeId:'recipe_resonant_weave_bag',
    evidenceKey:'tailoring.bag.resonant',station:'loom',minSkill:50},
  {profession:'tailoring',recipeId:'recipe_loombound_reagent_satchel',
    evidenceKey:'tailoring.bag.reagent',station:'loom',minSkill:50},
  {profession:'tailoring',recipeId:'recipe_sunspun_bolt',
    evidenceKey:'tailoring.material.sunspun_bolt',station:'loom',minSkill:75},
];
type Material = 'rough_hide'|'pristine_hide'|'spider_silk'|'pristine_silk'|'wyrmfall_core';
const MATERIALS: readonly Material[] = [
  'rough_hide','pristine_hide','spider_silk','pristine_silk','wyrmfall_core',
];
const MAX_EVIDENCE_ENTRIES = 256;
const MAX_KNOWLEDGE_ENTRIES = 256;
const MAX_COUNT = 1_000_000_000;

function addProof(
  s: SavedHighflyProfessionStateV1,
  key: string,
):SavedHighflyProfessionStateV1 {
  const e=s.evidence??{},prior=e[key]??0;
  if(prior>=MAX_COUNT)return s;
  if(!(key in e)&&Object.keys(e).length>=MAX_EVIDENCE_ENTRIES)return s;
  return {...s,evidence:{...e,[key]:Math.min(MAX_COUNT,Math.max(0,prior)+1)}};
}
function addKnowledge(
  s:SavedHighflyProfessionStateV1,
  id:string,
):SavedHighflyProfessionStateV1 {
  if(s.knowledge?.includes(id)||(s.knowledge?.length??0)>=MAX_KNOWLEDGE_ENTRIES)
    return s;
  return {...s,knowledge:[...(s.knowledge??[]),id]};
}
function evaluateAuthoredKnowledge(state:SavedHighflyProfessionStateV1):SavedHighflyProfessionStateV1 {
  const e=state.evidence??{};
  const has=(id:string)=>(e[id]??0)>=1;
  let out=state;
  if(has('leatherworking.hide.boots')&&has('leatherworking.hide.leggings'))
    out=addKnowledge(out,'technique.basic_leatherworking');
  if(has('tailoring.cloth.hood')&&has('tailoring.cloth.mitts'))
    out=addKnowledge(out,'technique.basic_tailoring');
  if(has('tailoring.bag.silkspun')&&has('tailoring.bag.duskweave'))
    out=addKnowledge(out,'technique.bag_construction');
  if(has('leatherworking.material.wyrmhide_cording'))
    out=addKnowledge(out,'material.wyrmhide_cording');
  if(has('tailoring.material.sunspun_bolt'))
    out=addKnowledge(out,'material.sunspun_bolt');
  return out;
}

/** NOT gathering credit. Only indicates materials actually spent on a
 * successful recipe, not whether they were looted from monsters/farmed.
 * Source provenance remains the separately certified harvesting systems. */
export function recordHighflyLeatherTextileCraft(
  current:SavedHighflyProfessionStateV1|undefined,
  recipe:Pick<ProfessionRecipeRecord,'id'|'professionId'|'reagents'>,
):SavedHighflyProfessionStateV1|undefined {
  if(!current||(recipe.professionId!=='leatherworking'&&recipe.professionId!=='tailoring'))
    return current;
  const def=LEATHER_TEXTILE_PILOT.find(x=>x.recipeId===recipe.id&&x.profession===recipe.professionId);
  if(!def)return current;
  let state=addProof(current,def.evidenceKey);
  const actualMaterials=new Set(recipe.reagents.map(r=>r.itemId));
  for(const itemId of MATERIALS) {
    if(actualMaterials.has(itemId))
      state=addProof(state,`textile.material_used.${itemId}`);
  }
  return evaluateAuthoredKnowledge(state);
}

export interface LeatherTextileStatus {
  leatherworking:{completedPilotCrafts:number;basicTechniqueKnown:boolean;
    wyrmhideCording:number};
  tailoring:{completedPilotCrafts:number;bagsCrafted:number;
    basicTechniqueKnown:boolean;bagConstructionKnown:boolean};
  materialsUsed:Record<Material,number>;
  extraBagCapacityGranted:0;
  newEquipmentVisualsGranted:false;
}
export function highflyLeatherTextileStatus(
  career:SavedHighflyProfessionStateV1|undefined,
):LeatherTextileStatus {
  const e=career?.evidence??{},k=career?.knowledge??[];
  const count=(id:string)=>e[id]??0;
  return {
    leatherworking:{
      completedPilotCrafts:LEATHER_TEXTILE_PILOT.filter(d=>d.profession==='leatherworking')
        .reduce((total,d)=>total+count(d.evidenceKey),0),
      basicTechniqueKnown:k.includes('technique.basic_leatherworking'),
      wyrmhideCording:count('leatherworking.material.wyrmhide_cording'),
    },
    tailoring:{
      completedPilotCrafts:LEATHER_TEXTILE_PILOT.filter(d=>d.profession==='tailoring')
        .reduce((total,d)=>total+count(d.evidenceKey),0),
      bagsCrafted:LEATHER_TEXTILE_PILOT.filter(d=>d.evidenceKey.startsWith('tailoring.bag.'))
        .reduce((total,d)=>total+count(d.evidenceKey),0),
      basicTechniqueKnown:k.includes('technique.basic_tailoring'),
      bagConstructionKnown:k.includes('technique.bag_construction'),
    },
    materialsUsed:Object.fromEntries(MATERIALS.map(id=>[id,count(`textile.material_used.${id}`)]))
      as Record<Material,number>,
    extraBagCapacityGranted:0,newEquipmentVisualsGranted:false,
  };
}

/** Fail CI if the frozen donor's authored recipe/station/skill is different.
 * No changes to real bag slot caps; those are ItemDefs and bag/equip APIs. */
export function highflyLeatherTextileCatalogValid():boolean {
  const ids=LEATHER_TEXTILE_PILOT.map(x=>x.recipeId),proofs=LEATHER_TEXTILE_PILOT.map(x=>x.evidenceKey);
  if(new Set(ids).size!==ids.length||new Set(proofs).size!==proofs.length)return false;
  return LEATHER_TEXTILE_PILOT.every(d=>{
    const r=recipeById(d.recipeId);
    return !!r&&r.professionId===d.profession&&r.stationType===d.station&&
      r.skillReq===d.minSkill&&!!r.resultItemId;
  }) &&
  recipeById('recipe_silkspun_satchel')?.resultItemId==='silkspun_satchel' &&
  recipeById('recipe_resonant_weave_bag')?.resultItemId==='resonant_weave_bag' &&
  recipeById('recipe_wyrmhide_cording')?.reagents.some(r=>r.itemId==='quickening_catalyst')===true;
}
