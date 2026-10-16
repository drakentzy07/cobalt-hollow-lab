# HIGHFLY UNIQUE LAB — GUINEVERE R03 (3D real KayKit, NOT production)

**Date:** 2026-10-16  |  **Branch:** `highfly-unique-guinevere-lab-r03-3d-vfx-combo`

## What exists in this version

- THREE.js WebGL 3D arena uses **the real `warrior_modular.glb`** from frozen ClaudeCraft upstream commit `9b57e49c9676d75962700f828cc00a50a9a988b5` (recorded path `public/models/chars/modular/warrior_modular.glb`). Rig_Medium, original 22 animations, geometry and weights stay intact. The model is placed/scaled using its bounding box and native AnimationMixer. VFX are procedural HIGHFLY originals, **not MLBB assets**.
- Cooldowns/damage/marks/recast/projectiles and AoE authoritative **within R03's local deterministic JS lab core**, not production ClaudeCraft Sim. 120-Hz fixed-substep simulation; mobile display FPS independent of hit count. No new autoattack. All three skills are usable independently.
- Third-person camera with right-side drag, landscape multi-touch movement and aiming, soft aim ON/OFF, drag-to-cancel without mana/CD consumption. U2 second press during valid recast blinks and spawns delayed echo.
- Procedural 3D VFX: U1 violet projectile/bursts; U2 rising leap/impact waves/after-echo; U3 triple rotating magic rings, eleven impact pulses and linked hit beams. Particles capped at 170 active objects; no shadows for performance.
- HTML assembled as **a single offline file** in GitHub Actions (the GLB and minified Three.js code are embedded). No public Pages deploy. Android Chrome can load the downloaded standalone file offline where local HTML opening is permitted.
- CI verifies pinned GLB rig/skin/clip metadata, 52 Node combat and combo tests, bundling offline without CDN, WebGL browser smoke on desktop and emulated S23 landscape; artifacts include screenshots and animation audit. Physical S23 input, thermal, render and VFX quality require user verification.

## Precise R03 lab timing (HIGHFLY candidate balance, not official MLBB values)

| Skill | Cost | Cooldown start | Cast-to-release / active | Recast | Intended flow |
|---|---:|---:|---|---|---|
| U1 Prisma del Vórtice | 14 MP | 4.4s on commit | Release at **0.14 s**; actor short cast lock **0.18 s**; bolt speed 25 units/s; first swept collision | on-hit refund 0.6 s to remaining CDs | Mark 1 stack, slow 28% ×1.6s; aim direction manual, tap soft aim optional |
| U2 Ruptura Ascendente | 23 MP | 15.0s on commit | Jump reaches target after **0.42 s**, AoE 2.1 units, 0.85s airborne mobs, boss reduces poise | **4.2 s** after landing; recast 4.7-unit safe blink leaving 1.5s delayed echo | Applies **2 marks**, can queue U3 during flight, auto-activation on land |
| U3 Tempestad Suspendida | 40 MP | 40.0s on commit | **11 deterministic damage ticks over 2.0 s**, total 352 base lab damage; 4.2 unit area; temporary anti-CC | none | On 3 marks applies enhanced lift; after U2 lands can auto-fire queued U3 |

**Expected timings with dummy at ~5m:** U1 starts `t=0.0`; release `t=0.14`; collision around `t≈0.3`; tap U2 once U1 cast lock ends `t≥0.18`; U2 finishes `+0.42`; U3 immediately on landing if buffered; U3 ticks at ~0.182 intervals. Timings measured in lab world units and local sim clock. No global cooldown other than U1 0.18s cast lock and the active leap/ultimate animation lock.

## File map

- `core.mjs` — deterministic battle authoritative lab core, no rendering imports.
- `core.test.mjs` — R01 regression tests adjusted for R03 timings.
- `combo.test.mjs` — 12 new combo/CD/CC/interrupt tests.
- `main3d.mjs` — native KayKit GLB loader/AnimationMixer, original VFX, 3D arena and Android HUD.
- `index.html` — handoff shell, source JS requires npm Three dependency when served unpacked.
- `build-r03.mjs` — embeds actual frozen upstream GLB + bundled Three.js into single offline HTML; checks Rig_Medium/skin and clip count.
- `browser-smoke.mjs` — Playwright 3D screenshot and casts on desktop and 915×412 viewport.
- `.github/workflows/highfly-unique-guinevere-r03-3d-no-deploy.yml` — builds + tests + uploads artifact, **never runs Pages deployment**.

## Build commands from a checkout of frozen upstream

```sh
cp -R <HIGHFLY-LAB>/unique-lab/guinevere-r03 <upstream>/unique-lab/
cd <upstream>
npm ci --ignore-scripts
node --test unique-lab/guinevere-r03/{core,combo}.test.mjs
node unique-lab/guinevere-r03/build-r03.mjs public/models/chars/modular/warrior_modular.glb
node unique-lab/guinevere-r03/browser-smoke.mjs
```

Official action artifact contains `HIGHFLY_GUINEVERE_R03_KAYKIT_3D.html`; Android user downloads **just HTML**, not source zip, and opens it from My Files → Downloads in browser, in landscape.

## NON-CLAIMS / integration gate (critical)

**Not yet** wired into the actual ClaudeCraft authoritatively shared Sim, skill hotbar or production R28 temporary ATK selector; no persistence and no Pages publish. KayKit animation clips are selected from the **existing real animation library by semantic name matching**, not newly authored skill-specific full-body motion capture. VFX are original 3D lab procedural approximations; animation timing/FX require screen-recording and phone playtest. U3 airborne is lab crowd-control state + 3D rise presentation; native game crowd-control immunity and PvP semantics still need Sim integration. Boss poise is lab-owned and must be explicitly adapted to native combat. All user-facing QA screenshots are emulator-based; no claim of physical S23 certification.

**Promotion criteria before the main chat:** full physical S23 U1→U2→U3 combo with manual aim; correct KayKit orientation/casting/landings, no missing animations, 11 visible hit pulses; terrain/LOS including stairs/walls; no cast duplication, mana/CD drift, no autoattack; source- and asset-license review; native Sim adapter design and 7+3 temporary skill UX integration; user approves aesthetics and comfort.

## Asset licensing

Upstream `CREDITS.md` records KayKit character models + animation library by Kay Lousberg under **CC0 1.0**, redistributable. THREE.js / esbuild are MIT. This lab only bundles cited CC0 model and procedural VFX; it must not copy protected Mobile Legends IP or restricted original ClaudeCraft media. For bundled Three.js copy MIT notice alongside distribution if shipped beyond private lab testing.


## R03 fixes
- Input projection fixed for both joystick and skill drag: UP moves away from camera, not toward it. Default HUD = joystick left, skill buttons right. Mirror HUD toggle optional.
- U2 lift remains 0.85s by itself; when U3 connects to an already airborne or three-marked enemy, airborne lasts its 2s (11 hits) plus 0.16s grace. Bosses never airborne.
- Airborne VFX rise/hover/descend curve; AIRE: seconds telemetry.
- U2 recast requested during U3 buffers until its finish if valid. 68 deterministic Node tests in R03 plus browser smoke; no native ClaudeCraft Sim integration or Pages publication.
