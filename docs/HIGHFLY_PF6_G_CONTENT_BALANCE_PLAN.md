# HIGHFLY PF-6 G — RUTA DE CONTENIDO Y BALANCE LV21–99
Status: BACKLOG PAUSADO POR DECISION DEL USUARIO (08 OCT 2026); DOCUMENTACION DE BRECHA, SIN IMPLEMENTACION NI DEPLOY
Source: GREEN PF-6 F RUN #333 SHA 312fe2e67219415a73a56303fcbd3b0bd9f62273
Safety: isolated proposal; CLEAN V1, public Pages and frozen Skill/Skin/Profession labs untouched.

## Evidencia observada (no confundir GREEN de CI con contenido completo)
- MAX_LEVEL real 99 y XP donor grantXp ya pasan pruebas; no hay segundo XP wallet.
- max(ZONES[*].levelRange[1]) = 20. **NO existe aun cobertura normal de zonas 21–99.**
- max(MOBS[*].maxLevel) = 60. Alguna plantilla puede llegar a 60, pero NO demuestra enemigos/escalado authored y recorribles hasta 60. No usarla como sustituto de contenido.
- Monstruos LV20 dejan de dar XP al Hunter LV28 por la formula original de gray/anti-farm.
- XP acumulada 1->99 actual: 14.800.600.
- Si hubiese monstruos normales del mismo nivel: solo kills sin quest ni bonus estimadas LV20=160, LV40=316, LV60=485, LV80=659, LV98=818 por subida de nivel. Son cantidades indicativas, no experiencia esperada por sesion.
- No se ha probado la duracion de sesion, daño/HP de enemigos de 21-99, rutas de misiones, elites/jefes, recursos, drop, habilidades en LV99 o tiempo para subir.

## Tramos de planificacion sugeridos (NO desbloquear automaticamente)
| Tramo | Cobertura que falta | Auditoria de gameplay |
|---|---|---|
| 21-29 | Continuacion post LV20, monstruos y quests con XP valida | A LV28, monstruo LV20 XP=0; verificar variedad y acceso sin farm obsoleto |
| 30-39 | Nueva progresion de escenarios propios | Damage/HP/defensa, tiempo por encuentro y recompensas |
| 40-49 | Encuentros elite y curva de maestria | HP consumido, recursos, skills y descanso |
| 50-59 | Dificultad media-alta e itinerarios accesibles | Builds Warrior/Rogue/Mage/Hunter + herencia |
| 60-69 | Contenido valido mas alla de la plantilla max60 encontrada | Variedad real, resistencia y drops |
| 70-79 | Progresion avanzada con enemigos propios | Supervivencia, XP de misiones y solo grind |
| 80-89 | Tramo alto, dificultad mecanica | Control de power creep, dungeons y jefes |
| 90-99 | Endgame normal previo a Extended | Cap 99, balance de bosses y readiness Segundo Despertar |

Ningun tramo exige inventar monstruos proxy o reutilizar el mismo LV20 con numeritos gigantes. Reutilizar solo assets/licencias compatibles y realmente disponibles, animaciones/colisiones/hitboxes reales; donar contenido de packs revisados antes de buscar externo FREE. Mantener mundo conectado, ciudad sin monstruos y ruta exterior prevista.

## Metodologia de balance
1. Medir XP REAL por matar enemigos y terminar misiones; separar bonus Rested/party/elite/first kill. Si existe XP <=0, identificar claramente por que.
2. Levantar datos por nivel, clase MAIN, equipamiento, monstruo, tiempo de combate, daño recibido, probabilidad de muerte, regeneracion y loot. Mantener combate y daño autorizados por Sim.
3. Estimar progresion considerando **mezcla real** de actividades (misiones, encuentros, bosses, exploracion). No calibrar solo sobre kills teoricas.
4. Definir objetivos de ritmo tras playtests; actualmente NO esta aprobado numero de horas por nivel ni por bloque. No hardcodear un kill-target arbitrario.
5. Curva XP crece suavemente, pero aumento relativo continuo NO prueba experiencia equilibrada. Corregir por causa: economia, rewards, nuevo contenido, curva o dificultad.
6. Balancear las cuatro MAIN y sus herencias, especialmente clases de INT/PER vs STR; dar viabilidad a builds entrenados fuera de su afinidad y no duplicar beneficios del Core.
7. La curva de vida/daño del personaje debe aplicar: despertar clase fijo 50 -> +1 total por nivel hasta +98 LV99 -> entrenamiento real independiente -> equipo/buffs como derivados. No inventar STR/AGI/VIT/PER/INT desde skills, items o magia.
8. Rank F->...->NACIONAL no se calcula automaticamente solo por nivel/XP; pruebas y maestria independientes. Extended LV100+ deshabilitado.

## Orden de ejecucion PF-6 G
G1 — Reporte cuantitativo de XP/zonas/monstruos y huecos (DONE en #333).
G2 — Matriz de escenarios/mobs/quests reales por tramo, reutilizando fuentes aprobadas y con licencias.
G3 — Primero escenario jugable LV21–29 con enemigos y XP/HP/AI/hitboxes propios, sin reemplazar zona LV1–20.
G4 — Gate repetible 1->29, incluyendo save+reload y Training. Si no es verde, no expandir a LV30.
G5 — Expandir tramos sucesivamente; tests de clases MAIN+HERITAGE, contenido, loot, dificultad y mobile.
G6 — Simulacion de economia 1–99 basada en actividades REALES, test de sesion humana, tune calibrado.
G7 — Release-candidate aislado, nunca desplegar Pages sin confirmacion y revision humana Android S23/PC.

## Puente con PF-7 — CORRECCION 08 OCT 2026
NO hay clases HERITAGE ni Segundo Despertar-subclase. El personaje y la clase original se conservan. Las siguientes tareas priorizadas por el usuario son skills propias, EVO/MUT de algunas skills y gemas en armas con afinidades elementales que agregan riders solo a skills compatibles. Contrato corregido: https://github.com/drakentzy07/cobalt-hollow-lab/blob/highfly-pf7-original-skills-gems/docs/HIGHFLY_PF7_ORIGINAL_CHARACTER_SKILLS_GEMS.md.
Este bloque de contenido LV21–99 y escenarios especiales queda aparcado para OTRA ETAPA, sin generar monstruos ni escenarios ahora.

## Gate de cierre
**No dar VERDE de BALANCE hasta que existan enemigos/escenarios/quests adecuados, cobertura hasta LV99, curva de XP + tiempos de sesion probados, equilibrio MAIN+HERITAGE, Android humano y guardado cross-save.**
Los greens actuales son gates de ingeniería, no una afirmacion de que el endgame esta terminado.
