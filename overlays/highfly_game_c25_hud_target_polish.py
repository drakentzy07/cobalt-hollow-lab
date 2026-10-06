from pathlib import Path

def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")

auto_target = Path("src/game/auto_target.ts")

replace_once(
    auto_target,
    """export interface AutoTargetEntity {
  id: number;
  pos: { x: number; z: number };
}""",
    """export interface AutoTargetEntity {
  id: number;
  pos: { x: number; z: number };
  hp?: number;
  maxHp?: number;
}""",
    "C2.5 soft target hp shape",
)

replace_once(
    auto_target,
    """export function bestSoftAutoTarget(
  entities: Iterable<AutoTargetEntity>,
  origin: { x: number; z: number },
  facing: number,
  isAttackable: (e: AutoTargetEntity) => boolean,
  range = AUTO_TARGET_RANGE,
): number | null {
  let priorityBest: number | null = null;
  let priorityScore = Number.POSITIVE_INFINITY;
  let fallbackBest: number | null = null;
  let fallbackScore = Number.POSITIVE_INFINITY;
  const fx = Math.sin(facing);
  const fz = Math.cos(facing);

  // C2.4: "the enemy in front of me" is a hard intent tier, not merely a
  // tiny distance bonus. Inside 12 yd and ±32°, close/frontal wins before
  // any farther perfectly-centred target is considered.
  const priorityRange = Math.min(range, 12);
  const priorityConeDot = Math.cos((32 * Math.PI) / 180);
  const coneDot = Math.cos((42 * Math.PI) / 180);

  for (const e of entities) {
    if (!isAttackable(e)) continue;
    const dx = e.pos.x - origin.x;
    const dz = e.pos.z - origin.z;
    const distance = Math.hypot(dx, dz);
    if (distance <= 0.0001 || distance > range) continue;
    const forwardDot = (dx * fx + dz * fz) / distance;
    if (forwardDot < coneDot) continue;

    if (distance <= priorityRange && forwardDot >= priorityConeDot) {
      const score = distance * 0.55 + (1 - forwardDot) * 18;
      if (score < priorityScore) {
        priorityBest = e.id;
        priorityScore = score;
      }
    }

    // Outside the hard close/front tier, retain camera-forward soft aim.
    const score = (1 - forwardDot) * 40 + distance * 0.08;
    if (score < fallbackScore) {
      fallbackBest = e.id;
      fallbackScore = score;
    }
  }
  return priorityBest ?? fallbackBest;
}""",
    """function highflyFinisherBias(e: AutoTargetEntity): number {
  if (!Number.isFinite(e.hp) || !Number.isFinite(e.maxHp) || (e.maxHp ?? 0) <= 0) {
    return 0;
  }
  const ratio = Math.max(0, Math.min(1, (e.hp ?? 0) / (e.maxHp ?? 1)));
  // Max 0.45 score points: enough to break a close geometric tie, never enough
  // to pull the Hunter away from the close/front intent tier.
  return (1 - ratio) * 0.45;
}

export function bestSoftAutoTarget(
  entities: Iterable<AutoTargetEntity>,
  origin: { x: number; z: number },
  facing: number,
  isAttackable: (e: AutoTargetEntity) => boolean,
  range = AUTO_TARGET_RANGE,
): number | null {
  let priorityBest: number | null = null;
  let priorityScore = Number.POSITIVE_INFINITY;
  let fallbackBest: number | null = null;
  let fallbackScore = Number.POSITIVE_INFINITY;
  const fx = Math.sin(facing);
  const fz = Math.cos(facing);

  // C2.5 keeps C2.4 intent sacred: close + frontal is the hard first tier.
  // HP only nudges ties inside a tier; it never outranks player direction.
  const priorityRange = Math.min(range, 12);
  const priorityConeDot = Math.cos((32 * Math.PI) / 180);
  const coneDot = Math.cos((42 * Math.PI) / 180);

  for (const e of entities) {
    if (!isAttackable(e)) continue;
    const dx = e.pos.x - origin.x;
    const dz = e.pos.z - origin.z;
    const distance = Math.hypot(dx, dz);
    if (distance <= 0.0001 || distance > range) continue;
    const forwardDot = (dx * fx + dz * fz) / distance;
    if (forwardDot < coneDot) continue;
    const finisherBias = highflyFinisherBias(e);

    if (distance <= priorityRange && forwardDot >= priorityConeDot) {
      const score = distance * 0.55 + (1 - forwardDot) * 18 - finisherBias;
      if (score < priorityScore) {
        priorityBest = e.id;
        priorityScore = score;
      }
    }

    const score = (1 - forwardDot) * 40 + distance * 0.08 - finisherBias;
    if (score < fallbackScore) {
      fallbackBest = e.id;
      fallbackScore = score;
    }
  }
  return priorityBest ?? fallbackBest;
}""",
    "C2.5 soft target finisher bias",
)

print("HIGHFLY_GAME_C25_HUD_TARGET_POLISH_APPLIED=1")
