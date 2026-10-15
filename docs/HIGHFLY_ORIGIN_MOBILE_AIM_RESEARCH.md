# HIGHFLY ORIGIN — Estudio del apuntado tipo Mobile Legends (OR-1.3 / futuro)
Estado: **INVESTIGACIÓN Y DISEÑO**, no implementado ni testeado en Android. Fecha: 15/oct/2026.

## A. Comportamientos del referente (fuentes externas, NO assets donantes)
- Advanced targeting / selección por categoría, Hero Lock y prioridades (más cercano, HP menor): ONE Esports, https://www.oneesports.id/mobile-legends/pengaturan-kontrol-mobile-legends/
- Tap + drag sobre habilidad para seleccionar manualmente objetivo: ONE Esports, mismo enlace.
- Cancel cast por zona de cancelación o arrastre fuera de un límite, y Camera Shift para disparos largos: ONE Esports, mismo enlace.
- Recomendaciones para no superponer Smart Targeting con Hero Lock, ruedas ajustables, Aim Panning y cancelación: ONE Esports (26/Mar/2025), https://www.oneesports.gg/mobile-legends/mobile-legends-33rd-sea-games/?nes_article=129
- Guía reciente (interpretar como opinión, no API del juego): https://bittopup.com/article/Mobile-Legends-Controls-Guide-2025-Pro-Settings-Setup

**Inspiración en la interacción, NO copiar nombres propios, héroes, UI, iconos, VFX ni código.** HIGHFLY adaptará controles originales.

## B. Arquitectura de apuntado HIGHFLY propuesta (no ejecutar durante OR-1 P1)
1. Intent `press(pointerId, skillId)`: reservar solamente indicador/pointer; no enviar daño ni skill hasta confirmación, salvo habilidades de tap inmediato.
2. `drag(pointerId, delta)`: dirección normalizada cámara-relativa, umbral mínimo, rango real según skill y tipo `targeted | directional | ground | cone | self | charge`.
3. `preview`: shape simple GPU friendly (línea, cono, círculo o salto), con clipping real de rango y posible bloqueo de línea de visión; no teleport/telemetría falsa.
4. `release(pointerId)`: un único cast explícito si la zona es válida y el gesto no está cancelado.
5. `cancel`: soltar en región cancelar, swipe fuera del aro configurado, pointercancel, perdida de foco o HUD editor → **cero casts**.
6. `tap`: quick-cast solo si la habilidad admite `smart`; prioridad `manual LOCK > dirección explícita > soft nearest/lowest HP > facing`. No autocompletar un ataque básico.
7. `aim panning`: opcional y solo rango largo, con retorno suave de cámara; sin secuestrar el dedo de cámara independiente.
8. `dash/evade`: vector de drag 360°, cámara-relativo; touch breve conserva la regla probada actual hasta certificar UX; servidor/Sim valida destino, stamina, obstáculos, inmunidades.
9. `charge`: coexistir con ClaudeCraft empowered holds (V15.2) en vez de anular pointerdown; máquina de estados `pressed → charging|aiming → released|canceled → committed`.
10. Joystick izquierdo y cámara derecha deben seguir con pointerId propio. El apuntado derecho no intercepta input del joystick ni mueve cámara en zona de skill.

## C. Tabla de compatibilidad esperada
| Tipo | Tap | Drag / previsualizar | Soltar | Cancelar |
|---|---|---|---|---|
| Corte físico | objetivo válido o frente | sector/frente si la skill lo permite | una activación | sin swing |
| Proyectil | smart target opcional | línea/trayectoria | proyectil único | sin proyectil |
| Cono o línea | dirección inicial de cámara | abanico/línea | un cast | sin cast |
| AoE suelo | centro near-target válido | círculo con alcance | AoE única | sin AoE |
| Cura | aliado fijado o propio según skill | selección explícita de aliado | una cura | sin cura |
| Charge native | conservar hold original | drag solo después de auditoría del empoweredHold | respetar release native | sin charge/cast |
| Dash/Evade | movimiento actual | flecha vector de desplazamiento | ejecutar movimiento validado | inmóvil/neutral |

## D. Riesgos y pruebas futuras
- Los eventos touch sintetizados en `game_c1_runtime.ts` y los powered holds de V15.2 compiten por `pointerdown`. No introducir otra captura con `preventDefault` indiscriminado.
- El Sim actual `castAbility(action.id)` no recibe, por defecto, un vector universal; localizar y reutilizar primero los controladores ya existentes de `GroundAimController`, `pad_target_pick` y retícula.
- Diferenciar objetivo enemigo, aliado, suelo, dash libre, skill sin blanco y cancelación de habilidades cargadas.
- No afirmar “funciona” hasta tener test unitario de proyección, E2E táctil Playwright S23 (doble dedo + cámara) y prueba HUMANA en Samsung S23 Ultra.
- Mantener sector de buffs separado, S1–S10 original y HUD editor personalizable.

## E. Orden de ejecución
OR-1 P1 guard de cola de ataques → OR-1 P2 autoridad y validación de combos → OR-1.2 intercalado ATK/Skill/Dash → OR-1.3 P0 prototipo de apuntado 1 skill y Dash en laboratorio opt-in → extender gradualmente por tipología → certificación Android. 
