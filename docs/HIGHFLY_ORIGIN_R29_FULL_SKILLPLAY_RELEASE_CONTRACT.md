# HIGHFLY ORIGIN R29 — FULL SKILLPLAY, NO PLACEHOLDERS

Owner requirement 2026-10-16. This is an implementation/release contract, **not** a claim that the effects are already integrated.

## Goal

One compact scrollable testing drawer near upper-right on Samsung S23 Ultra landscape.
Two top-level tabs: **CLAUDE ORIGINAL (all native active skills)** and **PREMIUM 23 (all 23 playable adaptations)**.
Tap once to temporarily assign the selected skill to one large existing ATK / S1 tester action,
close drawer immediately, then press or hold/drag/release tester action. No permanent unlock, no
override of the final 7 normal skills, 3 reserved uniques, bottom buffs. Provide name **and upstream ID**.

**DO NOT PUBLISH R29 AS COMPLETE until all 23 are genuinely playable**, not catalog-only,
not a mocked hit, not a generic substitute VFX and not marked GREEN by a smoke test alone.

## Source of truth

Original native abilities: frozen ClaudeCraft src/sim/content/classes.ts, never guessed names or damage.
Source IDs include `shadow_bolt` (upstream display name Gloom Bolt), `meteor` (Skystone),
`heroic_leap` (Vaulting Charge); use helpful aliases but preserve ID, mechanics, ranks.

MIT upstream VFX projects pinned by HIGHFLY R27:
- https://github.com/achrefelouafi/LinearAbiltyCastingThreeJS at 97f1de19617e9a2e3af3c8021c8c21c8f58b40f3 (6)
- https://github.com/achrefelouafi/LinearAbilityExtThreeJS at bf58757ab9b6057515470aa074cdb4026bc54ed7 (7)
- https://github.com/achrefelouafi/LinearAbiltyCastingExtendedThreeJS at 8c377c886ac2c68b26bc65c8f3507905818b974a (10)

Each vendor adapter preserves the original MIT license notices; never silently ship third-party
binary FBX/HDR/textures/models absent independent license verification. Prefer procedural sources.

## Engine integration specification

1. **Real VFX**: 23/23 actual source effect modules and dependency graph (not icon/name-only, not
one generic projectile shader for 23). Adapt THREE scene hooks, materials/shaders, particle
engine, pools, clock/delta, ground sampling, camera shake and disposal to HIGHFLY's existing
WebGL renderer; maintain per-effect visual identity and unique travel/impact timing.
2. **Authoritative gameplay**: create reviewed, namespaced `hf_vfx23_*` skill contracts for
all 23 including HP/MP/Stamina cost, cooldown, damage/control/barrier/summon/portal behavior,
LOS, range, collision/area, cast phases, hit/miss, cancellation. Existing native Sim remains
sole combat authority. Demo cooldowns/dimensions are NOT RPG balance values.
3. **Premium aim**: per-skill preview derived from native collision contract, not vague cosmetics:
line projectile, variable-depth cone, target-lock, ground circle, ring, multi-step gate and
freeform scribe as applicable. Camera-relative S23 pointer geometry, preview on initial touch,
manual drags never auto-snap, release casts, cancel never charges. Intelligent tap may auto-target.
Multitouch left joystick/right aim, no camera stealing.
4. **KayKit**: original modular warrior + Rig_Medium 22 clips, preserve animation and bone
names. Blend locomotion with upper-body casts where suitable; avoid sliding feet.
5. **HUD**: only one upper-right collapsed launcher, responsive scroll with search/school/
shape filters, damage, CD, resource cost, hit type and status. Selected name and ID visible
on tester action. No duplicate `HUNTER · SKILLS` debug panel over minimap; NPC popups
must not block tester during combat.
6. **No regressions**: level-up LV1→2→20→99 preserves session selection; real permanent
unlocks remain unchanged, original basic 1-2-3 and fourth elemental gem never silently disabled
outside trial override; reset returns original ATK. Public root, V15.2, game saves untouched.

## Mandatory release gate — all required

- Automated exhaustiveness: exactly 23/23 R27 premium IDs have real native metadata,
  executed source VFX module, authoritative cast bridge and a stable per-skill aim contract.
- For each of 23: select → preview → native cost/CD → cast → visible source VFX →
  real hit/miss and collision → damage/CC/buff/summon as designed → cleanup. No fake success.
- Every original native active ability appears in list with true display name, ID, costs,
  CD, type and supports applicable native aiming/conditional prechecks; pure passives
  appropriately separated and not castable.
- Real Chrome S23 landscape interaction: at least 23/23 smoke casts after prewarm and
  hit/miss sample by aim mode; no console errors; HUD no overlap; sustained frame budget.
- Native rigorous TS + WebGL build, skills/collision/level-up regressions, original 9-class
  SUPREME tests. User tests physical S23 afterward.
- Only then publish a new isolated R29 Pages artifact with reversible preservation
  checks and site size below guard.

## Current state at creation

R28 is a functional ORIGINAL skill tester but 23 Premium entries are **catalog-only**.
No release artifact or 23/23 VFX is asserted by this document. R29 is under construction.
