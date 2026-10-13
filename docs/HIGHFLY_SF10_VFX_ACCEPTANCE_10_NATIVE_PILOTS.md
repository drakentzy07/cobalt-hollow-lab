# HIGHFLY SF10 — criterios de presentación de las 10 skills nativas

**ESTADO: DISEÑO DE CONTROL DE CALIDAD, NO IMPLEMENTACIÓN VISUAL CERTIFICADA.**

Los diez pilotos SF4–SF9 tienen mecánicas en el Sim; este documento fija exactamente qué se debe ver y medir antes de que se declaren premium. La presencia de un `castFx`, `projectileFx`, `spellfx`, animación o sonido legado NO prueba por sí sola que el usuario vea una fusión premium. Validar cada habilidad con eventos reales y un Chrome/S23 grabado, y en último término en S23 físico.

| Clase | Skill | Efectos nativos ya existentes | Presentación a integrar/probar | Criterio visual y mecánico |
|---|---|---|---|---|
| Warrior | **Grito del Capitán** (`hf_warrior_u1`) | Activación de buff de AP y vida máxima temporal | Grito corporal y onda expansiva circular que comunique alcance, brillo discreto de aliados | La onda sale una vez; los dos buffs aparecen y se van sin afectar HUD ni stats Training |
| Paladin | **Tajo del Cruzado** (`hf_paladin_s1`) | Daño melee seguido de imbue de arma | Corte de luz dorada/blanca anclado al arma original + destello breve de sello | Se ve el contacto sobre objetivo real y el imbue tiene indicador persistente distinto del golpe |
| Hunter | **Colmillo de Raptor** (`hf_hunter_s5`) | Golpe cuerpo a cuerpo + retirada | Golpe de dos trazos/colmillo y rastro de desplazamiento; sin teleporte falso | Golpe sólo a rango melee; retirada direccional visible; el siguiente disparo sólo se ejecuta desde distancia legal |
| Rogue | **Danza de Sombras** (`hf_rogue_s4`) | Dos buffs: velocidad y evasión | Dos sombras superpuestas/afterimages, efecto de evasión ligero sin saturar cámara | Distinguir speed y dodge; cooldown real, sin dar invisibilidad ficticia |
| Priest | **Azote Mental** (`hf_priest_s2`) | Daño sombra inmediato + DoT | Destello psíquico oscuro/púrpura en impacto + pequeñas pulsaciones del DoT | El impacto y el DoT son eventos distintos y no se duplica daño visual |
| Priest | **Escudo Renovador** (`hf_priest_s3`) | Absorción y curación periódica con auras separadas | Burbuja escudo cálida + pulso verde/dorado de curación | Las dos auras tienen indicadores distintos y cada pulso ocurre a su frecuencia real |
| Shaman | **Oleada del Tótem Vivo** (`hf_shaman_s3`) | Una única curación nativa combinada | Oleada acuática/elemental de corto recorrido entre manos y aliado | Mostrar una sola curación, no dos falsos números apilados |
| Mage | **Parpadeo de Nova** (`hf_mage_s3`) | Blink y raíz helada de área a destino | Rastro fugaz de teleportación + estallido radial de hielo después de aparecer | La nova nace en destino y no en origen; no congelar enemigos fuera de rango |
| Warlock | **Corrupción Agónica** (`hf_warlock_s2`) | Una maldición DoT fusionada | Marca de sombra púrpura/negra sobre blanco + pulsaciones de daño | Una sola aura y un solo calendario de ticks, sin apilar de modo engañoso |
| Druid | **Toque Renovador** (`hf_druid_s3`) | Curación inmediata + curación periódica | Chispas naturaleza/hojas + tenue resplandor sostenido de HoT | Distinguir cura inicial de ticks, sin simular VIT permanente |

## Reutilización obligatoria
- Primero auditar `AbilityDef.castFx` (`shout`, `weaponAura`, `flourish`), `projectileFx` (`lightning`, `heavyBolt`, `paladinSunwardDisc`), `src/ui/combat_sfx.ts` e identificadores `DamageEvent.abilityId`. Reutilizar renderer, clips y audio originales donde sean compatibles; NO inventar shaders que penalicen WebGL S23.
- El VFX sólo representa eventos confirmados por Sim. No animar un impacto cuando la habilidad falló por distancia, línea de visión, coste, bloqueo de objetivo o enfriamiento.
- Combos 1–2–3 y cuarto golpe elemental por gema son contexto de combate HIGHFLY separado; estas diez skills no deben alterar automáticamente el conteo del combo.
- No alterar `Rig_Medium`, animaciones ClaudeCraft, sockets, guardados persistentes, clase o equipo mientras se añaden cues visuales.
- Nunca sumar STR, AGI, VIT, PER o INT permanentes mediante skill/VFX/equipo.
- Mantener `VITE_HIGHFLY_SF4` opt-in y GitHub Pages sin cambios.

## Gates por skill que informará Guine
1. **Mecánica/Sim:** efecto real y coste/rango/cooldown con distintos niveles.
2. **HUD:** botón enlazado, aprendizaje, target, cooldown y mensaje de error legales.
3. **VFX/audio:** inspectores visuales o capturas automáticas con tiempos de cast, impacto, pulso y desaparición.
4. **Dispositivo físico:** revisión humana sobre S23 Ultra horizontal para ergonomía, carga, FPS, latencia, escala y espectacularidad.

No se marca **VFX GREEN** hasta superar 3; no se marca **S23 físico GREEN** sin 4. Al redactar: `[clase] skill: mecánica ✅; HUD ✅/pendiente; VFX pendiente; S23 pendiente`.
