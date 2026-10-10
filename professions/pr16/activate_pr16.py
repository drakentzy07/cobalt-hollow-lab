#!/usr/bin/env python3
"""HIGHFLY V4-02 PR16: real gem progression guide on GOLDEN HUD.
This is a presentation-only adapter layered AFTER PR14 and PR15.
No new Sim authority, craft action, inventory, recipe, training or currency path.
"""
from pathlib import Path

p=Path('src/highfly/game_c1_runtime.ts')
src=p.read_text(encoding='utf-8')
anchor='function selectHighflyInlayGem(callback: (gemItemId: string) => void): void {'
assert src.count(anchor)==1, 'PR16 missing unique PR15 GEM picker seam'
assert 'function showHighflyGemGuide()' not in src, 'PR16 duplicate guide'
guide="""/** PR16: explanation ONLY; every value comes from the live native SIM.
 * Crafting and trainer actions stay in ClaudeCraft's ORIGINAL windows.
 */
function showHighflyGemGuide(): void {
  document.getElementById('hf-gem-guide')?.remove();
  document.getElementById('hf-gem-inlay-picker')?.remove();
  const sim = game()?.sim;
  const pid = sim?.player?.id;
  if (!sim || pid == null) {
    toast('FORJA', 'Entrá al mundo para consultar las gemas.');
    return;
  }
  const known = new Set<string>(sim.craftingIdentity?.knownRecipes ?? []);
  const catalog = [
    { id: 'highfly_fire_gem', recipeId: 'recipe_highfly_fire_gem', label: 'Fuego' },
    { id: 'highfly_frost_gem', recipeId: 'recipe_highfly_frost_gem', label: 'Hielo' },
    { id: 'highfly_lightning_gem', recipeId: 'recipe_highfly_lightning_gem', label: 'Rayo' },
  ];
  const dialog = document.createElement('section');
  dialog.id = 'hf-gem-guide';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-label', 'Guía de gemas HIGHFLY');
  dialog.style.cssText =
    'position:fixed;right:12px;bottom:12px;z-index:10000;width:min(370px,94vw);' +
    'max-height:calc(100vh - 24px);overflow-y:auto;box-sizing:border-box;' +
    'padding:14px;background:#132033;color:#f4f7ff;border:1px solid #90a4c6;' +
    'border-radius:12px;box-shadow:0 9px 30px #000c;font:14px/1.5 system-ui,sans-serif;';
  const title = document.createElement('h3');
  title.textContent = 'HIGHFLY · GEMAS Y FORJA';
  title.style.cssText = 'margin:0 0 4px;font-size:17px';
  dialog.append(title);
  const intro = document.createElement('p');
  intro.textContent = 'Miná minerales, obtené esencia al desencantar, aprendé la receta con la maestra de forja y fabricá una gema en Elaboración. Solo una gema incrustada en el arma equipada habilita ATK4.';
  intro.style.cssText = 'margin:0 0 10px;color:#c6d5eb';
  dialog.append(intro);
  for (const entry of catalog) {
    const recipe = sim.recipeList?.find((row: { id: string }) => row.id === entry.recipeId);
    const row = document.createElement('section');
    row.dataset.highflyGemRecipe = entry.recipeId;
    row.style.cssText = 'padding:8px 0;border-top:1px solid #44516a';
    const heading = document.createElement('strong');
    heading.textContent = entry.label + ' · ' +
      (known.has(entry.recipeId) ? 'Receta aprendida' : 'Aprender en forja');
    row.append(heading);
    const detail = document.createElement('div');
    const skill = Number(sim.craftSkills?.jewelcrafting ?? 0);
    detail.textContent = recipe
      ? 'Joyería: ' + skill.toFixed(0) + ' · Receta: ' + recipe.skillReq +
        ' · Nivel de objeto: ' + recipe.level +
        ' · Gemas en bolsa: ' + sim.countItem(entry.id, pid)
      : 'Receta todavía no registrada en este mundo.';
    detail.style.color = '#c7d3e4';
    row.append(detail);
    if (recipe) {
      const ingredients = document.createElement('div');
      ingredients.textContent = 'Materiales: ' + recipe.reagents.map((r: { itemId: string; count: number }) =>
        r.itemId + ' ' + sim.countItem(r.itemId, pid) + '/' + r.count).join(' · ');
      ingredients.style.cssText = 'font-size:12px;color:#aebfda;overflow-wrap:anywhere';
      row.append(ingredients);
    }
    dialog.append(row);
  }
  const buttons = document.createElement('div');
  buttons.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-top:12px';
  function action(label: string, target: string): void {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.style.cssText = 'min-height:42px;padding:7px 10px;border:1px solid #92a6c9;' +
      'border-radius:8px;background:#2c4267;color:#fff;flex:1';
    button.addEventListener('click', () => {
      if (!target) { dialog.remove(); return; }
      const nativeButton = document.getElementById(target);
      if (!(nativeButton instanceof HTMLButtonElement)) {
        toast('MENÚ', 'Abrí el menú principal del juego para continuar.');
        return;
      }
      dialog.remove();
      nativeButton.click();
    });
    buttons.append(button);
  }
  action('Profesiones', 'mm-professions');
  action('Elaboración', 'mm-crafting');
  action('Cerrar', '');
  dialog.append(buttons);
  document.body.append(dialog);
}

"""
src=src.replace(anchor,guide+anchor,1)
old="""  if (available.length === 0) {
    toast('SIN GEMAS', 'Fabricá una gema de Fuego, Hielo o Rayo con Jewelcrafting.');
    return;
  }"""
new="""  if (available.length === 0) {
    showHighflyGemGuide();
    return;
  }"""
assert src.count(old)==1,'PR16 no-gem guide anchor missing'
src=src.replace(old,new,1)
p.write_text(src,encoding='utf-8')
print('HIGHFLY_V4_02_PR16_NATIVE_GEM_GUIDE_NO_FREE_ITEMS=1')
