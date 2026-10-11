# HIGHFLY · GOLDEN PLAY LIVE + PREMIUM EXPANSION MASTER · 2026-10-11

## FUENTES DE VERDAD
- Repositorio EXCLUSIVO `drakentzy07/cobalt-hollow-lab`; NEXUS excluido completamente.
- Donante ClaudeCraft v0.44.0 congelado en `9b57e49c9676d75962700f828cc00a50a9a988b5`. Un `Sim` original, un Hunter y un juego de guardados con migración.
- GOLDEN: joystick 360°, cámara táctil independiente, movimientos, HUD, combo, entrenamiento y controles probados.
- **PLAY V4-03 PUBLICADO**: https://drakentzy07.github.io/cobalt-hollow-lab/v4-03-preview/ — despliegue y HTTP QA GREEN #38163605895. V4-02 se preserva.
- **PLAY V4-03.1 CANDIDATO** P13: 15 armas + 15 recetas nuevas nativas, CI GREEN #38165622295, **NO PUBLICADO**.
- **DEV** `highfly-dev-main`: full 227 recipes / 99 levels catalog, P14 gem-socket compatibility, CI GREEN #38165998218. Contenido futuro NO publicado automáticamente.

## MATRIZ DE ACTUAL Y EXPANSIONES PREMIUM

### Combat, clase, habilidades (LIVE)
- Original 9 clases: Warrior, Paladin, Hunter, Rogue, Priest, Shaman, Mage, Warlock, Druid. Un solo Hunter.
- Ataque normal combo 1–2–3, gem elemental 4º golpe; skills originales. HUD GOLDEN 2 filas y slots editables.
- FUTURO DEV: progresión BASE → EVO → MUTACIÓN → ÚNICA → ÚNICA MUTADA; ÚNICAS agregan slot y tienen condiciones medibles (mastery/rango/encuentro/logro), no regalan Stats.
- Referencias de 14 ÚNICAS a diseñar SIN copiar assets/animaciones/música propietarios: Guinevere, Kadita, Saber, Lancelot, Pharsa, Hayabusa, Dyrroth, Vexana, Arlott, Phoveus, Yu Zhong, Harith, Tigreal, Nana.
- Pruebas: animación/rig compatible, rango, cooldown, esquiva/parry, target nearest/lowestHP, CC, movilidad 360° y S23 físico.

### Training y progresión (LIVE/CI)
- PF6 normal 1–99, rango F→E→D→C→B→A→S→Nacional, Training Core STR/AGI/VIT/PER/INT que evolucionan SOLO con ejercicio real, independientes de equipamiento y skill tree.
- Futuro: periodización 3+1, RM/e1RM, planes 1/3/6/9/12/36 meses, compatibilidad de sesiones reales y perfiles antiguos, recomendación de entrenamiento sin adjudicar Stats por gear.
- Extended 100+ sigue APAGADO. No confundir habilidad profesional 125 con nivel Hunter 125.

### Profesiones, recetas, equipo
- LIVE: ClaudeCraft nativo + PR1–PR13, gemas PR14–PR16; todos los oficios oficiales se preservan, skill de profesión 0–125 separado del nivel de Hunter.
- LIVE: 212 entradas de recetas. DEV P13/PLAY 4.03.1 candidato: 227 entradas (212+15).
- P13 cinco bandas LV50,60,70,80,90 × tres track WAR/SCOUT/CASTER, una arma fabricada por receta, `weaponcrafting`, forge nativa, trainer nominal.
- Detalle exacto (cada fila representa los materiales POR UNA de las tres recetas del mismo nivel):
  - LV50 skillReq75 uncommon: rough_hide×5, arcane_essence×3, smithing_flux×3; WAR 18–28, SCOUT 15–25, CASTER 18–28 + spellPower10.
  - LV60 skillReq85 rare: sharp_claw×5, curved_tusk×5, smithing_flux×3; WAR 22–34, SCOUT 17–29, CASTER 22–34 + spellPower12.
  - LV70 skillReq95 rare: spider_silk×8, arcane_essence×7, smithing_flux×5; WAR 25–39, SCOUT 20–34, CASTER 25–39 + spellPower14.
  - LV80 skillReq110 epic: arcane_shard×3, sharp_claw×9, smithing_flux×6; WAR 29–45, SCOUT 23–39, CASTER 29–45 + spellPower16.
  - LV90 skillReq125 epic: arcane_shard×7, arcane_essence×12, smithing_flux×8; WAR 32–50, SCOUT 26–44, CASTER 32–50 + spellPower18.
- WARRIOR/PALADIN/SHAMAN equip track WAR, HUNTER/ROGUE SCOUT, MAGE/PRIEST/WARLOCK/DRUID CASTER. Native specialization may discount reagents.
- IMPORTANT: native `skillReq` is NOT enforced as a strict admission condition by all donor craft code; trainer availability is NOT yet universally reachable. Before declaring P13 player-ready, test actual NPC train/skill gate/UI/forge/legitimate-materials and preserve character inventory/equipment save. One tested craft at LV50 in CI is NOT 15 full natural playthroughs.
- Expansion priority: follow item/material sink chain, add meaningful weapon/armor/consumable tier options across 11 level bands including level 99 reward, avoid mass duplicates and infinite copper markets; keep gear bonuses secondary combat ratings, never Training STR/AGI/VIT/PER/INT.

### Gemas (LIVE + DEV P14)
- LIVE fire/frost/lightning craft+inlay, one native gem socket on an actual weapon, item consumed on inlay, 4th elemental basic attack unlocked, persistence. Three present; new gem types not deployed.
- DEV P14 foundation test GREEN #38165998218 confirms those invariants and unchanged Training/XP/professions after inlay/save.
- FUTURE: five grades of each original element as craft/upgrade recipes, gated legal mats and profession, CC/DoT/resistance tuning, VFX mobile; optional secondary attribute gems (crit, armor penetration, shield/tenacity) must use dedicated future slot rules and NO permanent primary stat grants.
- Affinity one element initially, multiple elements only very high achievement/cost and separate release.

### Monstruos/loot
- LIVE LV1–20 donor preserved + 64 HIGHFLY normal templates LV21–99 and 16 elite/captain opt-in templates (8+8). Not 80 distinct model assets.
- LIVE native corpse/rewards/material→inventory→native recipe→equipment→gem→ATK4 and save (E2E test used fixture supplies for items not farmed).
- FUTURE: real gameplay drops for all recipe bands, better elite patterns and loot identity, resource families, normalized power vs nine classes; 5 legendary unique monsters reserved for later separate update.
- Reject simple same mob +HP only; add animation anticipation, counterplay and authored scenario tied to reward context without duplicating `Sim`, inventory or RNG.

### WORLD
- LIVE original ClaudeCraft city/terrain, eight tier portals/expeditions LV21–99 and 16 outdoor camp overlays (32 bounded mobs). Native dungeon 6 normal+1 elite+1 captain under ENABLED challenge flag.
- P02I has eight visually themed biomes only in isolated MONSTER LAB: haunt, marsh, peaks, frost, volcano, garden, gale, cave. Do NOT claim eight artistic levels are LIVE.
- FUTURE: instance-specific territory palettes, <=12 props/biome, 8 enemies/instance, collision/navmesh/fog/weather no extra >budget GLB, walk/exit/portal S23 stable; forja and town interiors as separate content.

### Guardado/publicación
- LIVE GOLDEN PLAY uses `highfly-play` save namespace and read-only legacy fallback; V4-02 remains accessible. Cross-browser real old Hunter migration and export/import still pending, so BACKUP before destructive edits.
- `highfly-dev-main` is development of later features, `highfly-play-v403-release-candidate` stable shipping. QA→release candidate→full-site-preservation→main Pages; SHA and HTTP verify old paths.
- P14-18 upgrades MUST NOT be assumed live by a GREEN headless test. S23 physical FPS/loading/temperature test pending.

## ROADMAP PREMIUM RECOMMENDED
- **4.03 (NOW LIVE)**: eight dungeon tiers, 80 HIGHFLY monster variants, 16 camps, core Training/professions/gems/ATK4/loot/Hunter.
- **4.03.1 (NEXT)**: P13 15 weapon recipes, strict trainer/recipe/skill gates + inventory persistence and real-world materials, full-site preservation, physical QA.
- **4.04**: refine professions 0–125 and native economy 1–99; source→recipe→craft→equip on every band, item and gem tier upgrade, transparent tooltips.
- **4.05**: monster AI, 8 full themed biomes, loot/rank balance and 9 class combat, real-world device QA.
- **4.06**: EVO/mutation skills and class-specific mastery, opt-in new effects; original skill trees intact.
- **4.07+**: five unique legendary boss encounters, premium modular skins as separate optional updates; no 100+ without closed 99 balance.
- **Extended 100+**: separate explicit future cap/rank/save/content-contract; currently disabled.

## RELEASE QA ONE-LINER REQUIRED IN EVERY CHANGELOG
"RUN CI | version Published vs Candidate vs DEV | player-accessible link verified HTTP | What to see physically | Original systems preserved | Natural progression verified? | Offline saved game migration verified? | Limitations / next patch".
