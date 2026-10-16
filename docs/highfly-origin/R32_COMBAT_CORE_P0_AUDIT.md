# HIGHFLY ORIGIN 7 COMBATE — R32-P0: AUDITORÍA DEL SUPREME MOBA COMBAT CORE

Fecha: 2026-10-16. Estado: **P0 en curso, diagnóstico estático documentado; no hay build Android ni integración visual certificada**.

## 0. Límites de esta intervención

- Base exacta: rama `highfly-origin-r31-77-live-skill-lab`, commit `8e91c6654720c6128dbabc3c421d0ab293822f3d`. El workflow de R31 run 38957779088 consta GREEN; eso no certifica el Samsung real.
- Laboratorio donante independiente: `highfly-unique-guinevere-r03-controls-airtime`, commit `26aa3f62e5eda48e286c3ebb726b9157da1db5e8`. **No se fusiona**.
- Producción, `main`, GitHub Pages, archivos de guardado, inventario, Training Core, niveles, mundos, habilidades originales y upstream congelado permanecen sin cambios.
- El repositorio guarda fuentes/overlays; el `src/sim` completo se ensambla dentro del workflow desde `levy-street/world-of-claudecraft` en commit `9b57e49c9676d75962700f828cc00a50a9a988b5`. Las rutas `src/sim/combat/*` no existen en la raíz R31. Hay que auditar el resultado ensamblado antes de editar el ciclo de casteo.

## A. Mapa del flujo: toque a impacto

| Etapa | Fuente REAL revisada | Evidencia técnica | Estado / pendiente |
|---|---|---|---|
| HUD táctil | `game/c1/runtime.ts` | `installSkillTouch()` captura `pointerdown/up` y hace `btn.click()`; `boot()` monta casilleros fantasma y especiales, y los recrea en `tick()` cada 180 ms | **Verificado en código**. Riesgo de doble captura |
| Presentación de slots | `game/c1/hud.css`, `game/c1/runtime.ts` | CSS expone S1–S10 y ESP1/ESP2/ULT; editor registra S1–S10 y tres especiales | **Verificado**. Contradice 4 BASE + ÚNICAS invisibles |
| Distribución / tap al Sim | `game/c1/highfly_origin_r17_hud.ts` | Publica 18 slots, autopack de 10 ofensivas + 8 utilidades; llama `h.castSlot`/`h.castAt` | **Verificado**. Proyección R32 debe desacoplarse del save legado |
| Laboratorio ATK | `game/c1/highfly_origin_r28_universal_tester.ts` | Intercepta `pointerdown/up/click` del ATK y despacha `sim.castAbilityAt` o `sim.castAbility` | **Verificado**. Es **QA opt-in**, no HUD normal |
| Intención manual | `game/c1/highfly_origin_r21_aim_intent.ts` | `highflyManualAim`, conversión por proyección, `highflyManualRayTarget` | **Verificado** para matemáticas; uso end-to-end no certificado |
| Previsualización | `game/c1/highfly_origin_r20_premium_aim.ts` | `highflyAimSpec` y `HighflyAimVisual` usan buffers Three reutilizables | **Verificado**. Mismatch área-colisión pendiente de inspección |
| Skillshot libre | `game/c1/highfly_origin_r24a_skillshot_physics.ts`, `highfly_origin_r24a_native_skillshot.ts` | Trayectoria 2D sin homing, intersección segmento-círculo; Fireball y Shadow Bolt opt-in | **Verificado** en fuente; requiere prueba ensamblada |
| Recursos / admisión | `game/c1/highfly_origin_universal_resources.ts`, `highfly_origin_resource_admission.ts`, `overlays/highfly_origin_r14_resource_bundle.py` | `originCostDecision` determina MP/Stamina; ruta temporal legacy queda sustituida en R14. `divine_ascension` y efectos especiales pueden quedar bloqueados intencionalmente | **Verificado**; motivo exacto de cada rechazo necesita traza real |
| Cast / daño / CC | `src/sim/combat/casting_lifecycle.ts`, `src/sim/combat/damage.ts`, `src/sim/types.ts` del **upstream ensamblado** | El overlay R14 modifica admisión, disponible y cobro del ciclo original. R31 añade pasivas QA en daño | **Pendiente**: auditar fuente ensamblada, orden de validadores, GCD, hit y rechazo |
| Animación | `game/c1/highfly_origin_skill_motion_catalog.ts` | Registra clases donantes y clips sin recargar GLB automáticamente | **Verificado** como inventario; blending efectivo pendiente |
| VFX | `game/c1/highfly_origin_r20_premium_aim.ts`, `overlays/highfly_origin_r31_77_laboratory.py` | R31 diferencia visual-only de casts nativos y no aplica daño por una preview | **Verificado**; rendimiento físico pendiente |

**Rastro objetivo de R32:** pointerId -> acción -> intención manual/soft -> preview -> petición `Sim` -> admisión de habilidad y recurso -> windup/cast -> colisión / tick autoritativo -> daño/CC -> evento visual -> recovery -> limpieza y métricas.

## B. Matriz de reutilización y decisiones

| Acción | Componente | Motivo |
|---|---|---|
| CONSERVAR | Mundo ClaudeCraft, Sim original, KayKit `Rig_Medium`, prof/loot, guardados | No duplicar motor RPG ni cambiar autoridad |
| CONSERVAR + TESTEAR | Cámara GOLDEN, joystick, salto/doble salto, dash y ATK 1-2-3-4 gema | Controles valiosos, riesgo de regresión |
| ADAPTAR | `R17` loadout/slot bridge + `R18` editor | Persisten 18 slots; nueva vista muestra solo 4 BASE |
| ADAPTAR | `R20` visual + `R21` intención + `R24A` skillshots | Cada preview debe reflejar hitbox, alcance y suelo del Sim |
| ADAPTAR | `R28` grimorio y selección QA | No secuestrar ATK en gameplay normal |
| OPTIMIZAR | Control de VFX, tiempo de vida, geometrías, transparencias | Primero medir FPS/frametime/overdraw antes de recortar |
| REEMPLAZAR EN VISTA R32 | S1–S10 visibles, B1–B8 visibles, ESP1/ESP2/ULT de nacimiento, casilleros fantasma | Incompatibles con HUD 4 BASE + descubrimientos secretos |
| NO REEMPLAZAR SIN AUDITORÍA | `casting_lifecycle`, colisión del Sim, habilidades nativas | Riesgo de doble costo, CDs y daño fantasmas |
| POSTERGAR | Unir Guinevere completo, 77 skills completas, grandes mapas, skins y VFX nuevos | Primero controlar estabilidad y semántica |

## C. Diagnóstico de incidentes R31 documentados

| Síntoma observado o reportado | Hipótesis plausible, NO afirmada como causa | Qué medir / verificar |
|---|---|---|
| Holy Ground / Quaking Blow: círculos gigantes, lejanos | Desajuste de `range`, `radius`, altura terreno, unidad de escala o relación `highflyAimSpec`-hitbox | `abilityId`, radio native, radio preview, origen world, proyectado screen, collider efectivo |
| `RECHAZADO POR SIM`, `NO TIENES SUFICIENTE IRA` | Alguna ruta legacy todavía llama validador de recurso o caster equivocado | Instrumentar reasonCode antes/después de migración R14; no anular guardas |
| `ESA HABILIDAD AÚN NO ESTÁ LISTA` | Puede corresponder al grupo Premium visual-only o a una admisión bloqueada | Trazar catálogo, `originCostDecision`, source `Sim`, habilidad seleccionada |
| Doble HUD / acumulación | Creación reiterada de S1–S10, especiales y controladores R17/R28 | **Causa estructural demostrada** en `runtime.ts`, `hud.css`, `R17`; inventariar eventos activos del assembly |
| Congelamiento y caída de fluidez en S23 | Partículas, overdraw, shader, alloc/GC, geometrías y duración pueden contribuir | FPS, p95 frame, memory, draw calls, VFX vivos y vida real por effectId |
| Continuidad aérea incompleta | El donante tiene timing propio y la simulación principal otros estados | Prueba de aceptación del bridge; NO importar segundo kernel |

Videos originales `1000457091.mp4` y `1000457092.mp4`: no están adjuntos aquí. Solo constan los síntomas escritos. Ninguna nueva observación visual se atribuye a esos videos.

## D. Guinevere R03 — mapa de trasplante

R03 contiene `unique-lab/guinevere-r03/core.mjs`, un **kernel determinista independiente y NO unido al Sim principal**. El render `main3d.mjs` observa eventos; el control `controls.mjs` normaliza gesto y joystick con la cámara.

| Donante | Aprovechar | Integración futura necesaria |
|---|---|---|
| U1 Prisma del Vórtice | Dirección, impacto, marca, slow, refund | Reutilizar trayectoria nativa R24A cuando semánticamente aplique; Sim debe cobrar MP, aplicar daño/estado y emitir VFX |
| U2 Ruptura Ascendente | Leap, landing, CC, recast/blink, eco | Control de movimiento/colisión principal; CC y boss immunity en Sim; una sola ventana y cobro |
| U3 Tempestad Suspendida | 11 ticks temporizados, elevación condicional, boss poise | Scheduler del Sim; sincronizar once daños reales y eventos; prevenir daño post mortem |
| Combo U1-U2-U3-recast U2 | Buffer `0.48s` en R03, recast, continuidad aérea | Verificar cola/GCD del upstream: no copiar timings de prototipo a ciegas |
| Controles R03 | `pointerToWorld`, `joystickToWorld`, captura por pointerId y cancelar | Comparar convenciones de ejes contra cámara GOLDEN antes de adaptar |
| Clips y VFX | Selección por clips KayKit; límite de FX, recursos 3D | Reconciliar inventario de animaciones y VFX budgets con engine actual |

**Nunca copiar `UniqueGuinevereLab` como un segundo Sim**. Mantener sus tests `core/combo/airtime/controls` como especificación de comportamiento, no como prueba de integración.

## E. Contrato HUD R32 4 + 3 SECRETO

- **BASE:** exactamente cuatro posiciones visibles; persisten cuatro asignaciones normales elegidas desde biblioteca, sin borrar históricos.
- **ÚNICA:** no existen DOM, botones, labels, hint, contadores ni posiciones visuales reservadas hasta el primer desbloqueo validado por el **Sim**. Aparece una posición por descubrimiento, máximo tres.
- Las funciones QA no tocan guardados ni autorizan progresión. Dos pasivas fuera del HUD; gemas, comidas, consumibles y buffs en su banda separada.
- ATK manual, dash, salto, joystick, cámara permanecen. Ninguna habilidad en pantalla debería interceptar otro pointerId.
- Contrato puro implementado en `tests/r32/hud_contract.mjs` y verificado por `tests/r32/hud_contract.test.mjs`. **Aún NO conectado al DOM ni al Sim**. Los IDs de desbloqueo de entrada requieren autenticación por estado persistido servidor/Sim; esta función no valida recompensas.
- Visualización futura: sustitución real de constructor de HUD y `tick()`, CSS mobile de cuatro botones, migración de preferencias existentes **sin borrar** y QA de tap/drag/long press en S23.

## F. Gates y orden de ejecución

1. **P0 diagnóstico (presente):** auditar archivos y ramas; crear rama aislada; fijar contrato HUD; pruebas unitarias livianas y workflow sin publicación.
2. **P0 ampliado requerido antes de P1:** ensamblar en entorno aislado el upstream congelado y overlays R20-R31; inspeccionar `casting_lifecycle.ts` completo; enumerar listeners y admisiones; mostrar trazas de reject y medir estado inicial.
3. **P1:** input router único y movimiento camera-relative. Gates: pointerIds independientes, multitouch, inversión, dash/salto y libertad tras cast.
4. **P2:** apuntado + Sim admission + cast lifecycle. Gates: cancelar=sin gastos, coste una vez, CD correcto, preview/hitbox coincidente, no autotarget sobre drag.
5. **P3:** Fireball/proyectil, dash ofensivo, salto con CC y AOE. Gates: daño/estado/animación/feedback/multitouch reales.
6. **P4:** cambiar el HUD real al contrato 4 BASE + hasta 3 ÚNICAS secretas y dos pasivas externas, preservar ajustes y grabación. Gates: Android landscape, no casilleros fantasma, ninguna revelación previa.
7. **P5:** laboratorio Guinevere recast/11 hits/bosses/performance, sin progresión real ni Pages público.

Métricas: FPS y p95 frametime, frame spikes, tiempo input-feedback, memoria cuando API accesible, geometrías/render calls, efectos vivos, duración y limpieza; metas 60 FPS y fallback 30 FPS sostenibles en S23 físico. No considerar emulación como prueba física.

## G. Evidencia, pruebas y pendientes

- R31 commit y run GREEN: `8e91c665`, `38957779088` (verificado GitHub API); R03 commit `26aa3f62` verificado. `main` no modificado.
- Las pruebas R32 P0 comprueban que no se exponen slots ÚNICOS antes de desbloqueo y que el límite BASE es cuatro. Ejecutar: `node --test tests/r32/hud_contract.test.mjs`.
- **No hay aún RUN R32 de ensamblado/TS/WebGL ni prueba S23 física.** No declarar HUD final, combate integrado ni optimizaciones certificadas.
- Próxima corrección prioritaria basada en código: sustituir las llamadas de creación periódica `ensureSpecialSeats/ensureGhostSkillSeats`, limitar vista `S1-S10` a cuatro y evitar que R17/R28/C1 registren múltiples gestos sobre los mismos controles. Primero instrumentar en assembly y separar modo gameplay de QA.
