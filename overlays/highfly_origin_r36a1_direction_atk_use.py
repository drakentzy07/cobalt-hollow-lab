#!/usr/bin/env python3
"""R36A.1 final: native ATK never contextual USAR; manual swing follows GOLDEN
joystick bearing in empty field, soft-turns only for an enemy <=5y.
Apply after the fully GREEN R36A patch, before simulation acceptance.
"""
from pathlib import Path
import shutil
def once(path,old,new):
 p=Path(path);s=p.read_text(encoding='utf8')
 n=s.count(old)
 if n!=1:raise SystemExit(f'R36A1_SOURCE_DRIFT {path}: {n} {old[:100]!r}')
 p.write_text(s.replace(old,new,1),encoding='utf8')

# Previous P3/C1 only changed ATK lettering. Underneath, the fixed ATK handler
# still calls deps.contextualUse() before trying the strike. Separate the action
# itself, not just the DOM and its CSS.
once('src/ui/hud/action_bar/mobile_action_ring_controller.ts',
 """    if (deps.contextualUse()) {
      attackBtn.blur();
      return;
    }""",
 """    // HIGHFLY ORIGIN: only #mobile-interact may execute USAR.
    // ClaudeCraft legacy may keep its existing contextual attack behaviour.
    if (!document.body.classList.contains('hf-android-p35') &&
        deps.contextualUse()) {
      attackBtn.blur();
      return;
    }""")

shutil.copyfile('../v9-corrections/game/c1/highfly_r36a1_attack_heading.ts',
                'src/game/highfly_r36a1_attack_heading.ts')
once('src/main.ts',
 "import { highflyR36ANearbyTarget } from './game/highfly_r36a_soft_attack_target';",
 """import { highflyR36ANearbyTarget } from './game/highfly_r36a_soft_attack_target';
import { highflyR36A1AttackHeading, highflyR36A1EnemyInMeleeRange } from './game/highfly_r36a1_attack_heading';""")

once('src/main.ts',
 """  hud.onMobileAttackNearest = () => {
    const p=world.player;
    // Only the single Hunter ORIGIN on the experimental Android combat HUD.
    // If the player deliberately holds a target, classic locking wins.
    if (document.body.classList.contains('hf-android-p35') &&
        p.originResources && p.targetId===null) {
      const pvp=activePvpOpponentIds(world);
      const nearby=highflyR36ANearbyTarget(
        world.entities.values(),p.pos,input.camYaw,
        e=>isAttackableEntity(world.entities.get(e.id),world.playerId,pvp),5);
      if(nearby!==null){
        world.targetEntity(nearby);
        highflyV91AimAt(nearby);
        return;
      }
    }
    attackNearest();
  };""",
 """  hud.onMobileAttackNearest = () => {
    const p=world.player;
    // One ATTACK press, never automatic pursuit of enemies 40yd away.
    // The unmodified attackNearest() belongs only to legacy controls.
    if (document.body.classList.contains('hf-android-p35') && p.originResources) {
      const direction=highflyR36A1AttackHeading(
        input.camYaw,input.highflyTouchVector(),p.facing);
      // Explicit lock is respected, but must be in melee range to turn.
      if (highflyManualTargetLocked() && p.targetId!==null) {
        const locked=world.entities.get(p.targetId);
        if (locked && !locked.dead &&
            highflyR36A1EnemyInMeleeRange(p.pos,locked.pos,5)) {
          highflyV91AimAt(locked.id);
          return;
        }
      }
      const pvp=activePvpOpponentIds(world);
      const nearby=highflyR36ANearbyTarget(
        world.entities.values(),p.pos,direction,
        e=>isAttackableEntity(world.entities.get(e.id),world.playerId,pvp),5);
      if(nearby!==null) {
        world.targetEntity(nearby);
        highflyV91AimAt(nearby);
      } else {
        // No attackable enemy in melee range ahead: swing along the
        // analog travel vector. Keep camera/joystick and free movement.
        // Clear soft previous target so far-away targets cannot re-orient.
        if (!highflyManualTargetLocked() && p.targetId!==null)
          world.targetEntity(null);
        p.facing=direction;
      }
      return;
    }
    attackNearest();
  };""")
print('HIGHFLY_R36A1_DIRECTIONAL_AIR_ATK_CLOSE_SOFT_AIM_AND_REAL_ATK_USE_SEPARATION_APPLIED=1')
