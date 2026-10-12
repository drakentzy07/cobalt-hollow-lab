# HIGHFLY V9 → EXTENDED 100+ · R0 Foundation audit (design only)

Status: **isolated foundation started; Extended is NOT unlocked in any published or staged gameplay.**
Baseline: SUPREME V9 P0 correction source commit `28171cc4949c32eac53336127ebb932b8f9e4558`.
Frozen main SUPREME donor QA: `8a3ddc93c9147e8c3320c04d4d2a13896b11e063`.
Verified V9 test and WebGL candidate: workflow run `38316899522`, artifact `11777781260`.
V9 public promotion: run `38317490316` SUCCESS. **Do not deploy this branch.**

## Audited R0 facts (source checked)
- `training/runtime/core.ts`: `HIGHFLY_NORMAL_MAX_LEVEL=99`; `clampHighflyNormalLevel()` caps all levels at 99. `naturalLevelGrowthFor()` assigns 98 **total natural** levels of growth at 99. `applyHunterProgression()` also clamps to 99. Five trainable primary stats: STR/AGI/VIT/PER/INT.
- `training/runtime/pf6_xp_curve.ts`: donor levels 1–20 XP preserved; 21–99 quadratic XP; `HIGHFLY_PF6_EXTENDED_ENABLED=false`; pure resolver caps at 99 and sets bar XP to zero.
- `training/runtime/pf6_progression_sync.ts`: gameplay → persistent Hunter profile mirror rejects levels outside 1–99, and bar XP is zero at 99.
- `training/runtime/stat_authority.ts`: local Hunter Core, not other actors; Training wallet is separate and must remain immutable on an XP-only level change.
- Existing nine primary classes: warrior, paladin, hunter, rogue, priest, shaman, mage, warlock, druid.
- V9 P0 repairs (Rogue 90%, 360° auto-target, Training header) are prerequisites; Extended never replaces or reverts them.

## Architecture: one Hunter and one Sim, no reset
**99 NORMAL**: all existing LV1–99 play, equipment, loot, classes, economics, tests, UI, and save format remain valid.
**99 EXTENDED ELIGIBLE**: separate entitlement earned through a repeatable-proof challenge and account-local verified game state. Not a numerical level or an automatic claim at 99. Track `extendedProof` and `extendedUnlocked` separately; do not turn XP into Training Points.
**100+ EXTENDED**: new XP segment, rank and level threshold, challenges/content with opt-in server/Sim gate. No new primary-class replacement or forced subclass. Character's existing class, inventory, proficiencies, training allocation, saved world state and original level progression persist.

Initial playable vertical slice target is **100–120**, not a claim that LV121–1000 is balanced or playable. Architecture should handle future caps without premature deployment.

### R1 — Isolated eligibility, migration, and opt-in gate
1. Audit every level clamp and donor `MAX_LEVEL` usage; enumerate affected save, server/Sim, client/HUD, equipment requirement, XP, mob levels, class balance, quest and challenge systems.
2. Define versioned `HighflyExtendedState` with defaults `unlocked:false`, `eligible:false`, proof receipts and unlock version. Avoid inventing completion; existing LV99 saves migrate to locked Extended, preserving all player data.
3. Add **read-only** eligibility checks and deterministic unlock-state tests; no publicity, no account/server writes beyond validated opt-in profile schema updates.
4. Explicit flag `VITE_HIGHFLY_EXTENDED_100=0` by default. Block LV100 until user-approved gameplay gate and all regression gates are green.
5. Freeze V9 P0 and LV1–99 parity (9 classes; Training wallet; Rogue stealth, target, Training viewport; loot/crafting; save/reload).

### R2 — LV100–120 authentic content and growth
1. New XP authority from 99→100 with deterministic curve and no rollback, overflow, infinite level exploit, or duplicate reward.
2. Extended Core natural growth requires a **new budget contract** beyond 98 natural points at 99; never continue current 1–99 formula without a balanced rule, and NEVER duplicate Training STR/AGI/VIT/PER/INT rewards.
3. Equipment, recipes, profession mastery and economy must come from authentic native gathering/drop/craft/vendor channels, player-to-player trading later through the same item custody model. Never grant gear to production players as fixture rewards.
4. Native monsters/dungeon/overworld tiers 100–120, original AI and real loot/corpses, meaningful monster family and region differences. No spawned test-fake HP or second Sim.
5. All 9 classes tested for one or more complete LV100/110/120 encounters with realistic equipment, death and actual enemy AI. Output full results, not invented 9/9 claims.
6. Distinguish special unique scenario **access** from guaranteed level requirements: rare discoveries (SLF-style) can trigger earlier, but their actual difficulty/rewards/conditions must be authored and guarded. Do not use level alone as the story unlock.
7. Keep HIGHFLY unique abilities progression as **BASE → HIGHFLY ÚNICA → HIGHFLY ÚNICA MUTADA**. Unique scenarios and limited drops/skills planned as later expansion; do not ship placeholders as functional combat skills.

### Hard acceptance gates
- V9 released Hunter loads identically with Extended disabled: preserved character ID/class, Training history + points, equipment, gems, trades, XP/level, profession and monster progress.
- All existing LV1–99 automated gates pass unchanged; nine original classes.
- Flag off: no legitimate path gives LV100, no UI offers fictional Extended rewards.
- Flag on test build only: eligible proof is necessary; LV99→100 atomic and one-way after legitimate unlock; save/reload idempotent.
- Training cannot manufacture character XP; gear cannot increase permanent five Core stats; natural growth comes from level only; one free manual reset preserved.
- Co-op multiplayer is **not** certified by solo LV99/Extended QA. Require separately deployed, tested multiplayer service before claiming online co-op.
- Physical Galaxy S23 Ultra validation is separate from emulated Chrome QA.
- No mutation of GitHub Pages, main or the V9 public artifact during R0/R1.

## User device QA requests (V9)
1. ATK vs closest/front/behind mob, including rotation, moving camera and explicit TARGET lock. Avoid switching to a far mob.
2. Rogue standard/stealthed/False Face movement and animations; double daggers and dash unchanged.
3. Training portrait-free landscape header without big left band; close/open/scroll/input/touch and saved RM/session state.
4. Report clip/timestamp when behavior differs. Manual QA decides whether a small V9.1 hotfix is needed, not 100+ work.

R0 is deliberately **documentation and boundary audit only**, not shipped Extended implementation.
