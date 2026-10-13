# HIGHFLY V10 — SF4/SF5 real GitHub RUN certification, 2026-10-13

## Immutable evidence
- Branch: `highfly-sf4-native-fusion-safe-implementation`.
- Tested commit: `59071d4b6b46dd89cae3cc880e3560b85d6ff064`.
- GitHub Actions RUN: https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38409528924
- Final workflow conclusion: **success**, no deployment.
- Four **native fusion PILOTS** tested (3 classes): `hf_warrior_u1`, `hf_rogue_s4`, `hf_priest_s2`, `hf_priest_s3`.
- SF4/SF5 tests: **25 passed / 25**. Included 7 original-Sim casting tests and 18 registry, compatibility, and stage tests.
- TypeScript `tsc --noEmit --incremental false`: GREEN.
- Native Captain LV99 aggregate `HF_SUPREME_SOLO99_TACTICAL_9`: **9 classes, 9 wins, 0 aggregate losses, 0 aggregate timeouts**; `nineOfNineSoloCertified: true`.
- Native level 1–99/equipment/gem regressions: GREEN.
- Simulated Chrome mobile controls and WebGL QA gate: GREEN.
- Uploaded WebGL archive artifact: ID `11820059018`, name `HIGHFLY-SUPREME-INTEGRATED-WEBGL-S23-CANDIDATE-NO-DEPLOY`, 898,208,466 bytes, expiry 2026-10-27. Available via run artifacts.

## Important 9/9 vs 21 specialization attempts distinction
The nine original classes have a winning solo configuration. This does NOT establish a 21/21 success rate for the optional specialization sweep. Out of 21 recorded spec attempts, 10 were wins and 11 losses. The winning class configurations recorded in the run include:
- Warrior — arms
- Paladin — retribution
- Hunter — survival
- Rogue — assassination
- Priest — shadow and holy
- Shaman — restoration
- Mage — fire
- Warlock — demonology
- Druid — balance (a later variant won, although an earlier balance attempt lost)

Losses in secondary variants remain a balance backlog: Hunter marksmanship/beast mastery; Priest discipline; Mage frost/arcane; Warlock affliction/destruction; Druid several feral/restoration/balance variants. Do not describe those attempts as victories.

## Fusion truth
- 63 combinations = the nine-class DESIGN REGISTRY, NOT 63 completed skills.
- Four SF4 native pilot definitions passed isolated Sim tests; **59 still blocked** pending adapter work and actual gameplay QA.
- Real error discovered in the previous run: Priest absorb + HoT shared an aura ID. Fixed using `hf_priest_s3_absorb`; the corrected run passed.
- SF5 reads native donor learn levels for all 9×7 recipes and refuses to treat later donor effects as early unlocks; it does NOT install 63 complete playable skills.
- 27 class passives, mastery M1–M10, skill HUD/manual aim and unlock/save migration still require explicit runtime integration and tests.
- The isolated preview BUILD does **not** set `VITE_HIGHFLY_SF4=1`. Pilot cast tests use local test registration; the WebGL artifact is not evidence that SF4 pilot buttons were exposed in live gameplay.
- Extended 100+ is NOT certified by this run.

## Protected boundaries
- No `main` or GitHub Pages writes. No production deployment.
- No claim of physical Samsung S23 Ultra QA: browser/mobile test was simulated in GitHub Actions.
- No claim of all 63 fusion skills combat-verified, 21/21 spec sweep, co-op online, or 100+ release.
- Next: 9/9 SPECIALIZATION/skill-specific acceptance tests and adapters, then native kit/HUD/manual-target/save wiring with separate physical S23 QA.
