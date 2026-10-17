# HIGHFLY ORIGIN — P3 Clean HUD → P4 Combat Freedom 2.0

## Certificación vigente
- P2 Android run GREEN: #39053101969. No reinterpretar ese resultado como verificación física de S23.
- P3 rama separada: `highfly-origin-android-p3-clean-hud-four-base`; nunca escribir en Pages/main desde pruebas.
- Fuente upstream original y Training Core conservados. No crear clases obligatorias.

## Contrato visual P3 (Samsung S23 Ultra horizontal)
- Un solo joystick GOLDEN 360° y cámara multitouch independiente. No rehacer ni alterar motores de input.
- Un único grupo NATIVO de cuatro habilidades BASE a la derecha y ATK grande manual.
- USAR independiente y contextual, no reemplazar ATK con interacción.
- Salto + dash en franja inferior central; gema y consumibles accesibles.
- Retirar visualmente barras legacy S1–S10, ghost slots y ESP1/ESP2/ULT antes de desbloquearse.
- Buffs/escudos/curas de las escuelas se mantienen en su sistema nativo, accesibles en AUX plegable; nunca sobre puestos duplicados.
- Las pasivas no ocupan HUD de combate.
- Menú de entrenamiento "HUNTER · SKILLS": herramienta **provisoria de laboratorio**. No mostrar botón durante gameplay. Solo activar desde menús con URL explícita `?hf_android_p2=1&hf_android_p3=1&hf_lab=1`. Sin `hf_lab=1`, interfaz final de jugador sin laboratorio.
- R32 selección base deseada para pruebas: Fireball, Heroic Leap, Blink, Flamestrike. P3 inicial solo permite equipar las cuatro si el Sim las reconoce como aprendidas/admitidas. No asignar identidades incorrectas silenciosamente ni fingir que son ejecutables.
- No ocultar componentes con modales reales activos: mobile-window-open sigue con prioridad de seguridad.
- Guardados originales, clases original, misiones, equipo y Training Core no mutados.

## P3.3 — Trabajo posterior al primer GREEN
- El cartel Barquero Odo y los letreros enormes en el video pertenecen a otros dueños (tutorial/Proving Shore y `NameplatePainter`) diferentes del HUD C1. No ocultarlos con CSS sin corregir primero el estado/posicionamiento legítimo.
- Los Hunters recién creados con `compulsoryTutorial=false` comienzan sin ferry automático. Un guardado anterior en Proving Shore puede seguir allí: **no teletransportar ni borrar el save automáticamente**. Diseñar acción de salida/continuación del mundo libre explícita y testeable.
- Reducir aglomeración de nameplates con regla por objetivo, cercanía y amenaza; conservar barra del objetivo, advertencias de peligro y selección táctil. Probar contra 10+ maniquíes sin dañar UI de NPCs, recursos, loot ni otros jugadores.
- E2E para selector de pruebas `hf_lab=1`, cooldown y cast de cada habilidad elegida; no declarar 4/4 funcionales sin tests nativos reales.

## P4 — Combat Freedom 2.0, sin gráficos nuevos
- ATK 1→2→3: golpes manuales con confirmación real de hit, animaciones de movimiento existentes KayKit Rig_Medium, ventana de input buffer limitada, sin daño extra duplicado.
- 4.º golpe elemental solo si gema equipada. Sin gema, combo termina en 3 y permite volver a iniciar; no inventar magia al atacar desarmado.
- Permitir encadenar salto → dash → ataque, y ataque → dash → ataque, respetando stamina/MP y la autorización de Sim.
- Movimientos físicos sin habilidades: giro hacia ataque, estocadas, barridos o cambio de peso solo mediante clips/rangos auditados y VFX permitidos, no clon de otra licencia ni nuevo motor.
- Mantener cámara libre con el pulgar derecho, movimiento con el izquierdo y apuntado arrastrando desde cada habilidad; cancelar y reutilizar lock-on opcional. Nada de teletransporte de dash no autorizado.
- Automatización de pruebas: combo de toques, holding/tap, multitouch durante dash/cast, cooldown, recurso, daño 1-hit, hitbox, 30 FPS base simulada y visibilidad real S23. No declarar "Honor of Kings World" equivalencia técnica.
- 3 ÚNICAS ocultas antes de desbloquearse. Extenderlas después del P4 físico validado.

## Orden de implementación
P3.1 interfaz única y LAB oculto → P3.2 4 slots admitidos con selección de test → P3.3 tutorial/nameplates auditados → P3.4 Samsung real + Pages aislado → P4 movimiento-combo físico → skills encadenables.

REUSE FIRST → AUDITAR → ADAPTAR → EXTENDER → TESTEAR → CONGELAR.
