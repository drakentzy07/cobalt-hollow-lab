# HIGHFLY ORIGIN 0.20 — FURY 360° P4A GREEN — 2026-10-28

## Estado verificado
- Run: https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/40766979754
- Resultado: **SUCCESS**; rama `highfly-origin-v020-p4-fury360-analog-20261028`.
- Donante: `levy-street/world-of-claudecraft`, v0.20.0, commit `4cedc7fbf49e7179f4c29b3db2d0b2bc5bab3d25` (MIT para código, no licencia general de los recursos).
- Punto anterior conservado: **P3 GREEN** `highfly-origin-v020-p3-world-android-smoke-20261028`.
- Carpeta de implementación reproducible: `origins/v020/fury/`. El CI descarga source exacto, aplica overlays P2/P3/P4A y ejecuta pruebas. **No ha habido despliegue Pages ni publicación de los medios del juego.**

## Qué implementó P4A
1. Joystick continuo: entrada analógica polar, deadzone radial 0.12, potencia proporcional. Sin cuantización a 8 direcciones.
2. Dirección relativa a la cámara: `furyStickWorld` respeta la convención del simulador original (yaw=0, derecha en la pantalla = mundo -X). Test de los cuatro ejes, diagonal y giro a 90 grados.
3. Puente entre input táctil, `MoveInput.analogWorldX/Z`, `Sim.updatePlayerMovement` y facings.
4. La simulación aplica las mismas colisiones, terreno, pendientes, movimiento acuático, gravedad y salto; comportamiento tradicional WASD y entrada online quedan separados.
5. Joystick derecho: cámara libre mientras el izquierdo dirige al personaje. No imponemos seguimiento automático mientras el stick analógico está activo.
6. Compatibilidad con tests originales con dobles de Input anteriores a FURY; los métodos opcionales de entrada analógica no rompen el código viejo.

## Validaciones reales
- TypeScript y **7/7 archivos de tests** aprobados.
- P3: mundo con **3 regiones**, NPC/mobs visibles, HUD táctil 915×412 y `healing_potion` persistente tras cierre/reapertura.
- P4A: Chromium táctil Android-like 915×412, Draken recorrió **2.488 unidades** manteniendo joystick diagonal `{x: 0.44, y:-0.76}`.
- Se pulsó el botón **ATK** sin liberar el joystick; se siguió registrando entrada de movimiento.
- Mientras el izquierdo seguía activo, un segundo puntero de la cámara modificó su yaw de 0 a **-0.07936 rad** sin robar el primero.
- El test reconoce la cinemática original de entrada y no inyecta input mientras el propio juego tiene `suspendMovement=true`.
- Compilación completa `npm run build` superada.

## Limitaciones expresas
- Ataque en carrera: comprobada concurrencia de **input**, pero falta evaluar animación/VFX, ventanas de golpes, persecución de objetivos y sensación de combate real.
- Todavía **no implementados**: dash/rodar, doble salto/mortal direccional, combo ATK 1–2–3–4, ataques aéreos, 4 skills + 1 pasiva, skillshot/aim/cancel ni recursos HP/MP/Energía HIGHFLY.
- Prueba Chromium emulada, **no Samsung S23 Ultra real**; falta FPS, calor, latencia táctil, combos simultáneos y pruebas de 30 minutos.
- `P3 patch_touch_hud` es una corrección condicional de visualización del HUD, no diseño visual premium definitivo.
- El bundle original contiene **CraftPix y otros medios sin autorización de distribución independiente**; no publicar en Pages hasta integrar los reemplazos legales, auditoría de filtraciones y branding propio.

## Próxima ingeniería
**P4B movilidad/FURY Motion:** dash direccional/rodar con costo y cooldown de Energía, segundo salto + mortal en las cuatro direcciones, colisiones y altura/estado del personaje, con tests sobre geometría real.
**P4C Combat:** ataque básico manual mientras corre, golpes 1–2–3–4, cuarta finalizadora, ventanas de cancelación, combos y ataques en el aire.
**P4D Skills/Aim:** 4 slots, 1 pasiva, lanzamiento en movimiento, puntería física real, cancelar y VFX propios.
**P5:** Hunter universal y progreso vinculado a entrenamiento real mediante STR/AGI/VIT/PER/INT.
