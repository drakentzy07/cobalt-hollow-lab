# G1 — HIGHFLY character rig, equipment compatibility, and editor tooling

## Decision (2026-10-24)
Use the **existing ClaudeCraft v0.44.7 modular KayKit character assembly**, specifically `models/chars/modular/warrior_modular.glb`, with the same shared Rig_Medium skeleton. Start with an unarmored male/female modular body and simple underclothes.

This is a visual-rig decision, **not** a choice to force the playable Hunter into Warrior class mechanics. G0's internal Warrior is only a temporary test fixture.

Avoid importing a fresh standalone KayKit body: although it uses a similar rig, armor nodes, meshes, body proportions, sockets and skin/material maps may not match the modular equipment system.

## What the upstream already supports
- Male/female `ModularAppearance`, body/face customization and hair.
- `ArmorLoadout` for head/chest/arms/hands/legs/feet/back with mixes of existing fitted kits.
- `modularPartNames(app, worn)` selects both base parts and authored fitted armor, and hides underclothing when an armor slot is covered.
- Right-hand `handslot.r` and left-hand `handslot.l` attachments, item-model swaps, tunable weapon grips.
- Existing animation clips and `animUrls` on the common Rig_Medium.
- `DEFAULT_LOOK` is fully knight-armored. **Override `worn: {}` for G1 bare spawn** without mutating upstream defaults globally.

## Required G1 decoupling
1. Keep a classless HIGHFLY gameplay profile and attributes independently of upstream `PlayerClass`.
2. Replace only the internal class-dependent equipment eligibility rules with HIGHFLY weapon/armor permissions in the new build. Keep structural slot/type, handedness, unique-equip and dual-wield safety rules.
3. Map equipped inventory items -> visual `ArmorLoadout` for fitted armors and -> hand attachments for weapons. Upstream modular kits alone do **not** prove every item ID already swaps to exactly the right visual piece.
4. Avoid a default hardcoded sword, offhand shield or armor on initial spawn.
5. Preserve the same modular rig across gear changes and animation blends; apply gear visuals consistently to both genders.
6. Don't require every new weapon to become a separate character rig.

## Visual and gameplay acceptance tests
- Bare male and bare female spawn, no phantom sword/shield.
- Equip/unequip chest/head/legs, both genders; hair hides correctly under a helmet.
- Mix gear from at least two original modular armor sets without clipping under basic idle/walk/attack.
- Equip a 1H sword and shield, 2H weapon, staff, dagger pair and bow; verify right/left hand sockets and grip accuracy in motion.
- Dual wield and restrictions: HIGHFLY rules, not donor class rules. A shared Rig_Medium does not automatically legalize two of every item.
- Save, reload and inspect appearance + gear after normal animations, dash and double jump.
- Android S23 Ultra landscape performance and model preloading checks.

## Verified upstream authoring tools (separate tools, not all embedded in-game)
- **Map Editor:** `editor.html` / `src/editor/`, designed for map editing and offline playtest.
- **Weapon 3D inspector:** `node scripts/asset_pipeline/pipeline.mjs library --serve --port 5180 --open`. Offers live weapons-on-character preview, grip position/rotation/scale, VFX adjustments, and save of applied weapon overrides.
- **Fit Studio:** `node scripts/asset_pipeline/pipeline.mjs fit`. For modular hair, jewelry and hair-band fit; **not** a full 3D armor modeling editor.
- **Asset pipeline:** `node scripts/asset_pipeline/pipeline.mjs weapon --help`, `prop --help`, `skin --help` etc., for source asset generation/import/preview; some generation actions require paid third-party API keys. Existing models need none.
- For novel modular armor mesh creation, use fitted asset authoring (e.g. Blender) and integrate with `src/render/characters/modular.ts` / material/mesh tables; do not claim a full in-game armor editor exists.

## Source pointers
- `src/render/characters/modular.ts`: `ModularLook`, `ArmorLoadout`, `modularPartNames`.
- `src/render/characters/manifest.ts`: `Rig_Medium` player visuals and `handslot` attachments.
- `src/render/characters/assets.ts`: `setHeldWeapon`, `setHeldOffhand`, and equipment swapping.
- `src/sim/equipment_rules.ts`: class-dependent equip permission is distinct from visual compatibility.
- `scripts/asset_pipeline/CLAUDE.md`: browser asset inspector and fit workflow.
- `CREDITS.md`: inspect model/art licenses for independent distribution.
