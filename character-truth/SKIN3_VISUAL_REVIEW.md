# HIGHFLY SKIN 3 — Visual review of original-character browser proof

## Evidence
- Parent immutable static GREEN: [RUN 37803666522](https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/37803666522).
- Original inventory reused in Phase 2: [RUN 37804294614](https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/37804294614).
- **Source GLB browser dynamic GREEN:** [RUN 37806372108](https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/37806372108).
- Browser proof artifact: [35 screenshots + JSON](https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/37806372108/artifacts/11562064631).
- Branch commit validated: `d87b0f1a6cc9f75f45af8fb096ee4286e97c72c6`.

## Reproducible machine evidence
- The exact six frozen original GLBs were SHA-checked, decoded as required for analysis, and read by the browser.
- 35 browser samples: male and female bare bodies in front/profile/back; each gender with each of the 7 **original** class kits; fixed knight; male 7 motion clips; female 6 motion clips; fixed knight shield bash.
- Output diagnostics: 35 samples, 0 browser exceptions/failed requests, 23 original joint nodes, finite evaluated joint matrices, nonzero GPU triangle counts, movement on sampled animation channels.
- In kit stills the real original meshes render; e.g. male knight 12 armor meshes/7798 triangles; female knight 12 armor meshes/7928 triangles; male rogue 10 armor meshes/7956 triangles; female rogue 10 armor meshes/8086 triangles. These metrics are diagnostic, not runtime budget certification.

## Visual inspection: what was actually seen
- Real `M_` and `F_` unarmored/source-body portions are displayed independently, with front/profile/back snapshots. The separate female chest garment is visible. Distinct native skin/body meshes are used (no proxy).
- Knight and rogue authentic kit geometries appear on both genders in captured front views; seven kits have per-gender snapshots.
- Walking, running, leaping, block, hit and melee actions produce changed poses in screenshot samples, but a *single sampled frame* per clip does not establish seamless complete motion, collision-clearance, or weapon grip.
- The viewer uses a conservative subset of authored body/face parts and prefix-only armor selection, **not** the final `modularPartNames` compositing algorithm. Hair, lashes, earrings, special helmet visibility, mixed-slot loadouts and face/body slider extremes are not verified. No visual judgement of zero clipping has been signed off.

## Mandatory next dynamic evaluation — UNAPPROVED
1. Run the actual PF-6 binary and trace visual selection in creation, save/load and gameplay by class and gender; compare composed and fixed Warrior visual routes.
2. Use the original upstream `modularPartNames`, `slotCovered` and helm/hair rules, including makeup and all underlying-body visibility, in an isolated evidence-only viewer. No hand-coded competing compositor should be shipped.
3. Cover separate body/face slider end states and create a bind/morph/posed full-body Character Design Cage. Record the donor SHA and 3D clearance in each slot across gender and animation.
4. Capture multi-angle sampled frames *throughout* each movement clip, not just midpoint, including dash/parry where clips and runtime state actually exist.
5. Test socket/grip transforms for mainhand/offhand, shield and stow, against PF-6 runtime. Check in landscape on Samsung S23 Ultra and measure performance.
6. Sign per-slot/per-set compatibility matrix only after photographed human-reviewed evidence and functional verification. No premium armors can be treated as compatible yet.

**Release decision:** SOURCE BROWSER MOTION = GREEN. PF-6 FULL CHARACTER, RETARGET/DEFORMATION, ALL ARMOR CLIPPING, DESIGN CAGE, S23 = NOT CERTIFIED. Do not modify PF6, frozen source, rig or other GREEN branches.
