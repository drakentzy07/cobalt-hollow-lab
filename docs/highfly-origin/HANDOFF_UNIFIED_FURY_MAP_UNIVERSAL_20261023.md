# HIGHFLY UNIFIED 01 × FURY 360° — HANDOFF PARA NUEVO CHAT
Fecha 23/10/2026. **Solicitud:** auditar a fondo la versión UNIFIED 01 contra la biblioteca FURY 360°, decidir qué integrar sin destruir lo ya probado, confirmar el editor de mapas, y migrar a Hunter universal libre de especializaciones obligatorias.

## Source of truth y protección
- **Versión jugable vigente:** https://drakentzy07.github.io/cobalt-hollow-lab/candidate/unified-01/ ; fuente exacta rama `highfly-origin-unified-app-lab99-20261020` SHA `2cec633c4e3b8de01adaef629ce9dbe4ab529c7c`.
- **Trabajo aislado:** `highfly-recovery-unified01-admin-s23-20261023`. Ya corrigió solo la política de giro hacia atrás (`highflyF263DirectionalFlip` usa `-turn` 360° y prueba de retorno a cero). [RUN 40001027611](https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/40001027611) SUCCESS typecheck+browser de guardados y modos, **SIN DESPLIEGUE** y **NO prueba física de S23**.
- **FURY fuente exacta:** `highfly-rebirth-fury360-engine-20261022` SHA `2383394ae32ff27e10b9568823b59932ab0640df` carpeta `fury360/`; leer primero `fury360/FURY_HANDOFF_REBIRTH.md`, `fury360/README.md`, `fury360/src/` y pruebas. [RUN FURY 39946825875](https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/39946825875) SUCCESS solo contratos aislados (no WebGL ni Android).
- **Donante mecánico F2.6.3:** `highfly-origin-f263-collision-gesture-save-polish-20261020` SHA `f32973afcfe0479d21270802972eb1a751aa48ca`; rama de recovery antigua `highfly-recovery-f263-universal-s23-20261023` solo para recuperar módulos específicos. **NO usarla como app principal.**
- **R39C2 opcional** `highfly-origin-r39c2-input-buffer-combo` SHA `0ca2f82473b87fbdffa2a7663677f79b73d9e8da`: masked animation + buffer 170ms para referencia, no merge masivo.
- **No tocar producción/main/Pages, UNIFIED candidato en vivo, Draken real, R11 o saves.** Trabajo con feature flags y compilaciones NO DEPLOY hasta que el usuario apruebe en S23 físico.

## Auditoría preliminar verificada
- UNIFIED/F2.7 conserva movimiento 360 camera-relative, apuntado F2.6, cancelación, combate ATK movimiento y aire, cuatro contactos 1→2→3→4 nativos, máscaras upper/lower, cuatro skills de prueba (Fireball, Sinister Strike, Blade Rush, Meteor). Tiene dos modos WORLD y LAB guardados aislados; LAB LV99 ajustable y WORLD Draken real.
- FURY aporta **nueve formas de preview** (`line/cone/circle/rectangle/triangle/leap/dash/target/self`), separación de punteros táctiles, superficie de dibujo Three reutilizable, geometría proyectada a terreno, registro de habilidades de nueve clases, selección de objetivo y timeline/buffer/cancel físico. **Es módulo de INTENCIONES**, no un motor físico/SIM/caster totalmente integrado. Sus tests no prueban daño, colisiones, animaciones GLB ni S23 real.
- FURY `Sim.castAbilityAt` entrega comando pero API `void` no garantiza cast ni impacto. Para ataques solo avanzar combo si el Sim confirma aceptación real; no doble cast ni doble consumo ni doble renderer/touch owner.
- La selección FURY nativa usa preferencia al enemigo de frente/cercano y lock válido; **prioridad menor HP configurable** aún pendiente de especificación/integración con reglas del Sim.
- UNIFIED tiene **Hunter único** con clase interna carrier `warrior`, nueve escuelas `ORIGIN_F1_SCHOOLS` en `src/highfly/origin/f1_core.ts`, panel Hunter especial `src/ui/talents_window.ts` (`isOriginHunter`), y bloqueos native/talentos todavía existentes. NO borrar indiscriminadamente las 27 especializaciones/clases del donor; solo retirar SU OBLIGATORIEDAD para el usuario e implementar dominio no excluyente por escuela.
- El **mortal hacia atrás** antes era `-.22*Math.sin(pi*u)` (pequeña inclinación). Fix staged en rama recovery para `-turn` 360°, con unit test, aún NO publicado.

## Editor de mapas: confirmado en código, no certificación en Pages
- `editor.html` apunta a `src/editor/main.ts`; Vite `rollupOptions.input.editor` incluye `editor.html`. Código de editor SPA en `src/editor/app.ts`, `src/editor/3d/viewport.ts`, `src/editor/toolbar.ts`, `src/editor/map_io.ts`, `src/editor/custom_map.ts`, `src/sim/map_doc.ts`.
- Herramientas reales: select/raise/lower/smooth/flatten/paint/water/place/blocker/camp/spawn/region/erase. Visor 2D + 3D con Sim/Renderer, colocar GLB (asset_browser), caminos, zonas, NPCs, colisiones y puntos de aparición. Almacenamiento local JSON, import/export y playtest offline. Guardar/publicar al servidor del juego original requiere su API autenticada; GitHub Pages es estático.
- Hay que probar concretamente si `/cobalt-hollow-lab/editor.html` carga con todos los assets y si `launchPlaytest()` devuelve al game correcto en Pages; usa ruta absoluta `/index.html`, que puede ser INCORRECTA bajo Pages. No asumir editor integrado al HUD/ADMIN ni que editar cambia automáticamente mundo persistente de HIGHFLY.
- El editor construye un `WorldContent` independiente partiendo de mapas originales; para integrar una zona nueva a UNIFIED hay que diseñar import autorizado de JSON en la app, revisar colisiones, spawn, save coordinates, performance Android y reversibilidad, sin reemplazar todo el terreno.

## Producto elegido
- Un **Hunter universal sin clases seleccionables ni especializaciones obligatorias**. Todas las escuelas y habilidades se aprenden por mérito, maestros/quests/práctica; no todas gratis desde spawn. Maestría por escuela = progreso acumulable sin bloquear otras escuelas. Armas y efectos pueden requerir equipamiento sensato, no una clase.
- HP, MP, EN; stats base STR/AGI/VIT/PER/INT solo crecen con entrenamiento validado; aventura nivel 1–99 desbloquea contenido, items mejoran atributos derivados. Objetivo de balance 70/30 entrenamiento/aventura, **no verificado como porcentaje efectivo**.
- ADMIN opcional en misma experiencia/Hunter y mundo, acceso visible solo en builds desarrollo, oculta en release. Probar LV1-99, equipos, habilidades, mobs y rutas mediante estado de laboratorio aislado o snapshot reversible; **nunca** aplicar grants/admin mutaciones al guardado real. En futuro online se requiere permiso servidor, no JS flag cliente.
- Corregir creador de UNIFIED: hoy el usuario reporta dos experiencias y escritura espejada. Uno solo canvas 3D/persona/nombre, entrada normal correcta. Evitar CSS de R16, comprobar en S23 horizontal.

## Entregables en el nuevo chat
1. Matriz precisa de módulos de UNIFIED vs FURY vs F2.6.3 vs R39, interfaces fuente, qué es funcional, duplicado, incompatible y salvable.
2. Auditoría de flujo end-to-end del input multitouch, apuntado y cancel (one pointer per control), ground shapes, selección enemigo, hit/damage/cooldown MP/EN, combo físico 1-4 + aéreo, saltos direccionales y movimiento-cast torso/piernas.
3. Auditoría de una fuente de autoridad Sim para nueve escuelas, sus 27 especializaciones nativas, equipment/skills gates, Training authority, UI/canvas/entrada/guardados.
4. Auditoría del editor de mapas: qué edita realmente, formatos, playtest, export, permisos, publicación, integración segura a mundo, limitaciones Pages y S23.
5. Plan de integración incremental y **primer RUN real aislado/no-deploy** solamente cuando una modificación mínima esté justificada, con criterios visuales Android: no declarar GREEN final por browser emulado.
6. Preguntar solo si falta una decisión de producto esencial. No repetir preguntas ya respondidas. Guardar avances en la rama recovery UNIFIED; sin tocar public/main ni duplicar laboratorios.
