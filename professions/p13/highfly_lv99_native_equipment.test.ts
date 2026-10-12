/** DEV P13 — real ClaudeCraft registry + Hunter 50–99 FIRST itemization tranche.
 * A PASS means 15 gear/recipes are valid and material-sourced, NOT full
 * character 1→99, 9-class combat balance or profession trainer reachability.
 */
import {describe,it,expect} from 'vitest';
import {ITEMS,ALL_RECIPES,MOBS} from '../src/sim/data';
import {canEquipItem} from '../src/sim/equipment_rules';
import {recipeById} from '../src/sim/content/recipes';
import {resolveCraft} from '../src/sim/professions/crafting';
import {stationsOfType} from '../src/sim/professions/stations';
import {STATIONS,BUILTIN_WORLD} from '../src/sim/data';
import {Sim} from '../src/sim/sim';
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
    expect(originalRecipeCount).toBe(215); // 212 original + 3 native LV35 P15
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
        // Canonical resolver drives the REAL native Sim craft command. A
        // data.ts-only list registration would falsely pass without this.
        expect(recipeById(recipeId)).toBeDefined();
        expect(recipeById(recipeId)!.resultItemId).toBe(id);
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

  it('one native Sim performs a real late-tier craft and preserves the crafted item',()=>{
    const recipeId=hfP13RecipeId(50,'warrior');
    const recipe=recipeById(recipeId)!;
    expect(recipe).toBeDefined();
    const sim=new Sim({seed:7313,playerClass:'warrior',autoEquip:false,
      compulsoryTutorial:false,riftPortals:false,
      world:{...BUILTIN_WORLD,camps:[]}});
    const pid=sim.playerId;
    sim.setPlayerLevel(50,pid); // CI fixture only, never gameplay.
    const meta=sim.players.get(pid)!;
    meta.craftSkills.weaponcrafting=125;
    meta.knownRecipes.add(recipeId); // fixture simulates real trainer acquisition.
    for(const ing of recipe.reagents){
      for(let i=0;i<ing.count;i++)sim.addItem(ing.itemId,1,pid);
    }
    const station=stationsOfType(STATIONS,'forge')[0];
    expect(station).toBeDefined();
    const entity=sim.entities.get(pid)!;
    entity.pos.x=station.pos.x;
    entity.pos.z=station.pos.z;
    entity.prevPos={...entity.pos};
    const output=hfP13ItemId(50,'warrior');
    expect(sim.countItem(output,pid)).toBe(0);
    const result=resolveCraft((sim as any).ctx,pid,recipeId);
    expect(result.ok,JSON.stringify(result)).toBe(true);
    expect(sim.countItem(output,pid)).toBe(1);
    // ClaudeCraft's specialization discounts some reagents at profession 125;
    // each ingredient must be CONSUMED, but the remainder need not be zero.
    for(const ing of recipe.reagents){
      expect(sim.countItem(ing.itemId,pid),ing.itemId+' should be consumed').toBeLessThan(ing.count);
    }
    const save=JSON.parse(JSON.stringify(sim.serializeCharacter(pid)));
    const fresh=new Sim({seed:7413,playerClass:'warrior',autoEquip:false,noPlayer:true,
      compulsoryTutorial:false,riftPortals:false,world:{...BUILTIN_WORLD,camps:[]}});
    const newPid=fresh.addPlayer('warrior','P13 smith',{state:save,tutorialGreetingSent:true});
    expect(fresh.countItem(output,newPid)).toBe(1);
  });
});
