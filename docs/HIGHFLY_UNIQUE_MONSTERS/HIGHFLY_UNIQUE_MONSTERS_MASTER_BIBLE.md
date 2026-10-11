# HIGHFLY — UNIQUE MONSTERS MASTER BIBLE v0.1
**11/10/2026 — UE00-UE02 · Especificación recuperada/propuesta, SIN integración de bosses.**


## Estado de origen
Se recuperó la *Special Monster Bible v1.0* fechada 09/10/2026, con los cinco IDs y propuestas de combate, loot y escenario. **Era diseño aprobado como documento y ninguno era boss ejecutable**. La rama P08 aporta pruebas del único Sim/Hunter cruzando ocho portales y un caso con loot→forja→gema→relogin en fixtures controlados; ello NO demuestra que existan únicos. Respetar ClaudeCraft congelado `9b57e49c9676d75962700f828cc00a50a9a988b5`. El inventario reporta 270 definiciones donor + 64 HIGHFLY normales + 16 élites/capitanes (350 registros, no 350 enemigos activos), 988 líneas de loot, 15 zonas donor y 14 dungeons donor. Cinco únicos ≠ élites/capitanes. No tocar Pages ni main.

## Investigación SLF (confirmado en fuentes comunitarias, no diseño copiado)
**Lycagon** puede encontrarse antes de poder resolver su escenario EX, y el contacto tiene consecuencias; adaptar reconocimiento, no su maldición ni clones. **Wezaemon** combina búsqueda nocturna/escenario escondido y fases por objetivo; adaptar narración y defensas, no invulnerabilidades injustificadas. **Ctarnidd** requiere enlazar una quest menor con EX, explorar y resolver enigmas; adaptar el mundo como sistema del boss. **Siegwurm** puede verse antes de que exista acceso efectivo a combatirlo; adaptar anticipación ambiental, no una raid obligatoria (Highfly usa un único Hunter). Fuentes: https://shangrila-frontier.fandom.com/wiki/Seven_Colossi ; https://shangrila-frontier.fandom.com/wiki/From_the_Living_World%2C_With_Love ; https://shangrila-frontier.fandom.com/wiki/Ctarnidd_of_the_Abyss ; https://shangrila-frontier.fandom.com/wiki/Light_of_Courage%2C_Banishing_the_Dark ; https://shangrila-frontier.fandom.com/wiki/Siegwurm_the_Sky_Ruler . Las fuentes fan pueden estar incompletas; la autoría visual y narrativa será HIGHFLY.

## Orquestación propuesta, sin sustituir el Sim
`WORLD → EVENT_GATE/PER_HUNTER → QUEST → NATIVE SCENARIO → UNIQUE BOSS → NATIVE COMBAT → ENCOUNTER → REWARDCONTEXT → NATIVE LOOT/INVENTORY → PROFESSIONS → EQUIPMENT/GEM → SAVE → WORLD UNLOCK`.
Estados mínimos `UNDISCOVERED → RUMOR → TRACES → FIRST_CONTACT → MERIT → PREPARED → EX_ENTERED → RESOLVED → EPILOGUE`; si muere, huye o cierra, guardar progreso de clues y safe return, sin primera recompensa antes del clear. RNG de huellas solo con ciclos/visitas del juego, 20% de propuesta y avistamiento garantizado en cuarta visita elegible; entrada EX siempre determinista tras misión. Nada de world-first compartido offline. El guardado local puede editarse: no prometer antifraude criptográfico sin servidor.

## Diseño por jefe
### Lobo del Eclipse
**Historia:** Un lobo custodió una ruta de refugiados que los cazadores clausuraron; confunde a viajeros con invasores.
**Aparición:** Eastbrook→Wraithwood, claro lunar; En las madrigueras aparecen piedras iluminadas, pero ninguna presa.; requisito Rastrear 3 mojones y sobrevivir a una prueba de persecución.
**Arena:** Coto de la Luna Rota; fase P1 lectura, P2 alteración de entorno y P3 decisión/exposición; seis acciones wolf_claw, wolf_fang_rend, wolf_lunge, wolf_feint, wolf_howl, wolf_twilight_step.
**Donantes certificados como plantillas (NO como GLB):** forest_wolf, old_greyjaw.
**Profesión:** `hf_moon_touched_pelt` → `tailoring` → `hf_recipe_moonthread_hood` (no registrados).
**Puerta:** La ruta de evacuación y un archivo de cazadores se reabren.
**Modelo:** A reutilizar rig forest_wolf + crin nueva; B híbrido; C nuevo solo si faltan clips.

### Matriarca del Velo
**Historia:** La araña protege memorias tejidas de evacuados de un desastre, y sus telas aprisionan a quienes cree saqueadores.
**Aparición:** Mirefen→Wraithwood, nido de 2 cámaras; La seda retiene voces y ningún desaparecido ha sido hallado muerto.; requisito Rastrear herramientas sin cadáveres, rescatar un viajero y descubrir el nudo de la entrada.
**Arena:** Nido de los Mil Hilos; fase P1 lectura, P2 alteración de entorno y P3 decisión/exposición; seis acciones spider_web, spider_venom, spider_mandible, spider_thread_dash, spider_brood_call, spider_venom_ring.
**Donantes certificados como plantillas (NO como GLB):** webwood_spider, mire_widow, mirefen_broodmother.
**Profesión:** `hf_veilspinner_silk` → `tailoring` → `hf_recipe_veilweave_mantle` (no registrados).
**Puerta:** Galerías y un telar de memoria se habilitan con un maestro artesano.
**Modelo:** A spider donor al suelo; B abdomen y anclajes; C si se exige trepar de verdad.

### Tirano Rompemurallas
**Historia:** Un coloso creado para abrir una presa en una inundación aún intenta cumplir la orden tras siglos de incomprensión.
**Aparición:** Thornpeak Peaks, fortificación antigua; Las grietas de dos muros distintos siguen el mismo patrón.; requisito Encontrar planos, forjar cincel de prueba y sobrevivir a una carga guiada contra una barricada.
**Arena:** Fortaleza del Desfiladero; fase P1 lectura, P2 alteración de entorno y P3 decisión/exposición; seis acciones ogre_overhead, ogre_sweep, ogre_stomp, ogre_siege_rush, ogre_pillar_break, ogre_rock.
**Donantes certificados como plantillas (NO como GLB):** thornpeak_ogre, brutok_skullsmasher.
**Profesión:** `hf_crag_armor_fragment` → `weaponcrafting` → `hf_recipe_siegebreaker_hammer` (no registrados).
**Puerta:** Se abre una galería minera y un maestro de temple puede impartir una receta.
**Modelo:** A ogre native; B hombrera y maza modular; C si escala y rig lo exigen.

### Gravewyrm Renacido
**Historia:** La memoria de un dragón selló una bóveda antigua; el ritual de resurrección busca proteger su contenido y no destruir ciudades.
**Aparición:** Thornpeak Cave, cripta bajo cantera; La cripta late cuando los exploradores apagan las lámparas.; requisito Interpretar 3 runas, detener un custodio y apagar anclas una por vez.
**Arena:** Cripta del Último Aliento; fase P1 lectura, P2 alteración de entorno y P3 decisión/exposición; seis acciones wyrm_tail, wyrm_necrotic_pulse, wyrm_ash_breath, wyrm_bonefall, wyrm_gravecall, wyrm_anchor_break.
**Donantes certificados como plantillas (NO como GLB):** dragonkin_broodguard, korzul_the_gravewyrm, boneclad_revenant.
**Profesión:** `hf_ashen_rune_plate` → `enchanting` → `hf_recipe_ashbound_ward` (no registrados).
**Puerta:** Se abre el Archivo Sepultado y una misión sobre el origen de los sellos.
**Modelo:** Modelo nuevo C puede ser indispensable; NO asumir que dragonkin donor es wyrm esquelético.

### Guardián del Corazón Raíz
**Historia:** Un guardián atrapó la contaminación de una forja en su corteza; proteger las raíces lo obliga a impedir la curación.
**Aparición:** Veiled Hollow Garden, santuario interior; Las flores crecen incluso en las grietas creadas por el guardián.; requisito Restaurar 3 fuentes y descifrar 2 sellos sin destruir árboles sanos.
**Arena:** Santuario de las Raíces; fase P1 lectura, P2 alteración de entorno y P3 decisión/exposición; seis acciones treant_branch_slam, treant_root_line, treant_bark_ward, treant_seed_barrage, treant_heart_pulse, treant_purify_window.
**Donantes certificados como plantillas (NO como GLB):** treant_elder, ancient_guardian, waking_warden.
**Profesión:** `hf_rootheart_heartwood` → `woodcutting` → `hf_recipe_heartwood_forge_grip` (no registrados).
**Puerta:** Archivo botánico y cámara de semillas; resolución por derrota o purificación accesible.
**Modelo:** A treant nativo, B geometría tronco/pecho, C si el rig no sirve.


## Formula auténtica donor y límites
En `src/sim/entity.ts:createMob` del pin, HP = `round((hpBase+hpPerLevel*(L−1))×(elite?2.3:1))`; el daño centro = `(dmgBase+dmgPerLevel*(L−1))×(elite?1.5:1)`, min/max redondeados ×0.8/1.25, armor = `round(armorPerLevel*(L−1))`. Estas son fórmulas originales, NO HP final de únicos. No simular balance con HuntPilot HP×3. Las nueve clases y tres perfiles reales de Training/gear +0/+3/+5/+8/+10 exigen E2E defensivo, no smoke 8 s.

## Donantes y legalidad
Las definiciones de monstruos se comprobaron en `HIGHFLY_V4_03_BESTIARY_1_99.csv`. No se auditaron GLBs ni clips hoy: mesh/triángulos, materiales, licencias, hitboxes, locomoción, cámara y LOD quedan BLOQUEADOS hasta UE03. Evitar reemplazar IDs originales `korzul_the_gravewyrm`, `mirefen_broodmother`, `waking_warden`; quest-only loot intacto. Treant Elder, Ancient Guardian y Waking Warden salen `elemental` en CSV pinned, aunque una guía externa difiera.

## Gates y etapas
UE00 historia, UE01 SLF, UE02 biblia/quests/grafo (documentación); UE03 donantes legales/rig, UE04 director nativo, UE05 escenarios EX, UE06 IA/hitboxes reales, UE07 estadísticas/balance, UE08 RewardContext e idempotencia, UE09 recetas/crafteo, UE10 lobo vertical real, UE11 cuatro restantes, UE12 QA físico S23, UE13 freeze con sha/run, UE14 handoff V4-03 separado y autorizado. No confundir pruebas de estructura con GREEN LAB o GREEN REAL. Primero laboratorio con enlaces de Pages aislados, nunca modificar root ni /monster-lab/.

