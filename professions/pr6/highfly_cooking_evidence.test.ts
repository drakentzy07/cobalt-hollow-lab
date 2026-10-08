import { describe, expect, it } from 'vitest';
import { recipeById } from '../src/sim/content/recipes';
import { STATIONS } from '../src/sim/data';
import { resolveCraft } from '../src/sim/professions/crafting';
import { stationsOfType } from '../src/sim/professions/stations';
import {
  cookingRecipeSources, cookingEvidenceSnapshot, recordCookingFeastEvidence,
  recordCookingCraftEvidence, COOKING_SOURCE_INGREDIENTS,
} from '../src/sim/professions/highfly_cooking_evidence';
import { Sim, type PlayerMeta } from '../src/sim/sim';

function craft(sim: Sim,id: string,pid=sim.playerId) {
  const recipe=recipeById(id)!;
  expect(recipe).toBeTruthy();
  const meta=sim.players.get(pid) as PlayerMeta;
  if(recipe.acquisition?.includes('trainer')) meta.knownRecipes.add(recipe.id);
  if(recipe.stationType) {
    const station=stationsOfType(STATIONS,recipe.stationType)[0];
    expect(station).toBeTruthy();
    const p=sim.entities.get(pid)!;
    p.pos.x=station.pos.x;p.pos.z=station.pos.z;p.prevPos={...p.pos};
  }
  for(const reagent of recipe.reagents) sim.addItem(reagent.itemId,reagent.count,pid);
  return resolveCraft(sim.ctx,pid,id);
}

describe('HIGHFLY PR-6: Cooking sources and feast EVIDENCE, not repeatable XP',()=>{
  it('uses only confirmed real Farming, Fishing and monster ingredients',()=>{
    const src=COOKING_SOURCE_INGREDIENTS;
    expect(src.farming).toContain('brook_carrot');
    expect(src.fishing).toContain('raw_river_perch');
    expect(src.monster).toContain('spider_leg');
    expect(cookingRecipeSources(recipeById('recipe_tough_jerky')!)).toEqual(['monster']);
    expect(cookingRecipeSources(recipeById('recipe_pan_seared_perch')!)).toEqual(['fishing']);
    expect(cookingRecipeSources(recipeById('recipe_eastbrook_glazed_carrots')!)).toEqual(['farming']);
    expect(cookingRecipeSources(recipeById('recipe_eastbrook_arming_sword')!)).toEqual([]);
  });

  it('requires successful craft and a real cooked FEAST output to grant crafted evidence',()=>{
    const a={version:1 as const,craftXp:{cooking:100}};
    const first=recordCookingCraftEvidence(a,recipeById('recipe_tough_jerky')!)!;
    expect(first.evidence?.['cooking.source.monster']).toBe(1);
    expect(first.evidence?.['cooking.feast.crafted']).toBeUndefined();
    const feast=recipeById('recipe_harvest_feast')!;
    expect(feast.professionId).toBe('cooking');
    const next=recordCookingCraftEvidence(first,feast)!;
    expect(next.evidence?.['cooking.feast.crafted']).toBe(1);
    expect(next.craftXp).toEqual(a.craftXp);
    expect(a).toEqual({version:1,craftXp:{cooking:100}});
  });

  it('returns a read-only Cooking source/banquet summary and zero feast service XP',()=>{
    expect(cookingEvidenceSnapshot(undefined)).toEqual({
      sourceProofs:{farming:0,fishing:0,monster:0},
      feastCrafts:0,feastPlacements:0,feastServings:0,feastServiceXp:0,
    });
  });

  it('no new save state from legacy non-Cooks merely using a bought Feast',()=>{
    expect(recordCookingFeastEvidence(undefined,'placed')).toBeUndefined();
    expect(recordCookingFeastEvidence({version:1,knowledge:['old']},'served'))
      .toEqual({version:1,knowledge:['old']});
  });

  it('real Cooking with spider-drop ingredient yields monster proof + old character XP',()=>{
    const sim=new Sim({seed:601,playerClass:'warrior',autoEquip:false}),pid=sim.playerId;
    const before=sim.serializeCharacter(pid)!;
    expect(craft(sim,'recipe_tough_jerky').ok).toBe(true);
    const after=sim.serializeCharacter(pid)!;
    expect(after.highflyProfessions?.evidence?.['cooking.source.monster']).toBe(1);
    expect(after.highflyProfessions?.craftXp?.cooking).toBeGreaterThan(0);
    expect(after.xp).toBeGreaterThan(before.xp);
    expect(after.craftSkills?.cooking).toBeGreaterThan(before.craftSkills?.cooking??0);
  });

  it('real Kitchen fish recipe yields fishing proof, without awarding farming proof',()=>{
    const sim=new Sim({seed:602,playerClass:'warrior',autoEquip:false});
    expect(craft(sim,'recipe_pan_seared_perch').ok).toBe(true);
    const status=sim.highflyCookingEvidenceStatus();
    expect(status.sourceProofs.fishing).toBe(1);
    expect(status.sourceProofs.farming).toBe(0);
    expect(status.sourceProofs.monster).toBe(0);
  });

  it('real Kitchen carrot recipe yields farming proof, not fish XP or monster proof',()=>{
    const sim=new Sim({seed:603,playerClass:'warrior',autoEquip:false});
    expect(craft(sim,'recipe_eastbrook_glazed_carrots').ok).toBe(true);
    const status=sim.highflyCookingEvidenceStatus();
    expect(status.sourceProofs.farming).toBe(1);
    expect(status.sourceProofs.fishing).toBe(0);
    expect(status.sourceProofs.monster).toBe(0);
  });

  it('craft failures never invent ingredient evidence or additional profession XP',()=>{
    const sim=new Sim({seed:604,playerClass:'warrior',autoEquip:false}),pid=sim.playerId;
    const before=sim.serializeCharacter(pid)!;
    expect(resolveCraft(sim.ctx,pid,'recipe_tough_jerky').ok).toBe(false);
    expect(sim.serializeCharacter(pid)!.highflyProfessions).toBeUndefined();
    expect(sim.serializeCharacter(pid)!.xp).toBe(before.xp);
  });

  it('REAL Feast place, unique guest serving and repeat denial preserve ZERO XP',()=>{
    const sim=new Sim({seed:605,playerClass:'warrior',noPlayer:true});
    const owner=sim.addPlayer('warrior','Chef');
    const guest=sim.addPlayer('warrior','Guest');
    const other=sim.players.get(guest) as PlayerMeta;
    const chef=sim.players.get(owner) as PlayerMeta;
    const p=sim.entities.get(owner)!;
    const g=sim.entities.get(guest)!;
    g.pos={...p.pos};g.prevPos={...p.pos};
    chef.highflyProfessions={version:1,craftXp:{cooking:5000}};
    const before=sim.serializeCharacter(owner)!;
    sim.addItem('harvest_feast',1,owner);
    const from=sim.events.length;
    sim.placeFeast(owner);
    const placed=sim.events.slice(from).filter(e=>e.type==='farmFeastPlaced');
    expect(placed).toHaveLength(1);
    const id=placed[0].feastId;
    expect(sim.highflyCookingEvidenceStatus(owner).feastPlacements).toBe(1);
    const first=sim.feasts.get(id)!;
    const beforeCharges=first.charges;
    sim.consumeFeast(id,guest);
    expect(sim.feasts.get(id)!.charges).toBe(beforeCharges-1);
    expect(sim.highflyCookingEvidenceStatus(owner).feastServings).toBe(1);
    sim.consumeFeast(id,guest);
    expect(sim.feasts.get(id)!.charges).toBe(beforeCharges-1);
    expect(sim.highflyCookingEvidenceStatus(owner).feastServings).toBe(1);
    expect(sim.highflyCookingEvidenceStatus(guest).feastServings).toBe(0);
    expect(sim.highflyCookingEvidenceStatus(owner).feastServiceXp).toBe(0);
    const after=sim.serializeCharacter(owner)!;
    expect(after.highflyProfessions?.craftXp?.cooking).toBe(before.highflyProfessions?.craftXp?.cooking);
    expect(after.xp).toBe(before.xp);
    expect(other.highflyProfessions).toBeUndefined();
  });

  it('successful place/serve evidence is saved and restored without persisting the Feast world object',()=>{
    const sim=new Sim({seed:606,playerClass:'warrior',autoEquip:false});
    const pid=sim.playerId;
    expect(craft(sim,'recipe_tough_jerky').ok).toBe(true);
    sim.addItem('harvest_feast',1,pid);
    const from=sim.events.length;
    sim.placeFeast(pid);
    const placed=sim.events.slice(from).filter(e=>e.type==='farmFeastPlaced');
    expect(placed).toHaveLength(1);
    const saved=sim.serializeCharacter(pid)!;
    expect(saved.highflyProfessions?.evidence?.['cooking.feast.placed']).toBe(1);
    const replay=new Sim({seed:607,playerClass:'warrior',noPlayer:true});
    const newPid=replay.addPlayer('warrior','Reopened Cook',{state:saved});
    expect(replay.serializeCharacter(newPid)!.highflyProfessions)
      .toEqual(saved.highflyProfessions);
    expect(replay.feasts.size).toBe(0);
  });
});
