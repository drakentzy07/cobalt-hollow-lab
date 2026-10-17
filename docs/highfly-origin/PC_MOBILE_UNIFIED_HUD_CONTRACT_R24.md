# HIGHFLY ORIGIN — R24 HUD UNIFICADO PC + ANDROID (CONTRATO)
Fecha: 2026-10-17
Estado: ESPECIFICACIÓN APROBADA POR USUARIO / PENDIENTE DE IMPLEMENTACIÓN Y PRUEBAS.
Base inmutable: R23 d78bb5e4e26de494230c6d6c01575b7c74566783 (GREEN).
P1 Hunter M/F (GREEN): Actions #39040153079 / commit 8b1e7af5e94bdaf5901c2913a7c6c26efd2eb908.
Rama de desarrollo: highfly-origin-r23-hunter-moba-p1-20261017
Regla de seguridad: NO MAIN / NO GITHUB PAGES / NO MIGRACIÓN DE GUARDADOS SIN PRUEBAS.

## Decisión visual
- PC y Android muestran el MISMO HUD de HIGHFLY ORIGIN (posiciones relativas, iconografía, estado y acciones). No volver al HUD MMO clásico solo por detectar mouse.
- HUD final Combat Core 2.0: cuatro habilidades BASE equipables visibles (1–4), ATK manual, SALTO, DASH, USAR, HP/MP/Stamina, consumibles y buffs separados.
- Hasta tres ÚNICAS secretas: NO se renderizan botones, slots ni candados antes de desbloquearse. Dos pasivas son internas y no ocupan HUD.
- El aspecto debe ser responsive: móvil 844×390 landscape, PC 1920×1080 y 2560×1440, y adaptar ultrawide sin estirar botones.
- Sustituir la representación del joystick en PC por una indicación discreta WASD en la misma región, o dejar limpia esa zona; no crear un joystick mouse-obligatorio. Los botones de combate siguen visibles y pulsables con mouse.

## Esquemas de entrada; misma autoridad de simulador
ANDROID S23: joystick analógico GOLDEN 360° relativo a cámara; cámara independiente con gesto derecho; multitouch; skills con drag/retícula/cancel; salto/doble salto/dash.
PC: W avanzar, A desplazamiento izquierdo, S retroceder, D desplazamiento derecho (A/D NO giran al personaje). Diagonales naturales. Mouse para orientar cámara, seleccionar enemigos, colocar y confirmar/descartar apuntado; atajos de habilidades 1–4, Space salto, dash e interacción mediante enlaces configurables que deben comprobarse contra asignaciones existentes.
- Separar modo visual de modo físico: clase de presentación HIGHFLY específica, SIN forzar body.mobile-touch ni setInterfaceMode('touch') en desktop, porque mobile_controls.setActive altera enrutamiento de touch/cámara, menús y chrome.
- Reutilizar un solo HUD + un solo simulador + una sola implementación de acciones; nunca crear dos sistemas de daño, cool-down, coste o guardado.
- No suprimir bind de teclado actual, ni interceptar teclas cuando el usuario escriba en chat, menús o campos de texto.
- Revisar la configuración donante Mouse Camera / WASD: por defecto A/D pueden ser 'turn', y 'attackMove' puede ocupar A; desactivar/reasignar conflicto SOLO en perfil HIGHFLY PC, sin modificar el perfil MMO legacy.
- Mantener selección/target mouse sin disparar un ATK adicional accidental desde un click al HUD o al terreno.

## Fases y aceptación
R24-A: auditar source HUD mobile action ring + desktop action bar + responsive CSS + keybinds. Inventariar overlays R23 y evitar reparenting de #actionbar o !important masivo (R32).
R24-B: render responsive de las mismas cuatro habilidades BASE y controles accesorios en ambas plataformas, estado/cooldowns compartido. Mantener R23 funcional por bandera opt-in.
R24-C: WASD cámara-relative libre y mouse cámara/aim; input contextual; no ataques dobles. Verificar toda combinación de W + skill, A/D diagonal, mouse + click, Space salto + dash.
R24-D: pruebas automáticas Chromium PC 1920×1080, 2560×1440 + Android 844×390, e integración real: no solapamientos, pointer hit-testing, slots secretos ausentes, HP/MP/Stamina, buffs, cargas, entrada M/F y guardados. Aceptación final Samsung S23 físico y PC.
- RUN solo en rama aislada, sin deploy ni permisos Pages, y preservar R23/P1 GREEN.

## Estado de implementación
Documento de contrato únicamente. NO marcar R24 como implementado/compilado/validado por el hecho de documentar esta decisión.
