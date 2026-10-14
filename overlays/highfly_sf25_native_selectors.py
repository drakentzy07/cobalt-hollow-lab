#!/usr/bin/env python3
"""SF25 strict source-native compatibility in throwaway donor checkout.
Reuses ORIGINAL shaman_unleash_weapon.runUnleashWeapon (not reimplementing it).
Reuses ORIGINAL ctx.summonPet one-per-owner semantics; alternate donor templates.
Rejects upstream source drift atomically (no partially written files).
"""
from pathlib import Path
path=Path("src/sim/combat/effect_dispatch.ts")
s=path.read_text(encoding="utf-8")
replacements=[
("""  if (ability.id === 'unleash_weapon') runUnleashWeapon(ctx, p, target);""",
"""  if (ability.id === 'unleash_weapon') runUnleashWeapon(ctx, p, target);
  if (ability.id === 'hf_shaman_s4') {
    // SF25: original Pyrebrand effect and original source UnleashWeapon
    // share one button. Apply the original enchanted weapon ID first: the
    // actual ORIGINAL runUnleashWeapon only accepts this native aura ID.
    const pyrebrand = res.effects.find(e => e.type === 'imbue');
    if (pyrebrand?.type === 'imbue') {
      ctx.applyAura(p, {
        id: 'flametongue_weapon',
        name: ABILITIES.flametongue_weapon.name,
        kind: 'imbue',
        value: pyrebrand.bonus,
        remaining: pyrebrand.duration,
        duration: pyrebrand.duration,
        sourceId: p.id,
        school: 'fire',
      });
      runUnleashWeapon(ctx, p, target);
    }
  }"""),
("""      case 'imbue': {
        if (ability.id === 'galeheart_weapon' || ability.id === 'rockbiter_weapon') {""",
"""      case 'imbue': {
        // SF25: the source original Pyrebrand was already applied under its
        // expected source ID BEFORE runUnleashWeapon. Do not overwrite it
        // with fusion ID or it would break the original Shaman engine.
        if (ability.id === 'hf_shaman_s4') break;
        if (ability.id === 'galeheart_weapon' || ability.id === 'rockbiter_weapon') {"""),
("""      case 'summonDemon': {
        ctx.summonPet(p, eff.mobId);
        break;
      }""",
"""      case 'summonDemon': {
        if (ability.id === 'hf_warlock_s5') {
          // SF25: both ORIGINAL donor pets preserved as a deterministic
          // switch, never two permanent demons. The donor engine handles
          // replacing an owned demon through ctx.summonPet.
          const previous = ctx.petOf(p.id);
          const nextMobId =
            previous?.templateId === 'emberkin' ? 'gloomshade' : 'emberkin';
          ctx.summonPet(p, nextMobId);
        } else {
          ctx.summonPet(p, eff.mobId);
        }
        break;
      }""")
]
for a,b in replacements:
 if s.count(a)!=1: raise SystemExit('SF25_FROZEN_EFFECT_DISPATCH_DRIFT:'+a[:72]+':'+str(s.count(a)))
 s=s.replace(a,b,1)
path.write_text(s,encoding="utf-8")
print('HF_SF25_SOURCE_SHAMAN_ORIGINAL_PYREBRAND_UNLEASH_AND_WARLOCK_SINGLE_DEMON_SELECTOR_GREEN=1')
