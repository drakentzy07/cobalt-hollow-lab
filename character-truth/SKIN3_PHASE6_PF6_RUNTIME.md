# HIGHFLY SKIN 3 — Phase 6 · REAL frozen PF-6 browser

- **Actual frozen build:** PF-6 RUN #37770166898, Pages artifact \`github-pages\` ID 11548096837. We download and open THAT frozen build, not newer public GitHub Pages.
- All tests run on isolated GitHub Actions runner, localhost only, no writes to project or production.
- Use real offline character creator; dynamically choose the 4 selected original PF6 class options and both M/F genders; assert native \`player_<class>_modular\` preview marker AND WebGL context AND rendered frame.
- Capture eight native creator preview screenshots and a female Warrior in the playable world after normal offline entry.
- The original PF6 has nine baseline class definitions. It is *not* a release test of HIGHFLY's later four-main/four-heritage class fusion.
- Diagnoses failures openly. Do not conflate visual marker + WebGL context with full skinning, texture/rig clearance, mobile hardware performance, or final designer approval.
- Real game world player must exist and renderer must be instantiated. Never insert fake player, proxy GLB, generic substitute camera or bypass world boot.
- Any defects or missing coverage remain in JSON evidence; no automatic armor approval.
