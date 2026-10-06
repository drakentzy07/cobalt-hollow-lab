# HIGHFLY Skin Lab v2 — Skin Factory

## SKIN_001 — Warrior Black Aura / Refinement Pass 2

This is a **runtime cosmetic skin**, not a generated image. The frozen ClaudeCraft Warrior remains mechanically identical.

### Chapa y pintura only
Unchanged:
- geometry / model
- Rig_Medium
- skin weights
- all 25 authored clips
- sockets / weapon grips
- hitboxes / traces
- combat / skills / timings / gameplay

Changed:
- three role-specific runtime paint maps derived from ClaudeCraft's own Warrior base atlas:
  - armor paint
  - inverted helmet paint
  - sword/shield paint
- rigid cosmetic silhouette + edge accents on sword/shield only

### Visual target
- helmet: black/graphite shell, white/silver vertical grooves and trim
- armor: black dominant with stronger white/silver separation
- sword: black/gunmetal body with a much stronger bright cutting silhouette/edge
- shield: black body with cleaner silver/white rim
- violet remains ambient secondary light only

The helmet is skinned, so it receives **no detached line geometry**. Its contrast is encoded through the same UV paint atlas and therefore follows all animations safely.

## Factory QA
The browser gate requires:
- original rig and sockets
- 25 clips available
- 3 paint maps loaded
- refinementPass = 2
- sword/shield rigid cosmetic accents attached
- Black Aura mode active
- all 25 clips exercised

No proxy gameplay animation is added.
