# HIGHFLY GOLDEN DEV1 — LV1–99 REAL CONTENT, REUSE-FIRST
**Fecha:** 2026-10-11 / 12 (Argentina) · **P15 primer parche** · **NO DEPLOY**.

## Decisión funcional
Conservar ClaudeCraft LV1–20 original, no declarar sus objetos de LV20 como techo
permanente. El progreso posterior no se logra simplemente escalando HP/damage:
cada tramo debe cerrar enemigo → drop/cobre → bolsa → material → maestro +
receta → estación + oficio → arma/armadura/consumible → combate → XP → guardado,
con movilidad y supervivencia de las nueve clases.

## Estructura de tramos
| Tramo Hunter | Reutilización y estado comprobado | Brechas reales |
|---|---|---|
| 1–9 | Donor original | Validar pacing, acceso, saves físicos |
| 10–19 | Donor + gemas elementales base | Comprobar materiales, clase y UI |
| 20 | Punto de transición donor, NO cap de HIGHFLY | Evitar techo de daño/loot |
| 21–29 | Primer portal HIGHFLY, variantes y recursos nativos | Equipamiento adecuado y loops naturales |
| 30–39 | 8 mobs + nuevo P15 arma 30 de 3 tracks | Armas tras prueba de forge; falta armadura, comida y balance |
| 40–49 | 8 mobs + nuevo P15 arma 40 de 3 tracks | Igual; economía/reagentes/cobre |
| 50–59 | P13 3 armas 50 | Armadura, drop natural y clase/economía |
| 60–69 | P13 3 armas 60 | Armadura, equipable, recetas/curación |
| 70–79 | P13 3 armas 70 | Armadura, equipable, gemas mejoradas |
| 80–89 | P13 3 armas 80 | Balance héroe y élite, pociones |
| 90–99 | P13 3 armas 90, 8 variantes normales y 2 élites/capitanes | Misiones / recompensas 99 propias y endgame, no solo renombrar gear 90 |

No afirmar que tener plantilla de monstruo o fórmula con reagente significa
que existe un camino natural jugador alcanzable.

## Este parche P15
**6 variaciones de arma** con modelos nativos: LV30+40 × espada Guerrero
(Warrior/Paladin/Shaman), daga Explorador (Hunter/Rogue), bastón Lanzador
(Priest/Mage/Warlock/Druid). Nada de nuevos GLB, animaciones, subclases,
segundo despertar, niveles automáticos o Training Stats ficticios.
- LV30: rough_hide 4, spider_silk 3, smithing_flux 1, oficio authored 50.
- LV40: curved_tusk 4, arcane_essence 2, smithing_flux 2, oficio authored 65.
- **NO** se regalan reagentes: los tests E2E usan recursos/cobre/skill
  artificiales etiquetados como *fixture* en CI para verificar mecánica real.
- La regla original del maestro por grupo de 25 puede admitir oficio 50 para
  una receta authored de 65. No inventar requisito exacto que el Sim no posee.
- P13 + P15 = 21 nuevos ítems y 21 recetas en las mismas tablas; catálogo
  nominal combinado: 233 recetas. El grado de utilidad depende de DPS/TTK
  medido, no de sumar un registro.
- P15 se aplica en worktree efímero DESPUÉS de P13; LIVE no cambia.

## Próximo cierre y criterios de promoción
1. Pruebas GREEN de nueve clases, maestro/estación, procedencia de reactivos
   por fase, nivel mínimo, craft, persistencia, y ninguna Primary Training stat.
2. Obtener **jugando** las cantidades de cada reactivo, validar tienda/maestro,
   niveles de herrería y cobre con tiempo esperado, sin fixture.
3. Auditar armaduras/consumibles/equipo **que ya existen** y su reutilización
   antes de inventar recetas. Luego completar defensas/pociones por banda.
4. Simular combate 9 clases × tramos × normal/élite/capitán y ajustar fórmula
   con límites de daño, defensa, recuperación, control y XP.
5. Prueba S23 Ultra físico y saves PLAY, empaquetado de Pages <995MB.
6. Endgame LV99 separado; EXTENDED 100+ y co-op 2–5 jugadores en diseño futuro.

**Resguardo:** mantener el único Sim, Hunter, stats reales entrenados,
GOLDEN movement, acceso offline, y ninguna publicación hasta aceptación.
