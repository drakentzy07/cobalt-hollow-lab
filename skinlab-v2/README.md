# HIGHFLY Skin Lab v2 — Skin Factory

## SKIN_001 — Warrior Black Aura
This lab applies a **real runtime cosmetic texture** to the frozen ClaudeCraft Warrior. It is not a screenshot/mock.

### Chapa y pintura contract
Unchanged:
- model / geometry
- Rig_Medium
- skin weights
- animations
- sockets / grips
- hitboxes / traces
- combat / skills / timings / gameplay

Changed:
- body/helmet/cape visual atlas
- sword visual atlas
- shield visual atlas
- rigid cosmetic white edge lines on sword + shield only

## Paint source
The Black Aura atlas is derived at runtime from ClaudeCraft's own:
`public/textures/skins/knight/base.png`

The same UVs are preserved. The recolor rule forces the visual majority into black/gunmetal and maps authored bright/saturated accent islands to white/silver. The face remains on the original material because `Knight_Head` is excluded from the cosmetic paint pass.

## Target
- black / graphite dominant armor
- black helmet with white/silver authored detail
- black sword with bright white cutting-edge treatment
- black shield with white/silver trim
- restrained violet only from showroom accent lighting

## Factory QA
All 25 authored Warrior clips remain available. The visual gate requires:
- exact original rig + sockets
- sword/shield attachment authority intact
- Black Aura atlas >=70% dark pixels
- <=30% silver/white accent pixels
- skin active in browser
- all 25 clips exercised

No proxy Dash clip is invented; Dash remains gameplay authority and is tested only after app integration.
