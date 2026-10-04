from pathlib import Path
import shutil

def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 match, found {count}")
    path.write_text(text.replace(old, new), encoding="utf-8")

# ---------------------------------------------------------------------------
# HIGHFLY RUN129 — real-session Core authority.
# Copy the audited runtime contracts after all legacy overlays so there is one
# source of truth for scoringVersion, migration and first-session calibration.
# ---------------------------------------------------------------------------
for name in ("core.ts", "profile_store.ts", "pipeline.ts", "session_core.ts"):
    src = Path("../training/runtime") / name
    dst = Path("src/highfly/training") / name
    if not src.is_file():
        raise SystemExit(f"RUN129 missing runtime source: {src}")
    shutil.copy2(src, dst)

for name in (
    "highfly_training_e2e.test.ts",
    "highfly_training_session_core.test.ts",
):
    src = Path("../training/tests") / name
    dst = Path("tests") / name
    if not src.is_file():
        raise SystemExit(f"RUN129 missing test source: {src}")
    shutil.copy2(src, dst)

ui = Path("src/highfly/training/ui.ts")

# No visible or hidden early-rest escape.
replace_once(
    ui,
    '      <button type="button" id="hf-rest-skip">CONTINUAR ANTES DE TIEMPO</button>\n',
    '      <div class="hf-rest-lock">DESCANSO OBLIGATORIO · EL SIGUIENTE SET SE HABILITA AL FINALIZAR</div>\n',
    "remove rest skip control",
)

replace_once(
    ui,
    """  const skipRest = mount.querySelector<HTMLElement>('#hf-rest-skip');
  if (skipRest) {
    bindTouchTap(skipRest, (event) => {
      event.preventDefault();
      finishRest(true);
    });
  }

""",
    "",
    "remove rest skip binding",
)

# While recovery is active the Training plan cannot be switched/reset/closed.
replace_once(
    ui,
    '        data-hf-training-day="${day.day}"\n      >',
    '        data-hf-training-day="${day.day}"\n        ${activeRest ? \'disabled\' : \'\'}\n      >',
    "lock day navigation during rest",
)
replace_once(
    ui,
    '<select id="hf-training-week">${weekOptions()}</select>',
    '<select id="hf-training-week" ${activeRest ? \'disabled\' : \'\'}>${weekOptions()}</select>',
    "lock week navigation during rest",
)
replace_once(
    ui,
    """    bindTouchTap(button, (event) => {
      event.preventDefault();
      resetVisibleSession();
      selectedDay = Number(button.dataset.hfTrainingDay) || 1;
""",
    """    bindTouchTap(button, (event) => {
      event.preventDefault();
      if (activeRest) return;
      resetVisibleSession();
      selectedDay = Number(button.dataset.hfTrainingDay) || 1;
""",
    "day navigation rest guard",
)
replace_once(
    ui,
    """  if (week instanceof HTMLSelectElement) {
    week.addEventListener('change', () => {
      resetVisibleSession();
""",
    """  if (week instanceof HTMLSelectElement) {
    week.addEventListener('change', () => {
      if (activeRest) return;
      resetVisibleSession();
""",
    "week navigation rest guard",
)

# Foundation-close overlay allows partial-day closure; recovery still must finish.
replace_once(
    ui,
    "${sessionDone || !selectedSessionTrainable() ? 'disabled' : ''}",
    "${sessionDone || activeRest || !selectedSessionTrainable() ? 'disabled' : ''}",
    "register disabled during rest",
)
replace_once(
    ui,
    "      if (selectedSessionTrainable()) registerSession();",
    "      if (!activeRest && selectedSessionTrainable()) registerSession();",
    "register binding rest guard",
)
replace_once(
    ui,
    """    sessionAlreadyRegistered() ||
    !selectedSessionTrainable()
  ) return;""",
    """    sessionAlreadyRegistered() ||
    activeRest ||
    !selectedSessionTrainable()
  ) return;""",
    "register function rest guard",
)

# Keep CI fast without exposing a user control. Production always uses the full
# authored rest duration. navigator.webdriver is true only in automation.
replace_once(
    ui,
    "    targetSec: exercise.restSec,",
    "    targetSec: navigator.webdriver ? 0.5 : exercise.restSec,",
    "webdriver-only rest compression",
)

# Copy and badge text now describe the real model instead of the old fixed-10 base.
replace_once(
    ui,
    "${state.calibrated ? 'BASE ESTABLECIDA' : 'EN CALIBRACIÓN'}",
    "${profile.awakening.initialized ? (state.calibrated ? 'CORE + TRAINING' : 'DESPERTAR ACTIVO') : 'SIN DESPERTAR'}",
    "Awakening Core badge",
)
replace_once(
    ui,
    "<span>Progreso <b>${state.progress.toFixed(1)} / ${progressCostForCurrent(state.current).toFixed(1)}</b></span>",
    "<span>Adaptación <b>${state.progress.toFixed(1)} / ${progressCostForCurrent(state.current).toFixed(1)}</b></span>",
    "adaptation label",
)
replace_once(
    ui,
    "Sexo, edad y peso corporal sólo sirven para detectar valores extraordinarios; no regalan ni quitan Core Stats.",
    "Sexo y edad sólo sirven para detectar valores extraordinarios. El peso corporal normaliza la fuerza relativa; ninguno otorga Core Stats por sí solo.",
    "RM explanatory copy",
)
replace_once(
    ui,
    "Los valores 10.0 son la base calibrada; el resultado de sesión se muestra por separado.",
    "El Core nace del DESPERTAR de clase y después sólo aumenta mediante entrenamiento real",
    "Core section copy",
)

# Cycle reset cannot be used as a recovery escape.
replace_once(
    ui,
    '<button type="button" id="hf-cycle-reset-arm" class="hf-secondary-action">REINICIAR CICLO</button>',
    '<button type="button" id="hf-cycle-reset-arm" class="hf-secondary-action" ${activeRest ? \'disabled\' : \'\'}>REINICIAR CICLO</button>',
    "cycle reset rest lock",
)

# Closing the Training window must never cancel recovery and become a hidden skip.
replace_once(
    ui,
    """  const close = document.querySelector<HTMLElement>('#highfly-training-close');
  if (close) {
    bindTouchTap(close, (event) => {
      event.preventDefault();
      cancelActiveRest();
      document.querySelector('#highfly-training-window')?.setAttribute('hidden', '');
    });
  }
""",
    """  const close = document.querySelector<HTMLElement>('#highfly-training-close');
  if (close) {
    bindTouchTap(close, (event) => {
      event.preventDefault();
      if (activeRest) {
        paintRestDock();
        return;
      }
      document.querySelector('#highfly-training-window')?.setAttribute('hidden', '');
    });
  }
""",
    "close cannot bypass mandatory rest",
)

# ---------------------------------------------------------------------------
# Premium centered recovery + responsive Training polish.
# ---------------------------------------------------------------------------
css = Path("src/styles/shell.css")
css_text = css.read_text(encoding="utf-8")
marker = "/* HIGHFLY RUN129 — premium mandatory recovery */"
if marker not in css_text:
    css_text += r"""

/* HIGHFLY RUN129 — premium mandatory recovery */
#highfly-training-window .highfly-training-shell,
#highfly-training-window .highfly-training-shell * {
  min-width: 0;
  box-sizing: border-box;
}
#highfly-training-window .highfly-training-shell {
  overflow-x: hidden;
  overflow-y: auto;
  padding-inline: clamp(14px, 2.2vw, 32px);
}
#highfly-training-window .hf-system-line,
#highfly-training-window .hf-rm-card__head,
#highfly-training-window .hf-section-title {
  flex-wrap: wrap;
  gap: 8px 14px;
}
#highfly-training-window .hf-calibration-body p,
#highfly-training-window .hf-rm-rule,
#highfly-training-window .hf-training-actions small,
#highfly-training-window .hf-exercise small {
  overflow-wrap: anywhere;
  line-height: 1.45;
}
#highfly-training-window .hf-athlete-calibration input,
#highfly-training-window .hf-athlete-calibration select,
#highfly-training-window .hf-rm-inputs input,
#highfly-training-window .hf-rm-inputs select {
  width: 100%;
  min-height: 44px;
  border: 1px solid rgba(87, 200, 244, .32);
  border-radius: 8px;
  background: rgba(5, 18, 31, .96);
  color: #f3f8fb;
  padding: 9px 11px;
  outline: none;
}
#highfly-training-window .hf-rm-inputs button,
#highfly-training-window .hf-primary-action,
#highfly-training-window .hf-secondary-action {
  border-radius: 8px;
  font-weight: 800;
  letter-spacing: .035em;
}
#highfly-training-window .hf-rest-dock {
  position: fixed !important;
  left: 50% !important;
  right: auto !important;
  bottom: max(18px, env(safe-area-inset-bottom)) !important;
  transform: translateX(-50%) !important;
  width: min(680px, calc(100vw - 28px)) !important;
  display: grid;
  grid-template-columns: 1fr;
  justify-items: center;
  gap: 8px;
  padding: 16px 18px 18px;
  border: 1px solid rgba(91, 213, 255, .55);
  border-radius: 14px;
  background:
    linear-gradient(180deg, rgba(5, 22, 37, .98), rgba(2, 10, 20, .98));
  box-shadow:
    0 18px 48px rgba(0, 0, 0, .55),
    inset 0 0 30px rgba(54, 176, 226, .08);
  text-align: center;
  z-index: 25000;
}
#highfly-training-window .hf-rest-dock[hidden] {
  display: none !important;
}
#highfly-training-window .hf-rest-dock > div:first-child {
  display: grid;
  justify-items: center;
  gap: 4px;
}
#highfly-training-window .hf-rest-dock > div:first-child > span {
  font-size: 11px;
  letter-spacing: .18em;
  opacity: .72;
}
#highfly-training-window .hf-rest-dock > div:first-child > strong {
  font-size: clamp(15px, 2.2vw, 20px);
}
#highfly-training-window .hf-rest-clock {
  font-size: clamp(34px, 7vw, 58px);
  line-height: 1;
  font-weight: 900;
  letter-spacing: .04em;
  font-variant-numeric: tabular-nums;
}
#highfly-training-window .hf-rest-progress {
  width: min(520px, 92%);
  height: 7px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(255,255,255,.10);
}
#highfly-training-window .hf-rest-progress > i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, rgba(79,190,236,.72), rgba(169,231,255,.96));
}
#highfly-training-window .hf-rest-lock {
  margin-top: 2px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .08em;
  opacity: .84;
}
#highfly-training-window button:disabled,
#highfly-training-window select:disabled,
#highfly-training-window input:disabled {
  cursor: not-allowed;
}
@media (max-width: 900px) {
  #highfly-training-window .hf-athlete-calibration,
  #highfly-training-window .hf-rm-inputs {
    grid-template-columns: minmax(0, 1fr);
  }
  #highfly-training-window .hf-rest-dock {
    width: min(94vw, 620px) !important;
    padding: 12px 14px 14px;
  }
}
"""
    css.write_text(css_text, encoding="utf-8")

# Awakening + Training are distinct and decimals stay visible.
replace_once(
    ui,
    '<div class="hf-core-current">${state.current.toFixed(1)}</div>',
    '<div class="hf-core-current">${state.current.toFixed(2)}</div><div class="hf-core-origin">DESPERTAR <b>${state.awakeningBase.toFixed(2)}</b> + TRAINING <b>+${state.trainingGrowth.toFixed(2)}</b></div>',
    "Awakening decimal Core display",
)
replace_once(
    ui,
    '<span>Máximo <b>${state.peak.toFixed(1)}</b></span>',
    '<span>Máximo <b>${state.peak.toFixed(2)}</b></span>',
    "decimal Core peak",
)

# Hard closure sentinels.
final_ui = ui.read_text(encoding="utf-8")
if "hf-rest-skip" in final_ui or "CONTINUAR ANTES DE TIEMPO" in final_ui:
    raise SystemExit("RUN129: rest skip survived")
if "navigator.webdriver ? 0.5 : exercise.restSec" not in final_ui:
    raise SystemExit("RUN129: production rest authority missing")
if "DESPERTAR ACTIVO" not in final_ui or "CORE + TRAINING" not in final_ui:
    raise SystemExit("RUN129: Awakening Core badge missing")
if "Los valores 10.0 son la base calibrada" in final_ui:
    raise SystemExit("RUN129: obsolete fixed-10 copy survived")
if "if (activeRest) {" not in final_ui or "paintRestDock();" not in final_ui:
    raise SystemExit("RUN129: close-window recovery guard missing")
if "run2-awakening-v1" not in Path("src/highfly/training/core.ts").read_text(encoding="utf-8"):
    raise SystemExit("RUN129: Awakening scoring version missing")
print("HIGHFLY_RUN129_REAL_TRAINING_APPLIED=1")
