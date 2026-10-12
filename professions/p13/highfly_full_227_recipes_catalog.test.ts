/** HIGHFLY DEV P13-CATALOG — comprehensive real native recipe and loot inventory.
 * Diagnostic-only: not a grant, not an economy rebalance or shipping.
 * Source of truth is original ClaudeCraft Sim.data after P13 additive registry.
 */
import {describe,it,expect} from 'vitest';
import {writeFileSync} from 'node:fs';
import {ALL_RECIPES,ITEMS,MOBS} from '../src/sim/data';
import {requiredLevelFor} from '../src/sim/item_level_req';
import {HIGHFLY_PF6_XP_TABLE,HIGHFLY_PF6_NORMAL_MAX_LEVEL,HIGHFLY_PF6_EXTENDED_ENABLED}
  from '../src/highfly/training/pf6_xp_curve';

describe('DEV full 239 native recipe material source catalog LV1-99',()=>{
  it('exports exact ingredients quantities output gates and loot origins without inventing production',()=>{
    expect(HIGHFLY_PF6_NORMAL_MAX_LEVEL).toBe(99);
    expect(HIGHFLY_PF6_EXTENDED_ENABLED).toBe(false);
    expect(HIGHFLY_PF6_XP_TABLE).toHaveLength(99);
    expect(ALL_RECIPES.length).toBe(239); // 212 donor/HF +15 P13 +3 P15 +9 P16 armor
    const missingOutputs=ALL_RECIPES.filter(x=>!ITEMS[x.resultItemId]).map(x=>x.id);
    const missingMats=ALL_RECIPES.flatMap(x=>x.reagents
      .filter(y=>!ITEMS[y.itemId]).map(y=>x.id+':'+y.itemId));
    expect(missingOutputs).toEqual([]);
    expect(missingMats).toEqual([]);
    const materialSources=new Map<string,unknown[]>();
    for(const mob of Object.values(MOBS)){
      if(mob.dummy||mob.ambient)continue;
      for(const loot of mob.loot){
        if(typeof loot.itemId!=='string'||!loot.itemId)continue;
        const sources=materialSources.get(loot.itemId)??[];
        sources.push({mobId:mob.id,minLevel:mob.minLevel,maxLevel:mob.maxLevel,
          chance:loot.chance,elite:!!mob.elite,boss:!!mob.boss});
        materialSources.set(loot.itemId,sources);
      }
    }
    const catalog=ALL_RECIPES.map(recipe=>{
      const result=ITEMS[recipe.resultItemId];
      return {
        recipeId:recipe.id,profession:recipe.professionId,nominalLevel:recipe.level,
        skillReq:recipe.skillReq,acquisition:recipe.acquisition??[],
        station:recipe.stationType??null,
        resultItemId:recipe.resultItemId,resultName:result.name,
        outputKind:result.kind,outputRarity:result.quality??'common',
        outputReqLevel:result.kind==='weapon'||result.kind==='armor'
          ? requiredLevelFor(result):null,
        resultCount:recipe.resultCount,
        ingredients:recipe.reagents.map(ing=>({
          itemId:ing.itemId,name:ITEMS[ing.itemId]?.name??ing.itemId,
          count:ing.count,sourceMobs:(materialSources.get(ing.itemId)??[]).slice(0,12),
          sourceMobCount:(materialSources.get(ing.itemId)??[]).length,
          vendorOrGatheringOrOtherSourcePossible:(materialSources.get(ing.itemId)??[]).length===0,
        })),
        source:recipe.id.startsWith('recipe_hf_p13_')?'HIGHFLY_DEV_P13':'CLAUDECRAFT_PLUS_HIGHFLY_PR1_16',
      };
    });
    const allMobs=Object.values(MOBS).filter(x=>!x.dummy&&!x.ambient);
    let lifetime=0;
    const progression=HIGHFLY_PF6_XP_TABLE.map((cost,index)=>{
      const level=index+1;const entryXp=lifetime;
      lifetime+=cost;
      const overlapping=allMobs.filter(x=>x.minLevel<=level&&x.maxLevel>=level);
      const highfly=overlapping.filter(x=>x.id.startsWith('hf_hunt_')||x.id.startsWith('hf_enc_'));
      const nominal=ALL_RECIPES.filter(x=>x.level===level);
      return {level,entryCumulativeXp:entryXp,xpToNext:level===99?null:cost,
        nominalNewRecipeCount:nominal.length,recipeIds:nominal.map(x=>x.id),
        nativeMonsterTemplateCount:overlapping.length,
        highflyMonsterTemplateCount:highfly.length,
        extendedUnlocked:false};
    });
    const report={status:'DEV_CATALOG_AUDITED_ONLY_NOT_BALANCE_OR_PROFESSION_ACCESS',
      auditDate:'2026-10-11',maxLevel:99,extended100Enabled:false,
      totalRecipes:catalog.length,oldRecipes:catalog.filter(x=>x.source!=='HIGHFLY_DEV_P13').length,
      newP13Recipes:catalog.filter(x=>x.source==='HIGHFLY_DEV_P13').length,
      missingOutputs,missingMats,catalog,progression,
      warnings:[
        'Craft skillReq is not a universal admission gate in donor crafting.ts',
        'Trainer acquisition is declared but individual NPC vendor menus not all verified',
        'Fixture materials prove functional crafting, NOT natural materials grinding balance',
        'Mobs listed are native template sources; no guaranteed user encounter or drop',
        'No new premium GLB assets or 100+ Extended released',
      ]};
    writeFileSync('../highfly_dev_p16_full_239_recipes_materials_99_levels.json',
      JSON.stringify(report,null,2)+'\n','utf8');
    console.info('HF_DEV_NATIVE_239_RECIPES_99_LEVELS_CATALOG='+
      JSON.stringify({totalRecipes:catalog.length,oldRecipes:report.oldRecipes,
        newP13:report.newP13Recipes,distinctMobs:allMobs.length,
        levels:progression.length,maxNominalLevel:Math.max(...catalog.map(x=>x.nominalLevel)),
        missingOutputs,missingMats}));
  });
});
