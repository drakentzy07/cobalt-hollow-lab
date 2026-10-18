# HIGHFLY ORIGIN — COMBAT SUPREME / ADR-R39-000 (18 Oct 2026)

## Scope and status
**P0 SPEC + PURE SANDBOX ONLY.** No live gameplay, saves, public Pages, donor, or HUD changed. Start from certified R38 branch `highfly-origin-r38-simple-entry`, frozen World of ClaudeCraft v0.44.0 at `9b57e49c9676d75962700f828cc00a50a9a988b5`.

## Player identity and HUD
- Exactly **one persistent Hunter**. No party swapping. No forced class. The 9 donor classes supply 9 discoverable schools. Mastery, weapon and runes alter behavior, never identity.
- Preserve **R38 current HUD: 4 BASE combat skills**, manual ATK, separate USAR, DASH, JUMP/double-jump, joystick GOLDEN and independent camera. Three UNIQUE powers have **no visible buttons, counters, locks or ghost slots before unlock**. Buffs, gem, consumables live outside the combat four.
- R38 offline saves currently keyed by name: already certified restore but not a unique-profile migration. Do not claim persistent uniqueness is solved by visual entry.
- **Skill permissions/level/quest/MP/stamina/CD/hit/damage stay native Sim authoritative**. A preview or local action intent is never damage/skill entitlement. ATK manual only, no automatic swings.

## Source findings / blockers
- `src/render/characters/visual.ts` uses ONE `current` AnimationAction + full-body `playOneShot`, fadeTo and `onFinished`. This **suppresses the running base during swings**. R39A needs rig-safe split upper/lower pose binding, retarget/selective AnimationClip tracks, movement gait foot phase + fallback for full-body jump/execution. Never make untested per-bone overrides by simply playing two full-body actions at weight 1; that corrupts gait.
- `src/render/characters/anim_state.ts`: `desiredBaseState` chooses cast before moving; distinguish mobile cast pose from planted channel. Preserve swim, death, falling, and sit priorities.
- `src/sim/combat/cast_move_gate.ts` is the SHARED contract for cast start and cast cancel; `src/sim/player_motion.ts` and `src/sim/combat/casting_lifecycle.ts` both consume it. R37A experimented with standard mobile casts but failed its test. Reuse predicate with **explicit allowed combat ability policy**, not blanket toggle that makes forbidden rituals mobile.
- R20/R21/R22/R23 original three-dimensional aiming, R24A native skillshot branch, R37 S1/Meteor lab, native VFX `ability_vfx_registry.ts`, R29/R31 premium experiments, Guinevere R03 unique are DONORS and require cherry-picked, tested adaptation.
- Verify licenses before redistribution: `LICENSE` MIT code; KayKit CC0; `CREDITS.md` restricts individual media. Do not silently add premium donor binaries.
- R38 Pages snapshot already ~1.002 GB: no new full build deployed until shared media and upload budget reviewed.

## Architecture (single authoritative sim)
```
Explicit mobile input receipt (no auto attack, touch dedupe)
 -> R39 input buffer (<=170 ms, per receipt once; expiry on context switch)
 -> context resolver (actual grounded, run, dash, wall, glide,
                       enemy position/broken/downed, defended window)
 -> deterministic action graph (Basic1/2/3, contextual moves, Skill Connect)
 -> native Sim validation (skill known/authorized, MP/Stamina/CD/LOS,
                           equipment, collision, iFrames, CC)
 -> movement kernel (preserve joystick 360/camera; no unintended root)
 -> rig-safe animation choreography (legs run + compatible upper-body attacks)
 -> existing hit events + native VFX/SFX/camera responses
```
The R39 P0 pure reference kernel records candidate **intents only**, without binding an execution to Sim. IDs/timings are **provisional tuning**, not published animation timings or authority.

## R39 — finish the Hunter without powers
1. **R39A anti-slide**: analyze Rig_Medium `AnimationClip.tracks` in the SINGLE upstream `warrior_modular.glb` (both genders are selectable mesh sets in that same GLB); make local safe clip masks and keep run foot rhythm while upper body attacks. Land/wall/glide and water full-body exceptions; never break `SkeletonUtils.clone` or skins.
2. **R39B movement/combat gating**: non-channel combat cast mobile only if authorized; legacy rituals/channel/stealth remain native. Maintain strike timing + 4th elemental gem, direction-free empty ATK and soft-aim near enemies.
3. **R39C contextual action resolver**: one ATK has contextual branches running/dash/air/plunge/back/wall/dodge counter/parry counter/knockdown; explicit input only, unlock/mastery gates, no extra HUD buttons. Build interruptible action graph with startup/active/connect/recovery timing; hit-boxes and iFrames certified server-side, NEVER assigned from client VFX.
4. **R39D defense / enemy state**: perfect dodge/parry require explicit readable telegraphs + user intent, true server windows and reconciliation; separate Break/poise from HP; correct mob reaction state/airborne/boss immunity. Do not auto-parry on proximity. Boss rules/Overdrive only after enemy tests.
5. **R39E mobile QA**: S23 Ultra landscape 3-touch joystick+camera+skill, 60 FPS target (not assertion), no double swings, no clip pops, no phantom side effects, legacy native save and HUD regressions.

## R40 — skill compatibility/adapters
- Build canonical `CombatAbilityContract` with: input, required context, startup/active/connect/recovery, buffer, movement, tracking, collision, damage/break, reaction/armor/iFrames, cost/CD, resource guard, unlock/mastery, transitions, VFX/SFX/camera, runes and upgrade policy.
- First canonical pilots: basic 1-2-3-4 gem, `fireball` (R37 visual line vs native entity target currently mismatch), `shadow_bolt`, `meteor` (position circle 2-sec fall), `blizzard` (2-sec plant/channel semantics), `heroic_leap`, shield/guard skill.
- Original `ABILITIES` rank/effects/spells are a source of truth, not an auto-grant; special resources `ruinCost`, `devotionCost`, `onNextSwing`, transformations require explicit adapters. R29 23 premium: 14 early native-contract categories and 9 pending semantics; R31 45+23+9 is **catalog design**, not 77 ready skills.
- One visible 4-BASE HUD only; buffs independently; UNIQUEs discoverable secretly, never rendered before unlock. No mass import of prior branches.
- Recheck player skill entitlement + melee/aim events from same server path. Native meteor is spec-gated; mastery policy must be authored before entitlement.

## R41 — Supreme movement, bosses and progression
- Weapon mastery without class switching; timing mastery, guarded stats, rune modifiers and context-dependent skill variants.
- Break -> Punish/Overdrive Window -> manual skill chains -> optional conditional execution. Enemy attacks tagged parryable/blockable/dodgeable/unblockable/interruptible; clear telegraph, no mandatory elemental-key build.
- Full aerial combos, dash cancels, wall/glide attacks only when world collisions and clips are proven; choose physical windup/impact/reaction/hitstop/camera impulse tiers.
- Guinevere R03 provides **inspiration/experimental code only** and local deterministic battle test; no production Sim authority, no claim on proprietary Mobile Legends materials. Boss-special content not deployed ahead of separate approval.

## Acceptance / safety
- P0 does not deploy and never changes donor code. Reuse -> audit -> improve -> extend -> test -> freeze.
- For EACH future integrated action require explicit input receipt, same native authority, correct damage, MP/stamina/CD, animation contact times, no slide and no duplicate, consistent clip rig, multiplayer/saves unaffected.
- Full GREEN CI != real physical S23. No public lab addition until stable S23 manual review and license/size checks.
- Owner can change mechanics or timing after visual feedback; do not claim new mastery/perfect counter/boss/skills are live yet.
