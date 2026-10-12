/** P15 bridge — REAL native class/equipment/loot/trainer/forge/save checks.
 * Fixtures set Hunter level, craft skill, copper, materials in CI only.
 * They DO NOT certify ordinary farming time, natural LV1→99 or physical S23.
 */
import {describe,it,expect} from 'vitest';
import {Sim} from '../src/sim/sim';
import {ITEMS,ALL_RECIPES,MOBS,STATIONS,BUILTIN_WORLD} from '../src/sim/data';
import {recipeById} from '../src/sim/content/recipes';
import {canEquipItem} from '../src/sim/equipment_rules';
import {requiredLevelFor,meetsLevelRequirement} from '../src/sim/item_level_req';
import {resolveCraft} from '../src/sim/professions/crafting';
import {trainingFeeFor,teachTierMet,trainingStationTypeFor} from '../src/sim/professions/training';
import {tierForSkill} from '../src/sim/professions/wheel';
import {HIGHFLY_P15_BRIDGE_ITEMS,HIGHFLY_P15_BRIDGE_RECIPES,
  HF_P15_BRIDGE_WEAPON_LEVELS,hfP15BridgeItemId,hfP15BridgeRecipeId}
  from '../src/sim/content/highfly_bridge_30_40_native_weapons';
import {BASE_ITEMS} from '../src/sim/content/items';
import {hfP13ItemId} from '../src/sim/content/highfly_lv99_native_equipment';
import type {PlayerClass} from '../src/sim/types';

const ALL_CLASSES:PlayerClass[]=['warrior','paladin','hunter','rogue',
  'priest','shaman','mage','warlock','druid'];
const TRACKS={
  warrior:{playerClass:'warrior',allowed:['warrior','paladin','shaman']},
  scout:{playerClass:'hunter',allowed:['hunter','rogue']},
  caster:{playerClass:'mage',allowed:['priest','mage','warlock','druid']},
} as const;
const CASES=HF_P15_BRIDGE_WEAPON_LEVELS.flatMap(level=>
  (Object.keys(TRACKS) as (keyof typeof TRACKS)[])
    .map(track=>({level,track,cls:TRACKS[track].playerClass})));
const FORGE=STATIONS.find(s=>s.id==='station_eastbrook_forge');

describe('GOLDEN DEV1 P15 LV21–49 true native weapon bridge',()=>{
  it('keeps LV1–20 original untouched and adds six unique IDs in same registries',()=>{
    expect(FORGE?.type).toBe('forge');
    expect(HF_P15_BRIDGE_WEAPON_LEVELS).toEqual([30,40]);
    expect(Object.keys(HIGHFLY_P15_BRIDGE_ITEMS)).toHaveLength(6);
    expect(HIGHFLY_P15_BRIDGE_RECIPES).toHaveLength(6);
    expect(ALL_RECIPES.filter(r=>r.id.startsWith('recipe_hf_p15_bridge_'))).toHaveLength(6);
    expect(ALL_RECIPES).toHaveLength(233); // donor + GEM + P13 + P15
    for(const donorId of ['worn_sword','rusty_dagger','gnarled_staff']){
      expect(ITEMS[donorId]).toBe(BASE_ITEMS[donorId]);
      expect(ITEMS[donorId].id).toBe(donorId);
    }
    for(const {level,track} of CASES){
      const id=hfP15BridgeItemId(level,track);
      const item=ITEMS[id],recipe=recipeById(hfP15BridgeRecipeId(level,track));
      expect(item).toBe(HIGHFLY_P15_BRIDGE_ITEMS[id]);
      expect(item.kind).toBe('weapon');
      expect(item.stats??{}).toEqual({});
      expect(requiredLevelFor(item)).toBe(level);
      expect(meetsLevelRequirement(level-1,item)).toBe(false);
      expect(meetsLevelRequirement(level,item)).toBe(true);
      expect(item.soulbound).toBe(true);
      expect(item.noMarketList).toBe(true);
      expect(recipe).toMatchObject({
        resultItemId:id,level,professionId:'weaponcrafting',
        stationType:'forge',acquisition:['trainer'],resultCount:1,
      });
      expect(item.kind==='weapon'?item.weapon.max:0).toBeLessThan(
        ITEMS[hfP13ItemId(50,track)].kind==='weapon'?
          ITEMS[hfP13ItemId(50,track)].weapon.max:0
      );
      for(const playerClass of ALL_CLASSES)
        expect(canEquipItem(playerClass,item)).toBe(
          (TRACKS[track].allowed as readonly string[]).includes(playerClass));
      for(const ingredient of recipe!.reagents){
        expect(ITEMS[ingredient.itemId]).toBeDefined();
        expect(ingredient.count).toBeGreaterThan(0);
        if(ingredient.itemId==='smithing_flux')continue; // real vendor gate later
        expect(Object.values(MOBS).some(m=>m.id.startsWith('hf_hunt_')&&
          m.minLevel<=level&&m.maxLevel>=level&&
          m.loot.some(x=>x.itemId===ingredient.itemId&&x.chance>0)),
          'NO_LV'+level+'_NATIVE_CORPSE_SOURCE_FOR_'+ingredient.itemId)
          .toBe(true);
      }
    }
  });

  it.each(CASES)('$track LV$level: train (fee/tier) -> craft -> relog',({level,track,cls})=>{
    const recipeId=hfP15BridgeRecipeId(level,track);
    const itemId=hfP15BridgeItemId(level,track);
    const recipe=recipeById(recipeId)!;
    expect(trainingStationTypeFor(recipe)).toBe('forge');
    const sim=new Sim({seed:153040,playerClass:cls,noPlayer:true,
      autoEquip:false,compulsoryTutorial:false,riftPortals:false,
      world:{...BUILTIN_WORLD,camps:[]}});
    const pid=sim.addPlayer(cls,'P15_'+track+'_'+level,{tutorialGreetingSent:true});
    sim.setPlayerLevel(level,pid); // fixture ONLY, no gifted gameplay levels
    const meta=sim.players.get(pid)!;
    const ent=sim.entities.get(pid)!;
    ent.pos={...sim.groundPos(FORGE!.pos.x,FORGE!.pos.z)};
    ent.prevPos={...ent.pos};
    const savedInitial=JSON.parse(JSON.stringify(sim.serializeCharacter(pid)));
    const training=savedInitial.trainingProfile;
    const fee=trainingFeeFor(recipe);
    const tier=tierForSkill(recipe.skillReq);
    meta.craftSkills.weaponcrafting=tier*25-1;
    meta.copper=fee;
    expect(teachTierMet(recipe,meta.craftSkills)).toBe(false);
    sim.trainRecipe(recipeId,pid);
    expect(meta.lastTrainResult).toMatchObject({ok:false,reason:'train_tier_unmet'});
    expect(meta.knownRecipes.has(recipeId)).toBe(false);
    meta.craftSkills.weaponcrafting=tier*25;
    meta.copper=fee-1;
    sim.trainRecipe(recipeId,pid);
    expect(meta.lastTrainResult).toMatchObject({ok:false,reason:'train_cannot_afford'});
    meta.copper=fee;
    sim.trainRecipe(recipeId,pid);
    expect(meta.lastTrainResult).toMatchObject({ok:true,recipeId,fee});
    expect(meta.knownRecipes.has(recipeId)).toBe(true);
    expect(meta.copper).toBe(0);
    expect(resolveCraft((sim as any).ctx,pid,recipeId))
      .toMatchObject({ok:false,reason:'insufficient_materials'});
    for(const ing of recipe.reagents) sim.addItem(ing.itemId,ing.count,pid);
    const output=resolveCraft((sim as any).ctx,pid,recipeId);
    expect(output.ok,JSON.stringify(output)).toBe(true);
    expect(sim.countItem(itemId,pid)).toBe(1);
    const saved=JSON.parse(JSON.stringify(sim.serializeCharacter(pid)));
    expect(saved.trainingProfile).toEqual(training);
    const reload=new Sim({seed:153041,playerClass:cls,noPlayer:true,
      autoEquip:false,compulsoryTutorial:false,riftPortals:false,
      world:{...BUILTIN_WORLD,camps:[]}});
    const rid=reload.addPlayer(cls,'P15_'+track+'_'+level,
      {state:saved,tutorialGreetingSent:true});
    expect(reload.countItem(itemId,rid)).toBe(1);
    expect(reload.players.get(rid)!.knownRecipes.has(recipeId)).toBe(true);
    expect(JSON.parse(JSON.stringify(reload.serializeCharacter(rid))).trainingProfile)
      .toEqual(training);
  });
});
