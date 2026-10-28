# HIGHFLY ORIGIN v0.20 — P5 LAN-only playable evaluation

## Baseline pinned
- Last verified unified ART253 + FURY P4B commit: `ffd1b8dc56492335c171195adcb338162ecff94d`
- [Unified GREEN run #40776437532](https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/40776437532)
- Original ClaudeCraft v0.20.0 commit: `4cedc7fbf49e7179f4c29b3db2d0b2bc5bab3d25`
- P5 branch created from the exact GREEN commit, preserving ART253 files and all P2/P3/P4A/P4B overlays.

## Fastest non-public physical S23 test
Use the companion `HIGHFLY_ORIGIN_P5_PRUEBA_LOCAL_S23.zip` prepared for the project owner. It contains only Windows CMD/PowerShell launch scripts and instructions, **no copyrighted third-party game assets**.

The launcher on user's own PC:
1. Confirms Git, Node 22+, npm, pins, and all 253 original HIGHFLY WebP hashes.
2. Clones the pinned original game and HIGHFLY overlay separately into `%LOCALAPPDATA%/HIGHFLY_ORIGIN_P5_TEST_LOCAL`, without mutating old clones.
3. Records hashes of the 253 old icons and applies P2 offline persistence, P3 world/test boot and HUD, P4A analog and camera, P4B dash and double-jump logic, plus all ART253 replacements.
4. Runs original TypeScript and Vite build, verifies all 253 replacement images in `dist`, and fails if any original icon bytes recur elsewhere.
5. Serves the complete build from `npm run preview` on `127.0.0.1:4173`, optionally on `0.0.0.0:4173` **only at user request and on a trusted private LAN** for Samsung S23 Ultra landscape.
6. The playable test URL is `http://127.0.0.1:4173/play.html?highfly_p3=1` on PC or `http://<local LAN IP>:4173/play.html?highfly_p3=1` on the S23, with PC kept running.

## Why not GitHub Pages yet
GitHub Pages static sites are ordinarily public Internet endpoints. The v0.20 code is MIT, and most catalogued third-party art is CC0 or MIT, but the source credits additionally include licensed project-generated panoramas and proprietary Meshy paid-plan models. WalletConnect/Reown third-party license notices also require review for distribution. Replacing 253 icon bytes only solves that specific CraftPix risk, not all asset licensing rights.

**NO PUBLIC PAGES / APK / ARTIFACT UPLOAD** until all bundled art/audio and dependency rights are documented and any incompatible assets swapped.

## Current completeness
- CI GREEN verifies original world, offline persistent inventory, 253 images in built dist, no exact old CraftPix bytes, browser 915x412 dual sticks/camera/ATK, and Vite compilation.
- Physical S23 game feel is **not yet verified**.
- The P4B state machine supports dash/energy/cooldown and double jump, but 4-way animated somersault and polished mobile HUD are still unfinished. The green browser smoke primarily exercises P3/P4A.

## Next evaluation
Have owner try launcher in a personal network, note Wi-Fi link and report full-screen, camera, input responsiveness, FURY dash/jump and NPC/monster behavior. Do not publicly expose the temporary HTTP server.
