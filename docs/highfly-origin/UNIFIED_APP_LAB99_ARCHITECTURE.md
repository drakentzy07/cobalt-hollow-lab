# HIGHFLY ORIGIN — UNA APP, DOS MODOS (20/10/2026)
Status: architecture/guardrail committed on an isolated F2.7-based branch; **NOT connected to the launcher, NOT released, NOT validated on device**.

## Product decision
- One codebase / one installed PWA or APK / one public app release / one in-game world / one Sim and one combat implementation.
- Entry menu: **Entrar al mundo — Draken** and **Entrar al laboratorio — DrakenLAB (LV99)**.
- Same world, map, HUD layout, character appearance/rendering and combat logic. Different progression/save identities.
- **Draken**: true Hunter progression 1–99; weapons, mastery/skill training, real fitness stats, XP, quests, inventory, deaths. No debug benefits.
- **DrakenLAB**: independent level-99 test session; cloned *appearance* as optional initial snapshot, access to authored skills for testing, four assignable ordinary skills, hidden unique skills until explicitly under test, rapid reset/teleport/heal/debug controls. Do not copy back lab inventory/XP/stats/progress to Draken.
- Lab level 99 is a genuine test-profile level, not merely a UI label or a four-skill learnLevel=1 bypass.
- Do not name every public link/release F2.6.3/F2.7. Those are historical source tags, not game modes.

## Verified source facts / why this is needed
- F2.7 uses the route `/cobalt-hollow-lab/lab/f27-combat-beta/` to enable selected combat code, HUD, preview skills, and an isolated IndexedDB. See `src/highfly/origin/f1_world_ui.ts`, `src/game/highfly_offline_save.ts`, `src/main.ts`, `src/ui/hud.ts`.
- Preview technique array: Fireball, Sinister Strike (Wicked Slash), highfly_blade_rush and Meteor. Its `learnLevel:1` override is *transient*; it does not make the existing Hunter LV99.
- The trainer in `src/highfly/origin/f1_core.ts` still has real level/copper gates. Keep normal progression unchanged.
- F2.7 is an additive Pages deployment. Existing lab URLs are not an authoritative single app.
- F2.7 changes include the real Sim, native abilities, `src/render/characters/highfly_combat_presentation.ts`, aim + collision logic. No separate lab combat engine should be created.
- The 4-slot HUD, target/cancel control and the baseline F2.6.3 Fireball behavior are regression requirements.
- Production Draken's *existing* storage keys are `highfly-offline` / `origin-f1:primary` / `highfly.origin.primary.v1`. These MUST NOT change, reset, or be implicitly migrated.
- Current beta auto-import of previous beta local mirrors is unsuitable for unified WORLD/LAB mode; leave historical labs read-only, migrate only via explicit reviewed copy flow.

## Implementation plan (NOT YET IMPLEMENTED)
1. Mode chooser in the existing `src/main.ts` launcher. Carry an explicit typed mode from selection all the way into `startOffline` / game construction. Default to WORLD, never infer developer privileges from character name. Do not duplicate Sim, map, runtime or installed app.
2. Save isolation: wire `src/highfly/origin/unified_mode.ts` contract into all `loadOriginHunterSave` / `loadHighflyTrainingProfile` / `writeHighflyOfflineSave` / `installHighflyOfflineAutosave` / `resetOriginHunterSave` paths, including both IndexedDB and synchronous localStorage mirror. Do not use a process-global mutable mode in async saves. Prefer a mode-specific instance/context per session. WORLD continues to read existing keys; LAB uses new keys. Audit retained class/name training identity. Back up Draken save before migration.
3. Reuse native Hunter constructor & same map in `startOffline` with an isolated LAB profile initialized to **genuine level 99** and compatible XP/stats/HP/MP/ST; do not simply assign `sim.player.level = 99` without reconciling character progression. LAB resets must not call world reset.
4. Replace `location.pathname.startsWith('/.../f27.../')` and inherited F2.x gates with one explicit runtime capability set / mode + certified combat feature state. Inspect all F2.7-refactored files, including `src/main.ts`, `src/highfly/origin/f1_world_ui.ts`, `src/game/highfly_offline_save.ts`, `src/ui/hud.ts`, `src/ui/hud/action_bar/mobile_action_ring_controller.ts`, `src/highfly/game_c1_runtime.ts`, `src/render`, `src/sim`, `src/styles/hud.css`.
5. Skills: both modes use the exact same Sim cast/effects/hit/cancel/movement logic. Draken honors unlock, mana, stamina and progression gates. LAB is level 99 with test access to the authored/verified skill registry; allow selecting any 4 base skills from a scrollable *catalogue*, never place 63/77 new controls on Android HUD. Hidden 3 special slots remain hidden in normal play. Preserve manual ATK distinct from USAR, camera/joystick multitouch, auto-target, ground telegraphs and aim cancel.
6. Regression fixes from user's Samsung S23: integrated HP/MP/ST portrait; no doubled bars; aim slot 1 camera twist; Fireball hit/aim/cancel; Blade Rush aim in air; strongest legacy 4-step physical basic combo recovered with no sliding/teleport and real contact timing. Keep working Meteor and current F2.7 skills.
7. Remove user-facing beta/version sprawl **only after** end-to-end world/lab GREEN. Keep branch/tags/history for rollback and debugging. Publish ONE release path to public Pages / Android app, keeping main untouched until certified.

## Acceptance tests / release gates
- Original Draken opens with original level, position, equipment, world and learned skills. No unexpected level 18/99; user can still level/train normally.
- DrakenLAB opens LV99, spawns same world, loads its own save, remains LV99 on restart, can equip/select four different trial skills without unlocking through level 18.
- Starting/reseting/dying/purchasing/learning/levelling/saving in LAB **never** changes Draken's saved snapshot; restarting WORLD returns byte-for-byte equivalent semantically except genuine actions made in WORLD.
- Source tests for all save identities, backup/read-only migration, no cross-mode writes and no shared autosave closure.
- Four-slot mobile HUD identical in both; ordinary skill 1–4 casting and cancelling, no hidden special placeholders. Each skill uses real resource cost, cooldown and contact in WORLD. LAB test-only overrides do not leak.
- Same Android input stack: joystick left, free camera right, multitouch skill drag and cancel, jump/double flip/dash and ATK/USAR separated, camera not jumping after first skill.
- HP/MP/ST always visible and correctly aligned after HUD remount, respawn and reload.
- No duplicate Sim, doubled damage, second renderer or second game mode build.
- Automated Vitest/typecheck/build then Samsung S23 Ultra landscape hands-on acceptance. CI GREEN is necessary but insufficient for real feel.
- Only then publish or merge to `main`; keep rollback reference to previous working site.

## Current first commit scope
- Introduced pure save-mode contract `src/highfly/origin/unified_mode.ts` and isolation-focused Vitest tests. These do not activate a laboratory or alter any gameplay, route, database or public Pages.
- Further wiring, skill catalogue, LV99 character initialization and real S23 validation are **pending**.
