/** HIGHFLY V4-03 P11 — full LV1–99 content COVERAGE audit, not a balance pass.
 * Reads the SINGLE real donor+HF registries as built by P10. Never changes
 * gameplay, mint XP, invent recipes, inject materials, or touch public Pages.
 * One report for each of 11 progression bands: XP, mobs, loot reagent sinks,
 * weapon crafting, available armor, profession catalog, elemental gem recipes.
 * Missing tiers are reported, NOT falsely certified by a passing CI step.
 */
import {describe,expect,it} from 'vitest';
import {writeFileSync} from 'node:fs';
import {ALL_RECIPES,ITEMS,MOBS,DUNGEONS,BUILTIN_WORLD} from '../src/sim/data';
import {MAX_LEVEL} from '../src/sim/types';
import {requiredLevelFor} from '../src/sim/item_level_req';
import {HIGHFLY_HUNT_SCENARIOS} from '../src/highfly/monsters/hunt_scenarios';
import {highflyNativeHuntDungeonId} from '../src/highfly/monsters/hunt_dungeon_registry';
import {HIGHFLY_PF6_XP_TABLE,HIGHFLY_PF6_EXTENDED_ENABLED}
  from '../src/highfly/training/pf6_xp_curve';

const BANDS:[[number,number],...[number,number][]]=[
  [1,9],[10,19],[20,20],[21,29],[30,39],[40,49],
  [50,59],[60,69],[70,79],[80,89],[90,99],
];
const GEMS=['highfly_fire_gem','highfly_frost_gem','highfly_lightning_gem'] as const;
const CLASSES=['warrior','paladin','hunter','rogue','priest','shaman',
  'mage','warlock','druid'] as const;
const recipeLevel=(r:(typeof ALL_RECIPES)[number])=>
  typeof r.level==='number'&&Number.isFinite(r.level)?r.level:0;
const itemReq=(item:(typeof ITEMS)[string])=>{
  try{return requiredLevelFor(item)}catch{return -1}
};
describe('P11 total ClaudeCraft + HIGHFLY + progression LV1–99 audit',()=>{
  it('produces transparent 11-band inventory and records real content gaps',()=>{
    expect(MAX_LEVEL).toBe(99);
    expect(HIGHFLY_PF6_EXTENDED_ENABLED).toBe(false);
    expect(HIGHFLY_PF6_XP_TABLE).toHaveLength(99);
    expect(CLASSES).toHaveLength(9);
    expect(HIGHFLY_HUNT_SCENARIOS).toHaveLength(8);
    expect([...new Set(BANDS.flatMap(([a,b])=>Array.from({length:b-a+1},(_,i)=>a+i)))]).toHaveLength(99);
    for(const s of HIGHFLY_HUNT_SCENARIOS){
      expect(DUNGEONS[highflyNativeHuntDungeonId(s.id)]).toBeDefined();
      expect(BUILTIN_WORLD.zones.some(z=>z.pois.some(p=>
        p.id==='hf_world_portal_'+s.id))).toBe(true);
    }
    for(const id of GEMS){
      expect(ITEMS[id]).toBeDefined();
      expect(ALL_RECIPES.some(r=>r.resultItemId===id)).toBe(true);
    }
    const recipes=ALL_RECIPES.filter(r=>r&&r.resultItemId&&Array.isArray(r.reagents));
    const mobs=Object.values(MOBS).filter(m=>m&&!m.ambient&&!m.dummy);
    const craftItems=Object.values(ITEMS).filter(i=>i.kind==='weapon'||i.kind==='armor');
    const professions=[...new Set(recipes.map(r=>r.professionId))].sort();
    const gemRecipes=recipes.filter(r=>GEMS.includes(r.resultItemId as typeof GEMS[number]));
    const highflyMobs=mobs.filter(m=>m.id.startsWith('hf_hunt_')||m.id.startsWith('hf_enc_'));
    expect(highflyMobs).toHaveLength(80);
    const missingIngredients=recipes.flatMap(r=>
      r.reagents.filter(ing=>!ITEMS[ing.itemId])
        .map(ing=>r.id+':'+ing.itemId));
    const rows=BANDS.map(([from,to])=>{
      const overlapping=mobs.filter(m=>m.minLevel<=to&&m.maxLevel>=from);
      const hf=overlapping.filter(m=>m.id.startsWith('hf_hunt_')||m.id.startsWith('hf_enc_'));
      const newRecipes=recipes.filter(r=>recipeLevel(r)>=from&&recipeLevel(r)<=to);
      const currentRecipes=recipes.filter(r=>recipeLevel(r)<=to);
      const craftWeaponRecipes=newRecipes.filter(r=>ITEMS[r.resultItemId]?.kind==='weapon');
      const newGear=craftItems.filter(i=>{const lv=itemReq(i);return lv>=from&&lv<=to});
      const materialIds=[...new Set(hf.flatMap(m=>
        m.loot.filter(x=>!!x.itemId).map(x=>x.itemId!)))];
      const consumedMaterials=materialIds.filter(id=>
        currentRecipes.some(r=>r.reagents.some(ing=>ing.itemId===id)));
      const usableGems=gemRecipes.filter(r=>recipeLevel(r)<=to)
        .map(r=>({id:r.resultItemId,nominalRecipeLevel:recipeLevel(r),skillReq:r.skillReq}));
      const gaps=[] as string[];
      if(overlapping.length===0)gaps.push('NO_MOBS_IN_LEVEL_RANGE');
      if(newRecipes.length===0)gaps.push('NO_NEW_RECIPES_NOMINAL_LEVEL');
      if(craftWeaponRecipes.length===0)gaps.push('NO_NEW_WEAPON_CRAFT_RECIPES_IN_BAND');
      if(newGear.length===0)gaps.push('NO_NEW_ITEM_LEVEL_GEAR_IN_BAND');
      if(from>=21&&hf.length===0)gaps.push('NO_HIGHFLY_ENCOUNTERS_IN_BAND');
      if(from>=21&&usableGems.length===0)gaps.push('NO_ELEMENTAL_GEM_RECIPE_YET');
      return {
        from,to,
        xpForLevelStart:HIGHFLY_PF6_XP_TABLE[from-1],
        xpForLevelEnd:HIGHFLY_PF6_XP_TABLE[to-1],
        monsterTemplatesOverlapping:overlapping.length,
        highflyMonsterTemplatesOverlapping:hf.length,
        newRecipeRecordsNominalLevel:newRecipes.length,
        allRecipeRecordsUnlockedNominalLevel:currentRecipes.length,
        newCraftWeaponRecipesNominalLevel:craftWeaponRecipes.length,
        newGearEntriesNativeRequiredLevel:newGear.length,
        highflyDroppedMaterialTypes:materialIds,
        materialsWithRealRecipeConsumers:consumedMaterials,
        gemRecipesNominallyAvailable:usableGems,
        gaps,
      };
    });
    const reports={
      status:'COVERAGE_DIAGNOSTIC_NOT_BALANCE_CERTIFIED',
      system:'PINNED_CLAUDECRAFT_PLUS_HIGHFLY_PF6_PR1_16_P07_P09',
      levelsNormal:[1,MAX_LEVEL],extended100PlusEnabled:HIGHFLY_PF6_EXTENDED_ENABLED,
      professions,
      items:Object.keys(ITEMS).length,
      craftItems:craftItems.length,
      recipesTotal:recipes.length,
      donorAndHighflyMaxNominalRecipeLevel:Math.max(...recipes.map(recipeLevel)),
      donorAndHighflyMaxProfessionRecipeSkill:Math.max(...recipes.map(r=>r.skillReq??0)),
      gemRecipes:gemRecipes.map(r=>({id:r.id,item:r.resultItemId,level:recipeLevel(r),skillReq:r.skillReq})),
      allNativeMobTemplates:mobs.length,highflyMobTemplates:highflyMobs.length,
      missingIngredients:missingIngredients.slice(0,50),
      bands:rows,
      blockingBands:rows.filter(r=>r.gaps.length>0).map(r=>({from:r.from,to:r.to,gaps:r.gaps})),
      certifiedEconomyBalance:false,certifiedCombatBalance:false,
      naturalLevel1To99CharacterWalkthrough:false,physicalS23Verified:false,
      notes:[
        'Recipe.level is NOMINAL authored content tier, not proof player acquired the recipe',
        'requiredLevelFor is effective native item gate, not evidence of loot acquisition',
        'Native monsters and sink recipes may exist independently: economy chain not automatically viable',
        'Gem three elements are not three level-scaled gem power ladders',
        'A passing audit only certifies report integrity, not 1–99 itemization completion',
      ],
    };
    writeFileSync('../highfly_v403_p11_full_1_99_coverage.json',
      JSON.stringify(reports,null,2)+'\n','utf8');
    console.info('HF_P11_FULL_LEVEL99_CONTENT_COVERAGE='+JSON.stringify({
      recipesTotal:reports.recipesTotal,maxRecipeLevel:reports.donorAndHighflyMaxNominalRecipeLevel,
      highflyMobs:reports.highflyMobTemplates,tiers:BANDS.length,
      blockedBands:reports.blockingBands.length,gemRecipes:reports.gemRecipes,
      notes:reports.notes}));
    expect(recipes.length).toBeGreaterThan(100);
    expect(professions.length).toBeGreaterThanOrEqual(9);
    expect(rows).toHaveLength(11);
    expect(rows.every(r=>r.xpForLevelStart>0&&r.xpForLevelEnd>=r.xpForLevelStart)).toBe(true);
  });
});
