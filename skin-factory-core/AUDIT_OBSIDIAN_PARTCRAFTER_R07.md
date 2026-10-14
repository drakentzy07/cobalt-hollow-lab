# HIGHFLY SKIN FACTORY · OBSIDIAN MONARCH R0.7 · ACTUAL 3D ART AUDIT

Fecha: 2026-10-14. Origen: ZIP real aportado por el usuario, generado con PartCrafter en Colab Tesla T4 (14.56 GiB). Versión oficial PartCrafter: `3d773bf02fad51c7ab31a5615573fec93b287b30`.

**ZIP fuente SHA256:** `5f7cf3bb17b5b79159def1cc42a66e8c17d84fbad49c1da63fbfa5d80759031f`.
**Fuente:** `HIGHFLY_OBSIDIAN_PARTCRAFTER_RAW3D.zip` (29,465,829 bytes, original conservado externamente, NO commiteado).

## Resultado: REAL 3D GENERATION PASS · ART / WEARABILITY FAIL

| Piece | Vertices | Triangles | Visual inspection |
|---|---:|---:|---|
| part_00 | 3,259 | 6,374 | Tiny fragments, no viable armor module |
| part_01 | 372,397 | 744,526 | Full humanoid knight sculpture, not wearable components |
| part_02 | 576,909 | 1,153,720 | Non-armor floating horizontal slabs and artifacts |
| part_03 | 168,351 | 336,612 | Non-armor side panels and banners |
| **Total** | **1,120,916** | **2,241,232** | **NOT GAME READY** |

There are no armature/skin weights, no semantic helmet/chest/gauntlet/boot pieces, no fit to authentic ClaudeCraft `Rig_Medium`, no native animation bindings, no final obsidian/silver/violet PBR materials. Output cannot be promoted to gameplay or public Pages. The raw `object.glb` contains all four parts; its vertex colors are **diagnostic non-reference colors**.

### Audited optimization / separation experiments

- Source: `part_01.glb`, recognizable knight figure / figurine.
- VTK quadric decimation produced `Obsidian_Part01_Statue_REFERENCE_ONLY_50k.glb`: **29,878 vertices / 59,576 triangles** (~92% triangle reduction; ~1.02 MiB GLB).
- Spatial triangle classification to 11 anatomical regions is feasible as a **diagnostic geometric cut** (helm, chest, left/right pauldron, arm, leg, boot, pelvis); output `Obsidian_R07_11_Regions_DIAGNOSTIC_NOT_WEARABLE.glb`. This is NOT real armor segmentation: parts are not hollow, usable wearables, properly fitted, skinned or rendered with true textures.
- User-visible evidence generated in review session: `HIGHFLY_OBSIDIAN_REALITY_CHECK.png` and `contact_audit.png`. Those artifacts are shared separately; this report commits only text to protect user image and avoid publishing unaudited model.

## Decision and next action

1. **Keep the actual uploaded ZIP as a test fixture**, with hash provenance. Do not regenerate random fake armor or mark native 23-bone rig complete.
2. Generate **one wearable component per source image / crop** rather than asking PartCrafter to decompose an entire armored humanoid into four guessed object parts; input original sketch -> separate helmet, torso, shoulder, forearm, leg, boot references. All tools must be open, zero-credit and explicitly license-checked.
3. Make source garment truly hollow/fit ClaudeCraft donor Knight/Paladin geometry, preserving scale, native slot naming and sockets. Then (not before) Blender closest-body weights and GPU/Android movement validation in isolated Skin Lab.
4. Require manual visual approval for artistic fidelity and NO intersections during idle, run, jump, attack. Native technical rig validity and stylistic fidelity are **separate gates**.
5. No changes to public Pages/game from this audit. Follow HIGHFLY reuse-first and zero-commercial-credit rules.

**GREEN CI does not certify GPU inference output or premium art.** The *actual* image-to-3D stage worked in the user's Colab; the **model failed wearable art criteria**. This honest distinction controls release gates.
