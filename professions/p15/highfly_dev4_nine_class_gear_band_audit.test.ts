/** HIGHFLY GOLDEN DEV4 — LV1–99 ORIGINAL gear itemization gap inventory.
 * Across nine classes × 11 level bands read EXACT canonical donor+HF registries.
 * No new items/models, class specs, stat boosts, leveling, or game runtime hooks.
 * Eligibility != earned; recipe authored != NPC learned; loot table != reachable
 * in a playable world. This diagnostic never marks those steps certified.
 */
import {describe,it,expect} from 'vitest';
import {writeFileSync} from 'node:fs';
import {ITEMS,ALL_RECIPES,MOBS} from '../src/sim/data';
import {requiredLevelFor} from '../src/sim/item_level_req';
import {canEquipItem} from '../src/sim/equipment_rules';
import {HIGHFLY_P13_RECIPES,HF_P13_WEAPON_LEVELS} from
  '../src/sim/content/highfly_lv99_native_equipment';
import {HIGHFLY_PF6_EXTENDED_ENABLED} from
  '../src/highfly/training/pf6_xp_curve';
import type {PlayerClass} from '../src/sim/types';

const CLASSES:PlayerClass[]=[
  'warrior','paladin','hunter','rogue','priest','shaman',
  'mage','warlock','druid'];
const BANDS:[[number,number],...[number,number][]]=[
  [1,9],[10,19],[20,20],[21,29],[30,39],[40,49],
  [50,59],[60,69],[70,79],[80,89],[90,99],
];
const isGear=(id:string)=>{
  const item=ITEMS[id];
  return !!item&&(item.kind==='weapon'||item.kind==='armor');
};
const LOOT_SOURCE_INDEX=new Map<string,{mobId:string,levels:[number,number]}[]>();
for(const mob of Object.values(MOBS)){
  if(mob.dummy||mob.ambient)continue;
  for(const drop of mob.loot){
    if(!drop.itemId||!(drop.chance>0))continue;
    const rows=LOOT_SOURCE_INDEX.get(drop.itemId)??[];
    rows.push({mobId:mob.id,levels:[mob.minLevel,mob.maxLevel]});
    LOOT_SOURCE_INDEX.set(drop.itemId,rows);
  }
}
const atLevelMonsterDrops=(id:string,from:number,to:number)=>
  (LOOT_SOURCE_INDEX.get(id)??[]).filter(m=>
    m.levels[0]<=to&&m.levels[1]>=from);
const entryLevel=(id:string)=>{
  try{return requiredLevelFor(ITEMS[id]);}
  catch{return null;}
};

describe('HIGHFLY DEV4 nine-class × 11-band equipment progression inventory',()=>{
  it('reports class-compatible drops, equipment-level gates and learned-recipe candidates without inventing new systems',()=>{
    expect(CLASSES).toHaveLength(9);
    expect(HIGHFLY_PF6_EXTENDED_ENABLED).toBe(false);
    const coverage=new Set(BANDS.flatMap(([lo,hi])=>
      Array.from({length:hi-lo+1},(_,i)=>lo+i)));
    expect(coverage.size).toBe(99);
    expect(Math.max(...coverage)).toBe(99);
    const gearIds=Object.keys(ITEMS).filter(isGear);
    const gearRecipes=ALL_RECIPES.filter(r=>isGear(r.resultItemId));
    const rows=BANDS.flatMap(([from,to])=>CLASSES.map(cls=>{
      const candidates=gearIds.filter(id=>{
        const req=entryLevel(id);
        return req!==null&&req<=to&&canEquipItem(cls,ITEMS[id]);
      });
      const weapons=candidates.filter(id=>ITEMS[id].kind==='weapon');
      const armor=candidates.filter(id=>ITEMS[id].kind==='armor');
      const currentDropWeaponIds=weapons.filter(id=>
        atLevelMonsterDrops(id,from,to).length>0);
      const currentDropArmorIds=armor.filter(id=>
        atLevelMonsterDrops(id,from,to).length>0);
      const nominalNewWeaponRecipes=gearRecipes.filter(r=>
        r.level>=from&&r.level<=to&&ITEMS[r.resultItemId].kind==='weapon'&&
        canEquipItem(cls,ITEMS[r.resultItemId]));
      const nominalNewArmorRecipes=gearRecipes.filter(r=>
        r.level>=from&&r.level<=to&&ITEMS[r.resultItemId].kind==='armor'&&
        canEquipItem(cls,ITEMS[r.resultItemId]));
      const existingP13=HIGHFLY_P13_RECIPES.filter(r=>
        r.level<=to&&canEquipItem(cls,ITEMS[r.resultItemId]));
      const gaps=[] as string[];
      if(currentDropWeaponIds.length===0)
        gaps.push('NO_AT_BAND_MONSTER_WEAPON_DROPS');
      if(nominalNewWeaponRecipes.length===0)
        gaps.push('NO_NOMINAL_NEW_WEAPON_RECIPE_THIS_BAND');
      if(currentDropArmorIds.length===0)
        gaps.push('NO_AT_BAND_MONSTER_ARMOR_DROPS');
      if(nominalNewArmorRecipes.length===0)
        gaps.push('NO_NOMINAL_NEW_ARMOR_RECIPE_THIS_BAND');
      // Report absence of native tier recurrences, not invented demand for
      // 99 unique arms or claim gear itself must drop from local mobs.
      return {
        from,to,cls,
        equipLevelEligibleWeapons:weapons.length,
        equipLevelEligibleArmor:armor.length,
        highestEligibleWeaponRequiredLevel:
          Math.max(0,...weapons.map(id=>entryLevel(id)??0)),
        atBandMonsterWeaponDrops:currentDropWeaponIds,
        atBandMonsterArmorDrops:currentDropArmorIds,
        nominalNewWeaponRecipes:nominalNewWeaponRecipes.map(r=>r.id),
        nominalNewArmorRecipes:nominalNewArmorRecipes.map(r=>r.id),
        p13AvailableAuthoredRecipes:existingP13.map(r=>r.id),
        gaps,
      };
    }));
    const p13Coverage=CLASSES.map(cls=>{
      const at90=HIGHFLY_P13_RECIPES.filter(r=>
        r.level===90&&canEquipItem(cls,ITEMS[r.resultItemId]));
      return {cls,recipes:at90.map(r=>r.id)};
    });
    expect(rows).toHaveLength(99);
    expect(gearIds.length).toBeGreaterThan(50);
    expect(p13Coverage.every(x=>x.recipes.length>0)).toBe(true);
    expect(HF_P13_WEAPON_LEVELS).toEqual([50,60,70,80,90]);
    const summary=BANDS.map(([from,to])=>{
      const band=rows.filter(r=>r.from===from&&r.to===to);
      return {
        from,to,classesCovered:band.length,
        classesWithoutAtBandMobWeaponDrops:
          band.filter(r=>r.atBandMonsterWeaponDrops.length===0).map(r=>r.cls),
        classesWithoutNewNominalWeaponRecipes:
          band.filter(r=>r.nominalNewWeaponRecipes.length===0).map(r=>r.cls),
        classesWithoutNewNominalArmorRecipes:
          band.filter(r=>r.nominalNewArmorRecipes.length===0).map(r=>r.cls),
        p13AuthoredTracksForEveryClass:band.every(r=>
          from<50||r.p13AvailableAuthoredRecipes.length>0),
      };
    });
    const result={
      status:'DEV4_ITEMIZATION_CENSUS_ONLY_NOT_AVAILABLE_IN_REAL_PLAYER_WORLD',
      donorAndHighflySingleSim:true,normalLevelCap:99,
      futureExtendedEnabled:false,originalClasses:CLASSES,
      itemCatalogCount:Object.keys(ITEMS).length,gearCatalogCount:gearIds.length,
      recipeCatalogCount:ALL_RECIPES.length,gearRecipeCatalogCount:gearRecipes.length,
      summaries:summary,
      classBandRows:rows,
      p13Level90Eligibility:p13Coverage,
      caveats:[
        'Level eligibility does NOT prove loot can be reached, picked up, equipped, or retained.',
        'At-band mob loot ONLY includes explicitly itemized drop tables; market, quest and vendor gear need separate proof.',
        'The original itemRequiredLevel may fall back to rare/epic level even when no source exists.',
        'Craft nominal level does NOT verify a teacher/merchant/station or farming the reagents.',
        'No new P13 armors added by audit; check existing donor armors and drops before authoring any.',
        'Never treat equipment stat modifiers as permanent training STR/AGI/VIT/PER/INT.',
        'Nine-class DPS/mitigation/healing balance and S23 real traversal remain unresolved.',
      ],
    };
    writeFileSync('../highfly_golden_dev4_9_classes_11_bands_actual_gear.json',
      JSON.stringify(result,null,2)+'\n','utf8');
    console.info('HF_GOLDEN_DEV4_NINE_CLASS_GEAR_GAPS='+JSON.stringify({
      items:gearIds.length,
      gearRecipes:gearRecipes.length,rows:rows.length,
      bandsNoWeaponRecipeForAllClasses:summary.filter(x=>
        x.classesWithoutNewNominalWeaponRecipes.length===9)
        .map(x=>x.from+'-'+x.to),
      bandsNoArmorRecipeForAllClasses:summary.filter(x=>
        x.classesWithoutNewNominalArmorRecipes.length===9)
        .map(x=>x.from+'-'+x.to),
      p13NineClasses90:p13Coverage.every(x=>x.recipes.length>0),
    }));
  });
});
