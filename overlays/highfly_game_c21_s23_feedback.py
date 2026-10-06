from pathlib import Path

def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")

# ---------------------------------------------------------------------------
# C2.1 A — MOBILE-LEGENDS-LIKE SOFT AIM
# Camera-forward hard cone. Soft intent reacquires every hostile attack/skill;
# TARGET is the explicit manual-lock exception.
# ---------------------------------------------------------------------------
auto_target = Path("src/game/auto_target.ts")
replace_once(
    auto_target,
    """export function bestSoftAutoTarget(
  entities: Iterable<AutoTargetEntity>,
  origin: { x: number; z: number },
  facing: number,
  isAttackable: (e: AutoTargetEntity) => boolean,
  range = AUTO_TARGET_RANGE,
): number | null {
  let best: number | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  const fx = Math.sin(facing);
  const fz = Math.cos(facing);
  for (const e of entities) {
    if (!isAttackable(e)) continue;
    const dx = e.pos.x - origin.x;
    const dz = e.pos.z - origin.z;
    const distance = Math.hypot(dx, dz);
    if (distance <= 0.0001 || distance > range) continue;
    const forwardDot = (dx * fx + dz * fz) / distance;
    const directionPenalty =
      forwardDot >= 0 ? (1 - forwardDot) * 6 : 14 + Math.abs(forwardDot) * 8;
    const score = distance + directionPenalty;
    if (score < bestScore) {
      best = e.id;
      bestScore = score;
    }
  }
  return best;
}""",
    """export function bestSoftAutoTarget(
  entities: Iterable<AutoTargetEntity>,
  origin: { x: number; z: number },
  facing: number,
  isAttackable: (e: AutoTargetEntity) => boolean,
  range = AUTO_TARGET_RANGE,
): number | null {
  let best: number | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  const fx = Math.sin(facing);
  const fz = Math.cos(facing);
  // ±70° from camera forward. Soft aim never reaches behind the player.
  const coneDot = Math.cos((70 * Math.PI) / 180);
  for (const e of entities) {
    if (!isAttackable(e)) continue;
    const dx = e.pos.x - origin.x;
    const dz = e.pos.z - origin.z;
    const distance = Math.hypot(dx, dz);
    if (distance <= 0.0001 || distance > range) continue;
    const forwardDot = (dx * fx + dz * fz) / distance;
    if (forwardDot < coneDot) continue;

    // Reticle/camera alignment dominates; distance only breaks close calls.
    const angularPenalty = (1 - forwardDot) * 24;
    const score = angularPenalty + distance * 0.15;
    if (score < bestScore) {
      best = e.id;
      bestScore = score;
    }
  }
  return best;
}""",
    "C2.1 camera-forward hard cone",
)

pad = Path("src/game/pad_target_pick.ts")
replace_once(
    pad,
    """  /** HIGHFLY: camera-forward is the screen-facing signal on free-camera mobile. */
  softTargetFacing?: () => number;
}""",
    """  /** HIGHFLY: camera-forward is the screen-facing signal on free-camera mobile. */
  softTargetFacing?: () => number;
  /** True only for the explicit TARGET/LOCK selection, never ordinary soft aim. */
  softTargetLocked?: () => boolean;
}""",
    "C2.1 manual lock dependency",
)
replace_once(
    pad,
    "  const { world, interactKey, softTargetFacing } = deps;",
    "  const { world, interactKey, softTargetFacing, softTargetLocked } = deps;",
    "C2.1 lock wiring",
)
replace_once(
    pad,
    "      if (!shouldAutoTarget(ability, !!targeted && attackable(targeted), allyHeld)) return;",
    """      const currentHostile = !!targeted && attackable(targeted);
      const preserveManualHostile = (softTargetLocked?.() ?? false) && currentHostile;
      if (!shouldAutoTarget(ability, preserveManualHostile, allyHeld)) return;""",
    "C2.1 reacquire soft skill target",
)

hotbar = Path("src/ui/hud/action_bar/hotbar.ts")
replace_once(
    hotbar,
    """  if (!state.hasLiveHostileTarget && actions.attackNearest) {
    actions.attackNearest();
  }
  actions.activateAttack();""",
    """  // HIGHFLY C2.1: every basic-attack intent refreshes SOFT aim. The callback
  // itself preserves an explicit TARGET/LOCK, so manual targeting is never stolen.
  actions.attackNearest?.();
  actions.activateAttack();""",
    "C2.1 attack intent reacquire",
)

main = Path("src/main.ts")
replace_once(
    main,
    "    onCycleTarget: () => world.tabTarget(),",
    "    onCycleTarget: () => highflyManualCycleTarget(),",
    "C2.1 TARGET button manual lock",
)
replace_once(
    main,
    """  const padTargetPick = createPadTargetPick({
    world,
    interactKey,
    softTargetFacing: () => input.camYaw,
  });""",
    """  let highflyManualTargetId: number | null = null;

  function highflyManualTargetLocked(): boolean {
    const id = highflyManualTargetId;
    if (id === null || world.player.targetId !== id) return false;
    const target = world.entities.get(id);
    return !!target && !target.dead;
  }

  function highflyManualCycleTarget(): void {
    world.tabTarget();
    highflyManualTargetId = world.player.targetId ?? null;
  }

  const padTargetPick = createPadTargetPick({
    world,
    interactKey,
    softTargetFacing: () => input.camYaw,
    softTargetLocked: () => highflyManualTargetLocked(),
  });""",
    "C2.1 main manual target state",
)
replace_once(
    main,
    """  function attackNearest(): void {
    const p = world.player;
    const activePvpOpponents = activePvpOpponentIds(world);
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
    );
    if (best === null) {
      hud.showError(t('errors.noEnemyNearby'));
      return;
    }
    world.targetEntity(best);
  }""",
    """  function attackNearest(): void {
    const p = world.player;
    const activePvpOpponents = activePvpOpponentIds(world);

    // TARGET/LOCK is the explicit exception to camera-forward soft aim.
    const locked = highflyManualTargetLocked();
    const lockedEntity =
      locked && p.targetId !== null ? world.entities.get(p.targetId) : undefined;
    if (
      lockedEntity &&
      isAttackableEntity(lockedEntity, world.playerId, activePvpOpponents)
    ) {
      return;
    }

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
    );
    highflyManualTargetId = null;
    if (best === null) {
      // A stale soft target outside the camera cone must not keep stealing attacks.
      if (p.targetId !== null) world.targetEntity(null);
      return;
    }
    if (p.targetId !== best) world.targetEntity(best);
  }""",
    "C2.1 soft attack selection",
)

# ---------------------------------------------------------------------------
# C2.1 B — COMBO TIMING WITH ONE EVADE GRACE
# No mash/autoplay: cadence gates remain. One legitimate evade may extend the
# current chain once; inactivity still expires the chain.
# ---------------------------------------------------------------------------
hud = Path("src/ui/hud.ts")
replace_once(
    hud,
    "  private highflyAcceptedBasicAttacks = 0;",
    """  private highflyAcceptedBasicAttacks = 0;
  private highflyComboEvadeGraceUsed = false;""",
    "C2.1 evade combo state",
)

final_combo = """  private activateFixedAttackSlot(): void {
    const now = performance.now() / 1000;
    if (now < this.highflyComboReadyAt) return;
    if (now > this.highflyComboExpiresAt) this.highflyComboStep = 0;
    const elemental = this.onHighflyElementalFinisherReady?.() ?? false;
    const next: 1 | 2 | 3 | 4 =
      this.highflyComboStep === 3 && elemental
        ? 4
        : (((this.highflyComboStep % 3) + 1) as 1 | 2 | 3);

    if (this.onHighflyBasicAttack?.(next)) {
      if (next === 4) this.highflyComboStep = 0;
      else if (next === 3) this.highflyComboStep = elemental ? 3 : 0;
      else this.highflyComboStep = next;
      this.highflyComboExpiresAt = now + 0.95;
      this.highflyComboReadyAt =
        now + (next === 1 ? 0.30 : next === 2 ? 0.34 : next === 3 ? (elemental ? 0.38 : 0.62) : 0.72);
      this.highflyAcceptedBasicAttacks += 1;
      document.body.dataset.highflyBasicAttackCount = String(this.highflyAcceptedBasicAttacks);
      document.body.dataset.highflyBasicAttackStep = String(next);
      this.flashActionSlot(0);
    }
  }"""
combo_v2 = """  extendHighflyComboForEvade(): void {
    const now = performance.now() / 1000;
    if (this.highflyComboStep === 0) return;
    if (now > this.highflyComboExpiresAt) {
      this.highflyComboStep = 0;
      this.highflyComboEvadeGraceUsed = false;
      return;
    }
    if (this.highflyComboEvadeGraceUsed) return;

    // One dodge bridge per chain. It buys enough time to react to an enemy
    // attack, but cannot be repeated to keep a combo alive forever.
    this.highflyComboExpiresAt = Math.min(
      this.highflyComboExpiresAt + 0.65,
      now + 1.55,
    );
    this.highflyComboEvadeGraceUsed = true;
  }

  private activateFixedAttackSlot(): void {
    const now = performance.now() / 1000;
    if (now < this.highflyComboReadyAt) return;
    if (now > this.highflyComboExpiresAt) {
      this.highflyComboStep = 0;
      this.highflyComboEvadeGraceUsed = false;
    }

    const elemental = this.onHighflyElementalFinisherReady?.() ?? false;
    const next: 1 | 2 | 3 | 4 =
      this.highflyComboStep === 3 && elemental
        ? 4
        : (((this.highflyComboStep % 3) + 1) as 1 | 2 | 3);

    if (this.onHighflyBasicAttack?.(next)) {
      const startsChain = this.highflyComboStep === 0;
      if (startsChain) this.highflyComboEvadeGraceUsed = false;

      const finishesChain = next === 4 || (next === 3 && !elemental);
      if (finishesChain) {
        this.highflyComboStep = 0;
        this.highflyComboExpiresAt = 0;
        this.highflyComboEvadeGraceUsed = false;
      } else {
        this.highflyComboStep = next;
        // Bounded human timing window: enough for aim/reposition, not mash spam.
        this.highflyComboExpiresAt = now + 1.15;
      }

      this.highflyComboReadyAt =
        now + (next === 1 ? 0.30 : next === 2 ? 0.34 : next === 3 ? (elemental ? 0.38 : 0.62) : 0.72);
      this.highflyAcceptedBasicAttacks += 1;
      document.body.dataset.highflyBasicAttackCount = String(this.highflyAcceptedBasicAttacks);
      document.body.dataset.highflyBasicAttackStep = String(next);
      this.flashActionSlot(0);
    }
  }"""
replace_once(hud, final_combo, combo_v2, "C2.1 evade-aware combo")

replace_once(
    main,
    "    onEvade: () => input.triggerHighflyEvade(),",
    """    onEvade: () => {
      input.triggerHighflyEvade();
      hud.extendHighflyComboForEvade();
    },""",
    "C2.1 evade combo bridge",
)

print("HIGHFLY_GAME_C21_S23_FEEDBACK_APPLIED=1")
