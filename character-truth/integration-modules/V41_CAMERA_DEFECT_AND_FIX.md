# HIGHFLY Skin Factory V4.1 — Bug: Hunter moves when helmet changes
Reported in real Chrome screenshots. Cause: original V4 recomputed a visible
skinned-mesh bbox every time updateModel ran. Helmets changed bounding extents,
so camera center and zoom moved; this is NOT correct.

Fix in ADDITIVE factory-v4-camera-stable.html:
- Freeze one baseline camera framing on first source Hunter load.
- Never reframe for equipment paint, molds, gender change or saved design.
- Explicit camera orbit still works; source Idle pose sampled at first render.
- Original V4, V3 painter, V3 molder, old Skin Lab, PF6 kept immutable.
- Independent real GLB male/female browser camera invariants added to CI.
- No premium skins or game inventory modifications in this phase.
