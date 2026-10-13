# HIGHFLY V10 — SF7 native playability bridge (no Pages / no main)

## Objective
Move beyond 9/9 class-prototype `Sim` tests. Prove the 10 hand-adapted `hf_*` skills actually appear in the ORIGINAL ClaudeCraft spellbook, satisfy action-bar eligibility and can cast inside the ORIGINAL Sim at level 99.

## Integration
- Reuse original `abilitiesKnownAt` and 9 class `CLASSES[cls].abilities` rosters. The SF4 installer appends ten `hf_*` definitions atomically and the standard original spellbook learns them at HIGHFLY unlock levels.
- Reuse original `src/ui/hud/action_bar/hotbar.ts` `isAbilityActionBarEligible`, `placeAbilityOnSlot` and `sanitizeHotbarActions`, rather than creating a second HUD, changing player saves or auto-overwriting user layouts.
- Reuse the existing draggable spellbook/action-bar UI for manual selection. The existing touch ring pages map to native action-bar slots. This phase does not assert that the ideal 10-button HIGHFLY mobile HUD layout has already been implemented.
- Run `highfly_sf7_spellbook_actionbar_runtime.test.ts` as an additional gate: all 10 skills learned at their HIGHFLY level, none early; all nine class spellbooks have active HF pilots at LV99; ordinary hotbar accepts them without mutating slot state; all ten cast in independent original-Sim LV99 test scenarios with legal targets and no level-gate bypass.
- Opt in `VITE_HIGHFLY_SF4=1` ONLY for the SF7 **no-deploy WebGL build** on the controlled `highfly-sf4-native-fusion-safe-implementation` branch. Other SUPREME branch builds use 0. The original public Pages build remains untouched.
- CI checks emitted browser JS for `hf_paladin_s1` to ensure the real HF installer is bundled, rather than certifying mere test-only registration.
- Browser smoke remains the existing simulated Chrome/S23 touch-joystick-camera test. It is not a physical Galaxy S23 Ultra test.
- Preserve the number of prototypes at 10/63 (9/9 class coverage). The other **53** recipes are design-only and NOT injected; 27 class passives and unique tiers remain separate.
- All five permanent training attributes still exclusively grow through real training, not skills or equipment.
- No GitHub Pages writes, `main` merges, multiplayer claims or Extended 100+ release.

## Evaluation criteria
SF7 can be called internally GREEN only when all tests/TypeScript/bundle/integrated browser QA/legacy Captain LV99 gates complete successfully on the same Actions commit. The 9/9 legacy Captain win remains distinct from the 9/9 HF-equipped cast checks. Full 9/9 Captain wins WITH HF skill rotations is a later SF8 balance criterion.

## Next
After SF7: improve the actual mobile two-row HUD, aim & tooltips using the existing action-bar controller; integrate the 53 remaining real recipe mechanics by family, then certify 9/9 full LV99 fused rotations, balance all spec trials and physically test S23.
