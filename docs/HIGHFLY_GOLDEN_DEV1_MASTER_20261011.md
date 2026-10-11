# HIGHFLY GOLDEN DEV 1 · Plan ejecutable 1–99 / Extended 100+
**Fecha:** 2026-10-11 · **Rama:** `highfly-golden-dev1-p14-trainer-e2e` (desde `highfly-dev-main`) · **Sin despliegue**.

## Autoridad / separación
- ClaudeCraft v0.44.0 congelado (SHA `9b57e49c9676d75962700f828cc00a50a9a988b5`) → HIGHFLY GOLDEN. Un solo Sim, un Hunter persistente, guardados sin sobrescritura; no NEXT-CORE/Nexus.
- PLAY público `/v4-03-preview/` vs release candidate `highfly-play-v403-release-candidate` vs DEV `highfly-dev-main`: no son el mismo commit ni la misma fase. No mezclar ramas divergentes con merge automático.
- Nueve clases **INMUTABLES**: Warrior, Paladin, Hunter, Rogue, Priest, Shaman, Mage, Warlock, Druid. Cualquier título, segundo logro narrativo, skill EVO/Mutación/Única o maestría conserva la clase original; no subclases automáticas, no segundo despertar que cambie clase.
- STR/AGI/VIT/PER/INT solamente por Training Core real; equipo, skills, recetas, talentos y títulos no dan puntos permanentes de estas estadísticas.
- Extended 100+ = `DISABLED` (no atribuirlo al Hunter por llegar automáticamente al 99). Skill profesional 125 **NO** es Hunter LV125.

## Evidencia al inicio
- PLAY V4-03 LIVE documentado GREEN `38163605895`; no implica balance completo.
- DEV P13: exactamente 15 armas, 15 fórmulas; 50/60/70/80/90 × warrior/scout/caster; 212→227 entradas `ALL_RECIPES`. Comprobación inicial de ítems/equipabilidad/fuentes de reactivos y un crafteo LV50 con fixture; no 15 recorridos naturales.
- P14 fundación de socket sobre las tres gemas existentes Fire/Frost/Lightning; no nuevas gemas.
- LV91–99 reutiliza equipo LV90, sin nuevo capstone LV99. Biomas P02I son laboratorio, no ocho mapas visualmente certificados en PLAY.
- P10 bot simplificado no reemplaza balance humano, ni 9 clases/11 bandas, ni QA S23 Ultra físico.

## GOLDEN DEV 1 — orden con criterios de aceptación

| Entrega | Contenido concreto | Evidencia para cerrarla |
|---|---|---|
| GD1-P14A | Probar 15 recetas P13 en **Sim nativo**: maestro/forge, tier de oficio, precio una sola vez, conocido, consumo, item, serializar/relog | Nuevo `professions/p14/highfly_p14_trainer_native_15_paths.test.ts` + RUN CI; fixtures de dinero/materiales claramente etiquetadas |
| GD1-P14B | Auditar accesibilidad desde menú de NPC; 15 iconos y modelos de arma, toque Android, tooltip/req y estación real | Browser smoke + screenshots manuales, nine-class + S23 físico; no fixtures de receta aprendida |
| GD1-P14C | Obtener **legalmente** cada reagente LV50–99, medir drop por hora y gasto cobre real, luego fabricar | Bot reproducible sin `addItem`, `setPlayerLevel`, `knownRecipes.add` ni monedas regaladas; reportar éxitos/fracaso por receta |
| GD1-P15 | Balance por tramos 50–59,60–69,70–79,80–89,90–99, incluyendo armadura, comida, pociones, accesorios, valor de arma y rareza | Para cada banda: fuente→receta→estación→producto útil→guardar; sin inflar HP arbitrariamente |
| GD1-P16 | Escalera Fuego/Hielo/Rayo LV21–99 sobre socket original, coste, daño/CC/resistencia y VFX móvil | Misma gema antigua compatible; ATK3 sin gema, ATK4 con gema; consumo y relog; no bonus permanentes de Training |
| GD1-P17 | Matriz 9 clases × 11 bandas × normal/élite/capitán × niveles +0/+3/+5; economía y XP | Combate + habilidades/parry/dodge/habilidades/curación/recursos, métricas win/TTK/tiempo, equipo conseguido jugando; natural LV1→99 pendiente hasta demostrarlo |
| GD1-P18 | Certificar guardados antiguos, IndexedDB Play vs Dev, export/import, rollback, S23 físico; release completo | Prueba V4-02→V4-03.x en mismo navegador sin pérdida, checksum respaldo, preservación completa de rutas Pages, FPS y carga real |
| GD1-P19 | Capstone narrativo LV99 normal y cinco legendarios en paquete premium opt-in aislado | Misiones únicas/condiciones de descubrimiento, RewardContext y escenarios, no despliegue prematuro |

### Distinguir tier nativo de gate estricto
`training.ts` original permite aprender la receta cuando `tierForSkill(craftSkills.weaponcrafting) >= tierForSkill(recipe.skillReq)`, con grupos de **25 puntos**. Por ejemplo, una receta declarada `skillReq:85` es aprendible al oficio **75**; `skillReq:110` al oficio **100**. `crafting.ts` NO aplica después una prohibición exacta por `skillReq`. Esto es diseño REAL del donante, no ocultarlo. Primero registrar correctamente y evaluar si la economía necesita un nuevo gate **P13-only** compatible con UI/servidor, sin modificar globalmente todas las recetas ClaudeCraft.

### Matriz LV50–99 inmediata
- 50–59: `rough_hide` + `arcane_essence` + `smithing_flux`; tres armas uncommon. Deben existir fuente, maestro, forja, UI e inventario.
- 60–69: `sharp_claw` + `curved_tusk` + flux; tres armas rare. Medir fuente y peligro real.
- 70–79: `spider_silk` + `arcane_essence` + flux; tres rare.
- 80–89: `arcane_shard` + `sharp_claw` + flux; tres epic.
- 90–99: `arcane_shard` + `arcane_essence` + flux; tres epic LV90. Necesita además recompensa propia LV99 (no renombrar arma LV90 como LV99).
- En TODAS las bandas: clase, training sin regalos, economía/gathering, comida/pociones, gemas, armadura, accesorios, progresión real; nada se declara cerrado sólo por existir la receta.

## Misiones, escenarios y cinco monstruos únicos (update independiente)
Las 5 fichas especiales son las de MONSTRUOS ESPECIALES 7. En vez de 5 enemigos con distinta cantidad de vida, exigir a cada uno: territorio/condiciones de aparición, pistas y misiones EX de investigación, requisito de preparación sin clase forzada, IA original por fases con contra-juego/parry/esquiva, peligro ambiental, derrota/reintento, recompensa única, `RewardContext`, materiales y recetas especiales, desbloqueo de puertas/misiones, estados persistentes e idempotentes. Los biomas del laboratorio se integran por escenarios opt-in con arte/colisiones/LOD originales y tests S23, no se reemplaza automáticamente el terreno de la ciudad.

## EXTENDED 100+ — contrato futuro, no gameplay liberado
### Puerta 99 → 100
Requiere decisión explícita del jugador **después** de completar un arco final LV99. La puerta se presenta como prueba de trascendencia de Hunter, nunca como cambio de clase. Debe incluir (ajustable por balance): capítulo principal 99 completo, expedición de grado alto, título de exploración, una prueba de dominio de habilidades y misión EX de descubrimiento. Las sesiones de entrenamiento real mantienen su valor pero el capítulo de historia no convierte un nivel en una recompensa de entrenamiento automática. Los nuevos campos de save serán **aditivos** (`extendedUnlockState`, `extendedChapter`, `contentRevision`), con migración versionada y apagados por defecto; no inventar una partida nueva.

### Publicación por capítulos
- **E0 (ahora):** sólo especificación + pruebas de bandera desactivada, cap normal 99.
- **E1 (futuro 100–149):** primera región después de la prueba de trascendencia, nueva relación de resistencias, enemigos con patrones, materiales/crafts, NPC y recompensas; 9 clases.
- **E2 (150–199):** territorios en bifurcación, misiones condicionadas y cooperación/encuentros persistentes compatibles con arquitectura offline.
- **E3 (200–299):** capas de maestría, enemigos adaptativos acotados y habilidades EVO según mérito.
- **E4–E9 (300–999):** regiones por escalones aprobados en releases distintos, economía específica, jefes con reglas, títulos y mutaciones condicionadas. Ningún escalón se activa sin cierre del anterior.
- **E10 (1000):** meta remota/legendaria, no nivel habilitado ni promesa de implementación próxima.

El escalado usa presupuestos acotados de daño, mitigación, control, telegráficos y downtime además de HP; gear no añade STR/AGI/VIT/PER/INT. Monstruos 100+ requieren nuevas capacidades que el jugador aprende a contrarrestar, no repetir LV99 multiplicado por diez. Conservar invariantes de 1 Sim/Hunter y no duplicar RNG, loot, XP ni monedas.

## Informe obligatorio de cada RUN
Para cada entrega: `rama/SHA`, tests por nombre y número, resultado real de Actions (GREEN/RED/QUEUED), ¿en PLAY? (NO por defecto), ¿qué ve el jugador? (nada nuevo mientras sólo sea DEV), diferencias de fixtures vs partida natural, gap de seguridad/guardado y próxima corrección. Un GREEN de CI no es QA de Android físico ni de economía de 99 niveles.
