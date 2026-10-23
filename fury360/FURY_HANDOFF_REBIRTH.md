# HIGHFLY REBIRTH ↔ FURY 360° — PAQUETE DE ENTREGA A LA APP JUGABLE
**Versión:** FURY F5 — Integración candidate-safe, 2026-10-22/23
**Origen:** `drakentzy07/cobalt-hollow-lab`, rama
`highfly-rebirth-fury360-engine-20261022`, carpeta `fury360/`.
**Destino:** el COMMIT EXACTO del HIGHFLY REBIRTH en el que el usuario
comprobó manualmente que puede crear/ingresar/visualizar el personaje.
No asumir que coincide con la vieja rama de overlays: verificarlo primero.

## Qué entrega FURY, sin tocar producción
- GOLDEN 360: reutiliza la proyección cámara-relativa histórica; no segundo motor.
- F3 físico: propuestas de ataque manual, ventanas de combo, buffer acotado,
  giro visual hacia blanco validado y señales de dash/doble salto aprobado.
- F1 apuntado: gesto arrastrar/mover/soltar/cancelar; dedo de skill separado
  del joystick y cámara, seguimiento de origen del personaje en movimiento.
- F1 previsualización: nueve formas en plano XZ (line/cone/circle/rectangle/
  triangle/leap/dash/target/self), desplazadas a la altura real del terreno.
- F2 overlay Three.js: tres drawables reutilizables, escena y cámara nativas;
  no render loop ni canvas extra.
- F4 skills: inventario dinámico de las NUEVE clases y sus listas conocidas;
  efectos y restricciones de clase no son reescritos.
- F5 bridge: `FuryRebirthAdapter` con funciones inyectables de la app.
- Stage seguro: `tools/stage_in_candidate.mjs` copia solo ocho módulos
  bajo `candidate/src/highfly/fury/`, tras simulación previa.
- Pruebas Node aisladas sin assets ni instalación de ClaudeCraft.

## CRÍTICO: separación entre intención, aceptación y daño
En ClaudeCraft v0.44.x la función nativa
`Sim.castAbilityAt(id, {x,z})` devuelve **void**, no confirma un impacto
ni que el recurso se haya consumido. Por eso la respuesta de skill FURY
`native-submitted` significa únicamente "se entregó el comando al host".
No mostrar efecto de impacto ni restar recursos desde FURY. Esperar
el resultado/cast/evento de Sim y usar el VFX nativo.

Lo mismo vale para ATK: `FuryPhysicalCombatTimeline.confirmNative(...,true)`
solo debe llamarse cuando una señal/función NATIVA confirme aceptación.
Si el handler actual `attackNearest()` no produce una confirmación fiable,
dejar el ATK original sin adapter hasta tener una señal real.
**No marcarlo aceptado porque una función que devuelve void fue invocada.**

## Pasos reproducibles para el otro chat
0. Localizar el commit jugable nuevo, preservarlo como base inmutable.
   Trabajar en rama NUEVA y separada de ese commit. No tocar main/Pages.
1. Obtener la carpeta FURY de este commit, sin mezclar los patches de REBIRTH
   que estén desactualizados, por ejemplo:
   ```sh
   git fetch origin highfly-rebirth-fury360-engine-20261022
   git restore --source origin/highfly-rebirth-fury360-engine-20261022 -- fury360/
   ```
2. Materializar el candidato funcional v0.44.7 en `candidate/` mediante
   la receta válida del otro chat (ya recuperó el ingreso). FURY no ofrece
   ninguna receta de publicación.
3. Simular el stage **sin escribir**:
   ```sh
   node fury360/tools/stage_in_candidate.mjs --candidate candidate
   ```
   La salida debe indicar `dry-run`, ocho archivos, CERO rutas protegidas.
4. Aplicar SOLO si se mantiene la versión jugable y se validó el dry-run:
   ```sh
   node fury360/tools/stage_in_candidate.mjs --candidate candidate --apply
   ```
   Solo quedan los módulos, **no se activan por sí solos**.
5. Crear un adaptador de cableado host en un archivo aparte, corto,
   revisable y protegido por feature flag `VITE_HIGHFLY_FURY360=1`.
   Probar FURY apagado antes de FURY encendido; no cambiar la ruta de ingreso.
6. Conectar la habilidad de área en primer lugar, utilizando el
   `world.known` nativo (`.def`) y los **mismos** canales de
   `hud.onHighflyAimGesture`, `GroundAimController`,
   `renderer.setGroundAimReticle` y `sim.castAbilityAt` existentes.
   Una sola rutina puede ser dueña del retículo activo.
   Revisar el `castSlot` nativo para asegurar que una liberación no duplique
   lanzamiento ni gasto de recursos.
7. Resolver rangos, LOS, distancia vertical, obstáculos, inmunidades y
   localización de impacto con `sim.groundAimPlacementPreview` y la fuente
   de autoridad de Sim; nunca confiar solo en el polígono renderizado.
8. Conectar ataques físicos y combos **solo** tras tener un evento de
   aceptación real de Sim. No reescribir su autoataque.
9. Conectar dash/doble salto exclusivamente como señales de animación
   después de la aprobación nativa de `player_motion.ts`. No inyectar
   otra velocidad ni teletransporte.
10. Ejecutar typecheck/Vitest de ClaudeCraft y gates de REBIRTH. Después
    probar manualmente en S23 Ultra: 9 clases, UI legible, multitouch,
    joystick/cámara, aimed skills, cancelación, ataques corriendo,
    combate aéreo solo donde el conjunto de reglas y animaciones lo permita.
11. NO desplegar desde FURY. La decisión y pipeline de publicación
    pertenecen al otro chat.

## Anclajes de código fuente realmente auditados
**ClaudeCraft/HIGHFLY donante:** rama
`highfly-origin-f263-collision-gesture-save-polish-20261020`
- `src/game/mobile_controls.ts`: mapHighflyJoystickVector, TouchOwnerLedger,
  setHighflyTouchVector, botones físicos.
- `src/game/input.ts`: highflyTouchVector, secuencias de jump/evade.
- `src/highfly/combat/freedom_360.ts`: resolveFreedom360.
- `src/sim/player_motion.ts`: highflyWorldX/Z, highflyJumpSeq,
  highflyEvadeSeq, highflyFlipDir; Sim gobierna colisiones.
- `src/ui/hud.ts`: `onHighflyAimGesture` con
  (phase, action, dx, dy) y `onMobileActionIntent`.
  `GroundAimController` usa `this.sim.castAbilityAt` y
  `this.sim.groundAimPlacementPreview`.
- `src/main.ts`: tramo del hook aiming y
  `renderer.setGroundAimReticle`.
- `src/sim/types.ts`: `AbilityDef` tiene `range`,
  `targetMode`, `selfCentered`, `castWhileMoving`,
  `effects`, `requiresTarget`, `targetType`.
- `src/sim/content/classes.ts`: nueve clases + listas nativas;
  no inyectar los ids de usuario como nuevas habilidades.
- `src/sim/sim.ts`: `castAbilityAt` retorna void.

**El proyecto base del otro chat puede haber cambiado de commit**:
re-auditar exactamente esos puntos en la versión jugable antes de editar.
Cualquier anchor ausente o modificado debe detener la integración,
no forzar sustituciones de archivos completos.

## Reglas duras
- NO tocar `main`, `Pages`, creador, GLB, guardados, Training o el repo
  abandonado GENESIS 0.45.
- NO usar `write('src/game/input.ts',oldInput)` del R2 histórico en
  una build nueva: reemplazaría trabajo posterior. Usar hooks finos.
- NO introducir un segundo motor de movimiento, segundo touch router,
  segundo ground-aim controller o segundo renderer.
- NO instalar NippleJS/XState/Rapier sin evidencia de necesidad; FURY
  actual no requiere dependencias adicionales.
- PRESERVAR todas las clases, 27 specs y habilidades nativas.
- Respetar castWhileMoving, ranged/melee, auto-attack nativo y recursos
  propios de cada clase (rage/mana/energy/focus en ClaudeCraft).
- NO establecer "GREEN Android" solo por los tests aislados de FURY.

## Prioridad de integración para la primera prueba jugable
(A) SOLO retícula de una habilidad de área de mundo `targetMode:'position'`
con radio nativo real y cancel; comparar preview con área efectiva.
(B) Mover joystick+apuntar sin girar cámara ni congelar al personaje.
(C) Dash y doble salto existentes: solo cue visual, no físicas nuevas.
(D) ATK manual, combo y recuperación sujetos a confirmación de Sim.
(E) Recorrer las nueve clases y comparar disparo/costes/rangos, dejando
los spells con objetivo fijo en su camino original.
Si falla (A), no ejecutar (B-E); preservar entrada funcional.

## Control de calidad previo al merge
- todos los contract tests FURY GREEN
- `npm run check:ts` del candidato sin errores
- `npm test` / pruebas de módulos afectados según receta del proyecto
- entrada y creador intactos / guardado intacto
- ni eventos duplicados ni doble consumo mana
- las nueve clases conservan repertorio y efecto
- 30+ eventos de cancel/release de skill con 2 dedos sin desync
- prueba S23, no solo desktop
- captura de FPS y memoria al apuntar y mover simultáneamente
- PR separado y revisión antes de merge; NO auto-merge

## Mensaje listo para pasar al otro chat
```
Guine, ya funciona el ingreso de HIGHFLY REBIRTH. Tenemos FURY 360°
desarrollado y auditado en la rama
highfly-rebirth-fury360-engine-20261022,
directorio fury360/, con pruebas automatizadas.
Leer primero fury360/FURY_HANDOFF_REBIRTH.md.
NO tocar el ingreso ni la pantalla de creación, los GLB, guardados
ni producción. Usar el commit EXACTO del REBIRTH que probamos en Android
como base. Crear una rama de integración nueva.
Copiar solo fury360/ y ejecutar su stage dry-run, luego --apply sobre
el candidato materializado.
Cablear el apuntado de una habilidad nativa ground AoE a través del
touch-router/HUD/GroundAimController/Sim existentes con feature flag
apagado por defecto, sin doble cast ni segundo renderer.
NO declarar impacto al obtener void de Sim.castAbilityAt.
Luego validar movimiento + aiming, 9 clases y combate físico.
Ejecutar primero pruebas de tipo y UI, no publicar hasta aprobar S23.
```
