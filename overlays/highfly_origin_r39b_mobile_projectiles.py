#!/usr/bin/env python3
"""R39B-P1: adapt donor's ONE native mobility admission predicate.
Requires R39A already applied and certified. Original Sim still owns spell:
entitlement, cooldown, MP/stamina, target, collision, hit and damage.
NO auto-cast, instant spell grants, rituals, channels, save or HUD changes.
"""
from pathlib import Path
path=Path('src/sim/combat/cast_move_gate.ts')
s=path.read_text('utf8')
start=s.find('export function abilityCastSurvivesMovement(')
if start<0 or s.count('export function abilityCastSurvivesMovement(')!=1:
    raise SystemExit('R39B_DONOR_GATE_MISSING_OR_DUPLICATED')
if 'highflyR39bMobileProjectileCast' in s:
    raise SystemExit('R39B_ALREADY_APPLIED_REFUSE_DUPLICATE')
bool_at=s.find('return Boolean(',start)
if bool_at<start or bool_at-start>1150:
    raise SystemExit('R39B_SHARED_BOOLEAN_GATE_DRIFT')
pre=s[start:bool_at]
if 'resolved' not in pre or 'abilityId' not in pre or 'p: Entity' not in pre:
    raise SystemExit('R39B_GATE_SIGNATURE_DRIFT')
old='return Boolean('
helper="""// HIGHFLY ORIGIN R39B — reviewed native combat projectile whitelist only.
// DO NOT grant mobility generically to all spells: channels, rituals, revives,
// gathering and casting animations retain their original donor restrictions.
const HIGHFLY_R39B_MOBILE_PROJECTILES: Readonly<Record<string,string>> = Object.freeze({
  fireball:'mage',
  frostbolt:'mage',
  lightning_bolt:'shaman',
  shadow_bolt:'warlock',
});
export function highflyR39bMobileProjectileCast(
  p:Entity,
  abilityId:string,
  resolved:{def:object;castTime?:number},
):boolean {
  const className=HIGHFLY_R39B_MOBILE_PROJECTILES[abilityId];
  if(!className)return false;
  const entity=p as Entity & {originResources?:unknown};
  if(!entity.originResources)return false;
  const def=resolved.def as {
    id?:string;class?:string;channel?:unknown;
    castTime?:number;requiresTarget?:boolean;targetMode?:string;
  };
  if(def.id!==abilityId||def.class!==className||def.channel) return false;
  if(def.targetMode==='position'||def.requiresTarget!==true)return false;
  const time=resolved.castTime??def.castTime??0;
  return Number.isFinite(time) && time>0;
}

"""
if s.count('export function abilityCastSurvivesMovement(')!=1:raise SystemExit('R39B_GATE_DRIFT')
s=s[:start]+helper+s[start:]
# Search again: function moved after inserted helper.
start=s.index('export function abilityCastSurvivesMovement(')
bool_at=s.find(old,start)
if bool_at<start or bool_at-start>1150:
    raise SystemExit('R39B_RELOCATED_GATE_DRIFT')
s=s[:bool_at]+s[bool_at:].replace(old,
    'return Boolean(\n    highflyR39bMobileProjectileCast(p,abilityId,resolved) ||',1)
path.write_text(s,'utf8')
# Two original sites still call the shared gate; no separate movement plugin.
motion=Path('src/sim/player_motion.ts').read_text('utf8')
casting=Path('src/sim/combat/casting_lifecycle.ts').read_text('utf8')
if 'abilityCastSurvivesMovement(p, p.castingAbility, casting)' not in motion:raise SystemExit('R39B_MOVEMENT_CONSUMER_DRIFT')
if '!abilityCastSurvivesMovement(p, ability.id, res)' not in casting:raise SystemExit('R39B_CAST_CONSUMER_DRIFT')
print('HIGHFLY_R39B_AUTHORITATIVE_SHARED_CAST_MOVE_GUARD_ADAPTED=1')
