# HIGHFLY ORIGIN — COMBAT RECOVERY R00
**Fecha:** 17/10/2026.  
**Estado:** contrato de organización / auditoría de regresiones; NO implementado.  
**Base congelada:** Android P3.5 GREEN fuente `bd2a72943cb6ab1f57f213806234c6e835b6ee82`, run `39067552938`; Pages P3.5 publicado en `/lab/origin-android-p35/`.  
**Dispositivo de aceptación:** Samsung S23 Ultra físico horizontal. No confundir Chrome emulado con validación física.

## Principio
NO ampliar sistemas hasta recuperar fidelidad física de ATK, estabilidad de Hunter M/F y único HUD. Preservar mundo ClaudeCraft, simulación autoritativa, GOLDEN joystick/cámara/doble salto/dash, contenido y guardados, sin construir un segundo motor ni entrar a Vercel. Los GREEN previos de pipeline pueden coexistir con bugs reproducidos: las pruebas estaban incompletas.

## Evidencia de video P3.5 17/10 ~18:21 (224 segundos)
- New Hunter: ventana "Da tus primeros pasos" y zona embarcadero; la selección mujer parece no corresponder al render visible. Falta comparar/identificar rig 3D real.
- Draken con contenido/tareas del tutorial anterior. Es un guardado diferente: NO mezclar sus condiciones de spawn con un personaje nuevo.
- Combat: usuario observa que ATK exige TARGET, no golpea al aire y a veces parece interactuar; hay aparente giro sin impacto.
- En ~189-221 s se ve "EDITAR BARRA DE ACCIÓN", Página 1/2, matriz por centro/arriba/derecha. No corresponde al inventario de 4 habilidades BASE que debe mostrar ORIGIN.
- No está demostrada la ejecución nativa de las habilidades de galería; S1 muestra retícula pequeña/lejana no coherente.
- Las 3 ÚNICAS siguen invisibles, correcto; buffs/pasivas arriba, correcto.
- Spawn new Hunter debía ser sin armas/equipo inicial y el video no lo certifica.

## C0 — Auditoría y congelación (sin cambios de juego)
1. Registrar propietarios exactos de cada acción en DOM: `mobile-action-attack`, `mobile-interact`, `mobile-target-cycle`, `mobile-action-ring`, `BarEditorWindow`, `hf-origin-trial`, R17-R23, C1, native tutorial/bootcamp.
2. Afirmar cuál de esos es fuente de verdad. Eliminar listeners/CSS duplicados SOLO tras probar quién despacha el evento real.
3. Medir con trazas de entrada→callback→Sim→resultado, tanto con lock manual como sin objetivo, con apuntado, con gem.
4. Separar test de creación nueva M/F, reanudación Draken y cambios de apariencia guardada.
5. Congelar movimiento GOLDEN: 360 camera-relative, multitouch, libre cámara, doble salto, dash y continuidad; cero modificaciones hasta que tests lo exijan.

## C1 — Identidad Hunter, inicio y estado
- Selección Hombre / Mujer conecta directamente con el modular efectivo del Hunter en escena, el retrato, las vistas de perfil y persistencia (verificación visual del cuerpo REAL, no solo `player.modularAppearance.gender`).
- Nuevo Hunter ORIGIN sin armas/escudo ni armadura de clase obligatoria. Respeta ropa básica visual si forma parte del modular; NO vaciar equipo del guardado existente.
- Los guardados anteriores, inclusive Draken, mantienen armas, inventario, lugar y misiones.
- Aclarar 2 sistemas distintos: `compulsoryTutorial` de Sim y UI `Da tus primeros pasos`/Barquero Odo. Decisión anterior: nueva entrada tipo isekai, directamente al mundo en uno de varios puntos SEGUROS auditados, tutorial opcional y omisible, sin ferry obligatorio. No sortear entre posiciones no validadas ni teletransportar legacy.
- No lanzar personaje tras misión/quest sin confirmación de que `worldReady` y modal gates están coherentes.

## C2 — PRIORIDAD P0: ATK libre y USAR separado, funcional
**Hallazgo auditado:** `highflyBasicAttack` en el overlay HIGHFLY exige `targetId` enemigo hostil; sin objetivo devuelve false antes de la animación. El publicador P3 corrigió `paintContextualAttack` (texto), no garantiza que `wireAttackButton`/Sim NO use interacción de contexto.
- ATK PRESIÓN=un único intento físico de ataque. Con `targetId=null`: ejecuta animación golpe 1/2/3 válida y feedback visual, NO daño ni objetivo forzado en ausencia de contacto.
- Si hay enemigo alcanzable delante: resolver soft-aim sin precisar botón TARGET; orientar de forma fluida SOLO según reglas de enfrentamiento, calcular hitbox real, un impacto/una reducción HP por intento confirmado. No cambiar manual lock adquirido por usuario.
- Si objetivo está detrás o fuera de rango, no teletransportar ni girar brusco; conservar ataque en vacío; ajuste del cuerpo con límites angulares medidos.
- ATK nunca se transforma en USAR ni ejecuta `onInteract`. USAR nunca ejecuta golpe.
- TEST nativo mínimo: 10 golpes sin enemigos, 5 contra objetivo sin lock, 5 con lock, 5 en carrera, ataque cerca de NPC y cofre sin interactuar, USAR junto a enemigo sin dañar. Rechazos de stamina/swingTimer identificados claramente.
- Combos 1→2→3 manuales con recuperación e input buffer; 4.º elemental si gema activa (sin gema, no crear ataque elemental fantasma). Test con/sin gem.
- No crear segundo `Sim` de combate; autoridad de daño/HP/cooldown en el juego ORIGINAL.

## C3 — HUD ORIGIN definitivo
- Joystick abajo izquierda, cámara derecha independiente.
- OBJETIVO arriba de ATK, ATK central y USAR debajo; conjunto apenas más abajo que P3.5 y sin colisiones.
- EXACTAMENTE **4 BASE visibles** en arco limpio del lado interior derecho. NO son cuatro botones que muestran subslots; son cuatro acciones equipables.
- Tres ÚNICAS SECRETAS totalmente invisibles antes de su descubrimiento; tras desbloqueo la interfaz revela el slot pertinente.
- Buffs activables y efectos pasivos en banda superior claramente diferenciados. Ningún AUX permanente.
- Retirar de ORIGIN la ventana nativa `EDITAR BARRA DE ACCIÓN` con Página 1/2 y 12 posiciones (sin borrar el controlador upstream): sustituir solo en modo ORIGIN por **EQUIPAR 4 BASE**. Se muestra el repertorio APRENDIDO/usable, filtros por las nueve escuelas y asignación/desequipar en 4 posiciones persistentes.
- Biblioteca de todas las skills se mantiene, pero no se equipan 10/18 para jugar. R17 18-slot y C1 ghost bar quedan internos/no visibles si aún requeridos.
- LAB de ensayo opt-in separado, sin otorgar aprendizaje permanente o alterar save. Seleccionar temporalmente cualquier habilidad preautorizada en un slot de prueba, registrar su uso real si existe adaptador/cast válido.

## C4 — Aim nativo, especies de acción y ensayos REALES
Fuente de verdad: las definiciones `ABILITIES`, los cast/collision handlers, y los datos de efecto/cooldown auténticos. Visual solamente sincronizado NO reemplaza daño.
- `fireball`: **LINEA estrecha** acorde con proyectil: dirección elegida, retícula que no flote/lejos, hit/range verificable. Nota: esta skill nativa tiene requiresTarget=true; para libre lanzamiento hay que adaptar el contrato al sistema de proyectil real, NO simular impacto inventado.
- `flamestrike`: círculo movible con radius=7, range=30, aoeDamage nativa.
- `meteor`: círculo radius=8, range=30, `groundAoE delayed`; caída real con retraso, verificar VFX/impacto.
- `rain_of_fire`: radio=7, duración=4 s, repetición nativa, recurso/cooldown.
- `heroic_leap`: `repositionToAim` + landingAoE radius=6, lanzamiento y aterrizaje visibles y autoritativos.
- `blink`: `blinkForward` 15yd, desplazamiento DIRECCIONAL auténtico; no confundir con dash físico GOLDEN. No fijar objetivo enemigo para blink.
- `dragons_breath`: native `empoweredCone` de carga escalable, semántica distinta de un cono cosmético. Evaluar posteriormente.
- `bladestorm`: AoE centrada en usuario que se mueve con él; no mostrar círculo distante.
- Matriz de QA: apuntado suelo mismo alcance/centro/radio, soltar/ejecutar, cancelar, VFX, coste, cooldown, colisión, animación, entorno con pendiente, multitouch cámara+joystick+aim, sin bugs Draken vs nuevo.
- No declarar “skills 100%” sólo porque la galería dibuja círculo. La galería y el juego real son pruebas distintas.

## C5 — Mundo/tutoría e interfaz
- Investigar separadamente barreras tutorial/isla y `nameplatePainter`. Bajar ruido de etiquetas sin ocultar objetivo fijado, peligro real, NPC/loot y HP informativa.
- El tutorial obligatorio se omite solo en nuevo Hunter; opcional en menú, guardados Draken mantienen progresión.
- Misiones y UI `Más` no tapan ATK/cámara.
- Entrenamiento físico Training Core y escuelas de habilidad no afectados.

## C6 — COMBAT FREEDOM 2.0 / siguientes prioridades
**Objetivo:** divertirse sin ninguna habilidad equipada. Golpes, desplazamientos, bloqueos/cancelaciones legales, ataques aéreos, salto→dash→ataque, ataque→esquiva→ataque, reutilizar 22 animaciones de KayKit modular Rig_Medium. Tras lograr este núcleo, integrar skills base y ÚNICAS al mismo sistema y pulir VFX.
- No rehacer estilo chibi, mapa ni monstruos durante reparación.
- Mantener HP/MP/Stamina, stats de entrenamiento y nivel 1–99.
- Maestría progresiva de 9 escuelas, repositorio de skills nativas y premium, bancos de prueba 77 candidatos (no asumir que 77 ya fueron certificados).
- Mobile Legends ÚNICAS de Guinevere, Nana, Dyrroth, etc., futuro después de cinemática/cancels/animaciones físicos; 3 slots ocultos.
- Mundo y contenido: monstruos 64 + 16 élites/capitanes, loot, 8 territorios, forja y profesiones, armaduras Skin Lab AUTO-FIT; separar backlogs.
- LIVING WORLD (NPCs dinámicos, rutinas, diálogo, eventos) **posterior** al núcleo de combate y a la integridad del mundo.

## QA que habilita otro deploy
- Nunca subir a Pages si cualquier paso falla.
- En emulador y Samsung físico: M vs F diferente en mesh y mismo sexo después de recargar; Hunter fresco desarmado; Draken intacto; ATK sin objetivo muestra animación; ATK al frente daña; ATK y USAR separados cerca NPC; cuatro habilidades elegidas y guardadas; ensayo meteor/leap; tutorial opcional; ausencia ghost HUD; FPS y multitouch GOLDEN.
- Evidencia por caso: log, screenshot o VIDEO antes/después y estado autorizado de Sim; botón visible sin acción no cuenta como verde.
- Tolerancia cero de acciones de UI que consuman el input de otra acción o transformen ATK en USAR.
- Publicación solamente en **nuevo** laboratorio Pages add-only, no sobrescribir /root, P2, P3, P3.5.
- Detección de diferencias: diffs del build de P3.5, no recablear por completo controladores probados.

**FASES DE TRABAJO: C0→C1/C2 (critical)→C3→C4→C5→C6, luego Living World.**  
**REUSE FIRST → AUDITAR → ADAPTAR → EXTENDER → TESTEAR → CONGELAR.**
