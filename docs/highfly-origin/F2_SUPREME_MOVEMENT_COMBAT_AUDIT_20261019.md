# HIGHFLY ORIGIN — F2 SUPREME MOVEMENT & COMBAT AUDIT
**19 de octubre de 2026 | Fuente auditada:** `65de878512d8a8362fe54e663ab2b7f94b68183b` (F1.2)
**Tipo:** diseño y auditoría, SIN cambios en el motor. **Plataforma:** Samsung S23 Ultra horizontal; WebGL offline primero; futuro co-op 5–10.

## 0. Norte de diseño
Un solo Hunter persistente y universal, creado hombre/mujer. No elegir clase obligatoria; nueve escuelas internas sin bloquear el cuerpo ni el equipo. El combate desarmado DEBE ser profundo, atractivo y suficiente por sí solo. Combate con habilidades complementa el movimiento; no lo sustituye. Mundo/biomas, estética chibi-anime y rigs modulares ClaudeCraft se mantienen. No importar overlays experimentales R39/R40.

## 1. Hechos encontrados en el código nuevo (NO promesas)
- `src/sim/types.ts`: Sim determinista a 20 ticks/s (`DT=0.05`), velocidad clásica 7 yd/s; GCD legado 1.5 s. Lo viejo NO debe imponer su GCD a la cadencia action de F2.
- `src/sim/player_motion.ts`: único kernel reutilizable del Sim; movimiento con colisión swept/terreno, gravedad y salto, pendiente/agua, coyote time 0.15 s, control aéreo y **doble salto HIGHFLY por eventos de pulsación**, evasión `13 yd/s`, `0.18 s`, enfriamiento `0.55 s`. Reutilizar física; no teletransportar al esquivar.
- `src/sim/climb.ts`: subida a cornisa y escalada de borde simuladas; usa estado y trayectoria. `src/render/characters/visual.ts` mezcla poses de escalada porque el rig base no tiene clip específico. Wall-run diagonal y wall-kick son NUEVOS, no deben anunciarse implementados.
- `src/game/mobile_controls.ts`: joystick radial analógico; control táctil multi-pointer con ownership, swipe cámara y zoom por pinza; `src/game/input.ts`: eventos de doble salto y evasión.
- `src/render/self_motion.ts`: extrapolación/corrección visual reutiliza el kernel. No escribir un segundo motor de desplazamiento paralelo.
- `src/render/characters/modular.ts`: avatar modular KayKit compatible con Rig_Medium y partes de cuerpo/armadura; conservar skeleton, skins y animación. Revisar compatibilidad de los clips de pelea antes de introducir nuevos.
- `src/render/characters/anim_state.ts`: máquina de pose existente (locomoción, aire, agua, combate, cast y transiciones). F2 necesita una capa **ActionAnimationGraph** de ventanas y blends, sin reemplazar indiscriminadamente el mixer.
- `src/game/auto_target.ts`: soft-target con preferencia a enemigo cercano/al frente y sesgo pequeño por baja HP. No basta para ataque a dirección del stick sin objetivo ni para target-lock premium.
- `src/sim/combat/auto_attack.ts::highflyBasicAttack`: intención ATK manual 1–4 que aprovecha tablas nativas, pero exige target hostil y enfrenta el golpe hacia ese objetivo; actualmente no soporta por sí sola golpes libres al aire y ataques contextuales. La 4ª etapa elemental existe como puente legado. La auto-attack clásica convive en archivo: aislar toggle automático del nuevo modo.
- `src/ui/hud/action_bar/ground_aim_controller.ts` y `src/game/pad_ground_aim_wiring.ts`: targeting suelo con rango y colocación, retícula y proyección. Hay infraestructura real pero no 1 solución premium unificada para proyectil/línea/cono/salto/barrido/área.
- `src/sim/combat/cast_move_gate.ts`: restricción clásica de movimiento mientras castea salvo habilidades habilitadas; F2 precisa catálogo explícito de `castWhileMoving` y acciones seleccionadas con movilidad total.
- Combate y red separados en Sim/render; futura red autoritativa es posible, pero NO está completada en F1.2.

### Diagnóstico y riesgos
**Alta reutilización:** física/colisiones/doble salto/evasión/escalada/joystick y cámara/retícula básica/skeleton/daño del Sim.
**Adaptación principal:** mando 360 con facing/ataque direccional, animación y hitboxes, selección de objetivos, movimiento mientras ataca, timing y cast. 
**Construir nuevo:** gramática de acciones, cancel windows, buffers, ataques contextuales terrestres/aéreos, wall-run/wall-kick, cierre de combo, telegráficos premium, contrato future co-op.
**Riesgos:** Sim 20 Hz y animaciones a 60 fps necesitan ventanas discretizadas y presentación inmediata; evitar doble verdad del movimiento; carga de assets y caché Android; mantener equipamiento/capacidad modular entre género y armas.

## 2. F2 SUPREME — especificación objetivo detallada (NO implementada)

### A. Controles Android (prioridad máxima)
- Joystick izquierdo grande, zona flotante, deadzone radial calibrable, dirección 360° relativa al yaw de la cámara y velocidad proporcional al radio; táctil multitouch simultáneo.
- Cámara derecha libre con swipe, pinch zoom y botón recenter; no invierte control al girar la cámara; lock opcional y nunca obligatorio.
- Inferior central: auxiliares + SALTO/doble salto + DASH. Derecha: botón ATK grande, USAR debajo, OBJETIVO encima. Cuatro BASE 1–4 en arco creciente; TRES ÚNICAS totalmente invisibles hasta su revelación. Buffs/pasivas separados del combate. No botón bloquear/parry.
- Los dedos no se roban los punteros: stick + cámara + ataque/skill a la vez; cancelar apuntado por gesto/zona dedicada. Haptics solo opcional.

### B. Locomoción y parkour
- Estado de locomoción: idle/turn/walk/run/sprint/strafe/back/run-start/run-stop y frenada limpia. Sin slide artificial al atacar. Facing por intención de stick salvo soft lock contra hostil cercano.
- Salto real y doble salto con coyote time y jump buffer. Secuencias válidas salto→dash→segundo salto con control aéreo y cooldown honestos; no cadenas infinitas involuntarias.
- Dash/evasión swept con trayectoria visible real, línea/ghost de destino solo cuando sea útil; colisión contra paredes/enemigos, sin blink. Dodge durante combate, ataques de salida y contraataque tras evasión.
- Caída, aterrizaje suave/fuerte, recuperación, caída daño, obstáculos bajos/step-over, escalada de cornisa con poses; expansión posterior wall-run diagonal sobre superficies válidas, wall-kick/voltereta, trepa puntual. No pasar a través de mallas ni flotar.
- Movimiento continuo durante ataques y casts compatibles; aceleración y giro definidos por clase de acción, no congelación general.
- Agua y monturas del mundo original deben seguir sanas.

### C. Combat Freedom — el Hunter sin skills
- ATK manual como fuente única de intención: nunca reutilizar USAR ni habilitar auto-attack por defecto.
- Desarmado: jab/cross/elbow/kick/uppercut/spin/backhand y finishers visualmente distintos; no todos los golpes son iguales ni dependen de target. Con arma: one-hand/two-hand/dual/lanza/bastón con perfiles de alcance, arco, velocidad, combo y animaciones adaptadas.
- 3–5 pasos de ataques base + finalizador contextual; el cuarto elemental SOLO con gema activa. Combo no es una secuencia de teletransporte o cutscenes.
- Contextos: neutral, correr, sprint, dash, salto, descenso, aterrizaje, espalda del enemigo, persecución a distancia corta, enemigo derribado y ataque durante escape; algunos son variaciones automáticas de ATK, no nuevos botones.
- Ataques a dirección del joystick cuando no haya enemigo válido; golpes al aire animados sin daño inventado. Hostil cercano frontal permite soft lock y giro limitado natural (sin giro 180° instantáneo por enemigo fuera de pantalla).
- Combos lanzador→persecución→golpe aéreo→slam suelo, barrido→enemigo caído→remate; se conectan según hit-confirm y alcance, no con teletransporte.
- Evasión→ataque, dash→ataque, salto→ataque y ataque→dash como transiciones explícitas.
- NO bloqueo ni parry; sobrevivir por posicionamiento/esquiva, control de stamina, ventanas de evasión balanceadas.

### D. ActionGraph y ventanas
- ActionIntentQueue: pulsaciones de stick/ATK/JUMP/DASH/SKILL con timestamp/tick/sequence e histéresis. Buffer breve para anticipar el siguiente golpe sin spam doble.
- ActionGraph con `startup / active / recovery`, prioridad, condiciones de terreno/aire/recursos, `hitConfirm`, `whiff`, `chainWindow`, `cancelWindow`, reglas de interrupción y límites anti-loop. Una única fuente de verdad del estado del Hunter.
- Perfiles editables por arma y ataques desarmados. Los timings gobiernan tanto hitbox como animación, VFX, sonido y HUD.
- Cancels permitidos y coherentes: movimiento ligero, esquiva, salto, skill compatible, follow-up; sin cancelar animaciones/cooldowns en frames inválidos ni cancelarse eternamente.
- Interrupciones fuertes (stun/muerte/knockback) prevalecen. Root motion parcial/dirigido y motion warp acotado: jamás traslación instantánea ni penetración de collider.
- Sim de daño determinista, hitbox barrida en el espacio, LoS, alcance y arco real; **una aplicación de daño por objetivo por ataque/evento**, con impacto por contacto, i-frames de dodge SOLO calibrados y 0 daño si miss.
- AnimGraph ligero sobre KayKit existente; mezclar lower-body locomoción con upper-body golpe cuando rig lo permita, respetar clips y evitar clipping con arma.

### E. Sensación premium (sin exigir gráficos fotorrealistas)
- Anticipación de postura, impactos legibles, trail de arma, VFX de contacto mínimos, partículas eficientes, golpe crítico/vibración opcional, sonido en capas, reacción del enemigo, pantalla golpe/hit-stop exclusivamente visual; nunca congelar todo el Sim por hit-stop.
- Variar timing/amplitud según golpe; impedir deslizamiento bajo cuerpo mientras la animación corre.
- HUD comunica el contexto sin 10 botones: buffer/combo/hit confirm discreto, stamina real, cooldown por acción. Camera shake graduable/reducible en accesibilidad.
- Objetivo en móvil S23: aspiración 60 fps, degradación elegante a 30 fps estable en densidad extrema. Medir frame time CPU/GPU, memoria, primeras entradas y latencia; no prometer hasta probar físico.

### F. Targeting y Aim Premium
- Resolver de intenciones: (1) LOCK explícito si válido (2) hostil frontal cercano (3) hostil cercano en rango/área (4) dirección stick para golpes al aire. Sin target, ATK jamás se transforma en USAR.
- Soft aim con cono y radio acotados, prioridad frontal, stick y cámara; reacquire limitado. Ataques melee no giran ciegamente 180°.
- Aptitudes: proyectil/lineal (línea y flecha), cono, barrido, dash/charge trayecto, leap landing y AoE circular sobre suelo. Línea de apuntado gruesa y contrastada S23, no "circulito lejano".
- Presionar y arrastrar desde botón skill → previsualización en mundo → soltar confirma; arrastrar a zona cancelar anula. Emparejar geometría visual con resolución Sim y colliders; no imprimir rayos si meteorito apunta área.
- Cuatro BASE visibles, tres ÚNICAS secretas invisibles hasta desbloquear, sin locks aparentes; pasivas/buffs abajo/arriba sin ocupar slots según HUD aprobado.
- Nueve escuelas internas sin clase obligatoria; aprendizaje/progresión AFTER F2. HP/MP/Stamina, sin Ira/Energía paralelas.

### G. Compatibilidad futura co-op
- Misma acción válida offline y en realm: mensajes intent con tick/seq, validación de cooldown/stamina/rango/posiciones en servidor futuro; snapshot y reconciliación local con buena predicción.
- Un Hunter persistente por cuenta/guardado; inventario, armas, mentor NPC y creador versionados; daño y loot nunca autoritativos en navegador cuando exista co-op.
- Objetivo posterior 5–10 Hunters, sin party de personajes intercambiables. NO implementar servidor dentro de F2.

## 3. Orden de ejecución sin mezclar sistemas
**F2.0 READ ONLY:** congelar análisis, contratos de acción/rig y baseline S23 de F1.2.
**F2.1 Movement Input 360:** input/joystick/cámara/facing/multitouch + cámara libre, demostrable sin enemigo.
**F2.2 Body Physics:** doble salto, dash físico, movimiento continuo, cornisa, aterrizajes, parkour básico, calidad de control Android.
**F2.3 Combat Barehand:** ATK manual que golpea al aire en dirección del stick, 3–5 pasos, hitboxes nativas, objetivo cercano, animaciones.
**F2.4 Action Graph:** buffer, hit-confirm, recovery/cancel windows, ataques aéreos, sprint, evasión, lanzador y slam.
**F2.5 Premium Aim + HUD:** soft lock, retículas diferenciadas, drag-release-cancel, botón OBJETIVO y USAR separados.
**F2.6 Weapons + VFX + 4 BASE:** perfiles de arma y casta compatible, skill1 lineal Fireball, Meteorito AoE como tipo de apuntado (contenido skill posterior según gates), 4.º elemental por gema, slots ÚNICAS secretos.
**F2.7 S23 Playtest Gate:** 30–60 fps medidos, input lag, memoria, temperatura, accesibilidad, offline, regressions de creación/guardado.

## 4. Criterios GREEN no negociables
1. Spawn sin tutorial clásico, sin arma, creador hombre/mujer y guardado intactos en cada cambio.
2. 360° stick+cámara simultáneos con diagonales; cara y cuerpo sin inversión.
3. ATK da animación sin enemigo; con hostil cercano ataca al correcto en vez de USAR.
4. Dash atraviesa distancia mediante cada tick real y no salta paredes; saltos y dash encadenan sin duplicar acciones.
5. Castea y avanza cuando habilidad lo admite; no se desliza de forma artificial al atacar.
6. Lo que muestra retícula coincide con lo que golpea en Sim; Fireball línea, Meteorito área.
7. Animaciones Rig_Medium hombre/mujer sanas; sin bodypaint, huesos rotos ni pseudo teletransporte.
8. No auto-attack ni bloqueo/parry, sin slots secretos visibles, sin superponer joystick/HUD.
9. No regresiones de mundo, NPC de arma inicial, entrenamiento, inventario, combate PVE normal y guardado offline.
10. Cada RUN Android automatizado GREEN; aprobación visual/mecánica real S23 antes de congelar.

## 5. REGLA FUNDAMENTAL — COMBAT FLOW 360 (decisión del creador, 19/10/2026)
**La locomoción no debe bloquear el ataque ni el cast de forma arbitraria.** El Hunter debe poder atacar y lanzar las habilidades compatibles caminando, corriendo, en salto, doble salto, caída y tras una evasión, conservando input de stick/cámara. Queda PROHIBIDO el "ice-skating": personaje que se desplaza mientras corre una animación con pies estáticos o sin locomoción correspondiente. La continuidad jugable NO es permiso para animaciones físicamente imposibles.

### A. Arquitectura de capas; elegir por acción
1. **Locomotion layer**: feet/hips/gait driven by actual grounded speed, input heading, acceleration, vertical velocity and ground contact. Supports walk/run/sprint/strafe/turn/jump/fall/landing. Measured world displacement rules; do not infer gait from whether "ATK" is held.
2. **Action overlay upper-body**: one/two-arm attacks, swings, sword cuts and suitable spell casts. Apply bone masked/additive layers (when clips permit), maintain hip and leg gait continuously. Transitions and weapon props must remain coherent with KayKit Rig_Medium for male/female modular Hunter.
3. **Whole-body actions**: rolls, flips, uppercuts that plant the legs, jump slams, vaults and airborne kicks. Use full-body clips blended with a physics-controlled path; gait is SUPPRESSED during an actual roll/flip rather than visually marching in midair. Synchronize hip/body rotation and landing exactly with Sim contacts.
4. **Root-motion policy**: never add unbounded clip root translation to the Sim body. Prefer in-place/masked clips, controlled motion-warp for full-body only with swept collision; root orientation offset may drive cosmetic rotation but game facing is authoritative. No teleport/blink.
5. **Foot IK / contact**: foot lock, steps and turns grounded on terrain; speed-aware playback/stride synchronization, acceleration/deceleration blends, anti-foot-slide phase correction, no duplicate foot planting. Test slopes, stairs, dodging into walls and abrupt stick reversals. On mobile, fall back to cheap IK/pose adjustments at low FPS rather than allocating per-frame bone objects.

### B. Normal jump, DIRECTIONAL DOUBLE-JUMP FLIP and directional dodge ROLL
- **First jump = normal physically-based jump**.
- **Second jump = directional aerial somersault**, controlled by joystick intent at takeoff: forward -> forward flip, back -> backward flip, left/right -> lateral aerial/side flip, neutral -> safe controlled neutral twist or generic flip. Blend based on facing and camera-relative vector. Movement is physical; flip is visual, not force movement across walls. Maintain air steering and prepare land / cancel edges. On cramped scenery choose a safe non-clipping variant.
- **DASH/EVADE = physical travel + direction-aware cinematic roll or evasive step**. Forward roll, backward recovery, left/right roll or sidestep, diagonal blends. Roll keeps swept collision; use clip phase synced to distance, halt at obstruction without continuing phantom displacement; dodge i-frames short and controllable, not full animation-length immunity.
- **Exits**: roll -> stand-run, roll -> ATK, jump1 -> air ATK, jump2 flip -> air ATK, air ATK -> fall -> landing -> run/attack. Cancellation cannot teleport the rig into another pose; limb/hip stabilization and motion sync mandatory.
- **Preview target**: mobile S23 horizontal, one finger on stick and one on camera while ATK/skill/dodge/jump works; no frozen input due to casting except explicitly designed commitments with clearly communicated intent.

### C. Skill behavior contract, no "cast-and-slide"
- For every BASE/UNIQUE spell/action, declare `movementPolicy: 'free' | 'speedLimited' | 'committed'`, `airbornePolicy`, `rotationPolicy`, `animationLayer: 'upper' | 'full'`, `locomotionBlend`, `hitboxWindow`, `cancelWindows`, `groundContactRules`.
- **Default HIGHFLY new combat skill** = `movementPolicy:'free'` unless its physical choreography intentionally commits body motion; even committed abilities use swept physics and an explained anticipation/active/recovery, never freeze the player in place due to ClaudeCraft's generic cast restriction.
- **Fireball while running**: feet continue gait, shoulders and hands cast, recoil readable; actual projectile launches on active marker, not early. Running/diagonal camera movement unaffected.
- **Meteorito while moving**: target circle projected onto terrain and adjusted by drag; caster can walk/run; casting effect attached to hands/body, AoE impact resolves on chosen actual ground point.
- **Airborne shot/cast**: full-body pose only as needed for twist/kick, inertia persists; no feet running in air; landing interrupts/blends correctly.
- **Charge/leap**: own physical trajectory, no instant reposition; strike and landing events align with hitboxes and VFX. Player retains permitted steering.
- **No double movement**: if an action supplies physical thrust, do not ALSO apply inherited locomotion every tick on top of root translation. Choose single authority for every horizontal/vertical component.
- **Existing donor gate** `src/sim/combat/cast_move_gate.ts` currently allows motion only for `castWhileMoving` and selected exceptions. F2 must route ORIGIN actions through new explicit policy without changing donor behavior globally. Verify cancelCast calls in `src/sim/player_motion.ts` and world/physics tests.

### D. Fail conditions for the Android gate (non-negotiable)
- No idle legs while body visibly translates; no full run animation during flip/roll.
- No locked zero-velocity while ability marked `free`; no instant 180° rotations or stuck facing.
- No mismatched body translation/weapon hitbox; no damage from a disconnected trail or through wall.
- No ragdoll/T-pose transition on cancellation, knockback, jump/roll, weapon equip or hit reaction.
- No repeated unintended input when the screen has 2–3 fingers on different controls.
- Instrument actual speed, foot slip distance, layer weights, cancelled action tags, action-to-hit timing and time-to-input-resumption; require screenshots/video and real device review.

**Implementation priority:** install CombatFlow movement/animation contracts before dozens of new skill clips. This is the gate between F2.2 and F2.3. All future skills must satisfy it to be considered complete.

## 6. Referencias estudiadas y compatibilidad REAL del rig (no copiar código ajeno)
1. **KayKit Character Animations moderno** — https://kaylousberg.itch.io/kaykit-character-animations
   - Pack oficial CC0 con animaciones `Rig_Medium`/`Rig_Large`, movimiento, dodges, combate desarmado/armado y magia. **Candidato prioritario para ampliar clips**, auditando por nombre, skeleton, orientation, root transform y bind pose. No afirmar que un clip concreto está ya incluido sin enumerar el GLB real.
   - **ATENCIÓN: Legacy KayKit Animations** — https://kaylousberg.itch.io/kaykit-animations — tiene clips `Roll` y `Dash Front/Back/Left/Right` PERO especifica que son para los modelos ANTIGUOS *sin piernas*. No integrarlo directamente al Hunter actual; requiere retarget/rehacer y verificación, o mejor encontrar su equivalente Rig_Medium en el pack moderno.
2. **Three.js AnimationClip, AnimationMixer y keyframe tracks** — https://threejs.org/docs/pages/AnimationClip y https://threejs.org/manual/pages/animation-system.html
   - No existe un simple interruptor universal de "máscara de torso": preparar derivados de `AnimationClip` filtrando tracks de bones superiores según la jerarquía real, y/o crear overlays aditivos con referencia de pose correcta. Mantener mixer/skin existentes, no duplicarlos. La versión combinada no puede perder weights y caer en T-pose.
3. **Granblue Fantasy: Relink** — https://relink.granbluefantasy.jp/en/gameplay
   - Referente de combos con habilidades, economía de cuatro botones skill, link attacks, puesta en escena. Solo trasladar principios de respuesta/combos, NO party de cambio de personajes; un Hunter permanente.
4. **Wuthering Waves** — https://wutheringwaves.fandom.com/wiki/Basic_Attack
   - Ejemplos verificables de ofensivas aéreas, plunging attacks, counters tras evasión y recuperación de paso de combo; prototipar transiciones ATK normal → esquiva → ATK y salto→ATK→slam. No copiar animaciones propietarias ni permitir impulso/teletransporte por defecto.
5. **Punishing: Gray Raven** — https://punishing-gray-raven.fandom.com/wiki/Combat_Guide
   - Timing de evasión perfecta y recompensa visual. Adoptar de forma opcional ventana de evasión precisa y micro-slowdown EXCLUSIVAMENTE visual; sin parry ni botón bloqueo.
6. **DMC / spectacle fighters** — inspiración en mantener juggle aéreo/inputs contextualizados, NO prometer combo aéreo físico sin antes desarrollar hitboxes y trayectoria determinista.

### Prueba de rig ANTES de construir un mortal direccional
Inventariar clips cargados de `warrior_modular.glb` y otros `Rig_Medium`; verificar duración y tracks/bones, key poses, y compatibilidad hombre/mujer. Elegir por preferencia: (1) clip moderno KayKit Rig_Medium, (2) animación procedimental ligera / retarget validado, (3) nuevo clip authored compatible. Prototipar delante/atrás/izquierda/derecha sobre dummy con cámara y joystick activos. Un salto mortal solo se considera terminado si visual, collider, posición de suelo, muñecas/pies y fase de ataque convergen sin deslizamiento.

## 7. Decisiones para que revise el creador antes de iniciar F2
A. ¿Combo desarmado de 3 golpes + 1 remate contextual o 5 golpes básicos con remates variables? Propuesta: secuencias de 3–5, gobernadas por contexto, no número rígido.
B. ¿I-frames de evasión? Propuesta: cortos y explícitos, sin invulnerabilidad durante todo el dash.
C. ¿Wall-run/voltereta desde primera F2 o fase de parkour posterior? Propuesta: primero movimiento/golpes imprescindibles, parkour espectacular después de cerrar colisión.
D. ¿Ataque pesado cargado sin botón extra? Propuesta: sostener ATK, sin cambiar la distribución.
E. ¿Dodge con dirección libre y stamina? Propuesta: sí, cooldown corto y coste calibrable.
F. ¿Perfil de combate sin enemigos (sparring dummy) en laboratorio F2? Propuesta: sí, con telemetría de cancel/hitbox/facing.
G. ¿Gran HUD original ClaudeCraft visible durante F2? Propuesta: mantener solo datos sociales/menús que importen; interfaz HIGHFLY como única HUD del combate.

**Estado:** documento de auditoría y propuesta, NO implementación. Las capacidades marcadas como nuevas requieren RUNs y validación física.
