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
2. RUN1 — class + subclass rules
3. RUN2 — hybrid HIGHFLY skills
4. RUN3 — unique-scenario skill unlocks

Older HIGHFLY repositories remain untouched.

## Licensing
ClaudeCraft source code and media assets have different licensing rules. Preserve upstream LICENSE, CREDITS.md and THIRD_PARTY_NOTICES.md, and do not assume media is MIT simply because source code is MIT.
