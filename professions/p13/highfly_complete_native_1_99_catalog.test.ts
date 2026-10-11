/** HIGHFLY P13 — full original ClaudeCraft + HIGHFLY crafting catalogue,
 * exact 1–99 nominal level matrix, every material and quantity. EXPORT ONLY.
 * This is not an endorsement that any NPC sells/unlocks each recipe.
 */
import {describe,it,expect} from 'vitest';
import {writeFileSync} from 'node:fs';
import {ALL_RECIPES,ITEMS} from '../src/sim/data';
import {requiredLevelFor} from '../src/sim/item_level_req';

const levels=Array.from({length:99},(_,i)=>i+1);
const escape=(s:string)=>s.replaceAll('|','\\|').replaceAll('\n',' ');
const recipes=ALL_RECIPES.map(r=>{
  const item=ITEMS[r.resultItemId];
  let itemRequiredLevel:number|null=null;
  if(item){try{itemRequiredLevel=requiredLevelFor(item)}catch{}}
  return {
    id:r.id,profession:r.professionId,
    nominalRecipeLevel:r.level??0,
    professionSkillRequirement:r.skillReq??0,
    itemRequiredLevel,
    outputId:r.resultItemId,outputName:item?.name??null,
    outputCount:r.resultCount,
    equipmentKind:item?.kind??null,
    rarity:item?.quality??null,
    station:r.stationType??null,
    acquisition:r.acquisition??[],
    materials:r.reagents.map(x=>({id:x.itemId,
      name:ITEMS[x.itemId]?.name??null,quantity:x.count})),
  };
});
describe('P13 full source-of-truth LV1-99 recipe + resource catalog',()=>{
  it('exports EVERY real recipe and all nominal tiers without inventing 99 levels of recipes',()=>{
    const ids=recipes.map(r=>r.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(recipes.length).toBeGreaterThanOrEqual(227);
    const lines=[
      '# HIGHFLY — CATÁLOGO NATIVO REAL · RECETAS, CANTIDADES Y NIVELES 1–99',
      '',
      '**Estado:** auditoría de contenido real, no certificación de progresión, precios ni desbloqueo por NPC.',
      '',
      'Conserva recetas ClaudeCraft y PR14–16 de gemas, más P13 en DEV. Algunas recetas requieren habilidad de oficio hasta 125; esto no equivale a nivel de Hunter 125.',
      '',
      'Para cada nivel se listan las recetas con nivel NOMINAL exactamente igual al nivel de Hunter; un nivel sin novedades NO indica que las recetas previas dejen de poder usarse.',
      '',
      '| LV | Nuevas recetas nominales | Recetas disponibles por nivel nominal (acumuladas) | Armas/equipo nuevos |',
      '|---:|---:|---:|---:|',
      ...levels.map(lv=>{
        const n=recipes.filter(r=>r.nominalRecipeLevel===lv);
        return '| '+lv+' | '+n.length+' | '+recipes.filter(r=>r.nominalRecipeLevel<=lv).length+' | '+n.filter(r=>['weapon','armor'].includes(r.equipmentKind??'')).length+' |';
      }),
      '',
      '## Todas las fórmulas con sus materiales EXACTOS',
      '',
      '| Nivel nominal | Oficio | Fórmula (ID) | Resultado (cantidad × ítem) | Skill oficio declarado | Estación | Adquisición | Materiales y cantidades |',
      '|---:|---|---|---|---:|---|---|---|',
      ...recipes.sort((a,b)=>a.nominalRecipeLevel-b.nominalRecipeLevel||a.id.localeCompare(b.id)).map(r=>
        '| '+r.nominalRecipeLevel+' | '+escape(r.profession)+
        ' | `'+escape(r.id)+'` | '+r.outputCount+' × '+escape(r.outputName??r.outputId)+
        ' | '+r.professionSkillRequirement+' | '+escape(r.station??'—')+
        ' | '+escape(r.acquisition.join(', ')||'sin puerta de aprendizaje')+
        ' | '+r.materials.map(m=>m.quantity+' × '+escape(m.name??m.id)+' (`'+m.id+'`)').join('; ')+' |'),
      '',
      '## Advertencias sobre desbloqueo y balance',
      '',
      '- `level` es nivel nominal de la receta; NO prueba que el Hunter posea entrenamiento, materiales, NPC o receta aprendida.',
      '- `skillReq` de ClaudeCraft no funciona siempre como bloqueo duro de fabricación. El catálogo conserva el dato, no promete gate.',
      '- `itemRequiredLevel` se consulta al equipar y puede diferir del nivel nominal de receta; todos estos campos están exportados en JSON.',
      '- Algunas recetas requieren materiales de jefe/quest/gathering o NPC: comprobar legalmente cada fuente antes de habilitar el release.',
      '- La cantidad consumida puede reducirse por bonificaciones reales de profesiones del donor.',
      '- Extended Hunter LV100+ sigue DESACTIVADO.',
      '',
    ];
    const data={
      source:'ONE_NATIVE_ITEMS_AND_ALL_RECIPES',
      normalHunterCap:99,extended100PlusEnabled:false,
      note:'CI content inventory, not fully reachable nor balanced',
      recipeCount:recipes.length,
      recipes,
      levels:levels.map(lv=>({level:lv,
        addedNominally:recipes.filter(r=>r.nominalRecipeLevel===lv).map(r=>r.id),
        cumulativeNominal:recipes.filter(r=>r.nominalRecipeLevel<=lv).length})),
    };
    writeFileSync('../HIGHFLY_FULL_1_99_NATIVE_RECIPE_CATALOG.md',lines.join('\n'),'utf8');
    writeFileSync('../HIGHFLY_FULL_1_99_NATIVE_RECIPE_CATALOG.json',JSON.stringify(data,null,2)+'\n','utf8');
    console.log('HF_COMPLETE_NATIVE_RECIPE_CATALOG_EMITTED='+JSON.stringify({
      recipes:data.recipeCount,maxNominal:Math.max(...recipes.map(r=>r.nominalRecipeLevel)),
      afterLv42:recipes.filter(r=>r.nominalRecipeLevel>42).length,
      lv50To99:recipes.filter(r=>r.nominalRecipeLevel>=50).length,
      levelsMissingNewRecipes:levels.filter(lv=>!recipes.some(r=>r.nominalRecipeLevel===lv)).length,
    }));
    expect(data.levels).toHaveLength(99);
  });
});
