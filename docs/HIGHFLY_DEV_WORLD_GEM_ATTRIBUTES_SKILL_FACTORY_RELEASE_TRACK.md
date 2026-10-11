# HIGHFLY DEV — WORLD/ATRIBUTOS/GEMAS/HABILIDADES · ACTUALIZACIÓN POST-GOLDEN
Fecha: 2026-10-11 · **No desplegar automáticamente en PLAY** · cero contenido de NEXUS · ClaudeCraft pin 9b57e49 + GOLDEN.

## Prioridad de juego y arquitectura
- **PLAY 4.03** YA PUBLICADO: https://drakentzy07.github.io/cobalt-hollow-lab/v4-03-preview/ , RUN principal GREEN #38163605895. Todo el sistema donante de niveles 1–20 y PF6 1–99, con ocho expediciones y NPC/loot/forja/gemas actuales. No venderlo como balance 1–99 completo.
- **PLAY 4.03.1** candidata P13: 15 armas y 15 recetas entre LV50 y LV90, sobre un `Sim` y `ALL_RECIPES` original, trainer tier y guardado protegido, CI #38165622295. No publicar hasta GREEN y bootstrap navegador.
- **DEV** mantiene trabajo de mundo, gemas ampliadas, atributos derivados y habilidades EVO/Mutación/Únicas aislado de Pages. Scripts y pruebas opt-in, sin alterar original.

## WORLD — conectar BIOMAS REALES P02I, no sustituir mundo original
La fuente ya existente y auditada `monsters/lv99/highfly_hunt_scenery.ts` (freeze e6f59079...) tiene 8 temáticas, máximo 12 props bajos recursos, rutas/campamentos con clearance, y `highfly_hunt_render_palette.ts` con 8 paletas. **Por ahora sólo está activado en islas aisladas de laboratorio**; no confundir con puertas P07/P09 del juego.
- 21–29 Umbral de los Aullidos: haunt / woods
- 30–39 Marisma del Velo: marsh / fen
- 40–49 Desfiladero Colmillo: peaks / crag
- 50–59 Tundra del Silencio: frost
- 60–69 Yermo de las Escamas: volcano
- 70–79 Jardín Marchito: garden
- 80–89 Cresta del Trueno: gale
- 90–99 Orilla del Abismo: cave
Gates: entrar/salir físicamente desde un portal, respetar terreno/agua/colisiones/cámara 360°, límites 8 habitantes por instancia, decor <=12, no robar spawns originales, no duplicar GLB o usar repos externos sin licencia. No declarar ocho biomas visuales finalizados cuando sólo son templates de LAB.

## GEMAS Y ATRIBUTOS
Preservar tres gemas elementales actuales Fire/Frost/Lightning con minería→material→joyería→maestro→forja→una sola ranura por arma real→ATK4 con VFX/CC/DoT→save. La cuarta opción `air` en `highfly_elemental_basic` es capacidad de motor, no un ítem NUEVO ni una receta aprobada.
- P14 FOUNDATION test `professions/p14/highfly_gem_attribute_expansion_foundation.test.ts`: probar consumos físicos para las tres gemas, segundo inlay denegado, ATK4 y guardado real; XP, nivel, profesiones y Training Core intactos.
- Futuras gemas de efectos y atributos de combate requieren especificar por gem-ID: fuente legal, receta/nivel/maestría, espacio permitido, valor de combate, proc, resistencias/CC, coste y tier, renderer/tooltip en S23, persistencia y compatibilidad de gemas anteriores. **No crear boosts permanentes** a STR/AGI/VIT/PER/INT por equipo, skills, talentos o profesiones: sólo Training.
- Afinidad elemental inicial: una; afinidades múltiples son progresión muy costosa a futuro. No habilitarlas gratuitamente.

## HABILIDADES
Reusar 9 clases originales (Warrior, Paladin, Hunter, Rogue, Priest, Shaman, Mage, Warlock, Druid), HUD GOLDEN 2 filas/10 slots, combo normal 1-2-3 y 4 con gema equipada; conservar todos los árboles y habilidades ClaudeCraft.
- Desarrollo aislado: BASE → EVO → MUTACIÓN → ÚNICA → ÚNICA MUTADA. La habilidad única suma slot, no altera Stats de Training Core. Las 14 inspiraciones aprobadas (Guinevere, Kadita, Saber, Lancelot, Pharsa, Hayabusa, Dyrroth, Vexana, Arlott, Phoveus, Yu Zhong, Harith, Tigreal, Nana) son pipeline de inspiración mecánica **no skills implementadas/live**.
- Gates: condiciones observables para desbloquear y mutar, cooldown/energy/CC balance, efectos 3D compatibles low-poly móvil, targeting nearest/lowestHP, S23 360° tap/hold tooltip, animaciones native `Rig_Medium`, sin copiar licencias no permitidas. Requiere Sora→Tigreal y Suyou→Nana como referencias actuales; no fusionar prototipo 4+4 clases descartado.
- Mantener los 5 legendarios SLF-like en su propio Monster Lab, sin afectar juego normal hasta haber validado arte/IA/recompensa.

## ORDEN DE CAMBIOS QUE NO ROMPE HUNTER
1. Entregar P13 armas/recetas solamente cuando pasa completo QA, test trainer, UI/touch y save; luego lanzar incremental `PLAY 4.03.1` con mismas keys `highfly-play`, no personaje nuevo.
2. DEV P14: certificar los tres elementos y añadir variantes/atributos de combate como opt-in sin confundirlo con Stats físicos ni con nuevas afinidades.
3. DEV Mundo: conectar P02I escenarios visuales al conjunto de portales/instancias P07-P09 sin mover mundo original, rendimiento y física first.
4. DEV skill progression EVO/mutaciones/únicas tras normalizar combate 1–99 (PF9/10/11), cada clase con pruebas de 1 a 99.
5. 100+ Extended queda APAGADO hasta cerrar LV99 normal, Economía y pruebas de migración.

## Fuentes auditadas, estado exacto
- RUN P09 integración elites: #38140856603 GREEN.
- RUN GOLDEN LIVE: #38163605895 GREEN.
- RUN P13 DEV nativo 227 recetas: #38163055787 GREEN.
- RUN V4-03.1 PLAY candidato: #38165622295, verificar resultado antes de decir GREEN.
- Los únicos cambios recientes efectivos DEV P14 son **los tests de compatibilidad**; no nuevas gemas ni skills de atributos en producción. Este documento es alcance técnico para su desarrollo posterior y nunca certificación de funcionalidad nueva.
