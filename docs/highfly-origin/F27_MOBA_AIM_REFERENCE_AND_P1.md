# HIGHFLY ORIGIN — F2.7 P1 / MOBA aiming & dual-combat handoff
Reference: two Guinevere/Mobile Legends stills and an 88-second Android gameplay video submitted October 20, 2026.
The references show a maximum-range ring independent from the real hit indicator, a linear/corridor-shaped gesture telegraph, a target circle, a top-right CANCEL X, visible skill cooldowns, and quick movement/attack transitions. Use the interaction principles ONLY; do not copy game assets, icons, animation or code.

## Target normal 4-slot Hunter kit
1. Fireball: preserve approved F2.6.3 projectile/aim/ground impact. This is the regression standard.
2. Wicked Slash: adapt the real Rogue sinister_strike weapon hit with stamina, visual dagger slash and movement.
3. Blade Rush: reuse native Charge displacement, scripted contacts and native upper-body weapon trails, not teleport/dash of a different engine.
4. Meteor: native mage meteor ground target and timed AoE, adopting procedural Cinder Fall VFX only after license/code review.
Later bank: Storm Lance, Frost Lance, Voltaic Snare, Glacial Crown, Nova Beam and Earthen Spire.

## P1 current implementation
- True separate right/left dual arm masks for 1st/2nd combo contact; select real KayKit dual clips for rising slash and descending finisher. Existing native Sim owns damage and each valid strike; do not fabricate extra hits.
- Clear HP + cyan MP + gold ST, same 20px height, in one portrait frame; no duplicate HP/MP bars.
- Preserve existing F2.6.3 aim and cancel behavior, lock optional. The X must always abort without spending MP/ST/cooldown. Preserve joystick, camera, somersaults, Fireball.
- Reuse F2.6.3 lab route internally for CI and visual regression. Only this isolated branch contains these edits, not public Pages.

## P2/P3 pending (NOT done by P1)
- Pure independent four-type aiming indicator: line projectile, short melee cone, dash corridor, placed ground circle, reflecting exact real hit volume including elevation, target filtering and camera.
- Nine-school skill registry and persistent learned/unlocked skill migrations; lab-only temporary preview without changing the original Hunter save. Four normal slots; unique specials stay fully hidden.
- Genuine Native Rogue/Charge/Meteor spell execution, stamina/mana, animations and licensed VFX; check specialty/level gates carefully. Later integrate six bank skills.
- Short evade i-frame with physical hit exclusion, height-aware aerial melee immunity only where appropriate, capped bonus to double-jump spell burst, tested vs monsters.
- Physical Samsung S23 Ultra landscape visual/thermal/multitouch validation. A CI green is not proof the clips look perfect.

Build workflow is no-deploy: no Pages overwrite, no donor update, no save migration yet.
