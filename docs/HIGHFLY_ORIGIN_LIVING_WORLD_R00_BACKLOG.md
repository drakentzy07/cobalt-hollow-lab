# HIGHFLY ORIGIN — LIVING WORLD R00
**Estado:** DISEÑO APROBADO PARA BACKLOG, NO IMPLEMENTADO. 17/10/2026.  
**Plataforma principal:** Android S23 Ultra horizontal, WebGL.  
**Base:** World of ClaudeCraft v0.44.0 congelada / HIGHFLY ORIGIN P3.5 GREEN.  
**Prioridad:** después de estabilizar P3.5 y Combat Freedom 2.0; NO mezclar la primera implementación con el combate ni con Pages.

## Visión
El Hunter aparece en un mundo de fantasía que sigue viviendo sin que el jugador tenga que interactuar con él. Los habitantes trabajan, descansan, patrullan, se cruzan, reaccionan al combate y recuerdan interacciones relevantes. Las decisiones del jugador provocan reacciones consistentes, sin exigir IA conversacional paga ni conectividad permanente.

## Auditoría de REUSE FIRST (ya presente en ClaudeCraft congelado)
- NPCs de roles funcionales y profesiones: `src/sim/npc_role.ts`.
- Interacción y crédito de misión asociado a NPC: `src/sim/quest_npc_interaction.ts`, `src/game/nearby_interaction.ts`.
- Diálogos / quests a través de las ventanas nativas HUD: `src/ui/hud/quest/quest_dialog_controller.ts`.
- Rutas/colliders preexistentes: `src/sim/pathfind.ts` (A* local de rango corto usado para Charge: **NO suponer que ya existe navegación global de aldeanos**).
- Caravanas vinculadas a misiones: `src/sim/world_quest_caravans.ts`.
- Se preservan el inventario, profesiones, quest tracker, reputación nativa si existe, NPC vendedores, diálogos y servicios.

## Modelo Living World mínimo futuro
- `NpcRoutineDef`: npcId, zoneId, anchors (home/work/market/tavern/patrol), local time windows, role, minDistanceToHunter, validRouteId, ambientAction, allowedEvents.
- `NpcAmbientState`: IDLE, WALKING, WORKING, TALKING, ALERTED, FLEEING, RETURNING. Transiciones deterministas con cooldown, sin azar fuera del Sim autoritativo.
- `NpcReaction`: greet once, notice Hunter near, turn head, step away, guard warns/approaches monster, shopkeeper returns to counter, low-frequency barks in Spanish. No caminar a través de muros o agua.
- `NpcMemoryLite`: últimos 8-16 hechos significativos vinculados al Hunter, con límites de almacenamiento y expiración. Nunca guardar transcripciones extensas ni datos sensibles. La memoria narrativa NO modifica las estadísticas por entrenamiento.
- `NpcDialogueGraph`: branching localized choice nodes, visible requirements, short replies, actions only through existing quest/shop/trade servers; no rewards de cliente y no habilidades gratis.
- `WorldAmbientEvent`: caravanas, vendedor itinerante, campesino que pide auxilio, guardia que patrulla, mercader que cierra su tienda, monstruo que ataca una aldea; no tocar monstruos LV99 ni bosses sin contenidos específicos.

## Piloto de bajo costo
Solo un pueblo o campamento existente del mundo nativo. Arrancar con **cinco perfiles**, ligados a NPC de verdad después de identificar sus IDs:
1. Herrero: permanece en la forja y reproduce trabajo/idle con clips existentes.
2. Comerciante: atiende, saluda, interactúa con inventario auténtico.
3. Guardia: recorre 2-4 puntos validados, reacciona a amenaza real.
4. Aldeano: desplazamientos cortos y dos interacciones de diálogo contextuales.
5. Viajero: llega/sale según horario y puede ofrecer un favor opcional ya definido por quest.

## Límites Android S23
- Solo actualizar IA ambiental compleja cerca del jugador; muy lejos, usar estado lógico agregado y actualizar menos veces.
- Presupuesto inicial: máximo 5 NPC de rutina cercanos en piloto y una sola ruta validada por NPC. La cota exacta de FPS se determina con profiling real; no afirmar 60 FPS hasta medir.
- Animaciones existentes del modular KayKit: **auditar clips compatibles**, no atribuir acciones inexistentes.
- LOD/culling, meshes y nameplates nativos permanecen. Dormir estado del NPC si está fuera de alcance y reactivarlo sin saltos visibles.
- La interacción debe permanecer táctil por botón **USAR** (abajo a la derecha, independiente de ATK) respetando prioridad de objetivo y rango.
- Sin LLM pagado, sin streaming externo, sin llamados recurrentes a APIs. Textos y árboles de decisión locales, contenido multi-idioma reutilizable.
- Las decisiones sociales no condicionan el combate PvE por ahora, para no crear guardados incompatibles.

## Gating y seguridad
- Feature flag aislada `hf_living_world=1` durante ensayo; fuera de producción si está rojo.
- No mover ni borrar NPC de misiones esenciales; al activarse la interacción, NPC mantiene posición y quest/service sigue disponible.
- Online: autoridad server/Sim para consecuencias y eventos; offline: determinismo y persistencia mínimas.
- Sin progreso permanente hasta que se prueben save/load, idempotencia y sincronización.
- Controles de entrada siguen GOLDEN, cámara independiente; no tocar P3.5 ni P4.
- Batería, multitouch, FPS medido, colisiones, NPCs repetidos, conversación interrumpida por combate, teleport y reinicio del juego como casos QA obligatorios.

## Orden recomendado
1. P3.5 Pages separado y prueba física (TARGET arriba, ATK centro, USAR debajo, buffs arriba, cuatro apuntados).
2. P3.8 limpieza del Barquero Odo y nameplates/etiquetas de enemigos, con pruebas de guardados anteriores.
3. P4 Combat Freedom 2.0: golpes físicos 1→2→3 y cuarto elemental condicionado por gema, continuidad ATK↔dash↔salto, colisiones nativas y recurso real.
4. LIVING WORLD R01: piloto offline de 5 NPC con rutinas locales y saludo/evento; video S23.
5. LIVING WORLD R02: diálogos ramificados y memoria narrativa limitada.
6. LIVING WORLD R03: reacciones a amenazas y eventos emergentes, manteniendo performance.

**Regla:** REUSE FIRST → AUDITAR → ADAPTAR → EXTENDER → TESTEAR → CONGELAR.

No se han añadido nuevas acciones nativas, rutinas de NPC, IA o prompts externos mediante este documento. Diseño aislado para implementación futura.
