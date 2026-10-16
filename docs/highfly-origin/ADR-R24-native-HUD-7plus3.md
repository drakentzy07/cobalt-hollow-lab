# HIGHFLY ORIGIN R24 — Native HUD / 7+3 / safe migration
**Status:** PLAN / SOURCE AUDIT ONLY. This document is NOT a build or a deployed feature.
**Base:** GREEN R23 `highfly-origin-r23-multitouch-buffs` run #38839051624; public `/lab/origin-r23/`, deployment #38841562548.

## User-approved visual contract
- ONE persistent Hunter, nine learnable schools, NO permanent class requirement.
- Normal combat: **S1–S7** (7 equipped); future unlocked special/unique: **E1–E3**, initially unavailable. Never auto-promote an ordinary normal skill into a special.
- Support: **B1–B8**, four independent small icon squares at the upper centre and four at lower centre, not a shared panel; original ClaudeCraft ability icons; support buffs are not counted among S1–S7.
- GEM and food retain their original quick-access buttons, look, labels, placement and behavior. Keep joystick-left / aiming-right / multitouch; do not alter GOLDEN.
- When a fullscreen window, professions or a modal opens, game HUD controls must not overlap it nor intercept touches.
- Native mobile `...` menu is the entrance: Hunter → Habilidades → Biblioteca / Aprendizaje / Equipar; no persistent `HUNTER · SKILLS` button obscuring combat.

## Verified code seams (audit R23 and frozen donor)
- `game/c1/highfly_origin_trial_runtime.ts`: `mountOriginTrialTrainer` mounts fixed training launcher at `#hf-origin-training`.
- `game/c1/highfly_origin_r18_loadout.ts`: editor currently labels combat `S1–S10` and supports `B1–B8`, with an 18-slot array.
- `game/c1/highfly_origin_r17_hud.ts` + R20/R21 overlays: native ring slots 1..10; support slots 11..18; commands `set`/`clear`/`learned`/`autopack`; all combat casts go through native Sim.
- `src/game/mobile_controls.ts` (frozen ClaudeCraft donor): `mobile-menu-spellbook` already binds `callbacks.onSpellbook()`, and `buildMobileMenuControl()` constructs the mobile More menu. DO NOT replace or suppress this native callback. Add an Origin-only entry or an Origin tab in the already-open spellbook.
- R23 positioning and live icon changes are applied in `overlays/highfly_origin_r23_multitouch_buffs.py` at build time, not committed as modified upstream game files.
- R23 cast-while-moving uses native `cast_move_gate.ts` shared predicate; preserve it without altering original classes.

## Implement in separate isolated R24 overlay
1. Move Hunter library/trainer/loadout into an Origin-only section opened from native More/spellbook. Use existing onSpellbook callback and menu controls; ensure `...` remains functional for all prior original actions.
2. R24 presentation maps internal slots [1..7] → S1..S7, [8..10] → E1..E3 **only when a genuine eligible special has been unlocked**, [11..18] → B1..B8. All native slot IDs must preserve input mappings and cooldown resolution.
3. No live ordinary skills may be equipped in E1..E3. Locked slots show lock and disabled interaction, not deceptive skill art.
4. Migration: existing R23 R1-7 through R21 saves use 18 native slots, with ordinary learned skills potentially in 8..10. **Never silently delete those placements.** Before a one-time conversion, snapshot all 18 slots, keep ordinary S8–S10 skill IDs in an explicitly named recoverable legacy backup, expose them for manual re-equipping into S1–S7, and do NOT overwrite the original save until validation succeeds. Provide an explicit restore path. Preserve learned IDs, progression, gems, weapon, cooldown state and B1–B8.
5. R24 loadout version and migration must be deterministic/idempotent: reloading twice changes no data. No automatic free grants of special or support skills. No weapon restriction bypass.
6. Remove the floating launcher only after verifying the native menu pathway can always open and close the trainer/editor in Android touch and PC debug. On modal opening, dispose/stop hotbar interactions so no accidental skill casts while interacting with menu.
7. Preserve mobile HUD customization and S23 landscape safe areas. Avoid overlap with camera/target/evade/jump/GEM/food.

## Mandatory gates before any deploy
- R23 manual attack and 4th GEM combo parity; cross-school native VFX, animation, mana/stamina, targeting and zero double casts.
- Native `...` opens Hunter menu, spellbook retains original navigation; no floating Hunter button and no overlapping B1–B8 with any modal.
- Seven normal slots active; three distinct specials locked until earned; support independent.
- Migration of nonempty legacy S8–S10 round-trips losslessly and can be restored; old R23 saved game remains usable. Fresh saves stable after reload and autopack respects 7+3.
- Native pointers: joystick-first / skill-first / dragging; can cast while moving. GOLDEN camera remains untouched.
- Full TypeScript, Vitest, full integrated WebGL S23 Chromium mobile smoke; a new NO DEPLOY run first. Publish `/lab/origin-r24/` as additive sidecar only after GREEN and preserving R23, R21 and all earlier public paths byte-for-byte.

## Explicit deferrals
- No new VFX/copy of MOBA proprietary art; future premium effects remain separate from selection geometry.
- The R23 HUD positions and visual size remain subject to owner physical S23 confirmation. Adjust R24 presentation based on video, not assumption.
