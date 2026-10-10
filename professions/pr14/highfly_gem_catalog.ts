/** HIGHFLY V4-02 / PR-14 — first real forgeable elemental inlay.
 * Extends the ORIGINAL ClaudeCraft item and recipe registries, never a second bag.
 * The fire-gem recipe uses real mined copper, native disenchant dust and vendor flux.
 * Frost/Lightning/Air recipes follow in subsequent impact-scoped batches.
 */
import type { ItemDef } from '../types';
import type { ProfessionRecipeRecord } from './types';

export const HIGHFLY_FIRE_GEM_ITEM_ID = 'highfly_fire_gem' as const;
export const HIGHFLY_FIRE_GEM_RECIPE_ID = 'recipe_highfly_fire_gem' as const;

export const HIGHFLY_GEM_ITEMS: Record<string, ItemDef> = {
  highfly_fire_gem: {
    id: 'highfly_fire_gem',
    name: 'Gema ígnea HIGHFLY',
    kind: 'junk',
    quality: 'common',
    sellValue: 0,
  },
};

export const HIGHFLY_GEM_RECIPES: ProfessionRecipeRecord[] = [
  {
    id: HIGHFLY_FIRE_GEM_RECIPE_ID,
    professionId: 'jewelcrafting',
    resultItemId: HIGHFLY_FIRE_GEM_ITEM_ID,
    resultCount: 1,
    reagents: [
      { itemId: 'copper_ore', count: 4 },
      { itemId: 'arcane_dust', count: 2 },
      { itemId: 'smithing_flux', count: 1 },
    ],
    skillReq: 25,
    itemLevelBudget: 10,
    level: 10,
    acquisition: ['trainer'],
    stationType: 'forge',
  },
];
