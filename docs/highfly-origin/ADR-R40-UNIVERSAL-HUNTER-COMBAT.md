# HIGHFLY R40 — audited technical decision (2026-10-19)

Frozen baseline: `5c8233e082eacfe74040e5b627becfef8c936179`. Isolated branch only. Existing R39 native Sim remains damage/cooldown/HP authority, and both KayKit bodies remain the original rig.

## Open-code comparison

| Candidate | License verified | Useful | Reason not transplanting entire engine |
|---|---|---|---|
| Hollowmere | Apache-2.0 code; separately licensed media | deterministic hit/evade/parry/event lifecycle, test fixtures | different Sim, world and camera; attribution and media provenance needed |
| Veilspire | MIT | native Three.js, camera/touch/lock-on, spell effects | parallel render/input/game ownership |
| ecctrl | MIT | locomotion blending principles | React Three Fiber + Rapier dependency / physics replacement |
| Walden | no license verified in audit | running slash, dodge movement visual reference | no confirmed reuse permission; assets not cleanly transferable |

**Decision:** no third-party package or assets are imported in R40. Extend existing native R39 event seams, existing 170 ms buffer and R17/R22/P35 aim/HUD, rather than adding another authorititative combat/renderer layer. Future combat timing retuning requires actual S23 evidence.

## R39 observable defects and R40 targeted changes

- R38 staged a welcome button and then a hidden name/gender form. R40 brings the same save-aware form onto the first landscape screen, not a separate character creator.
- Existing R39 perfect dodge/parry events were generated in native mobSwing, but had no clear HUD notice. R40 listens to **confirmed** renderer events, and augments recoil/sparks only after a real successful event. No BLOCK button.
- R37 exposed meteor only if learned. R40 lab behind `hf_r40=1&hf_lab=1&hf_r37=1` inserts temporary native ability projections into the *current in-memory known-list*, never `originHunter.learnedSkillIds`; resource/spell checks and castAbilityAt remain native. This is a development fixture, not an acquired spell.
- Fireball corridor width now matches original native width and has no deceptive circle.
- Keep all nine original schools through the already-present `highflyOriginNativeLearnable` pathway; **do not grant all schools automatically**. Further progression and skill unlock design remain separate work.

## Limits / red-gates

The R40 code change is not proof of a full supreme-combat transition. No promise of 4D input buffering, 360 drag-to-cast meteor, or guaranteed combat animation perfection is made by a TypeScript GREEN. Physical S23 test remains mandatory. A WebGL artifact is staged only, not deployed to Pages.

## Non-negotiable late audit corrections

R40 replaces R39's misleading Block animation on a confirmed Parry with an existing KayKit diagonal riposte; this is still ATK-triggered, never a held guard. The projectile-line edges are widened within the native preview footprint. Rain of Fire has a native Ruin-cost gate and is explicitly disabled in the test panel until that cost is adapted; do not report it as castable merely because metadata exists. A new Vitest tests the actual native Meteor cast, MP debit, cooldown, delayed damage to a hostile mob and save safety. The browser QA now checks pointers on all four skill slots. An emulated Chrome screenshot is **not** a physical Samsung device test.
