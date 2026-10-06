# HIGHFLY Skin Lab v2 — Skin Factory

## First production skin
- ID: `SKIN_001 / warrior_black_final`
- Class: Warrior
- Gameplay changes: **none**
- Base authority: frozen ClaudeCraft Warrior
- Status: FINAL LAB candidate; integrate into the game only after visual QA approval

## Frozen authority
- Upstream: `9b57e49c9676d75962700f828cc00a50a9a988b5`
- Character: `public/models/chars/players/knight.glb`
- Rig: `Rig_Medium`
- Authored sockets: `handslot.r` / `handslot.l`
- Runtime sockets: `handslotr` / `handslotl`
- Weapon: `sword_1handed.glb`
- Shield: `shield_round.glb`

## Warrior Black Final look
- black / graphite armor and helmet
- silver / white detail recovered from the original atlas via emissive-map remap
- restrained violet environment/accent
- dark metallic sword with bright authored atlas reflection plus rigid white edge accent
- black shield with silver atlas/edge accent
- black skinned helmet with white/silver detail driven by its original atlas
- face stays untouched

Rigid line geometry is used only on genuinely non-skinned rigid pieces (sword and shield in this build). The Warrior helmet is skinned at runtime, so it deliberately does **not** receive a static line overlay; helmet and body details use the original UV atlas as the silver/white accent mask so they remain attached through every animation.

## Factory QA
The lab exposes all 25 authored Warrior clips and a `TEST 25 CLIPS` mode. The browser gate exercises all 25, with screenshots for locomotion, jump, the three 1H attacks, block, shield bash and hit.

There is no authored clip named `Dash` in `knight.glb`. Dash remains gameplay authority and will be tested when the approved cosmetic is integrated into HIGHFLY; the Skin Lab does not invent a proxy animation.

## Hard rule
No retargeting, regenerated weights, gameplay edits, hitbox/trace edits, socket edits, timing edits, or skill authority changes are permitted for a cosmetic skin.
