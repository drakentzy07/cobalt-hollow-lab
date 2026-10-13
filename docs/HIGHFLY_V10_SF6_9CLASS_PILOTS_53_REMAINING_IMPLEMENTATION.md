# HIGHFLY V10 — SF6: ALL NINE ORIGINAL CLASSES HAVE NATIVE FUSION PILOTS

**Scope:** Lab only. No Pages deployment or main mutation. No claim 63 completed skills.

## Implementation truth
- 9 original classes preserved unchanged: Warrior, Paladin, Hunter, Rogue, Priest, Shaman, Mage, Warlock, Druid.
- 10 prototype skill definitions, one or more in each of the 9 classes, registered only in the opt-in SF4/SF6 test path:
  - Warrior U1 `hf_warrior_u1` — AP group buff + temporary max HP.
  - Paladin S1 `hf_paladin_s1` — scaled Holy weapon strike + self Holy seal from HIGHFLY LV1.
  - Hunter S5 `hf_hunter_s5` — 20+ melee strike + native 12-yard Trailbreak retreat, normal GCD.
  - Rogue S4 `hf_rogue_s4` — speed + dodge, preserving 300s CD/off-GCD.
  - Priest S2 `hf_priest_s2` — shadow damage + 30% periodic damage.
  - Priest S3 `hf_priest_s3` — absorb plus periodic healing, distinct aura IDs.
  - Shaman S3 `hf_shaman_s3` — one direct Nature heal merging numeric Tidecall component, without double spell-power scaling or 2-charge spec-only mechanics.
  - Mage S3 `hf_mage_s3` — blink plus arrival frost root.
  - Warlock S2 `hf_warlock_s2` — one 18s Shadow DoT with Corruption plus 25% Agony numeric contribution, no aura collision and no original spec exclusions.
  - Druid S3 `hf_druid_s3` — one direct heal + HoT combining three donor numerical components.
- **53 remaining out of 63**, requiring real adapters. The catalog reports future unique 3 slots locked; 27 passives are separate work.
- HIGHFLY defines unlock levels (1/5/10/15/20/25/30). Donor learnLevel/visibility/spec exclusions do NOT become HIGHFLY gate conditions. Critically the *original donor remains untouched*.
- Guard registration is atomic: validates all donor IDs/class ownership, class registry and collisions; never half-installs if invalid.
- Cast simulation additionally asserts LV1 Paladin, LV20 Hunter, LV5 Warlock and pre-unlock denial of Hunter LV19 and Warlock LV4.

## Vital observations from SF6 development
- GitHub early RUN identified that some Claude donor templates were hidden; rejecting the template as hidden contradicts HIGHFLY-first unlock rules. The explicit SF6 adapter instead checks exact ID and class.
- A new `hf_*` skill must also explicitly clear `hiddenFromPlayer` and `passive` inherited by its copied source definition; otherwise the original Sim won't learn it even though it was registered under the new ID.
- Warlock's two native DoTs must be merged into ONE hit-over-time packet (with authored total/duration and cost) because identical aura IDs on the same cast overwrite.
- Hunter Trailbreak's off-GCD donor behavior is NOT auto-inherited by the combined weapon strike.
- Early Paladin melee damage is deliberately scaled to a small LV1 base instead of copying LV10 original bonus unmodified.

## Next source-to-playable passes
1. SF7 — finish the 53 recipes **by mechanical family**, not as ID clones. First: single-target damage + slow/dot, ranged projectile, AoE & positional, heal/absorb/buffs; then channels, special procs, combo/stealth, forms, summons/pets. Test every collision, school mismatch, ranked scaling and cooldown.
2. SF8 — place completed HIGHFLY active abilities in genuine class loadouts and S23 horizontal HUD: active/ultimate slots, 2-row/10-slot design, skill hold tooltips, manual aim/cancel, cooldown and VFX. Keep developer/opt-in flags until real playtest.
3. SF9 — certify 9/9 again with HIGHFLY fusions actually equipped, across milestone levels and Captain LV99 (existing Captain certification uses the **old kit**). Prior 21 spec trial sweep had only 10 winning runs, so secondary variants require balance.
4. SF10 — integrate 27 separate passives and future mastery without ever granting permanent STR/AGI/VIT/PER/INT from skills/items; training remains the only source of those five permanent increases.
5. SF11 — real S23 Ultra physical multitouch/joystick/camera/battery/WebGL benchmark; publish only after owner approval, and keep 100+ extended progression behind its own separate test gate.

## Release and test boundaries
- SF6 full SUPREME workflow is configured to run automatically on the controlled lab branch, never deploy Pages. Verify GitHub RUN success before calling any bundle certified.
- WebGL candidate intentionally has `VITE_HIGHFLY_SF4` OFF; the new `hf_*` cast tests are installed into an isolated original-Sim test registry, not a claim that the WebGL HUD already exposes the ten skills.
- No 63/63, 21/21 spec wins, live co-op, Android physical test, 100+ release or public Pages deployment is implied.
