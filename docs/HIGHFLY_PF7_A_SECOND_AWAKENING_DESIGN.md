# HIGHFLY — PF-7 A: SEGUNDO DESPERTAR Y ESPECIALIZACIONES
Status: DESIGN-ONLY, NOT IMPLEMENTED, NOT DEPLOYED
Parent: PF-6 F GREEN #333, commit 312fe2e67219415a73a56303fcbd3b0bd9f62273
Safety: PF-7 isolated branch, no Changes to CLEAN main, public Pages, Skill Lab or Skin Factory.

## Objetivo
El Hunter conserva UN solo personaje persistente. Su clase MAIN (Primer Despertar) es elegida al crear personaje; la HERITAGE no sustituye esa clase y habilita su propia identidad jugable. El Segundo Despertar posterior abre **especializaciones elegibles**, pero la **eleccion final es del jugador**. Ni la especializacion ni los talentos regalan STR/AGI/VIT/PER/INT: las mejoras del Core provienen de Awakening (base 50), nivel natural (1 por nivel a partir del 2, total +98 en LV99) y entrenamiento real demostrado. El rango no equivale a nivel.

## Clases de base — contrato ya acordado
| MAIN en creador | HERITAGE heredada | Slots activos MAIN | Slots activos HERITAGE |
|---|---|---:|---:|
| Warrior | Paladin | hasta 5 | hasta 5 |
| Rogue | Warlock | hasta 5 | hasta 5 |
| Mage | Shaman | hasta 5 | hasta 5 |
| Hunter | Druid | hasta 5 | hasta 5 |

- Pantalla creador: SOLO cuatro elecciones MAIN.
- Priest no vuelve como novena clase: reservado para futuras UNICAS.
- Inicio de barra: 1 MAIN + 1 HERITAGE; capacidad hasta 10 activas (5+5), dos filas para HUD movil a validar sin desplazar botones GOLDEN.
- Las armas visibles y los estilos de combate los decide equipamiento + clase, no se sustituyen silenciosamente al usar una skill.
- Las UNICAS desbloqueadas ocupan slots adicionales segun contrato separado; no contaminar estas primeras diez.

## Segundo Despertar — evidencia, nunca un atajo de nivel
El sistema de elegibilidad evaluara informacion de **una misma identidad de Hunter**, con fuentes persistidas y auditables:
1. Progreso de nivel y XP (autoridad del Sim, nivel real 1–99).
2. Rango F -> E -> D -> C -> B -> A -> S -> NACIONAL como cualificacion separada, sin convertir directamente XP a rango.
3. Maestria del estilo/arma, uso de habilidades y progreso de juego, con eventos verificables.
4. Trayectoria de entrenamiento real de STR/AGI/VIT/PER/INT, sin convertir ejercitarse en XP del juego.
5. Historia, misiones o pruebas del Segundo Despertar si son aprobadas en el diseño.

**NO SE HAN APROBADO UMBRALES NUMERICOS** de nivel, sesiones, maestria o rango para despertar. No inventarlos en gameplay ni hardcodear uno. El diseño propone una evaluacion configurable con mensajes visibles de: pendiente / elegible / completado.

El sistema puede sugerir mas de una especializacion compatible; debe informar requisitos y dejar decidir al jugador. No autoelegir segun el stat mayor. Respec y mutacion se regularan con reglas y costos separados, no habilitarlos implicitamente.

## Arquitectura deseada
```
Sim (LEVEL + XP) ───────────────┐
Rango (cualificacion) ──────────┤
Maestria/quests/combat ─────────┼─> Evaluador de elegibilidad PF-7
Training Core (solo lectura) ───┘             │
                                             ▼
                              Candidatos visibles y su evidencia
                                             │
                                ELECCION EXPLICITA DEL JUGADOR
                                             │
                             Segundo Despertar persistido (una vez)
                                             │
                  Skills MAIN / HERITAGE / futuras EVO, MUTACION, UNICAS
```
No cambiar la autoridad de XP, el wallet Training, classId de Primer Despertar ni el PvE del usuario por evaluar elegibilidad.

## Evolucion de habilidades
BASE -> EVO (identidad preservada) -> MUTACION (identidad transformada) -> UNICA -> UNICA MUTADA.
EVO y MUTACION siguen su arbol y requisitos; UNICA es una adquisicion separada, no el supuesto quinto nivel de toda skill. No todas las habilidades evolucionan.
Toda skill nueva debe reutilizar pipeline verificado: input/hotbar -> coste/cooldown/target -> cast/anim/motion -> hit/damage server authority -> VFX/SFX -> cooldown/save. Prohibidos proxy, efecto visual con daño ficticio y romper el sistema de armas.

## Lo que sigue antes de codificar especializaciones jugables
- PF-6 G: resolver brecha constatada: zona authored max LV20, aun si existen templates especiales con maxLevel 60. En LV28 un mob LV20 ya da XP 0. Aun no existen zonas LV21–99 para progresion normal. No declarar balance certificado.
- PF-6 H: beta aislada, save->close->reload y sesion humana Android.
- PF-7 A1: confirmar los requisitos concretos del Segundo Despertar, primera lista de especializaciones y sus skills, nivel/rango/mastery/Training como condiciones configurables; por ahora no activar desbloqueos.
- PF-7 A2: crear esquema tipado versionado, migraciones e idempotencia por slot. No permitir que guardar/restaurar Duplique nivel, stats, training o desbloqueos.
- PF-7 B: juego con cuatro MAIN reales, cada HERITAGE y hasta diez activas, validacion de personajes por clase, HUD touch y controls.
- PF-7 C: evolucion, mutacion y UNICAS en gates separados.

## Gates obligatorios
(1) Clase/HERITAGE inmutable, sin swapping entre personajes; (2) sin subida primaria de stats por skills; (3) XP + nivel autorizados solo por donor grantXp; (4) rank y clase no se infieren exclusivamente de nivel; (5) maestria no se copia entre slots; (6) elegibilidad independiente de la decision; (7) rechazo de eventos repetidos; (8) 10 skills sin conflictos touch; (9) guardado multi-slot sin fugas; (10) Android S23 horizontal + PC debug, frozen CLEAN + Pages intactos.

## Auditoria concreta PF-6 F #333
- Estado diagnostico: CONTENT_TIERS_INCOMPLETE (GREEN significa que el observatorio reporto el problema, no que lo resolvio).
- Zona de mayor nivel authored: 20.
- Template con mayor nivel maximo en catalogo: 60 (no equivale a zona 60 disponible).
- Primer nivel que vuelve grises a monstruos LV20: 28.
- XP total LV1->99: 14.800.600; estimacion SOLO de matanzas de enemigo mismo nivel sin quests: LV20 160, LV40 316, LV60 485, LV80 659, LV98 818.
- Por tanto contenido y ritmo requieren trabajo real. No crear monstruos proxy ni falso balance para cerrar un RUN.

No public deployment until real human testing and explicit promotion approval.
