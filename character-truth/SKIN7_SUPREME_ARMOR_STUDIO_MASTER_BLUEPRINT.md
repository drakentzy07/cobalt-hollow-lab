# HIGHFLY — SKIN 7 — SUPREME ARMOR STUDIO
**MASTER BLUEPRINT v1.0 | 2026-10-10 | Status: architecture candidate, NOT new functional forge**

## A. Product: the true artisan workshop
ONE authentic original ClaudeCraft/HIGHFLY male/female Hunter (`Rig_Medium`, exactly 23 native bones), visible on a Three.js stage. The user describes/drops a reference and ChatGPT authors the armor professionally in Blender. The user **tries → reviews → edits → ACCEPTS into isolated catalog OR REJECTS candidate**. An accepted skin is NOT automatically merged into HIGHFLY gameplay. Avoid pretending raw RGB extraction is a generative 3D AI.

**Invariant:** No modifications to old V10–V20 routes, old labs, old committed source models, original native skeleton/weights/animation authority, Training, Skills, Monster, PF6, public game's Pages. Separate branch and preview release. No compulsory paid image-model service. Do not use a substitute skeleton.

## B. Technical truth from repository
- Pinned success: V20.1 source SHA `93ed92935147ec2de07b4942a78aaf3ea06ca99d`; real original Hunter simulated-mobile CI RUN `38018797928` GREEN; independent Pages RUN `38018893463` GREEN.
- `dream-studio-v17.mjs`: cockpit, existing local saved projects, history/compare. KEEP.
- `dream-image-v16.mjs`: local RGB histogram and coarse 2D foreground, NOT semantic image understanding, depth or unknown part creation. USE ONLY FOR COLOR SUPPORT.
- `dream-recipe-v15.mjs`: keyword-driven existing geometric catalog and PBR. COMPATIBILITY ONLY.
- `head-fit-math-v18.mjs`: conservative helmet-vs-source measurements; NOT collision certification.
- `nightfall-body-forge-v12.py`: first verified Blender original meshes skinned to native existing bones, nearest-weight donor transfer. REUSE.
- `legendary-geometry-v19.py`: **32** genuinely new weighted 3D ornamental meshes, but the user visually judged shoulder spikes as small floating blades rather than a coherent armor silhouette. REUSE PIPELINE; REPLACE UNACCEPTABLE ART DIRECTION WITH RECIPE-DRIVEN NEW SHELLS.
- `legendary-forge-v19.mjs`: real browser mount and export on existing 23 bones. REUSE bind verification.
- `supreme-recipe-v20.mjs` and `supreme-v20-ui.mjs`: text/image → structured intent + material recolor and bounded shoulder scaling of V19 geometry. **NOT freeform text/image→new 3D**. MIGRATE AS ADAPTER.

## C. Only THREE major delivery blocks

### BLOCK 1 — AUDIT, BLUEPRINT AND FREEZE
Read all existing pipelines and source licenses; inventory genuine skinned body slots/rest-frame, GLB glTF2 skins, bone names, dimensions, weight indices, maps and revisions; pin immutable base. Define new `SkinRecipe`, `PartSpec`, `ForgeJob`, `CandidateManifest`, `Approval` schemas, versioning and test fixtures. Document coordinate systems (Blender/glTF/Three/Unity) and asset pipeline. Declare acceptance criteria for one real pilot.
**Exit:** approved architecture, tests, source manifest, exact pilot specs and no changes to published game or studio.
**Current state:** this document opens Block 1; full inventory/test fixture evidence still required before freeze.

### BLOCK 2 — COMPLETE ARTISAN FORGE CORE (one real deliverable, not patches)
Single end-to-end candidate creation:
- Text/image reference interpreted into structural Parts, materials, unknown/hidden geometry notes. We may use assistant vision/manual authoring; V16 alone never invents 3D.
- Procedural Blender code/modeling generates **new topological meshes with genuinely different vertices/faces**, template kinds: real pauldron shells, molded chest, curved kabuto/oni horns, layered side/front/back faulds, rear guards, bracers, boots and neck guard. Geometry parameters influence visible silhouette, including L vs R asymmetry; 2D paint/color cannot pass the geometry gate.
- Native original M/F body landmarks; transfer weight groups from verified deforming donor meshes, max 4 normalized weights; rigid helmet attachments use actual head bone, inverse bind preserved. Never duplicate Hunter source mesh or skeleton.
- GLB and reproducible Blender script/recipe exported with authoritative manifests. Native shader/PBR materials, source/texture licensing manifest. Focus mobile low-poly performance.
- One coherent **new** UI workflow (not stacked legacy panels): `CREATE → FORGE → TRY ON ORIGINAL HUNTER → TUNE → ACCEPT / DISCARD → EXPORT`.
- Candidate sandbox: reject destroys/archives candidate only; approve creates immutable `approved/<designID>/<version>` catalog entry, always explicit and isolated. Existing approved records cannot be overwritten accidentally. GitHub CI GREEN never equals user visual APPROVED.
- **Pilot target:** original HIGHFLY `Crimson Tech Oni`, inspired by the previously provided red/gold samurai reference: big asymmetric LEFT pauldron, medium RIGHT pauldron, brand new real chest volume/core, layered waist skirts, rear guard and kabuto/horns, matching arms/legs. Visually distinct from Nightfall in front, 3/4, side, back.
**Exit:** NEW generated geometries for both M/F from recipe; working accept/reject loop; GLB import-back, source files, screenshots, mobile simulated browser and animation previews, normal/intact existing routes. No gameplay integration.

### BLOCK 3 — TECHNICAL AND ARTIST CERTIFICATION + ISOLATED RELEASE
- Machine validation: official Khronos glTF-Validator on final GLB, skin JOINTS_0/WEIGHTS_0 and inverse bind matrices, real native bone name/23-bone signature, bounds/normals, no accidental original skinned body duplication, zip/package hash and material budgets, texture licenses.
- Blender GLB reimport and animated Blender deform test; Three.js integration with genuine native actor, sample `Idle`, `Walking_A`, `Running_A`, `Block`, `1H_Melee_Attack_Chop`. Automated sample clipping/intersection where useful; recorded residual visual clipping flags. Visual screenshots front/side/back 3/4 and checks of left/right silhouette.
- Actual **physical S23 Ultra** load/graphics/controls require access to device or user QA screenshots; simulated 915x412 Chromium is not equivalent. Real Unity 6000.6.2 Editor import/SkinnedMeshRenderer/URP + glTFast material/animation reimport requires an actual runner/project; never mark certified based only on JS tests.
- Preserve SHA-256 of frozen old site entrypoints and original GLBs; publish ONLY a new isolated path in independent Skin Lab Pages after Green CI and art review. Any gameplay integration is a distinct later branch/PR and explicit user acceptance.
**Exit:** technically valid repeatable 3D skin authoring workflow and a user-accepted first premium set, with honest outstanding Unity/physical-device warnings if untested.

## D. Canonical versioned contracts (draft)
- `SkinRecipe/1`: designId, ES prompt, referenceInfo {hash, rights/provenance, photo uncertainty}, target M/F, base native rig fingerprint, palette/PBR, parametric PartSpec array.
- `PartSpec/1`: stable part ID, slot = HEAD/CHEST/SHOULDER_L/SHOULDER_R/ARMS/HANDS/WAIST/BACK/LEGS/FEET; authored shape primitive/topology + dimensions/curvature/edge thickness/protrusion; mirror/asymmetry; donor/weight strategy; material; edit toggles; collision constraints.
- `ForgeJob/1`: source original rig and donor file SHA256, Blender generator SHA, Blender version, seed, recipe SHA, output paths, warnings.
- `CandidateManifest/1`: authored meshes names, triangles/vertices/draw calls, skeleton signature & 4-weight normalization stats, file sha, animation proof, image screenshots, source licensing, glTF-validator output, mobile profile, state DRAFT/QA_REVIEW/APPROVED/REJECTED.
- `Approval/1`: candidate id and SHA, explicit user approve/reject, catalog state, review notes, immutable approved artifact location; never automatic gameplay deployment.

## E. Specific acceptance/rejection gates
1. **Reality:** changing `shoulder_left` param creates different 3D coordinates/topology, not just color/scale of old Nightfall, compared to right shoulder.
2. **Rig:** exact 23 native bones and original animated actor remain unchanged; weighted armor follows motion in several representative poses.
3. **Art:** silhouette legible in 4 views, body volumes don't hover, geometry is coherent, references guide an original design rather than false exact copy.
4. **Control:** approve/reject actually changes only candidate/catalog; project undo/save/resume; no published app mutation.
5. **Portable:** real GLB loads in Blender and Three; glTF validator checks. Unity and real Android remain separate explicit certification gates.
6. **Regression:** old Pages entrypoint checksums frozen and no pre-existing modules overwritten.

## F. Technical research references and engineering notes
- [Blender glTF import/export](https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html): actual mesh + skin export, joints, materials, coordinate basis.
- [Three.js SkinnedMesh](https://threejs.org/docs/pages/SkinnedMesh.html): skinIndex, skinWeight, bindMatrix and skeleton sharing.
- [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html): GLB loading/extensions and decompression handling.
- [Khronos glTF Validator](https://github.com/KhronosGroup/glTF-Validator): independent glTF2/GLB binary/schema validation, official project.
- [Unity glTFast](https://github.com/Unity-Technologies/com.unity.cloud.gltfast): Unity package for editor/runtime glTF import/export. Unity actual testing necessary, URP shader variants not guaranteed by browser render.
- If the user cites proprietary online image-to-3D products, consult feature ideas/public documentation, **do not pretend their private models/code are freely accessible** or silently add credit-based dependencies.

## G. Decision
**Exactly three product steps.** Internal commits/tests are allowed but NO mini-public releases for each correction. Whole deliverables are audited/frozen and users see one coherent studio, with rollback to GREEN V20.1.

**Architecture status:** REVIEW OPEN; Phase 2/3 are scheduled work, not yet claimed done. Existing V20.1 Pages remains the latest published.
