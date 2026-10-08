# HIGHFLY PF-6 — XP, LEVELS 1→99 (ISOLATED DESIGN CONTRACT)

**Status:** PREPARATION ONLY. No gameplay code, production workflow, or Pages deploy changed by this document.
**Parent CLEAN build:** `89c8d8fccdce476a486cce58a074332430512de4` (RUN #310 passed direct canonical build).
**Promotion gate:** `highfly-main-clean-v1` must complete RUN #311 GREEN before implementing/promoting PF-6.
**Freeze rollback:** `60daa3808573dbd2d05f5ade59fb0fe59254581a` — never modify.

## Audited code authority (do not duplicate)

1. Frozen ClaudeCraft `src/sim/combat/damage.ts::grantXp` already awards XP from real kills, applies rested-kill bonuses, emits `xp` and `levelup`, handles multi-level overflow and recalculates combat stats/learned abilities. **Reuse this event/award path** and its existing quest/other award callers.
2. Frozen ClaudeCraft `src/sim/types.ts` currently has `MAX_LEVEL = 20`, `xpForLevel`, XP table and separate post-cap virtual XP/prestige. HIGHFLY PF-6 extends true levels to 99, without silently enabling virtual/Extended power progression.
3. Frozen ClaudeCraft `src/sim/character_state.ts` already persists `level`, `xp` and optional `lifetimeXp`. Preserve compatibility and migrate old saves; no second authoritative gameplay XP wallet.
4. HIGHFLY `training/runtime/core.ts` already defines `hunter.level`, `hunter.xp`, `hunter.rank`, `applyHunterProgression`, `HIGHFLY_NORMAL_MAX_LEVEL = 99` and deterministic natural-level growth.
5. HIGHFLY `training/runtime/stat_authority.ts` is the only primary-stat replacement for the local Hunter. ClaudeCraft remains the single recalc authority for derived stats, gear/buffs and combat. Never double-count level or Training.

## Proposed single-authority architecture

```
Gameplay kill / quest / reward
  -> existing donor grantXp + award conditions (ONE XP grant)
  -> entity.level, PlayerMeta.xp, lifetimeXp (ONE authoritative gameplay state)
  -> existing levelup / xp events (UI + abilities)
  -> HIGHFLY local-profile synchronization via applyHunterProgression (projection, not another XP grant)
  -> existing character save and HIGHFLY Training-profile save
```

- **Gameplay XP and level:** one source of truth in Sim entity + PlayerMeta, not independently minted by Training.
- **Hunter Training profile:** mirrors persisted level/XP/rank and computes Core = class Awakening (total 50) + natural level growth (exactly 1 per level after LV1, cumulative +98 at LV99) + separately validated real Training allocation. Training cannot mint gameplay XP.
- **Equip/skills:** no direct increases to STR/AGI/VIT/PER/INT.
- **Rank:** F→E→D→C→B→A→S→NACIONAL; design explicit qualification gates, persist rank separately; do not equate rank to freely repeatable XP.
- **Extended:** closed feature flag, no LV100+, cosmetic donor virtual/prestige must not be confused with HIGHFLY true levels or Nacional.
- **Compatibility:** never overwrite an existing saved Training wallet when leveling/reloading; prefer forward-only schema upgrades and explicit migration tests.

## Required PF-6 implementation (after CLEAN GREEN)

- Extend `MAX_LEVEL`, XP thresholds and cap-adjacent behavior to real LV99 in canonical CLEAN source; preserve early gameplay pacing where justified; balance the LV20→99 curve with automated simulations before freezing numeric tuning.
- Verify `grantXp` is called exactly once per eligible kill, protects no-XP and repeated-death cases, and keeps quest XP functional.
- Bind `levelup` and `xp` to the same canonical UI state; reuse current HUD and event mechanisms. New UI must not shift GOLDEN S23 combat controls.
- Synchronize HIGHFLY progression after level changes and on resume/load; make cross-save recovery deterministic and prevent regression to LV20.
- Enforce level cap 99, rank qualification, and explicit Extended-disabled state.
- Keep PF-7 skill unlock gates independent of Training Core stat rewards.

## Non-negotiable tests

- XP table for LV1..99: positive/finite/monotonic thresholds; correct overflow, multi-level grants and LV99 hard cap.
- LV1 Core sum=50; LV99 natural sum=98; at any level Core equals class base + natural level growth + Training allocated, without minting Training Points.
- XP from a verified kill changes one XP wallet; a repeated kill/death cannot duplicate rewards.
- `xp`/`levelup` event ordering, class skill unlocks, equipment/derived recalc remain coherent.
- Save → quit → reload → same XP, level, rank, Training Points, and HUD bar; migration from pre-PF6 saves.
- Browser build, creator, entry, loading, gameplay, death/respawn, targeting, combat, persistence, S23 landscape + PC.
- Freeze #302 untouched, main GAME dist contains no Skin Factory/Skill Lab/Profession Lab, public deploy gated.

## Branch discipline

- Development branch: `highfly-pf6-xp-lv99-isolated`.
- CLEAN stays unchanged until its canonical gate passes and PF-6 passes its own CI and human checks.
- No legacy `highfly-progression-foundation-1-99` cherry-picks: its older schema-4 configuration has an incompatible zero Awakening/Natural Growth budget and would regress PF-5.
- Promotions require explicit SHA compare and GREEN verified in GitHub.
