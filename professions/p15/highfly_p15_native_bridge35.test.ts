/** DEV5 — native LV35 bridge3: real RNG corpse -> real P15 trainer ->
 * native forging/equipping/persistence. Class/item/source checks cover 9
 * original classes. HP=1 and prerequisite gold/skill/vendor flux are CI ONLY.
 * Do not claim full LV1→99 gameplay, terrain, class balance or natural grind.
 */
import {describe,it,expect} from 'vitest';
import {Sim} from '../src/sim/sim';
import {createMob} from '../src/sim/entity';
import {meleeSwing} from '../src/sim/combat/auto_attack';
import {BUILTIN_WORLD,ITEMS,ALL_RECIPES,MOBS,STATIONS} from '../src/sim/data';
import {canEquipItem} from '../src/sim/equipment_rules';
import {requiredLevelFor} from '../src/sim/item_level_req';
import {recipeById} from '../src/sim/content/recipes';
import {resolveCraft} from '../src/sim/professions/crafting';
import {trainingFeeFor} from '../src/sim/professions/training';
import {HIGHFLY_P15_ITEMS,HIGHFLY_P15_RECIPES,HF_P15_BRIDGE_LEVEL,
  hfP15ItemId,hfP15RecipeId} from '../src/sim/content/highfly_p15_native_bridge35';
import type {PlayerClass} from '../src/sim/types';

const TRACKS=['warrior','scout','caster'] as const;
const CLASSES:PlayerClass[]=['warrior','paladin','hunter','rogue',
  'priest','shaman','mage','warlock','druid'];
const GROUPS={
  warrior:['warrior','paladin','shaman'],
  scout:['hunter','rogue'],
  caster:['mage','priest','warlock','druid'],
} as const;
const MATERIAL_SOURCE={
  rough_hide:'hf_hunt_wolf_30',
  spider_silk:'hf_hunt_spider_30',
} as const;
const F=STATIONS.find(x=>x.id==='station_eastbrook_forge');

describe('DEV5 original donor-gear source reuse LV35 bridge',()=>{
  it('3 genuine P15 ITEMS/ALL_RECIPES registered; 9 classes with correct level gates',()=>{
    expect(HF_P15_BRIDGE_LEVEL).toBe(35);
    expect(HIGHFLY_P15_RECIPES).toHaveLength(3);
    expect(Object.keys(HIGHFLY_P15_ITEMS)).toHaveLength(3);
    expect(ALL_RECIPES.length).toBe(239); // 212 native baseline +15 P13 +3 P15 +9 P16
    expect(F?.type).toBe('forge');
    for(const track of TRACKS){
      const item=ITEMS[hfP15ItemId(track)];
      const recipe=recipeById(hfP15RecipeId(track));
      expect(item).toBe(HIGHFLY_P15_ITEMS[hfP15ItemId(track)]);
      expect(item?.kind).toBe('weapon');
      expect(item.stats??{}).toEqual({});
      expect(item?.soulbound).toBe(true);
      expect(item?.noMarketList).toBe(true);
      expect(requiredLevelFor(item)).toBe(35);
      expect(recipe?.resultItemId).toBe(item.id);
      expect(recipe?.professionId).toBe('weaponcrafting');
      expect(recipe?.stationType).toBe('forge');
      expect(recipe?.skillReq).toBe(50);
      expect(recipe?.acquisition).toContain('trainer');
      for(const cls of CLASSES){
        expect(canEquipItem(cls,item)).toBe(
          (GROUPS[track] as readonly string[]).includes(cls));
      }
      for(const ing of recipe!.reagents){
        expect(ITEMS[ing.itemId]).toBeDefined();
        if(ing.itemId==='smithing_flux')continue;
        const mob=Object.values(MOBS).filter(m=>
          m.id.startsWith('hf_hunt_')&&m.minLevel<=35&&m.maxLevel>=35&&
          m.loot.some(e=>e.itemId===ing.itemId&&e.chance>0));
        expect(mob.length,'no in-band native drop: '+ing.itemId)
          .toBeGreaterThan(0);
      }
    }
    expect(ALL_RECIPES.filter(r=>r.id.startsWith('recipe_hf_p15_bridge35_')))
      .toHaveLength(3);
  });
  it('earns native probability materials LV35 -> train -> forge -> equip -> save with original Sim',()=>{
    const sim=new Sim({seed:350005,playerClass:'warrior',noPlayer:true,
      autoEquip:false,compulsoryTutorial:false,riftPortals:false,
      world:{...BUILTIN_WORLD,camps:[]}});
    const pid=sim.addPlayer('warrior','P15_35_Native_Forge',
      {tutorialGreetingSent:true});
    sim.setPlayerLevel(35,pid); // CI fixture, not user XP.
    const entity=sim.entities.get(pid)!,meta=sim.players.get(pid)!;
    const prior=JSON.parse(JSON.stringify(sim.serializeCharacter(pid)));
    const recipe=recipeById(hfP15RecipeId('warrior'))!;
    const output=hfP15ItemId('warrior');
    const counts:Record<string,number>={};
    for(const key of Object.keys(MATERIAL_SOURCE) as
      (keyof typeof MATERIAL_SOURCE)[]){
      const def=MOBS[MATERIAL_SOURCE[key]];
      expect(def).toBeDefined();
      const naturalChance=def.loot.find(l=>l.itemId===key)?.chance??0;
      expect(naturalChance).toBeGreaterThan(0);
      expect(naturalChance).toBeLessThan(1);
      const required=recipe.reagents.find(x=>x.itemId===key)!.count;
      const before=sim.countItem(key,pid);
      let kills=0;
      while(sim.countItem(key,pid)-before<required&&kills<225){
        const mob=createMob(sim.nextId++,def,35,
          {x:entity.pos.x+1,y:entity.pos.y,z:entity.pos.z+1});
        mob.hp=1; // accelerated event fixture only, unchanged mob definition
        mob.hostile=true;
        sim.addEntity(mob);
        entity.facing=Math.atan2(mob.pos.x-entity.pos.x,mob.pos.z-entity.pos.z);
        sim.targetEntity(mob.id,pid);
        for(let i=0;i<90&&!mob.dead;i++)meleeSwing(sim.ctx,entity,mob,0,null,{});
        expect(mob.dead).toBe(true);
        expect(mob.lootable).toBe(true);
        sim.lootCorpse(mob.id,pid); // authentic donor RNG/loot/wallet/inventory
        kills++;
      }
      counts[key]=kills;
      expect(sim.countItem(key,pid)-before).toBeGreaterThanOrEqual(required);
    }
    const fee=trainingFeeFor(recipe);
    meta.copper=Math.max(meta.copper,fee+300);
    meta.craftSkills.weaponcrafting=50; // fixture mastery prerequisite
    entity.pos={...sim.groundPos(F!.pos.x,F!.pos.z)};
    entity.prevPos={...entity.pos};
    expect(meta.knownRecipes.has(recipe.id)).toBe(false);
    sim.trainRecipe(recipe.id,pid);
    expect(meta.lastTrainResult).toMatchObject({ok:true,recipeId:recipe.id});
    sim.addItem('smithing_flux',
      recipe.reagents.find(x=>x.itemId==='smithing_flux')!.count,pid);
    const before=Object.fromEntries(Object.keys(MATERIAL_SOURCE).map(x=>
      [x,sim.countItem(x,pid)]));
    const result=resolveCraft(sim.ctx,pid,recipe.id);
    expect(result.ok,JSON.stringify(result)).toBe(true);
    expect(sim.countItem(output,pid)).toBe(1);
    for(const key of Object.keys(MATERIAL_SOURCE))
      expect(sim.countItem(key,pid)).toBeLessThan(before[key]);
    sim.equipItem(output,pid);
    expect(meta.equipment.mainhand).toBe(output);
    const state=JSON.parse(JSON.stringify(sim.serializeCharacter(pid)));
    expect(state.trainingProfile).toEqual(prior.trainingProfile);
    const restored=new Sim({seed:350006,playerClass:'warrior',noPlayer:true,
      autoEquip:false,compulsoryTutorial:false,riftPortals:false,
      world:{...BUILTIN_WORLD,camps:[]}});
    const rid=restored.addPlayer('warrior','P15_35_Native_Forge',
      {state,tutorialGreetingSent:true});
    expect(restored.players.get(rid)?.equipment.mainhand).toBe(output);
    expect(restored.players.get(rid)?.knownRecipes.has(recipe.id)).toBe(true);
    expect(JSON.parse(JSON.stringify(restored.serializeCharacter(rid))).trainingProfile)
      .toEqual(prior.trainingProfile);
    console.info('HF_P15_LV35_REAL_RNG_MATERIALS_TO_HUNTER_SAVE='+JSON.stringify({
      level:35,kills:counts,recipe:recipe.id,item:output,
      sourceChanceOriginal:true,trainingVendorInputsFixture:true,
      noProductionStatBoost:true,
    }));
  },180000);
});
