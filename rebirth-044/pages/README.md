# HIGHFLY REBIRTH — independent Android preview publisher
Source candidate: ClaudeCraft v0.44.7 + Golden R2 + R3/R4 HP/MP/EN + R6 native-save resume.
Protected existing site: `https://drakentzy07.github.io/cobalt-hollow-lab/`.

To publish without ever touching that site:
1. Create a **public, new** GitHub repository exactly `drakentzy07/HIGHFLY-REBIRTH`.
2. In that repository, set Settings → Pages → Build and deployment → GitHub Actions.
3. Install this file **inside the new repository** as `.github/workflows/pages.yml` (not in cobalt-hollow-lab).
4. GitHub Actions builds and deploys the isolated web game to the new repository's Pages site.
5. After actual success, browse `/HIGHFLY-REBIRTH/?hfRebirth=1` on the S23 Ultra.

The independent workflow must be pinned to the final GREEN R6 commit before publishing; it is currently pinned to a preparatory commit.
Do not call this preview validated until run green, Pages HTTP responds, first login works, and physical S23 playtests pass.
Preserves original nine classes, original skill catalog and v0.44.7 world; no automatic post-20 content.
