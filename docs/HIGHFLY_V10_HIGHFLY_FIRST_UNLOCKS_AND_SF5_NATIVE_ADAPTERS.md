# HIGHFLY V10 — HIGHFLY-FIRST unlock policy (2026-10-13)

## User-approved architecture
- ClaudeCraft `AbilityDef.learnLevel` is the unlock level for a **ClaudeCraft original ability**, not for our separately authored `hf_*` skill.
- The HIGHFLY fusion recipe's own `unlockLevel` determines when a persistent Hunter can cast that fusion. Native `Sim` still enforces `AbilityDef.learnLevel` on the resulting `hf_*` definition.
- The source's `learnLevel` must **NOT** prevent reusing an effect at HIGHFLY level 1/5/10/15/20/25/30. Thus a Claude LV20 donor may contribute to an HIGHFLY LV5 skill, once adapted and balanced.
- The source retains its old `learnLevel`, spec/form/combo/stealth/target restrictions, cooldown, rank progression and event handlers. A fusion uses an **explicit native adapter** to supply its own safe target/cost/cooldown/range/effects; it must not inherit spec restrictions or proc hooks accidentally.
- `highflySf5SkillStage` is a read-only catalog; it shows all source IDs as eligible at an unlocked HIGHFLY recipe's level, but `mechanicAdapterStillRequired:true` means it does **NOT** assert that the recipe is executable. Locked recipes expose no eligible sources.
- Original donor ranked numerical effects may serve as balancing references. Future balance authority must be HIGHFLY, not arbitrary unmodified original Claude unlock dates. Rank-specific cast timers and unique abilities require real tests.

## New SF5 specialist safe adapters
- Mage S3 `hf_mage_s3`: Flitstep native `blinkForward` + arrival `aoeRoot` Frost Nova, keeping root and blink gates and cooldown.
- Shaman S3 `hf_shaman_s3`: blend +25% of Tidecall's **numeric base heal** into Mending Waters' single native direct heal; do not double apply magic scaling or inherit Tidecall's restoration-only 2-charge path.
- Druid S3 `hf_druid_s3`: ONE heal + ONE HoT that includes 30% Regrowth contribution at HIGHFLY LV10 (not original Claude LV14), preserving the original Mending/Regrowth/Wildbloom skills unchanged.
- Previous pilot set: Warrior U1, Rogue S4, Priest S2, Priest S3.
- Total = **7 native prototypes / 6 classes**, design registry = **63 across 9 classes**; remaining 56 need adapters and target/VFX/animation/UX validation.

## Acceptance / non-goals
- Test 63 HIGHFLY source mappings with late-original-level donors allowed.
- Confirm the 7 new `hf_*` abilities are added atomically to a disposable registry (no partial mutation).
- Confirm cast results in the original Sim: native Mage teleport; Shaman heal; Druid direct heal + HoT; plus the 4 previously tested abilities.
- Confirm the three new abilities reject a cast before their HIGHFLY LV10.
- Main, GitHub Pages, saved Hunter, Training STR/AGI/VIT/PER/INT, equipment, co-op and live world remain untouched.
- This build keeps `VITE_HIGHFLY_SF4` OFF in the generated public-like WebGL candidate; action tests explicitly install pilots in an isolated Sim. Do not claim the new HUD buttons are wired yet.

## Real completion roadmap
1. Expand 7/63 pilots toward 63/63, grouped by mechanics: targeting/area, channel, movement, combo/stealth, shields/party, pets/DoT, summoned/unique. Prioritize Paladin, Hunter, Warlock so coverage becomes 9/9.
2. Implement 9/9 *WITH HIGHFLY skills*, not just prior 9/9 with base skills. Validate melee/range/LoS, lvl gates, CC immunities, cooldown/cost, frame/perf and stronger LV99 test variants (the previous spec sweep was only 10 wins/21 trials).
3. Port all 27 passives and then mastery, preserving training-only 5 permanent attributes. Never grant STR/AGI/VIT/PER/INT via skills or items.
4. Wire S23 horizontal HUD skill slots, hold tooltips, aim/cancel, cooldown overlays, nearest/frontal targeting, and correct animations/sounds/VFX in preview, followed by physical Samsung S23 Ultra QA.
5. Only after explicit signoff enable a release flag in Pages. Extended 100+ stays a separate balance pass and gated unlock.

## Evidence
See `HIGHFLY_V10_SF4_SF5_RUN_38409528924_TRUTH.md` for last certified GREEN (four pilots, 25/25 tests, legacy Captain LV99 9/9; 10/21 specialization attempts won). The current seven-pilot branch requires a **new independent run** for certification.
