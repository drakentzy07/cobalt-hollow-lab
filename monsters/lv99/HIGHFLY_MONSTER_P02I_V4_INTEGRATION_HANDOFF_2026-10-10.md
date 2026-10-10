# HIGHFLY — Monster & Loot PASS 02-I — ENTREGA TÉCNICA PARA V4
**Estado comprobado 10/10/2026:** FOUNDATION MONSTRUOS GREEN + MONSTER LAB PAGES DEPLOY GREEN. **No está incorporado al mundo persistente V4.**

## Referencias inmutables por SHA
- Código funcional PASS 02-I: `e6f59079fdc3f278ef041fbc8354ca837aee42ab` (RUN `38086684125` 60/60, SUCCESS). Rama de resguardo: `highfly-monsters-p02i-functional-freeze-green-20261010`.
- Publicación PASS 02-I en GitHub Pages: `07e10ccc815f6ff0a1243c283dcab1d2cd00e300` (RUN `38086943612` 23/23 composición + 3/3 deploy, SUCCESS). Rama de resguardo: `highfly-monsters-p02i-pages-freeze-green-20261010`.
- URL aislada: https://drakentzy07.github.io/cobalt-hollow-lab/monster-lab/hunts.html
- Donor ClaudeCraft congelado: `levy-street/world-of-claudecraft@9b57e49c9676d75962700f828cc00a50a9a988b5`.
- El compositor verificó 7017 archivos existentes de ROOT + V4 + medios preservados bit a bit (SHA-256); sustituyó únicamente el subárbol previo `/monster-lab/` (4858 archivos), reutilizó 1838 assets media y agregó cero assets a `/media/`.
- P02-I fuente artefacto: `HIGHFLY-MONSTER-P02I-PAGES-SUBPATH-NO-DEPLOY` (RUN 38086684125). Paquete Pages publicado: RUN 38086943612.

## Ocho instancias + su población móvil
| LV | Zona | Bioma de render | Cuatro familias |
|---|---|---|---|
| 21–29 | Umbral de los Aullidos | haunt | wolf, spider, skeleton, stalker |
| 30–39 | Marisma del Velo | marsh | spider, wolf, revenant, elemental |
| 40–49 | Desfiladero Colmillo | peaks | ogre, stalker, skeleton, elemental |
| 50–59 | Tundra del Silencio | frost | wolf, stalker, revenant, elemental |
| 60–69 | Yermo de las Escamas | volcano | dragonkin, ogre, elemental, revenant |
| 70–79 | Jardín Marchito | garden | spider, wolf, elemental, revenant |
| 80–89 | Cresta del Trueno | gale | elemental, dragonkin, ogre, stalker |
| 90–99 | Orilla del Abismo | cave | dragonkin, revenant, skeleton, ogre |

Estas son instancias de cacería, NO ocho mundos abiertos completos, NO 80 modelos visuales diferentes y NO dungeons con arquitectura completa. Mismo terreno/estructura base: plataforma seca nivelada + cinco colinas suaves, camino nativo de 4 rutas, 12 props GLB y pequeños ambientadores según zona. Se corrigió la paleta cercana y lejana, evitando el suelo blanco común a todos los niveles. Los combates siguen usando máximo 8 entidades simultáneas en los cuatro campamentos.

## Monstruos, enfrentamientos, loot
- 64 plantillas normales (8 familias × 8 rangos).
- 16 variantes especiales: 8 élites + 8 capitanes. Elección excluyente `normal/elite/captain`; sustituyen un normal, sin superar 8 enemigos activos.
- Capitanes: spell telegrafiado, enrage leve; se apoyan en AI, animaciones, daño, skills, cadáveres, monedas y RNG nativos. NO son los cinco bosses especiales diseñados fuera de este laboratorio.
- Loot: **tablas nativas del donor más UNA fila opcional de reactivo por mob**, ítems existentes del donor y recetas existentes verificadas; probabilidad añadida del 2% al 18%; no garantizada. Respeta distancia de recogida, propiedad de cadáver, inventario, auto-loot y crafting original; no crear inventario paralelo ni loot gratis.
- Reactivos incluyen rough_hide, spider_silk, homespun_cloth, curved_tusk, sharp_claw, arcane_dust, arcane_essence, arcane_shard (según familia y nivel).
- Hunter de prueba: LV asignado automáticamente al inicio de la instancia y vida máxima temporal ×3 SOLO en el preview para permitir experimentar combate/saqueo. **NO** concede STR, AGI, VIT, PER, INT; no cambia Training Core, XP, guardados persistentes, economía ni equipo.

## Evidencia de calidad y límites reales
- Todos los tests originales de crafting, Training y profesiones indicados por el pipeline, más 8 instancias/biomas, elites, loot, reglas de colisión y rutas: GREEN.
- Chromium emulando Galaxy S23 Ultra verificó 8/8 regiones, cámara X/Y, joystick, 10 slots HUD y ausencia de assets 404.
- **RENDIMIENTO FÍSICO NO VALIDADO**. Chromium de GitHub Actions reportó medianas de ~2–5 FPS con WebGL por software en el corredor emulado: NO extrapolar a los FPS reales del Samsung. Los jobs se consideraron GREEN porque la puerta actual solo detecta stalls >2s; eso NO significa 30 FPS reales. El usuario reportó lentitud espacial lejos del fuego en el S23.
- PASS 02-J es un micro-laboratorio diagnóstico separado: panel voluntario `?hfPerf=1`, FPS reales del teléfono + p95 + tirones. NO pertenece al freeze 02-I y solo se promueve tras Chrome y SHA256 GREEN. Registrar 2 capturas de la misma zona: cerca del fuego y alejándose; 1 sesión LV21, 1 sesión LV50, 1 sesión LV90.
- No afirmar "visual premium", biomas arquitectónicamente completos, rendimiento móvil 100%, botín visible en S23 o integración V4 hasta que haya evidencia humana.

## Integración futura a V4 (NO IMPLEMENTADA, gated)
1. **Preservar sin cambios:** raíz Pages, `/v4-02/`, joystick GOLDEN, skill combo 1-2-3 y gema 4°, training STR/AGI/VIT/PER/INT, nivel 1–99, Clase+Subclase, profesiones/forja; las rutas V4 no leen este preview. No hacer merge directo de laboratorios al main.
2. Tomar solo interfaces verificadas de `highfly_hunt_scenarios`, `highfly_monster_content`, `highfly_hunt_rewards`, `highfly_hunt_encounters` y `WorldContent`. Reutilizar AI, mobs, RNG, cadáver, y Sockets nativos. Evitar redefinición duplicada de `MOBS`, `ITEMS`, `ALL_RECIPES`, `Level`.
3. Mantener escenario LV1–20 y donor original; conectar LV21–99 a un **gestor único** de instancias con acceso por rango/nivel y retorno explícito al mundo persistente, NO por cambiar la posición del player de ensayo ni creando un segundo Hunter.
4. Guardado: solo el Hunter persistente V4 recibe XP/loot real al regresar (lo que decida diseño económico); el "HuntPilot" temporal ×3 HP debe excluirse de builds persistentes. Prohibir el hack `?hfHunt=` en la V4 pública.
5. Portales y mapa global: diseñar entrada física accesible, retorno, desconexión/muerte, validación nav/agua para cada zona, caída/cap de FPS en S23, loot→Bolsa→receta→herrería y reproducción 360°/combate; test de carga de nivel y ausencia de duplicados.
6. Más tarde integrar cinco bosses legendarios y skins/GLB nuevos con licencias y animación compatibles; assets nuevos siempre pasan auditoría real de rig/colliders/LOD en Android.
7. Exigir run premerge GREEN, comparación SHA de root/V4 antes/después, una sesión real física S23, y solo después crear PR de integración con rollback.

## Alcance de esta entrega
Esta rama/documento es una **entrega de interfaces y checklist**, no un merge, no un deploy y no una declaración de rendimiento aprobado. Los dos SHA de freeze anteriores son las referencias únicas de código y sitio ya validadas. Al continuar la integración en otro chat, enlazar este archivo y esos dos SHA en lugar de reconstruir el bestiario desde cero.
