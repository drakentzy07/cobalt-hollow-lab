# HIGHFLY V10 SF9A — progress and truthful acceptance (13 OCT 2026)

## Last baseline GREEN
- SF8 GitHub Actions run **38433851460**, commit `234642d0bd0e1ecf2eb2793b7af11917a2c09bbc`: success, 10/63 actual native fusion pilots, nine class coverage; SF8 tests assess effect outcome at unlock level and level 99.
- Public `main` and GitHub Pages are NOT modified. VITE_HIGHFLY_SF4=1 only in isolated no-deploy candidate.
- SF8 original solo Captain LV99 nine victories use original combat loadouts, NOT fused rotations. Browser smoke simulates mobile Chrome, not physical Samsung.

## SF9A NEW integrated rotation
- Source: `game/c1/highfly_sf9_mixed_native_combat_rotations.test.ts`.
- The original ClaudeCraft `Sim` uses real nine class actor records, native `hf_hunt_wolf_90` at LV99 with original full HP/AI, legal P13/P16/equipment fixtures, original class attacks plus one native HIGHFLY fusion per class. No HP override, no training stat increase, no second combat engine.
- Mandatory: at least one native HIGHFLY cast per class, selected original offensive actions, real loss of native enemy HP, original event damage telemetry, persisted level99/training invariance.
- Per-class encounters have a 32-second diagnostic cutoff. **A 32-second timeout is not equal to a loss**, and the short scenario is not the five-minute Captain gate.
- First run `38436391133` failed because test incorrectly called `sim.drainEvents()` after `sim.tick()`. Original `Sim.tick()` *already drains and returns* event list, so double-drain counted zero although 8/9 classes won. This was a telemetry/test bug, NOT zero actual damage.
- Observed diagnostic initial results: eight normal-LV99 native wolf victories (Warrior, Paladin, Hunter, Rogue, Priest, Shaman, Mage, Warlock). Druid remained alive, wolf 322/1412 HP, at the 32-second cutoff. All nine native HF pilots cast and no Training stats mutated.
- Fix commit `8aeaaa90bb21bc64adfeaf2c5a6a03590f08a6a2` consumes `const events = sim.tick()` instead of double-draining. Run **38437099220** is **FULL GREEN** at code commit `8aeaaa90bb21bc64adfeaf2c5a6a03590f08a6a2`. SF9A block: **83/83 passing tests** across seven suites. All original class/gear gates, 9/9 original Captain Lv99 victories, TypeScript, activated HF WebGL build and simulated S23 Chrome smoke passed. No public deployment. Run: https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38437099220. Generated candidate artifact ID **11833773139**, expiry 2026-10-27. The later documentation commit is not the tested code SHA.

## Scope outstanding
1. SF9B: extend Druid combat diagnostic and prove 9/9 actual Captain LV99 with HIGHFLY-equipped FULL combat rotations, not original-only victory gate; native legal gameplay mechanics, all specialization outcomes reported without manufactured wins.
2. Native adaptation of the remaining **53/63** designed recipes, fail-closed on source changes and donor conflicts. 8 classes have 6 missing each; Priest has 5. Do not materialize fake additive clones or copy hidden/quest/spec gating blindly.
3. Finish mobile two-row ten-slot HUD, targeted/manual aim, per-skill VFX, action feedback, cooldown UX and physical S23 Ultra playtest.
4. Distinct scope beyond core 63: the 27 class passive designs, HIGHFLY unique skills/unique mutations earned from special encounters, and other future content packs. They are NOT certified in this SF9 gate.

## Honest progress count
10/63 = 15.87% of authored fused active skills have passed native mechanics/effect tests. This is NOT an overall HIGHFLY game completion percentage or a time estimate. Production release remains blocked pending opt-in QA, device tests and explicit owner approval.

## Additional real event diagnostics from the full-green run
- Actual original ability direct damage in the short normal-wolf encounter is positive for **8/9** classes: Warrior 1156; Paladin 338; Rogue 475; Priest 1163; Shaman 724; Mage 1702; Warlock 1009; Druid 921. These are telemetry values, **not balancing comparisons**; different cast lengths, targets and damage schools.
- **Hunter 0 direct original ability damage** despite a real native HF raptor retreat cast, attempted arcane/serpent abilities, and victory from its original attack system. The SF9A gate does NOT falsely certify full effective Hunter mixed ranged skill rotation. Likely native 8-yard minimum-range/closing policy. Next SF9B must implement genuine 10–14-yard kiting through `meta.moveInput` (no teleports) and require `originalDamage > 0` for ALL nine.
- **Druid** damaged normal wolf 1090/1412 HP in 32s and remained alive. SF9B should extend diagnostic to 45–60s and demand 9/9 wolf wins WITHOUT modifying wolf HP.
- Full fused Captain Lv99 9/9 has **not** been attempted or certified yet. The existing green Captain gate uses original kits and original legal rotations only.
