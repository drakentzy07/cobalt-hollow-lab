# HIGHFLY WORLD GENESIS G2 — Isekai premium pre-alpha

## Source and playable artifact
- G2 demo HTML is an independently delivered **single-file offline test** built from the user's verified official RG Poly package. It is not yet uploaded as an asset to GitHub Pages.
- Preview reconstructs 1,981 scene meshes and uses 736 exploratory geometry AABBs. Objects/positions are source-derived. The source Unity Terrain, full URP textures and animated KayKit Hunter have **not** been integrated.
- Entry, blacksmith, wolf, resource bars and abilities are **real interactions within the offline demo**, but are **prototype implementations**: they are NOT the authoritative native Sim's combat, loot, NPC or save system.

## G2 validation
- Standalone generated HTML JavaScript parses under `node --check`; simulated WebGL/DOM state smoke confirms source instantiation count, blacksmith dialogue, trial weapon, wolf death and quest completion.
- The test machine enforces Chromium URLBlocklist `*`, blocking `file://` and localhost in browser automation; no verified physical S23 WebGL claim.
- This repository contains the pure trial quest contract and tests, not the 5 MB standalone binary HTML. The existing isolated G1 WebGL build and Android browser smoke are retained.

## Next promotion gates
1. Compile the original RG Poly Unity Terrain+mesh+materials via NEXUS; verify real map identity and physical traversability.
2. Integrate original KayKit Hunter rig with real movement, camera-relative 360 and aiming, not the faceted offline proxy.
3. Bind **native Sim** damage, AI, NPC, loot, resources and Training Core to one Hunter; remove prototype gameplay authorities.
4. Test S23 landscape touch, loading and memory pressure in real Chromium/physical Android.
5. Only then add the isolated /genesis/ Pages route to the certified existing Pages snapshot **without replacing Draken's root or WORLD/LAB saves**.

## Separation
- The G2 trial quest is in-memory only; no localStorage/indexedDB writes and no old HIGHFLY saves.
- All four skill references are visual/trial semantics, NOT an additional class or hidden Warrior.
