#!/usr/bin/env python3
"""HIGHFLY R39C2 — reusable 170ms combat input buffer with actual manual
empty-air swing support and accepted contextual telemetry; A+B+C1 preserved.
Never synthesizes a new attack. Native Sim/ack remain sole accept authority.
Legacy class buffer behavior unchanged. NO public Pages/HUD layout/saves.
"""
from pathlib import Path

def once(path,old,new):
    file=Path(path)
    s=file.read_text('utf8')
    count=s.count(old)
    if count!=1:
        raise SystemExit(f'R39C2_NATIVE_SOURCE_DRIFT {path} {count} {old[:96]!r}')
    file.write_text(s.replace(old,new,1),'utf8')

guard='src/ui/hud/action_bar/highfly_origin_buffer_guard.ts'
once(guard,
    """  blocked: boolean;
};""",
    """  blocked: boolean;
  /** R39C2: explicit ORIGIN tap with no target is a valid manual whiff. */
  originWhiff?: boolean;
};""")
once(guard,
    """    x.queuedTargetId !== null &&
    x.currentTargetId === x.queuedTargetId &&""",
    """    (x.queuedTargetId !== null ||
      (x.originWhiff === true && x.currentTargetId === null)) &&
    x.currentTargetId === x.queuedTargetId &&""")
hud='src/ui/hud.ts'
once(hud,
    """import { highflyOriginBufferedStrikeAllowed, highflyOriginReadCombatInterruptEpoch,""",
    """import {r39CClassifyStrike} from '../sim/highfly_r39c_combat_context';
import { highflyOriginBufferedStrikeAllowed, highflyOriginReadCombatInterruptEpoch,""")
# R39C1 is authored but under-used: classify based on native ACCEPTED swing,
# never a speculative tap (online ack might refuse).
once(hud,
    """    this.highflyAcceptedBasicAttacks++;
    document.body.dataset.highflyBasicAttackCount = String(this.highflyAcceptedBasicAttacks);""",
    """    this.highflyAcceptedBasicAttacks++;
    if (this.sim.player.originResources) {
      const p=this.sim.player;
      const r39Ctx=r39CClassifyStrike({
        onGround:p.onGround,vy:p.vy,
        horizontalSpeed:Math.hypot(p.vx,p.vz),
        dead:p.dead,swimming:p.swimDiving,
      });
      if (r39Ctx) document.body.dataset.highflyR39CombatContext=r39Ctx;
    }
    document.body.dataset.highflyBasicAttackCount = String(this.highflyAcceptedBasicAttacks);""")
# Keep original 200ms forgiveness for legacy hero classes. The ORIGIN
# follows the R39 P0 tuned 170ms maximum, without touching Sim swingTimer.
once(hud,
    """this.isMobileLayout() && wait <= 0.20 && this.highflyV91QueuedAttack === null""",
    """this.isMobileLayout() &&
          wait <= (this.sim.player.originResources ? 0.17 : 0.20) &&
          this.highflyV91QueuedAttack === null""")
once(hud,
    """            queuedTargetId: originQueuedTarget,
            currentTargetId: this.sim.player.targetId,""",
    """            queuedTargetId: originQueuedTarget,
            currentTargetId: this.sim.player.targetId,
            // R39C2: allow only ORIGIN targetless tap -> targetless tap.
            // The native ATK still pays stamina, performs the genuine swing,
            // and does no damage when the area contains no hostile.
            originWhiff: Boolean(this.sim.player.originResources),""")
# Nothing ever changes CAST, R39A clip mixer, R39B mobile skill predicates.
s=Path(hud).read_text('utf8')
for marker in [
    'this.highflyOriginStrikeAck.pending',
    'this.highflyOriginStrikeAck.settle',
    'this.highflyOriginAcceptBasicStrike(next, elemental, now)',
    'highflyOriginBufferedStrikeAllowed({',
    'highflyOriginReadCombatInterruptEpoch()',
    'this.onMobileAttackNearest?.()',
]:
    if marker not in s:raise SystemExit('R39C2_NATIVE_HUD_INVARIANT_DRIFT '+marker)
if 'highflyR39bMobileProjectileCast' not in Path('src/sim/combat/cast_move_gate.ts').read_text('utf8'):
    raise SystemExit('R39C2_R39B_NATIVE_SKILL_GATE_MISSING')
if 'r39StartMobileBasic(abilityId)' not in Path('src/render/characters/visual.ts').read_text('utf8'):
    raise SystemExit('R39C2_R39A_SPLIT_MISSING')
print('HIGHFLY_R39C2_REAL_170MS_TARGETLESS_ATK_BUFFER_CONTEXT_ACK_GREEN=1')
