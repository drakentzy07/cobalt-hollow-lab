# HIGHFLY DEV · P13 — CATÁLOGO EXACTO DE HERRERÍA NATIVA LV50–99
**Fecha:** 11/10/2026. **Estado:** P13 RUN #38157787400 GREEN; contenido **DEV, no publicado en PLAY/Pages**.

## 15 recetas: tres líneas por cinco niveles
Las recetas están en `professions/p13/highfly_lv99_native_equipment.ts`; el adaptador `activate_p13.py` las registra en los ÍNDICES NATIVOS `ITEMS`, `ALL_RECIPES` y `recipeById` de ClaudeCraft; sin duplicar herrería ni inventario. Cada fórmula produce **exactamente 1 arma**, utiliza `weaponcrafting`, `stationType: forge` y `acquisition: ['trainer']`. Los grupos que pueden equipar son:
- `warrior`: Warrior, Paladin y Shaman; modelo base `worn_sword`.
- `scout`: Rogue y Hunter; modelo base `rusty_dagger`.
- `caster`: Mage, Priest, Warlock y Druid; modelo base `gnarled_staff`.

| Nivel mínimo de equipamiento | Nivel nominal de fórmula | skillReq declarado de herrería | Materiales **por una** de las 3 armas | Rareza | Espada min–max | Daga min–max | Bastón min–max | Bastón spellPower |
|---:|---:|---:|---|---|---:|---:|---:|---:|
| 50 | 50 | 75 | `rough_hide ×5`, `arcane_essence ×3`, `smithing_flux ×3` | uncommon | 18–28 | 15–25 | 18–28 | +10 |
| 60 | 60 | 85 | `sharp_claw ×5`, `curved_tusk ×5`, `smithing_flux ×3` | rare | 22–34 | 17–29 | 22–34 | +12 |
| 70 | 70 | 95 | `spider_silk ×8`, `arcane_essence ×7`, `smithing_flux ×5` | rare | 25–39 | 20–34 | 25–39 | +14 |
| 80 | 80 | 110 | `arcane_shard ×3`, `sharp_claw ×9`, `smithing_flux ×6` | epic | 29–45 | 23–39 | 29–45 | +16 |
| 90 | 90 | 125 | `arcane_shard ×7`, `arcane_essence ×12`, `smithing_flux ×8` | epic | 32–50 | 26–44 | 32–50 | +18 |

**Multiplicar ×3** para producir una espada, una daga y un bastón del mismo nivel antes de descuentos nativos de especialización; las cantidades consumidas pueden ser menores al nominal por el sistema ClaudeCraft. Se verificó una **forja real de arma LV50** con consumo y recarga del personaje, no las 15 forjas desde cero. Los requisitos `skillReq` son authored: el donor `src/sim/professions/crafting.ts` dice expresamente que **NO existe una barrera estricta de admisión por skillReq**; el campo afecta experiencia/calidad y no debe prometerse como bloqueo real de nivel de oficio hasta implementarlo/testearlo. La adquisición por entrenador es un contrato declarado, **no** un NPC con la receta añadido/verificado para esas 15 entradas todavía.

### IDs exactos (inventario y receta)
Cada fórmula `recipe_hf_p13_<track>_<level>` genera el ítem `hf_p13_<track>_<level>`.
`track ∈ {warrior,scout,caster}`; `level ∈ {50,60,70,80,90}`. No hay ID duplicado de item ni recipe; todas las entradas son nuevas y en el mismo registro oficial.
- Armas **soulbound**, `noMarketList=true` y `sellValue=0` por seguridad económica del prototipo.
- No añaden stats primarias `STR,AGI,VIT,PER,INT`; éstas pertenecen solo a sesiones de entrenamiento real. Las armas sí modifican *daño de equipo* y el bastón poder mágico adicional.
- 80 plantillas de mobs HIGHFLY y recetas del donor permanecen. El material fuente en la banda fue comprobado como existente; falta simular farmeo legítimo, probabilidad estadística de drop, gasto de cobre, acceso a la forja y entrenamiento de oficio. **No se garantiza economía completa todavía**.
- LV1–20: ClaudeCraft original conservado; LV21–49: HIGHFLY/Claude existente, expansión de materiales y monsters. LV50/60/70/80/90: nueva escalera P13. LV91–99 sigue usando la de 90 hasta que el balance determine un tramo final; NO hay nuevas recetas LV99 P13. Extended 100+ está **desactivado**.

## Estado por sistema
| Sub-sistema | PLAY V4-02 | PLAY V4-03 P10 candidato | DEV P13 |
|---|---|---|---|
| Personaje y Hunter | Pública | 9 clases/99 con RUN GREEN | Conservado |
| Gemas | Tres elementos base | Fuego/Hielo/Rayo y ATK4 real | Sin nuevas gemas P13 |
| Profesiones | Donor y adaptadores previos según actual build | PR1–PR16 probados | 15 recetas nuevas de `weaponcrafting` |
| Loot | Base original | Mat. y cadáver/forja con mismo `Sim` | Fuentes de 15 nuevas recetas comprobadas por registro |
| 8 expediciones + élites | No declarar publicado | Opt-in V4-03 GREEN | Sin nuevos monstruos P13 |
| Skins/legendarios y Extended 100+ | Pendiente | Pendiente | Pendiente |

## Gates pendientes (no llamar listo final)
1. 15 recetas: gate real de entrenamiento y adquisición por NPC/maestro; dónde se aprende cada receta.
2. 15 artes: crafteo real con materiales obtenidos jugando (no fixtures), guardado de item/gema, UI e iconos.
3. Balance económico de costos y rarezas, especializaciones y tiers de todas las armas por nueve clases.
4. Progresión de gemas de fuego/hielo/rayo; minerales, gem crafting, nodo herrería, sockets, ATK4 por nivel.
5. Sucesivos P14–P18 para cerrar LV1–99 y Extended 100+ futuro.

**Verificación CI:** https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38157787400 ; build GAME candidata https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38148356731 .
