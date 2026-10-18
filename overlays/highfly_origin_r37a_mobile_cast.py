#!/usr/bin/env python3
"""R37A CAST FREEDOM: reuse ORIGINAL cast_move_gate.ts ONLY.
The same native predicate controls the press-time denial AND the move-to-cancel
while the existing PlayerMotion moves and existing CastingLifecycle applies
real MP, cooldowns, damage, hit roll, cast finish and VFX. Zero fake spells,
zero edits to cast lifecycle, movement, legacy hero classes, saves or rig.
Only ORIGIN Hunter with originResources receives the opt-in behavior.
"""
from pathlib import Path
path=Path('src/sim/combat/cast_move_gate.ts')
s=path.read_text(encoding='utf8')
old="""export function abilityCastSurvivesMovement(
  p: Entity,
  abilityId: string,
  resolved: { def: { castWhileMoving?: boolean }; castWhileMoving?: boolean },
): boolean {
  return Boolean(
    resolved.def.castWhileMoving ||"""
new="""/** R37A — standard, non-channelled combat spells cast while walking/running.
 * An ORIGIN Hunter alone receives this mobility; original hero classes,
 * rituals, channels, fishing, resurrection channels, and generic action
 * interactions retain donor semantics. Reuse the exact SAME guard for the
 * start-cast and movement-interrupt paths: no free casts or bypassed costs.
 */
export function highflyOriginMobileStandardCast(
  p: Entity,
  abilityId: string,
  resolved: {
    def: { id?: string; class?: string; castTime?: number; channel?: boolean };
    castTime?: number;
  },
): boolean {
  const def=resolved.def;
  return Boolean(
    p.originResources &&
    def.id===abilityId &&
    typeof def.class==='string' &&
    def.class.length>0 &&
    !def.channel &&
    Math.max(def.castTime??0,resolved.castTime??0)>0
  );
}

export function abilityCastSurvivesMovement(
  p: Entity,
  abilityId: string,
  resolved: {
    def: {
      id?: string; class?: string; castTime?: number;
      channel?: boolean; castWhileMoving?: boolean
    };
    castTime?: number; castWhileMoving?: boolean;
  },
): boolean {
  return Boolean(
    highflyOriginMobileStandardCast(p,abilityId,resolved) ||
    resolved.def.castWhileMoving ||"""
if s.count(old)!=1:raise SystemExit('R37A_NATIVE_CAST_MOVE_SOURCE_DRIFT')
s=s.replace(old,new,1)
path.write_text(s,encoding='utf8')
print('HIGHFLY_R37A_ORIGIN_NATIVE_CAST_WHILE_RUNNING_REUSED_SHARED_DONOR_GATE=1')
