# HIGHFLY SKIN3 — Molder V3, read-only native donor geometry

Candidate ADDITIVE module only, isolated in `highfly-skinfactory-integration-00`.
This deliberately does **not** replace or edit the previously GREEN painter.

- Native `warrior_modular.glb`, skinned mesh originals; cloned geometries for transforms.
- Seven armor slots and seven original kit families.
- Width / length / depth / taper all individually restricted to ±0.70 (dimensionless).
- Source `geometry` object stays allocated and unmodified. Each edit starts from
  it, not from the previous result; repeat applies are stable and noncumulative.
- `skinIndex` / `skinWeight` and bone names remain identical; original
  `Rig_Medium` unaffected.
- Refuse non-Armor node IDs and non-skinned mesh deformation.
- `restore()` reassigns every original geometry object.
- Painting uses the existing V3 painter unchanged and only applies to
  native source nodes.
- A green simulator screenshot is not animation clipping certification:
  must inspect actual idle/walk/run/attack on physical S23 before shipping.
- Molder UI is still an isolated laboratory candidate; not published and not
  built into PF-6 / game crafting inventory.
- Premium geometry authoring / GLB export requires separate scope; do not
  confuse temporary mesh deformation with a final product.
