# HIGHFLY ORIGIN R0 — Contrato de combate y control direccional
**Base congelada:** `highfly-v15-foundation` @ `b5f04a26ca872b495626825835859273a0776e0c`.
**Objetivo inmediato:** OR-0 + diagnóstico OR-1. No sustituir motor, HUD GOLDEN, guardados ni entrenamiento. Sin deploy automático.

## Prioridad 0 — Combate manual
- ATK solo por intención explícita; un toque no habilita modo repetitivo ni emite dos solicitudes.
- Una habilidad, un objetivo soft/LOCK, salto, dash, parry o interacción no genera ATK por sí mismo.
- 1→2→3 manual, con 4 elemental exclusivamente si el simulador certifica gema y estado.
- Diferenciar solicitud, envío online, aceptación del servidor, swing, impacto real y resultado visual. El `true` de `ClientWorld.highflyBasicAttack` es **enviado**, no **aceptado**.
- La cola de 200 ms de V9.1 proviene de un toque ATK válido; no debe dispararse tras otra acción incompatible ni sobrevivir al cambio de contexto. Vigilar timers y eventos touch duplicados.
- Preservar las habilidades originales de las nueve clases como biblioteca donante mientras se estudia Hunter universal.

## Nueva regla de encadenamiento (futura OR-1.2, tras estabilizar P0)
La secuencia permitida por diseño es `ATK1 → SKILL → ATK2 → DASH → SKILL → ATK3`, así como
`ATK1 → SKILL → ATK2 → SKILL → ATK3 → ATK4 elemental` cuando la gema lo habilite.
**No** se generan golpes implícitos y no se salta automáticamente al paso siguiente al pulsar SKILL o DASH.
Un movimiento intercalado mantiene el progreso del combo solo si está autorizado por su tabla de cancelación, alcance, recursos y ventana temporal. Una canalización incompatible o un fallo real del servidor puede cortarlo. Las ventanas deben admitir animaciones reales; no extender infinitamente el combo. El último golpe y los CC requieren autoridad del Sim/servidor.

## Prioridad inmediata siguiente — Apuntado tipo Mobile Legends, sin copiar assets
- **Skill en pulsación corta:** smart-cast a objetivo válido cuando el tipo de skill lo permita. Jamás atacar por adquisición automática de objetivo.
- **Skill mantener + arrastrar:** indicador visual de dirección o retícula de terreno, radio/rango y previsualización de área. **Soltar** confirma exactamente un cast; gesto explícito cancelar no lo confirma.
- **Dash/Evadir mantener + deslizar:** vector de 360° según la orientación de la cámara; dirección del gesto por encima de auto-target. Tap simple usa joystick si lo hay o dirección del Hunter/cámara según prueba de UX.
- Casos distintos: proyectiles lineales, conos, círculos de suelo, objetivos aliados, objetivo fijado, técnicas sin apuntado y habilidades canalizadas/cargadas nativas.
- Multi-touch: joystick izquierdo continuo + dedo de apuntado derecho + cámara libre en zonas no ocupadas. No apropiarse de eventos del segundo dedo.
- Alcance, costes y colisiones son validados en Sim y online, nunca solo en el indicador visual. No permitir dash a través de obstáculos.
- HUD actual S1–S10 y sector independiente de buffs permanecen intactos hasta aprobar QA.

## Pruebas de aceptación exigidas
1. Un ATK válido = a lo sumo un swing; sin pulsar ATK = cero swings básicos, con varios ticks.
2. ATK1, ATK2, ATK3, gema válida ATK4; sin gema denegado; expiración y golpe rechazado no avanzan.
3. Skill S1–S10 y charged hold nativo funcionan sin auto-ATK; no duplicados por `pointerdown/pointerup/click`.
4. ATK en buffer y luego Skill/Dash no genera golpe sorpresa; se registra cancelación o autorización explícita.
5. SKILL→ATK, ATK→SKILL→ATK, ATK→DASH→ATK, cadenas largas con timings y costos reales.
6. Drag skill/dash 8 direcciones+intermedias, liberar, cancelar, joystick/cámara multi-touch en Android y PC.
7. Conexión online: servidor verifica orden, recursos, cadencia, gema y posición; no confiar en “enviado”.
8. Mantener entrenamiento, guardados, monstruos/IA y movimiento GOLDEN.
**Estado:** decisiones de diseño firmes; la implementación y QA específicos se certificarán mediante RUNs posteriores, no se declaran completos por este documento.
