# HIGHFLY SKIN 3 — PHASE 10 / ACTIVE EQUIP + VISUAL + LAB SAVE

Prototype running only on the original upstream source models, rig, and
original item legality functions. It does **not** write PF6, Foundation,
production inventory, or the game's actual offline save files.

## Experiment scope
- Genuine original male/female GLB, same skeleton and original clips.
- Genuine original item identifiers for mail / leather / cloth body gear,
  boots, legs, and a basic sword. No invented item definitions are added.
- Original `slotAcceptsItem` and `canEquipItemInSlot` are imported from
  untouched SHA-pinned source. This is a small, independent sample harness,
  **not** production `Sim.items.equipItem`.
- Read-only preview mapping (for example `militia_vest` to knight chest).
  That does not claim a unique authored 3D mesh for the underlying item.
- Original `modularPartNames` picks the actual source pieces.
- Successful equip, armor appearance change, unequip, invalid slot rejection,
  swap appearance, gender switch and full browser reload with localStorage.
- Existing sword equip item ID is stored in the pilot, but actual held prop
  visual rendering is **not tested or certified** in this phase.

## Essential next gates
1. Real game (frozen PF6) equipment UI, legitimate equip/unequip commands and
   persistence; do not conflate a lab state with the genuine save boundary.
2. Renderer integration of per-item visual mapping with native owned instances
   and original classes; baseline no-item and helmet-hidden behavior.
3. Actual equipped weapon model in the character's native hand and sheath,
   including attacks and two-handed restrictions.
4. Real crafting recipe -> item copy -> inventory -> equipment -> 3D.
5. Original visual set selection must be distinguished from crafted premium
   authorable 3D mesh art, then animation/clipping and S23 tests.

## Training safety
Items and cosmetics may NEVER increase HIGHFLY's five training-only stats:
STR / AGI / VIT / PER / INT. No game economy or combat authority changes.

## Immutable surfaces
Original six GLB, production, main, PF6 frozen and SKILL5 protected.
All pilot code lives in an isolated audit branch.
