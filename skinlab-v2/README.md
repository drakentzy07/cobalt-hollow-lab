# HIGHFLY Skin Lab v2 — PREMIUM AUTHORING v1

Black Aura is the pilot for HIGHFLY's real skin-authoring pipeline.

## Canonical model
- HIGHFLY identity: player_warrior
- Model: public/models/chars/players/knight.glb
- Source family: KayKit Character Pack — Adventurers / Knight
- Rig: Rig_Medium
- Mainhand: sword_1handed.glb
- Offhand: shield_round.glb

## What changed
Painter Pro remains available, but the premium pass no longer relies only on recoloring existing atlas pixels.

PREMIUM AUTHOR derives sharp structural edges from the real low-poly geometry, maps those edges back into UV space and writes authored trims directly into the material atlas.

### Sword
- broad gunmetal bevel layer
- narrow white/silver cutting-edge layer
- emissive contribution limited to authored trim
- black blade mass preserved

### Shield
- structural silver trim from real geometry
- black plate mass preserved

### Helmet / armor
- restrained second-color structural trim generated from major hard edges
- black remains dominant

## Safety
No edits to Rig_Medium, skin weights, clip data, sockets, grips, traces, hitboxes, combat timing, damage or gameplay authority.

This is the first step from simple recolor toward reusable HIGHFLY skin authoring.
