# HIGHFLY — MATRIZ MAESTRA DE COBERTURA Y BALANCE LV1–99 · BASE CLAUDE + HIGHFLY + POTENCIACIÓN
**Fecha:** 2026-10-11. **Estado:** AUDITORÍA DE COBERTURA, NO CERTIFICACIÓN GLOBAL. NO DEPLOY.

## Interpretación inequívoca
Todo el juego normal debe tener un recorrido de progreso coherente entre los niveles **1 y 99**, no únicamente nuevos monstruos 21–99. "Extended" real 100+ **no está habilitado**: PF-6 define `HIGHFLY_PF6_EXTENDED_ENABLED=false`; el laboratorio de monstruos también define `HIGHFLY_EXTENDED_MONSTERS_ENABLED=false`. No se deben mezclar ambas cosas.

## Tres capas sin motores duplicados
1. **ClaudeCraft original:** única autoridad de `Sim`, personajes, HP/daño, clase, skills originales, recetas, objetos, inventario, experiencia de kill/quest, crafting, profesión, NPC/estación, terreno, dungeon, drop/cadáver, guardado y compatibilidad.
2. **HIGHFLY integrado:** Training Core, PF-6 LV1–99, Stats derivadas del entrenamiento real, rango, habilidades/ATAQUE 1-2-3 + gema→ATK4, PR1–PR13 adaptadores de profesiones, PR14–PR16 de gemas, P07 mundo/campamentos/portales, P08 loop real, P09 élites/capitanes opt-in.
3. **HIGHFLY potenciado futuro:** curva verificada nivel a nivel de economía, NPCs/estaciones, tiers de armas/armaduras consumibles, recetas, loot y experiencia, tres elementos durante TODA la curva, balance de nueve clases, desafío opcional y progresión alta; no inventar STR/AGI/VIT/PER/INT a través de ítems, gear o skills.

## Evidencia REAL a esta fecha

| Subsistema | Fuente existente | Estado comprobado | Brecha hasta balance LV1–99 |
| --- | --- | --- | --- |
| Nivel y XP | Donor `grantXp` + PF-6 `HIGHFLY_PF6_XP_TABLE` | Cap 99, 1–20 original, tabla incremental 21–99, Training separado, save/E2E | Tiempo real para subir, grindeo/recompensas/misiones por banda; migración completa; no se ha probado partida natural 1→99 |
| Gemas | PR14 fuego, PR15 hielo+rayo, PR16 guía | Tres gemas físicas craft/inlay sobre arma, gem→ATK4, persistencia, test real P08 | `recipe_highfly_fire_gem` LV10/skill25, frost LV15/skill35, lightning LV20/skill60. **No existe progresión certificada de gemas para LV21–99**; añadir mejoras sólo sobre socket/recetas originales, no catálogo paralelo |
| Profesiones | Claude donor + HIGHFLY PR1–13; PR14–16 gemas | Oficios nativos, recolección/forja/cocina/encantar/etc. y pilotos HIGHFLY probados | Auditoría donor: 176 registros de receta declarados por PR0; recetas base con `level` máx 25 y `skillReq` máx 125; profesiones tienen niveles/habilidades de oficio **no equivalentes** al LV del Hunter. Falta autoría/QA de requisitos, materiales, rareza, recipes y mastery alto LV21–99. Master PR0–23 es especificación, no 23 PR completos |
| Loot | Donor original + P02I/P02E + P03/P08 | 64 normales HIGHFLY añaden **una fila extra** de reactivo de receta nativa, con fase de materiales en <40, 40–79 y 80–99, sin duplicar inventario; loot cadáver/cobre/forja/inlay real probado LV21 | Los reactivos consumen **recetas mayormente tempranas**: aún no existe economía/drop ladder de armas/accesorios/materiales nuevos de endgame totalmente equilibrada |
| Monstruos | Donor + 64 variantes 21–99 + 16 local élite/capitán P09 | 8 bandas/expediciones, IA/HP/damage/loot vía `Sim`; 8 portales y 16 campos outdoor (32 mobs máx). P09: 6 normal+1 elite+1 capitán en cada dungeon, cap 8 | No es un bestiario artístico nuevo ni 80 familias únicas. Falta balance real TTK/daño/mecánicas, nivel de habilidad, drops por tier y rutas físicas. 5 legendarios especiales quedan afuera |
| 9 clases | Donor `PlayerClass` + PF-6 | 9 Hunter × 8 bandas de entrada/guardado GREEN P08, Training Core separado | Balance de todas las skills/rangos/armaduras/curación/mana/parry/dash/ATK4 y combates completos **no certificado**. P02N: 1440 duelos ≤8 s: 4/720 WIN y 2/720 WIN en +5, resto TIMEOUT |
| Mundo | 15 zonas originales + P07 overlays + P02I laboratorio | 8 regiones reciben portales/campamentos reales; P02I tiene ocho biomas en **previews aisladas** | Los ocho interiores P08/P09 aún reutilizan `crypt/sanctum/temple`; topología, arte y locomoción human QA pendientes |
| Rendimiento | CI Chrome emulado S23U | P08/P09 WebGL, HUD, joystick, cámara, carga y subpath preview GREEN | FPS/p95/carga inicial/memoria/thermal en Samsung S23 Ultra **físico** no medidos |
| Publicación | GitHub Pages `drakentzy07/cobalt-hollow-lab` | P08 y P09 artifacts WebGL y packages subpath, NO deploy | Actions Pages despliega sitio **completo**. No publicar árbol parcial sin snapshot íntegro y hash-preservation de ROOT, V4-02, Monster Lab y Skin Lab |

### Valores de referencia auditados en fuentes
- `src/sim/content/recipes.ts` del donor pinneado: 175 coincidencias declarativas `level` con **máximo 25**, y 175 `skillReq` con **máximo 125**. El PR0 cuenta 176 registros authored en su snapshot (incluye un registro con forma distinta): **no tratar recuentos textuales como número canónico de `ALL_RECIPES` integrado**.
- `professions/pr15/activate_pr15.py` y `professions/pr14/highfly_gem_catalog.ts`: tres recetas; level 10/15/20, skillReq 25/35/60.
- `monsters/lv99/highfly_hunt_rewards.ts`: 64 filas extra, reactivos de recetas Claude sin crear ítems LV99; fase 0 para LV21–39, fase 1 para 40–79, fase 2 para 80–99.
- `training/runtime/pf6_xp_curve.ts`: LV99 máximo normal, Extended 100+ bloqueado.
- P08 GREEN https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38139928673
- P09 GREEN https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38140856603
- P02N headless GREEN https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38102239479
- P10 es una nueva medición de 144 combates prolongados, **NO** un certificado de equilibrio ni de partida real 1–99.

## Gate maestro: qué validar ANTES de afirmar «HIGHFLY COMPLETO LV1–99»

Para cada segmento **1–9, 10–19, 20, 21–29, 30–39, 40–49, 50–59, 60–69, 70–79, 80–89, 90–99**:
1. **Contenido alcanzable:** recorrido real desde nivel anterior; mobs/challenge adecuados; economía de XP mata/misión con progresión no absurda; salida del área y muerte recuperable.
2. **Profesión útil:** gathering acorde a zona; materiales obtenibles; recetas que verdaderamente *consumen* esos materiales; estaciones/NPC de acceso; equipamiento útil y craft skills alcanzables sin saltos QA.
3. **Equipo/loot:** armas reales apropiadas para nueve clases, armadura, accesorios, pociones, upgrades/forja; costo/mercado/drops; validación `requiredLevelFor` y power budget (NO STR/AGI/VIT/PER/INT permanentes por ítems).
4. **Gema:** Fuego/Hielo/Rayo disponibles según reglas y trayectorias (sin obligar a tres gemas nuevas por cada nivel); escalado de ATK4/rider y control de poder por tramo, adquisición, riesgo/valor, socket individual persistente; sin gem = ATK3.
5. **Combate/balance:** 9 clases × normal/élite/capitán × niveles igual/+3/+5, con equipo obtenido LEGALMENTE y Training real/sin entrenar; medir win/loss/timeout, DPS, TTK, healing, consumo, combo, parry/dodge y costos de recurso; evitar combate autoestático único.
6. **Integridad:** un Hunter/Sim; no duplicar XP, loot, recetas, monedas o gemas; save antiguo→ nuevo→ relog; rendimiento medido en S23U.
7. **Arte/camino:** 8 territorios apropiados y ambientación P02I reusada cuando pase navegabilidad; no reemplazar terrenos originales en silencio.

**Un solo GREEN de presencia de sistemas no certifica siete gates por tramo.**

## Orden de implementación que minimiza rehacer balance
1. **P10 medición**: clasificar 144 duelos largos y distinguir imposibilidad / TTK / skill rotation mal usada.
2. **P11 matriz actual**: exportar con tablas originales + extensiones una brecha `level→enemy→loot→recipe→item→gem→power` para 11 tramos y 9 clases. Cero buffs/recetas inventadas durante auditoría.
3. **P12 itemización/recetas**: completar materiales y sinks, economías y craft gates hasta 99 REUSE-FIRST, nueve clases; más pruebas con itemización real y escalado de uso.
4. **P13 calibración**: XP/TTK/DPS/mana/healing, gem riders, entrenamiento real, equipo por tramo; pruebas de 9 clases/11 etapas.
5. **P14 juego y dispositivo**: navegación/teleporte/no-hacks, profesiones/tiendas/UI, save/reload desde LV1 a 99, S23U físico, Pages seguro de revisión con preservación total.

> Esta matriz es una verdad de estado, no declara implementadas P11–P14, y deja explícitamente fuera la extensión 100+, monstruos especiales legendarios, SKIN LAB premium y skill EVO/MUTACIÓN/ÚNICA.
