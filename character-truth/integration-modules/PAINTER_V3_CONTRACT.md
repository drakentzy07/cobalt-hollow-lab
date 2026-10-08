# HIGHFLY SKIN 3 — Painter V3 (isolated integration candidate)

The old V2 painter is used as a **behavior donor**, never copied over SKIN3.
All files of this experiment are new under `character-truth/integration-modules/`.

- Original renderer: `warrior_modular.glb`, the original `Rig_Medium`,
  original 7 native armor families and source-only animations.
- Male and female figures must both paint actual, visible SkinnedMesh materials.
- `makePainter` clones materials and restores their original references
  on each change; **no vertex positions, skin weights, bones or clips edited**.
- Recipe V3 supports 7 independent source kits and paint fields.
- V2 one-slot recipe migration does not invent other slots; restricted custom
  `corvus` model cannot be imported without a separate source/rights review.
- Source-only lab save is separate from the real inventory/gameplay.
- Production integration with equipment, crafting and 3D weapon mounts is
  **not** part of this phase, and no GUI is published here.
- `skinlab-v2` and original `character-truth` files are immutable: CI must fail
  if an original file was modified or a legacy global was reused.
- Performance/visual stability in simulated Android does not certify a physical
  S23 Ultra, or premium artwork quality; actual visual approval is required.

The next source-first step is the V2 designer/molder after painter proofs pass.
