# HIGHFLY — Elemental Gem Pipeline Canon v1

Status: DESIGN CONTRACT. GAME-C2 must not implement a duplicate profession, loot, item, or crafting engine.

## Canonical acquisition loop

MINING -> ELEMENTAL RAW MATERIAL -> BLACKSMITHING -> SOCKET / INLAY -> ELEMENTAL WEAPON

1. Mining is the primary gathering source for elemental raw material.
2. Existing loot/content may later provide rare finished gems or special materials, but that is not the normal path.
3. Blacksmithing reuses the existing crafting/item systems to refine the material and inlay the gem into a compatible weapon.
4. A weapon must have a valid elemental socket/inlay state. A loose gem in inventory grants nothing.
5. GAME-C1/C2 v1 allows one ACTIVE elemental gem effect per weapon at a time.
6. The equipped weapon plus its active valid gem authorizes ATK4:
   ATK1 -> ATK2 -> ATK3 -> ATK4 ELEMENTAL -> RESET.
7. Without an active valid gem:
   ATK1 -> ATK2 -> ATK3 -> RESET.
8. Gem activation is equipment state, never HIGHFLY Core stat authority.

## Elemental v1

- Fire: elemental impact + burn / small explosion seam.
- Frost: slow; future freeze may require stronger content/rules.
- Lightning: shock / short stun seam.
- Air: displacement / small launch seam.

Future elements and elemental fusion are separate progression/content work and must not mutate original ClaudeCraft class skills automatically.

## Absolute stat rule

Elemental gems, weapons, armor, class, specialization, skills, talents and loot MUST NOT directly grant or mutate:
STR / AGI / VIT / PER / INT.

They may affect derived equipment/gameplay attributes and elemental effects through the normal item/combat systems.

## Skill isolation

Original ClaudeCraft abilities remain original. Equipping Fire does NOT transform Fireball, Heroic Leap, Cleave, etc. into elemental variants. Purpose-built HIGHFLY elemental/evolved skills are separate future abilities.

## Authority

- SIM owns gem validity, equipped-weapon binding, ATK4 availability and elemental gameplay rider.
- Render/VFX communicates the state but has no damage authority.
- HUD only exposes state/action; it does not decide damage or eligibility.

## Next implementation pass

After GAME-C2 mobile feel is accepted on the S23 Ultra, audit the existing Mining, Blacksmithing, item socket/affix, inventory and crafting seams and implement the smallest adapter needed for:
mined material -> recipe -> gem item -> socket/inlay -> activation -> existing GAME-C1 elemental state.
