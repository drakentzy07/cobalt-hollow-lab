# HIGHFLY ORIGIN — F2 Combat Freedom 360° (Android-first)

**Baseline GREEN:** F1.2.3, source `7518c22c11ff5ddffe09bb7792f8d67bb9e82038`, RUN 39315808327.
**Branch:** `highfly-origin-f2-combat-freedom-20261019`.
**Publication:** NO DEPLOY. Keep certified GitHub Pages unchanged until gameplay and Android checks pass.

## F2.0 — Audit and preserve existing ownership
- `src/game/mobile_controls.ts`: touch ownership, right-side camera gestures, floating left joystick, analog radial input and jump/evade edges. **REUSE**.
- `src/game/input.ts`: analog vector and independent camera orbit, jump/evade sequence numbers. **REUSE**.
- `src/main.ts`: one movement pipeline into native `Sim`; projection extracted into `src/highfly/combat/freedom_360.ts`, with unchanged valid-input math.
- `src/game/auto_target.ts`: front/nearest enemy soft aim and manually locked targets. **REUSE**, refine only when attack direction is validated.
- `src/render/locomotion.ts` and `src/render/characters/anim_state.ts`: movement speed/direction and pose blending. **KEEP ANIMATION AUTHORITY**, no second rig.
- `src/ui/hud.ts`: existing 1–2–3 combo counter and elemental fourth attack. **KEEP** and extend with timing, NOT a second HUD or another action bar.
- The native simulation owns damage, positions, collisions, resources, saving, enemy states. The ONE universal Hunter is persistent. No forced class, parry, party swapping, or locked secret skill slots.

## F2 delivery gates
1. **F2.0 (this commit):** extract/verify analog camera-relative vector. 8 octants, arbitrary camera yaw, no ghost input, F1 regression tests, Android browser full smoke. No behavioral gameplay swap.
2. **F2.1 directional ATK:** moving or stationary, always animate ATK in stick/last-travel heading if no live enemy; select/rotate to a nearby eligible front enemy; still one Sim for hit/damage. Do not confuse ATK with USAR.
3. **F2.2 Action Graph:** input buffer, 1–2–3 basic chain, fourth elemental only with gem, attack cancel windows and no ice-skating on run/attack. Native animation and cooldown gates remain authoritative.
4. **F2.3 acrobatics:** jump–dash–jump, dodge chain, aerial and run attacks, coherent animator transitions, speed bounds and server/Sim positions unchanged.
5. **F2.4 aiming:** preview line for projectiles, target circle for AoE, cones/dashes and drag-release-cancel, camera/touch pointer ownership intact.
6. **F2.5 integration:** 4 BASE buttons; 3 UNIQUES remain fully secret until unlocked. Verified on S23 horizontal with multitouch, offline reload and reset.

**Never fake GREEN:** keep E2E hit-testing and browser visibility assertions active. No public Pages promotion while F2 is experimental.
