# HIGHFLY SKIN 7 — ARTISTIC NO-GO / STOP RELEASE
**Review date:** 2026-10-10
**Review status:** REJECT CURRENT ARMOR AS A PRODUCTION/QUALITY MODEL
**Block 2:** OPEN — geometry technology POC GREEN, modular-quality armor FAILED
**Block 3:** BLOCKED — QA and release cannot rescue art pipeline insufficiency
**Public game and V10–V20:** DO NOT TOUCH

## Reality check after actual rendered front/side mobile captures
The user reviewed Crimson Tech Oni candidate and rejected it: "parece una hormiga roja con una máscara de bajo nivel" and pointed out that it is NOT the modular fitted armor factory requested. The technical authoring workflow did create true GLB 3D geometry and native skinned weights; **THAT DOES NOT MEAN VISUAL ART ACCEPTANCE**.

Evidence:
- GREEN Blender/Three test workflow: https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38058714613
- Generated screenshot and QA artifact: https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/38058714613/artifacts/11671748950
- 68 Blender-created objects / 70 material-split glTF render meshes. Raw counts are not premium quality and must never be represented as such.
- Front screenshot: big stylized exposed white source head/ears, thin red half helmet with very tall spikes, crude geometric hanging face mask, tiny chest/shoulders vs enormous head. Side screenshot: mask is visibly forward/detached instead of a fitted facial shell; partial black and red under-armor is visible under overlays. Art FAIL.

## Actual root causes in source
1. `skin7-supreme-forge-ui.mjs` mounts Nightfall first (`nativeNightfall()`) then ATOP that already-armored actor mounts a `HF7_...` group. It does NOT remove/replace old armor meshes by modular slot nor operate on a bare native body. Layering is the wrong product paradigm.
2. Procedural Blender `shell()`, `plated()`, `ring()` create generic mathematical volumes parameterized from Nightfall armor donors rather than an authored coherent anatomical hard-surface suit / plate topology. They are genuine 3D but not a production-ready model.
3. The kabuto uses measured head bounds but not an integrated sculpted facial shell, brow, cheek, jaw, neck, seam/fixation architecture. Its mask remains visually detached in profile despite normal/bounds GREEN.
4. Recipe parser selects just 2 preauthored shape families and modest bounded morph parameters. Arbitrary image/text does NOT make a new unique suit; extracted image colors are not form creation.
5. Browser gate verifies native rig/geometry bounds, bone attachment, GLB export and local approvals; it has NO true surface fitting, modular swap semantics, visual occlusion/clipping gate, or artistic quality certification.
6. Browser `ADENTRO` stores a local IndexedDB GLB but does NOT constitute user acceptance of this candidate, nor a shared server-side permanent production catalog.

## Correct BLOCK 2 acceptance BEFORE Block 3
**REBUILD THE ART WORKFLOW, not another cosmetic tweak:**
A. Audit *actual* original modular ClaudeCraft body + available armor slots, body garment dependencies, skins, wearables, donors, joints and sockets. On-stage toggles to show body alone and each equipped slot; prove no old armor is accidentally layered. Preserve Rig_Medium, original weights/animations, and work exclusively in isolated branches.
B. Create a dedicated `slot equipment controller`: unequip previous armor slot, equip versioned new fitted piece, rollback by slot, left/right independence, M/F body bindings and visibility. Use real mesh replacement/attachments where appropriate; do not mistake additive geometry for a modular wardrobe.
C. First build **ONE** complete coherent original low-poly premium armor with deliberate sculpted anatomy and proportioning: fitted helmet that encloses the original head coherently, asymmetrical *volume-based* pauldrons, shoulder-to-chest-to-waist-to-back visual continuity, rig-safe articulating segmented plates, bracers/greaves and intact weapon sockets. Favor quality, not part-count. Start with source body and stripped armor; validate front/3/4/profile/back M/F in neutral and aggressive clips.
D. Real recipe-driven subsequent editing must alter fitting/shape/pieces/attachments and generate/export that same new geometry; a stylized photo is only a creative reference, never an automatic photo-to-3D claim.
E. Build front/profile/back screenshot comparison visual QA; add surface intersection and skinned animation deformation checks on actual body. Reject floating/flat masks, exposed source head when helmet is specified, insect silhouette, overlapping old legacy armors. User gives explicit art acceptance AFTER reviewing those visual results.
F. Do NOT proceed to Unity/PWA/Pages release Block 3 until a complete coherent original armor on both M/F characters is visibly approved. Preserve current GREEN tech prototype as archived POC; V20 public remains canonical until later explicit approval.

## Final gate
**BLOCK 2 STATUS: ARTISTIC NO-GO. KEEP CODE PROOF; DO NOT PRESENT AS FACTORY OF DREAMS, COMPLETE SUIT, OR PRODUCTION READY.**
