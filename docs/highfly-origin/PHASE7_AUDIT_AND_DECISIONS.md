# HIGHFLY ORIGIN — F7.1A baseline / source audit (21 Oct 2026)

## Change boundary
- Work branch: `highfly-origin-unified-app-lab99-20261020`. No merge to `main` or Pages release.
- User approved F7.1A after the Phase 7 audit. Runtime remains the one ClaudeCraft Sim.
- No changes to original Draken save keys, DrakenLAB level, mana/stamina meters, Monster/Item registries, economic rewards, XP, or public service worker.
- The original ClaudeCraft upstream stays frozen to `9b57e49c9676d75962700f828cc00a50a9a988b5`.

## Completed source-level findings and actions
1. **Portrait:** native circular canvas is `#pf-portrait`; headshot pixels can be lifted/overscanned within this disc without moving the frame, level marker, HP, MP or ST. A new pure F7 function enables a small reversible crop only for the unified player's canvas. Physical S23 screenshot check is REQUIRED before marking visual polish complete.
2. **S4:** `index.html` has exactly four `.mobile-action-slot` buttons with indices 0–3. Native mobile page model maps centre buttons to slots 1–4; CSS seats button #3 on the fourth position. This rules out a missing DOM slot. If visually absent on S23, inspect the actual computed CSS, overlap, gesture, bindings and on-screen viewport before changing visibility logic. Three UNIQUE abilities remain undisclosed until learned; do not add any visible reserved slots.
3. **Loot/movement:** `src/game/autoloot.ts` is a best-effort proximity scan calling the authoritative `world.autoLoot(id)` command; it does not directly write movement speed or animation. This does NOT rule out a stall inside the native loot/interaction result path, bag refresh or render synchronisation. Reproduce on physical S23 with walk-by auto-loot ON/OFF, while moving and when bags are full; capture timings before changing combat locomotion.
4. **Catalog:** `scripts/highfly_origin_content_census.mjs` records actual merged native item, monster, ability, recipe, NPC, quest and zone registries; outputs JSON and independent WORLD/LAB namespace diagnostics. Counts represent authored definitions, NOT certification of obtainability or physical placement. Future historical donors must be audited separately.
5. **Level authority warning:** native `src/sim/types.ts` has `MAX_LEVEL = 20`. HIGHFLY training core has an intended LV99 cap, but World LV21–99 is NOT certified without extending authoritative XP, save, content gates and world regions.

## Verified donor paths (read only)
- `src/sim/data.ts` merges live native items, mobs, NPCs, quests and zones.
- `src/sim/content/recipes.ts` exports `ALL_RECIPES`; `src/sim/content/professions.ts` exposes five gathering and ten crafting disciplines.
- Historical monsters: `highfly-monsters-p02i-v4-integration-handoff` contains 64 normal LV21–99 definitions and 16 elites/captains in an isolated preview, not integrated into the current world.
- Historical GOLDEN: `highfly-golden-dev7-lv99-endgame-native-gate` holds 15 weapon entries LV50/60/70/80/90, 3 LV35 and 9 chest armor entries LV50/70/90; these have legacy class gates and are DEV-only.
- Historical V14: `highfly-v14-original-skills-supreme` indexes 90 original native skills across nine schools, not 90 free or verified WORLD acquisitions.
- Historical professions: `highfly-professions-pr13-gathering-knowledge` has knowledge/evidence extensions; native crafting remains authoritative.

## Gates
- `node scripts/highfly_origin_content_census.mjs --check --out=...`
- `tests/highfly_origin_f7_baseline.test.ts` and existing UNIFIED save/F2.7 regressions in NO-DEPLOY workflow.
- Full TypeScript and WebGL browser smoke; physical Samsung S23 Ultra input, portraits, S4 and loot still require human acceptance.
- A GREEN automated run is NOT a certification of Android thermals or real-device interaction.

## After F7.1A
Export content provenance by acquisition source, then approve LV21–99 authoritative progression contract before adding LV21+ gameplay. No wholesale historical branch merge; recover selected records with their SHA and native validation. Preserve one app, two explicitly isolated modes and four normal visible action slots.
