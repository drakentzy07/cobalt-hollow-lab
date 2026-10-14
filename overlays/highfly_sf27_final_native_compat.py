#!/usr/bin/env python3
"""HIGHFLY SF27: original-source bridge for final FIVE, no new spell engine.
Execute AFTER the SF26 source bridge inside isolated donor checkout only.
All anchors are exact and fail closed on source drift.
"""
from pathlib import Path

patches={
"src/sim/combat/mass_resurrection.ts":[
("""export function isMassResurrectionAbility(ability: Pick<AbilityDef, 'effects'>): boolean {
  return ability.effects.some((effect) => effect.type === 'massResurrectGroup');
}""",
"""export function isMassResurrectionAbility(
  ability: Pick<AbilityDef, 'effects'> & Partial<Pick<AbilityDef, 'id'>>,
): boolean {
  // SF27 only: Wildwake can battle-res ONE dead ally; the original
  // Grove Awakening batch operates only out of combat in effect_dispatch.
  // It must not be cancelled by the mass-rez pre-cast check.
  return ability.id !== 'hf_druid_u1' &&
    ability.effects.some((effect) => effect.type === 'massResurrectGroup');
}""")
],
"src/sim/combat/effect_dispatch.ts":[
("""      case 'resurrectAlly': {
        // Temporal Reversal:""",
"""      case 'resurrectAlly': {
        // SF27: the hybrid chooses original Wildwake ONLY in battle;
        // outside battle original Grove Awakening handles all dead allies.
        if (ability.id === 'hf_druid_u1' && !p.inCombat) break;
        // Temporal Reversal:"""),
("""      case 'massResurrectGroup': {
        resurrectDeadGroupMembers(""",
"""      case 'massResurrectGroup': {
        // Strict native group-rez out-of-combat-only rule. In battle the
        // hybrid uses one target via original Wildwake instead.
        if (ability.id === 'hf_druid_u1' && p.inCombat) break;
        resurrectDeadGroupMembers(""")
],
"src/sim/combat/priest/vespers.ts":[
("""  if (abilityId !== 'summon_tithefiend') return 0;""",
"""  if (abilityId !== 'summon_tithefiend' && abilityId !== 'hf_priest_u2') return 0;"""),
("""  if (meta.cls !== 'priest' || meta.talents.spec !== 'shadow') return;
  if (abilityId === 'summon_tithefiend') {
    summonTithefiend(ctx, priest, gloomtitheStacks);""",
"""  // SF27: all nine HIGHFLY classes retain their original identity. The
  // Priest ultimate calls the original Vespers guardian regardless of legacy
  // ClaudeCraft spec, at the original 1-stack minimum (never a new minion).
  if (meta.cls !== 'priest' ||
    (abilityId !== 'hf_priest_u2' && meta.talents.spec !== 'shadow')) return;
  if (abilityId === 'summon_tithefiend' || abilityId === 'hf_priest_u2') {
    summonTithefiend(ctx, priest,
      abilityId === 'hf_priest_u2' ? Math.max(1, gloomtitheStacks) : gloomtitheStacks);""")
],
"src/sim/combat/casting_lifecycle.ts":[
("""    spendAbilityCost(ctx, p, meta, res);
    armAbilityCooldownWithReflection(ctx, p, meta, res);
    // Blizzard's Frostglobe refund budget resets per cast""",
"""    if (ability.id === 'hf_druid_u2') {
      // SF27: the ORIGINAL 6-tick Hurricane owns channel+zone and nature
      // pulse VFX. Original Starfire & Moonseed direct damage (and the
      // Moonfire-extension rider) land ONCE at cast start on the selected
      // enemy inside the aimed Hurricane radius. Never repeat per tick.
      const aoe = res.effects.find(e => e.type === 'aoeDamage');
      const picked = p.targetId === null ? null : ctx.entities.get(p.targetId);
      const center = p.castAim ?? p.pos;
      if (aoe?.type === 'aoeDamage' && picked && !picked.dead &&
          ctx.isHostileTo(p, picked) && ctx.hasLineOfSight(p, picked) &&
          Math.hypot(center.x-picked.pos.x,center.z-picked.pos.z) <= aoe.radius) {
        ctx.runEffects(p, meta, picked, {
          ...res,
          effects: res.effects.filter(e => e.type !== 'aoeDamage')
        });
      }
    }
    spendAbilityCost(ctx, p, meta, res);
    armAbilityCooldownWithReflection(ctx, p, meta, res);
    // Blizzard's Frostglobe refund budget resets per cast""")
]
}
for name,repls in patches.items():
 path=Path(name)
 source=path.read_text(encoding='utf-8')
 for a,b in repls:
  n=source.count(a)
  if n!=1:
   raise SystemExit('SF27_FROZEN_ORIGINAL_SOURCE_DRIFT:'+name+':'+str(n)+':'+a[:65])
  source=source.replace(a,b,1)
 path.write_text(source,encoding='utf-8')
 print('HF_SF27_SOURCE_BRIDGE_PATCHED='+name)
print('HF_SF27_FIVE_ORIGINAL_NATIVE_BEHAVIORS_BRIDGED_GREEN=1')
