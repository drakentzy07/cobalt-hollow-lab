# HIGHFLY Skin Lab v2 — Warrior Black

Clean-room rebuild of the skin laboratory.

## Frozen authority
- ClaudeCraft upstream lock: `9b57e49c9676d75962700f828cc00a50a9a988b5`
- Character: `public/models/chars/players/knight.glb`
- Rig: `Rig_Medium`
- Main hand authored socket: `handslot.r`
- Offhand authored socket: `handslot.l`
- Runtime GLTFLoader sockets: `handslotr` / `handslotl`
- Weapon: `sword_1handed.glb`
- Offhand: `shield_round.glb`

## Assembly contract
Skin Lab v2 intentionally mirrors the relevant ClaudeCraft assembly rules instead of inventing new ones:

1. `resolveNode` follows ClaudeCraft `resolveBone`: try authored name, then strip `[].:/`.
2. Warrior non-skinned accessory visibility follows manifest `show: ['Knight_Helmet','Knight_Cape']`.
3. Body normalization happens before held props are attached.
4. Sword and round shield use the frozen KayKit fallback grips from `held_item_grips.ts`.
5. KTX2 and Meshopt are mandatory because all three frozen GLBs require them.
6. `BASE ⇄ WARRIOR BLACK` is visual-only: no retargeting, skin-weight regeneration, gameplay, hitbox, trace, socket, timing, or animation authority changes.

The old Skin Lab branches are historical only and are not inherited by this branch.
