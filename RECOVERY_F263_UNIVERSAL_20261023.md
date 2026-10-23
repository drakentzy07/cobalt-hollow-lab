# HIGHFLY RECOVERY — BACK TO PLAYABLE FREEDOM
23 October 2026. Recovery branch from **f32973afcfe0479d21270802972eb1a751aa48ca** (F2.6.3).
This is a **recovery BASELINE**, not a new public build or a claim of Samsung physical QA.

## Why rollback
Observed from user S23 recording (109.95 s, 480×1032):
- Creator has blank right-hand preview.
- Native HUD / MORE exposed on loading screen.
- Dense enemy/game UI text overlays gameplay.
- Original Training window looks like a raw form.
- User reports no manual FURY preview, no assisted aim, no visible flip, no aerial skill combo and failure to attack/cast freely.
- Automated R16 CI was green but did not establish tactile or visual acceptance on real S23.
**Stop porting more fixes onto the R16 HUD overlays.** Preserve its branch and R11 root/save completely.

## Grounded donor decision
1. Recover from F2.6.3 `highfly-origin-f263-collision-gesture-save-polish-20261020`.
   CI [39486154091](https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/39486154091) successful; Chromium touch emulation **844×390, not physical S23**.
   - Actual test logged: three held weapon types with mounted GLB props.
   - Moving attack: masked upper clip, `fullBodyBlocking=false`, `groundMoving=true`.
   - `secondJump=true`, `flipState=true`, dash native edge.
   - Original ground Fireball reticle, cancel no mana, Fireball real mana spending/cooldown.
   - Mobile frame with mana and stamina, native ONE Sim; S23 HUD crescent four skills.
   - Separate F1, F2, F2.6.3 saves verified. No new Pages deployed from this source.
2. Pull only missing *modules* from `highfly-origin-r39c2-input-buffer-combo` commit
   `0ca2f82473b87fbdffa2a7663677f79b73d9e8da`:
   - `game/c1/highfly_origin_r39a_anim_split.ts`, `overlays/highfly_origin_r39a_no_slide.py`
   - `overlays/highfly_origin_r39c2_170ms_combo_buffer.py`.
   CI [39157695455](https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/39157695455) succeeded; compatibility/ABI audit required. **No blind cherry-pick.**
3. CLEAN V1 `89c8d8fccdce476a486cce58a074332430512de4` only as reference if the GOLDEN stick or S23 HUD differs.
4. DO NOT use R40 `6566c3e3dd2f3716f2a59116bb0ac8e0c72bdf7f` as base: its recorded native runtime Actions did not pass.
5. DO NOT port REBIRTH R16 CSS/creator/menu overlays, duplicate resource bars, or all FURY modules in one commit.

## Product direction: ONE UNIVERSAL HUNTER
- Exactly one hunter identity; no class-selection UX or required specialization.
- NINE learnable schools: warrior, paladin, hunter, rogue, priest, shaman, mage, warlock, druid.
- The internal ClaudeCraft **warrior carrier class** is strictly a compatibility implementation detail, never a user-facing class or an entitlement check.
- Every school available from trainer/exploration/practice/mastery progression; **not every skill automatically granted at spawn**.
- Weapon/equipment restrictions only for coherent physical actions (e.g. needs a bow for bow shot) not a school/class ban; no duplicate abilities.
- Before exposing an ability across schools audit native class/talent/spec/resource gates, templates and effects. One Sim owns costs, CD, impacts and damage.
- Only HP + MP + EN (mana / physical energy). No rage/focus UI or user power pool. Class-specific internal donor mechanics may need adaptors; never pretend labels changed their rules.
- STR / AGI / VIT / PER / INT permanent gains only from validated real training; adventure levels unlock skills/progression, gear adds derived combat attributes, not base Core. Target 70/30 training/adventure **power balance not empirically measured**. Reconcile old F2.6.3 natural level growth.
- Cap level 20 for recovery. Do not resurrect a 99 cap.

## Milestones and hard acceptance
**REC-0 | Snapshot / single page:** freeze this branch, compare 844×390 Chromium with **S23 Ultra landscape real video**. The original creator preview must have a visibly rendered Hunter before Enter; world HUD must be absent during loading. Keep one MORE menu.
**REC-1 | Physical core:** manual targetless ATK must animate and whiff, not toggle autoattack; 1→2→3→4 with visually distinct clips and Sim impacts; running and airborne attack, no sliding.
**REC-2 | Motion:** GOLDEN 360°, independent camera + multitouch; normal/double jump + **visible** forward/back/left/right somersault, dash, aerial ATK. No teleport or movement lock.
**REC-3 | Skill gesture:** short-tap auto priority nearest/lowest HP/current target; hold/drag actual visible preview in game, release exactly once; CANCEL high right with zero MP/CD; manual aim takes precedence; Fireball, cone, circle, directional leap.
**REC-4 | Universal library:** inventory, spellbook, unlock, item, talent, equipment, save + one school-unrestricted hunter; test at least one physical and one magic spell from DIFFERENT donor schools; no 63 individual rewrites.
**REC-5 | Training & polish:** replace raw form with coherent single Training experience and check persistence and 70/30 empirical curves. Avoid UI patches until gameplay gates pass.
**REC-6 | Single isolated public trial:** only after regression/browser visual checks; leave R11 + real saves untouched and retire duplicate visible labs. Real S23 video is FINAL acceptance, never CI green alone.

## No mistaken claims
- R16 deployment SUCCESS does not certify user-observed gameplay.
- F2.6.3 passed a strong Chromium-based automation suite, not the user physical test.
- Creating this recovery branch does NOT change the public website or old saved characters.
