# HIGHFLY ORIGIN R1 — GATE DE INICIO DEL HUNTER ÚNICO
**Estado: AUDITORÍA TÉCNICA INICIADA, SIN MODIFICACIÓN DE CLASES.** 15/oct/2026.
**Base segura:** branch `highfly-origin-r0`, OR-1 P2 GREEN `5cad8d9017d7829540fdc13b262791ddc4f66eaa`, GitHub Actions #38758621409.
**No deploy**, no cambios a main ni a https://drakentzy07.github.io/cobalt-hollow-lab/.

## DECISIÓN CANÓNICA DEL JUEGO
1. **Un Hunter persistente** por partida (apariencia femenina/masculina, rig modular original). No clase inicial obligatoria, sin ocho clases bloqueadas; no confundir con la clase Hunter legacy de ClaudeCraft.
2. **Disciplinas aprendibles**: las bibliotecas Warrior / Paladin / Hunter / Rogue / Priest / Shaman / Mage / Warlock / Druid son fuentes reutilizables de habilidades y efectos, no nueve identidades o pantallas de clase para ORIGIN. Combinar combate físico y magia no implica enseñar gratis todos los hechizos.
3. **Origen de skills**: descubrimiento y dominio mediante libros, enemigos, misiones, entrenadores y logros. Preservar fuentes reales, animaciones, VFX, restricciones por arma, cooldown, target mode y server validation.
4. **Combate**: ataque manual, combo 1→2→3 (+4 SOLO con gema equipada), skills / dash intercalados, apuntado touch por tap/drag/release/cancel, prioridades de LOCK/smart target y S1–S10. Buffs y pasivas fuera de slots activos.
5. **Tres recursos**: HP, maná, stamina como especificación ORIGIN; durante migración ninguna resourceType legacy (rage/energy/focus/mana) se elimina sin haber mapeado todos los `AbilityDef.cost`, costes y efectos.
6. **Training Core aislado**: STR/AGI/VIT/PER/INT de entrenamiento real, equipo y skills no los incrementan; mantener nivel y méritos, profesiones, monstruos, drop, inventario, logros y progreso.
7. **Guardado seguro**: versionar nueva estructura ORIGIN opcional y migración explícita, sin borrar ni sobreescribir save de V15.2. Perfil Hunter persistente no puede mutar de vuelta a clase legacy por sync online.
8. **REUSE FIRST**: auditoría → adaptadores → tests → freeze → interacción Android real. No reescribir el motor, no fabricar daño, no migrar a Unity.

## AUDITORÍA REAL DEL UPSTREAM CONGELADO (SHA 9b57e49c...)
- `src/sim/types.ts`: `PlayerClass`, `ALL_CLASSES` (9), `ResourceType` ('rage'|'mana'|'energy'|'focus'). **Riesgo:** el tipo class aparece en protocolos y herramientas; no quitar la unión a ciegas.
- `src/sim/content/classes.ts`: `CLASSES: Record<PlayerClass, ClassDef>` define estadísticas, HP/maná, ítems/armas, `abilities`. `ABILITIES: Record<string, AbilityDef>` conserva las definiciones. `abilitiesKnownAt(cls,...)` parte de `CLASSES[cls].abilities` y grants de talentos. **Riesgo:** no basta cambiar UI; el servidor debe validar el libro de skills adquiridas.
- `src/sim/content/talents.ts`: `TALENTS: Record<PlayerClass, ClassTalents>`, `talentsFor(cls)`, specs; todavía no permite árbol Hunter libre. **Riesgo:** no dar atributos de entrenamiento desde talentos.
- `src/ui/class_details_data.ts`: `CLASS_DETAILS`, `SIGNATURE_ABILITIES`, `SPEC_CARD_INFO` por clase; selección heredada no debe existir en ORIGIN final.
- `src/ui/character_progression_view.ts`: panel consultando `sim.cfg.playerClass`, `talentsFor`, `classDisplayName`. Requiere UI ORIGIN propia, no retocar texto superficial.
- `src/sim/character_state.ts`: guardado JSONB con `talents?` y migraciones de contentRevision. Requiere campo `originHunter?` versionado y adaptador migración segura.
- `src/net/online.ts`, `server/game.ts`: vías de comando y autoridad del servidor; OR-1 P2 reutiliza `commandOutcome` para swing. Aprendizaje de skills debe persistirse en servidor y no permitirse por petición del navegador.

## EJECUCIÓN / GATES
**R1-0: Mapa de dependencias (siguiente etapa).** Análisis exhaustivo del selector, creación, persistencia y habilidades; snapshot de clases 9/9 y biblioteca de habilidades. Entrega inventario de rutas afectadas y criterios de migración.

**R1-1: OriginHunterProfile**. Añadir estructura de datos opcional propia `originHunter` con identidad, XP/rango y `learnedSkillIds`, `skillMastery`, `unlocks` (datos validados), compatible con viejas partidas. Sin cambio todavía a clases legacy.

**R1-2: Acceso a habilidades por aprendizaje**. Crear `originKnownAbilities` reutilizando `ABILITIES` nativas, servidor autoritativo, weapon/animation/VFX native, sin conceder skills por clase de ClaudeCraft. Tests de rechazo a habilidades no aprendidas.

**R1-3: Creador Hunter sin selección forzada**. UI y rig modular, onboarding/respawn/saves, migración y rollback sin tocar la ruta legacy. Smoke S23 landscape, alt preserved.

**R1-4: Resource bridge físico/mágico**. HP/MP/Stamina y coste real de skills; no mapping artificial de rage/energy/focus sin validación individual.

**R1-5: Árbol de habilidades+libros/mastery, equipar S1–S10 y buffs separados**, skills intercaladas con ATK y dash, estado persistido y contenido compatible.

**R1-6: Gates integrales**: TS, Vitest, 9/9 catálogo original en compatibilidad, PvE, progreso 1-99, save round-trip, humano Android y preview Pages aislado.

### Criterio para decir “CLASES RESETEADAS”
Un usuario nuevo crea un Hunter sin escoger clase; carga una partida del Hunter original sin pérdida; puede aprender y equipar por gameplay una habilidad física + una mágica y usarlas con la lógica original; habilidades no aprendidas se rechazan también en servidor; tres recursos tienen coste validado; no hay rutas de UI/nivel que restituyan una clase legacy; no aumenta ningún stat de entrenamiento sin sesión válida; build y smoke verdes.
