# HIGHFLY Skin Lab v2 — PAINTER PRO v1

Skin Lab is now a reusable cosmetic authoring tool instead of a one-off recolor.

## Immutable gameplay authority
Painter Pro never changes:
- character geometry
- Rig_Medium / skin weights
- authored animation clips
- weapon sockets / grips
- hitboxes / traces
- combat, skills or timings

## Painter surfaces
Five independent cosmetic surfaces are available:
1. Helmet
2. Armor
3. Cape
4. Sword
5. Shield

Each surface has:
- Primary / Secondary / Accent palette
- Brightness and contrast
- Metalness and roughness
- Detail/trim density
- Finish preset: Matte, Satin, Gloss, Dark Metal, Chrome

## Direct 3D brush
Enable **PINCEL 3D**, choose the surface and brush channel, then drag directly on the visible model. Raycasting resolves the hit UV and paints the corresponding CanvasTexture. This is cosmetic-only and remains attached to the original UVs through animation.

Brush settings:
- Primary / Secondary / Accent / Custom color
- Size
- Opacity

## Recipes
Custom painter state and brush strokes can be saved to localStorage and exported as JSON recipe. This is the foundation for future HIGHFLY skin catalog entries.

## Default
Warrior Black Aura remains the initial demonstration preset, now editable live through Painter Pro.

## QA
The browser gate validates:
- frozen Warrior assembly
- 25 authored clips
- five painter textures
- piece palette/material application
- a real direct UV brush operation
- no browser/page errors
