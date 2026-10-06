from pathlib import Path

def replace_all_if_present(path: Path, old: str, new: str) -> int:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count:
        path.write_text(text.replace(old, new), encoding="utf-8")
    return count

ui = Path("src/highfly/training/ui.ts")
main = Path("src/main.ts")
runtime = Path("src/highfly/game_c1_runtime.ts")
css = Path("src/styles/hf_game_c1.css")

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

runtime_text = runtime.read_text(encoding="utf-8")
if "C2.2_VIDEO_QA" not in runtime_text or "ensureHighflyHudAuthority" not in runtime_text:
    raise SystemExit("C2.2 sticky HUD authority missing")

css_text = css.read_text(encoding="utf-8")
for contract in (
    "body.mobile-touch #mobile-interact",
    "body.mobile-touch #mobile-action-page-toggle",
    "body.mobile-touch.mobile-more-open #mobile-controls",
    "body.mobile-touch.mobile-window-open #mobile-controls",
):
    if contract not in css_text:
        raise SystemExit(f"C2.2 HUD contract missing: {contract}")

print("HIGHFLY_GAME_C22_VIDEO_QA_APPLIED=1")
