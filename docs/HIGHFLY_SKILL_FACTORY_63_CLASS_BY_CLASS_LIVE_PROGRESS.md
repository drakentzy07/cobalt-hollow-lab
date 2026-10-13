# HIGHFLY — BITÁCORA MAESTRA DE LAS 63 FUSIONES (13 OCT 2026)

Este archivo es la referencia de progreso para compartir cambios por **clase, nombre, mecánica, VFX, prueba y RUN**, sin volver a hablar vagamente de «skills listas».

## Cómo leer el estado
- ✅ **10/63 Nativa verificada en Sim real**: nueva definición `hf_*`, desbloqueo HIGHFLY, libro, actionbar, coste/cooldown, casting, efectos nativos testados a nivel inicial y LV99, y WebGL opt-in integrado. **NO equivale a VFX, animación, sonido o sensación premium aprobados**.
- 🟡 **53/63 Solo diseño/contrato**: recipe + donantes exactos congelados, pero NO existe aún definición fusionada real apta para entrar al HUD.
- 🔴 «Visual premium aprobado» = **0/63 certificados hasta ahora**; no confundir con compilación WebGL o Chrome headless.
- No se afectan las nueve clases originales ni los únicos cinco atributos que crecen con entrenamiento (STR, AGI, VIT, PER, INT).

## Situación certificada
SF8 [RUN #38433851460](https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38433851460): 9/9 clases, 10/63 skills; efectos probados tanto al nivel de desbloqueo como LV99.
SF9A [RUN #38437099220](https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38437099220): mezcla originales + habilidades HIGHFLY contra monstruos normales LV99 reales, sin HP editada. 8 victorias y 1 Druida aún vivo a 32s; 9 fusiones usadas (Sacerdote tiene otra skill también probada separadamente). `83/83` tests, original Captain 9/9, WebGL móvil simulado GREEN. Cero daño de disparos originales en rotación Hunter SF9A ⇒ SF9B debe corregir distancia legal; no fingir que pasó.
SF9B [RUN #38439125343](https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38439125343): **en evaluación** al crear esta bitácora. Debe exigir 9/9 victorias normales, daño real de skills originales incluyendo disparos Hunter y más margen legítimo para Druida.

## Habilidades por clase

## Warrior — Guerrero — 1/7 nativas, 6/7 pendientes

| Nivel | Skill HIGHFLY | Fusiones donantes (ClaudeCraft original) | Estado y comportamiento |
|---:|---|---|---|
| 1 | **Corte de Vanguardia** (`hf_warrior_s1`) | `heroic_strike` + `sunder_armor` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 5 | **Impacto de Falla** (`hf_warrior_s2`) | `slam` + `overpower` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 10 | **Avance del León** (`hf_warrior_s3`) | `charge` + `hamstring` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 15 | **Guardia de Acero** (`hf_warrior_s4`) | `raised_guard` + `revenge` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 20 | **Torbellino Carmesí** (`hf_warrior_s5`) | `whirlwind` + `red_harvest` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 25 | **Grito del Capitán** (`hf_warrior_u1`) | `battle_shout` + `rallying_cry` | ✅ Piloto nativo probado. Efectos nativos: AP del grupo + vida máxima temporal. Efectos visuales NO certificados |
| 30 | **Ruptura de Fallaline** (`hf_warrior_u2`) | `heroic_leap` + `faultline` + `execute` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |

## Paladin — Paladín — 1/7 nativas, 6/7 pendientes

| Nivel | Skill HIGHFLY | Fusiones donantes (ClaudeCraft original) | Estado y comportamiento |
|---:|---|---|---|
| 1 | **Tajo del Cruzado** (`hf_paladin_s1`) | `crusader_strike` + `seal_of_righteousness` | ✅ Piloto nativo probado. Golpe cuerpo a cuerpo + imbue del arma. Efectos visuales NO certificados |
| 5 | **Disco Solar** (`hf_paladin_s2`) | `sunward_disc` + `hammer_of_wrath` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 10 | **Muro de Devoción** (`hf_paladin_s3`) | `holy_shield` + `devotion_ward` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 15 | **Choque Consagrado** (`hf_paladin_s4`) | `holy_shock` + `flash_of_light` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 20 | **Paso del Alba** (`hf_paladin_s5`) | `solar_step` + `hammer_of_justice` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 25 | **Veredicto del Sol** (`hf_paladin_u1`) | `final_edict` + `sun_gods_verdict` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 30 | **Ascensión Divina** (`hf_paladin_u2`) | `divine_ascension` + `avenging_wrath` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |

## Hunter — Cazador — 1/7 nativas, 6/7 pendientes

| Nivel | Skill HIGHFLY | Fusiones donantes (ClaudeCraft original) | Estado y comportamiento |
|---:|---|---|---|
| 1 | **Disparo de Apertura** (`hf_hunter_s1`) | `measured_shot` + `arcane_shot` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 5 | **Picadura de Caza** (`hf_hunter_s2`) | `serpent_sting` + `aimed_shot` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 10 | **Trampa Escarchada** (`hf_hunter_s3`) | `frostjaw_trap` + `concussive_shot` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 15 | **Lluvia de Astillas** (`hf_hunter_s4`) | `shrapnel_charge` + `volley` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 20 | **Colmillo de Raptor** (`hf_hunter_s5`) | `raptor_strike` + `trailbreak` | ✅ Piloto nativo probado. Golpe de Raptor + retroceso/retirada. Efectos visuales NO certificados |
| 25 | **Fuego Rápido del Alfa** (`hf_hunter_u1`) | `rapid_fire` + `bloodtrail_assault` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 30 | **Comando de Estampida** (`hf_hunter_u2`) | `stampede` + `pack_command` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |

## Rogue — Pícaro — 1/7 nativas, 6/7 pendientes

| Nivel | Skill HIGHFLY | Fusiones donantes (ClaudeCraft original) | Estado y comportamiento |
|---:|---|---|---|
| 1 | **Estocada Cobarde** (`hf_rogue_s1`) | `backstab` + `ambush` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 5 | **Corte Siniestro** (`hf_rogue_s2`) | `sinister_strike` + `eviscerate` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 10 | **Ruptura Venenosa** (`hf_rogue_s3`) | `rupture` + `deadly_poison` + `instant_poison` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 15 | **Danza de Sombras** (`hf_rogue_s4`) | `sprint` + `evasion` | ✅ Piloto nativo probado. Buff nativo velocidad + esquiva. Efectos visuales NO certificados |
| 20 | **Silencio del Verdugo** (`hf_rogue_s5`) | `gouge` + `kick` + `kidney_shot` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 25 | **Frenesí Carmesí** (`hf_rogue_u1`) | `adrenaline_rush` + `expose_armor` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 30 | **Eclipse del Acecho** (`hf_rogue_u2`) | `stealth` + `blind` + `ambush` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |

## Priest — Sacerdote — 2/7 nativas, 5/7 pendientes

| Nivel | Skill HIGHFLY | Fusiones donantes (ClaudeCraft original) | Estado y comportamiento |
|---:|---|---|---|
| 1 | **Castigo de Misericordia** (`hf_priest_s1`) | `smite` + `scouring_mercy` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 5 | **Azote Mental** (`hf_priest_s2`) | `mind_blast` + `shadow_word_pain` | ✅ Piloto nativo probado. Daño oscuro directo + daño periódico. Efectos visuales NO certificados |
| 10 | **Escudo Renovador** (`hf_priest_s3`) | `power_word_shield` + `renew` | ✅ Piloto nativo probado. Absorción + sanación periódica. Efectos visuales NO certificados |
| 15 | **Sanación Relámpago** (`hf_priest_s4`) | `lesser_heal` + `flash_heal` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 20 | **Nova Vigilante** (`hf_priest_s5`) | `holy_nova` + `seraphic_vigil` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 25 | **Plegaria de Retorno** (`hf_priest_u1`) | `prayer_of_healing` + `prayer_of_returning` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 30 | **Tithefiend del Juicio** (`hf_priest_u2`) | `summon_tithefiend` + `psychic_scream` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |

## Shaman — Chamán — 1/7 nativas, 6/7 pendientes

| Nivel | Skill HIGHFLY | Fusiones donantes (ClaudeCraft original) | Estado y comportamiento |
|---:|---|---|---|
| 1 | **Latigazo de Relámpago** (`hf_shaman_s1`) | `lightning_bolt` + `chain_lightning` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 5 | **Choque de Lava** (`hf_shaman_s2`) | `flame_shock` + `lava_burst` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 10 | **Oleada del Tótem Vivo** (`hf_shaman_s3`) | `healing_wave` + `tidecall` | ✅ Piloto nativo probado. Sanación combinada en una sola acción. Efectos visuales NO certificados |
| 15 | **Desatar Arma** (`hf_shaman_s4`) | `unleash_weapon` + `flametongue_weapon` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 20 | **Lobo de Vendaval** (`hf_shaman_s5`) | `ghost_wolf` + `frost_shock` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 25 | **Terremoto de Tempestad** (`hf_shaman_u1`) | `earthquake` + `thunderstorm` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 30 | **Furia del Tótem Mayor** (`hf_shaman_u2`) | `bloodlust` + `elemental_trance` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |

## Mage — Mago — 1/7 nativas, 6/7 pendientes

| Nivel | Skill HIGHFLY | Fusiones donantes (ClaudeCraft original) | Estado y comportamiento |
|---:|---|---|---|
| 1 | **Rayo de Escarcha Ígnea** (`hf_mage_s1`) | `frostbolt` + `fireball` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 5 | **Lanza Arcana** (`hf_mage_s2`) | `ice_lance` + `arcane_missiles` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 10 | **Parpadeo de Nova** (`hf_mage_s3`) | `blink` + `frost_nova` | ✅ Piloto nativo probado. Blink + control de área helado. Efectos visuales NO certificados |
| 15 | **Barrera de Fase** (`hf_mage_s4`) | `ice_barrier` + `temporal_barrier` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 20 | **Impulso del Mago** (`hf_mage_s5`) | `arcane_surge` + `scorch` + `flurry` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 25 | **Órbita Meteórica** (`hf_mage_u1`) | `meteor` + `frozen_orb` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 30 | **Reloj del Umbral** (`hf_mage_u2`) | `temporal_hourglass` + `combustion` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |

## Warlock — Brujo — 1/7 nativas, 6/7 pendientes

| Nivel | Skill HIGHFLY | Fusiones donantes (ClaudeCraft original) | Estado y comportamiento |
|---:|---|---|---|
| 1 | **Lanza de Ruina** (`hf_warlock_s1`) | `shadow_bolt` + `soul_lance` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 5 | **Corrupción Agónica** (`hf_warlock_s2`) | `corruption` + `curse_of_agony` | ✅ Piloto nativo probado. Una maldición de DoT oscuro fusionado. Efectos visuales NO certificados |
| 10 | **Pacto de Vida** (`hf_warlock_s3`) | `life_tap` + `drain_life` + `cruel_pact` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 15 | **Ojo Maldito** (`hf_warlock_s4`) | `evil_eye` + `fear` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 20 | **Mandato Demoníaco** (`hf_warlock_s5`) | `summon_imp` + `summon_voidwalker` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 25 | **Lluvia Infernal** (`hf_warlock_u1`) | `rain_of_fire` + `chaos_bolt` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 30 | **Legión Profana** (`hf_warlock_u2`) | `army_of_the_dead` + `raise_graveguard` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |

## Druid — Druida — 1/7 nativas, 6/7 pendientes

| Nivel | Skill HIGHFLY | Fusiones donantes (ClaudeCraft original) | Estado y comportamiento |
|---:|---|---|---|
| 1 | **Garra Lunar** (`hf_druid_s1`) | `claw` + `moonfire` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 5 | **Espinas del Enjambre** (`hf_druid_s2`) | `rake` + `insect_swarm` + `thorns` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 10 | **Toque Renovador** (`hf_druid_s3`) | `rejuvenation` + `regrowth` + `healing_touch` | ✅ Piloto nativo probado. Curación instantánea + HoT. Efectos visuales NO certificados |
| 15 | **Carga de Ursa** (`hf_druid_s4`) | `bear_charge` + `maul` + `swipe` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 20 | **Paso Salvaje** (`hf_druid_s5`) | `travel_form` + `dash` + `barkskin` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 25 | **Despertar del Bosque** (`hf_druid_u1`) | `grove_awakening` + `wildwake` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |
| 30 | **Corazón de Estrellas** (`hf_druid_u2`) | `starfire` + `moonseed` + `hurricane` | 🟡 Solo contrato/donantes diseñados; falta implementación y pruebas reales |

## Próximos paquetes ordenados

1. **SF9B:** Hunter kite real con movimiento input y rango 8+, Druida 60s, 9/9 victorias normal LV99. Luego Capitán LV99 con kits fusionados realmente usados, reportando cada derrota/timeout sin suavizar al jefe.
2. **SF10 y siguientes:** construir las otras 53 definiciones nativas por familias de efectos (golpe + debuff, disparo + control, defensa + cura, hechizo + área, invocación + ataque), con fuente original compatible, desbloqueos 1/5/10/15/20/25/30, tests de animación/eventos y ninguna colisión de auras.
3. **HUD:** dos filas HIGHFLY de 10 botones + pasivas/buffs abajo, apuntado automático front/nearest, mantener para tooltip, sin pisar el layout personal.
4. **Presentación:** prueba individual por skill de animación/telegraph/VFX/daño visual/cámara/sonido, Chrome/S23 y S23 Ultra físico, tiempos de carga.
5. **Extensiones futuras no incluidas en 63:** pasivas, HIGHFLY ÚNICAS y ÚNICAS MUTADAS de escenarios/monstruos especiales. Las 9 clases originales siguen permanentes.

## Formato de actualización de Guine

`[SFxx] [Clase] [Skill] — Mecánica [probada/fallida/diseño] · VFX [pendiente/probado] · Test [detalles] · RUN [URL/estado] · Próximo paso [cambio concreto]`

**Regla:** GREEN de un test nunca se anuncia como «VFX perfecto», «juego publicado» ni «balanza LV99 fusionada completa». `main` y GitHub Pages quedan intactos salvo permiso explícito.
