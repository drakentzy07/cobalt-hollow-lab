# HIGHFLY SKIN 3 — PHASE 9 / TRUE EQUIPMENT–VISUAL BRIDGE

We have audited two separate, real original systems in ClaudeCraft:

- Gameplay and persistence: 13 live item-paperdoll slots in `sim/types.ts`,
  authoritative `items.ts` equip/unequip, save shape `character_state.ts`,
  item legality `equipment_rules.ts`, bag receipt and UI contract.
- Graphics: 7 distinct original modular armor slots, 7 native kits, a class
  full-set selector `player_look_core.ts`, and weapon mainhand/offhand
  replacement hooks in `render/characters/assets.ts`.

A green source adapter audit does NOT mean items visibly swap original armor
pieces in actual PF6 gameplay. The missing item-id -> authored compatible armor
piece mapping is the precise gap for the next implementation.

## Safe potential mapping, pending live-gear proof
- helmet -> head
- shoulder -> arms
- chest -> chest
- gloves -> hands
- legs -> legs
- feet -> feet

Gameplay slots with no direct 3D armor body slot: mainhand, offhand (held props
are a SEPARATE visual system), neck, waist, ring1, ring2 and trinket.
Original `back` armor/cape visual has no equal paperdoll slot.

Do not pretend the visual seven are identical to the gameplay thirteen, and
do not turn an item into a new three-dimensional mesh just by assigning a
piece name. Imported or forged new armor must ship a legally usable,
rig-compatible and artistically reviewed asset.

## HIGHFLY progression and manufacturing constraints
- The fitness stats STR/AGI/VIT/PER/INT change only by REAL training.
- Equipment may affect only separately derived RPG combat modifiers when
  explicitly authorized by the HIGHFLY balance rules.
- New crafted items need real item definitions, equipment permission, an item
  instance/recipe provenance identity, a visual item-id map and persisted
  appearance, not a proxy model.
- We will reuse original live item validation, `setHeldWeapon`,
  `setHeldOffhand` and `modularPartNames` instead of rewriting combat.
- No game-public or PF6 or frozen Foundation mutation in this phase.

Next gate: implement a source-isolated proof-of-concept equipment-to-visual
adapter, then verify on actual PF6 gameplay with inventory changes and save/load.
New armors, weapons and effects should follow only when that is green.
