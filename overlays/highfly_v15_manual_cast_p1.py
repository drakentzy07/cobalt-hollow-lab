#!/usr/bin/env python3
"""HIGHFLY V15.1-P1 — make mobile ability presses genuinely manual.

Fail-closed overlay on the staged frozen ClaudeCraft + certified V9/V9.1 donor.
A skill MUST NEVER arm repeated white swings merely because it was pressed on
mobile, including when an older localStorage profile keeps the donor's QoL
setting enabled. The desktop donor keeps its explicit opt-in preference.

This does NOT yet replace the fixed mobile Attack toggle with a server-safe
single-strike command; that is V15.1-P2. Deliberately preserves weapons,
hit table, online protocol, 1-2-3 animation and GOLDEN controls.
"""
from pathlib import Path

def once(filename: str, old: str, new: str) -> None:
    f = Path(filename)
    value = f.read_text(encoding="utf-8")
    count = value.count(old)
    if count != 1:
        raise SystemExit(f"HF15_MANUAL_ANCHOR_DRIFT {filename} expected 1 found {count}: {old[:100]!r}")
    f.write_text(value.replace(old,new,1),encoding="utf-8")

helper = Path("src/ui/hud/action_bar/highfly_v15_manual_combat.ts")
if helper.exists():
    raise SystemExit("HF15_MANUAL_HELPER_ALREADY_EXISTS")
helper.write_text("""/** HIGHFLY V15.1-P1: a mobile skill press is never a repeating basic attack.
 * Desktop retains its explicit user preference; old saved settings do not
 * bypass the mobile manual-combat policy. Pure and class-independent. */
export function highflyV15AbilityAutoEngageAllowed(
  isMobile: boolean,
  configured: boolean,
): boolean {
  return !isMobile && configured;
}
""",encoding="utf-8")

hud="src/ui/hud.ts"
once(hud,
    """import {
  confirmPendingAutoAttackEngage,""",
    """import { highflyV15AbilityAutoEngageAllowed } from './hud/action_bar/highfly_v15_manual_combat';
import {
  confirmPendingAutoAttackEngage,""")

once(hud,
    """            this.optionsHooks?.settings.get('startAttackOnAbilityUse') &&
            pressStartsAutoAttack(resolved.effects, mouseoverPid !== null) &&""",
    """            highflyV15AbilityAutoEngageAllowed(
              this.isMobileLayout(),
              this.optionsHooks?.settings.get('startAttackOnAbilityUse') ?? false,
            ) &&
            pressStartsAutoAttack(resolved.effects, mouseoverPid !== null) &&""")

# A timed desktop cast could have armed a pending engage before the interface
# changed to touch. Never let its completion restart the automatic attack there.
once(hud,
    """            if (ev.success) {
              const castTid = sim.player.targetId;""",
    """            if (ev.success && !this.isMobileLayout()) {
              const castTid = sim.player.targetId;""")

# New saves prefer manual combat everywhere. Existing user settings remain
# persisted, and desktop users who deliberately enabled it retain that behavior.
settings="src/game/settings.ts"
once(settings,
    """  startAttackOnAbilityUse: { def: true },""",
    """  startAttackOnAbilityUse: { def: false },""")

assert "this.sim.startAutoAttack();" in Path(hud).read_text(encoding="utf-8")
assert "this.sim.stopAutoAttack();" in Path(hud).read_text(encoding="utf-8")
assert "highflyV15AbilityAutoEngageAllowed" in Path(hud).read_text(encoding="utf-8")
assert "startAttackOnAbilityUse: { def: false }" in Path(settings).read_text(encoding="utf-8")
print("HF15_1_P1_MOBILE_SKILL_AUTOENGAGE_BLOCKED_MANUAL_DEFAULT=1")
