/** HIGHFLY V4-02 PR16 — real trainer -> recipe -> forge -> equipment -> save.
 * Only availability of training gold/skill, materials and level are TEST fixtures.
 * NO fixture injects knownRecipes or a finished gem; these must be earned through
 * the exact donor Sim.trainRecipe, resolveCraft and Sim.inlayHighflyGem paths.
 */
import { describe, expect, it } from 'vitest';
import { Sim } from '../src/sim/sim';
import { STATIONS } from '../src/sim/data';
import { recipeById } from '../src/sim/content/recipes';
import { resolveCraft } from '../src/sim/professions/crafting';
import { trainingFeeFor } from '../src/sim/professions/training';
import { highflyElementalFinisherReady, highflyWeaponElement } from '../src/sim/combat/highfly_elemental_basic';

const recipes = [
  { recipe: 'recipe_highfly_fire_gem', item: 'highfly_fire_gem', element: 'fire' },
  { recipe: 'recipe_highfly_frost_gem', item: 'highfly_frost_gem', element: 'frost' },
  { recipe: 'recipe_highfly_lightning_gem', item: 'highfly_lightning_gem', element: 'lightning' },
] as const;
const forge = STATIONS.find(s => s.id === 'station_eastbrook_forge');
if (!forge) throw new Error('Native Eastbrook forge absent');

function teleport(sim: Sim, pid: number, x: number, z: number) {
  const player = sim.entities.get(pid);
  if (!player) throw new Error('Missing Hunter');
  player.pos.x = x;
  player.pos.z = z;
  player.prevPos = { ...player.pos };
}

describe('HIGHFLY PR16 real donor recipe trainer and gem persistence', () => {
  for (const { recipe: recipeId, item, element } of recipes) {
    it('trainer purchases ' + recipeId + ' exactly once before native crafting', () => {
      const recipe = recipeById(recipeId);
      expect(recipe).toBeDefined();
      if (!recipe) throw Error('Recipe registry missing ' + recipeId);
      expect(recipe.acquisition).toContain('trainer');
      expect(recipe.stationType).toBe('forge');
      const sim = new Sim({ seed: 160, playerClass: 'warrior', noPlayer: true, autoEquip: false });
      const pid = sim.addPlayer('warrior', 'BlacksmithHunter');
      const meta = sim.players.get(pid), p = sim.entities.get(pid);
      if (!meta || !p) throw Error('Player did not enter actual Sim');
      sim.setPlayerLevel(30, pid); // FIXTURE: player level, NOT earned in this test
      meta.craftSkills.jewelcrafting = 75; // FIXTURE: proficiency, NOT earned here
      meta.copper = 100000; // FIXTURE: training and craft budget, NOT earned here
      const fee = trainingFeeFor(recipe);
      const originalCopper = meta.copper;
      expect(meta.knownRecipes.has(recipeId)).toBe(false);
      expect(sim.countItem(item, pid)).toBe(0);
      teleport(sim, pid, 5000, 5000);
      sim.trainRecipe(recipeId, pid);
      expect(meta.lastTrainResult?.reason).toBe('train_out_of_range');
      expect(meta.knownRecipes.has(recipeId)).toBe(false);
      expect(meta.copper).toBe(originalCopper);
      // The original forge master teaches the source record for gold.
      teleport(sim, pid, forge.pos.x, forge.pos.z);
      sim.trainRecipe(recipeId, pid);
      expect(meta.lastTrainResult?.ok).toBe(true);
      expect(meta.knownRecipes.has(recipeId)).toBe(true);
      expect(meta.copper).toBe(originalCopper - fee);
      sim.trainRecipe(recipeId, pid);
      expect(meta.lastTrainResult?.reason).toBe('train_already_known');
      expect(meta.copper).toBe(originalCopper - fee);
      // Materials are fixtures, but result is minted ONLY by the genuine craft.
      for (const reagent of recipe.reagents) {
        sim.addItem(reagent.itemId, reagent.count, pid);
      }
      sim.addItem('worn_sword', 1, pid);
      sim.equipItem('worn_sword', pid);
      const crafted = resolveCraft(sim.ctx, pid, recipeId);
      expect(crafted.ok, JSON.stringify(crafted)).toBe(true);
      expect(sim.countItem(item, pid)).toBe(1);
      expect(highflyElementalFinisherReady(p)).toBe(false);
      const inlay = sim.inlayHighflyGem(item, pid);
      expect(inlay).toMatchObject({ ok: true, gem: element });
      expect(sim.countItem(item, pid)).toBe(0);
      expect(highflyWeaponElement(p)).toBe(element);
      expect(highflyElementalFinisherReady(p)).toBe(true);
      const save = JSON.parse(JSON.stringify(sim.serializeCharacter(pid)));
      expect(save.knownRecipes).toContain(recipeId);
      expect(save.equipmentInstance.mainhand.highflyGem).toBe(element);
      const reloaded = new Sim({ seed: 161, playerClass: 'warrior', noPlayer: true, autoEquip: false });
      const other = reloaded.addPlayer('warrior', 'BlacksmithHunter', { state: save });
      expect(reloaded.players.get(other)?.knownRecipes.has(recipeId)).toBe(true);
      expect(reloaded.players.get(other)?.equipmentInstance.mainhand?.highflyGem).toBe(element);
      expect(highflyElementalFinisherReady(reloaded.entities.get(other)!)).toBe(true);
    });
  }
  it('cannot learn without native affordability or tier, and cannot claim free gems', () => {
    const sim = new Sim({ seed: 162, playerClass: 'warrior', noPlayer: true, autoEquip: false });
    const pid = sim.addPlayer('warrior', 'NoviceHunter');
    const meta = sim.players.get(pid);
    if (!meta) throw Error('Player missing');
    const recipe = recipeById('recipe_highfly_lightning_gem');
    if (!recipe) throw Error('Lightning recipe missing');
    teleport(sim, pid, forge.pos.x, forge.pos.z);
    meta.copper = 100000;
    meta.craftSkills.jewelcrafting = 0;
    sim.trainRecipe(recipe.id, pid);
    expect(meta.lastTrainResult?.reason).toBe('train_tier_unmet');
    expect(meta.knownRecipes.has(recipe.id)).toBe(false);
    expect(sim.countItem('highfly_lightning_gem', pid)).toBe(0);
    meta.craftSkills.jewelcrafting = 75; // FIXTURE to examine no-gold gate
    meta.copper = 0;
    sim.trainRecipe(recipe.id, pid);
    expect(meta.lastTrainResult?.reason).toBe('train_cannot_afford');
    expect(meta.knownRecipes.has(recipe.id)).toBe(false);
    expect(meta.copper).toBe(0);
  });
});
