# HIGHFLY — DOSSIER Guardián del Corazón Raíz
**11/10/2026 — UE00-UE02 · Especificación recuperada/propuesta, SIN integración de bosses.**

## 01 IDENTIDAD
Guardián del Corazón Raíz, UNIQUE/SUPREME; familia elemental, linaje singular, ID hf_special_rootheart_warden.

## 02 IMPLEMENTACIÓN REAL
Solo especificación/JSON; ningún boss registrado en Sim, sin RUN jugable.

## 03 LORE
Un guardián atrapó la contaminación de una forja en su corteza; proteger las raíces lo obliga a impedir la curación.

## 04 REFERENCIAS
HIGHFLY_MONSTRUO4_CIERRE_5_ESPECIALES_APP_HANDOFF_v1.md + SLF solo como inspiración abstracta.

## 05 DONANTES
treant_elder, ancient_guardian, waking_warden verificados en CSV como templates, nunca como modelos GLB aprobados.

## 06 APARICIÓN
proposed 20% each eligible visit, guaranteed sight at visit 4; guaranteed EX after conditions; Las flores crecen incluso en las grietas creadas por el guardián.

## 07 REGIONES
Veiled Hollow Garden, santuario interior

## 08 ESCENARIO
Santuario de las Raíces; layout real pendiente, diferenciación de arena obligatoria.

## 09 NPC Y PISTAS
Herbolaria Eira; Las flores crecen incluso en las grietas creadas por el guardián.

## 10 MISIONES
hf_special_rootheart_warden_00_RUMOR → hf_special_rootheart_warden_01_INVESTIGATION → hf_special_rootheart_warden_02_MANIFESTATION → hf_special_rootheart_warden_03_MERIT → hf_special_rootheart_warden_04_PREPARATION → hf_special_rootheart_warden_05_SCENARIO_EX → hf_special_rootheart_warden_06_BOSS → hf_special_rootheart_warden_07_RESOLUTION → hf_special_rootheart_warden_08_EPILOGUE

## 11 MANIFESTACIÓN
Primer avistamiento/duelo con posibilidad de retirarse y recordar el encuentro.

## 12 COMBATE EX
Restaurar 3 fuentes y descifrar 2 sellos sin destruir árboles sanos.

## 13 ARTE
Concept original pendiente, GLB no verificado.

## 14 DONANTE A/B/C
A treant nativo, B geometría tronco/pecho, C si el rig no sirve.

## 15 RIG/COLLIDERS
Pendientes de clips idle/run/turn/6 ataques/hit/death, sockets, pesos, hitbox y collider.

## 16 ESCALA
Comparar contra Hunter modular y cámara; no 300% simple reescala.

## 17 MOVIMIENTO
Máquina de telegraph/commit/active/recovery con locomoción auténtica por certificar.

## 18 IA/AGGRO
OBSERVE → POSITION → TELEGRAPH → COMMIT → ACTIVE → RECOVERY; leash, cooldown y navmesh.

## 19 ATAQUES NORMALES
treant_branch_slam, treant_root_line, treant_bark_ward: hitboxes y counters por probar.

## 20 ATAQUES ESPECIALES
treant_seed_barrage, treant_heart_pulse, treant_purify_window: never VFX-as-damage.

## 21 ESTADOS
Solo efectos permitidos por Combat; caps de CC, DoT/slow con duración; no control imposible.

## 22 FASES
100–70% enseñanza, 70–35% escenario, 35–0% clímax/counter. Tres fases design only.

## 23 PUNTO DÉBIL
Corteza y núcleo EXPOSED solo por Combat; rutas de purificar/derrotar excluyentes.

## 24 BREAKABLES
Corteza y núcleo EXPOSED solo por Combat; rutas de purificar/derrotar excluyentes.; outcomes solo de collider real.

## 25 ENTORNO
Santuario de las Raíces; safe lanes, interacción y salida legible desde HUD Android.

## 26 STATS
Derivar fórmulas createMob; HP/DMG/ARMOR unique no definidos ni certificados. Banda de nivel 65–80.

## 27 BALANCE
Warrior, Paladin, Hunter, Rogue, Priest, Shaman, Mage, Warlock, Druid × perfiles Training/equipo + semillas y defensas reales.

## 28 EQUIPO
Consumibles y ratings RPG pueden ayudar; equipo nunca agrega STR/AGI/VIT/PER/INT reales.

## 29 LOOT
hf_rootheart_heartwood y recompensa narrativa primera victoria por registrar en Loot, no Monster.

## 30 RECETAS
woodcutting → hf_recipe_heartwood_forge_grip; ítems/requisitos/estación aún no creados.

## 31 TÍTULOS
Proponer reconocimiento cosmético por primer clear; no bonus de Training.

## 32 DESBLOQUEOS
Archivo botánico y cámara de semillas; resolución por derrota o purificación accesible.; grafo perHunter no registrado.

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
