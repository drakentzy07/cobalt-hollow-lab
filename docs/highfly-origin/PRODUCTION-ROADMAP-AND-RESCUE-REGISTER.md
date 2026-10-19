# HIGHFLY ORIGIN — PRODUCTION ROADMAP & RESCUE REGISTER v1
**Fecha:** 2026-10-19. **Estado:** decisión de producción + auditoría estática preliminar. NO es una fase técnica completada. **Rama exclusiva:** `highfly-origin-foundation-clean-20261019`. **No deploy.**

## NORTE CREATIVO APROBADO
1. SLF / Shangri-La Frontier, Exiled Knight, Overgeared, Solo Leveling y el isekai abierto forman la identidad. The King's Avatar es referencia exclusivamente para Hunter sin clase.
2. Hunter único, persistente, jugador activo; nueve clases legacy como bibliotecas de escuelas. Ningún party switch ni clase inicial forzada.
3. Training real autoridad exclusiva sobre STR/AGI/VIT/PER/INT. XP y niveles por gameplay, maestría por uso/desafíos, equipo modifica derivados (sin subir los cinco atributos base).
4. Tres recursos: vida (HP Sim), maná (MP) y stamina. Costes especiales de clases deben adaptarse explícitamente, nunca liberarse por bypass.
5. Prioridad sensación jugable: joystick GOLDEN, cámara libre y multitouch S23; ataque manual, locomoción continua, doble salto dirigido con mortal condicional, dash/rolido contextual, parkour, wallrun y escalada. Pies, timing, colisiones y acciones coherentes.
6. Combate sin botón BLOCK. Parry/contexto por ATK; esquiva perfecta por DASH, ventanas y reacciones reales autorizadas por Sim.
7. MVP habilidad: **4 ACTIVAS ofensivas** (LINEAL corredor, CONO sector curvo, CÍRCULO AoE, TRIÁNGULO base recta) + **1 PASIVA/buff** que no ocupa activo. Reutilizar assets originales sin asumir que las viejas skills ya encajan.
8. Interfaz 4 skills BASE, 3 poderes únicos invisibles hasta su descubrimiento (futuro), ATK, USAR, DASH, SALTO, buffs/consumibles fuera de los cuatro.
9. Una sola identidad/Sim/guardado; un sistema de loot/armaduras/armas/profesiones/quests sin restricciones de la clase legacy; conservar requisitos genuinos de equipamiento y compatibilidad.

## SEGURIDAD / NUNCA TOCAR
- Main, GitHub Pages público, R39, R40, CLEAN V1 y todas las ramas históricas SON INMUTABLES como fuentes/respaldos en esta iniciativa.
- Fundación nueva parte de CLEAN V1 commit `89c8d8fccdce476a486cce58a074332430512de4`.
- Código donor original congelado ClaudeCraft v0.44.0 `9b57e49c9676d75962700f828cc00a50a9a988b5`.
- Ningún `git cherry-pick` masivo de overlays R39/R40. No ejecutar workflows acumulados para cambios pequeños.
- No publicar Pages ni guardar sobre datos de usuarios sin export/import versionado y rollback aprobado.
- Cualquier importación externa necesita licencia de código **y de medios** verificada; conservar avisos y trazabilidad por archivo.

## AUDITORÍA ESTÁTICA PRELIMINAR — EVIDENCIA
La nueva rama heredó el repositorio CLEAN V1: **119 archivos regulares**, principalmente un parche `clean/canonical/HIGHFLY_CLEAN_V1.patch` de ~2,45 MB, **38 archivos en training/** y **49 scripts bajo overlays/**; NO contiene `src/` listo para editar. Esto no es aún una base fuente consolidada.
R40 histórico SHA `6566c3e3dd2f3716f2a59116bb0ac8e0c72bdf7f`: **464 archivos**: 90 scripts overlays y 78 workflows; tampoco fuente `src/` integrada en la rama; su CI recupera upstream y aplica sobre él parches secuenciales. R40 terminó rojo por fallos `R40_SOURCE_DRIFT` en textos de anclaje de `visual.ts` y `highfly_origin_r22_premium_visual.ts`. El último R39 nativo sí completó 28 tests en esa CI previa, sin certificar sensación de combate física.
El plan exige convertir la estrategia thin-overlay en **código fuente propio materializado** y estable, con upstream SHA fijo. La media pesada permanece gestionada por manifest/hashes/licencias, no copiada por cada run.

### MATRIZ DE RESCATE INICIAL — CANDIDATOS, NO AUTORIZADOS PARA IMPORT AUTOMÁTICO
| Sistema | Donante inspeccionado / pista | Prioridad | Prueba antes de adoptar |
|---|---|---|---|
| Mundo/Sim/base | ClaudeCraft v0.44.0 congelado + CLEAN V1 patch | P0 | Bundle y compare/hash, spawn estable, online/offline, collision, save |
| Training | CLEAN `training/runtime/` engine/core/stat_authority + tests | P1 | 5 stats exclusiva Training, XP 1..99 no duplica grants, save migrations |
| Identidad | R40 `game/c1/highfly_origin_hunter_profile.ts` | P1 | Único perfil/PlayerMeta, sin doble avatar, save/load rollback |
| Recursos | R40 `highfly_origin_universal_resources.ts` | P1 | HP autoritativo Sim; MP/Stamina válidos; costs specials block/migrate |
| Skill learning | R40 `highfly_origin_native_spellbook.ts` | P4/P6 | Nueve escuelas sin bypass de level/quests/equipment, no auto-grant |
| Movimiento/rig | R39A/R39C3, personaje KayKit Rig_Medium | P2 | track masks, ground contact, 3D nav/headroom, no root slide |
| Combate | R39 final_runtime / native R39 dodge/parry/break events | P3 | atacan solo por ATK, ventanas físicas, colisión/damage valid Sim |
| Apuntado | R20–R22 + P35 + R37 aim | P4 | line/cone/circle/triangle bounds coinciden Sim y mobile gestures |
| Monstruos | P02I `e6f59079fdc3f278ef041fbc8354ca837aee42ab` | P5 | single Hunter/Sim, no temp triple HP, AI+loot+save, fair balance |
| Profesiones | PR13 fuentes bajo `professions/` en R40 y ramas GREEN | P6 | gather->craft->item->equip->save; no recipes/loot duplicados |
| Armaduras | KayKit modular audit `highfly-character-truth-audit-01` | P6 | Rig_Medium, skins/sockets, surface conform, male/female |
| Quests/NPC/interiores | Legacy ClaudeCraft + otros prototipos | P7 | dependencias de clase/quests, collisions, perf and license |

## PRODUCCIÓN — FASES COMPLETAS CON GATE DE SALIDA

### FASE 0 — FUNDACIÓN Y RESCATE (INICIADA; NO COMPLETADA)
**Trabajo integral:** auditoría de todos los donantes (incluyendo hashes, contratos, dependencias, licencias y QA); inventario de source-of-truth; reconstrucción determinista de ClaudeCraft + CLEAN con una carpeta `src/` realmente editable y scripts de sincronización sin mutación del donor; adaptar CI en pipeline corto, preservar media mediante manifest; preparar tests baseline y goldens, respaldo de saves.
**Entregables:** repositorio consolidado que build/testea, `FOUNDATION-LOCK` con árbol de archivos, lock de assets, matriz completa adopt/rewrite/defer, smoke de mundo/Training y reporte SHA/rollback.
**Done:** arranca mundo y save desde un solo código fuente, no depende de ejecutar 90 overlays, CI determinista y builds no públicos; branch protegida del público. No aceptar Fase 0 por documento solamente.

### FASE 1 — HUNTER UNIVERSAL + PROGRESIÓN Y RECURSOS
**Trabajo integral:** un Hunter persistente, Creador ligero hombre/mujer sobre Rig_Medium, Training 5 stats, nivel 1–99 (y rangos), HP/MP/Stamina single authority, compatibilidad con 9 escuelas como donantes, cambios de guardado versionados; especificar equipamiento genérico con slots.
**Done:** crear/jugar/salir/reabrir mismo Hunter y datos iguales; Training afecta derivados sin premios duplicados; no puede elegirse clase; resources completos y regen/costes testados.

### FASE 2 — MOVIMIENTO EXTREMO Y ANIMGRAPH
**Trabajo integral:** GOLDEN 360°/camera, sprint, salto 1, 2º salto con flips contextuales, dash con roll/step directional, wall-climb, wallrun/escalada (según geometría), hit/camera smoothing, blends y safe cancel; auditoría Rig_Medium/22 clips más KayKit/Quaternius candidatos; NO se impone clip sin encajar al rig.
**Done:** recorridos jugables en S23 sin patinar, controles multitouch, salto/rolido no teletransporta ni atraviesa paredes, caídas y water/swim safe.

### FASE 3 — COMBATE FÍSICO SUPREMO (SIN SKILLS)
**Trabajo integral:** ATK 1-2-3, cuarto golpe sólo gema legítima en fase posterior, correr+ATK, salto+ATK, dash+ATK, buffer/cancel windows, perfect dodge, parry contextual ATK, reacción enemigo/poise, audio/VFX y cámara; SIM de damage/hit.
**Done:** pelea completa contra mob inicial usando sólo movimientos/ATK manual; impactos y ventanas verificables, sin auto attack, deslizar ni animaciones congeladas, persistencia protegida.

### FASE 4 — CUATRO HABILIDADES PROPIAS + UNA PASIVA
**Trabajo integral:** contrato canónico InputIntent/AreaGeometry/SimCost/Admit/Damage/Cooldown/Animation/VFX/Reaction; S1 linear, S2 sector-cono, S3 circle, S4 triangle; hold/drag/release/cancel y soft aim, múltiples efectos de prueba, un buff pasivo sin ocupar slot.
**Done:** cuatro hit tests geométricos deterministas, tiempos/costes/cooldowns auténticos, cadenas ATK→Skill→DASH→Skill, comportamiento visible y correcto en Android, guardado sin gifts.

### FASE 5 — VERTICAL SLICE DEL MUNDO
**Trabajo integral:** un área ClaudeCraft funcional, un lobo + un élite con IA/telegraphs, encuentros/respawn, kill, XP, loot real, equipar, save/reload; 1 quest corta; integración de monstruos P02I progresiva sólo después de demostrar flujo de un Hunter.
**Done:** sesión humana completa: entrar/explorar/combatir/loot/equipar/guardar/reabrir. Esta es la primera experiencia real HIGHFLY que se aprueba en físico.

### FASE 6 — MMORPG SYSTEMS / ESCUELAS + LOOT + PROFESIONES
**Trabajo integral:** expandir las nueve escuelas bajo mismo contrato de skills; biblioteca, descubrimiento/maestría, inventario/equipamiento/claseless, gemas, familias de monstruos y élites, drops/recetas/profesiones PR13, balance PVE 1..99, armaduras modular.
**Done:** el loop Monster→Loot→Craft→Forge/Gem→Equip→Combat→Save funciona sin explotación ni barrera legacy de clase, manteniendo límites de nivel/maestría/arma.

### FASE 7 — MUNDO ISEKAI VIVO
**Trabajo integral:** cadenas quest, NPC con roles y rutinas, comerciantes/maestros, territorios, dungeons, interiores RG Poly verificados por licencia/performance, tabernas, cocina, interacciones sociales; no se sustituye mundo original abruptamente.
**Done:** una región con misiones, profesiones y NPC funcionales que sostenga exploración y respawn sin perder datos ni rendimiento.

### FASE 8 — HARDENING, ANDROID, RELEASE
**Trabajo integral:** QA Samsung S23 Ultra físico + emulador + PC debug, FPS/memoria y thermal, múltiples duraciones de sesión, networking/co-op cuando exista backend fiable, migration de saves, accesibilidad/HUD, publicación por release gate, rollback y monitoreo.
**Done:** release candidate con registros y mediciones de hardware, aceptación humana y autorización expresa antes de tocar Pages público.

## CRITERIOS COMUNES DE CADA FASE
- Una única salida integrable con test, reporte de evidencia, archivo de decisiones y fuentes.
- Nunca confundir unit green con juego jugable, ni Playwright emulado con S23 físico.
- Gates deben probar los caminos críticos, no sólo encontrar funciones por regex.
- Cada fase integra y reemplaza código experimental; no acumula overlays en producción.
- El usuario decide junto al equipo asuntos creativos y tradeoffs que cambian sensación jugable; la dirección técnica ejecuta decisiones cerradas sin preguntar cada microdetalle.
- No iniciar nueva fase principal hasta haber cerrado el gate de salida de la anterior. Se permiten auditorías futuras paralelas sin fusionarlas a producción.

## ESTADO ACTUAL / PRÓXIMA ACCIÓN
- PLANIFICACIÓN registrada; rama separada creada. Ejecutar materialización fuente determinista y auditoría total de capas para completar Fase 0.
- Aún NO se ha hecho una build de FOUNDATION-01/02; ninguna fuente legacy R39/R40 fue reimplantada o desplegada.
