# HIGHFLY SKIN 3 — Dynamic Character Truth

Parent static GREEN run: https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/37803666522

## Verified upstream facts
The real original ClaudeCraft manifest declares player_warrior as players/knight.glb. Every class also has a separate modular visual definition sourced from modular/warrior_modular.glb, with base class animation sources. Which visual PF6 actually chooses must still be proven in the actual PF6 build.

The source defines male and female anatomies, with different M_ and F_ face/body pieces; female F_Top, female/male Loin, face and body morph targets, and a default full knight look. The seven slots are head/chest/arms/hands/legs/feet/back. The seven native kits are knight/barbarian/druid/mage/paladin/ranger/rogue.

IMPORTANT: In the upstream modularPartNames implementation the base body is kept underneath armor; worn armor meshes are added, while loincloth is hidden if legs are covered. Full helms hide hair, beards and earrings; hats have special rules. Historical prose comments about replacement do not supersede the function behavior.

## What this dynamic run actually certifies
It consumes the six real assets already downloaded and hash-checked by the STATIC job. A new isolated Three.js browser viewer with MeshoptLoader renders source body parts and native armor meshes for two anatomies and seven sets. It samples genuine GLB clips, checks finite matrices, verifies moving native joint transforms and records real GPU triangles, with screenshot artifact.

This viewer deliberately uses a conservative node selection for diagnostic snapshots, not the complete original modularPartNames function. It does not certify character creator behavior, full body dressing policy, costume clipping, exact PF6 composition, socket grips, damage or S23 performance. No proxies or new armors are created.

## Remaining mandatory gates
1. Load actual PF-6 distribution and trace character appearance by class and gender. Compare fixed vs modular paths after PF6 overlays.
2. Reuse original modularPartNames logic (not prefix filtering) for final outfits, face/hair/underwear and all seven slots.
3. Compare rest matrix and inverse binds per mesh, not only identical joint names.
4. Generate Character Design Cage over true male/female complete body, across all morphology extremes, poses and weapon equipment.
5. Inspect human-visible clipping from multiple angles over locomotion, hit, attack, dash and parry. Screenshots do not auto-certify clearance.
6. Check actual held and sheathed weapon overrides plus S23 performance. Preserve original systems and rig.
7. Only then authorize premium skinned armor design, with sourced meshes and compatibility matrix.

NO editing original GLBs, frozen PF6/Foundation, public creator, training, or skinlab branches. All evidence is scoped to this isolated audit branch.