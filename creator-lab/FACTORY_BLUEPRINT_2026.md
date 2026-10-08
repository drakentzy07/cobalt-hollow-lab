# HIGHFLY UNIVERSAL CREATOR FACTORY — TECHNICAL BLUEPRINT 0.1
**Product:** HIGHFLY AI Creator (architectural roadmap, NOT yet an operational AI generator).
**Isolation:** `highfly-creator-lab` only. Never touch `highfly-skinlab-v2-warrior-black`, the training application, stable GAME, or Pages source pin without independent green/visual review.

## Strategic goal
One reusable asset production platform for HIGHFLY skins, playable characters, monsters, weapons, VFX skills, interiors, terrains and eventually dungeons. The platform is our own **workflow and interface**, built on responsibly reused free software. We do **not** clone Blender, Unity or commercial AI models and we do not own their third-party software.

## Top five generation systems: research-derived design patterns
| Reference | Legitimate reusable workflow idea | Cost / license reality | Production decision |
|---|---|---|---|
| Meshy 7 | Text/image concept → geometric candidates → remesh → textures/rig → revision | Free credits, free output CC BY 4.0 (attribution); paid API; its model weights are not ours. https://docs.meshy.ai/en/webapp/pricing | UX inspiration, optional provider later; NOT a free dependency. |
| Tripo AI | Text/image/multiview reconstruction, versioned iterations | Free tier; API endpoints use billed credits. https://www.tripo3d.ai/pricing https://platform.tripo3d.ai/docs/billing | UX inspiration; optional paid provider OFF by default. |
| Rodin / Hyper3D | Hero assets with geometry/material refinement, LOD thinking | Free basic preview; pay for more exports/features. https://hyper3d.ai/pricing | Learn iterative geometry-review pipeline; no proprietary source borrowed. |
| Microsoft TRELLIS.2 | Image-to-3D, PBR, O-Voxel topology | MIT for primary repo; separate licenses on dependencies; requires NVIDIA GPU >=24GB Linux per docs. https://github.com/microsoft/TRELLIS.2 | Candidate future GPU worker; NOT usable as a free GitHub Pages JS widget. |
| Tencent Hunyuan3D 2.1 | Image geometry/texture generation | Community license with territory, redistribution and other conditions; shape+texture ~29GB VRAM. https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1 | RESEARCH ONLY until license/legal/hardware checks; NOT MIT. |

**Do not treat version labels, speed/quality rankings, "best in world" or other services listed in Gemini text as verified without independent audit.** Another promising option is Stable Fast 3D, but its Community License has registration and revenue conditions: https://stability.ai/license. None grants unlimited zero-cost commercial AI API calls.

## Production engines (the REAL free core)
- **Three.js (MIT)**: browser editor, selection/gizmos, anatomy UI, material parameters, screenshots, GLB export. https://threejs.org/license/
- **Blender (GPL)**: CPU headless forge with `bpy` for curve bevels, booleans, mesh remesh, UV and export. Integrate via optional isolated Github Action or workstation worker; Github Pages cannot execute Blender Python.
- **Khronos glTF Validator**: verify GLB structure and resource compatibility; no claim about aesthetic quality.
- **glTF-Transform / Meshopt**: remap, weld, optimize and compress assets subject to compatibility/quality gates.
- **Unity (Unity license, not open source)**: potential importing and runtime validation for Unity Android build. Import of GLB into Unity requires an explicit tested compatible importer; **a Three.js GLB preview does not prove Unity in-game compatibility**.
- **Existing ClaudeCraft / HIGHFLY runtime**: maintain exact Rig_Medium 23 bones, 22 native clips; avoid fake characters and rip out all protected mechanics.

## Full anatomical fitting (user-discovered P0 design defect)
The original 0.3 helmet moved eyes+brows in Y but left mouth, cheeks, beak, skull and ear plumage fixed. This is NOT coherent fitting. Native mesh `reference_head.glb` contains `M_Head`, `M_Eye_almond`, `M_Brow_soft`, `M_Mouth_neutral`, `M_Ear_round` when available. New pipeline:
`native inverse bind → bilateral anchors → facial plan → all mask subsystems + front shell displacement → 22-clip tests → side/front/back screenshots → human design review`.
- The fit calculates real anchors for eyes, brows, mouth and ears and lists missing/bilateral failures. It never fabricates missing anatomical geometry.
- All frontal pieces must share a coherent adjustment. Manual fine adjustment is optional, saved in recipe/undo.
- An accurate anchor fit is necessary but NOT sufficient for a premium seamless silhouette; topology, bevel and visual testing remain indispensable.

## Needed generic asset pipeline
```
USER DESIGN INTENT / MULTIVIEW ART / NATIVE GLB
    ↓
TASK PLANNER → safe reversible TOOL PLAN (schema, approvals, limits)
    ↓
3D GEOMETRY ENGINE (Three browser + optional Blender worker)
    ↓
REAL ANATOMY / RIG SOCKETS / COLLISION & DEFORMATION
    ↓
MATERIALS (PBR, atlas, UV, authored or rights-cleared textures)
    ↓
QA (geometry, mesh budgets, GLB validation, animations, visual 3-views)
    ↓
ASSET CATALOG (GLB + recipe + license provenance + screenshots + checksum)
    ↓
USER ACCEPTANCE → isolated runtime GAME integration
```

## AI orchestrator contract, NOT a hidden unreviewed agent
- Local browser tools expose **typed, validated, reversible** commands (paint selected part, edit curve, move socket, mirror piece, add/remove geometry, generate candidate).
- Future LLM adapter emits schema-constrained commands only; model cannot directly execute shell, call arbitrary URLs, commit to GAME, overwrite protected data or leak repo credentials.
- Each plan: validate → preview draft → user approval → execute in isolated candidate → programmatic QA → present screenshots → explicit promotion.
- If a GPU model is required: request/verify hardware and license before enabling provider. Never imply free GitHub Pages can generate photorealistic 3D models.

## Asset classes & common capabilities
| Asset type | shared base | specialized later |
|---|---|---|
| Skins/helmets | curves, booleans, per-part paint, anatomy, GLB, screenshots | full skinning |
| Original characters | meshes, material atlas, animation QA | new rigs, retargeting, facial blendshapes |
| Monsters/bosses | mesh + rig + materials | nonhuman skeletons, damageable parts, AI action graph |
| Weapons | mesh + sockets + material | collision volumes, authored combo animations |
| Skills/VFX | renderer and animation sequencing | particles, shader graph, animation/hit authority |
| Maps/dungeons | modular geometry + saved recipes | terrain streaming, navmesh, occlusion, runtime perf |
| Full MMO (later) | versioning and validated assets | authoritative server, networking and accounts ONLY if multiplayer scope is approved |

## Native performance budget and quality status
Current starter S23 per-accessory threshold is 30,000 triangles / 24 distinct materials / 180 meshes **as a conservative test contract**, not a universal Android specification. Decimation and draw-call profiling later, with visual acceptable delta. No guarantee of 60 FPS before actual phone testing.

## Dependency/cost controls
- Do not ask user to buy Meshy, Tripo, Rodin, paid subscriptions, downloads, cloud GPUs or proprietary packs.
- GitHub Actions CPU minutes/storage are limited even on free plans; keep Blender heavy jobs opt-in, output artifacts small, cancel obsolete jobs.
- Third-party art/models must carry `source_url`, `author`, license and attribution where required.
- Never rediscover discarded Sketchfab/Meshy-paid/no-license models as "free" assets.

## Status truth table
**Proven:** source identity, 23-bone rig, 22 animations, Three editor, numeric tools, face landmarks, GLB QA, material budget and native head socket as of previous toolbox green.

**Implementation now in isolated branch:** full-mask anatomy fitting, expanded multi-point landmark coverage.

**Not yet integrated:** Blender worker, actual text/image-to-3D AI engine, PBR painting brushes, UV authoring, skinned armor auto-rigging, in-game Unity bridge, entire world generator. Explicitly do not mark these as GREEN.

**Acceptance:** only GREEN per exact HEAD after CI, mesh/screenshots, mobile QA and art review. Never pin publisher SHA before approval.
