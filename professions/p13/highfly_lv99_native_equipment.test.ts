/** DEV P13 — real ClaudeCraft registry + Hunter 50–99 FIRST itemization tranche.
 * A PASS means 15 gear/recipes are valid and material-sourced, NOT full
 * character 1→99, 9-class combat balance or profession trainer reachability.
 */
import {describe,it,expect} from 'vitest';
import {ITEMS,ALL_RECIPES,MOBS} from '../src/sim/data';
import {canEquipItem} from '../src/sim/equipment_rules';
import {requiredLevelFor,meetsLevelRequirement} from '../src/sim/item_level_req';
import type {PlayerClass} from '../src/sim/types';
import {HIGHFLY_P13_ITEMS,HIGHFLY_P13_RECIPES,HF_P13_WEAPON_LEVELS,
  hfP13ItemId,hfP13RecipeId} from '../src/sim/content/highfly_lv99_native_equipment';

const CLASSES:PlayerClass[]=['warrior','paladin','hunter','rogue','priest',
  'shaman','mage','warlock','druid'];
const TRACK_CLASS={
 warrior:['warrior','paladin','shaman'],
 scout:['rogue','hunter'],
 caster:['priest','mage','warlock','druid'],
} as const;
const VENDOR_REAGENTS=new Set(['smithing_flux']);
describe('HIGHFLY P13 real item and recipe registry 50–99 smoke',()=>{
  it('adds 15 level-gated weapons and genuine native forge recipes to five late stages',()=>{
    expect(HF_P13_WEAPON_LEVELS).toEqual([50,60,70,80,90]);
    expect(Object.keys(HIGHFLY_P13_ITEMS)).toHaveLength(15);
    expect(HIGHFLY_P13_RECIPES).toHaveLength(15);
    const originalRecipeCount=ALL_RECIPES.filter(r=>!r.id.startsWith('recipe_hf_p13_')).length;
    expect(originalRecipeCount).toBe(212);
    const allOutputIds=new Set<string>();
    for(const lv of HF_P13_WEAPON_LEVELS){
      for(const track of ['warrior','scout','caster'] as const){
        const id=hfP13ItemId(lv,track),recipeId=hfP13RecipeId(lv,track);
        const item=ITEMS[id],recipe=ALL_RECIPES.find(r=>r.id===recipeId);
        expect(item).toBeDefined();
        expect(recipe).toBeDefined();
        expect(item).toBe(HIGHFLY_P13_ITEMS[id]);
        expect(recipe).toMatchObject({
          resultItemId:id,professionId:'weaponcrafting',level:lv,
          stationType:'forge',acquisition:['trainer'],resultCount:1
        });
        expect(item.kind).toBe('weapon');
        expect(item.stats??{}).toEqual({}); // real-world Training remains only primary stats owner
        expect(requiredLevelFor(item)).toBe(lv);
        expect(meetsLevelRequirement(lv-1,item)).toBe(false);
        expect(meetsLevelRequirement(lv,item)).toBe(true);
        expect(item.soulbound).toBe(true);
        expect(item.noMarketList).toBe(true);
        expect(allOutputIds.has(id)).toBe(false);
        allOutputIds.add(id);
        for(const cls of CLASSES){
          expect(canEquipItem(cls,item)).toBe(
            (TRACK_CLASS[track] as readonly string[]).includes(cls));
        }
        for(const reagent of recipe!.reagents){
          expect(ITEMS[reagent.itemId]).toBeDefined();
          expect(reagent.count).toBeGreaterThan(0);
          if(VENDOR_REAGENTS.has(reagent.itemId))continue;
          const atLevelDrop=Object.values(MOBS).some(m=>m.id.startsWith('hf_hunt_')&&
            m.minLevel<=lv&&m.maxLevel>=lv&&
            m.loot.some(l=>l.itemId===reagent.itemId&&l.chance>0));
          expect(atLevelDrop, 'no real at-level native HIGHFLY corpse source for '+reagent.itemId+' LV'+lv).toBe(true);
        }
      }
    }
    const sorted=HF_P13_WEAPON_LEVELS.map(lv=>
      (ITEMS[hfP13ItemId(lv,'warrior')].kind==='weapon'?
       ITEMS[hfP13ItemId(lv,'warrior')].weapon?.max??0:0));
    expect(sorted).toEqual([...sorted].sort((a,b)=>a-b));
    expect(ALL_RECIPES.filter(r=>r.id.startsWith('recipe_hf_p13_'))).toHaveLength(15);
  });
});
