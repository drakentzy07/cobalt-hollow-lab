import { describe,expect,it } from 'vitest';
import { recipeById } from '../src/sim/content/recipes';
import { STATIONS } from '../src/sim/data';
import { resolveCraft } from '../src/sim/professions/crafting';
import { stationsOfType } from '../src/sim/professions/stations';
import {
  HIGHFLY_DISCOVERY_TRIGGERS,HIGHFLY_DISCOVERY_PILOT,
  highflyDiscoveryCatalogValid,highflyDiscoveryCandidates,
  highflyDiscoveryReadout,recordHighflyDiscoveryEvent,recordHighflyDiscoveryFromCraft,
} from '../src/sim/professions/highfly_discovery_core';
import { Sim,type PlayerMeta } from '../src/sim/sim';

function game(seed:number) {
  return new Sim({seed,playerClass:'warrior',autoEquip:false});
}
function make(sim:Sim,id:string,pid=sim.playerId) {
  const recipe=recipeById(id)!;
  expect(recipe).toBeTruthy();
  const meta=sim.players.get(pid) as PlayerMeta;
  if(recipe.acquisition?.includes('trainer'))meta.knownRecipes.add(recipe.id);
  if(recipe.stationType) {
    const station=stationsOfType(STATIONS,recipe.stationType)[0];
    expect(station).toBeTruthy();
    const e=sim.entities.get(pid)!;
    e.pos.x=station.pos.x;e.pos.z=station.pos.z;e.prevPos={...e.pos};
  }
  for(const ingredient of recipe.reagents) {
    sim.addItem(ingredient.itemId,ingredient.count,pid);
  }
  return resolveCraft(sim.ctx,pid,recipe.id);
}
const ids=(sim:Sim)=>sim.highflyDiscoveryStatus().discovered.map(d=>d.id);

describe('HIGHFLY PR-8: authored/event-indexed Discovery Core',()=>{
  it('defines exactly the 10 MASTER triggers; only craftSuccess wired in pilot',()=>{
    expect(HIGHFLY_DISCOVERY_TRIGGERS).toEqual([
      'craftSuccess','gatherSuccess','harvestCorpse','itemAcquire',
      'bossKill','questComplete','documentInterpret','stationUse',
      'inspectWorldObject','enterLocation',
    ]);
    expect(highflyDiscoveryCatalogValid()).toBe(true);
    expect(HIGHFLY_DISCOVERY_PILOT).toHaveLength(3);
    expect(HIGHFLY_DISCOVERY_PILOT.every(d=>d.trigger==='craftSuccess')).toBe(true);
    for(const def of HIGHFLY_DISCOVERY_PILOT) {
      for(const recipeId of def.conditions.triggeringRecipes) {
        const recipe=recipeById(recipeId);
        expect(recipe?.professionId).toBe(def.professionId);
      }
      expect(def.rewards.journalMarker.startsWith('journal.')).toBe(true);
    }
  });

  it('indexes by EVENT AND profession without searching every secret per tick',()=>{
    expect(highflyDiscoveryCandidates('craftSuccess','weaponcrafting').map(d=>d.id))
      .toEqual(['discovery.smith.copper_echo']);
    expect(highflyDiscoveryCandidates('craftSuccess','armorcrafting').map(d=>d.id))
      .toEqual(['discovery.smith.chainward_insight']);
    expect(highflyDiscoveryCandidates('craftSuccess','cooking').map(d=>d.id))
      .toEqual(['discovery.cooking.three_sources']);
    expect(highflyDiscoveryCandidates('bossKill','cooking')).toEqual([]);
    expect(highflyDiscoveryCandidates('craftSuccess','alchemy')).toEqual([]);
  });

  it('hides totals, unearned titles and prereqs from read-only player profile',()=>{
    expect(highflyDiscoveryReadout(undefined)).toEqual({discovered:[],discoveredCount:0});
    const r=highflyDiscoveryReadout({version:1,discoveries:['discovery.cooking.three_sources']});
    expect(r).toEqual({discovered:[{
      id:'discovery.cooking.three_sources',
      journalMarker:'journal.cooking.three_sources',
    }],discoveredCount:1});
    expect(Object.keys(r)).not.toContain('totalAvailable');
    expect(JSON.stringify(r)).not.toContain('requiredEvidence');
    expect(JSON.stringify(r)).not.toContain('unearned');
  });

  it('never invents a save field or rewards from old characters, unrelated triggers or crafts',()=>{
    const cooking=recipeById('recipe_tough_jerky')!;
    expect(recordHighflyDiscoveryFromCraft(undefined,cooking)).toBeUndefined();
    const old={version:1 as const,knowledge:['retired.knowledge']};
    expect(recordHighflyDiscoveryEvent(old,{trigger:'gatherSuccess',professionId:'cooking'}))
      .toBe(old);
    expect(recordHighflyDiscoveryEvent(old,{trigger:'craftSuccess',professionId:'alchemy',recipeId:'recipe_tough_jerky'}))
      .toBe(old);
    expect(recordHighflyDiscoveryEvent(old,{trigger:'craftSuccess',professionId:'cooking',recipeId:'wrong_recipe'}))
      .toBe(old);
    expect(old).toEqual({version:1,knowledge:['retired.knowledge']});
  });

  it('Knowledge and one single recipe never unlock multi-source authored secrets',()=>{
    const partial={version:1 as const,knowledge:['technique.basic_forging','material.copper_ore'],
      evidence:{'knowledge.craft.recipe_eastbrook_arming_sword':1}};
    const recipe=recipeById('recipe_eastbrook_arming_sword')!;
    expect(recordHighflyDiscoveryFromCraft(partial,recipe)).toBe(partial);
    const wrong={...partial,evidence:{
      'knowledge.craft.recipe_eastbrook_arming_sword':1,
      'knowledge.craft.recipe_copper_bearded_axe':1,
    }};
    expect(recordHighflyDiscoveryFromCraft(wrong,{
      id:'recipe_eastbrook_chain_vest', professionId:'weaponcrafting',
    })).toBe(wrong);
  });

  it('real Smith WEAPON sequence unlocks once after second actual crafted item',()=>{
    const sim=game(801),pid=sim.playerId;
    const original=sim.serializeCharacter(pid)!;
    expect(make(sim,'recipe_eastbrook_arming_sword').ok).toBe(true);
    expect(ids(sim)).toEqual([]);
    expect(make(sim,'recipe_copper_bearded_axe').ok).toBe(true);
    expect(ids(sim)).toEqual(['discovery.smith.copper_echo']);
    const before=sim.serializeCharacter(pid)!;
    expect(before.highflyProfessions?.knowledge).toContain('technique.basic_forging');
    expect(before.craftSkills?.weaponcrafting).toBeGreaterThan(original.craftSkills?.weaponcrafting??0);
    const savedKnown=before.knownRecipes;
    expect(make(sim,'recipe_copper_bearded_axe').ok).toBe(true);
    expect(ids(sim)).toEqual(['discovery.smith.copper_echo']);
    expect(sim.serializeCharacter(pid)!.knownRecipes).toEqual(savedKnown);
  });

  it('real ARMOR pair learns a DIFFERENT discovery; weapon stays undiscovered',()=>{
    const sim=game(802);
    expect(make(sim,'recipe_eastbrook_chain_vest').ok).toBe(true);
    expect(ids(sim)).toEqual([]);
    expect(make(sim,'recipe_eastbrook_warded_leggings').ok).toBe(true);
    expect(ids(sim)).toEqual(['discovery.smith.chainward_insight']);
    const saved=sim.serializeCharacter(sim.playerId)!;
    expect(saved.highflyProfessions?.knowledge).toContain('technique.basic_armoring');
    expect(saved.highflyProfessions?.discoveries).not.toContain('discovery.smith.copper_echo');
  });

  it('real Cooking requires ALL three independent monster/fish/farm proven sources',()=>{
    const sim=game(803);
    expect(make(sim,'recipe_tough_jerky').ok).toBe(true);
    expect(ids(sim)).toEqual([]);
    expect(make(sim,'recipe_pan_seared_perch').ok).toBe(true);
    expect(ids(sim)).toEqual([]);
    expect(make(sim,'recipe_eastbrook_glazed_carrots').ok).toBe(true);
    expect(ids(sim)).toEqual(['discovery.cooking.three_sources']);
    const s=sim.serializeCharacter(sim.playerId)!;
    expect(s.highflyProfessions?.knowledge).toContain('technique.diverse_provisions');
    expect(s.highflyProfessions?.evidence?.['cooking.source.farming']).toBe(1);
    expect(s.highflyProfessions?.evidence?.['cooking.source.fishing']).toBe(1);
    expect(s.highflyProfessions?.evidence?.['cooking.source.monster']).toBe(1);
  });

  it('REAL unsuccessful crafting cannot pay a discovery or its partial proof',()=>{
    const sim=game(804);
    const before=sim.serializeCharacter(sim.playerId)!;
    expect(resolveCraft(sim.ctx,sim.playerId,'recipe_copper_bearded_axe').ok).toBe(false);
    const after=sim.serializeCharacter(sim.playerId)!;
    expect(after.highflyProfessions?.discoveries).toBeUndefined();
    expect(after.highflyProfessions).toEqual(before.highflyProfessions);
    expect(after.xp).toBe(before.xp);
    expect(after.craftSkills).toEqual(before.craftSkills);
  });

  it('committed discovery survives real save/load; unknown retired IDs remain intact',()=>{
    const sim=game(805),pid=sim.playerId;
    expect(make(sim,'recipe_tough_jerky').ok).toBe(true);
    expect(make(sim,'recipe_pan_seared_perch').ok).toBe(true);
    expect(make(sim,'recipe_eastbrook_glazed_carrots').ok).toBe(true);
    const original=sim.serializeCharacter(pid)!;
    const previous=original.highflyProfessions!;
    previous.discoveries?.push('discovery.retired_secret');
    const fresh=new Sim({seed:806,playerClass:'warrior',noPlayer:true});
    const nextId=fresh.addPlayer('warrior','Returning Scholar',{state:original});
    const loaded=fresh.serializeCharacter(nextId)!;
    expect(loaded.highflyProfessions?.discoveries).toEqual(previous.discoveries);
    expect(fresh.highflyDiscoveryStatus(nextId).discoveredCount).toBe(2);
    expect(fresh.highflyDiscoveryStatus(nextId).discovered).toHaveLength(1);
    expect(loaded.craftSkills).toEqual(original.craftSkills);
    expect(loaded.knownRecipes).toEqual(original.knownRecipes);
    expect(loaded.archetype).toEqual(original.archetype);
    expect(loaded.gatheringProficiency).toEqual(original.gatheringProficiency);
    expect(loaded.xp).toEqual(original.xp);
  });

  it('recording discoveries alone does NOT mint item/XP/skill or change other career fields',()=>{
    const s={version:1 as const,knowledge:['material.copper_ore','technique.basic_forging'],
      evidence:{'knowledge.craft.recipe_eastbrook_arming_sword':1,
        'knowledge.craft.recipe_copper_bearded_axe':1},
      craftXp:{weaponcrafting:123.5},practice:{'recipe:test':2},
      legendaryProfessions:['old.profession']};
    const next=recordHighflyDiscoveryFromCraft(s,recipeById('recipe_copper_bearded_axe')!)!;
    expect(next.discoveries).toEqual(['discovery.smith.copper_echo']);
    expect(next.craftXp).toEqual(s.craftXp);
    expect(next.practice).toEqual(s.practice);
    expect(next.knowledge).toEqual(s.knowledge);
    expect(next.legendaryProfessions).toEqual(s.legendaryProfessions);
    const again=recordHighflyDiscoveryFromCraft(next,recipeById('recipe_copper_bearded_axe')!);
    expect(again).toBe(next);
  });
});
