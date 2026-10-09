# HIGHFLY · SUPREME SKIN LAB — canonical architecture v9
**Status:** architecture / anti-drift contract, not a claim of completed product.
**Frozen game:** PF6 / production branch. **Working branch:** `highfly-skin-studio-v9-supreme-lab`.

## Product requirement
One easy-to-use **Spanish, Android S23 Ultra landscape + PC** creative lab where a non-modeler can describe what they want and see a genuinely new, legally usable original 3D armor generated, edited, animated and exported on the authentic ClaudeCraft/HIGHFLY Hunter.

The interface must remain **paint-like**: "Modo Simple" (default): write a Spanish design request, choose preset, 3D click select, paint, sculpt safe bounded parameters, rotate, see animation, save/import/export. "Modo Técnico" (collapsed): Anatomy, Molder, Painter, Wearable/Bone Attach, Bind Reference, Donor Inspector, Skeleton, Sockets, Animation Inspector, geometry QA and rig debug.

## REUSE FIRST — do NOT invent replacement subsystems
- **Original real character:** frozen `warrior_modular.glb`, KayKit-based original game asset, source Git blob `e3fb52b8e064ab3927f3bc34a5ba7d04e8d701c2` from frozen upstream `9b57e49c9676d75962700f828cc00a50a9a988b5`. `Rig_Medium`: 23 bones, 22 clips. Preserve original meshes, skinning, bone names, animations, game camera, gameplay and save.
- **Source reusable runtime:** native character composite/slot mapping from existing `character-truth/generated/modular-runtime.mjs`, `paint-recipe-v3.mjs`, `native-molder-v3.mjs`, V4 strict recipe and V4.1 camera lock, Skin Studio V5 tools. Never duplicate ownership of gender, slots, cosmetics or camera.
- **Existing advanced modeling/authoring donor:** reuse `creator-lab/geometry.mjs`, `helmet.mjs`, `anatomy-fit.mjs`, `quality.mjs`, `command-engine.mjs`, `creator.mjs` when relevant, after verifying compatibility; never fork logic invisibly or let a new tool replace frozen production code.
- **Blender 4.2 LTS CPU headless:** geometry/surface lofts/bevel, real armature and weights, GLB export + native reference QA. Deterministic reproducible pipelines in GitHub Actions; user should NOT have to model manually in Blender.
- **Three.js:** browser 3D orbit, real model/rig inspection, click-to-select, visual editing, materials and phone controls. Must load GLB actually fabricated by Blender rather than previews with lookalike geometry.
- **Unity 6000.6.x target:** a downstream build/import verification path, never write directly to live game before independent gates and user acceptance. GLB export is not automatic proof of Unity compatibility; FBX/glTF importer + animation compatibility must be checked.
- **AI / language control:** use an AI provider when connected to convert Spanish intent into **safe bounded structured recipes**, NEVER allow an LLM to inject arbitrary Blender Python or shell execution. Deterministic offline parser is a fallback, not a generative 3D AI. No direct provider/model is connected or authorized yet.
- **Licensing:** the upstream `CREDITS.md` is authoritative, not MIT source code license. KayKit characters/animations listed CC0; other art may require permission. No silent redistribution of restricted upstream assets or donor packages. Review each imported accessory and 3D pack license. CH0SAN can be an approved geometric donor only: rigid attachments by authentic sockets; torso/limbs require native skin weight transfer. Quaternius not the base Hunter, no Sketchfab requirement, no paid-only services silently added.

## Verified development gates (not visual sign-off)
- V5: 7 source slots, camera controls, painting and reversible recipes.
- V6: KAGE-ONI **rigid head accessory** Blender GLB, 28 original meshes, imported to actual original head bone and browser tested; body not skinned in V6.
- V7: true Blender import of original combined 23-bone Rig_Medium and 247 skinned source meshes including male and female, fail-closed.
- V8: NIGHTFALL **original 6 body slots / 2 genders** exported as 36 SkinnedMesh with real native bone weights; validator zero GLB errors, 3,910 weighted vertices, real Blender bone-pose deformation. **Not yet visually approved; clipping and physical S23 must be checked.** The separate V6 head GLB is not automatically in the V8 skinned export.

## COMPLETE PRODUCT pipeline — required before "SUPREME GREEN"
1. **Brief to structured design:** free-text prompt + visual references [with ownership/license checks] -> exact versioned, safe JSON plan; genre, palette, hard-surface styles, silhouette, material maps, shape constraints, slots, gender and variant. Explicit rejection of unsupported instructions, not silent fallback.
2. **Genuine original geometry:** physically coherent helm/mask/crown, torso/pauldrons/bracers/gauntlets/greaves/boots/cape; sculptable profiles, nonintersecting source geometry; optional custom donor import after license + geometry audit.
3. **Anatomical compatibility:** source truth `M_/F_` parts and real Rig_Medium bind; actual vertex-groups/skin weights to all mobile parts. Rigid props to exact bone sockets; soft parts weighted/simulated separately. No fake proxy skeleton.
4. **Visual refinement:** proper surfaces, inner/outer thickness, UV/material slots; normal/roughness/metallic/AO maps, emblems, accent, highlights. Mobile LOD/material budgets. Procedural and donor geometry counts under control.
5. **Motion & collision QA:** Idle/Walk/Run/Jump/Attack/Dash/Parry across male/female; track skin deformation, body intersection/clipping, side/back silhouette, dislocation and weight normalization. A green validator alone never means a good-looking suit.
6. **Intuitive three.js editor:** source-only and new-generated meshes in one viewport, select/edit all 7 slots, per-element history, presets, save JSON, load JSON, GLB export, genuinely rebuild geometry and compare photos. No UI control without a working pipeline.
7. **Unity integration:** verify model/game import, bone mapping, performance on Samsung S23 Ultra landscape, ownership/readiness, skin appearance only. Preserve gameplay, skills, training stats, combat, item equipment authority and saves.
8. **Publish independently:** isolated GitHub Pages preview after rights review, full screenshots front/side/back + motion and mobile checks. No published experimental content in main HIGHFLY before explicit accept.

## Source and state authority (zero overlapping code)
- `Factory V4` cosmetic selection is read-only source appearance; it is **not** physical 3D geometry.
- `Skin Studio V6` handles actual rigid head accessory only.
- `V8 Nightfall GLB` handles real **body weighted** geometry only.
- `Supreme Recipe V9+` coordinates those existing authorities but does not replace them.
- Training stats `STR/AGI/VIT/PER/INT`, skill trees, item attributes, monsters and public game code never change here.

## Quality vocabulary
- **GREEN static:** schema/finite geometry/gltf.
- **GREEN rig:** real original rig bind + animation.
- **GREEN viewport:** real browser on actual GLB and correct gender.
- **GREEN mobile:** measured physical S23 Ultra, no first-render and frame-rate regressions.
- **GREEN visual:** user explicitly approves the armor against requested concept.
- **SUPREME GREEN** requires ALL categories, including Unity import and copyright audit. Until then say “prototype” or “technical gate”, never “final premium AAA armor”.
