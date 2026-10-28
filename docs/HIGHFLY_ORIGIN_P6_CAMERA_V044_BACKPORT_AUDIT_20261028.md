# P6 Camera backport audit — ClaudeCraft v0.44.0 → HIGHFLY ORIGIN v0.20

Source audited 2026-10-28 (pinned, NOT floating main):
- v0.20.0: `levy-street/world-of-claudecraft@4cedc7fbf49e7179f4c29b3db2d0b2bc5bab3d25`
- v0.44.0: `levy-street/world-of-claudecraft@9b57e49c9676d75962700f828cc00a50a9a988b5`
- v0.44 source code LICENSE = MIT, Levy Street 2026. Preserve copyright/license notice on any copied substantial portion; do NOT transplant unknown project media/assets.

## Confirmed v0.44 camera improvements

1. `src/game/touch_router.ts` (new, 203 lines): `TouchOwnerLedger` + `getTouchOwner` classify movement/combat/camera/aim/menu touches; avoids camera stealing attack and joystick touches. `src/game/mobile_controls.ts` consumes this router (v0.44 ~1292 vs v0.20 831 lines). Priority HIGH; direct relevance to S23 multitouch and FURY.
2. `src/render/camera_boom_core.ts` (new, 107 lines): critically damped follow pivot, separate vertical/horizontal stiffness, bounded leash, teleport snap; smoother jump/landing, less rigid camera. Priority HIGH but needs integration in v0.20 renderer frame camera path (not drop-in CSS).
3. `src/render/camera_feel_core.ts` (new, 163 lines): movement look-ahead, above-running FOV change, landing thump detector. Priority MEDIUM; default extra FOV/trauma effects off until tested for vertigo/motion comfort.
4. `src/render/action_cam_core.ts`: opt-in over-the-shoulder camera, configurable left/right framing, gentle stride-bob and FOV. Priority OPTIONAL; require in-game toggle, initially OFF.
5. `src/game/camera_follow.ts`: evolved follow with capped automatic yaw and feedback-loop avoidance, death/revive resync. HIGH for camera stability but requires audited compatibility with FURY P4A `updateCamera` early-return that currently decouples camera while joystick active.
6. `src/render/camera_director_core.ts`: entering-zone cinematic camera sweep and death drift, interruptible on touch. LOW for current P6; avoid automatic camera movements in fast mobile combat.
7. `src/game/camera_view_settings.ts`: independent camera FOV and Action Cam persisted preferences. Useful later; must not overwrite P2 persistence.

## Backport sequence, isolated on P6 after baseline S23 HUD QA

- **C1: touch ownership** — extract router under `origins/v020/p6/camera/` with its MIT attribution. Inject into existing mobile input surface preserving FURY world-space analog and movement, 4 hotbar handlers, dash and 2-jump. Test pointer IDs with 2-3 simultaneous contacts; never leave latched input on blur/menu.
- **C2: camera follow** — port minimal pure spring-pivot math and adapter into actual v0.20 renderer updateCamera, not wholesale v0.44 renderer. Retain collision occlusion, camera distance and teleport snap. Test 30/60fps dt, dash, jump, landing, map transitions.
- **C3: optional look-ahead and shoulder mode** — only after C1/C2 successful; visible toggle with safe default OFF and no motion effect on accessibility reduced-motion.
- **C4: integration tests** — Chromium 915x412 with simultaneous left-joystick + right thumb camera drag + ATK + four skill taps; test orientation, modal open, aim cancel; original full world and 253 art gates still required.
- **C5: physical S23** — hands-on video and performance, repeated dash + double jump + airborne attack while panning camera.

**Do not** replace v0.20 full world with 0.44 source, copy high-level v0.44 main/renderer (now ~12,689 lines vs ~5,362) or assume a file-level newer version is safe without adapter and tests.
