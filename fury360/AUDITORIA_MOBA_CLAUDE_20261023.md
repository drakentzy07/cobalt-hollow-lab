# HIGHFLY FURY 360° — Auditoría MOBA + ClaudeCraft y arquitectura de skills
**Fecha:** 2026-10-23. **Estado:** auditoría de código, NO implementación ni certificación Android.
**Repositorios auditados:**
- REBIRTH jugable: [drakentzy07/HIGHFLY-REBIRTH](https://github.com/drakentzy07/HIGHFLY-REBIRTH), R11 `0c64f51fe2cfb79f92856989a9c4e1acc9e0e4d1`.
- REBIRTH laboratorio R12: `125f41ec79bcd1a4c64d9f63dc72c04394cf7002`.
- REBIRTH R13 recovery: [rama R13](https://github.com/drakentzy07/HIGHFLY-REBIRTH/tree/highfly-rebirth-r13-combat-recovery-20261023), `e4bdbe53f7b79508a7a81ea6c91e4eb56bddceb6`.
- FURY autónomo: [rama FURY](https://github.com/drakentzy07/cobalt-hollow-lab/tree/highfly-rebirth-fury360-engine-20261022), `64e94970c903aad6552930a68bd78673ca5c796f` — 41/41 contratos, NO jugabilidad validada.
- Donante histórico F2.6.3: [rama donante](https://github.com/drakentzy07/cobalt-hollow-lab/tree/highfly-origin-f263-collision-gesture-save-polish-20261020), fuente completa de ClaudeCraft + parches HIGHFLY. **No confundir esta rama con la candidata real REBIRTH.**

## Dictamen de arquitectura
**ClaudeCraft NO es un lastre completo.** El contenido y simulación son valiosos: habilidades, daños, efectos, mobs, aggro, cooldowns, equipo, estadísticas, progresión, hit tables, estados, LoS, persistencia.
**Sí restringe la sensación de combate** al reutilizar UX y puertas de casteo de un MMORPG clásico. Debemos crear una capa FURY de ejecución/targeting/animación y puentes concretos en la simulación. No basta un HUD nuevo ni cambiar `castTime` de todas las skills.

### Evidencia exacta encontrada
1. Donante [`src/sim/combat/cast_move_gate.ts`](https://github.com/drakentzy07/cobalt-hollow-lab/blob/highfly-origin-f263-collision-gesture-save-polish-20261020/src/sim/combat/cast_move_gate.ts) implementa `abilityCastSurvivesMovement`. Solo autoriza movilidad en cast cuando def/resolved, aura o talento lo permiten. [`player_motion.ts`](https://github.com/drakentzy07/cobalt-hollow-lab/blob/highfly-origin-f263-collision-gesture-save-polish-20261020/src/sim/player_motion.ts) cancela cast en movimiento si no hay permiso.
2. [`src/sim/combat/casting_lifecycle.ts`](https://github.com/drakentzy07/cobalt-hollow-lab/blob/highfly-origin-f263-collision-gesture-save-polish-20261020/src/sim/combat/casting_lifecycle.ts) rechaza la pulsación mientras se mueve para canales/timed casts; calcula `castTime` desde resuelto y activa GCD. `src/sim/types.ts` define GCD base 1.5 segundos, mínimo bajo haste 0.75; el donante tiene una rama `highflyF26CombatFreedom` GCD 0.8 s. **No asumir que ese flag está activo en R13.**
3. Donante [`src/sim/combat/auto_attack.ts`](https://github.com/drakentzy07/cobalt-hollow-lab/blob/highfly-origin-f263-collision-gesture-save-polish-20261020/src/sim/combat/auto_attack.ts) ya incluye `highflyBasicAttack(ctx, step 1|2|3|4)`: ataque manual único, best target hostil alcanzable o swing vacío, choque real, swing rango/cuerpo-a-cuerpo, variantes aéreas, evento de animación para whiff. **ESTA función NO está confirmada como parte del candidato REBIRTH R13.** Auditar su portabilidad y dependencias, no copiar el archivo completo.
4. [`R13 recovery.py`](https://github.com/drakentzy07/HIGHFLY-REBIRTH/blob/highfly-rebirth-r13-combat-recovery-20261023/scripts/highfly_rebirth_r13_recovery.py) crea un `Sim.highflyManualAttack(targetId)` distinto: necesita target hostil, activa brevemente `autoAttack=true` para llamar `tryPlayerSwingImpl`, luego apaga. Tiene `p.castingAbility` en guard y no ofrece whiff. **Esto explica funcionalmente por qué sin objetivo ATK no ejecuta golpe**; no afirma por sí solo que sea la única causa de la inmovilidad.
5. R13 [`highfly_rebirth_r13_aim.py`](https://github.com/drakentzy07/HIGHFLY-REBIRTH/blob/highfly-rebirth-r13-combat-recovery-20261023/scripts/highfly_rebirth_r13_aim.py) adapta solo `targetMode:'position'` desde el radial al `FuryRebirthAdapter` y al retículo nativo. El resto de skills NO está migrado. `Sim.castAbilityAt()` retorna void, por lo que `native-submitted` no implica daño.
6. R12 [`highfly_rebirth_r12_camera.py`](https://github.com/drakentzy07/HIGHFLY-REBIRTH/blob/highfly-rebirth-r13-combat-recovery-20261023/scripts/highfly_rebirth_r12_camera.py) evita el follow yaw solo si `hf-rebirth-r2` y `input.isHighflyMobileCameraDecoupled()`. Se requiere test instrumentado verificando joystick izquierdo mueve player.pos pero NO camYaw.
7. `GroundAimController` nativo ofrece `clampAimToRange`, `withinMinRange` y `projectPlacement`. El preview se debe derivar de **la misma autoridad que resolverá el cast** (incluyendo Heroic Leap y ajustes por terreno). Referencia: [`src/ui/hud/action_bar/ground_aim_controller.ts`](https://github.com/drakentzy07/cobalt-hollow-lab/blob/highfly-origin-f263-collision-gesture-save-polish-20261020/src/ui/hud/action_bar/ground_aim_controller.ts).
8. Latest R13 CI en [RUN 39940479613](https://github.com/drakentzy07/HIGHFLY-REBIRTH/actions/runs/39940479613) termina **ROJO** por `R12_DASH_BUTTON_NOT_BOUND_TO_NATIVE_EVADE`; un GREEN anterior del mismo branch no convierte la versión actual en aprobada. Resolver antes de integrar skills masivas.

## Referencias externas verificadas
| Proyecto | Evidencia del código | Qué trasladar | Qué NO trasladar | Licencia |
|---|---|---|---|---|
| [Tencent HoK Environment](https://github.com/tencent-ailab/hok_env) | API/simulador de combate AI, acciones y restricciones | separación acciones válidas vs observación/resultado | NO acceso al código cliente de cámara, joystick ni skill renderer; no integrar GameCore | SDK Apache 2.0; **GameCore licencia especial solo AI/ML** |
| [UNION Mobile MOBA](https://github.com/tammukul/UNION-OpenSource-MOBA) | `Project/Assets/Scripts/General/InputManager.cs` asigna dedos left/right por finger ID; `MovementManager.cs` usa izquierda para mover, derecha para rotación/disparo; `ShooterManager.cs` tiene fire cadence + pooling | multi-touch exclusivo, lifecycle de finger id, cadence/pooling | no traer Unity, Photon, PlayFab, sus gameobjects ni movimiento 2D del MOBA | Apache 2.0, con avisos y licencias de subdependencias |
| [TPP/Orbit Three.js](https://github.com/SahilK-027/TPP-Orbit-Camera-Controller) | cámara TPP vs órbita, interpolación, input touch; `UIController`, `Camera.class.js` | seguimiento suave + separación cámara/manual | no reemplazar control nativo, no instalar teclado emulado del demo como input principal | MIT (preservar aviso) |
| [U.Moba-Prototype](https://github.com/NicoRuedaA/U.Moba-Prototype) | `AbilityData`, `AbilitySystem`, `TargetingManager`: targeting con previsualización, revalidar recursos/cooldown al ejecutar, efectos por comportamientos | arquitectura "data + executor + visualizer"; cast revalidate | Unity/C#; NO copiar código sin permiso/licencia clara; su retícula desktop no es el control S23 | no se encontró licencia explícita en raíz: referenciar conceptos |
| [vainhard](https://github.com/aadamsx/vainhard) | prototipo touch drag para ability | estudiar UX de gestos | Unity, tap-to-move y no tiene joystick GOLDEN; licencia no verificada | sin licencia explícita en raíz |

## Diseño recomendado: FURY Ability Execution Layer
La **misma skill** tiene cuatro bloques independientes:
1. `NativeAbilityRef`: ID nativo, class/spec/level, efectos, daño, heal, auras, cooldown, recurso, resistencias, procs, inventario — autoridad actual de Sim.
2. `FuryActivationProfile`: forma de disparo `tap/hold/charge/release/combo/channeled/passive`; movimiento `free/slow/root/conditional`; aire `allowed/blocked/airVariant`; política GCD/recovery/ventana de cancelación; dirigido/ground/auto/self/friendly.
3. `FuryPresentationProfile`: shape visible, trayectoria, telegraph color/height, animación compatible con el GLB, blend upper-body o full-body, VFX original/custom.
4. `FuryExecutionBridge`: revalida pertenencia, nivel, objetivo, rango, LOS, estado de control, recurso y CD ANTES de someter a Sim; retorno distingue `intent` / `submitted` / `accepted` / `hit` / `miss` / `blocked` / `cancelled`. Requiere eventos nativos, no inferir éxito desde funciones void.

**No hacer:** convertir todo a `castTime:0`; desactivar todo el GCD; convertir heals/summons/sap/stealth/stance en proyectiles; redefinir los daños dentro de FURY; hack global `player_motion` que mantenga canales no autorizados; forzar skills aéreas sin clips/transiciones ni reglas.

### Cómo migrar las nueve clases
`src/sim/content/classes.ts` del donante declara un total de **318 entradas en las listas base de habilidades de clase**:
- Warrior 40; Paladin 48; Hunter 27; Rogue 25; Priest 19; Shaman 24; Mage 49; Warlock 46; Druid 40.
Son **entradas de listas base** (incluyen pasivas, utilidades, especializaciones y otras funciones), NO 318 ataques ni prueba de que todas estén disponibles en nivel 1–20.
Pasar por `knownAbilities`/habilidades resueltas activas del personaje, no usar el total como habilidades disponibles.

Se necesita un auditor automatizado que cruce `CLASSES`, definiciones de `ABILITIES`, resolved ranks/effects, flags, status, resources, form gates y 27 specs. Para cada ID asignar `interaction`, `targeting`, `mobility`, `air`, `timing`, `animation`, `native validation`, `test matrix`. **Coverage 100% se declara recién cuando todas las definiciones realmente obtenibles están clasificadas, no por un test con nueve ejemplos.**

Taxonomía prioritaria:
- **Melee/auto physical**: manual hit/whiff; 1-2-3-4 con confirmación real y cooldown propio. Probar sin target, corriendo y en salto válido.
- **Projectile dirigido**: arcos, balas, Fireball, Shadow Bolt. Separar trayectoria visual, control de aim y daño; preservar target-lock para las skills nativas que lo exigen hasta incorporar un verdadero `freeProjectile` autorizado.
- **AOE/ground**: Meteor, Consecration, trampas; coordenada validada y preview EXACTO de radio/proyección.
- **Directional cone/line/trail**: sobrescribir solo forma de apuntado mientras el efecto esté respaldado por nativo; si no, crear **habilidad FURY nueva** con ejecución autoritativa.
- **Leap/charge/dash**: el Sim mueve/collisiona; el renderer muestra landing y animación. Nunca duplicar teleport.
- **Buff/passive/stance/summon/heal/CC/channeled**: conservar permisos nativos y UI especializada. Heals no auto-seleccionan enemigos. Channel tiene costos/ticks propios.
- **Airborne skills**: diseñar `airVariant` explícito cuando la skill y el rig lo permitan, no permitir el aire para todo automáticamente.
- **Rogue builders/spenders**: preservar `awardsCombo`, `spendsCombo`, stealth, behind, procs nativos. Combo visual de FURY NO sustituye puntos combo de rogue.

## Compatibilidad de movimiento y cámara
- JOYSTICK GOLDEN: una sola fuente de `highflyWorldX/Z` proyectada desde `camYaw`; cámara derecha se mueve por su propio pointer. Swipe de skill **NO toca cámara**. Ningún botón ATK activa USAR ni autoattack.
- Ataque corriendo: la locomoción Sim sigue activa; el cuerpo puede cambiar solo `facing`; la animación de upper body (si rig lo permite) se superpone a piernas. No aplicar root motion de clips a pos del player.
- Doble salto mortal adelante/atrás/laterales: solo después de la segunda autorización del estado nativo; dirección derivada del stick, no de cámara; bono de daño/combo solo mediante regla autoritativa HIGHFLY nueva, no por evento visual.
- Dash/roll: un solo evento native evade (pressFirst/pointerdown no deben duplicar). Resolver bug R13 primero.
- Parkour/árbol/trepa: módulo futuro separado tras colisiones y movilidad en suelo/aérea GREEN, no fingir capacidad ya instalada.

## Plan de ejecución con puertas
**P0 — recuperar integración estable (bloqueante):** resolver RUN R13 rojo Dash, guardar R11 inmutable, mejorar save y cámara sin tocar v0.44.7 fuera de overlay. Capturar métricas de pointerId, seq de dash, camYaw, movement pos.
**P1 — ataques básicos libres:** evaluar puerto pequeño `highflyBasicAttack` en candidato R13 mediante extracción de funciones, imports y prueba en Sim; no copiar `auto_attack.ts` completo. 1-4 manual, golpe vacío, cámara independiente, sin deslizar ni doble golpe.
**P2 — apuntado end-to-end:** activar retícula única FURY en skills native position; test de release/cancel, minRange, obstáculos, movilidad, no doble cast, resultado de hit.
**P3 — catálogo real 9 clases:** scanner CSV/JSON de TODAS las habilidades declaradas/resueltas. Primero 1 skill de cada categoría por clase, luego expansión masiva sin excepciones invisibles.
**P4 — nueva ejecución FURY:** implementar `FuryActivationProfile` y reglas compartidas native Sim + HUD/renderer; casting movement/air controlled por profile tanto en `casting_lifecycle` como `player_motion`. Native resource/CD/hit preserved. Validar con pruebas de autoridad.
**P5 — animación/combos:** upper body + legs, attack recovery/cancel windows, normalized GLB clip map, melee whiff/air/land; prueba real S23 30/60FPS y latencia input->animation/attack.
**P6 — skills HIGHFLY propias:** IDs namespace `hf_*`, registro en autoridad Sim, metadata, efectos, costos, cooldowns, permisos, VFX, herramientas de authoring y pruebas de regresión; convivencia con nueve clases.
**P7 — pruebas usuario:** toggles por perfil/skill, captura automatizada+manual de 1 dedo cámara, 2 dedos mover/apuntar, 3 dedos mover/apuntar/rotar si el layout lo permite. No merge a main ni deploy sin capturas S23.

## Calidad y riesgos
- Validar matrices `movimiento (quieto/corriendo/saltando/doble salto/dash)` × `aim (tap/drag/cancel/lock/no-target)` × `skills (9 clases × familias)`.
- `Preview` debe usar hit shape/range/impact radius/resolved level EFFECTIVE; nunca radio estimado; línea visible no implica daño real contra pared.
- Medir input->preview, preview->release, release->native submission, submission->damage, p95 y frames sin proporcionar falsas cifras base.
- Guardados y personajes nivel 1–20 REBIRTH no se migran al introducir perfiles de skills; datos FURY versionados externamente al save hasta tener schema de evolución.
- `HIGHFLY-REBIRTH/main` y R11 se mantienen inmutables; nuevas ramas sin auto-deploy. Feature-flag FURY apagado por defecto.

## Respuesta a '¿las skills de ClaudeCraft son un lastre?'
**Sí condicionan la fluidez si se reutiliza intacto el lifecycle MMO como autoridad también de UX/movimiento. No son un lastre como contenido/Sim.** Mantener identidad y efectos; mover la política de ejecución/targeting/animación al contrato FURY, coordinado con checks nativos. Crear skills propias en el mismo registro/Sim (no daño JS paralelo).

**Auditoría finalizada en código, no significa migración ejecutada.** Todos los diagnósticos se refieren a ramas/SHAs explícitos de arriba.
