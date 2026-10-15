#!/usr/bin/env python3
"""HIGHFLY ORIGIN OR-1 P1: cancel stale V9.1 200ms buffered ATK.
Assemble after V15.2 charged-input patch. Reuses the original 1-2-3-4 and
server-authoritative combat; does not add an attack engine or remap movement.
"""
from pathlib import Path
import shutil

def once(filename: str, before: str, after: str) -> None:
    p = Path(filename)
    text = p.read_text(encoding='utf-8')
    count = text.count(before)
    if count != 1:
        raise SystemExit(f'ORIGIN_OR1_SOURCE_DRIFT {filename}: {count} matches for {before[:105]!r}')
    p.write_text(text.replace(before, after, 1), encoding='utf-8')

helper = Path('src/ui/hud/action_bar/highfly_origin_buffer_guard.ts')
if helper.exists():
    raise SystemExit('ORIGIN_OR1_BUFFER_GUARD_DUPLICATE')
shutil.copyfile('../v9-corrections/game/c1/highfly_origin_buffer_guard.ts', helper)

hud = Path('src/ui/hud.ts')
hud.write_text(
    "import { highflyOriginBufferedStrikeAllowed, highflyOriginReadCombatInterruptEpoch, "
    "highflyOriginBumpCombatInterruptEpoch } from './hud/action_bar/highfly_origin_buffer_guard';\n"
    + hud.read_text(encoding='utf-8'), encoding='utf-8'
)
# Explicit intent on every native skill cast invalidates a pending buffered tap.
# Does NOT suppress the native skill, charge, projectile or combo.
once('src/ui/hud.ts',
     '  castSlot(barSlot: number): void {\n',
     '  castSlot(barSlot: number): void {\n'
     '    highflyOriginBumpCombatInterruptEpoch();\n')
# V9.1 buffer was the only asynchronous route to activateFixedAttackSlot. Keep
# its 200ms button forgiveness, but a stale timer may not spawn a surprise attack.
once('src/ui/hud.ts',
     '        this.highflyV91QueuedAttack = setTimeout(() => {',
     """        const originQueuedEpoch = highflyOriginReadCombatInterruptEpoch();
        const originQueuedTarget = this.sim.player.targetId;
        const originDeadlineMs = performance.now() + Math.ceil(wait * 1000) + 120;
        this.highflyV91QueuedAttack = setTimeout(() => {""")
once('src/ui/hud.ts',
     '          this.highflyV91QueuedAttack = null;\n'
     "          if (document.body.classList.contains('mobile-window-open') ||",
     """          this.highflyV91QueuedAttack = null;
          if (!highflyOriginBufferedStrikeAllowed({
            queuedEpoch: originQueuedEpoch,
            currentEpoch: highflyOriginReadCombatInterruptEpoch(),
            queuedTargetId: originQueuedTarget,
            currentTargetId: this.sim.player.targetId,
            nowMs: performance.now(),
            deadlineMs: originDeadlineMs,
            blocked:
              document.body.classList.contains('mobile-window-open') ||
              document.body.classList.contains('mobile-more-open') ||
              this.sim.player.dead ||
              Boolean(this.sim.player.castingAbility),
          })) return;
          if (document.body.classList.contains('mobile-window-open') ||""")

runtime = Path('src/highfly/game_c1_runtime.ts')
runtime.write_text(
    "import { highflyOriginBumpCombatInterruptEpoch } from '../ui/hud/action_bar/highfly_origin_buffer_guard';\n"
    + runtime.read_text(encoding='utf-8'), encoding='utf-8'
)
once('src/highfly/game_c1_runtime.ts',
     'function boot(): void {',
     """// Capture-only observer. NEVER preventDefault/stopPropagation or synthesize
// a cast. Respects native charged holds, 10 slots, camera and joystick touches.
function installHighflyOriginCombatInterrupts(): void {
  if (document.body.dataset.hfOriginCombatInterruptsInstalled === '1') return;
  document.body.dataset.hfOriginCombatInterruptsInstalled = '1';
  document.addEventListener('pointerdown', (event: PointerEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (!target.closest('#mobile-evade, #mobile-jump, #actionbar .action-btn[data-hotbar-slot], #mobile-action-ring .mobile-action-slot, #mobile-action-radial')) return;
    highflyOriginBumpCombatInterruptEpoch();
  }, { capture: true, passive: true });
}

function boot(): void {""")
once('src/highfly/game_c1_runtime.ts',
     "  ensureBuildStamp();",
     "  installHighflyOriginCombatInterrupts();\n  ensureBuildStamp();")

s = hud.read_text(encoding='utf-8')
assert 'this.onHighflyElementalFinisherReady?.()' in s
assert 'highflyOriginBufferedStrikeAllowed({' in s
assert 'this.onHighflyBasicAttack?.(next)' in s
assert 'this.highflyV91QueuedAttack = setTimeout' in s
assert 'highflyOriginBumpCombatInterruptEpoch();' in s
assert runtime.read_text().count('installHighflyOriginCombatInterrupts();') == 1
print('HIGHFLY_ORIGIN_OR1_P1_STALE_BUFFER_CANCEL_GUARD_INSTALLED=1')
