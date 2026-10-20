# HIGHFLY ORIGIN — UNIFIED 01 run receipt
Date (UTC): 2026-10-20.
Source branch: `highfly-origin-unified-app-lab99-20261020` (historical name; LAB ACTUALLY LV1).
RUN: https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/39517223542
Commit tested: `7c4562ba9cdd3db7dad98c398277168edd44000c`
Status: **GREEN — unit/typecheck + WebGL build + touch-emulated Chromium end-to-end. NO DEPLOY.**

## Confirmed from actual CI logs
- Node 24 / pnpm frozen install: success.
- Full TypeScript `tsc --noEmit --incremental false`: success.
- F1/F2.6.3/F2.7 and unified 01 Vitest regression: success.
- Full WebGL `vite build` using unchanged frozen ClaudeCraft media donor: success.
- Browser smoke on ONE URL `http://127.0.0.1:4173/cobalt-hollow-lab/`:
  - LAB button creates `DrakenLAB` at LEVEL **1**.
  - Native `sim.known` and mobile slots 1–4 contain `fireball`, `sinister_strike`, `highfly_blade_rush`, `meteor`.
  - LAB save mirror is `highfly.origin.lab.primary.v1`; no write to root-world sentinel or historic F2.7 beta save.
  - After reload, WORLD creates `Draken` at LEVEL **1** without trial skill grants.
  - Production save mirror `highfly.origin.primary.v1` contains Draken, LAB save mirror still DrakenLAB.
  - Chrome 844x390 touch emulation succeeded; **physical S23 Ultra NOT yet tested**.
- The browser smoke printed:
  - `UNIFIED_LAB_LV1_FOUR_NATIVE_SKILLS_GREEN=1`
  - `UNIFIED_WORLD_NO_TRIAL_GRANTS_AND_BOTH_SAVES_GREEN=1`
  - `HIGHFLY_UNIFIED_01_BROWSER_GREEN=1`
- GitHub Pages public site and main remain untouched. No release or Android APK published.

## Implemented now
- Entry buttons on existing creator: Mundo (Draken) / Laboratorio (DrakenLAB level 1).
- Mode passed through `startOffline`, persistence and training. Independent origin save IndexedDB and localStorage, reset and autosave (mode captured).
- Native F2.7 combat/HUD feature gates activated in the same root app runtime rather than requiring historical lab URL.
- LAB gets four temporary F2.7 skills; WORLD does not get them for free. Same native Sim and map.
- Native original requirement definitions still unchanged. `highflyMeetsContentLevelGate` is a pure future preview access helper, NOT yet wired into every equipment/loot/recipe gate.

## Still required (do not claim complete)
1. Physical Samsung S23 Ultra landscape hands-on QA for camera, aim, cancel, movement, HP/MP/ST, ATK vs USAR and save resume; 3D emulation does not replace it.
2. Dedicated LAB catalogue for skills beyond the four trial ones, equipment, high-level armor/loot/recipes and test-only monster spawns; validate non-level equipment constraints.
3. Robust backup/export of real-world saves and LAB-only reset E2E; test refresh, crash, stale IDB races and actual real existing Draken save.
4. Polish/restore best four-hit basic combo from F2.6.3, improved HUD bars, first-skill camera twist, Blade Rush aerial targeting, Fireball impacts.
5. Gradual native content integrations (monsters, loot, 9 schools, professions) and reversible RG Poly environment pilot only after protected baseline.
6. One carefully gated publish to root Pages/Android once the user has validated the actual device; preserve current public site until then.

## Follow-up governance
One working branch and progressive small commits. Keep the existing CI workflow alive. Keep milestone tags/backups for rollback without creating a new feature branch for every fix. Use the run URL above to audit the independently reproducible green result.
