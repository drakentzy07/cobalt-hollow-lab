# HIGHFLY ORIGIN R27 — 23 PREMIUM SKILLS: PLAYABLE LAB HANDOFF

**Decision (2026-10-16):** Preserve HIGHFLY ORIGIN Hunter, nine learnable schools, 7 equipped normals + 3 reserved specials, buff bar and native combat Sim; introduce **23 new skill VFX prototypes** from 3 MIT-code Three.js sandboxes in a disposable mobile lab. No public deploy without S23 validation.

## Reality / status

- Branch source: `highfly-origin-r26-original-seven-native-lab` (isolated lab).
- Registry: `game/c1/highfly_origin_r27_premium23_catalog.ts` lists 23 exact source IDs, repositories, pinned commits, demo-only range and CD.
- **Not yet playable in HIGHFLY.** Catalog-only commit does not import source VFX, make casts, apply damage, build preview, or validate device FPS.
- Three extra visual self-buffs are out of the 23 and belong below the normal action bar.
- All 23 should appear in a **lab-only spellbook** to choose from; **only 7 normal slots simultaneously equipped**. Do not create 23 HUD buttons.
- In LAB all skills can be tried from character creation (without saved unlocks). In production, abilities get progression/discovery levels and mastery gates after real testing.

## Donor code / provenance

1. `casting6`: https://github.com/achrefelouafi/LinearAbiltyCastingThreeJS @ `97f1de19617e9a2e3af3c8021c8c21c8f58b40f3`, 6.
2. `effects7`: https://github.com/achrefelouafi/LinearAbilityExtThreeJS @ `bf58757ab9b6057515470aa074cdb4026bc54ed7`, 7 + 3 visual buffs.
3. `advanced10`: https://github.com/achrefelouafi/LinearAbiltyCastingExtendedThreeJS @ `8c377c886ac2c68b26bc65c8f3507905818b974a`, 10.

**CODE**: MIT LICENSE at the root of all three. Preserve attribution/copyright and the license notice alongside imported code. Review commit snapshots for differences and transitive source. **ART**: Mixamo FBX cast/idle, diffuse maps, HDR, cathedral textures, and `snake.glb` may have distinct licenses; neither MIT of the repository nor free download automatically covers redistribution. Do not ship unknown third-party assets. Use HIGHFLY Rig_Medium's existing animation library and approved/procedural materials. Check any CC0 claim for the exact assets, retain provenance. No copying MOBA assets, icons, heroes, or proprietary game code.

## Minimal adapter architecture

```
R27 Lab Spellbook (23 entries; all unlocked in ephemeral preview)
   -> HIGHFLY existing 7-slot equip pipeline (3 specials reserved)
   -> R21/R22/R24A Hybrid Manual Aim (tap smart / drag explicit)
   -> VfxAbilityAdapter (only effects + shot geometry + phase events)
   -> Native Sim ability resolver (actual target/HP/MP/Stamina/cooldown)
   -> Native enemy AI and impact/event bridge
   -> procedural shader/particle manager with mobile quality tiers
```

- Preserve original ClaudeCraft skills untouched and available in a separate category.
- Namespace all new IDs as `hf_vfx23_*`, no collisions with `ABILITIES`.
- Each new skill has two explicitly separate contracts: visual phases + native gameplay events.
- NEVER use donor demo `Dummy.kill()` as damage in the RPG. Distinguish hit, hit tick, knockback, freeze, burn, poison, summon, barrier.
- Demo cooldowns often 0.4–5.5 s; these are not balanced. Level, costs and cooldowns must be separately designed after lab test.
- Do not map every visually impressive effect to an instant kill. No auto-basic-attack.
- Treat three portals (Verdant Gate, Tidewrought Ring, Fire Portal) as **utility/structures until interaction is implemented**. Do not invent enemy damage.
- Buffs are independent from combat slots. Three original special slots remain reserved.
- Source demos use flat `y=0` stages; conform directional paths and circular footprints to native terrain before gameplay certification.
- Restore graceful fallback on missing GPU extensions or low performance.

## Execution batches — all 23 are in scope

**R27 P0 (this commit):** pin repos, legal flags, full registry, and no-persistence policy. No VFX integrated yet.

**R27 P1 — playable VFX gallery, not 23 independent copies of an engine:** build ONE reusable renderer bridge, copy only compatible procedural shaders, particles, utilities with preserved notices, show all 23 in a spellbook, preview one at a time using Hunter's native cast animations. Each slot must produce its named effect (no placeholder substitution). Verify mobile input.

**R27 P2 — gameplay adapter for every one of the 23:** native Sim events to real monsters, validation per skill (damage, CD, cost, collision, AoE/line, statuses/summon). Start with Frost Lance, Storm Lance, Cinder Fall to certify the bridge, then expand to all 23 with the same runtime; label nonfunctional features explicitly.

**R27 P3 — advanced VFX/complex mechanics:** Arborist's Growth and Baleful Cascade Mark target acquisition, dynamic tentacles, gravitational pull, barriers and terrain deformation/portals, with realistic AI behavior and native enemy movement.

**R27 P4 — verification:** automated 23/23 ability registration and VFX activation, per-ability collision/target tests where applicable, cooldown/cost gates, 7+3 HUD regression, aiming cancellation, multitouch, animated Rig_Medium, S23 landscape FPS and thermal tests, no saved-slot migration, green CI. Publish a separate GitHub Pages preview ONLY when passed; public stays unchanged.

## Acceptance checklist

- [ ] All 23 show correct name and shape in spellbook, equip / unequip and cast on S23.
- [ ] Every one of 23 has its actual procedural VFX working (not placeholder).
- [ ] Correct Rig_Medium native cast animation; no replacing it with Mixamo rig.
- [ ] Every combat ability has native monster damage and cooldown; controlled CC and AI; portals are actual usable utility or marked noncombat.
- [ ] Buffs below action bar; 7 normals + 3 reserved unchanged.
- [ ] Manual/auto hybrid aim with cancellation; camera and joystick remain GOLDEN.
- [ ] No third-party asset copied without documented rights; preserve MIT notices for copied code.
- [ ] All 23 tested and recorded separately; mobile performance tiers.
- [ ] No changes to public app or persistent saves before opt-in.

## Expansion candidates, separate audit

`https://github.com/majidmanzarpour/threejs-vfx` advertises 100 procedural spell VFX across 15 schools, based on the original six. It is **not 100 additional confirmed unique usable skills**; audit code, license/attribution, reused implementations and mobile performance first. Do not expand R27 scope or copy it before P1–P4 gates.
