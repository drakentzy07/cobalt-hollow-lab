# HIGHFLY GOLDEN PLAY · V4-03 publicada → V4-03.1 EQUIPAMIENTO NATIVO
**Fecha:** 2026-10-11. **ÚNICO repositorio:** drakentzy07/cobalt-hollow-lab. NEXUS PROHIBIDO.

## LIVE YA JUGABLE V4-03
**Link** https://drakentzy07.github.io/cobalt-hollow-lab/v4-03-preview/  
**Proof** https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38163605895 (GREEN verificación post deploy).  
**Antigua V4-02 conservada** https://drakentzy07.github.io/cobalt-hollow-lab/v4-02/
**Guardado:** `highfly-play` IndexedDB, `highfly.play.primary.v1` localStorage; lectura legacy `highfly-offline` / `highfly.offline.primary.v1` sin escribir sobre ella. Navegador/origen importante: no borrar almacenamiento del sitio. La prueba de compatibilidad en Chrome físico todavía está pendiente.

Qué debería ver al entrar:
- ClaudeCraft donor (v0.44.0 pin) + control GOLDEN: joystick izquierda, cámara derecha, salto, dash, ataque, HUD y menú ES.
- Selección de 9 clases y Hunter persistente, entrenamiento real, un `Sim`, PF6 progresión normal LV1–99 (NO Extended 100+).
- Combate original con tres golpes y gema activa → cuarto ataque Fuego/Hielo/Rayo.
- Profesiones, recolección, recetas originales y extensiones PR1–PR13, gemas PR14–16.
- Mundo donor LV1–20 preservado; ocho portales/expediciones nativas LV21–99 (tier-locked), 16 campamentos y 32 mobs exteriores cuando opt-in; 64 variantes normales + 16 élites/capitanes de Monster Lab reutilizadas como definiciones, NO 80 modelos 3D únicos; opt-in desafíos 6 normales, 1 élite, 1 capitán por dungeon.
- Loot→bolsa/cadáver→forja→gema→ATK4→guardar y recargar, probado con Hunter real en CI. Contenido endgame aún no completamente equilibrado.
- Verificar S23 Ultra horizontal en el dispositivo físico; Chrome emulado no garantiza FPS, visibilidad ni respuesta táctil real.

## PLAY V4-03.1 Release Candidate, NO PUBLICADO
**RUN QA:** https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38165622295  
**Código:** `highfly-play-v403-1-native-equipment-rc`. SOLO recibirá P13 si pasa TypeScript, 9 clases, trainer, craft auténtico, guardado, Chrome y assets.

P13 suma **15 ítems y 15 recetas** al MISMO `ITEMS`, `ALL_RECIPES`, `recipeById`, `resolveTrain`, `resolveCraft` original:
| Nivel Hunter mínimo para equipar | Habilidad de herrería requerida para APRENDER (gate nativo por tier) | 1 arma Guerrero, 1 Explorador, 1 Lanzador por nivel: ingredientes de CADA receta |
| --- | --- | --- |
| 50 | 75 | rough_hide ×5, arcane_essence ×3, smithing_flux ×3 |
| 60 | 85 | sharp_claw ×5, curved_tusk ×5, smithing_flux ×3 |
| 70 | 95 | spider_silk ×8, arcane_essence ×7, smithing_flux ×5 |
| 80 | 110 | arcane_shard ×3, sharp_claw ×9, smithing_flux ×6 |
| 90 | 125 | arcane_shard ×7, arcane_essence ×12, smithing_flux ×8 |

- Warrior/Paladin/Shaman → espada; Hunter/Rogue → daga; Priest/Mage/Warlock/Druid → bastón. Usan modelos y procs nativos. No son 15 modelos 3D nuevos.
- `recipe.acquisition=['trainer']`, estación `forge`. El maestro exige tier de oficio: la receta primero se aprende, luego se fabrica. Cuesta cobre y requiere materiales reales de loot (salvo flux del vendor), no se regala.
- `skillReq` **NO** bloquea de manera universal el acto de fabricar recetas ya aprendidas en ClaudeCraft: la regla de maestría está aplicada en el aprendizaje por `resolveTrain`. Esa diferencia debe explicarse en los tooltips y tests; no inventar un segundo motor de oficio.
- Tres tracks de armas son `soulbound` y `noMarketList` hasta calibración, para evitar mercados/duplicación de cobre. Stats STR/AGI/VIT/PER/INT no pueden aumentar con equipo, habilidades o profesiones, sólo mediante entrenamiento real. Armas dan efectos de combate/equipo normales.
- El test P13 en CI usa XP/ítems/maestría **en FIXTURE** para alcanzar alto nivel; eso no significa que el jugador reciba niveles o recetas gratuitos. Falta probar progresión natural y economía equilibrada hasta LV99.

## Qué queda aún fuera de PLAY y sigue en DEV
Mundo y biomas premium, SKIN LAB/IA 3D, cinco monstruos legendarios especiales, habilidades EVO/MUTACIÓN/ÚNICAS, expansión elemental/otras gemas, atributos derivados de combate, gemas tier LV21–99, balance real XP/9 clases, economía y profesiones de cada tramo, Extended 100+. No confundir "sistemas existentes" con "balance y contenido íntegros en cada nivel".

## Gates de publicación obligatorios
1. CI de P13 GREEN sin regresiones; receta realmente aprende con tier y forja usando `recipeById`.
2. Mismas claves `highfly-play` entre V4-03 y V4-03.1: conservar TODO el Hunter. No reiniciar, no borrar DB ni clonar `Sim`.
3. Reconstruir paquete **completo** de Pages, no una carpeta sola; SHA verificar inicio, V4-02, Monster Lab y si aplica SKIN LAB, mismo WebGL de PLAY; publicación exclusivamente desde workflow main autorizado.
4. Chrome emulado + prueba humano S23 Ultra al abrir el link; nunca declarar rendimiento físico certificado por CI.
5. No publicar DEV features ni Extended hasta terminar gates.
