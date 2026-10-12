# HIGHFLY GOLDEN DEV — ESTADO AUDITADO Y PLAN DE CIERRE LV1–99
**12 oct 2026 · Fuente de verdad:** `drakentzy07/cobalt-hollow-lab`
**REGLA:** REUSE FIRST → AUDITAR → ADAPTAR → EXTENDER MÍNIMO → TESTEAR → CONGELAR.
**PUBLICACIÓN:** NO DEPLOY. PLAY oficial sigue V4-03 y guarda por namespace histórico.

## Decisiones inamovibles del Hunter
- **Nueve clases originales:** Warrior / Paladin / Hunter / Rogue / Priest / Shaman / Mage / Warlock / Druid.
- **Sin reset MU, sin segundos despertares/subclases obligatorios.** El normal LV1–99 no reinicia nivel ni regala STR/AGI/VIT/PER/INT.
- STR / AGI / VIT / PER / INT ganadas SOLO por entrenamiento real; equipo mejora COMBATE sin subir permanentemente Training Core.
- Un Hunter y un único `Sim` congelado de ClaudeCraft v0.44.0; joystick/cámara/HUD, 1-2-3 y gem→ATK4, clases y save GOLDEN intactos.
- EXTENDED LV100+ DESACTIVADO, co-op 2–5 optativo a futuro, no integrado ni servidor inventado.

## Lo que EXISTE en código nativo y sus límites
| Sistema | Reutilización probada | Lo que NO está certificado |
| --- | --- | --- |
| Monstruos | 64 normales + 16 élite/capitán LV21–99, 8 expediciones, 16 campamentos outdoor; original LV1–20 preservado | Comportamiento humano TTK/curación/dodge/parry equilibrado; 5 únicos premium futuros |
| Mundo | 8 portales opt-in y exteriores, 9 clases en 8 expediciones QA | Arte, interiores distintos y navegación completa en S23 físico |
| XP y Training | PF6 1–99 sobre tabla original 1–20; stats Training separados; saves/sesiones probados | Recorrido natural completo 1→99 y ritmo real |
| Recetas | 212 del donor+PR14–16 + 15 P13 LV50–90 GREEN + 3 P15 LV35 **candidatas** = 230 en rama DEV5 | Maestro visible, obtenibilidad natural de todas, prueba humana UI y late armor |
| Loot | Cadáver/cobre/inventario y RNG original, LV50 real-chance wolf/revenant→forja→equip→save GREEN | Balance económico todas las clases y niveles |
| Gemas | Fuego/Hielo/Rayo y ATK4 native con consumo físico y guardado | Potenciación progresiva desde 21–99 |
| Dinero | 100c = 1s, 100s = 1g; mob loot, vendor, quests y trainer/forge sinks originales | Ingresos de quests LV21+ y rentabilidad real del mercado |
| Armaduras | >1000 entradas totales de gear en registros, 124 recetas gear PRE P15 | DEV4 detectó NO nuevas recetas nominales de armaduras en bandas LV40–99; buscar drops/quests/vendor ANTES de añadir modelos |

## RUNs y cambios que NO tocan PLAY
1. **DEV1 / PR #18**, RUN #38182361349 GREEN: 15 herrerías P13 maestro→forge→item→relog, fixtures transparentes.
2. **DEV2 / PR #21**, RUN #38187991668 GREEN inicial: 11 bandas, auténtico RNG corpse→forge LV50, 49 lobos +33 revenants. Diagnóstico material por arma LV50/60/70/80/90: 92/84/175/165/550 bajas esperadas. Tune mínimo aplicado: 92/100/142/165/200 con guard 250 máx, RUN #38188562632 GREEN.
3. **DEV3 / PR #22**, RUN #38188961305 GREEN: economía de 11 bandas, coste sólo-cobre optimista por arma 124/101/85/292/257 enemigos, costes entrenador 4/4/4/16/16 oros. No inflar dinero a ciegas ni hacer copia del sistema monetario.
4. **DEV4 / PR #23**, RUN #38189344675 GREEN: 9 clases × 11 bandas, 1103 entradas de equipamiento (NO modelos artísticos), 124 recetas equipo antes de DEV5, todos 9 grupos equipan alguna P13 LV90. No nueva receta nominal weapon en 30–39; sin nuevas recetas nominales armor 40–99. Elegible NO equivale a obtenible.
5. **DEV5 / PR #24**, RUN #38189739172 pendiente de aceptación final: 3 nuevas armas LV35 sobre modelos nativos existentes, mismas nueve clases repartidas 3 grupos, ingredientes existentes rough_hide×4 + spider_silk×5 + smithing_flux×2, trainer forge skill50. Total nativo **230** recetas en DEV5. No añadir al público sin CI completo.
6. **PUBLISH / PR #19** todavía BLOQUEADO correctamente: full Pages+V4-03.1 ~1.85GB, presupuesto seguro 995MB. Auditoría hash halló ~785 MB archivos grandes duplicados en media (un ahorro POTENCIAL, no permission de borrar); NO deploy hasta reescritura probada.

**Referencias verificadas:**
- DEV2: https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38188562632
- DEV3: https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38188961305
- DEV4: https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38189344675
- DEV5: https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38189739172

## Balance humano: advertencia importante
P10 144 peleas naturales Sim.tick hasta 40 s (equipo/level suministrado de fixture):
- Normales 56 WIN / 11 LOSS / 5 TIMEOUT de 72.
- Capitanes 10 WIN / 56 LOSS / 6 TIMEOUT de 72.
- Bot automático con skill periódica SIN parry/dash humano ni curación inteligente, NO demuestra fracaso de clases humanas ni permite nerf masivo de mobs.
- Priests/druids/mages requieren medir hechizos, curación, maná, colocación, TTK, equipo legal y 1–99 antes de buff/nerf.

## Próximos gates verificables para declarar NORMAL LV1–99 terminado
- **Mundo:** comprobar físicamente terrenos, recorrido portal/retorno, campamentos, dungeon y movilidad en S23 Ultra.
- **Equipo:** P15 LV35 GREEN primero; después auditar armaduras por drop/quest/vendor en 40–99 y añadir sólo escalones mínimos si de verdad no existen.
- **Monstruos/loot:** recetas at-level con fuente realmente obtenible, loot probabilístico y economía de monedas/sinks por banda.
- **Profisiones:** dominio oficio (máx125) independiente de Hunter LV99; maestro, estación, recursos, crafting y save; gemas/progresión elemental.
- **Combate:** nueve clases × niveles × normal/elite/capitán con equipo legal, skill rotation, curación, movilidad, sin fixtures de stats permanentes; no confundir humo 8 s/40 s con balance.
- **Endgame 99:** retos y maestría sin reset, equipo/recompensas y bucles de larga duración. Nada de regalar Training stats.
- **QA release:** exportar respaldo previo, migrate IndexedDB/localStorage por origen, 404/JS/GLB/sonidos/Chrome, S23 físico; artefacto Pages completo <=995MB con paths anteriores byte-idénticos y aprobación humana.

**Criterio final:** 1→99 puede recorrerse, cada tramo puede combatir, conseguir XP, loot, dinero, materiales, aprender recetas, fabricar, equipar, guardar y regresar; sólo entonces subir a PLAY. Cualquier sistema nuevo que replique inventario, Sim, Loot, XP, entrenamiento o profesionales queda rechazado.
