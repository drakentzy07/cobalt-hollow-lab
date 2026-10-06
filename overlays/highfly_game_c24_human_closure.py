from pathlib import Path

def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")

# ---------------------------------------------------------------------------
# C2.4 A — two-tier soft aim.
# A genuinely close + frontal enemy wins before the wide camera cone is scored.
# Manual TARGET/LOCK stays authoritative in main.ts.
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
    "C2.4 two-tier soft target",
)

# ---------------------------------------------------------------------------
# C2.4 B — the island's native 'Summon' coach is already kind:'use' and knows
# the Briny Lure. On touch, tapping that world bubble opens native Bags.
# No quest/item/summon authority is duplicated here.
# ---------------------------------------------------------------------------
bootcamp = Path("src/ui/bootcamp.ts")
replace_once(
    bootcamp,
    """    prompt.className = 'tut-prompt';
    prompt.setAttribute('aria-hidden', 'true');
    const chips = document.createElement('span');""",
    """    prompt.className = 'tut-prompt';
    prompt.setAttribute('aria-hidden', 'true');
    prompt.addEventListener('click', (event) => {
      if (prompt.dataset.hfAction !== 'bags') return;
      event.preventDefault();
      event.stopPropagation();
      const button =
        document.getElementById('mobile-menu-bags') ??
        document.getElementById('mobile-bags');
      if (button instanceof HTMLElement) button.click();
    });
    const chips = document.createElement('span');""",
    "C2.4 actionable summon prompt",
)

replace_once(
    bootcamp,
    """    const p = world.player;
    const mode = currentInputHintMode();

    // Lane 2's parkour asks own the bubble""",
    """    const p = world.player;
    const mode = currentInputHintMode();
    delete this.prompt.dataset.hfAction;

    // Lane 2's parkour asks own the bubble""",
    "C2.4 clear prompt action",
)

replace_once(
    bootcamp,
    """    const promptVerb =
      padSource && plan.kind === 'use'
        ? tutorialBagControllerVerb(
            bagStep,
            targetBagItem,
            plan.verbKey,
            bagGuidance.blockingWindowCloseLabel,
          )
        : t(plan.verbKey);
    const padControlCaps = padSource""",
    """    const promptVerb =
      padSource && plan.kind === 'use'
        ? tutorialBagControllerVerb(
            bagStep,
            targetBagItem,
            plan.verbKey,
            bagGuidance.blockingWindowCloseLabel,
          )
        : t(plan.verbKey);
    if (mode === 'touch' && plan.kind === 'use') {
      this.prompt.dataset.hfAction = 'bags';
    }
    const padControlCaps = padSource""",
    "C2.4 arm touch use prompt",
)

print("HIGHFLY_GAME_C24_HUMAN_CLOSURE_APPLIED=1")
