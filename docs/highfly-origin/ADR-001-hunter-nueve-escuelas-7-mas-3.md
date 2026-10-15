# HIGHFLY ORIGIN — ADR-001: Hunter sin clase, nueve escuelas, HUD 7+3
**Estado:** APROBADA por diseño — 2026-10-15
**Alcance:** arquitectura futura. **NO es permiso para realizar una migración masiva ni publicar producción.**
**Base de comparación:** rama `highfly-origin-r0`, R17–R19. El TOP 36 es un *corpus de pruebas inicial*, no una lista definitiva de habilidades disponibles.

## Decisiones innegociables
1. Único Hunter persistente; nueve escuelas originales: Warrior, Paladin, Hunter, Rogue, Priest, Shaman, Mage, Warlock, Druid. No bloqueo permanente por escuela o clase inicial.
2. Aprendizaje transversal y biblioteca universal, con autorización del servidor; conservar abilities nativas y sus VFX/animaciones/mecánicas.
3. Equipamiento de batalla: **7 habilidades normales S1–S7** + **3 especiales E1–E3**. Estas 3 últimas solo admiten ÚNICAS/ÚNICAS MUTADAS y permanecen **vacías, inertes, bloqueadas** hasta su implementación real. No ocuparlas con normales ni inventar poderes.
4. Apoyo separado B1–B8 (distribución en dos filas sin tapar Salto, Evasión ni joystick). No equivale a buffs ilimitados. Definir simultaneidad, exclusiones, duración/cooldown y compatibilidad antes de ampliar.
5. Manual attack; combo nativo 1-2-3 y cuarto golpe **solo** con gema elemental compatible equipada; parry, dash, salto, usar y cámara/joystick GOLDEN no se modifican sin regresiones.
6. Recursos propios HP/maná/stamina del Hunter. Ningún texto de Rage/Energy/Focus puede contradecir el costo mostrado. **Cambiar pool no elimina requisitos distintos**: arma, objetivo, posición, mascotas, combos, invocaciones, especializaciones, devoción, cadáveres ni costes especiales. Adaptar uno por uno y con ensayos.
7. Progresión M0 Descubierta -> M1 Aprendiz -> M2 Practicante -> M3 Experto -> M4 Maestro -> M5 Legendario. Requiere acciones efectivas/maestros/desafíos, con controles antiexploit; no sube STR/AGI/VIT/PER/INT.
8. BASE -> EVOLUCIÓN -> MUTACIÓN -> ÚNICA -> ÚNICA MUTADA. Versiones originales siguen disponibles cuando sea coherente; no obligar todas a ser ÚNICAS; conservar 3 slots especiales exclusivos.
9. Builds de S1–S7 persistentes con cambio fuera de combate y validación de cooldown/equipo/estados. Ningún cambio de build debe permitir esquivar cooldowns o repetir buffs.
10. REUSE FIRST -> AUDITAR -> ADAPTAR -> EXTENDER -> TESTEAR -> CONGELAR. Jamás sobrescribir Pages público estable con una prueba. Conservar compatibilidad del personaje modular Rig_Medium, skeleton y sockets.

## Estado técnico observado
- `game/c1/highfly_origin_native_spellbook.ts`: el aprendizaje de técnicas distintas del carrier existe, **pero** la admisión base usa `abilitiesKnownAt(def.class,...)` y todavía hereda criterios de clase/escuela, spec, nivel y quest; el overlay R19 abre exclusivamente algunas especializaciones del corpus controlado.
- `game/c1/highfly_origin_r19_selection.ts`: 27 habilidades de combate + 9 buffs **de validación**, no catálogo completo. Mantener para QA, no usarlo como restricción permanente del diseño.
- `game/c1/highfly_origin_r17_hud.ts`: asigna S1–S10 y B1–B8 usando slots nativos 1..18. El apuntado captura eventos sobre el anillo móvil y deriva al Sim; aún requiere validar táctil real, AoE, autoselección, cancelación y conflicto con gestos nativos.
- `game/c1/highfly_origin_r18_loadout.ts`: editor de 10 combate + 8 apoyo; debe evolucionar a 7 normales, 3 especiales no asignables y banco B separado.
- `game/c1/highfly_origin_hunter_profile.ts`: `skillMastery` es un registro numérico V1 (0..1000), **no** una implementación de M0–M5 con validación de progreso. No reinterpretar ni migrar silenciosamente valores existentes.
- Las nueve clases originales deben conservar íntegro su funcionamiento, especialmente para personajes legacy. El `playerClass` interno de compatibilidad no debe eliminarse de golpe del motor.

## PRÓXIMO CAMBIO MÍNIMO: Fase 7+3 (sin maestrías nuevas)
**Orden estricto:**
A. Finalizar/verificar el RUN R19 existente y recuperar evidencia de fallos; no confundir RUN verde con prueba Android física.
B. Auditar 27 skills + 9 buffs: learned/known/cast, targeting mode, alcance, weapon requirement, level/spec, costo maná/stamina, cooldown, VFX, animación y efecto; mantener sin equipar los fallos.
C. Introducir una **proyección del HUD**: slots nativos 1..7 para `normal`; 8..10 reservados `special` vacíos/deshabilitados; slots 11..18 para `support`. No crear un segundo sistema de casting/persistencia. Actualizar editor, barra en pantalla, asignación, autoorden, test de taps/drag y normalizar labels visibles.
D. En la frontera autoritativa de colocación, impedir normales en 8..10, especiales en 1..7 y buffs en 1..10; un usuario no puede evadir estas reglas manipulando eventos cliente.
E. Migración **no destructiva**: leer configuraciones 10+8 previas, conservar los 10 IDs históricos en un respaldo/versionado reversible; proyectar únicamente los primeros siete compatibles sin pérdida silenciosa de S8–S10, preservar B1–B8, evitar sobrescribir una configuración antigua al cargar. Mantener guardados viejos y personaje legacy intactos.
F. Guardar y cargar una build; respetar estados de combate y cooldowns; no habilitar cambio de preset durante combate. Empezar con una única build editable si múltiples presets aún no pueden almacenarse sin riesgo.
G. Conservar combo 1-2-3, opcional 4 con gema, ataque básico manual, parry/dash/salto/usar y movimiento GOLDEN.
H. Certificar Android S23 Ultra horizontal + PC debug, incluyendo multitouch con joystick activo; mock/simulador no sustituye prueba física.
I. Publicar solo sidecar de prueba, `lab/origin-r20/` (o siguiente nombre disponible), sin sustituir R17/R19, raíz ni V15.2.

**No incluir en este cambio mínimo:** abrir las 200 técnicas sin auditoría, maestría M0–M5 activa, evoluciones, buffs ilimitados, estadísticas de entrenamiento alteradas, ÚNICAS falsas o reescritura de los VFX.

## Pruebas de aceptación del próximo RUN
- Un Hunter puede equipar siete técnicas **de distintas escuelas** ya aprendidas, cambiar entre ellas y quitarlas fácilmente con dos pulgares; persistencia real tras reinicio.
- La interfaz presenta S1–S7, E1–E3 reservados y banco B independiente; la lógica, el editor y la visual no discrepan.
- No se pueden asignar normales/buffs a E1–E3, ni ilegales por eventos cliente; cuatro apoyos o más no se convierten en stacking ilimitado; verificar grupos mutuamente excluyentes y cooldowns.
- Apuntado de objetivo único, área, autotarget opcional, cancelar sin cast, cooldown, sin double-fire; multitouch con joystick y cámara GOLDEN intactos.
- Ataque básico manual y combo elemental conservados; sin automatismos reintroducidos.
- Costos maná/stamina correctos; no confundir cambio de pool con eliminación de prerequisites.
- Guardados existentes íntegros, restores verificados, sin borrar S8–S10 previos (almacenados para migración reversible) ni progreso del Training Core.
- Todas las pruebas automáticas GREEN y luego aceptación humana en Android. Producción **NO DEPLOY**.

## Etapas siguientes (solo tras congelar 7+3)
1. Biblioteca universal y rutas de descubrimiento/entrenamiento por escuela.
2. M0–M5 con almacenamiento versionado, requisitos medibles y antiexploit.
3. Builds múltiples fuera de combate, con límites de cambios y reglas de cooldown.
4. BASE/EVO/MUTACIÓN y luego ÚNICA/ÚNICA MUTADA por contenido especial.
5. Extensión de targeting, VFX, animación y balance por armas, incl. nueve escuelas.
