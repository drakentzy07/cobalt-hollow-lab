#!/usr/bin/env python3
"""R36A (after P35): one authoritative ORIGIN melee intent even on a whiff.
Native World/Sim still owns hit, damage, stamina, targeting and recovery.
A whiff is a legitimate swing with no damage, not a fake damage event.
Legacy classes and GOLDEN motion are left byte-for-byte untouched.
"""
from pathlib import Path

def once(path,old,new):
 p=Path(path);s=p.read_text(encoding='utf8')
 n=s.count(old)
 if n!=1:raise SystemExit(f"R36A_SOURCE_DRIFT {path}: {n} {old[:110]!r}")
 p.write_text(s.replace(old,new,1),encoding='utf8')

def attack_once(path,old,new):
 p=Path(path);s=p.read_text(encoding='utf8')
 marker='export function highflyBasicAttack('
 start=s.find(marker)
 if start<0:raise SystemExit('R36A_ATTACK_FUNCTION_NOT_FOUND '+path)
 # Only the game action's function body; never patch the two native autoattack
 # target resolver sites which legitimately share identical syntax.
 end=s.find('\nexport function ',start+len(marker))
 if end<0:end=len(s)
 body=s[start:end]
 n=body.count(old)
 if n!=1:raise SystemExit(f'R36A_ATTACK_BODY_DRIFT {path}: {n}: {old[:110]!r}')
 p.write_text(s[:start]+body.replace(old,new,1)+s[end:],encoding='utf8')

path='src/sim/combat/auto_attack.ts'
once(path,
 "export function highflyBasicAttack(",
 """// A miss into EMPTY SPACE is an accepted ORIGIN action, never a fake hit.
 // This is the only whiff branch: native target/hit damage is untouched.
function highflyR36AWhiff(ctx:SimContext,p:Entity,meta:PlayerMeta,step:1|2|3|4):boolean{
  if (!meta.originHunter) return false; // Never change legacy class semantics.
  if (!originSpendBasicStamina(meta.originHunter, step)) return false;
  if (p.mountKey !== '') forceDismount(ctx,p);
  if (p.sitting) ctx.standUp(p);
  if (p.weaponStowed) drawWeapon(p);
  p.autoAttack=false;
  meta.lastActiveTick=ctx.tickCount;
  p.swingTimer=step===1?.36:step===2?.40:step===3?.58:.68;
  // Typed cosmetic cue lets the same Rig_Medium render its one-shot attack.
  // No target reference, no random damage, no aggro, no HP mutation.
  ctx.emit({type:'highflyBasicSwing',sourceId:p.id,step});
  return true;
}

export function highflyBasicAttack(""")
# Keep the existing elemental gate: ATK4 without a gemstone cannot be
# accepted even when swinging into empty space.
attack_once(path,
 "  const t = p.targetId !== null ? ctx.entities.get(p.targetId) : null;",
 """  if (step === 4 && !highflyElementalFinisherReady(p)) return false;
  const t = p.targetId !== null ? ctx.entities.get(p.targetId) : null;""")
# In R14D, the legacy rejection precedes two native damage routes.
attack_once(path,
 """  if (!t || t.dead || !ctx.isHostileTo(p, t) || hasEscapeStealth(t)) return false;""",
 """  if (!t || t.dead || !ctx.isHostileTo(p, t) || hasEscapeStealth(t)) {
    return r.meta.originHunter ? highflyR36AWhiff(ctx,p,r.meta,step) : false;
  }""")
attack_once(path,
 """    if (!ctx.hasLineOfSight(p, t)) return false;
    if (!originSpendBasicStamina(r.meta.originHunter, step)) return false;""",
 """    if (!ctx.hasLineOfSight(p, t))
      return r.meta.originHunter ? highflyR36AWhiff(ctx,p,r.meta,step) : false;
    if (!originSpendBasicStamina(r.meta.originHunter, step)) return false;""")
attack_once(path,
 """  if (d > effectivePlayerAttackRange(t, MELEE_RANGE, meleeReachActor(ctx, p))) return false;
  if (isArenaPos(p.pos.x) && !ctx.hasLineOfSight(p, t)) return false;""",
 """  if (d > effectivePlayerAttackRange(t, MELEE_RANGE, meleeReachActor(ctx, p))) {
    return r.meta.originHunter ? highflyR36AWhiff(ctx,p,r.meta,step) : false;
  }
  if (isArenaPos(p.pos.x) && !ctx.hasLineOfSight(p, t))
    return r.meta.originHunter ? highflyR36AWhiff(ctx,p,r.meta,step) : false;""")
once('src/sim/types.ts',
 """  | {
      type: 'heal';
      targetId: number;""",
 """  | {
      // HIGHFLY R36A: authentic EMPTY-AIR player swing. Renderer one-shot only.
      // Deliberately no targetId, amount, combat threat or damage.
      type: 'highflyBasicSwing';
      sourceId: number;
      step: 1 | 2 | 3 | 4;
    }
  | {
      type: 'heal';
      targetId: number;""")
once('src/render/renderer.ts',
 """      case 'damage': {
        // Every melee/ranged hit animates the attacker.""",
 """      case 'highflyBasicSwing': {
        // Damage-less manual strike: the only way to animate a whiff
        // without fabricating a target, fake zero-damage hit or aggro.
        if (this.sim.entities.get(ev.sourceId)?.originResources)
          this.triggerAttack(ev.sourceId,'highfly_basic_'+ev.step);
        break;
      }
      case 'damage': {
        // Every melee/ranged hit animates the attacker.""")
# R36A does not touch CSS / click dispatch / world maps. It DOES prevent any
# old C1 contextual label overwrite by making the P35 intent contract explicit.
once('src/highfly/game_c1_runtime.ts',
 """  const use = !document.body.classList.contains('hf-android-p3') && w.__highflyGameC1Context?.canUse?.() === true;""",
 """  // The R36A action surface owns two genuinely separate native elements.
  // Contextual USAR may never replace the main fixed-attack semantics.
  const use = !document.body.classList.contains('hf-android-p3') &&
    !document.body.classList.contains('hf-android-p35') &&
    w.__highflyGameC1Context?.canUse?.() === true;""")
# On real ATK press, acquire a close frontal hostile without making TARGET a
# prerequisite. Original normal/legacy target selection stays intact.
# The second scanner is a manual-press-only fallback for S23 near enemies.
import shutil
shutil.copyfile('../v9-corrections/game/c1/highfly_r36a_soft_attack_target.ts',
  'src/game/highfly_r36a_soft_attack_target.ts')
once('src/main.ts',
 "import { bestSoftAutoTarget } from './game/auto_target';",
 "import { bestSoftAutoTarget } from './game/auto_target';\nimport { highflyR36ANearbyTarget } from './game/highfly_r36a_soft_attack_target';")
once('src/main.ts',
 "  hud.onMobileAttackNearest = () => attackNearest();",
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
  };""")
print('HIGHFLY_R36A_AUTHENTIC_AIR_STRIKE_NO_FAKE_DAMAGE_NO_LEGACY_DAMAGE_AND_NATIVE_ATK_ALWAYS_ATK=1')
