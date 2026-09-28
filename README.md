# Cobalt Hollow Lab

Public integration laboratory built around a frozen ClaudeCraft upstream.

## Upstream pin
- Repository: levy-street/world-of-claudecraft
- Release: v0.44.0
- Commit: 9b57e49c9676d75962700f828cc00a50a9a988b5

## Architecture
This repository does **not** duplicate the full ClaudeCraft repository or its multi-gigabyte asset library.

Instead it stores:
- upstream pin metadata;
- HIGHFLY-compatible overlays and patches;
- focused test harnesses;
- GitHub Actions workflows;
- documentation and compatibility manifests.

CI materializes only the ClaudeCraft code/assets needed by a specific experiment.

## Run sequence
1. RUN0 — thin offline/combat runtime
2. RUN0.5 — mobile stabilization: character preview, material/textures, Spanish shell, HIGHFLY movement/camera
3. RUN1 — class + subclass rules
4. RUN2 — HIGHFLY skill integration
5. RUN3 — unique-scenario skill unlocks

Older HIGHFLY repositories remain untouched.

## Skill preservation rule
Until the ClaudeCraft base is fully stable and manually approved on mobile, **do not replace, redesign, or inject HIGHFLY skills**.

For RUN0.5 and RUN1:
- preserve ClaudeCraft's original abilities, combat logic, VFX and progression;
- use ClaudeCraft's original committed skill icons whenever an ability has one;
- fix broken asset paths instead of substituting proxy artwork;
- empty/unassigned action-bar slots must remain empty rather than being filled with HIGHFLY skills;
- HIGHFLY skills begin only in RUN2 after the base runtime, mobile controls and original ClaudeCraft combat have been validated.

## Licensing
ClaudeCraft source code and media assets have different licensing rules. Preserve upstream LICENSE, CREDITS.md and THIRD_PARTY_NOTICES.md, and do not assume media is MIT simply because source code is MIT.
