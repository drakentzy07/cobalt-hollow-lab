#!/usr/bin/env python3
from pathlib import Path
p=Path("src/ui/hud.ts")
s=p.read_text()
a="import {r39CClassifyStrike} from '../sim/highfly_r39c_combat_context';"
b="import {r39C3AcceptedMotion} from '../sim/highfly_origin_r39c3_motion_policy';"
assert s.count(a)==1, "R39E_IMPORT_DRIFT"
s=s.replace(a,b,1)
a="""      const r39Ctx=r39CClassifyStrike({
        onGround:p.onGround,vy:p.vy,
        horizontalSpeed:Math.hypot(p.vx,p.vz),
        dead:p.dead,swimming:p.swimDiving,
      });
      if (r39Ctx) document.body.dataset.highflyR39CombatContext=r39Ctx;"""
b="""      const r39Cue=r39C3AcceptedMotion(next, {
        onGround:p.onGround,vy:p.vy,
        horizontalSpeed:Math.hypot(p.vx,p.vz),
        dead:p.dead,swimming:p.swimDiving,
      },true, next!==4 || elemental);
      if (r39Cue) {
        document.body.dataset.highflyR39CombatContext=r39Cue.context;
        document.body.dataset.highflyR39MotionCue=r39Cue.clip;
      }"""
assert s.count(a)==1, "R39E_ACK_DRIFT"
s=s.replace(a,b,1)
p.write_text(s)
print("HIGHFLY_R39E_ACCEPTED_MOTION_HOOK_GREEN=1")
