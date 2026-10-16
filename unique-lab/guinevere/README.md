# HIGHFLY UNIQUE SKILL LAB — Guinevere Kit R01

**Scope:** original HIGHFLY prototypes inspired by the mechanical grammar of Mobile Legends' Guinevere. Independent branch. **Not** integrated with main ClaudeCraft Sim or KayKit/GLB; **not** ready to promote to production.

## Use on Android / PC

- Open `index.standalone.html` (single self-contained HTML; no external scripts, fonts, licensed proprietary media, assets, or internet required).
- Android landscape: left virtual joystick to move; press and drag from U1 or U2 and release to cast; drag to top-center CANCELAR to abort; drag empty arena for camera perspective. U2 button becomes a recast/blink button after landing.
- Desktop: 1/2/3 keys quick-cast, or click and drag skill buttons; R resets; use joystick with mouse.
- The HTML uses a **2D top-down simulation only**. The fighter's 3D KayKit rig, native ClaudeCraft visuals and game save are not modified.
- If serving sources locally, use a static HTTP server and `index.html`; standalone is easier for local files.

## Individual standalone skills — provisional HIGHFLY balance

| Unique | New name | Input | Logic | Prototype configuration |
|---|---|---|---|---|
| U1 | Prisma del Vórtice | directional/tap | fixed-speed projectile, first swept collision with enemy/obstacle, mark and slow on live hit, CD refund **only on hit** | range 15; velocity 25; MP 14; CD 5s; 78 damage; slow 0.72 x 1.6s; 5s marks; 0.6s refund |
| U2 | Ruptura Ascendente | ground / recast | range-clamped leap validated against obstacles; landing AoE; airborne mob or boss poise; recast blink + delayed echo | range 8; landing radius 2.1; MP 23; CD 12s; 0.38s travel; recast 4.5s; echo delay 1.5s |
| U3 | Tempestad Suspendida | self cast | 11 independently-authorized damage ticks over 2.1s; 3 marks grant a launch; airborne refresh; boss poise; caster CC immune while active | radius 4.2; MP 40; CD 32s; 352 total damage divided across 11 hits |

Numbers are **deliberate HIGHFLY laboratory placeholders** for feel testing, **not** current MLBB values. The original game is mechanical reference only.

## Architecture and rules

- `core.mjs`: world-independent, deterministic combat state machine with fixed substeps (maximum 120 Hz internal), projectile sweep, cooldown, MP, masks and basic boss fallback. No DOM, Three.js or audio.
- `ui.mjs`: touch UI and Canvas procedural effects. No client-side visual event can alter damage without calling the lab engine.
- `index.html`: human-readable source UI.
- `build-standalone.mjs`: bundles source into a standalone HTML.
- `core.test.mjs`: 40 deterministic Node tests.
- **No auto-attack**. No permanent learned skills, account data, localStorage, telemetry network, copy of MLBB visuals or audio, nor release to GitHub Pages.
- Live adaptation target for a future phase: R20/R21/R22 manual aim, R24A skillshot physics, R28 temporary ATK tester, ClaudeCraft v0.44.0 native Sim, KayKit Rig_Medium and existing VFX bridge. A 2D laboratory result is not a claim of real 3D integration.

## Test

```bash
node --test unique-lab/guinevere/core.test.mjs
node unique-lab/guinevere/build-standalone.mjs
```

Browser smoke: Chrome headless at 1280×720 and S23 approximate landscape 915×412 with DPR2; additional **physical Samsung S23 Ultra touch/thermal** check is still outstanding.

## Planned expansion gates

- R02: precisely capture input/animation timing from **recorded gameplay** and document variant behavior across patches. Release U1 native Sim adapter with real KayKit skillcast, projectile and real mobs before promoting U1.
- R03: U2 leap/root motion + collision/LOS + network authoritative recast + echo SFX/VFX; no player teleport through map walls.
- R04: U3 aerial CC authoring, boss poise fallbacks, 11 native Sim damage events, different target counts, blending and camera impulse.
- R05: S23 physical certification; optimize low allocation (pool all particles) and thermal / FPS baselines.

## Sources and mechanics provenance (checked 16 Oct 2026)

- 2019 official original-server release notes via community transcription: https://mobile-legends.fandom.com/wiki/Patch_Notes_1.3.52_(Original_Server)
- Guinevere wiki updated over time: https://mobile-legends.fandom.com/wiki/Guinevere
- 2026 contemporary references: https://www.mlbbguides.com/heroes/guinevere/ and https://titosenpai.com/heroes/guinevere
- Patch 1.9.20D documented airborne duration reduction to 0.8s and animation startup/recovery improvements: https://liquipedia.net/mobilelegends/Patch_1.9.20D
- Earlier patch 1.8.30 documented stun before second U2 strike and U3 repeated airborne cap increase from 6 to 8: https://liquipedia.net/mobilelegends/Patch_1.8.30

**Do not claim verified**: exact cast startup, backswing in frames, projectile speed/hit-radius measured in MLBB world units, invincibility timings, tick distribution, full current patch changes, or exact U2 illusion behavior under various attacks. These must be measured from instrumented gameplay rather than invented.
