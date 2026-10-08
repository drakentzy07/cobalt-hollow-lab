# HIGHFLY — PF-7 CORRECTED: ORIGINAL CHARACTER, SKILL EVOLUTION & ELEMENTAL GEM RIDERS
Status: DESIGN CANON — NO NEW GAMEPLAY IMPLEMENTATION, NO NEW DEPLOY
Basis: latest user design correction 2026-10-08 and earlier skill/element contract 2026-10-05.
Parent: PF-6 F audit green RUN #333 / 312fe2e67219415a73a56303fcbd3b0bd9f62273.
Branch: highfly-pf7-original-skills-gems (isolated).
DO NOT IMPORT old PF-7 A "4 MAIN + 4 HERITAGE", "Second Awakening = sub-class", or legacy spec assumptions.

## 1 — Identidad del Hunter NO negociable
- Conservar personaje original (rig/modelo/apariencia/personaje de gameplay existente), clase original y estilo de combate asociado a su arma equipada.
- NO existe sistema de herencia de clases en el gameplay final. NO hay seleccion 5 MAIN + 5 HERITAGE ni union automatica Warrior/Paladin, Rogue/Warlock, Mage/Shaman, Hunter/Druid.
- Cualquier habilidad procedente de recursos donor se integra en la clase original como contenido auditado; su origen no crea una "clase secundaria".
- No forzar cambios de clase, arma, rig o animacion al ejecutar una skill. No "party swap".
- Priest NO debe reintroducirse como HERITAGE; los candidatos de habilidades unicas se diseñan por separado.
- "Segundo Despertar" como subclase heredada queda **RECHAZADO**. El usuario habla de especializaciones futuras, pero no autoriza convertirlas en herencia ni establecer aun un segundo cambio de clase. Si se usa el termino, definirlo de nuevo con el usuario antes de codificar.

## 2 — Habilidades y evolucion
- Mantener skills BASE reales con sus animaciones, movimiento, target, costes/cooldown, impacto y autoridad de daño.
- EVO = misma skill amplificada conservando identidad; MUTACION = transformacion espectacular y aprobada.
- Solo algunas skills evolucionan o mutan; ninguna evolucion generica obligatoria.
- UNICA = habilidad original/de descubrimiento adquirida mediante condiciones creadas por los diseñadores; no necesariamente evolucion de una BASE. UNICA MUTADA reservada excepcionalmente.
- Crear habilidades HIGHFLY originales para el personaje/clase actual, ademas de reutilizar y mejorar algunas ya existentes.
- Prohibido VFX-proxy, daño dictado por animacion o usar VFX como fuente de hit/damage.
- Los puntos STR, AGI, VIT, PER, INT se obtienen por Awakening + crecimiento natural nivel + entrenamiento real validado; skills, gemas, talentos, item NO regalan Core primario.

## 3 — Arma equipada -> afinidad elemental -> skills RECEPTORAS -> RIDERS
Autoridad de afinidad = arma/equipamiento activo; NO un boton "elige elemento de habilidad".
- Incrustar/equipar gema de fuego puede conferir afinidad FIRE al arma. Se muestra aura de llamas coherente con la gema (ejemplo: espada envuelta en fuego). Otros elementos solo si tienen definiciones y FX validos.
- Para cada skill hay una capacidad/compatibilidad explicitamente declarada. Estado NONE: skill permanece BASE, sin rider.
- Contrato de receptores previamente discutido: NONE / SINGLE / DUAL / TRIPLE / TRANSCENDENT. Niveles de receptor son capacidades, NO obligacion de tener 2-3 elementos ni desbloqueos gratuitos.
- Ejemplo compatible: FIRE rider añade efecto Burn a objetivos impactados por la skill, con duración, aplicación, inmunidades, daño y autoridad definidos por el verdadero combat runtime. VFX/SFX refleja el fuego pero no decide daño.
- Ejemplo incompatibilidad: skill conserva identidad, targeting, hit y daño base. No se cambia su animacion arbitrariamente, ni se aplica Burn por llevar gema.
- Requisitos y fusiones de múltiples elementos requieren definiciones propias, mastery y compatibilidad; no aplicar fusiones automaticas. La lista de elementos de universo puede extenderse (fuego, agua, aire, tierra, hielo, rayo, luz, oscuridad, metal, planta, necromancia), pero TODO elemento nuevo requiere efectos+tests+FX propios.
- Evolucion de skill y afinidad elemental son sistemas **ORTOGONALES**: una EVO puede ser compatible o incompatible; no inferir riders por tener EVO.

## 4 — Golpes BASE y cuarto golpe elemental
- Sin gema/afinidad activa: combo de ataques 1 -> 2 -> 3 y termina.
- Cuando hay gema elemental ACTIVA y se cumplen las reglas de ataque: se puede habilitar 4to golpe especial con efecto del elemento. No convertirlo en autoattack infinito.
- No confundir ataques basicos 1-2-3-(4) con los diez slots de habilidades; son sistemas distintos y se auditan por separado.

## 5 — Lo que NO vamos a implementar ahora
- NO etapas de HERITAGE/Segundo Despertar-subclase; NO desbloqueos automaticos en cierto nivel.
- NO cambiar creador, clase original, camera GOLDEN, S23 HUD, targeting, arma por skill, autosave.
- NO fingir que PF-6 F certifico balance 1-99; era auditoria y el contenido alto sigue faltando.
- NO activar rangos, maestrias o escalados nuevos sin prueba y validacion.
- NO borrar resultados de Skill Lab, Skin Lab, Profesiones ni mezclarlos accidentalmente.

## 6 — Camino de implementacion PF-7 (propuesta para luego)
1. Reauditar skills BASE existentes de los personajes/clases reales y documentar su compatibilidad con elemental RIDERS, SIN modificar gameplay.
2. Verificar e implementar gemas y auras de arma con definiciones author-created y referencias de assets compatibles; probar FIRE primero con espada real.
3. Probar 1-2-3 y golpe 4 solo con gema elegible; combos reales y cooldown/animacion en S23.
4. Incorporar primeros riders compatibles (quemadura) a una skill real SIN alterar su BASE; hit/damage resueltos en la fuente autoritativa.
5. EVO y MUTACION de skills seleccionadas; crear skills propias PREMIUM del personaje actual bajo gate 7/7 + Android.
6. Sistema de descubrimiento de UNICAS. Las futuras "especializaciones" se definirán aparte, sin asumir clasificaciones de herencia ni Segundo Despertar.
7. Gates: TS, tests del combat runtime, cero stats Core gratuitas, equip/restores de gemas, save/load, 10 hotbar sin saltar GOLDEN UI, WebGL/Android humano.

## 7 — Proyecto mundo: RETENIDO para otra etapa
PF-6 G es BACKLOG. El observatorio #333 detecto max nivel de zona 20, templates max nivel 60, monstruo LV20 gris en LV28. Tenemos que crear/procurar zonas, enemigos y escenarios especiales LV21–99 en otra etapa; NO modificar el mundo ahora por esta correccion documental.

## Principio de autoridad
Personaje original -> habilidad BASE autentica; arma+gema -> afinidad activa -> rider SOLO si skill compatible; EVO/MUTACION/UNICA por diseño propio. Progresion RPG nivel 1-99, Training REAL solo para stats Core. No hay clases HERITAGE.
