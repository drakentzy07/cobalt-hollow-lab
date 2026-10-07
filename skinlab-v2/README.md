# HIGHFLY Skin Lab — HF_AVIAN_KNIGHT_LEGENDARY_01

Branch: `highfly-skinlab-avian-knight-legendary-01`

## Goal
Build a real modular legendary avian-dark-knight skin on the canonical HIGHFLY Warrior while keeping gameplay immutable.

Canonical:
- `player_warrior`
- `public/models/chars/players/knight.glb`
- `Rig_Medium`
- `sword_1handed.glb`
- `shield_round.glb`

## PASS 1 — Avian helmet
The helmet is built at runtime as real 3D modular geometry attached to the existing `head` bone. Its anchor and dimensions are derived from the real `Knight_Helmet` world bounds and converted into head-local coordinates, avoiding a floating one-size-fits-all proxy.

Modules:
- `HF_HelmetShell`
- `HF_ForeheadPlate`
- `HF_BirdBeak_Upper`
- `HF_BirdBeak_Lower`
- `HF_EyeFrame_L/R`
- `HF_EyeGlow_L/R`
- `HF_Brow_L/R`
- 5 rigid `HF_Crest_XX` plates
- 3 rigid side-feather plates per side
- `HF_JawGuard_L/R`
- silver brow/beak/jaw trims

Palette:
- charcoal / graphite dominant
- desaturated silver structural trim
- restrained violet emissive only in the eye slits

## Frozen gameplay
No modification to rig, skeleton, clips, sockets, grips, traces, hitboxes, targeting, damage, parry, block, skills or movement.

## Gate before PASS 2
Do not proceed to shoulders until PASS 1 loads, follows the head bone, hides only the original visual helmet, keeps both hand sockets intact and passes browser visual smoke.
