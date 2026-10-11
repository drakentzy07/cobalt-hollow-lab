/** HIGHFLY GOLDEN DEV 1 P14 — TRAINER -> FORGE -> SAVE regression.
 *
 * Exercises the ORIGINAL ClaudeCraft Sim and registered P13 recipes.
 * Uses fixture copper, profession skill, Hunter level and reagents ONLY in CI:
 * this does not certify that materials were farmed, or that a player has
 * naturally progressed LV1 -> 99. No production monkey-patch is permitted.
 *
 * IMPORTANT DONOR RULE: trainers gate by tierForSkill(skillReq) (25 point
 * buckets), NOT by the exact authored skillReq value; crafting does not
 * impose a second skillReq admission gate. Never report strict gating.
 */
import {describe,it,expect} from 'vitest';
import {Sim} from '../src/sim/sim';
import {BUILTIN_WORLD,STATIONS} from '../src/sim/data';
import {recipeById} from '../src/sim/content/recipes';
import {resolveCraft} from '../src/sim/professions/crafting';
import {trainingFeeFor,trainingStationTypeFor,teachTierMet} from
  '../src/sim/professions/training';
import {tierForSkill} from '../src/sim/professions/wheel';
import {HF_P13_WEAPON_LEVELS,hfP13ItemId,hfP13RecipeId} from
  '../src/sim/content/highfly_lv99_native_equipment';
import type {PlayerClass} from '../src/sim/types';

const TRACK_CLASS = {
  warrior:'warrior',scout:'hunter',caster:'mage',
} as const satisfies Record<string,PlayerClass>;
const TRACKS=['warrior','scout','caster'] as const;
const CASES=HF_P13_WEAPON_LEVELS.flatMap(level=>
  TRACKS.map(track=>({level,track,cls:TRACK_CLASS[track]})));
const FORGE=STATIONS.find(s=>s.id==='station_eastbrook_forge');

describe('GOLDEN DEV1 native P13 trainer-to-forge contracts, 15 weapons',()=>{
  it('has an actual static forge trainer station (not a fictional NPC catalog)',()=>{
    expect(FORGE).toBeDefined();
    expect(FORGE!.type).toBe('forge');
  });

  it.each(CASES)('$track LV$level trains, pays once, forges and restores in native Sim',
    ({level,track,cls})=>{
      const recipeId=hfP13RecipeId(level,track);
      const itemId=hfP13ItemId(level,track);
      const recipe=recipeById(recipeId);
      expect(recipe).toBeDefined();
      expect(trainingStationTypeFor(recipe!)).toBe('forge');
      expect(recipe!.acquisition).toContain('trainer');

      const sim=new Sim({seed:141515,playerClass:cls,noPlayer:true,
        autoEquip:false,compulsoryTutorial:false,riftPortals:false,
        world:{...BUILTIN_WORLD,camps:[]}});
      const pid=sim.addPlayer(cls,'DEV1_'+track+'_'+level,
        {tutorialGreetingSent:true});
      sim.setPlayerLevel(level,pid); // FIXTURE ONLY
      const meta=sim.players.get(pid)!;
      const ent=sim.entities.get(pid)!;
      ent.pos={...sim.groundPos(FORGE!.pos.x,FORGE!.pos.z)};
      ent.prevPos={...ent.pos};
      const beforeState=JSON.parse(JSON.stringify(sim.serializeCharacter(pid)));
      const priorTraining=beforeState.trainingProfile;
      const fee=trainingFeeFor(recipe!);
      const tier=tierForSkill(recipe!.skillReq);
      expect(tier).toBeGreaterThan(0);
      expect(meta.knownRecipes.has(recipeId)).toBe(false);

      // In the ORIGINAL donor, this is the real learning gate: craft tier.
      meta.craftSkills.weaponcrafting=tier*25-1;
      meta.copper=fee;
      expect(teachTierMet(recipe!,meta.craftSkills)).toBe(false);
      sim.trainRecipe(recipeId,pid);
      expect(meta.lastTrainResult).toMatchObject({
        ok:false,reason:'train_tier_unmet'});
      expect(meta.knownRecipes.has(recipeId)).toBe(false);
      expect(meta.copper).toBe(fee);

      meta.craftSkills.weaponcrafting=tier*25;
      expect(teachTierMet(recipe!,meta.craftSkills)).toBe(true);
      meta.copper=fee-1;
      sim.trainRecipe(recipeId,pid);
      expect(meta.lastTrainResult).toMatchObject({
        ok:false,reason:'train_cannot_afford'});
      expect(meta.knownRecipes.has(recipeId)).toBe(false);
      expect(meta.copper).toBe(fee-1);

      meta.copper=fee;
      sim.trainRecipe(recipeId,pid);
      expect(meta.lastTrainResult).toMatchObject({ok:true,recipeId,fee});
      expect(meta.knownRecipes.has(recipeId)).toBe(true);
      expect(meta.copper).toBe(0);
      sim.trainRecipe(recipeId,pid);
      expect(meta.lastTrainResult).toMatchObject({
        ok:false,reason:'train_already_known'});
      expect(meta.copper).toBe(0);

      // A learned recipe without any materials cannot mint its output.
      const noMats=resolveCraft((sim as any).ctx,pid,recipeId);
      expect(noMats).toMatchObject({
        ok:false,reason:'insufficient_materials'});
      expect(sim.countItem(itemId,pid)).toBe(0);

      // FIXTURE MATERIALS: actual mob farming/drop probability is a
      // separate release gate, not claimed by this native crafting test.
      for(const reagent of recipe!.reagents)
        sim.addItem(reagent.itemId,reagent.count,pid);
      const forged=resolveCraft((sim as any).ctx,pid,recipeId);
      expect(forged.ok,JSON.stringify({level,track,forged})).toBe(true);
      expect(sim.countItem(itemId,pid)).toBe(1);

      const saved=JSON.parse(JSON.stringify(sim.serializeCharacter(pid)));
      expect(saved.trainingProfile).toEqual(priorTraining);
      const restored=new Sim({seed:151515,playerClass:cls,noPlayer:true,
        autoEquip:false,compulsoryTutorial:false,riftPortals:false,
        world:{...BUILTIN_WORLD,camps:[]}});
      const restoredId=restored.addPlayer(cls,'DEV1_'+track+'_'+level,
        {state:saved,tutorialGreetingSent:true});
      expect(restored.countItem(itemId,restoredId)).toBe(1);
      expect(restored.players.get(restoredId)!.knownRecipes.has(recipeId))
        .toBe(true);
      const restoredState=JSON.parse(JSON.stringify(
        restored.serializeCharacter(restoredId)));
      expect(restoredState.trainingProfile).toEqual(priorTraining);
      expect([...restored.entities.values()].filter(e=>e.kind==='player'))
        .toHaveLength(1);
    });

  it('never creates a weapon from an unlearned P13 recipe, even with supplied reagents',()=>{
    const sim=new Sim({seed:151516,playerClass:'warrior',noPlayer:true,
      autoEquip:false,compulsoryTutorial:false,riftPortals:false,
      world:{...BUILTIN_WORLD,camps:[]}});
    const pid=sim.addPlayer('warrior','DEV1_no_free_recipe',
      {tutorialGreetingSent:true});
    sim.setPlayerLevel(50,pid);
    const ent=sim.entities.get(pid)!;
    ent.pos={...sim.groundPos(FORGE!.pos.x,FORGE!.pos.z)};
    ent.prevPos={...ent.pos};
    const recipeId=hfP13RecipeId(50,'warrior');
    const itemId=hfP13ItemId(50,'warrior');
    for(const reagent of recipeById(recipeId)!.reagents)
      sim.addItem(reagent.itemId,reagent.count,pid);
    const denied=resolveCraft((sim as any).ctx,pid,recipeId);
    expect(denied).toMatchObject({ok:false,reason:'recipe_not_learned'});
    expect(sim.countItem(itemId,pid)).toBe(0);
  });
});
