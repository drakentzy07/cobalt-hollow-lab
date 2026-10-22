# HIGHFLY FURY 360° — F1: visible skill aiming + independent touch finger

## Added
- `src/skill_preview.ts`: native-metadata-driven outlines and filled shapes for
  line, cone, circle, rectangle, triangle, leap, dash, target, self.
- `src/skill_gestures.ts`: independent skill-button pointer lifecycle with
  continuous reticle previews, drag/release/cancel, cancel drop zone, loss of
  pointer capture, moving-origin tracking, and ONE authoritative native cast
  request on release.
- Original `src/fury_core.ts` adds `updateContext` so targeting moves with
  the player's world position and camera yaw each frame.
- `tests/fury_f1.test.ts`: deterministic geometry/gesture tests with NO game
  launch or additional packages.

## Intended on-screen result (integration required)
1. Keep your LEFT THUMB on the existing GOLDEN 360° joystick.
2. With your RIGHT THUMB, hold a native class skill button.
3. Its area appears on the floor using the native skill's range/width/radius,
   following uneven terrain with the runtime's existing height sampler.
4. Drag toward a mob: change direction, circle placement, cone or leap landing.
5. Slide onto the existing cancel widget: preview turns to CANCEL. Releasing
   there does NOT invoke the spell, change target or deduct resources.
6. Release in the valid region: the *existing* native spell executor decides
   whether it can cast and emits the original original 0.44.7 skill VFX.
7. Missing native cast permission? Reject without a phantom VFX; never invent
   damage or cooldown handling.

## Integration firewall
These files do NOT wire game input, mutate the HUD, modify native skill effects,
or send network packets. An adapter will join:
`TouchOwnerLedger` -> `FurySkillTouchController` -> native spell dispatcher
and `FuryGroundPreview` -> current Three.js world ground overlay renderer.
The runtime must be the same source of truth for native range, width, radius
and hit validation. Do not pretend the preview is identical to hit detection
before those native metadata mappings and terrain/LOS checks are validated.

## Exact runtime hook (future REBIRTH stable base)
```ts
const ctl = new FurySkillTouchController({
  showPreview: frame => nativeGroundOverlay.update(frame?.geometry ?? null),
  attemptNativeCast: aim =>
    nativeSpellExecutor.tryCastNativeAbility(aim.abilityId, aim.world),
});
// existing touch_router owns pointer IDs; only combatButton skill pointer goes here.
// On every drag AND release, read current player position and current camera yaw.
// Native skill VFX are produced by original spell executor, not drawn by Fury.
```
The snippet illustrates expected adapter interfaces; the method names are not
claims about existing ClaudeCraft API. Discover their real names before wiring.

## Tests
`node --experimental-strip-types --test fury360/tests/*.test.ts`

No production deployment and no changes to char creator, GLB, save,
`main.ts`, `input.ts`, `mobile_controls.ts`, player physics or native ability code.
