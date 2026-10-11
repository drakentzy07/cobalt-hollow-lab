# HIGHFLY — CONTINUAR V4-03 DESDE PR19 + MONSTRUOS, SIN REINICIAR
Quiero que continúes la integración REAL del **Hunter único** y de MONSTRUOS 6 en mi HIGHFLY V4-02 PR19, partiendo estrictamente de evidencias GitHub, sin volver a diseñar desde cero.

Repositorio `drakentzy07/cobalt-hollow-lab`. Rama de traspaso técnica (NO PUBLICAR): `highfly-v4-03-pr19-monsters-handoff-real`. La base de la app es `highfly-v4-02-pr19-webgl-package@6de0c95a5eeaba2ce1e37805bf89dd00c6a704e3`, NO PR17. Conservá PR19 móvil y su freeze Pages `e90daec37dcf0778afa374dedd606a54f5696640`. ClaudeCraft `9b57e49c9676d75962700f828cc00a50a9a988b5` congelado, fuente P02I monstruos `e6f59079fdc3f278ef041fbc8354ca837aee42ab`.

**Primero leer sin excepción:**
`docs/HIGHFLY_V4_03_PR19_MONSTERS_INTEGRATION/HIGHFLY_V4_03_INTEGRATION_HANDOFF.md`,
`HIGHFLY_V4_03_MONSTERS_INTEGRATION_MANIFEST.json`,
`HIGHFLY_V4_03_BESTIARY_1_99.csv`,
`HIGHFLY_V4_03_WORLD_SPAWN_ACCESS.csv`,
`HIGHFLY_V4_03_HUNTER_VS_MOB_BALANCE_REPORT.json`,
`HIGHFLY_V4_03_REWARD_LOOT_CRAFTING.csv`,
`HIGHFLY_V4_03_P02N_1440_RAW_DUELS.csv`,
y los workflows `.github/workflows/highfly-v4-03-pr19-monsters-combined.yml` y `highfly-v4-03-pr19-handoff-reports.yml`.
Comprobaciones GREEN: PR19 `38085915127` y `38085989015`; P02L `38094126772`; P02M `38095460400`; P02N sharded 1.440 `38102239479`; handoff datos `38103132422`; combinada PR17 (NO base correcta) `38102162302`. Consultar conclusión **real más reciente** del RUN PR19+Monster del workflow, sin inventar GREEN.

**Lo que sí existe:** 270 registros original ClaudeCraft +64 normales HIGHFLY +16 élites/capitanes =350 definiciones (NO 350 mobs activos), 988 filas de loot, 8 escenarios LAB LV21–99 y 15 zonas donor. P02N corrió 1.440 peleas de 8s, 6 WIN y 1.434 TIMEOUT: GREEN SMOKE, **NO balance de peleas completas**. El HuntPilot opt-in de P02I utiliza otro Hunter y +3× HP, NO está permitido en app persistente. Los cinco bosses especiales, skins premium y Extended 100+ son contenido FUTURO.

**Trabajo que te pido ahora, código real no solo docs:**
1. Auditar base PR19 y RUN V4-03 combinado; no fusionar ni publicar si falla.
2. Crear un **único puente de instancia en el Sim nativo** con UN Hunter, UN inventario, UNA XP, un save y retorno al mundo; notar que `Sim.worldContent` donor es `readonly`, así que NO basta reemplazar `sim.cfg.world` ni iniciar un segundo `Sim`. Reusar instancias originales o integrar zonas en WorldContent de arranque de forma segura.
3. Entrada/salida de ocho cacerías reales, nivel, rango, portal, access gates, spawn 8 enemigos por zona, élite/capitán sustituto, terreno/colisión/FPS.
4. Transacción idempotente `kill → RewardContext → loot → bolsa → profesión/herrería → gema` usando autoridad del Sim; conservar XP PF6 y STR/AGI/VIT/PER/INT exclusivamente Training. No activar sin pruebas la política +5 de reactivos propuesta en P02M.
5. Probar E2E con 9 clases, 3 perfiles Training, 3 tiers equipamiento, +0/+3/+5/+8, habilidades/combos 1-2-3 y 4 elemental con gema, esquiva/parry/dash, muertes, loot efectivo y crafting, tiempo real de pelea, odds/XP/h y antiabuso; no confundir 8 s smoke con tasa de victoria.
6. Guardado/cierre/reapertura, transición entre mapa y mundo, rollback, desconexión, control de duplicidad, performance física Samsung S23 Ultra horizontal.
7. Generar CI, build aislada y URL de revisión solo cuando gates pasen, preservando byte a byte ROOT, /v4-02/, /monster-lab/ y Skin Lab. Mantener PR19 protegido.

**Terminar con:** estado GREEN REAL / GREEN LAB / YELLOW / RED / FUTURO, RUN reales, SHA, build WebGL real verificable, pruebas móviles que debo hacer, bloqueantes, y ACTA FINAL DE TRASPASO; sin prometer integración completa cuando no exista el recorrido real del Hunter.
