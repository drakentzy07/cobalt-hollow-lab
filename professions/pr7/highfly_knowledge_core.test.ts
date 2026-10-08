import { describe, expect, it } from 'vitest';
import { recipeById } from '../src/sim/content/recipes';
import { STATIONS } from '../src/sim/data';
import { resolveCraft } from '../src/sim/professions/crafting';
import { stationsOfType } from '../src/sim/professions/stations';
import {
  KNOWLEDGE_CATEGORIES,KNOWLEDGE_TRANSFER_POLICIES,
  HIGHFLY_KNOWLEDGE_PILOT,highflyKnowledgeCatalogValid,
  highflyKnowledgeReadout,recordHighflyKnowledgeFromCraft,
} from '../src/sim/professions/highfly_knowledge_core';
import { Sim,type PlayerMeta } from '../src/sim/sim';

function craft(sim:Sim,recipeId:string,pid=sim.playerId) {
  const recipe=recipeById(recipeId)!;
  expect(recipe).toBeTruthy();
  const meta=sim.players.get(pid) as PlayerMeta;
  if(recipe.acquisition?.includes('trainer'))meta.knownRecipes.add(recipe.id);
  if(recipe.stationType){
    const station=stationsOfType(STATIONS,recipe.stationType)[0];
    expect(station).toBeTruthy();
    const p=sim.entities.get(pid)!;
    p.pos.x=station.pos.x;p.pos.z=station.pos.z;p.prevPos={...p.pos};
  }
  for(const r of recipe.reagents)sim.addItem(r.itemId,r.count,pid);
  return resolveCraft(sim.ctx,pid,recipeId);
}
const create=(seed:number)=>new Sim({seed,playerClass:'warrior',autoEquip:false});

describe('HIGHFLY PR-7: verified Smith+Cooking Knowledge separate from recipes',()=>{
  it('has all seven authored categories, four transfer policies, and valid pilot',()=>{
    expect(KNOWLEDGE_CATEGORIES).toEqual([
      'MATERIAL','SOURCE','TECHNIQUE','CREATURE','WORLD','RECIPE','AFFINITY']);
    expect(KNOWLEDGE_TRANSFER_POLICIES)
      .toEqual(['NONE','DOCUMENT','RECIPE_PATTERN','MENTOR']);
    expect(highflyKnowledgeCatalogValid()).toBe(true);
    expect(HIGHFLY_KNOWLEDGE_PILOT.map(d=>d.id))
      .toEqual([...new Set(HIGHFLY_KNOWLEDGE_PILOT.map(d=>d.id))]);
  });

  it('does not expose unlearned Knowledge or a hidden total',()=>{
    expect(highflyKnowledgeReadout(undefined)).toEqual({learned:[],learnedCount:0});
    const partial=highflyKnowledgeReadout({version:1,knowledge:['source.river_perch']});
    expect(partial.learned).toEqual([{
      id:'source.river_perch',category:'SOURCE',transferPolicy:'DOCUMENT',
    }]);
    expect(partial.learnedCount).toBe(1);
    expect(Object.keys(partial)).not.toContain('totalAvailable');
  });

  it('a rejected craft or blank old career cannot secretly grant Knowledge',()=>{
    const r=recipeById('recipe_eastbrook_arming_sword')!;
    expect(recordHighflyKnowledgeFromCraft(undefined,r)).toBeUndefined();
    const sim=create(701),pid=sim.playerId;
    expect(resolveCraft(sim.ctx,pid,r.id).ok).toBe(false);
    expect(sim.serializeCharacter(pid)?.highflyProfessions).toBeUndefined();
    expect(sim.highflyKnowledgeStatus().learnedCount).toBe(0);
  });

  it('real weapon crafting learns MATERIAL copper and TECHNIQUE only after two recipes',()=>{
    const sim=create(702),pid=sim.playerId;
    expect(craft(sim,'recipe_eastbrook_arming_sword').ok).toBe(true);
    let got=sim.highflyKnowledgeStatus().learned.map(k=>k.id);
    expect(got).not.toContain('technique.basic_forging');
    expect(got).not.toContain('material.copper_ore');
    expect(craft(sim,'recipe_copper_bearded_axe').ok).toBe(true);
    got=sim.highflyKnowledgeStatus().learned.map(k=>k.id);
    expect(got).toContain('material.copper_ore');
    expect(got).toContain('technique.basic_forging');
    expect(got).not.toContain('technique.basic_armoring');
    const first=sim.serializeCharacter(pid)!.highflyProfessions?.knowledge;
    expect(craft(sim,'recipe_copper_bearded_axe').ok).toBe(true);
    expect(sim.serializeCharacter(pid)!.highflyProfessions?.knowledge).toEqual(first);
  });

  it('real armor recipes learn basic armoring separately from weapon smithing',()=>{
    const sim=create(703);
    expect(craft(sim,'recipe_eastbrook_chain_vest').ok).toBe(true);
    expect(craft(sim,'recipe_eastbrook_warded_leggings').ok).toBe(true);
    const got=sim.highflyKnowledgeStatus().learned.map(k=>k.id);
    expect(got).toContain('material.copper_ore');
    expect(got).toContain('technique.basic_armoring');
    expect(got).not.toContain('technique.basic_forging');
  });

  it('real fishing and monster cooking teach source Knowledge, not Recipe acquisition',()=>{
    const sim=create(704),pid=sim.playerId;
    expect(craft(sim,'recipe_pan_seared_perch').ok).toBe(true);
    expect(craft(sim,'recipe_tough_jerky').ok).toBe(true);
    const got=sim.highflyKnowledgeStatus().learned.map(k=>k.id);
    expect(got).toContain('source.river_perch');
    expect(got).toContain('source.monster_provisions');
    expect(got).not.toContain('source.farm_produce');
    expect(got).not.toContain('technique.diverse_provisions');
    const saved=sim.serializeCharacter(pid)!;
    expect(saved.knownRecipes).toContain('recipe_pan_seared_perch');
    expect(saved.highflyProfessions?.knowledge).toContain('source.river_perch');
    expect(saved.knownRecipes).not.toContain('recipe_laden_hearth');
  });

  it('real farm cooking completes deterministic three-source provisioning Knowledge',()=>{
    const sim=create(705);
    expect(craft(sim,'recipe_eastbrook_glazed_carrots').ok).toBe(true);
    expect(craft(sim,'recipe_tough_jerky').ok).toBe(true);
    expect(craft(sim,'recipe_pan_seared_perch').ok).toBe(true);
    const got=sim.highflyKnowledgeStatus().learned.map(k=>k.id);
    expect(got).toContain('source.farm_produce');
    expect(got).toContain('source.monster_provisions');
    expect(got).toContain('source.river_perch');
    expect(got).toContain('technique.diverse_provisions');
    expect(sim.highflyKnowledgeStatus().learnedCount).toBe(4);
  });

  it('Knowledge survives a real CharacterState roundtrip, independently of Claude skills',()=>{
    const sim=create(706),pid=sim.playerId;
    expect(craft(sim,'recipe_tough_jerky').ok).toBe(true);
    const before=sim.serializeCharacter(pid)!;
    const restored=new Sim({seed:707,playerClass:'warrior',noPlayer:true});
    const next=restored.addPlayer('warrior','Scholar',{state:before});
    const after=restored.serializeCharacter(next)!;
    expect(after.highflyProfessions?.knowledge).toEqual(before.highflyProfessions?.knowledge);
    expect(after.craftSkills).toEqual(before.craftSkills);
    expect(after.knownRecipes).toEqual(before.knownRecipes);
    expect(after.archetype).toEqual(before.archetype);
    expect(after.gatheringProficiency).toEqual(before.gatheringProficiency);
    expect(restored.highflyKnowledgeStatus(next).learnedCount).toBe(1);
  });

  it('retired existing IDs are preserved; a successful act never erases other branches',()=>{
    const recipe=recipeById('recipe_tough_jerky')!;
    const input={version:1 as const,knowledge:['material.retired_one','knowledge.older'],
      craftXp:{cooking:42}, completedTrials:['trial.weaponcrafting.25']};
    const next=recordHighflyKnowledgeFromCraft({...input,
      evidence:{'cooking.source.monster':1}},recipe)!;
    expect(next.knowledge).toContain('material.retired_one');
    expect(next.knowledge).toContain('source.monster_provisions');
    expect(next.completedTrials).toEqual(['trial.weaponcrafting.25']);
    expect(next.craftXp).toEqual({cooking:42});
  });
});
