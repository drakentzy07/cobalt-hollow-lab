# HIGHFLY MONSTRUOS 6 — P02M → APP V4 — HANDOFF DE BALANCE HONESTO
Fecha: 2026-10-10. NO PUBLICAR TODAVÍA. No reemplazar ClaudeCraft, ni PF6/Training, ni profesiones, ni joystick GOLDEN.

## Referencias de fuente/auditoría reproducible
- P02L inventario: `docs/HIGHFLY_MONSTRUOS6_FULL_LV1_99_AUDIT/` en rama `highfly-monsters-p02k-s23-realdevice-gate`.
- P02M CI: `.github/workflows/highfly-monsters-p02m-hunter-mob-balance.yml` (resultado auditable en GitHub Actions).
- Datos: `docs/HIGHFLY_MONSTRUOS6_P02M_BALANCE/{00_RESUMEN_BALANCE.json,01_HUNTER_MOB_AUTO_ATTACK_BALANCE_MATRIX.csv,03_CRAFT_REAGENT_ODDS_POLICY_PROPOSED.csv}`.
- Política opcional: `monsters/balance/highfly_challenge_reward_policy.ts` (NO integrada a loot real).
- Donante exacto: ClaudeCraft 0.44.0 `9b57e49c9676d75962700f828cc00a50a9a988b5`; P02I monsters `e6f59079fdc3f278ef041fbc8354ca837aee42ab`.

## Alcance logrado — NO fingir que el balance total está aprobado
- 9 clases reales / 80 variantes de monstruos LV21–99 / 21.600 escenarios matemáticos.
- Incluye +0, +3, +5, +8, +12 de diferencia de nivel y sensibilidad a EVASIÓN **HIPOTÉTICA** 0/35/70%.
- El daño de melee real desde Hunter LV40 a criatura LV45 con HP completo se verificó en el Sim nativo. NO es una pelea real completa ni prueba de victoria.
- Sin armas ni equipo: 13.782/21.600 escenarios superan 120 s para vencer; es un baseline pesimista, NO refleja un Hunter equipado.
- XP base: criatura LV45 contra Hunter LV40 da 324, paridad LV40 vs LV40 da 245 antes de multiplicadores específicos.
- P02L verifica 350 entradas de plantillas, 988 filas de loot y todo el inventario de ubicaciones. Un registro NO implica un spawn activo.
- Estado: `AUDIT_GREEN_BALANCE_NOT_YET_CERTIFIED_NEEDS_GEAR_TRAINING_SKILLS_E2E`.

## Reglas de diseño V4 — obligatorias para el integration gate
1. Un Hunter altamente competente **puede intentar y vencer** criatura +5 sin bloqueo artificial. El juego NO garantiza la victoria ni un drop legendario. +7 a +10 desafío extraordinario. No hacer escalar enemigos automáticamente en tiempo real con el poder individual del Hunter: entrenamiento debe aportar ventajas reales.
2. 9 clases, mismo nivel de poder relativo con roles distintos. Probar PvE en LV1, 7, 13, 20, 21, 29, 30, 39, 40, 49, 50, 59, 60, 69, 70, 79, 80, 89, 90, 99, con diferencias ±3, +5, +8, +12 cuando los encuentros realmente existen.
3. Cada Hunter en al menos tres equipos **REALES** derivados de catálogo/herrería PF9 y tres perfiles Training Core **VALIDADOS** (principiante/intermedio/avanzado); no alterar STR/AGI/VIT/PER/INT con mobs, objetos, recompensas o habilidad. Atribuir esos stats exclusivamente a sesiones reales y crecimiento natural de clase ya definido.
4. Combat E2E con dash, parry, stamina/resources, habilidades 1–2–3, cuarto elemento sólo con gema, esquiva de telegráficos, daño físico/mágico, knockback/CC, bloqueo, curaciones y cooldowns. Medir winrate, tiempo al kill, daño recibido, cantidad de consumibles, esquivas efectivas, FPS en S23 Ultra, y muertes tras respawn; usar Sim en tiempo continuo, no adversario fijado en HP1, y reproducir semillas.
5. Objetivos de diseño INICIALES A VALIDAR (NO datos observados): misma clase/nivel/equipo recomendado, 15–45 s para normal, 45–120 s para élite, 90–240 s para capitán. Pro jugador +5 debe tener un camino de victoria y recompensas mayores. Si no, ajustar usando medidas de movilidad, telégrafos, TTK, protección/cooldowns y después HP/daño. No sobreajustar valores sólo para hacer verde un test.
6. LOOT normal + élite/capitán: separar monedas, material crafting, equipo directamente dropeable, equipo de oficio y rareza. Validar `rollGroup`, chance condicional por quest, propiedad del cadáver, PNJ/boss, personal loot, calidad, esquemas de receta y persistencia.
7. Bonificación experimental +3/+5 por matar monstruo más alto, no por entrar a una zona: `assessHighflyChallengeKill` requiere kill real, solo titular del cadáver, contribución >=65%, mínimo 3 s y rango de plantilla auténtico. `highflyChallengeReagentProbability` sólo mueve probabilidad de un reactivo registrado (2%–18% base, máx 26% final). Elite y capitán obtienen pequeño premium si son del registro HF y no son world boss/quest/dummy. No aplicarlo todavía al RNG global.
8. Para conectar a `rollLoot`, modificar únicamente una copia del DROP CANDIDATO del propietario autorizado en el evento de muerte real. Nunca mutar `MOBS` global, nunca hacer doble roll accidental, nunca dar objetos de misión, recetas exclusivas de jefes, pases heroicos o loot de raid en mobs normales; no saltar validaciones de grupo, calidad y binding. Los drops por profesión son un sistema diferente.
9. Verificar CONSUMO de materiales del crafting, gemas fuego/hielo/rayo, costes, tiempos y balance efectivo de recetas. Un mejor drop para +5 debe valer la dificultad extra, sin inflar cobre/XP/herrería ni dar 100% de objetos especiales. Si gear tiers 21–99 aún no están en la app V4, BLOQUEAR promoción de balance aunque la simulación sin equipamiento sea green.
10. Integración: crear una nueva rama desde el último GREEN CLEAN V4, cherry-pick/adaptar únicamente módulos autorizados, pruebas unitarias y E2E primero, snapshot + rollback, despliegue a Pages aislado (no público) para S23 horizontal; sólo promover con aprobación humana tras vídeo/playtest y FPS aceptable.

## GATES BLOQUEANTES
- Balance actual P02M = **AUDIT GREEN; GAME BALANCE NO CERTIFICADO**.
- Monstruos normales/élites/capitanes LV21–99 actualmente NO integrados al mundo V4; viven en LAB con acceso opt-in. Los 32 encuentros registrados pero no ubicados NO deben aparecer mágicamente.
- Extended 100+ cerrado.
- Mejor loot por dificultad es POLÍTICA DOCUMENTADA + TESTEADA, no código activo en la app ni RNG.
- Las probabilidades exactas y los porcentajes de victorias NO se deducen de un modelo matemático con esquivas hipotéticas.
- Nunca activar buff Hunter x3 HP del laboratorio en el juego real.
