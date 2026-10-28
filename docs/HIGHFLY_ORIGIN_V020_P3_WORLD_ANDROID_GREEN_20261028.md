# HIGHFLY ORIGIN 0.20 — P3 WORLD & ANDROID — GREEN

## Verificación real
- GitHub Actions: https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/40764495549
- Estado: SUCCESS (2026-10-28).
- Rama: `highfly-origin-v020-p3-world-android-smoke-20261028`
- Origen inmutable: World of ClaudeCraft `v0.20.0`, commit `4cedc7fbf49e7179f4c29b3db2d0b2bc5bab3d25`.
- P2 offline save/restore incluido y sometido a pruebas.
- P3 usa un arranque directo `?highfly_p3=1` **SOLO en el checkout CI**, nunca en builds públicas.

## Métricas del mundo real en CI
- Tres regiones: **Eastbrook Vale**, **Mirefen Marsh**, **Thornpeak Heights**.
- Datos de mundo: **66 campamentos**, **112 tipos de monstruos**, **25 NPC definidos**, **80 misiones**, **381 ítems definidos**, **13 edificios**.
- Dungeons en registro (6 entradas): `hollow_crypt`, `sunken_bastion`, `gravewyrm_sanctum`, `drowned_temple`, `nythraxis_crypt`, `nythraxis_boss_arena`. La última es arena de jefe interior, no sexto dungeon convencional independiente. Probar cada acceso real en Android sigue pendiente.
- Mundo instanciado e iniciado en navegador 915×412: **306 monstruos activos, 30 NPC activos, Draken nivel 1**.

## HUD Android horizontal
- Chromium headless con viewport **915×412**, dispositivo táctil, perfil Android (no hardware físico S23).
- Canvas visible 915×412.
- Joystick de movimiento: **100×100** en (20,297).
- Joystick de cámara: **100×100** en (795,297).
- Botones ataque (115×48), salto (54×48), usar (54×48) y menú (54×48) con dimensiones visibles y dentro del viewport.
- Bug detectado en CI (runs 40763359587 y 40764011502): raíz `#mobile-controls` calculaba `display:none` aunque `body.mobile-touch.game-active` estaba activo.
- Fix P3: **override CSS condicional exclusivamente para `body.mobile-touch.game-active #mobile-controls`**, inyectado por `patch_touch_hud.mjs`. No obliga a mostrar el HUD durante el inicio o en escritorio. Investigar posteriormente el conflicto original de cascada antes de limpieza definitiva.

## Guardado navegador end-to-end
- Ingresar al mapa real, agregar `healing_potion` al inventario del Sim, activar pagehide, cerrar pestaña, reabrir en el mismo contexto de navegador.
- Confirmación: tras reabrir el mundo, inventario restituido con **1 objeto**, datos persistidos correctamente.
- El guardado permanece local en el navegador. No hay aún copia externa, cloud sync ni migración a Hunter Universal.

## Tests realizados
- TypeScript; pruebas del mundo, Sim, guardado, dungeons, portales, persistencia de misiones, mobile controls; WebGL + HUD Chrome en paisaje; recarga y restauración; compilación original completa.

## NO CONFUNDIR con prueba de comercialización o release
- No hubo publicación en GitHub Pages, APK, ni subida de compilaciones/medios originales como artifacts.
- La instalación CI contiene medios CraftPix y otros recursos aún no autorizados: **prohibida su distribución pública por HIGHFLY**.
- Falta medir rendimiento en Samsung S23 Ultra real, comprobar controles con dedos simultáneos, entrar físicamente en todas las mazmorras, loot, combate, audio, caídas, respawn y ciclo de sesiones extensas.
- El laboratorio de 253 íconos propios se desarrolla en `highfly-origin-v020-art-catalog-253-20261028` en paralelo; no mezclar ramas hasta validación.

## Siguiente corte recomendado: P4 INPUT / COMBAT LAB
1. Mantener P3 como checkpoint de arranque/guardado del mundo.
2. Crear módulo de movimiento y input HIGHFLY aislado; comparar joystick diagonal, cámara derecha, ataque en carrera, salto/dash y multitáctil sin sustituir Sim ni niveles.
3. Implementar FURY 360 progresivamente con pruebas de hitboxes, animation/cancel windows, stun/CC, gasto HP/MP/Energía.
4. Reemplazar UI+iconos sólo desde pack original comercialmente aprobado antes de poner el mundo completo en Pages.
