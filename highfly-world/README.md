# HIGHFLY WORLD — Clean Genesis

## The base
- World and simulation: `levy-street/world-of-claudecraft@v0.44.7` **exact pinned release**.
- Integration source: `drakentzy07/cobalt-hollow-lab` on **`highfly-world-genesis-g0-0447-20261024`**.
- Do **not** merge REBIRTH R1–R12 or UNIFIED/F2.6 wholesale. Donors are read-only references.
- Do **not** edit `main`, existing GitHub Pages distributions or saved characters.
- This is a source integration branch, **not yet a released playable build**.

## G0 — world-first integration
- Start the **native offline terrain and monster simulation** in an isolated candidate.
- Display a HIGHFLY WORLD entrance instead of upstream homepage, Steam/wiki links and upstream loading logo.
- Avoid tutorial, spawn into original world for map/collision/asset checks.
- Temporarily use the upstream internal `warrior` type and fixed `WorldTester` name **only as G0 test fixtures**. This is NOT the planned universal Hunter and still has upstream class-restricted skills.
- No authored HIGHFLY combat ability is connected yet; no player progression or save guarantees.
- Build workflow is **verify-only**, deliberately **no GitHub Pages deploy** or prod save access.

## Next milestones
1. **G0 — world asset and runtime smoke:** typecheck/build + real S23 entry, terrain, collision, monster visibility; identify third-party media that requires replacement before redistribution.
2. **G1 — character:** own HIGHFLY offline intro, hunter creator male/female + appearance, unique save, Training Core, GOLDEN 360 / Fury dash / directional double-jump flip.
3. **G2 — four skills:** reusable MOBA ability execution/aim/cancel/status engine; original named ability set (leap/lift, aimed fire projectile, moving whirlwind, execute). Avoid duplicating copyrighted heroes, VFX/audio/art.
4. **G3 — one NPC and one monster:** learn ability, AI response, loot/drop and inventory persistence.
5. **G4 — complete loop:** enter, explore, learn, fight, collect, save/load on Samsung S23 Ultra, then independent Pages publication.

## Resources/licensing
ClaudeCraft source is MIT (`LICENSE`); media assets have **separate licenses** (`CREDITS.md`). Do not redistribute upstream premium skill icons, project-restricted assets or other unlicensed art. Keep the relevant notices. This build is not currently deployed publicly.

## Validation
The self-contained scripts are `highfly-world/g0/apply_candidate.mjs` and `verify_candidate.mjs`.
Run them against a clean v0.44.7 candidate tree as documented in the isolated G0 CI workflow. An Actions GREEN proves an automated check, **not** final gameplay QA on Android.
