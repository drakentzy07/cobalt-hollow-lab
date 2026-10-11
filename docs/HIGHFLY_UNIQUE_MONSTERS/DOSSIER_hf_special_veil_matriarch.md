# HIGHFLY — DOSSIER Matriarca del Velo
**11/10/2026 — UE00-UE02 · Especificación recuperada/propuesta, SIN integración de bosses.**

## 01 IDENTIDAD
Matriarca del Velo, UNIQUE/SUPREME; familia spider, linaje singular, ID hf_special_veil_matriarch.

## 02 IMPLEMENTACIÓN REAL
Solo especificación/JSON; ningún boss registrado en Sim, sin RUN jugable.

## 03 LORE
La araña protege memorias tejidas de evacuados de un desastre, y sus telas aprisionan a quienes cree saqueadores.

## 04 REFERENCIAS
HIGHFLY_MONSTRUO4_CIERRE_5_ESPECIALES_APP_HANDOFF_v1.md + SLF solo como inspiración abstracta.

## 05 DONANTES
webwood_spider, mire_widow, mirefen_broodmother verificados en CSV como templates, nunca como modelos GLB aprobados.

## 06 APARICIÓN
proposed 20% each eligible visit, guaranteed sight at visit 4; guaranteed EX after conditions; La seda retiene voces y ningún desaparecido ha sido hallado muerto.

## 07 REGIONES
Mirefen→Wraithwood, nido de 2 cámaras

## 08 ESCENARIO
Nido de los Mil Hilos; layout real pendiente, diferenciación de arena obligatoria.

## 09 NPC Y PISTAS
Tejedora Nara; La seda retiene voces y ningún desaparecido ha sido hallado muerto.

## 10 MISIONES
hf_special_veil_matriarch_00_RUMOR → hf_special_veil_matriarch_01_INVESTIGATION → hf_special_veil_matriarch_02_MANIFESTATION → hf_special_veil_matriarch_03_MERIT → hf_special_veil_matriarch_04_PREPARATION → hf_special_veil_matriarch_05_SCENARIO_EX → hf_special_veil_matriarch_06_BOSS → hf_special_veil_matriarch_07_RESOLUTION → hf_special_veil_matriarch_08_EPILOGUE

## 11 MANIFESTACIÓN
Primer avistamiento/duelo con posibilidad de retirarse y recordar el encuentro.

## 12 COMBATE EX
Rastrear herramientas sin cadáveres, rescatar un viajero y descubrir el nudo de la entrada.

## 13 ARTE
Concept original pendiente, GLB no verificado.

## 14 DONANTE A/B/C
A spider donor al suelo; B abdomen y anclajes; C si se exige trepar de verdad.

## 15 RIG/COLLIDERS
Pendientes de clips idle/run/turn/6 ataques/hit/death, sockets, pesos, hitbox y collider.

## 16 ESCALA
Comparar contra Hunter modular y cámara; no 300% simple reescala.

## 17 MOVIMIENTO
Máquina de telegraph/commit/active/recovery con locomoción auténtica por certificar.

## 18 IA/AGGRO
OBSERVE → POSITION → TELEGRAPH → COMMIT → ACTIVE → RECOVERY; leash, cooldown y navmesh.

## 19 ATAQUES NORMALES
spider_web, spider_venom, spider_mandible: hitboxes y counters por probar.

## 20 ATAQUES ESPECIALES
spider_thread_dash, spider_brood_call, spider_venom_ring: never VFX-as-damage.

## 21 ESTADOS
Solo efectos permitidos por Combat; caps de CC, DoT/slow con duración; no control imposible.

## 22 FASES
100–70% enseñanza, 70–35% escenario, 35–0% clímax/counter. Tres fases design only.

## 23 PUNTO DÉBIL
Saco y glándula solo al certificar colisión/ruptura.

## 24 BREAKABLES
Saco y glándula solo al certificar colisión/ruptura.; outcomes solo de collider real.

## 25 ENTORNO
Nido de los Mil Hilos; safe lanes, interacción y salida legible desde HUD Android.

## 26 STATS
Derivar fórmulas createMob; HP/DMG/ARMOR unique no definidos ni certificados. Banda de nivel 45–55.

## 27 BALANCE
Warrior, Paladin, Hunter, Rogue, Priest, Shaman, Mage, Warlock, Druid × perfiles Training/equipo + semillas y defensas reales.

## 28 EQUIPO
Consumibles y ratings RPG pueden ayudar; equipo nunca agrega STR/AGI/VIT/PER/INT reales.

## 29 LOOT
hf_veilspinner_silk y recompensa narrativa primera victoria por registrar en Loot, no Monster.

## 30 RECETAS
tailoring → hf_recipe_veilweave_mantle; ítems/requisitos/estación aún no creados.

## 31 TÍTULOS
Proponer reconocimiento cosmético por primer clear; no bonus de Training.

## 32 DESBLOQUEOS
Galerías y un telar de memoria se habilitan con un maestro artesano.; grafo perHunter no registrado.

## 33 POSTMISIONES
Códice y nuevos NPC/puertas; ninguna alternativa produce bloqueo permanente.

## 34 REJUEGO
Primera historia una vez; revancha de memoria opcional con rewards reducidas, no duplicar título.

## 35 PERSISTENCIA
Misma instancia Sim, same Hunter, unique encounterId, transacción atómica, rollback y firstClear idempotentes.

## 36 VFX/SFX
Telegraph de pose+sonido+suelo; originales/licenciados y presupuesto Android pendiente.

## 37 RENDIMIENTO
FPS mediano, p95, RAM, textura, LOD, drawcalls, camera y multitouch físicos sin medir.

## 38 TEST AUTOMATIZADO
Solo validación de esquemas eventual; ninguna AI/fase/combat real ensayada.

## 39 TEST HUMANO
Samsung S23 Ultra horizontal y PC 16:9 pendientes.

## 40 EVIDENCIAS
Historia y donor IDs auditados; no SHA de boss funcional, RUN ni Pages LAB disponibles.
