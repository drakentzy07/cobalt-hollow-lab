# HIGHFLY UNIVERSAL — recovery decision (23 October 2026)

**Decision:** base all forward work on the exact **UNIFIED 01** source commit `2cec633c4e3b8de01adaef629ce9dbe4ab529c7c`, NOT REBIRTH R16 or F2.6.3 alone. This recovery branch is unpublished, isolated from main and existing game saves.

## Why
- User S23 reports UNIFIED 01 has good native MOBA aiming, jump and combat.
- Source confirms UNIFIED retains F2.6.3 `hf-origin-f263` feature path, masked moving melee, aim/cancel, movement, GLB weapons, plus F2.7 native 1→2→3→4 and Meteor/Blade Rush.
- UNIFIED F7.2 adds single game/Sim and two modes, isolated WORLD/LAB persistence, laboratory XP/gear/skill trials.
- Original F2.6.3 remains a **source of isolated proven mechanics** only; its separate branch was successfully re-run as baseline [39998581822](https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/39998581822). No wholesale merging.
- R39C2 can provide 170-ms input buffering if measured need; not a superior world/app base.
- UNIFIED candidate Pages [39668354112](https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/39668354112) and full browser suite [39668643812](https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/39668643812) succeeded, but real device QA is still user-led.
- UNIFIED 01 user URL: https://drakentzy07.github.io/cobalt-hollow-lab/candidate/unified-01/ . **This branch has not replaced it.**

## Confirmed backwards flip regression and fix
The `highflyF263DirectionalFlip` renderer applied a tiny backward tilt `-.22*sin(pi*u)` intentionally. That is why a south-stick double jump never became a backward somersault. This branch restores an actual `-2π` backward pitch, while preserving +2π forward, ±2π lateral roll, zero at start/end, and the native Sim impulse/collision. Unit regression tests updated. Not physically checked on Samsung.

## Product decision — ONE Hunter / optional ADMIN MODE
1. ONE entry experience, ONE appearance/name creator: no extra competing ClaudeCraft login/name or separate DrakenLAB character creator.
2. `Entrar al mundo` is always normal default; same existing named Hunter and world save remains authoritative.
3. During **development builds only**, provide an optional `ADMIN / LAB` entry or in-game toggle (for user convenience). Hide/omit it entirely in release builds via explicit build-time flag; no URL query or localStorage value alone can authorize access.
4. ADMIN uses SAME native world/scene, Sim, humanoid/animations/HUD and Hunter appearance, but **isolates all test XP/levels, gear, items, coins, Training, quests, deaths and world mutations** in disposable sandbox state. A temporary session may clone appearance and world preview; admin grants must never enter real WORLD save. A single real Hunter's actual progress does not become a second independently leveled Hunter.
5. For offline WebGL, build-time gating is *not security*: anyone with a public dev build may inspect code and grant dev powers. For future co-op/networked gameplay, admin capabilities must be validated by authenticated server permission, not browser JS.
6. ADM capabilities: chosen test LV (1–99 when enabled), teleport, unlock/test registered native skills from all 9 schools, equipment/loot catalog, creatures, invulnerability/dummies, resource/reset and capture screenshots. All operations labelled SIMULATED / NO REAL PROGRESS.
7. Admin UI never appears in loading screen. It may be opened by single small control from native MÁS only after `game-active`; do not create duplicate HUD or modal stacks.

## Nine schools / universal Hunter
- ONE permanent Hunter; no mandatory visible class or specialization.
- Keep the internal `warrior` compatibility carrier *only* until all nine schools' casting and equipment restrictions have been audited.
- Universal eligibility must cover trainer, spellbook, action bar, equipment, skill costs, cooldowns and native Sim hit/damage; do not 'unrestrict' visuals alone.
- Physical effects spend stamina/EN; magical effects spend MP. Keep native HP and one Sim; remove donor rage/focus exposure when the underlying mechanics are adapted.
- Skills are earned through exploration/teachers/quest/mastery, not all free from creation.
- Permanent STR/AGI/VIT/PER/INT growth only by verified training; target 70% training vs 30% adventure as balance target, not implemented measurement. Equipment adds derived bonuses only.

## Fix order — no more large patch piles
**A. Creator and entry:** remove duplicate name/entry presentations; retain original CharacterPreview single canvas and verify pixels/typed name on real S23. Validate mirror transform and keyboard orientation before altering CSS. Do not hide errors via placeholders.
**B. Movement/ATK:** backward somersault (pure renderer regression on this branch); confirm all 4 quadrant inputs, actual animated 1–4, whiffs, aerial combo, moving cast, no skating.
**C. MOBA aiming:** preserve UNIFIED 01 directional guide and native target priority. Auto-select near/low HP; manual drag preview line/cone/circle/triangle; cancel with no MP/CD; impact focus.
**D. Admin permission architecture:** one login/creator and dev-only ADMIN entry in SAME app; isolated sandbox saves; no real Hunter corruption; negative authorization tests.
**E. Universal schools:** migrate first 4 physical + 4 magical native abilities across at least 3 donor schools and prove purchase/equip/aim/cost/cooldown/save before broadening to all 9.
**F. Training UI redesign:** only after core gameplay works. Keep real input and persistence/TP authority, not a decorative stat panel.
**G. Single public candidate:** only after no-deploy CI and mobile proof, protect previous public URL, WORLD key and Draken progression.

## Non-negotiable regression gates
- One physical touch screen at landscape 844×390 and 932×430, plus real SM-S918B.
- No HUD/MÁS before `game-active`.
- One character canvas with visible nonblank GLB and name typing in normal direction.
- Four-step melee has four visibly distinct clips and native Sim contacts; aerial ATK + magic skill cast while running/jumping.
- South-stick double jump visibly backward flips 360°; clean movement/stamina/no teleport.
- World saves unchanged across LAB use, reset and reload; admin disabled in release build.
- Native one Sim, no second combat/damage or UI resource owner.

**Status:** source baseline restored, backwards flip patch and unit tests committed; awaiting new CI, creator/admin implementation and real S23 visual validation. **Do not claim fully playable new version yet.**
