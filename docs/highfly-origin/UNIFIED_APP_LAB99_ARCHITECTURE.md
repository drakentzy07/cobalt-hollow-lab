# HIGHFLY ORIGIN — UNA APP, DOS MODOS + MACRO (20 octubre 2026)
**Status (20 Oct):** UNIFIED 01 launcher, isolated WORLD/LAB saves and native F2.7 four-skill runtime ARE WIRED AND GREEN in automated TypeScript, Vitest, full WebGL build and Chromium touch E2E; **NOT DEPLOYED / NOT YET VERIFIED ON PHYSICAL S23**. Evidence: [UNIFIED_01_RUN_RECEIPT.md](./UNIFIED_01_RUN_RECEIPT.md) / [GitHub Actions RUN #39517223542](https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/39517223542). Additional skill/equipment/loot catalogue and combat polish still pending.
**Branch historical name:** highfly-origin-unified-app-lab99-20261020 (do not create a new branch just to rename). **LATEST PRODUCT DECISION: DrakenLAB begins at LV1, NOT LV99.**

## Product decision — one game, no lab-version explosion
- ONE installed app, ONE world/Sim/combat/camera/render pipeline, ONE ongoing working branch with short checkpoint commits and rollback tags; production `main` stays protected until tested.
- Two game entry modes: **Entrar al mundo — Draken** (authentic XP, level 1–99, fitness Training, weapons, armor, acquired abilities, inventory, loot and persistent world) and **Entrar al laboratorio — DrakenLAB LV1** (content-test access bypass, same original mechanics/level-1 baseline, independent save).
- Both use the *same* original authored abilities, loot, models, equipment, environments and combat; no second skill engine and no separate URL-per-feature.
- **Lab LV1 is not a powerful character and has NO level/stat=99 override.** It can *preview* a high-level skill/armor/recipe/material at LV1 via explicit test access; item/spell metadata and canonical level requirements remain unchanged. In WORLD these requirements continue to apply.
- Preview access is never a global `learnLevel=1` rewrite or irreversible object modification. Implement using explicit `mode==='lab'` checks at an isolated preview access layer, with real native collision, damage, cost and cooldown rules downstream; explain when a skill requires unavailable gear/sockets/animation and provide safe test fixtures.
- Testing monsters LV90 as LV1 may one-shot the tester. Provide optional, lab-only invulnerability/HP-refill/dummy or effective combat-level tuning rather than forcing level-99 stats. Always test authentic level balance separately in WORLD / representative fixtures.
- Lab can summon/select objects and trial skills with four assignable active buttons, keeping three unique abilities hidden except for explicit special test. Do not grant a world acquisition record, economic rewards, real mastery or TRAINING credits.
- WORLD and LAB use independent IndexedDB/localStorage namespaces; do not copy XP, inventory, purchases, training profile, item grants, quests, deaths or camera/HUD settings across modes without opt-in. Appearance-only copy may be optionally offered once. The original Draken save keys must remain exactly as-is.

## Verified source/risks
- Branch F2.7 descends from F2.6.3 and retains native movement, aiming, meteor, blade rush and four-slot mobile skill HUD. They are not two separate games to wholesale merge.
- F2.7 still uses path checks `/lab/f27-combat-beta/` inside `src/main.ts`, `src/highfly/origin/f1_world_ui.ts`, `src/ui/hud.ts`, `src/ui/hud/action_bar/mobile_action_ring_controller.ts`, `src/highfly/game_c1_runtime.ts` and `src/game/highfly_offline_save.ts`, activating trial skills and different saves. Replace those with one explicit mode/capability contract and one certified combat runtime.
- Example existing F2.7 preview: `fireball`, `sinister_strike`, `highfly_blade_rush`, `meteor` transiently override `learnLevel:1` while unmodified normal trainer has genuine copper/level gates. Use the concept only in LAB, never write modified levels to the source registry.
- Existing F1 Draken save identity: DB `highfly-offline`; IDB slot `origin-f1:primary`; mirror `highfly.origin.primary.v1`. Legacy saves and training remain untouched; historical beta import is not an automatic migration source.
- Some equipment gates also check class, weapon types, animations or tier; level-bypass alone cannot guarantee all high-level gear can equip. Audit the actual `canEquip`, trainer, loot and item grant callsites and use explicit lab fixtures; keep the Universal Hunter compatibility carrier private.
- Preserve F2.6.3 Fireball behavior if F2.7 regresses; preserve Meteor, Blade Rush, camera-relative movement, ATK separated from USAR. Fix first-skill camera twist, HP/MP/ST layout, cancel, 4-step physical combo skating on S23.

## Execution stages on SAME working branch
1. **Unified launcher + save**: add two clear entry choices; pass explicit mode into session creation and isolated mode-aware save/training/autosave/reset services. Default to WORLD when missing/invalid. Migration is backup + opt-in, no silent copies. Test resetting LAB never modifies WORLD. Gate debug/test menus to offline LAB only.
2. **Combat runtime integration**: remove path-bound feature logic; make F2.7 gameplay/HUD available to both WORLD and LAB; restore best F2.6.3 basics, fix resource portrait and Android targeting. Keep same authoritative native Sim.
3. **Universal test catalogue**: LAB previews all verified registered skills, armor, weapons, loot/recipes (and later monsters/scenery) at LV1; keep four equipable skills and native costs/damage, no acquisition progress. Validate every family with actual test/visual checks; new content is not automatically declared certified just because access works.
4. **Vertical playable loop**: Draken explores, kills native monster + elite, receives real loot and XP, equips items, crafts one recipe, completes one quest, autosaves and reloads.
5. **Content expansion**: audit/rescue existing HIGHFLY 9-school skills / 64 normals + 16 elites / territories / loot recipes / modular armor + Rig_Medium / professions, integrating subsets into one live world/Sim; no mass cherry-picks or parallel gameplay engines.
6. **Living world**: merchant/trainer/crafter NPC roles and routines, quests, interiors, taverns/food/drink; then guilds, dungeons/bosses and co-op 5–10 on a verified backend, not GitHub Pages alone.

## Medieval map / RG Poly risk policy
- **DO NOT REPLACE THE MAP OR THE TERRAIN NOW.** World topology, walkable paths, navmesh equivalents, colliders, portals, spawn, quests and Save positions remain authoritative in the original ClaudeCraft world.
- Inspect the exact RG Poly Medieval asset package and license/export rights first. Unity-specific prefabs/materials require explicit translation to Three.js/WebGL-compatible assets; no assumptions about licensing or topology. Material/LOD/batching/performance controls are necessary on Samsung S23 Ultra.
- First pilot is **one opt-in medieval blacksmith area / interior** layered visually onto an existing safe world location. Keep original terrain and NPC paths. Validate collisions, culling, texture memory, lightmap/shadow budgets, interactable hitboxes, day/night, loading and reload. Use feature flag and rollback.
- Second pilot tavern and town decorations only after blacksmith works. Whole-region map revisions and new geometry are independent controlled change proposals with waypoint/spawn and progression-save migration.
- No blanket overwrites of environment/maps. Use additive props/decor and hide/disable flag for rollback. A CI GREEN alone is insufficient for real FPS/heat/input reliability.

## Acceptance gates
- WORLD Draken exact original level/XP/location/inventory/equipment/learned skills/Training restored; no lab privileges and no changed requirement.
- LAB starts at level 1 with ordinary level-1 combat baseline; previews Meteor/high-tier armor/loot without raising player level or changing canonical `learnLevel` / equip required levels. Reload and reset affect LAB only.
- Positive tests (LAB trials work) and negative tests (WORLD denies same preview and level gates) + valid object/weapon/rig/cooldown/resource/hit checks.
- Same 4-slot Android combat HUD and no duplicate renderer/Sim/HP bars; ATK and USAR separated; S23 Ultra landscape free cam, joystick multitouch, jump/dash/flip, aiming/cancel and performance verified.
- Lab-only high-level monster invulnerability or balance controls do not affect WORLD, co-op or backend.
- One public Pages/Android app after passing tests, build, real device and human sign-off. No deploy or merge to main before that.

## Scope already committed
- Pure mode/save contract: `src/highfly/origin/unified_mode.ts`, including `highflyMeetsContentLevelGate` and `highflyCanPreviewContent` helpers.
- Test assertions: `tests/highfly_origin_unified_mode_contract.test.ts` for no 99 stat override, namespace isolation and LV1 access to high-level preview in LAB only.
- These two pieces do NOT yet wire menus, databases, content grants or runtime, and have NOT been run in CI.
