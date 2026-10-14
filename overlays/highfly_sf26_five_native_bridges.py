#!/usr/bin/env python3
"""SF26 source-native delivery adapter for five donor-composed skills.
All edits in an isolated frozen donor checkout; exact-source anchors required.
Warrior landing source leap+faultline+execute; Rogue native poison needs no patch;
Warlock life-trade at drain START, chaos bolt at rain AIM; Druid source bear charge
settles original maul+swipe on ARRIVAL, not before approaching the target.
"""
from pathlib import Path

patches={
"src/sim/combat/heroic_leap.ts":[
("import { MANTLE_REACH, resolvePosition, seatGroundedAt } from '../colliders';",
 "import { MANTLE_REACH, resolvePosition, seatGroundedAt } from '../colliders';\nimport { ABILITIES } from '../data';"),
("  enrageOnVaultingLanding(ctx, entity, flight.abilityId);",
"""  if (flight.abilityId === 'hf_warrior_u2') {
    // Source-native Faultline applies at REAL touchdown, not cast departure.
    const fault = ABILITIES.faultline.effects.find(e => e.type === 'aoeDamage');
    const finish = ABILITIES.execute.effects.find(e => e.type === 'directDamage');
    if (fault?.type === 'aoeDamage' && finish?.type === 'directDamage') {
      for (const enemy of ctx.hostilesInRadius(entity, entity.pos, fault.radius)) {
        if (!ctx.hasLineOfSight(entity, enemy)) continue;
        const dx = enemy.pos.x - entity.pos.x;
        const dz = enemy.pos.z - entity.pos.z;
        if (Math.sin(entity.facing) * dx + Math.cos(entity.facing) * dz < 0) continue;
        const shock = Math.round(ctx.rng.range(fault.min, fault.max));
        ctx.dealDamage(entity, enemy, shock, false, 'physical', flight.abilityName, 'hit');
        if (!enemy.dead && fault.stunSec) {
          ctx.applyAura(enemy, { id: 'hf_warrior_u2_faultline',
            name: flight.abilityName, kind: 'stun',
            remaining: fault.stunSec, duration: fault.stunSec,
            value: 1, sourceId: entity.id, school: 'physical' });
        }
        // Native Execute is a FINISHER: never inflict it on a healthy enemy.
        if (!enemy.dead && enemy.hp / enemy.maxHp < (ABILITIES.execute.requiresTargetHpBelow ?? 0)) {
          ctx.dealDamage(entity, enemy,
            Math.round(ctx.rng.range(finish.min, finish.max)), false,
            'physical', flight.abilityName, 'hit');
        }
      }
    }
  }
  enrageOnVaultingLanding(ctx, entity, flight.abilityId);""")
],
"src/sim/combat/druid_form_entry.ts":[
("  bear_charge: 'bear',","  bear_charge: 'bear',\n  hf_druid_s4: 'bear',")
],
"src/sim/combat/charge_route.ts":[
("import type { SimContext } from '../sim_context';",
 "import type { SimContext } from '../sim_context';\nimport { ABILITIES } from '../data';"),
("  finishBruinRush(ctx, runner, target);",
"""  finishBruinRush(ctx, runner, target);
  // SF26: the original Bear Charge route must ARRIVE before Maul and Swipe.
  // Reuses original flat weapon bonus and original nearby AoE magnitudes.
  if (arrived && target && !target.dead && runner.templateId === 'druid' &&
      runner.cooldowns.has('hf_druid_s4')) {
    const maul = ABILITIES.maul.effects.find(e => e.type === 'weaponDamage');
    const swipe = ABILITIES.swipe.effects.find(e => e.type === 'aoeDamage');
    if (maul?.type === 'weaponDamage' && swipe?.type === 'aoeDamage') {
      ctx.meleeSwing(runner, target, maul.bonus, ABILITIES.hf_druid_s4.name);
      for (const m of ctx.hostilesInRadius(runner, runner.pos, swipe.radius)) {
        if (!ctx.hasLineOfSight(runner, m)) continue;
        ctx.dealDamage(runner, m,
          Math.round(ctx.rng.range(swipe.min, swipe.max)),
          false, 'physical', ABILITIES.hf_druid_s4.name, 'hit');
      }
    }
  }""")
],
"src/sim/combat/casting_lifecycle.ts":[
("  if (ability.channel) {\n    spendAbilityCost(ctx, p, meta, res);",
"""  if (ability.channel) {
    // SF26 original Warlock trades health ONCE at channel startup, never
    // once per Drain Life tick. Keep a health reserve above the donor's
    // own 20% Cruel Pact safety floor; ordinary drain can still proceed.
    if (ability.id === 'hf_warlock_s3') {
      const tap = res.effects.find(e => e.type === 'lifeTap');
      const pact = res.effects.find(e => e.type === 'afflictionCruelPact');
      if (tap?.type === 'lifeTap' && pact?.type === 'afflictionCruelPact' &&
        p.hp > tap.hp + p.maxHp * (pact.healthPct + 0.2)) {
        ctx.runEffects(p, meta, target, {
          ...res, effects: [tap, pact]
        });
      }
    }
    spendAbilityCost(ctx, p, meta, res);""")
],
"src/sim/combat/effect_dispatch.ts":[
("      case 'directDamage': {\n        if (!target) break;",
"""      case 'directDamage': {
        if (ability.id === 'hf_warlock_u1') {
          // A position-cast has no entity target. Original Ruinbolt hits the
          // selected enemy ONLY when it stands inside the original Rain's
          // radius at the aimed point. Reuse ORIGINAL directDamage dispatcher,
          // including guaranteedCrit, SP scaling and existing VFX.
          const ground = res.effects.find(e => e.type === 'groundAoE');
          const selected = p.targetId === null ? null : ctx.entities.get(p.targetId);
          const aim = p.castAim ?? p.pos;
          if (ground?.type !== 'groundAoE' || !selected || selected.dead ||
              !ctx.isHostileTo(p, selected) ||
              Math.hypot(selected.pos.x-aim.x,selected.pos.z-aim.z) > ground.radius)
            break;
          target = selected;
        }
        if (!target) break;""")
]
}
for name,changes in patches.items():
 path=Path(name)
 source=path.read_text(encoding="utf-8")
 for before,after in changes:
  count=source.count(before)
  if count!=1:
   raise SystemExit('SF26_FROZEN_DONOR_SOURCE_CHANGED:'+name+':'+str(count)+':'+before[:42])
  source=source.replace(before,after,1)
 path.write_text(source,encoding="utf-8")
 print('HF_SF26_SOURCE_BRIDGE_PATCHED='+name)
print('HF_SF26_FIVE_SOURCE_NATIVE_BRIDGES_GREEN=1')
