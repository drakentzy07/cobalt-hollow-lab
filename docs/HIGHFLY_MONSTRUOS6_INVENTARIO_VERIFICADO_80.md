# HIGHFLY MONSTRUOS 6 — INVENTARIO AUTOMÁTICO VERIFICADO

**Corte:** 2026-10-10. **Ámbito:** laboratorio P02-I / P02-J; NO equivale a gameplay principal V4. **Referencia:** `highfly-monsters-lv99-pass02i-biome-survival-fps` y upstream ClaudeCraft `9b57e49c9676d75962700f828cc00a50a9a988b5`.

## Conteo e interpretación
- **80 plantillas HIGHFLY registradas:** 64 normales (8 familias × 8 niveles de banda) + 8 élites + 8 capitanes regionales.
- **32 plantillas normales ubicadas en mapa**: cuatro familias por zona × ocho instancias; aparecen dos monstruos por familia (8 enemigos por instancia).
- **32 plantillas normales sin campamento en estas instancias**: existen registradas, pero NO deben contarse como spawns activos.
- **16 élites/capitanes opcionales**: dos modos alternativos por zona, uno de cada modo si se selecciona; remplazan un normal, NO coexisten los 16.
- **LV1–20**: criaturas originales de ClaudeCraft permanecen intactas. Este informe audita la extensión HIGHFLY 21–99, NO los cientos de registros base, mascotas, invocaciones o jefes legendarios.
- **Cobre 100%** representa cantidad por muerte en plantilla, no recompensa premium; `Math.round(originalCopper * (1 + (minLevel-20)*0.075))`.
- **Material natural** es el único loot nativo explícitamente retenido por el filtro HIGHFLY del donante; los drops de misión y equipo raro del donante NO se heredan a estas nuevas plantillas.
- **Reactivo adicional** se agrega una sola vez por muerte con la probabilidad indicada y ya debe existir en ITEMS/ALL_RECIPES. No es un drop garantizado.
- **Recolección** son tags de los componentes de cadáver del motor original, NO la misma cosa que loot por muerte ni una cantidad garantizada.
- **Élites y capitanes** copian las entradas base (`source.loot.map`) sin nueva tabla propia; el motor original puede aplicar efectos propios de calidad/élite. No hay cinco jefes legendarios integrados por este PASS.

## Resumen de mapas
| LV | Mapa | Bioma | Banda | Cuatro familias con campamento |
|---|---|---|---|---|
| 21–29 | Umbral de los Aullidos | haunt | E-D | Forest Wolf, Sableweb Lurker, Restless Bones, Ridge Stalker |
| 30–39 | Marisma del Velo | marsh | D | Sableweb Lurker, Forest Wolf, Boneclad Revenant, Stormcrag Elemental |
| 40–49 | Desfiladero Colmillo | peaks | C | Thornpeak Ogre, Ridge Stalker, Restless Bones, Stormcrag Elemental |
| 50–59 | Tundra del Silencio | frost | B | Forest Wolf, Ridge Stalker, Boneclad Revenant, Stormcrag Elemental |
| 60–69 | Yermo de las Escamas | volcano | B-A | Dragonkin Broodguard, Thornpeak Ogre, Stormcrag Elemental, Boneclad Revenant |
| 70–79 | Jardín Marchito | garden | A | Sableweb Lurker, Forest Wolf, Stormcrag Elemental, Boneclad Revenant |
| 80–89 | Cresta del Trueno | gale | S | Stormcrag Elemental, Dragonkin Broodguard, Thornpeak Ogre, Ridge Stalker |
| 90–99 | Orilla del Abismo | cave | S-Nacional | Dragonkin Broodguard, Boneclad Revenant, Restless Bones, Thornpeak Ogre |

## A. Normales situados en las ocho instancias (32 plantillas)
| LV | Mapa | Monstruo (ID) | Cobre 100% | Material natural | Reactivo adicional | Recolección |
|---|---|---|---:|---|---|---|
| 21–29 | Umbral de los Aullidos | Forest Wolf (`hf_hunt_wolf_21`) | 9 | wolf_fang (45%) | rough_hide (10%) | hide, fang |
| 21–29 | Umbral de los Aullidos | Sableweb Lurker (`hf_hunt_spider_21`) | 15 | spider_leg (40%) | spider_silk (10%) | venomSac, silk |
| 21–29 | Umbral de los Aullidos | Restless Bones (`hf_hunt_skeleton_21`) | 32 | bone_fragments (60%) | homespun_cloth (10%) | — |
| 21–29 | Umbral de los Aullidos | Ridge Stalker (`hf_hunt_stalker_21`) | 65 | — | rough_hide (10%) | hide, claw, meat |
| 30–39 | Marisma del Velo | Sableweb Lurker (`hf_hunt_spider_30`) | 25 | spider_leg (40%) | spider_silk (10%) | venomSac, silk |
| 30–39 | Marisma del Velo | Forest Wolf (`hf_hunt_wolf_30`) | 14 | wolf_fang (45%) | rough_hide (10%) | hide, fang |
| 30–39 | Marisma del Velo | Boneclad Revenant (`hf_hunt_revenant_30`) | 175 | bone_fragments (60%) | homespun_cloth (10%) | — |
| 30–39 | Marisma del Velo | Stormcrag Elemental (`hf_hunt_elemental_30`) | 140 | — | arcane_dust (9%) | — |
| 40–49 | Desfiladero Colmillo | Thornpeak Ogre (`hf_hunt_ogre_40`) | 188 | ogre_toe_ring (35%) | curved_tusk (10%) | tusk |
| 40–49 | Desfiladero Colmillo | Ridge Stalker (`hf_hunt_stalker_40`) | 150 | — | rough_hide (10%) | hide, claw, meat |
| 40–49 | Desfiladero Colmillo | Restless Bones (`hf_hunt_skeleton_40`) | 75 | bone_fragments (60%) | arcane_dust (9%) | — |
| 40–49 | Desfiladero Colmillo | Stormcrag Elemental (`hf_hunt_elemental_40`) | 200 | — | arcane_essence (6%) | — |
| 50–59 | Tundra del Silencio | Forest Wolf (`hf_hunt_wolf_50`) | 26 | wolf_fang (45%) | rough_hide (12%) | hide, fang |
| 50–59 | Tundra del Silencio | Ridge Stalker (`hf_hunt_stalker_50`) | 195 | — | rough_hide (12%) | hide, claw, meat |
| 50–59 | Tundra del Silencio | Boneclad Revenant (`hf_hunt_revenant_50`) | 325 | bone_fragments (60%) | arcane_essence (6%) | — |
| 50–59 | Tundra del Silencio | Stormcrag Elemental (`hf_hunt_elemental_50`) | 260 | — | arcane_essence (6%) | — |
| 60–69 | Yermo de las Escamas | Dragonkin Broodguard (`hf_hunt_dragonkin_60`) | 360 | — | sharp_claw (12%) | hide, fang, claw |
| 60–69 | Yermo de las Escamas | Thornpeak Ogre (`hf_hunt_ogre_60`) | 300 | ogre_toe_ring (35%) | curved_tusk (12%) | tusk |
| 60–69 | Yermo de las Escamas | Stormcrag Elemental (`hf_hunt_elemental_60`) | 320 | — | arcane_essence (6%) | — |
| 60–69 | Yermo de las Escamas | Boneclad Revenant (`hf_hunt_revenant_60`) | 400 | bone_fragments (60%) | arcane_essence (6%) | — |
| 70–79 | Jardín Marchito | Sableweb Lurker (`hf_hunt_spider_70`) | 67 | spider_leg (40%) | spider_silk (14%) | venomSac, silk |
| 70–79 | Jardín Marchito | Forest Wolf (`hf_hunt_wolf_70`) | 38 | wolf_fang (45%) | rough_hide (14%) | hide, fang |
| 70–79 | Jardín Marchito | Stormcrag Elemental (`hf_hunt_elemental_70`) | 380 | — | arcane_essence (6%) | — |
| 70–79 | Jardín Marchito | Boneclad Revenant (`hf_hunt_revenant_70`) | 475 | bone_fragments (60%) | arcane_essence (6%) | — |
| 80–89 | Cresta del Trueno | Stormcrag Elemental (`hf_hunt_elemental_80`) | 440 | — | arcane_shard (3%) | — |
| 80–89 | Cresta del Trueno | Dragonkin Broodguard (`hf_hunt_dragonkin_80`) | 495 | — | sharp_claw (14%) | hide, fang, claw |
| 80–89 | Cresta del Trueno | Thornpeak Ogre (`hf_hunt_ogre_80`) | 413 | ogre_toe_ring (35%) | curved_tusk (14%) | tusk |
| 80–89 | Cresta del Trueno | Ridge Stalker (`hf_hunt_stalker_80`) | 330 | — | rough_hide (14%) | hide, claw, meat |
| 90–99 | Orilla del Abismo | Dragonkin Broodguard (`hf_hunt_dragonkin_90`) | 563 | — | sharp_claw (16%) | hide, fang, claw |
| 90–99 | Orilla del Abismo | Boneclad Revenant (`hf_hunt_revenant_90`) | 625 | bone_fragments (60%) | arcane_shard (2%) | — |
| 90–99 | Orilla del Abismo | Restless Bones (`hf_hunt_skeleton_90`) | 188 | bone_fragments (60%) | arcane_essence (6%) | — |
| 90–99 | Orilla del Abismo | Thornpeak Ogre (`hf_hunt_ogre_90`) | 469 | ogre_toe_ring (35%) | curved_tusk (16%) | tusk |

## B. Normales registrados pero NO situados en estos mapas (32 plantillas)
| LV | Mapa | Monstruo (ID) | Cobre 100% | Material natural | Reactivo adicional | Recolección |
|---|---|---|---:|---|---|---|
| 21–29 | Umbral de los Aullidos | Thornpeak Ogre (`hf_hunt_ogre_21`) | 81 | ogre_toe_ring (35%) | curved_tusk (10%) | tusk |
| 21–29 | Umbral de los Aullidos | Boneclad Revenant (`hf_hunt_revenant_21`) | 108 | bone_fragments (60%) | homespun_cloth (10%) | — |
| 21–29 | Umbral de los Aullidos | Dragonkin Broodguard (`hf_hunt_dragonkin_21`) | 97 | — | sharp_claw (10%) | hide, fang, claw |
| 21–29 | Umbral de los Aullidos | Stormcrag Elemental (`hf_hunt_elemental_21`) | 86 | — | arcane_dust (9%) | — |
| 30–39 | Marisma del Velo | Restless Bones (`hf_hunt_skeleton_30`) | 53 | bone_fragments (60%) | homespun_cloth (10%) | — |
| 30–39 | Marisma del Velo | Thornpeak Ogre (`hf_hunt_ogre_30`) | 131 | ogre_toe_ring (35%) | curved_tusk (10%) | tusk |
| 30–39 | Marisma del Velo | Dragonkin Broodguard (`hf_hunt_dragonkin_30`) | 158 | — | sharp_claw (10%) | hide, fang, claw |
| 30–39 | Marisma del Velo | Ridge Stalker (`hf_hunt_stalker_30`) | 105 | — | rough_hide (10%) | hide, claw, meat |
| 40–49 | Desfiladero Colmillo | Forest Wolf (`hf_hunt_wolf_40`) | 20 | wolf_fang (45%) | rough_hide (10%) | hide, fang |
| 40–49 | Desfiladero Colmillo | Sableweb Lurker (`hf_hunt_spider_40`) | 35 | spider_leg (40%) | spider_silk (10%) | venomSac, silk |
| 40–49 | Desfiladero Colmillo | Boneclad Revenant (`hf_hunt_revenant_40`) | 250 | bone_fragments (60%) | arcane_essence (6%) | — |
| 40–49 | Desfiladero Colmillo | Dragonkin Broodguard (`hf_hunt_dragonkin_40`) | 225 | — | sharp_claw (10%) | hide, fang, claw |
| 50–59 | Tundra del Silencio | Sableweb Lurker (`hf_hunt_spider_50`) | 46 | spider_leg (40%) | spider_silk (12%) | venomSac, silk |
| 50–59 | Tundra del Silencio | Restless Bones (`hf_hunt_skeleton_50`) | 98 | bone_fragments (60%) | arcane_dust (9%) | — |
| 50–59 | Tundra del Silencio | Thornpeak Ogre (`hf_hunt_ogre_50`) | 244 | ogre_toe_ring (35%) | curved_tusk (12%) | tusk |
| 50–59 | Tundra del Silencio | Dragonkin Broodguard (`hf_hunt_dragonkin_50`) | 293 | — | sharp_claw (12%) | hide, fang, claw |
| 60–69 | Yermo de las Escamas | Forest Wolf (`hf_hunt_wolf_60`) | 32 | wolf_fang (45%) | rough_hide (12%) | hide, fang |
| 60–69 | Yermo de las Escamas | Sableweb Lurker (`hf_hunt_spider_60`) | 56 | spider_leg (40%) | spider_silk (12%) | venomSac, silk |
| 60–69 | Yermo de las Escamas | Restless Bones (`hf_hunt_skeleton_60`) | 120 | bone_fragments (60%) | arcane_dust (9%) | — |
| 60–69 | Yermo de las Escamas | Ridge Stalker (`hf_hunt_stalker_60`) | 240 | — | rough_hide (12%) | hide, claw, meat |
| 70–79 | Jardín Marchito | Restless Bones (`hf_hunt_skeleton_70`) | 143 | bone_fragments (60%) | arcane_dust (9%) | — |
| 70–79 | Jardín Marchito | Thornpeak Ogre (`hf_hunt_ogre_70`) | 356 | ogre_toe_ring (35%) | curved_tusk (14%) | tusk |
| 70–79 | Jardín Marchito | Dragonkin Broodguard (`hf_hunt_dragonkin_70`) | 428 | — | sharp_claw (14%) | hide, fang, claw |
| 70–79 | Jardín Marchito | Ridge Stalker (`hf_hunt_stalker_70`) | 285 | — | rough_hide (14%) | hide, claw, meat |
| 80–89 | Cresta del Trueno | Forest Wolf (`hf_hunt_wolf_80`) | 44 | wolf_fang (45%) | rough_hide (14%) | hide, fang |
| 80–89 | Cresta del Trueno | Sableweb Lurker (`hf_hunt_spider_80`) | 77 | spider_leg (40%) | spider_silk (14%) | venomSac, silk |
| 80–89 | Cresta del Trueno | Restless Bones (`hf_hunt_skeleton_80`) | 165 | bone_fragments (60%) | arcane_essence (6%) | — |
| 80–89 | Cresta del Trueno | Boneclad Revenant (`hf_hunt_revenant_80`) | 550 | bone_fragments (60%) | arcane_shard (3%) | — |
| 90–99 | Orilla del Abismo | Forest Wolf (`hf_hunt_wolf_90`) | 50 | wolf_fang (45%) | rough_hide (16%) | hide, fang |
| 90–99 | Orilla del Abismo | Sableweb Lurker (`hf_hunt_spider_90`) | 88 | spider_leg (40%) | spider_silk (16%) | venomSac, silk |
| 90–99 | Orilla del Abismo | Stormcrag Elemental (`hf_hunt_elemental_90`) | 500 | — | arcane_shard (2%) | — |
| 90–99 | Orilla del Abismo | Ridge Stalker (`hf_hunt_stalker_90`) | 375 | — | rough_hide (16%) | hide, claw, meat |

## C. Élite/capitán alternativo (16 plantillas)
| LV | Mapa | Monstruo (ID) | Cobre 100% | Material natural | Reactivo adicional | Recolección |
|---|---|---|---:|---|---|---|
| 21–29 | Umbral de los Aullidos | Sableweb Lurker (`hf_enc_elite_21`) | 15 | spider_leg (40%) | spider_silk (10%) | venomSac, silk |
| 21–29 | Umbral de los Aullidos | Forest Wolf (`hf_enc_captain_21`) | 9 | wolf_fang (45%) | rough_hide (10%) | hide, fang |
| 30–39 | Marisma del Velo | Forest Wolf (`hf_enc_elite_30`) | 14 | wolf_fang (45%) | rough_hide (10%) | hide, fang |
| 30–39 | Marisma del Velo | Sableweb Lurker (`hf_enc_captain_30`) | 25 | spider_leg (40%) | spider_silk (10%) | venomSac, silk |
| 40–49 | Desfiladero Colmillo | Ridge Stalker (`hf_enc_elite_40`) | 150 | — | rough_hide (10%) | hide, claw, meat |
| 40–49 | Desfiladero Colmillo | Thornpeak Ogre (`hf_enc_captain_40`) | 188 | ogre_toe_ring (35%) | curved_tusk (10%) | tusk |
| 50–59 | Tundra del Silencio | Ridge Stalker (`hf_enc_elite_50`) | 195 | — | rough_hide (12%) | hide, claw, meat |
| 50–59 | Tundra del Silencio | Forest Wolf (`hf_enc_captain_50`) | 26 | wolf_fang (45%) | rough_hide (12%) | hide, fang |
| 60–69 | Yermo de las Escamas | Thornpeak Ogre (`hf_enc_elite_60`) | 300 | ogre_toe_ring (35%) | curved_tusk (12%) | tusk |
| 60–69 | Yermo de las Escamas | Dragonkin Broodguard (`hf_enc_captain_60`) | 360 | — | sharp_claw (12%) | hide, fang, claw |
| 70–79 | Jardín Marchito | Forest Wolf (`hf_enc_elite_70`) | 38 | wolf_fang (45%) | rough_hide (14%) | hide, fang |
| 70–79 | Jardín Marchito | Sableweb Lurker (`hf_enc_captain_70`) | 67 | spider_leg (40%) | spider_silk (14%) | venomSac, silk |
| 80–89 | Cresta del Trueno | Dragonkin Broodguard (`hf_enc_elite_80`) | 495 | — | sharp_claw (14%) | hide, fang, claw |
| 80–89 | Cresta del Trueno | Stormcrag Elemental (`hf_enc_captain_80`) | 440 | — | arcane_shard (3%) | — |
| 90–99 | Orilla del Abismo | Boneclad Revenant (`hf_enc_elite_90`) | 625 | bone_fragments (60%) | arcane_shard (2%) | — |
| 90–99 | Orilla del Abismo | Dragonkin Broodguard (`hf_enc_captain_90`) | 563 | — | sharp_claw (16%) | hide, fang, claw |

## Donantes nativos originales (referencia de procedencia)
| Familia | Donante | Nombre nativo | Loot conservado | Tags cadáver |
|---|---|---|---|---|
| wolf | `forest_wolf` | Forest Wolf | wolf_fang 45% | hide, fang |
| spider | `webwood_spider` | Sableweb Lurker | spider_leg 40% | venomSac, silk |
| skeleton | `restless_bones` | Restless Bones | bone_fragments 60% | — |
| ogre | `thornpeak_ogre` | Thornpeak Ogre | ogre_toe_ring 35% | tusk |
| revenant | `boneclad_revenant` | Boneclad Revenant | bone_fragments 60% | — |
| dragonkin | `dragonkin_broodguard` | Dragonkin Broodguard | Ninguno | hide, fang, claw |
| elemental | `stormcrag_elemental` | Stormcrag Elemental | Ninguno | — |
| stalker | `ridge_stalker` | Ridge Stalker | Ninguno | hide, claw, meat |

## Comprobaciones y límites de esta auditoría
Las tablas se derivaron automáticamente de los literales exactos de `monsters/lv99/highfly_monster_content.ts`, `highfly_hunt_scenarios.ts`, `highfly_hunt_rewards.ts` y `highfly_hunt_encounters.ts`, cruzados con las definiciones nativas de `src/sim/content/zone1.ts`, `zone3.ts` y `drakelands.ts` del upstream fijado.

Se validaron: **8 donantes × 8 bandas = 64 normales**, **4 campamentos × 8 instancias = 32 normales ubicados**, **8 × (élite + capitán) = 16 variantes especiales**, 80 identificadores únicos, biomas y nombre por escenario, tags y exclusión de botín de misión. El código prueba que el motor distribuye loot/cobre vía las tablas nativas y hay test E2E para transferencia y guardado, pero **el inventario publicado aquí es comprobación de código, NO un muestreo estadístico de kills reales ni QA físico S23**.

**Fuentes:**
- [Roster HIGHFLY](https://github.com/drakentzy07/cobalt-hollow-lab/blob/highfly-monsters-lv99-pass02i-biome-survival-fps/monsters/lv99/highfly_monster_content.ts)
- [Escenarios HIGHFLY](https://github.com/drakentzy07/cobalt-hollow-lab/blob/highfly-monsters-lv99-pass02i-biome-survival-fps/monsters/lv99/highfly_hunt_scenarios.ts)
- [Loot/Reagentes HIGHFLY](https://github.com/drakentzy07/cobalt-hollow-lab/blob/highfly-monsters-lv99-pass02i-biome-survival-fps/monsters/lv99/highfly_hunt_rewards.ts)
- [Élites/capitanes](https://github.com/drakentzy07/cobalt-hollow-lab/blob/highfly-monsters-lv99-pass02i-biome-survival-fps/monsters/lv99/highfly_hunt_encounters.ts)
- [Prueba real de muerte/loot y serialización](https://github.com/drakentzy07/cobalt-hollow-lab/blob/highfly-monsters-lv99-pass02i-biome-survival-fps/monsters/lv99/highfly_hunt_rewards.test.ts)
