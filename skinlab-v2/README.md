# HIGHFLY Skin Lab v2 — BLACK AURA PREMIUM V2

The previous green version is frozen at branch `archive/warrior-black-aura-proto-v1`.

## Canonical model
- HIGHFLY identity: `player_warrior`
- Source model: KayKit Character Pack — Adventurers / Knight
- Model: `public/models/chars/players/knight.glb`
- Rig: `Rig_Medium`
- Mainhand: `sword_1handed.glb`
- Offhand: `shield_round.glb`

## Premium V2 goal
Make the cosmetic read as a paid-quality skin while preserving gameplay authority.

### HERO SWORD
- black/graphite blade mass
- authored gunmetal bevel in UV space
- authored bright silver cutting edge in UV space
- selective 3D gunmetal rails on real long weapon edges
- narrower bright silver cutting rails layered on top
- subtle violet cosmetic light
- no generic wireframe

### Global trims
- helmet: stronger neutral/silver ridge language
- armor: stronger structural silver trim at gameplay distance
- shield: stronger authored rim plus selective 3D premium rim rails
- cape remains subordinate and dark

## Safety contract
The premium additions are presentation-only. No changes to:
- `Rig_Medium`
- skin weights
- animation clips
- `handslot.r` / `handslot.l`
- grip transforms
- WeaponTrace / hitboxes / range
- timing
- damage or combat authority

This branch remains the active Skin Lab; the proto is preserved separately for instant rollback.
\n## MODULAR FACTORY\n- Module: `skinlab-v2/modular-factory.html`\n- Canonical asset: `public/models/chars/modular/warrior_modular.glb`\n- Frozen blob: `e3fb52b8e064ab3927f3bc34a5ba7d04e8d701c2` (3,477,500 bytes)\n- First GREEN target: real MALE base only (`M_*` + `M_Loin` + one face), zero `Armor_*` meshes visible.\n- Inspector: front/profile/back/3-4/free, bones, sockets, slot toggles, original animation clips.\n- Rig/skinning/animations/gameplay remain untouched.\n