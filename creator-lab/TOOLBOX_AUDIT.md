# HIGHFLY CREATOR LAB — TOOLBOX AUDIT / FABRICATION ROADMAP
Reviewed source: `drakentzy07/cobalt-hollow-lab`, branch `highfly-creator-lab`. Stable public Skin Factory and game are out of scope.

## Facts observed in the source (not promises)
| Capability | Status before audit | Basis |
|---|---|---|
| Authentic Warrior and rig | GREEN | Frozen 3,477,500 B GLB and Rig_Medium / 23 bones / 22 native clips; CI contract |
| Browser 3D/orbit on desktop/S23 | GREEN | Three.js 0.185.0 / Playwright CI |
| Original curved feather primitives | GREEN prototype | `geometry.mjs` Catmull-Rom ribbons, mirrored geometric attachments |
| Nine-category avian helmet | GREEN functional / DESIGN IN PROGRESS | `helmet.mjs`; screenshot still has anatomical/design mismatches |
| Numeric slider controls, per-piece color, save, local undo/redo | GREEN basic | `creator.mjs` and browser test |
| Native facial landmarks/alignment | MISSING → toolbox gate | Head bind reference exists; no landmarks extracted or displayed before this audit |
| Transform handles directly in 3D | MISSING → toolbox gate | Per-piece numeric transforms previously only |
| Import JSON recipe | MISSING → toolbox gate | JSON previously export-only; local storage only for recovery |
| Geometry budgets and degenerate triangles | MISSING → toolbox gate | Previous validation checked only finite coordinates |
| Standards-based exported GLB validator | MISSING → toolbox gate | Previous CI asserted only byte count |
| Morph brush, editable subdivision, retopology, UV painter | NOT IMPLEMENTED | Requires scoped architecture, performance and regression work |
| Automated native mesh weight transfer | NOT IMPLEMENTED | Rigid headwear works; body armor deformation is a separate pipeline |
| Automated Blender worker in GitHub Actions | NOT IMPLEMENTED | Potential free, licensed tool but not installed/integrated yet |
| Exact concept-art-to-GLB reconstruction | NOT IMPLEMENTED | Reference art isn't a 3D asset; requires real original modeling and visual review |

## Useful toolkit, no decorative buttons
**Priority A / actual build and QA:** bind-space anatomical markers from original eye / brow / mouth meshes; viewport placement handles with snaps; file-based recipe import; real mesh validity and mobile polygon budgets; Khronos GLB validation. These specifically prevent today's face misalignment, slow placement and silently broken exports.

**Priority B / before torso and full armor:** geometry shells/lofts, support loops, bevels, editable 3D profile curves, surface attachment, collision/clipping analysis per animation, skinning/weights, modular sockets, material mask tools. Implement only when the first real test piece requires them.

**Priority C / later:** Blender headless optional donor-free forge, rigged armor with automatic weight transfer and automatic LOD/baking. They must be measured and tested before being exposed as UI controls.

## Quality gate
A claimed GREEN must mean: actual frozen character rig, face reference matches real native bound meshes (otherwise fails loudly), valid geometry, editable controls, history and file recovery, round-trip GLB validation, desktop and S23 smoke, screenshots for three views. **GREEN technical does not assert visual concept-quality**. The latter requires side-by-side creative inspection and user acceptance.

## External free technologies assessed
- Three.js OrbitControls, TransformControls, GLTFLoader/Exporter — MIT library, reused rather than rewritten.
- Khronos glTF-Validator — free official conformance checker: https://github.com/KhronosGroup/glTF-Validator
- Blender headless Python — free Blender engine possible via CI (https://docs.blender.org/manual/en/4.2/advanced/command_line/arguments.html), not yet installed/verified.
These do **not** imply a full Blender clone or a finished original helmet.

**Isolation:** `highfly-creator-lab` only. Do not update `SKIN_FACTORY_SOURCE_SHA`, main game or publication pin without completed checks and visual review.
