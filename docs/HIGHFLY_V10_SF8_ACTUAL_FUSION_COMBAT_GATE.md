# HIGHFLY V10 SF8 — Nine-Class Native Fusion Combat Outcomes

## Goal and distinction
SF7 **SUCCESS**: RUN #38426506142 (commit `fa587046517db982b3c41fa045c0736c13565815`). Spellbook, action-bar eligibility, independent LV99 casts, original LV99 Captain 9/9, opt-in `VITE_HIGHFLY_SF4=1` WebGL bundle and simulated S23 browser smoke passed. Artifact #11828867947, valid through 2026-10-27.

SF8 is a **new stronger gate**: real effect outcomes for ten native HIGHFLY skills at their **authored unlock levels and LV99**. The existing 9/9 Captain win tests the original kit, NOT nine boss victories using the new fused rotations.

## Precisely 20 real Sim encounters, in isolated cases
- Warrior `hf_warrior_u1`: LV25 + LV99: AP raid buff, max-HP buff and actual HP-cap growth.
- Paladin `hf_paladin_s1`: LV1 + LV99: damage on enemy and imbue on caster.
- Hunter `hf_hunter_s5`: LV20 + LV99: weapon damage and Trailbreak displacement.
- Rogue `hf_rogue_s4`: LV15 + LV99: BOTH speed and dodge native auras.
- Priest `hf_priest_s2`: LV5 + LV99: damage and a real original-Sim shadow DoT.
- Priest `hf_priest_s3`: LV10 + LV99: simultaneously an absorb and a healing-over-time aura without collision.
- Shaman `hf_shaman_s3`: LV10 + LV99: actual caster HP restoration via combined native heal.
- Mage `hf_mage_s3`: LV10 + LV99: real repositioning from blink.
- Warlock `hf_warlock_s2`: LV5 + LV99: actual HP loss and exactly one merged shadow DoT aura.
- Druid `hf_druid_s3`: LV10 + LV99: direct HP restoration and a native HoT aura.

Every case uses the frozen original ClaudeCraft `Sim`, actual training dummy, native targeting and cooldown/resource gates, and an ability action retrieved from the source hotbar assignment function. No direct effect-forcing, no new simulation engine, no manual HP benefit beyond setting baseline starting damage on test avatars.

## Boundaries
- Only 10/63 original `hf_*` compositions are released under the isolated opt-in build. Remaining **53 require authored adapters**, real damage/animation rules and genuine testing.
- This is **not** 9/9 Captain defeats with the new skills equipped, nor full multi-class specialization balance.
- Doesn't test actual rendered ability icons/VFX or real device finger gestures. Those need browser skillbook/hotbar automation and physical S23 Ultra QA.
- The original nine class kits, original Claude donor levels, Training-only permanent STR/AGI/VIT/PER/INT rules, saved layouts, co-op and GitHub Pages are unchanged.
- Build remains a **NO-DEPLOY** lab candidate; no upload to Pages, no main merge.

## Next after this independent CI gate
1. SF9: scripted fused-skill offensive/defensive rotations against LV99 Captain, comparing results to classic 9/9, including frontline, ranged, healer and hybrid classes with legal cooldowns and equipment.
2. SF10: adaptive ability mechanics factory, each of 53 remaining source combinations assigned an explicit compatibility type (never cloning one donor's name/effects and calling it fusion).
3. SF11: HUD full ten-slot physical layout, mobile aiming, SFX/VFX/animation fidelity and user QA; leave preview feature-flagged until vetted.
4. SF12: 27 separated class passives, masteries, and future unique progression, protecting Training progression and LV100+ gates.
