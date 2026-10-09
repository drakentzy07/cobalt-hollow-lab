# HIGHFLY — DEMO 1.0 / CLEAN V3 — AUDIT & SAFE INTEGRATION PLAN
Fecha de corte: 2026-10-09. Estado: RUN V3-00 preparación de baseline, **NO DEMO TERMINADA**.

## Origen verificado
- Rama de partida: `highfly-professions-pr13-gathering-knowledge` @ `e4a01f25f2d1f8b47d9737980e8c1d994aa9982f`.
- Incluye 95 commits por encima de `highfly-main-clean-v1` @ `89c8d8fccdce476a486cce58a074332430512de4` (GitHub compare: ahead 95, behind 0).
- El CLEAN V1 guarda un patch canónico verificado SHA-256 contra ClaudeCraft v0.44.0 @ `9b57e49c9676d75962700f828cc00a50a9a988b5`; evitar ejecutar secuencialmente los 43 overlays históricos.
- Certificado PR-13: https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/37856683170 (CI success, TypeScript y bundle offline; 1181 tests / 45 suites según reporte certificado).
- PF-6: https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/37770166898 (CI success), reproducido por PR-13.
- CLEAN: https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/37718137915 (CI success; deploy skipped).
- `main` no es la base jugable: solo árbol raíz ligero de workflow/README/pin, sin consolidación de overlays.
- No se identificó una rama llamada CLEAN V2 en la lista de 95 ramas consultadas. El nombre de chat no equivale a versión publicable.
- `highfly-pf7-original-skills-gems` y `highfly-pf7-second-awakening-design` solo aportan documentos de diseño en la comparación PR-13 -> PF-7. No declararlos PF-7 gameplay.
- `highfly-pf6-g-content-balance` ofrece plan documental; verificar antes de aplicar.

## Matriz de verdad (al iniciar V3)
| Sistema | Fuente real | Estado certificado | Falta para DEMO |
|---|---|---|---|
| Movimiento GOLDEN / HUD | patch CLEAN V1 | smoke + gate GREEN | verificación humana S23U en esta build |
| Training Core / perfiles | CLEAN RUN1-J | tipos/tests/CI CLEAN GREEN | prueba persistencia completa de V3 en dispositivo |
| LV1-99 / PF-6 | overlay PF-6 en PR-13 | Sim E2E y Vitest GREEN | calibración economía y exploración visual 1/50/99 |
| PF-7..PF-14 | diseños/ramas posteriores parciales | integración completa no demostrada | auditoría módulo por módulo; no autoafirmar completitud |
| Profesiones PR-1..PR-13 | módulos y activadores en PR-13 | 45 suites y bundle GREEN | interfaces de acciones y prueba humana forja-equipar |
| Herrería | ClaudeCraft weaponcrafting + armorcrafting + PR-5 pilot | ruta/craft hooks y piloto de trial 24→25 probados | transacción entera desde minera, UI, station, inventario, equip y reload |
| Gathering / Knowledge | ClaudeCraft + PR-13 | prueba fuente realmente recolectada | mostrar progreso real en UI sin falsos drops |
| Loot / monstruos | ClaudeCraft v0.44.0 | tests heredados parciales | prueba humana de combate, corpse, loot y persistencia |
| Save / Load | ClaudeCraft + HIGHFLY | regresiones in-memory/backcompat | prueba de cierre/reapertura Android y multi-slot |
| Skins / Monsters / Skills especiales | laboratorios independientes | fuera de alcance | actualizaciones posteriores, no merge |

## ClaudeCraft versiones 0.44.1..0.44.6 (evaluación, NO integrado)
- v0.44.1: fixes action-bar saves refused / preseed spec abilities, shader cache escritorio. Candidatos a revisión selectiva.
- v0.44.2: arreglos de stat tooltips y mantenimiento de dependencias. Revisar compatibilidad, nunca copiar a ciegas.
- v0.44.3..4: PvP/raids/World Quests y cambios online; sin beneficio directo confirmado para la DEMO offline.
- v0.44.5: compresión WebSocket del servidor; NO acelera por sí sola nuestro cliente WebGL offline.
- v0.44.6: bloqueo de cuentas de world quests para moderación; excluir de esta DEMO.
- Fuente releases: https://github.com/levy-street/world-of-claudecraft/releases.

## Secuencia y criterios de promoción
**V3-00 — Baseline sin deploy:** volver a correr PR-13 sobre rama DEMO V3; validar SHA del upstream, patch, PF-6, PR-1..13, all-source TS, tests y Vite offline. NINGUNA publicación.
**V3-01 — E2E ciclo Hunter:** spawn + GOLDEN HUD/combat + Training Core + level 1/50/99 + save/reload; pruebas de aislamiento de XP y stats.
**V3-02 — Profesiones visibles:** superficie de estado, estación y profesión mediante UI real, sin botones falsos; probar skill, trials, conocimientos.
**V3-03 — Mina → Forja → Inventario → Equipar:** una receta oficial reproducible, materiales consumidos una vez, resultado ganado una vez, y guardado; no duplicación.
**V3-04 — Loot y guardados:** kill -> loot -> inventory -> save/load, corpse/grants/quests, continuidad multi-escena y regresiones.
**V3-05 — Upstream selectivo:** solo fixes de UI/estabilidad con prueba comparativa.
**V3-06 — Certificación PC/S23 Ultra:** captura de evidencia humana + performance + browser + offline re-open. Publicar solo tras aprobación expresa.

### Prohibiciones absolutas
- No tocar main, Pages, freezes ni ramas LAB de Skin/Monster/Skills.
- No añadir XP/Training Core por loot, talentos o recetas.
- No prometer el total de PR-0..PR-23: solo PR-1..13 son overlays certificados, varios pilotos.
- No aplicar upgrade masivo ClaudeCraft ni atribuir licencias MIT a todos sus assets.
- Nunca llamar GREEN a una DEMO completa por un workflow unitario aislado.
- REUSE FIRST -> AUDITAR -> ADAPTAR -> EXTENDER -> TESTEAR -> CONGELAR.
