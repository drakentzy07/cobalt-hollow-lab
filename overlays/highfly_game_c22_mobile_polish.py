from pathlib import Path

def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")

# ---------------------------------------------------------------------------
# C2.2 A — tighter camera intent + soft-target hysteresis
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
  // C2.2: the camera centre is the primary intent signal. ±42° keeps soft aim
  // helpful without allowing an off-axis nearby mob to steal the attack.
  const coneDot = Math.cos((42 * Math.PI) / 180);
  for (const e of entities) {
    if (!isAttackable(e)) continue;
    const dx = e.pos.x - origin.x;
    const dz = e.pos.z - origin.z;
    const distance = Math.hypot(dx, dz);
    if (distance <= 0.0001 || distance > range) continue;
    const forwardDot = (dx * fx + dz * fz) / distance;
    if (forwardDot < coneDot) continue;

    // Alignment dominates strongly; distance is only a tie breaker.
    const angularPenalty = (1 - forwardDot) * 40;
    const score = angularPenalty + distance * 0.08;
    if (score < bestScore) {
      best = e.id;
      bestScore = score;
    }
  }
  return best;
}""",
    "C2.2 tight camera-forward cone",
)

main = Path("src/main.ts")
replace_once(
    main,
    """  function highflyManualCycleTarget(): void {
    world.tabTarget();
    highflyManualTargetId = world.player.targetId ?? null;
  }

  const padTargetPick = createPadTargetPick({""",
    """  function highflyManualCycleTarget(): void {
    world.tabTarget();
    highflyManualTargetId = world.player.targetId ?? null;
  }

  function highflySoftTargetStillAligned(id: number | null, coneDegrees = 30): boolean {
    if (id === null) return false;
    const target = world.entities.get(id);
    if (!target || target.dead) return false;
    const p = world.player;
    const dx = target.pos.x - p.pos.x;
    const dz = target.pos.z - p.pos.z;
    const distance = Math.hypot(dx, dz);
    if (distance <= 0.0001 || distance > 40) return false;
    const fx = Math.sin(input.camYaw);
    const fz = Math.cos(input.camYaw);
    const dot = (dx * fx + dz * fz) / distance;
    return dot >= Math.cos((coneDegrees * Math.PI) / 180);
  }

  const padTargetPick = createPadTargetPick({""",
    "C2.2 soft-target hysteresis helper",
)

replace_once(
    main,
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

    // Hysteresis: keep an existing SOFT target while it stays close to camera
    // centre. Small camera/movement jitter must not make the red ring jump.
    if (p.targetId !== null) {
      const current = world.entities.get(p.targetId);
      if (
        current &&
        isAttackableEntity(current, world.playerId, activePvpOpponents) &&
        highflySoftTargetStillAligned(p.targetId)
      ) {
        return;
      }
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
      // Targetless ATK is intentionally silent: no giant red error banner.
      if (p.targetId !== null) world.targetEntity(null);
      return;
    }
    if (p.targetId !== best) world.targetEntity(best);
  }""",
    "C2.2 stable soft attack selection",
)

# ---------------------------------------------------------------------------
# C2.2 B — mobile nameplate declutter
# ---------------------------------------------------------------------------
painter = Path("src/render/nameplate_painter.ts")
replace_once(
    painter,
    """    const showPlayerNameplates = this.showPlayerNameplates();
    // Drop the quest-marker snapshot at every full pass""",
    """    const showPlayerNameplates = this.showPlayerNameplates();
    const highflyCompactMobile = width <= 960 && height <= 540;
    // Drop the quest-marker snapshot at every full pass""",
    "C2.2 compact mobile nameplate mode",
)

replace_once(
    painter,
    """      const standIn = entityHasNoBody(
        view.compilePending,
        !!view.visual,
        anyCharacterRigDrawing(view),
      );
      // The Toggle Friendly Nameplates keybind""",
    """      const standIn = entityHasNoBody(
        view.compilePending,
        !!view.visual,
        anyCharacterRigDrawing(view),
      );

      // HIGHFLY C2.2 mobile declutter: the selected target always wins. Other
      // plates fade by world distance and total visible count so combat remains
      // readable on a 390px-high phone viewport.
      if (highflyCompactMobile && !standIn && id !== player.targetId) {
        const pdx = entity.pos.x - player.pos.x;
        const pdz = entity.pos.z - player.pos.z;
        const pd2 = pdx * pdx + pdz * pdz;
        const maxDistance =
          entity.kind === 'mob' ? 18 : entity.kind === 'player' ? 22 : 20;
        if (pd2 > maxDistance * maxDistance || this.anchorCount >= 10) continue;
      }

      // The Toggle Friendly Nameplates keybind""",
    "C2.2 mobile plate distance/cap",
)

print("HIGHFLY_GAME_C22_MOBILE_POLISH_APPLIED=1")
