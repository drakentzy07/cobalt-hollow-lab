# HIGHFLY ORIGIN v0.20 — P6 audit + safe-mobile migration plan

Date: 2026-10-28. Target: Samsung S23 Ultra LANDSCAPE 915 × 412 CSS px (DPR 3 simulated), real device acceptance remains mandatory.

## Immutable checkpoints

- Original world, AI, NPCs, inventory, quests and graphics: `levy-street/world-of-claudecraft@4cedc7fbf49e7179f4c29b3db2d0b2bc5bab3d25` (v0.20.0 pinned by commit).
- ART253 + P4B unified source: `ffd1b8dc56492335c171195adcb338162ecff94d`; Actions GREEN 40776437532.
- P5 source branch: `highfly-origin-v020-p5-local-s23-play-20261028` at `fed1c92b798b24beeae4dfe03b40a554dd3e31df`.
- P5 immutable public Pages artifact published by `main@d83c5738034c338b8951b059ba335a4ecf9c83d0`; Actions GREEN 40782266658.
- Public P5 link: https://drakentzy07.github.io/cobalt-hollow-lab/play.html?highfly_origin=1
- P6 branch created FROM P5 SOURCE SHA (not `main`) and builds only in isolated CI. **Never publish P6 until QA and owner testing pass.**
- License policy: reuse the P5 rights scrub and ALL 253 authored WebP. No new unreviewed media, audio, externally licensed models, or other copyrighted branding. Retain upstream rights/credits notices.

## Verified source-level architecture

| Area | Existing real implementation | P6 decision |
| --- | --- | --- |
| World | Original offline 3D Sim and renderer; media URLs correctly rooted under Pages subdirectory | PRESERVE — no new world, map or NPC substitution |
| Saving | P2 offline local persistence | PRESERVE; add regression test before changing account/character UI |
| Original art | 152 skills + 101 items authored as HIGHFLY, hash verified | PRESERVE + verify distribution after every build |
| Move | FURY P4A 360° camera-relative world-space vector via `furyStickWorld` and collision path | PRESERVE; investigate left/right input and simultaneous camera |
| Camera | Upstream `MobileControls` supports swipe-look on actual canvas independent of optional camera joystick | HIDE obstructive visual joystick; retain swipe look and test concurrent inputs |
| Dash | P4B `FuryMobility` state with energy cost, direction snapshot and collision | PRESERVE; tune later with physical device time measurements |
| Jump | Upstream first jump + P4B double jump, gated by airborne/jumping state | PRESERVE; somersault animation NOT yet implemented, falling jump behavior to test |
| Basic ATK | `attackNearest()` finds closest attackable target within world range 40 and starts original auto-attack | PRESERVE target identification; upcoming P6 combat pass to tune hit cadence, immediate response and chasing |
| Skills | `Hud.buildActionBar` constructs real cast-capable slots 0..22; skill slots 1..11 on primary, 12..22 on secondary | VISUALLY show original slots 1..4 as right arc; keep cast handlers and cooldown overlay |
| Language | Pre-existing lazy `es` locale and player preference; many hardcoded HTML labels pre-render in English | Default `es` on HIGHFLY playtest when no saved/URL preference; audit untranslated strings after browser smoke |
| Menus | Existing More, Bag, Character, Spellbook and 3D UI all have original event handlers | Re-skin current menus before any functional reconstruction |
| Branding | P5 rights-sanitation replaces upstream logo files with authored HIGHFLY gradient graphic, but HTML title/alt remained ClaudeCraft | Replace HTML title/alt and mobile web-app title; do not introduce outside graphics |
| Classes | P5 explicit offline launcher uses `startOffline('warrior','Draken',0)` | Preserve internal Warrior adapter short-term; **Hunter Universal is not yet implemented** |
| Resources | Original frame exposes HP and single class resource; P4B energy lives in private mobility state | No invented energy percentage; add real telemetry bridge in a separate tested pass |
| Nameplates | Original engine-generated nameplates | Cap name length and adjust visual contrast; true collision/stacking rules later |
| World darkness | Original renderer/lighting and scene textures | Needs real device screenshot + lighting/material audit; do not apply global CSS brightness hack |

## P6 first safe patch (CURRENT)

1. `origins/v020/p6/patch_p6.mjs` runs AFTER the complete original P2/P3/P4A/P4B/ART253/P5 route/sanitization sequence.
2. Preserves underlying real `#actionbar > .action-btn:nth-child(2..5)`, using CSS arc placement. No clones, no detached handlers, no invented skills.
3. Positions independent center-bottom SALTO and DASH, large bottom-right ATK, right-side USAR, right-top MORE. Touch canvas remains camera swipe surface.
4. Defaults to supported Spanish locale where no explicit or saved preference exists, and updates simple playtest branding.
5. `p6_browser_smoke.mjs` tests 915×412 S23 emulation, original 4 usable-size button nodes, camera touch area, game world boot and no JS errors.
6. `highfly-origin-v020-p6-qa.yml` verifies P5 ancestry, SHA, 253 assets, absence of restricted hashes, types, mobility test and P5+P6 Chromium smoke. **No deploy and no release artifact**.

## Future P6 gates before public promotion

**Gate B: mechanics.** Test real attack press latency (single tap and hold), attack while left stick is moving, target nearest vs least HP, real directional dash+double-jump while standing/walking, independent camera swipe while left thumb continues moving, cooldowns and real aim/cancel. No forced universal zero-cast-time: abilities with cast times and immobility are identified individually before changes.

**Gate C: Hunter Universal.** Keep internal compatibility data until equipment, spells, inventory and save schemas can be migrated reliably. Show user only Hunter, 4 active + 1 passive; acquired skills by merchant/loot/crafting. Do not remove internal Warrior engine fields blindly.

**Gate D: premium mobile UI.** Reskin each modal and evaluate input modality/accessibility/safe areas under both native Android and Chrome. For 4 simultaneous skills, preserve existing hotbar persistence and show empty slots (not cloned abilities). Confirm melee, magic and utility skills.

**Gate E: visual/branding.** Apply specific approved HIGHFLY startup artwork when source file is provided. Review darkness with lighting and tone maps; inspect vegetation and enemy label projection before rendering changes. Keep credits and author attributions.

**Gate F: release.** All build/browser gates GREEN, no world/253/media regressions, S23 physical hands-on video pass, legal audit of any newly added assets, user approval, then a separate promotion-to-main workflow. Until then P5 stays live.

## Known limitations / unverified

- No direct runtime instrumentation of the user's earlier physical S23 video is claimed in this source audit; observations supplied by the owner are the acceptance checklist.
- A source-level overlay and simulated 915×412 Chromium test cannot establish actual phone FPS, multitouch interference, thermal behavior or airborne combo feel.
- The current P6 first patch is HUD/locale/title work. It is not proof that the whole combat/character redesign is finished.
