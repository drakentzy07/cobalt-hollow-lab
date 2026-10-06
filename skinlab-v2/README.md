# HIGHFLY Skin Lab v2 — PAINTER PRO v1.1 / AUTO BLACK AURA

The lab now opens with the canonical AUTO · BLACK AURA preset already applied.

## Black Aura target
- Helmet shell + visor: black/deep graphite
- White/silver: controlled trim only, never a white visor block
- Armor: black metal with brighter silver trim and violet only as a secondary accent
- Sword: black body, high-contrast white cutting trim with emissive highlight
- Shield: black metal with silver border
- Cape: deep matte black
- Studio environment: reflected metal depth for preview

## Root-cause fix
Knight_HelmetVisor is explicitly classified as the helmet painter role. It can no longer escape the cosmetic paint pass and remain in the original light material.

## One-click preset
Button: AUTO · BLACK AURA

It restores the complete canonical recipe automatically. The same recipe is applied on boot, so users do not need to understand the Painter controls just to preview the intended skin.

## Painter Pro remains editable
Helmet, Armor, Cape, Sword and Shield still expose palette, finish, brightness, contrast, metalness, roughness, detail and direct UV brush controls.

## Immutable gameplay authority
No changes to model geometry, Rig_Medium, skin weights, authored clips, sockets, grips, hitboxes, traces, combat, abilities, timing or damage authority.

## QA
Browser gate validates the canonical auto preset, painted visor role, sword emissive trim, studio environment, 25 authored animations and the Painter Pro controls.
