# HIGHFLY FURY 360° — RUN F0 (standalone kernel)

## Scope
Pure, native-safe gameplay intent orchestration for the HIGHFLY REBIRTH
**nine original ClaudeCraft v0.44.7 classes**. No production build, no Pages,
no changes to creator, authentication, save formats, native spell lists, GLBs,
or existing core files.

## Audit evidence (2026-10-22)
* REBIRTH branch: `highfly-rebirth-044-nine-native-classes-20261022` at
  `010e8ef1720157f2c3438a10ab738690cf3db3f3`.
* REBIRTH R2: `rebirth-044/r2/apply_candidate.mjs` restores proven
  `freedom_360.ts`, `f261_controls.ts`, `f24_aim_core.ts`,
  input and player motion behavior, but **copies complete historical input.ts**
  into the v0.44.7 materialized donor. Do not copy wholesale in FURY integration.
* Donor: `highfly-origin-f263-collision-gesture-save-polish-20261020`.
  Inspected `src/game/mobile_controls.ts`, `src/game/input.ts`,
  `src/sim/player_motion.ts`, `src/main.ts`,
  `src/game/auto_target.ts`, `src/render/characters/visual.ts`.
* Golden input: `mapHighflyJoystickVector` -> `setHighflyTouchVector` ->
  `resolveFreedom360` -> MoveInput `highflyWorldX/Z` ->
  existing Sim `player_motion`, no competing position integrator.
* Dash/jump: event counters `highflyJumpSeq` and `highflyEvadeSeq`,
  with air use/cooldown controlled by native motion. Presentation flip lives
  in character renderer. These must not be duplicated.
* Aim: original F2.4 and F2.6.1 have different pointer-X conventions. FURY
  exposes explicit horizontalSign/sensitivity rather than assuming one layout.
* Target: native `auto_target.ts` already has soft target and hostile-only
  rules; FURY requires the caller's native canAttack/LOS checks.

## Public API
`src/fury_core.ts`: `acceptGoldenMovement`, `FuryAimGesture`,
`pickFuryTarget`, `gateFuryAction`, `FuryComboClock`,
`chooseFuryPose`.

## Contract for a future integration adapter
1. Input/camera: keep current joystick and camera owners; feed the existing
   `resolveFreedom360` output into `acceptGoldenMovement`; write only
   the same existing MoveInput fields; never write world position.
2. Touch: bind gesture start/move/release/cancel through the existing touch
   router. Pointer ownership is exclusive. Native skill call happens ONLY on
   successful release and after native restrictions/cooldown/resource checks.
3. Ability shape/range: use native ability metadata and a per-ability adapter;
   no hardcoded 'all 9 classes have identical abilities' assumption.
4. Target: retain current manual target if valid; default soft targeting only
   for hostile abilities where the native system requests a target. Do not
   use on friendly heals, self buffs, or untargeted areas.
5. Combos: call `FuryComboClock.registerAcceptedHit` only after the native
   attack has been accepted. No free damage or client-authoritative hits.
6. Animation: `chooseFuryPose` requests an existing clip or validated fallback.
   Real position/motion, jump gates and authoritative hits remain in Sim.
7. Hard restriction: **no** changes to `main.ts`, `input.ts`,
   `mobile_controls.ts`, `player_motion.ts`, `visual.ts`, saves,
   character creators, GLBs or deployment from this F0 branch. A later
   adapter patch must use guarded narrow anchors after REBIRTH stabilizes.

## Local, standalone contract tests
Node.js 22+:
```bash
node --experimental-strip-types --test fury360/tests/fury_core.test.ts
```
No downloads and no application startup necessary for the pure contract tests.
Their existence does **not** certify rendering, native spells, 60 FPS, or S23
multitouch. Those require later build/browser/device validation.

## F1 integration prerequisites
Confirm the REBIRTH team has finished entry and GLB repairs and provided a
stable base commit. Rebase or cherry-pick this additive `fury360/` directory
into that snapshot, with no automatic publishing or mutations of its fixes.
Build a very small adapter and verify each of the nine classes separately.
