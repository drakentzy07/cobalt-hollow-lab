# HIGHFLY SF9 — Donor mechanics vs authored HIGHFLY unlocks

## Non-negotiable level policy
HIGHFLY's recipe stage level 1/5/10/15/20/25/30 controls ONLY the new `hf_*` skill. Original ClaudeCraft `learnLevel` (even 50+), `hiddenFromPlayer`, `passive`, and original specialization grants are source-reference **metadata** and cannot prevent a distinct HIGHFLY skill from being designed at an earlier level.

This is **not** permission to blindly copy a source ability's original proc handlers, passive states, cast action, resource system, damage or unsuited targets. Every new recipe must have an authored adapter matching real native effect dispatch and a legal player-facing `AbilityDef` with HIGHFLY level, resource cost, cooldown, enemy/friendly target, school, and its own class ownership.

## Code changes
`traceSf4FusionDonors` returns both:
- `sourceNotes`: donor originally hidden/passive, original spec restriction, original donor level above HIGHFLY recipe. These are **no longer named blockers**.
- `blockers`: real mechanical adaptation requirements (cross-class identity, action replacement, different target contract, school/range conflict, channel, stealth/form aura, custom effects, or unreviewed hooks).

`highfly_sf4_diagnostics.test.ts` guards that donor learn level is not a blocker for Paladin S1, Hunter S2, Priest S4, Warlock S1, and Druid S2, while 53 of 63 recipes remain classified as requiring real adapters. This is a **read-only diagnostic change**; it does not activate new skills, grant any training stats, change save data, or edit existing donor definitions.

## Evidence
Earlier verified no-deploy baseline SF7 RUN #38426506142 with 10 native pilots across 9 classes. SF8 expands to 20 real result checks at original HIGHFLY unlock and LV99 (separate CI gate). A future CI run on the combined branch must pass before calling the audit policy validated.

## Next adaptation targets
- Priest S4 `lesser_heal + flash_heal`: safe single combined heal with an authored cast time and HIGHFLY level 15, source Flash Heal LV20 a template; spell power should be applied once.
- Shaman S1 `lightning_bolt + chain_lightning`: requires targeted and chain native geometry handling.
- Mage S1 `frostbolt + fireball`: mixed-school semantics require explicit authoritative school/effects and resist validation.
- Hunter S1 `measured_shot + arcane_shot`: needs range/min-range/projectile audits.
- Paladin S3 `holy_shield + devotion_ward`: requires compatible absorb/mitigation aura identities.
All five are prospective, **not** completed.

## Safety
No GitHub Pages/public/main changes. Feature flag remains confined to the no-deploy test candidate. Training-only STR/AGI/VIT/PER/INT, Hunter persistent data and core combat remain unmodified.
