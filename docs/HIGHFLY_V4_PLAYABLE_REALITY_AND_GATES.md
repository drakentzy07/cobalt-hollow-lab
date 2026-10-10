# HIGHFLY V4 — PLAN REAL DE INTEGRACIÓN JUGABLE (NO REBOOT)
**Corte:** 2026-10-10
**Padre GREEN:** `highfly-demo-v3-06-green-freeze` @ `46ddffee57b0bc277f5fcfa4f956bf162a7f1f78`
**Donor fijado:** ClaudeCraft v0.44.0 @ `9b57e49c9676d75962700f828cc00a50a9a988b5`
**Reglas:** NO main, NO Pages, NO tocar freeze, NO Skin Lab/Monster Lab premium, NO reauditar joystick/HUD salvo dependencia afectada.

## A. IMPLEMENTADO Y CERTIFICADO EN EL PARENT GREEN

- ClaudeCraft auténtico + CLEAN Foundation GOLDEN + nueve clases originales: **integrado**; Android Chrome emulado y PC aprobados. El S23U físico todavía debe revisarse.
- Joystick 360, cámara, doble salto, dash, soft target, combo 1-2-3 y HUD móvil: **preservados**; no reconstruir.
- `highfly_elemental_basic.ts`: lógica del **ATK4 elemental y sus riders fire/frost/lightning/air** ya existe y tiene tests. Atención: `game_c1_runtime.ts` arranca con elemento `base` salvo modo de prueba; **NO existe aún el bucle económico del jugador gema→forja/inlay→arma→guardado**. NO llamar al sistema de gemas finalizado.
- XP, level cap normal 99, clase, crecimiento natural (+98) y Training Core (puntos sólo de evidencia real): **integrados**; Extended 100+ **bloqueado / futuro**.
- Profesiones del donor + módulos HIGHFLY **PR1–PR13**: integrados en runtime, distintos niveles de madurez; pilotos no equivalen a expansiones completas.
- Recolección desde nodos originales, forja de hacha cobre, equip y save/load: E2E real certificado con herramientas/receta inicial simuladas como prerrequisitos.
- Combate, lobo donor, muerte, loot original, no duplicaciones, personaje persistente: E2E certificado con HP del enemigo reducido por fixture.
- Flujo combinado Hunter→mina→forja→arma→combate→loot→guardar→Training Profile: GREEN; **no certifica todo el mundo LV1–99 jugable ni NPC vendors/trainer UX**.

## B. GAPS BLOQUEANTES PARA DEMO RPG LV1–99 CON TODO

| Prioridad | Requisito | Estado 2026-10-10 | Gate verificable |
| --- | --- | --- | --- |
| P0 | Bundle para tester sin pisar Pages | V4-01 genera artefacto WebGL no publicado | dist real completo + archivos GLB/manifest + descarga |
| P0 | Gema elemental en gameplay normal | ATK4 funcional base, adquisición/inlay activación aún falta | minería→material→receta→gema→arma→ATK4→save/reload; sin gema 1-2-3 |
| P0 | Monstruos/loot originales escalados LV21–99 | `max(ZONES.levelRange[1])=20`, `max(MOBS.maxLevel)=60`; gray XP LV28 contra LV20 | tiers auténticos hasta 99, zona accesible, IA/loot/XP balanceado y sin enemigo proxy |
| P1 | Profesiones HIGHFLY al máximo | PR1-13 integrados (algunos pilotos), PR14-23 pendientes | todos los oficios de donor, knowledge/discovery/legendary, recetas, UI, Android, guardado |
| P1 | Entreno real → ventaja diferenciada frente a XP de juego | Training + PF6 bridge real; relación de progresión/juego necesita playtest | pruebas comparadas juego solo/entrenado sin doble stat ni bonus artificial |
| P1 | ClaudeCraft actualizaciones selectivas | donor v0.44.0, upstream publica v0.44.1–0.44.6 | cherry-picks por utilidad, seguridad y test de impacto; pin por SHA |
| P1 | Partida íntegra sin fixtures y 9 clases físicas | sólo tests automatizados y simulación del S23 | empezar LV1, aprender oficio, obtener insumos, fabricar, combatir, subir, guardar y reloguear; nueve clases y Android físico |
| FUTURO | HIGHFLY skins y monstruos especiales | laboratorios aislados por decisión del usuario | actualizaciones posteriores, NO bloquear núcleo |
| FUTURO | Extended 100+ / skills EVO/MUT/ÚNICA premium | diseño/Hook, no core normal completo | implementación aparte, luego de LV1–99 y juego base |

## C. PLAN DE IMPLEMENTACIÓN (tres bloques grandes, no mini-parches)

**V4-01 · Paquete real de la última integración.** Construir el bundle completo con media GLB de V3-06, auditar artefacto, certificar sus costuras claves y entregarlo como ZIP descargable **sin deploy público**. Usar GitHub Actions sólo para el cambio correspondiente, sin repetir los 46 pasos GOLDEN. El freeze V3-06 sigue disponible para rollback.

**V4-02 · Progresión de combate + oficios.** Montar el bucle de gemas del jugador encima del combo elemental existente, sin otro motor de items/loot; completar profesiones sin superponer PR viejos y sin prometer PR14–23 hasta que haya código y pruebas de cada circuito. Reusar fuentes reales ClaudeCraft y agregar receptores de gema de manera ortogonal a skills BASE. Separar de las UNICAS premium.

**V4-03 · RPG LV1–99 real + upstream selectivo.** Mejorar contenido/AI/loot donor con tramos jugables 21–29, 30–39 ... 90–99 y pruebas de XP/daño/recompensas. Conservar la topología/monstruos originales y usar nuevos escenarios sólo cuando sean necesarios. Seleccionar cambios útiles de upstream 0.44.1–0.44.6; no sincronizar a ciegas. Al final hacer pruebas humanas Android/PC y candidate release. Publicar únicamente con autorización.

## D. PUERTAS DE CALIDAD

- **Test por impacto** para cada cambio. No volver a empezar con controles GOLDEN.
- **Entradas verdaderas**: si el test da pick, flux, recetas, level 10 o lobo 1HP, describirlo.
- **Una sola autoridad**: Sim XP/loot/items/quests y Training Core permanent Core.
- **Migración segura**: guardar partida del padre V3-06, reabrir con V4, sin pérdida de inventario/perfil ni duplicar recompensa.
- **Prohibiciones**: no publicar Pages, tocar main, reescribir HUD, sustituir ClaudeCraft ni fusionar laboratorios especiales.
- **GREEN parcial != juego completo**: el reporte marca cada circuito efectivamente entregado.

## E. REGISTRO UPSTREAM ACTUAL

El compare v0.44.0→v0.44.1 contiene cambios en HUD/action bar potencialmente útiles, pero potencialmente invasivos para GOLDEN; **evaluar individualmente**.
La v0.44.2 contiene fixes de UI/tooltips y cambios en character state, evaluar schemas.
0.44.3–0.44.6 incluyen bastante contenido PvP/servidor/online; no importar si no beneficia al juego offline.
No afirmar que se integró v0.44.6 hasta contar con commit aprobado y gate.

## NOTA
Este documento es un backlog ejecutable y una matriz de verdad, no certifica como implementados los puntos pendientes.
