# HIGHFLY — RESET CONTROLADO CLAUDECRAFT v0.44.6 + TRAINING CORE

**Fecha:** 2026-10-17. **Estado:** PRUEBA AISLADA / NO DEPLOY / NO BORRAR.

## Fuente oficial congelada
- Repositorio: `levy-street/world-of-claudecraft`
- `main` y última release `v0.44.6` son idénticos: **`86cc574989d03ac491563e26bd8fdf951dfeecfb`** (merge 2026-10-09).
- Fuente HIGHFLY congelada anterior: `9b57e49c9676d75962700f828cc00a50a9a988b5` (v0.44.0).
- Comparación: 224 commits adelante, pero la release v0.44.6 solo incluye cambios administrativos de bloqueo de world quests; no prometer mejoras de movilidad, combate o HUD sin medirlas.
- El `MAX_LEVEL` de v0.44.6 **permanece 20**. Los assets de modular/ropa interior no cambiaron según blob SHA.

## Hipótesis
La vía más segura es primero **ClaudeCraft v0.44.6 sin overlays de combate HIGHFLY**, incorporando solamente los módulos `training/runtime/` + pruebas puras, y gradualmente la conexión del Training Core. No desplazar todas nuestras 9 escuelas, skills, P23, R32, monster LV21–99 o profesiones todavía. Se preservan íntegros en sus ramas anteriores.

### Gates
1. **P0** descargar v0.44.6 por SHA exacto (sparse clone), copiar módulos Training Core a `src/highfly/training` y ejecutar tests puros del Training Core sin tocar `src/main.ts`, `src/ui/hud.ts`, `src/sim/sim.ts`, ni páginas. Si hay fallos, detectar incompatibilidad sin fallback ni modificaciones a donor.
2. **P1** probar ClaudeCraft v0.44.6 Vanilla completo WebGL y controles móviles S23; nada de siete slots nuevos ni habilidades externas.
3. **P2** integrar un botón de entrenamiento modular en el HUD original, persistencia versionada y estadística STR/AGI/VIT/PER/INT solo bajo autoridades validadas. Guardar/cargar y test regresiones de clases originales. No reutilizar los overlays masivos V15/C1/ORIGIN.
4. **P3** opcional, redefinir inicio Hunter único y editor intramundo solo cuando baseline sea GREEN y el usuario confirme. Si el usuario prefiere mantener creador y clases originales hasta entonces, NO tocarlos.
5. **P4** extender gameplay nativo 21–99 copiando PF6 solo tras probar compatibilidad de `MAX_LEVEL=20`, XP_TABLE, quests, loot, monsters, progression, saves y daño. No significa que nivel 99 esté ya incluido en v0.44.6. No dar por aprobados los 64+16 monstruos sin importarlos y auditar contenido.
6. **P5** recuperar selectivamente movilidad GOLDEN, ATK manual 1–2–3–4 con gema, recursos MP/Energía, nueve escuelas, siete slots y ÚNICAS secretas: uno por uno con prueba física S23.

## Protección
- `main`, Pages, laboratorios v15/r23/r32 y guardados anteriores se mantienen inalterados.
- **No borrar ningún archivo del sitio**: auditoría #39034434175 halló solo ~1,32 MB en laboratorios y 2,31 MB de posibles payloads duplicados en 951 MB totales; eliminar labs no arregla la cuota.
- Nueva rama HIGHFLY `highfly-claudecraft-v0446-training-reset` proviene de `highfly-main-clean-v1` exclusivamente para rescatar las fuentes del Training Core. **No** implica que esa rama sea el upstream original: la CI debe bajar v0.44.6 congelada por separado.
- El RUN CLEAN R1 previo #39035140811 es independiente y falló por ruta de script inexistente; no copiar ese overlay a la nueva base.
