#!/usr/bin/env python3
"""HIGHFLY V15.2 P0 — restore ClaudeCraft's ORIGINAL charged-skill input.

CLEAN V1 introduced custom capture-phase touch routing for desktop S1–S10
to support mobile taps + long-press tooltips while keeping native castSlot.
But it intercepts pointerdown before ClaudeCraft's empowered hold listener.
This narrow opt-out lets the native press→charge→release path run untouched
for dynamically empowered slots. Normal slots retain CLEAN's proven
touch+joystick dispatch; no skill IDs, damage, costs or animation edits.
Install in disposable assembled upstream AFTER CLEAN, V9.1 and V15.1.
"""
from pathlib import Path

def once(path: str, original: str, replacement: str) -> None:
    p=Path(path)
    s=p.read_text(encoding="utf-8")
    count=s.count(original)
    if count!=1: raise SystemExit(f"HF15_SKILL_INPUT_SOURCE_DRIFT {path} count={count}: {original[:140]}")
    p.write_text(s.replace(original,replacement,1),encoding="utf-8")

hud="src/ui/hud.ts"
once(hud,
    """      btn.dataset.hotbarSlot = String(slot);
      // slot 0 is Attack""",
    """      btn.dataset.hotbarSlot = String(slot);
      // HIGHFLY P0: capture phase runs BEFORE the original charged-skill
      // pointerdown handler. Refresh every press: spec/form/talent remaps
      // can change the binding while the button DOM stays mounted.
      btn.addEventListener('pointerdown', () => {
        btn.dataset.hfV15NativeEmpowerHold =
          this.empoweredAbilityIdForSlot(slot) !== null ? '1' : '0';
      }, { capture: true });
      // slot 0 is Attack""")

runtime="src/highfly/game_c1_runtime.ts"
# Never affect mouse, ordinary taps, ordinary long-press info, HUD editor or
# the separate native mobile radial action ring.
for kind,anchor in (
    ("down","""        'pointerdown',
        (event) => {
          if (event.pointerType !== 'touch') return;"""),
    ("move","""        'pointermove',
        (event) => {
          if (event.pointerType !== 'touch' || event.pointerId !== pointerId) return;"""),
    ("up","""        'pointerup',
        (event) => {
          if (event.pointerType !== 'touch' || event.pointerId !== pointerId) return;"""),
    ("cancel","""        'pointercancel',
        (event) => {
          if (event.pointerId !== pointerId) return;"""),
    ("click","""        'click',
        (event) => {
          if (dispatchingNativeClick) return;""")
):
    original=anchor
    lines=original.splitlines()
    # Skip custom capture processing for a native empowered slot, allowing the
    # source event to continue to ClaudeCraft's bound pointer handler.
    lines.insert(2,"          if (btn.dataset.hfV15NativeEmpowerHold === '1') return;")
    once(runtime,original,"\n".join(lines))

s=Path(runtime).read_text(encoding="utf-8")
assert s.count("if (btn.dataset.hfV15NativeEmpowerHold === '1') return;")==5
assert "dispatchingNativeClick = true;" in s
assert "btn.click();" in s
assert "if (slot < 1 || slot > 10 || btn.dataset.hfC1Touch === '1') return;" in s
h=Path(hud).read_text(encoding="utf-8")
assert "this.empoweredAbilityIdForSlot(slot) !== null ? '1' : '0'" in h
assert "this.bindEmpoweredActionHold(btn, () => slot)" in h
print("HF15_V152_P0_NATIVE_SKILLS_ORIGINAL_HOLD_PRESERVED_10_TOUCH_SLOTS=1")
