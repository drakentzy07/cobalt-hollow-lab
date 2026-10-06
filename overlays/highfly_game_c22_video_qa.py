from pathlib import Path

def replace_all_if_present(path: Path, old: str, new: str) -> int:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count:
        path.write_text(text.replace(old, new), encoding="utf-8")
    return count

def replace_required(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    path.write_text(text.replace(old, new), encoding="utf-8")

ui = Path("src/highfly/training/ui.ts")
main = Path("src/main.ts")
runtime = Path("src/highfly/game_c1_runtime.ts")
css = Path("src/styles/hf_game_c1.css")
auto_target = Path("src/game/auto_target.ts")
nameplate = Path("src/render/nameplate_painter.ts")

# Final C2.2 authority pass: historical overlays are allowed to evolve internal
# implementation, but the player-facing contract must never regress to Core=0
# or Training-only wording.
replace_all_if_present(
    ui,
    "<h4>HUNTER CORE · ESTADO CONSOLIDADO</h4>",
    "<h4>HUNTER CORE · PERMANENTE</h4>",
)
for stale in (
    "El Core nace del DESPERTAR de clase y después sólo aumenta mediante entrenamiento real.",
    "El Core nace del DESPERTAR de clase y progresa con NIVEL + TRAINING",
):
    replace_all_if_present(
        ui,
        stale,
        "BASE DE CLASE + NIVEL + TRAINING · sólo TRAINING se asigna libremente",
    )

ui_text = ui.read_text(encoding="utf-8")
if "HUNTER CORE · PERMANENTE" not in ui_text:
    raise SystemExit("C2.2 final Training heading missing")
if "BASE DE CLASE + NIVEL + TRAINING" not in ui_text:
    raise SystemExit("C2.2 final permanent-Core copy missing")
for forbidden in (
    "HUNTER CORE · ESTADO CONSOLIDADO",
    "después sólo aumenta mediante entrenamiento real",
):
    if forbidden in ui_text:
        raise SystemExit(f"C2.2 stale Training copy survived: {forbidden}")

main_text = main.read_text(encoding="utf-8")
for forbidden in (
    "HUNTER CORE · 0 / 0 / 0 / 0 / 0",
    "se activan únicamente mediante entrenamiento real",
):
    if forbidden in main_text:
        raise SystemExit(f"C2.2 stale creator zero-Core copy survived: {forbidden}")



# ---------------------------------------------------------------------------
# C2.2 VIDEO QA — tighter mobile soft aim + hysteresis.
# Acquisition is intentionally narrower than C2.1 (45° vs 70°). A current
# soft target gets a slightly wider 55° hold band so small camera corrections
# do not make the target jump frame-to-frame; a clearly better centered target
# still wins.
# ---------------------------------------------------------------------------
replace_required(
    auto_target,
    "const coneDot = Math.cos((70 * Math.PI) / 180);",
    "const coneDot = Math.cos((45 * Math.PI) / 180);",
    "C2.2 45-degree soft aim cone",
)
replace_required(
    auto_target,
    """    const angularPenalty = (1 - forwardDot) * 24;
    const score = angularPenalty + distance * 0.15;""",
    """    const angularPenalty = (1 - forwardDot) * 42;
    const score = angularPenalty + distance * 0.10;""",
    "C2.2 reticle-first soft aim score",
)

replace_required(
    main,
    """    highflyManualTargetId = null;
    if (best === null) {
      // A stale soft target outside the camera cone must not keep stealing attacks.
      if (p.targetId !== null) world.targetEntity(null);
      return;
    }
    if (p.targetId !== best) world.targetEntity(best);""",
    """    let resolvedBest = best;
    const currentSoftId = !locked ? p.targetId : null;
    if (currentSoftId !== null && best !== null && currentSoftId !== best) {
      const currentSoft = world.entities.get(currentSoftId);
      const bestEntity = world.entities.get(best);
      if (
        currentSoft &&
        bestEntity &&
        isAttackableEntity(currentSoft, world.playerId, activePvpOpponents) &&
        isAttackableEntity(bestEntity, world.playerId, activePvpOpponents)
      ) {
        const fx = Math.sin(input.camYaw);
        const fz = Math.cos(input.camYaw);
        const cdx = currentSoft.pos.x - p.pos.x;
        const cdz = currentSoft.pos.z - p.pos.z;
        const bdx = bestEntity.pos.x - p.pos.x;
        const bdz = bestEntity.pos.z - p.pos.z;
        const currentDistance = Math.hypot(cdx, cdz);
        const bestDistance = Math.hypot(bdx, bdz);
        const currentDot =
          currentDistance > 0.0001 ? (cdx * fx + cdz * fz) / currentDistance : -1;
        const bestDot =
          bestDistance > 0.0001 ? (bdx * fx + bdz * fz) / bestDistance : -1;
        const holdDot = Math.cos((55 * Math.PI) / 180);

        // Hysteresis: hold the current soft target through small camera drift.
        // A meaningfully better-centered candidate (>= 0.16 dot advantage)
        // switches immediately, so deliberate aim still feels responsive.
        if (
          currentDistance <= 40 &&
          currentDot >= holdDot &&
          bestDot < currentDot + 0.16
        ) {
          resolvedBest = currentSoftId;
        }
      }
    }

    highflyManualTargetId = null;
    if (resolvedBest === null) {
      // A stale soft target outside the camera cone must not keep stealing attacks.
      if (p.targetId !== null) world.targetEntity(null);
      return;
    }
    if (p.targetId !== resolvedBest) world.targetEntity(resolvedBest);""",
    "C2.2 soft-target hysteresis",
)

# ---------------------------------------------------------------------------
# C2.2 VIDEO QA — mobile nameplate declutter.
# Preserve the explicit target, hostile threat and active casts at any normal
# rendered distance. Everything else gets a compact mobile-only visibility band,
# with lootable corpses especially short-lived on screen.
# ---------------------------------------------------------------------------
replace_required(
    nameplate,
    """      if (plan.hidden) continue;

      this.tmpV.copy(view.group.position);""",
    """      if (plan.hidden) continue;

      if (
        typeof document !== 'undefined' &&
        document.body.classList.contains('mobile-touch') &&
        !standIn &&
        entity.id !== player.targetId &&
        !plan.threat &&
        !entity.castingAbility
      ) {
        const mobileDx = entity.pos.x - player.pos.x;
        const mobileDz = entity.pos.z - player.pos.z;
        const mobileD2 = mobileDx * mobileDx + mobileDz * mobileDz;
        const mobileRange =
          entity.dead ? 10 : entity.kind === 'mob' ? 20 : entity.kind === 'player' ? 18 : 22;
        if (mobileD2 > mobileRange * mobileRange) continue;
      }

      this.tmpV.copy(view.group.position);""",
    "C2.2 mobile nameplate declutter",
)

runtime_text = runtime.read_text(encoding="utf-8")
if "C2.2_VIDEO_QA" not in runtime_text or "ensureHighflyHudAuthority" not in runtime_text:
    raise SystemExit("C2.2 sticky HUD authority missing")
if "paintFirstUseCoach" not in runtime_text or "paintCreatorPreviewStatus" not in runtime_text:
    raise SystemExit("C2.2 first-use/preview guidance missing")

css_text = css.read_text(encoding="utf-8")
for contract in (
    "body.mobile-touch #mobile-interact",
    "body.mobile-touch #mobile-action-page-toggle",
    "body.mobile-touch.mobile-more-open #mobile-controls",
    "body.mobile-touch.mobile-window-open #mobile-controls",
    "#hf-c22-first-use-coach",
    "#hf-c22-preview-status",
):
    if contract not in css_text:
        raise SystemExit(f"C2.2 HUD contract missing: {contract}")

print("HIGHFLY_GAME_C22_VIDEO_QA_APPLIED=1")
