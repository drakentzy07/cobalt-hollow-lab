#!/usr/bin/env python3
"""V9.1 isolated 9-class combat-feel overlay ON TOP of certified V9 P0.
No saves, monster HP, skill costs, XP, training or move-vector authority changes.
Fail closed for any changed frozen donor anchor.
"""
from pathlib import Path
import re

def once(path, old, new):
    p=Path(path); original=p.read_text(encoding="utf-8")
    count=original.count(old)
    if count!=1:
        raise SystemExit(f"V91_EXPECTED_ONE:{path}:{count}:{old[:140]!r}")
    p.write_text(original.replace(old,new,1),encoding="utf-8")

def regex_once(path, pattern, replacement):
    p=Path(path); old=p.read_text(encoding="utf-8")
    updated,n=re.subn(pattern,lambda m:replacement,old,flags=re.MULTILINE)
    if n!=1:
        raise SystemExit(f"V91_EXPECTED_REGEX_ONE:{path}:{n}:{pattern[:120]!r}")
    p.write_text(updated,encoding="utf-8")

# SOURCE OF TRUTH for soft attack target: the already certified 360 scorer.
# V9 only reselected a mob in mobile ATK if no target was held. THIS is the real
# defect: the old living selection could stay pointed at a remote mob.
ring="src/ui/hud/action_bar/mobile_action_ring_controller.ts"
once(ring,
    """    handleMobileAttackTap(deps.attackTapState(), {
      activateAttack: () => deps.activateFixedAttackSlot(),
      attackNearest: deps.attackNearest,
    });
    attackBtn.blur();""",
    """    // V9.1: every ATK press does a NEW soft aim before a discrete strike.
    // The callback preserves manually selected TARGET/LOCK in main.ts.
    // Contextual USAR remains above this path, and NEVER attacks.
    deps.attackNearest?.();
    deps.activateFixedAttackSlot();
    attackBtn.blur();""")

# Attack target scoring is shared for 9 classes but reach must match actual
# weapon mode: no selecting a mob at 15yd for a 5yd dagger strike.
# Keep 35yd for Hunter, 30yd for wand-capable caster classes; natural 5yd
# melee remains melee. The Sim is authoritative for the actual reach.
main="src/main.ts"
once(main,
    """    if (
      lockedEntity &&
      isAttackableEntity(lockedEntity, world.playerId, activePvpOpponents)
    ) {
      return;
    }""",
    """    if (
      lockedEntity &&
      isAttackableEntity(lockedEntity, world.playerId, activePvpOpponents)
    ) {
      highflyV91AimAt(lockedEntity.id);
      return;
    }""")
once(main,
    """    const best = bestSoftAutoTarget(
      world.entities.values(),
      p.pos,
      input.camYaw,
      (e) =>
        isAttackableEntity(
          world.entities.get(e.id),
          world.playerId,
          activePvpOpponents,
        ),
      40,
      p.targetId,
    );""",
    """    const c = world.cfg.playerClass;
    const basicReach = c === 'hunter' ? 35 :
      (c === 'priest' || c === 'mage' || c === 'warlock' ? 30 : 5);
    const best = bestSoftAutoTarget(
      world.entities.values(),
      p.pos,
      input.camYaw,
      (e) =>
        isAttackableEntity(
          world.entities.get(e.id),
          world.playerId,
          activePvpOpponents,
        ),
      basicReach,
      p.targetId,
    );""")
once(main,
    """    const foe = world.entities.get(best);
    if (foe) p.facing = Math.atan2(foe.pos.x - p.pos.x, foe.pos.z - p.pos.z);""",
    """    highflyV91AimAt(best);""")

# Introduce a 125ms VISUAL facing assist on the actual native action intent.
# It never rewrites joystick worldX/worldZ or camera yaw, and expires quickly.
# Handles the exact S23 case of holding movement + tapping a right-hand attack.
once(main,
    """  const padTargetPick = createPadTargetPick({
    world,
    interactKey,
    softTargetFacing: () => input.camYaw,
    softTargetLocked: () => highflyManualTargetLocked(),
  });""",
    """  let highflyV91AimTargetId: number | null = null;
  let highflyV91AimUntil = 0;
  function highflyV91AimAt(id: number): void {
    const foe = world.entities.get(id);
    if (!foe || foe.dead) return;
    const p = world.player;
    p.facing = Math.atan2(foe.pos.x - p.pos.x, foe.pos.z - p.pos.z);
    highflyV91AimTargetId = id;
    highflyV91AimUntil = performance.now() + 125;
  }

  const padTargetPick = createPadTargetPick({
    world,
    interactKey,
    softTargetFacing: () => input.camYaw,
    softTargetLocked: () => highflyManualTargetLocked(),
    onSoftAim: highflyV91AimAt,
  });""")
once(main,
    """      mi.strafeLeft = false;
      mi.strafeRight = false;
    }
    // A teleport""",
    """      mi.strafeLeft = false;
      mi.strafeRight = false;
    }
    // Brief visual aim assist only after an accepted hostile intent. The
    // camera-relative 360 movement direction is unchanged and never frozen.
    if (document.body.classList.contains('mobile-touch') &&
        highflyV91AimTargetId !== null && performance.now() < highflyV91AimUntil) {
      const aimed = world.entities.get(highflyV91AimTargetId);
      if (aimed && !aimed.dead)
        facing = Math.atan2(aimed.pos.x - world.player.pos.x, aimed.pos.z - world.player.pos.z);
    }
    // A teleport""")

# Mobile skill buttons share the pure soft-target selector. No overriding ally
# heals, friendly targets, untargeted AoEs or explicit manual TARGET/LOCK.
# V9 used MINIMUM 12yd for melee abilities; that selected far mobs while
# backstab and other 5yd attacks were guaranteed to reject.
picker="src/game/pad_target_pick.ts"
once(picker,
    """  softTargetLocked?: () => boolean;
}""",
    """  softTargetLocked?: () => boolean;
  /** V9.1: temporary facing on a genuine mobile hostile action intent. */
  onSoftAim?: (id: number) => void;
}""")
once(picker,
    """  const { world, interactKey, softTargetFacing, softTargetLocked } = deps;""",
    """  const { world, interactKey, softTargetFacing, softTargetLocked, onSoftAim } = deps;""")
once(picker,
    """      if (!shouldAutoTarget(ability, preserveManualHostile, allyHeld)) return;""",
    """      if (!shouldAutoTarget(ability, preserveManualHostile, allyHeld)) {
        if (preserveManualHostile && current !== null) onSoftAim?.(current);
        return;
      }""")
once(picker,
    """        action.id === CROSS_HOTBAR_ATTACK_ID ? 12 : (typeof ability?.range === 'number' && ability.range > 0 ? Math.min(40, Math.max(12, ability.range)) : 12),""",
    """        action.id === CROSS_HOTBAR_ATTACK_ID ? 5 :
          (typeof ability?.range === 'number' && ability.range > 0 ?
            Math.min(40, Math.max(5, ability.range)) : 5),""")
once(picker,
    """        if (foe) {
          world.player.facing = Math.atan2(foe.pos.x - world.player.pos.x, foe.pos.z - world.player.pos.z);
        }
      }""",
    """        if (foe) {
          world.player.facing = Math.atan2(foe.pos.x - world.player.pos.x, foe.pos.z - world.player.pos.z);
          onSoftAim?.(picked);
        }
      }""")

# Craven Thrust: the real donor checks target.facing EVEN WHILE stealth is
# active. An unaware mob can rotate while Rogue sneaks in, making the opener
# borderline unusable solo. Allow ONLY this ability, ONLY if currently stealth,
# ONLY against a mob NOT focusing/aggroing the rogue. Once detected/in combat,
# continue requiring the actual rear 180-degree hemisphere and equipped dagger.
helper=Path("src/sim/combat/highfly_v91_rogue_opener.ts")
if helper.exists():raise SystemExit("V91_ROGUE_HELPER_ALREADY_EXISTS")
helper.write_text("""import type { Entity } from '../types';

/** Only the stealth entry attack against an unaware mob waives its rear check.
 * Still requires the ORIGINAL dagger, melee distance, energy, GCD and Sim hit.
 * This does not change Ambush, other behind attacks, or combat backstabs. */
export function highflyV91UnawareStealthBackstab(
  abilityId: string, player: Entity, target: Entity,
): boolean {
  return abilityId === 'backstab' &&
    target.kind === 'mob' &&
    !target.dead &&
    player.auras.some((a) => a.kind === 'stealth') &&
    target.aggroTargetId !== player.id &&
    target.targetId !== player.id;
}
""",encoding="utf-8")
cast="src/sim/combat/casting_lifecycle.ts"
cast_path=Path(cast)
cast_source=cast_path.read_text(encoding="utf-8")
if "highfly_v91_rogue_opener" in cast_source:
    raise SystemExit("V91_ROGUE_IMPORT_ALREADY_PRESENT")
cast_path.write_text("import { highflyV91UnawareStealthBackstab } from './highfly_v91_rogue_opener';\\n".replace('\\n','\n') + cast_source, encoding="utf-8")
once(cast,
    """        // Shadow-wreathed (or about to detonate a full Gloam bank), the""",
    """        // V9.1 Rogue: opening from genuine stealth against an UNAWARE mob
        // is a valid sneak attack even if its idle heading shifts as we move.
        // Every normal combat Backstab still uses the native behind check.
        if (highflyV91UnawareStealthBackstab(ability.id, p, target)) continue;
        // Shadow-wreathed (or about to detonate a full Gloam bank), the""")
classes="src/sim/content/classes.ts"
once(classes,
    "Must be behind the target. Requires a dagger. Awards 1 combo point.",
    "Must be behind the target, or in stealth against an unaware creature. Requires a dagger. Awards 1 combo point.")

# Touch: visual feedback on pointer DOWN with no transform (keeps HUD editor
# translations and the moving joystick intact). Release resets immediately.
runtime="src/highfly/game_c1_runtime.ts"
with Path(runtime).open("a",encoding="utf-8") as f:
    f.write("""
/* HIGHFLY V9.1 — attack-button response without movement/position transforms. */
(() => {
  let attackPointer: number | null = null;
  document.addEventListener('pointerdown', (event) => {
    const el = (event.target as Element | null)?.closest?.('#mobile-action-attack');
    if (!el || !(el instanceof HTMLElement)) return;
    attackPointer = event.pointerId;
    el.dataset.hfV91Pressed = '1';
  }, {capture: true});
  const clear = (event: PointerEvent) => {
    if (event.pointerId !== attackPointer) return;
    attackPointer = null;
    document.getElementById('mobile-action-attack')?.removeAttribute('data-hf-v91-pressed');
  };
  document.addEventListener('pointerup', clear, {capture: true});
  document.addEventListener('pointercancel', clear, {capture: true});
})();
""")
with Path("src/styles/shell.css").open("a",encoding="utf-8") as f:
    f.write("""
/* V9.1 visual tap response, no translate/scale animation and no HUD drift. */
body.mobile-touch #mobile-action-attack[data-hf-v91-pressed="1"] {
  filter: brightness(1.28) !important;
  box-shadow: 0 0 0 3px rgba(150,215,255,.42), 0 0 20px rgba(109,172,255,.5) !important;
}
body.mobile-touch #mobile-action-attack { transition: filter .075s linear, box-shadow .075s linear !important; }
""")

# 200ms one-hit buffer: soft button presses just before the real 1-2-3
# recovery will queue ONCE and resolve against the current closest hostile.
# No auto-attack mode, no repeating held key, no free combo/attack count.
hud="src/ui/hud.ts"
once(hud,
    """  private highflyAcceptedBasicAttacks = 0;""",
    """  private highflyAcceptedBasicAttacks = 0;
  private highflyV91QueuedAttack: ReturnType<typeof setTimeout> | null = null;""")
regex_once(hud,
    r"    if \(now < this\.highflyComboReadyAt\) return;",
    """    if (now < this.highflyComboReadyAt) {
      const wait = this.highflyComboReadyAt - now;
      if (this.isMobileLayout() && wait <= 0.20 && this.highflyV91QueuedAttack === null) {
        this.highflyV91QueuedAttack = setTimeout(() => {
          this.highflyV91QueuedAttack = null;
          if (document.body.classList.contains('mobile-window-open') ||
              document.body.classList.contains('mobile-more-open') ||
              this.sim.player.dead) return;
          this.onMobileAttackNearest?.();
          this.activateFixedAttackSlot();
        }, Math.ceil(wait * 1000) + 8);
      }
      return;
    }
    if (this.highflyV91QueuedAttack !== null) {
      clearTimeout(this.highflyV91QueuedAttack);
      this.highflyV91QueuedAttack = null;
    }""")

# Fail closed + invariants on the candidate, never the release.
assert "deps.attackNearest?.();" in Path(ring).read_text()
assert "basicReach" in Path(main).read_text()
assert "onSoftAim: highflyV91AimAt" in Path(main).read_text()
assert "highflyV91UnawareStealthBackstab(ability.id, p, target)" in Path(cast).read_text()
assert "highflyV91QueuedAttack" in Path(hud).read_text()
print("HF_V91_NINE_CLASS_360_AIM_SKILL_ROGUE_STEALTH_COMBO_TOUCH_APPLIED=1")
