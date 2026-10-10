# HIGHFLY SKIN 7 — PILOT: CRIMSON TECH ONI
**Art direction & measurable production contract, not yet a completed 3D asset**

## User's intended flow
Open original Hunter → reference image / Spanish text → assistant-authored construction blueprint → procedural Blender **creates new geometry** → Three.js 3D try-on → side/front/back and original animations → explicit YES: approved candidate in isolated skins catalog, NO: rejected candidate only. Nothing affects HIGHFLY public without separate future integration.

## Reference interpretation
From the previously shared image: stylized futuristic red/gold armored samurai, oversized asymmetric shoulder (viewer-left / Hunter-side mapping must be checked against the actual model), oni/kabuto head crest and horns, red broad front cuirass, bright accent jewel, waist kusazuri panels, dark underlayers, armored bracers and greaves. Source image is **one view**: behind-the-back elements, hidden fastening and internal topology must be designed originally; cannot hallucinate exact fidelity. Use source aesthetics as inspiration, author original HIGHFLY geometry.

## Design identity and materials
`crimson_tech_oni`: deliberate heroic V-shaped silhouette, bold broad shoulder volumes, segmented close-fit cuirass, skirt plates with hip clearance, symmetrical leg guards, horned head with stable attachment. Primary crimson `#ad2636`, bronze gold `#c7a15b`, graphite underlayer `#171823`, glow cyan `#31d7e8`; four PBR materials and adjustable highlights, target maximum 8 scene-facing materials for this set. Quality more important than overlaid tiny triangles.

## Original authoring — distinct topological artifacts, not just recolor
| Part | Native parent and donor | Required silhouette / editing |
| --- | --- | --- |
| Kabuto shell and 2 horns | original M_Head/F_Head, rigid attachment to existing `head` | Kabuto shell, central guard and visibly curved paired horns. Keep source facial features visible or controlled occlusion. |
| Heroic pechera | M_Torso/F_Torso existing deform | New contoured cuirass volume + embedded cyan centerpiece, shoulder clearances, raised gold rims. |
| LEFT dominant pauldron | M_ArmL/F_ArmL, true skinned | Heroic three layered broad shells in shoulder frame, > RIGHT width by a perceptible factor; no floating spikes. |
| RIGHT restrained pauldron | M_ArmR/F_ArmR, true skinned | Cohesive medium layered shell with matching trim; asymmetric but harmonized. |
| Front/side hip faulds | M_Loin/F_Loin or torso/leg anatomy as tested | Distinct plates, separated by hip pivot to avoid leg clipping; no long unweighted rigid robe. |
| Backplate + spine guards | M_Torso/F_Torso | Broad rear plate extending below shoulder blades and connecting visually to collar. |
| Bracers + gloves | M_ArmL/R, M_HandL/R | Angular metallic wrist shells bound to original arms; keep sockets clear. |
| Thigh guards + greaves | M_LegL/R, M_FootL/R | New sculpted knees and coherent boots; do not block the original feet. |

## Body truth, fit & budget
- Two genders independently generated against original M/F anatomical bounds; one character rig `Rig_Medium`, EXACT 23 original bones. No proxy body, no copied source character mesh in distributed armor GLB.
- Native bone names/matrices/weights stay authoritative; new body parts get donor-based normalized max-four-influence weighting. Helmet/head accessories use named head attachment with original inverse-bind; no self-generated extra bones.
- Measured **source-data normalized dimensions**, not arbitrary meter assumptions. Correct orientation via measured donor center and skinning bind poses; do not deduce a world forward sign from screenshots.
- Build complexity target **≤15k triangles added** for entire pilot (initial design budget), **≤120 new draw calls** (absolute QA ceiling, to tighten after real S23 profiling). Measure actual combined Nightfall+pilot mobile budget in Stage 3; never claim full performance proven by theoretical quotas.
- Avoid painting old Nightfall over a radically different body; new parts must be readily distinguishable after stripping any V19 spike ornaments. Cross-section and joint articulation must remain testable at source clip poses.

## Acceptance matrix
- Blender: procedural source + recipe creates source-derived **new vertex buffers and nontrivial triangles** in at least helmet/shoulders/chest/waist/back; parameter changes alter actual vertex coordinates and/or topology, not only node scale.
- 3D try-on: front, 3/4, profile and back screenshots for M/F. LEFT vs RIGHT measurable shoulder silhouette, chest raised, waist plates visible without gap, rear guard visible.
- Animation: Idle, Walking_A, Running_A, Block, 1H_Melee_Attack_Chop; detect detached parts/obvious collisions via direct screenshot user review.
- Portable: valid GLB using official glTF-Validator, Blender import-back, Three.js original live bone-binding. Unity glTFast Editor roundtrip required for *certified Unity* status; physical Galaxy S23 Ultra QA must be separately confirmed.
- **User verdict** is a distinct final input: ACCEPT (catalog) or DISCARD (candidate only). Green code build is not art approval. No autodeploy to HIGHFLY gameplay.

## Production outputs expected only at BLOCK 2/3
`candidate/crimson_tech_oni/recipe.json`, `forge.blend` or reproducible Blender .py, `overlay-m.glb`, `overlay-f.glb` or one both-sex compatible GLB, `manifest.json`, `proof/screenshots/*.png`, `qa/validator.json`, `qa/animation.json`, `review/user-decision.json` (when user explicitly decides).

## Art standards
This is not a pixel-accurate commercial skin copy; it is an original visual adaptation. Reject disconnected floating appendages, disproportionate skull armor, head disappearance, overlapping old armor, and low-value geometry that looks like V19 spikes. Rerender before asking the user to approve.
