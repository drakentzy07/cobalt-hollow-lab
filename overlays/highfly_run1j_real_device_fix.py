from pathlib import Path
import re

def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    path.write_text(text.replace(old, new), encoding="utf-8")

# ---------------------------------------------------------------------------
# REAL DEVICE FIX 01 — Training strict sequence + explicit skip
# ---------------------------------------------------------------------------
ui = Path("src/highfly/training/ui.ts")

replace_once(
    ui,
    """const restRecords = new Map<string, number[]>();
const completedSets = new Map<string, number>();
""",
    """const restRecords = new Map<string, number[]>();
const completedSets = new Map<string, number>();
const skippedExercises = new Set<string>();
""",
    "training skipped state",
)

replace_once(
    ui,
    """function requiredRestCount(exercise: HighflyRoutineExercise): number {
  return Math.max(0, plannedSetCount(exercise) - 1);
}
""",
    """function requiredRestCount(exercise: HighflyRoutineExercise): number {
  return Math.max(0, plannedSetCount(exercise) - 1);
}

function exerciseTerminal(exercise: HighflyRoutineExercise): boolean {
  return (
    skippedExercises.has(exercise.exerciseId) ||
    (completedSets.get(exercise.exerciseId) ?? 0) >= plannedSetCount(exercise)
  );
}

function canActOnExercise(exercise: HighflyRoutineExercise): boolean {
  if (activeRest || exerciseTerminal(exercise)) return false;
  const exercises = activeDayExercises();
  const index = exercises.findIndex(
    (candidate) => candidate.exerciseId === exercise.exerciseId,
  );
  if (index < 0) return false;
  return exercises.slice(0, index).every(exerciseTerminal);
}
""",
    "training strict helpers",
)

replace_once(
    ui,
    """  const firstIncomplete = exercises.findIndex(
    (exercise) => (completedSets.get(exercise.exerciseId) ?? 0) < plannedSetCount(exercise),
  );
""",
    """  const firstIncomplete = exercises.findIndex((exercise) => !exerciseTerminal(exercise));
""",
    "training first incomplete",
)

replace_once(
    ui,
    """      const finished = doneSets >= totalSets;
      const lockedBySequence = firstIncomplete >= 0 && index > firstIncomplete;
      const active = !finished && !lockedBySequence;
""",
    """      const skipped = skippedExercises.has(exercise.exerciseId);
      const finished = doneSets >= totalSets;
      const lockedBySequence = firstIncomplete >= 0 && index > firstIncomplete;
      const active = !finished && !skipped && !lockedBySequence;
""",
    "training row state",
)

replace_once(
    ui,
    """      let actionText = 'BLOQUEADO · COMPLETÁ EL EJERCICIO ANTERIOR';
      if (finished) actionText = 'EJERCICIO COMPLETADO ✓';
      else if (!load.ready) actionText = 'INGRESÁ LA CARGA PARA CONTINUAR';
      else if (resting) actionText = 'RECUPERACIÓN EN CURSO';
      else if (active) actionText = `COMPLETAR SET ${doneSets + 1}/${totalSets}`;
""",
    """      let actionText = 'BLOQUEADO · COMPLETÁ O SALTÁ EL EJERCICIO ANTERIOR';
      if (skipped) actionText = 'EJERCICIO SALTADO';
      else if (finished) actionText = 'EJERCICIO COMPLETADO ✓';
      else if (!load.ready) actionText = 'INGRESÁ LA CARGA PARA CONTINUAR';
      else if (resting) actionText = 'RECUPERACIÓN EN CURSO';
      else if (active) actionText = `COMPLETAR SET ${doneSets + 1}/${totalSets}`;
""",
    "training action text",
)

replace_once(
    ui,
    """        <article class="hf-exercise ${lockedBySequence || !load.ready ? 'is-blocked' : ''} ${finished ? 'is-complete' : ''}" data-exercise-id="${exercise.exerciseId}">
""",
    """        <article class="hf-exercise ${lockedBySequence || !load.ready ? 'is-blocked' : ''} ${finished ? 'is-complete' : ''} ${skipped ? 'is-skipped' : ''}" data-exercise-id="${exercise.exerciseId}">
""",
    "training row classes",
)

replace_once(
    ui,
    """            <span class="hf-intent">${finished ? 'COMPLETO' : active ? 'ACTIVO' : 'BLOQUEADO'}</span>
""",
    """            <span class="hf-intent">${skipped ? 'SALTADO' : finished ? 'COMPLETO' : active ? 'ACTIVO' : 'BLOQUEADO'}</span>
""",
    "training row intent",
)

replace_once(
    ui,
    """          <div class="hf-rest-actions">
            <button
              type="button"
              data-hf-set-complete="${exercise.exerciseId}"
              ${!active || !load.ready || resting ? 'disabled' : ''}
            >
              ${actionText}
            </button>
            <small>
              Los ejercicios se desbloquean en orden. El descanso real se mide entre sets.
            </small>
          </div>
""",
    """          <div class="hf-rest-actions">
            <button
              type="button"
              data-hf-set-complete="${exercise.exerciseId}"
              ${!active || !load.ready || resting ? 'disabled' : ''}
            >
              ${actionText}
            </button>
            <button
              type="button"
              class="hf-skip-exercise"
              data-hf-exercise-skip="${exercise.exerciseId}"
              ${!active || resting ? 'disabled' : ''}
            >
              SALTAR EJERCICIO
            </button>
            <small>
              Completá todos los sets o usá <b>Saltar ejercicio</b> para desbloquear el siguiente.
              El descanso real se mide entre sets.
            </small>
          </div>
""",
    "training explicit skip button",
)

replace_once(
    ui,
    """function allExercisesComplete(): boolean {
  const exercises = activeDayExercises();
  return (
    exercises.length > 0 &&
    exercises.every(
      (exercise) =>
        (completedSets.get(exercise.exerciseId) ?? 0) >= plannedSetCount(exercise),
    )
  );
}
""",
    """function allExercisesComplete(): boolean {
  const exercises = activeDayExercises();
  return exercises.length > 0 && exercises.every(exerciseTerminal);
}
""",
    "training terminal session",
)

replace_once(
    ui,
    """  restRecords.clear();
  completedSets.clear();
  lastResult = null;
""",
    """  restRecords.clear();
  completedSets.clear();
  skippedExercises.clear();
  lastResult = null;
""",
    "training reset skipped",
)

replace_once(
    ui,
    """  mount.querySelectorAll<HTMLElement>('[data-hf-set-complete]').forEach((button) => {
    bindTouchTap(button, (event) => {
      event.preventDefault();
      const exerciseId = button.dataset.hfSetComplete;
      const exercise = activeDayExercises().find(
        (candidate) => candidate.exerciseId === exerciseId,
      );
      if (exercise) completeSet(exercise);
    });
  });

  const skipRest = mount.querySelector<HTMLElement>('#hf-rest-skip');
""",
    """  mount.querySelectorAll<HTMLElement>('[data-hf-set-complete]').forEach((button) => {
    bindTouchTap(button, (event) => {
      event.preventDefault();
      if (button.hasAttribute('disabled')) return;
      const exerciseId = button.dataset.hfSetComplete;
      const exercise = activeDayExercises().find(
        (candidate) => candidate.exerciseId === exerciseId,
      );
      if (exercise && canActOnExercise(exercise)) completeSet(exercise);
    });
  });

  mount.querySelectorAll<HTMLElement>('[data-hf-exercise-skip]').forEach((button) => {
    bindTouchTap(button, (event) => {
      event.preventDefault();
      if (button.hasAttribute('disabled')) return;
      const exerciseId = button.dataset.hfExerciseSkip;
      const exercise = activeDayExercises().find(
        (candidate) => candidate.exerciseId === exerciseId,
      );
      if (exercise && canActOnExercise(exercise)) skipExercise(exercise);
    });
  });

  const skipRest = mount.querySelector<HTMLElement>('#hf-rest-skip');
""",
    "training bind strict controls",
)

replace_once(
    ui,
    """function completeSet(exercise: HighflyRoutineExercise): void {
  if (activeRest) return;
  const total = plannedSetCount(exercise);
""",
    """function completeSet(exercise: HighflyRoutineExercise): void {
  if (!canActOnExercise(exercise)) return;
  const total = plannedSetCount(exercise);
""",
    "training strict complete guard",
)

replace_once(
    ui,
    """function startRest(exercise: HighflyRoutineExercise): void {
""",
    """function skipExercise(exercise: HighflyRoutineExercise): void {
  if (!canActOnExercise(exercise)) return;
  skippedExercises.add(exercise.exerciseId);
  render();
}

function startRest(exercise: HighflyRoutineExercise): void {
""",
    "training skip function",
)

replace_once(
    ui,
    """  const definitions = new Map<string, ExerciseDefinition>();
  const sets: SessionRecord['sets'][number][] = [];
  let plannedSets = 0;
""",
    """  const definitions = new Map<string, ExerciseDefinition>();
  const sets: SessionRecord['sets'][number][] = [];
  let plannedSets = 0;
  let completedSetCount = 0;
  let completedExerciseCount = 0;
""",
    "training session counters",
)

replace_once(
    ui,
    """    plannedSets += prescription.sets;
    for (let index = 0; index < prescription.sets; index++) {
      sets.push({
        setId: `${exercise.exerciseId}-${index + 1}`,
        exerciseId: exercise.exerciseId,
        reps: prescription.reps,
        loadKg: load.systemLoadKg,
        restSec: restForSet(exercise, index),
        intent: exercise.intent,
        quality: 1,
      });
    }
""",
    """    plannedSets += prescription.sets;
    const actualSets = Math.min(
      prescription.sets,
      completedSets.get(exercise.exerciseId) ?? 0,
    );
    completedSetCount += actualSets;
    if (!skippedExercises.has(exercise.exerciseId) && actualSets >= prescription.sets) {
      completedExerciseCount += 1;
    }
    for (let index = 0; index < actualSets; index++) {
      sets.push({
        setId: `${exercise.exerciseId}-${index + 1}`,
        exerciseId: exercise.exerciseId,
        reps: prescription.reps,
        loadKg: load.systemLoadKg,
        restSec: restForSet(exercise, index),
        intent: exercise.intent,
        quality: 1,
      });
    }
""",
    "training actual completed sets",
)

replace_once(
    ui,
    """      plannedSets,
      completedSets: plannedSets,
      plannedExercises: exercises.length,
      completedExercises: exercises.length,
      sequentialCompletion: true,
      prescriptionCompliance: 1,
""",
    """      plannedSets,
      completedSets: completedSetCount,
      plannedExercises: exercises.length,
      completedExercises: completedExerciseCount,
      sequentialCompletion: true,
      prescriptionCompliance:
        plannedSets > 0 ? completedSetCount / plannedSets : 0,
""",
    "training skip performance accounting",
)

# Fullscreen really means edge-to-edge on the S23 viewport. Inline !important
# styles were stronger than the previous stylesheet-only 6px inset override.
ui_text = ui.read_text(encoding="utf-8")
ui_text = ui_text.replace(
    "trainingWindow.style.setProperty('left', '6px', 'important');",
    "trainingWindow.style.setProperty('left', '0', 'important');",
)
ui_text = ui_text.replace(
    "trainingWindow.style.setProperty('top', '6px', 'important');",
    "trainingWindow.style.setProperty('top', '0', 'important');",
)
ui_text = ui_text.replace(
    "trainingWindow.style.setProperty('right', '6px', 'important');",
    "trainingWindow.style.setProperty('right', '0', 'important');",
)
ui_text = ui_text.replace(
    "trainingWindow.style.setProperty('bottom', '6px', 'important');",
    "trainingWindow.style.setProperty('bottom', '0', 'important');",
)
ui_text = ui_text.replace(
    "trainingWindow.style.setProperty('width', 'calc(100vw - 12px)', 'important');",
    "trainingWindow.style.setProperty('width', '100vw', 'important');",
)
ui_text = ui_text.replace(
    "trainingWindow.style.setProperty('height', 'calc(100vh - 12px)', 'important');",
    "trainingWindow.style.setProperty('height', '100dvh', 'important');",
)
ui.write_text(ui_text, encoding="utf-8")

# ---------------------------------------------------------------------------
# REAL DEVICE FIX 02 — migrate stale donor/test level-20 saves to HIGHFLY Lv1
# ---------------------------------------------------------------------------
main = Path("src/main.ts")
replace_once(
    main,
    """  const storedOfflineSave =
    world ? null : await loadHighflyOfflineSave(playerClass, name);
  const matchingOfflineSave = storedOfflineSave;

  const storedTrainingProfile =
    world ? null : await loadHighflyTrainingProfile(name);
  const baseTrainingProfile =
""",
    """  const storedOfflineSave =
    world ? null : await loadHighflyOfflineSave(playerClass, name);
  const storedTrainingProfile =
    world ? null : await loadHighflyTrainingProfile(name);
  const trainingHasRealProgress =
    !!storedTrainingProfile &&
    (
      (storedTrainingProfile.training.cycleProgression?.completedSessions.length ?? 0) > 0 ||
      Object.values(storedTrainingProfile.training.core).some(
        (stat) => stat.current > 0 || stat.peak > 0 || stat.progress > 0,
      )
    );
  // Early donor/test builds could leave a brand-new offline Hunter at level 20.
  // Only discard that exact stale seed when no real Training progress exists.
  const staleDonorLevel20 =
    storedOfflineSave?.state.level === 20 && !trainingHasRealProgress;
  const matchingOfflineSave = staleDonorLevel20 ? null : storedOfflineSave;

  const baseTrainingProfile =
""",
    "HIGHFLY stale level-20 migration",
)

# ---------------------------------------------------------------------------
# REAL DEVICE FIX 03 — remove the last visible ClaudeCraft crest and stop
# stretching the 128px fallback. Use the transparent HIGHFLY emblem at a sane
# size and render the HIGHFLY wordmark as crisp live text.
# ---------------------------------------------------------------------------
website_css = Path("src/styles/shell.website.css")
website_text = website_css.read_text(encoding="utf-8")
if 'url("/worldofclaudecraft-logo.png")' not in website_text:
    raise SystemExit("donor gateway logo URL anchor missing")
website_text = website_text.replace(
    'url("/worldofclaudecraft-logo.png")',
    'url("/highfly/highfly-logo-mark.png")',
)
website_text += r"""

/* HIGHFLY REAL DEVICE BRAND SURFACE */
body[data-website-redesign] :is(#mode-select, #login-panel, #forgot-panel, #reset-panel)::after {
  content: "HIGHFLY" !important;
  top: -14px !important;
  width: min(62%, 330px) !important;
  max-width: 330px !important;
  height: 166px !important;
  aspect-ratio: auto !important;
  display: flex !important;
  align-items: flex-end !important;
  justify-content: center !important;
  box-sizing: border-box !important;
  padding-bottom: 5px !important;
  background:
    url("/highfly/highfly-logo-mark.png") top center / 112px 112px no-repeat !important;
  color: #f6e6b4 !important;
  font: 800 34px / 1 var(--font-display) !important;
  letter-spacing: .17em !important;
  text-indent: .17em !important;
  text-shadow:
    0 2px 3px rgba(0, 0, 0, .92),
    0 0 12px rgba(170, 76, 255, .65),
    0 0 24px rgba(121, 59, 255, .30) !important;
  filter: none !important;
}

@media (max-height: 520px) and (orientation: landscape) {
  body[data-website-redesign] :is(#mode-select, #login-panel, #forgot-panel, #reset-panel)::after {
    top: -8px !important;
    width: 260px !important;
    height: 126px !important;
    padding-bottom: 2px !important;
    background-size: 82px 82px !important;
    font-size: 27px !important;
  }
}
"""
website_css.write_text(website_text, encoding="utf-8")

for html_path in (Path("index.html"), Path("play.html")):
    html = html_path.read_text(encoding="utf-8")
    html = html.replace("/worldofclaudecraft-logo.png", "/highfly/highfly-logo-mark.png")
    # Loading screen: do not stretch the fallback artwork over hundreds of pixels.
    match = re.search(r'(<img class="ls-logo"[^>]*>)', html)
    if not match:
        raise SystemExit(f"loading logo tag missing in {html_path}")
    tag = match.group(1)
    tag = re.sub(r'src="[^"]+"', 'src="/highfly/highfly-logo-mark.png"', tag, count=1)
    replacement = tag + '\n    <div class="highfly-loading-wordmark">HIGHFLY</div>'
    html = html[:match.start()] + replacement + html[match.end():]
    html_path.write_text(html, encoding="utf-8")

shell_css = Path("src/styles/shell.css")
shell_text = shell_css.read_text(encoding="utf-8")
shell_text += r"""

/* HIGHFLY RUN1-J REAL DEVICE — loading identity + true fullscreen Training */
#loading-screen .ls-logo {
  width: min(118px, 22vw) !important;
  max-width: 118px !important;
  height: auto !important;
  max-height: 118px !important;
  object-fit: contain !important;
  background: transparent !important;
  border: 0 !important;
  border-radius: 0 !important;
  filter:
    drop-shadow(0 0 14px rgba(168, 85, 247, .72))
    drop-shadow(0 0 26px rgba(79, 70, 229, .34)) !important;
}

#loading-screen .highfly-loading-wordmark {
  margin-top: -5px;
  margin-bottom: 12px;
  color: #f6e6b4;
  font-family: var(--font-display);
  font-size: clamp(26px, 4vw, 42px);
  font-weight: 800;
  line-height: 1;
  letter-spacing: .18em;
  text-indent: .18em;
  text-shadow:
    0 2px 3px rgba(0, 0, 0, .92),
    0 0 12px rgba(168, 85, 247, .64),
    0 0 28px rgba(99, 60, 255, .26);
}

body.mobile-touch #highfly-training-window {
  inset: 0 !important;
  left: 0 !important;
  top: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100vw !important;
  height: 100dvh !important;
  max-width: none !important;
  max-height: none !important;
  min-width: 0 !important;
  transform: none !important;
  border-radius: 0 !important;
  overflow: hidden !important;
  z-index: 95 !important;
}

body.mobile-touch #highfly-training-window .window-titlebar {
  min-height: 44px !important;
  height: 44px !important;
  box-sizing: border-box !important;
}

body.mobile-touch #highfly-training-window .highfly-training-shell {
  box-sizing: border-box !important;
  width: 100% !important;
  height: calc(100dvh - 44px) !important;
  max-height: none !important;
  min-height: 0 !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  overscroll-behavior: contain;
  padding:
    10px max(12px, env(safe-area-inset-right))
    calc(30px + env(safe-area-inset-bottom))
    max(12px, env(safe-area-inset-left)) !important;
}

#highfly-training-window .hf-rest-actions {
  display: grid !important;
  grid-template-columns: minmax(172px, auto) minmax(152px, auto) 1fr;
  gap: 8px !important;
  align-items: center !important;
}

#highfly-training-window .hf-skip-exercise {
  min-height: 40px !important;
  border: 1px solid rgba(70, 202, 255, .54) !important;
  background: linear-gradient(180deg, rgba(12, 63, 91, .76), rgba(5, 29, 48, .95)) !important;
  color: #dff7ff !important;
  font-weight: 900 !important;
  letter-spacing: .055em !important;
}

#highfly-training-window .hf-skip-exercise:disabled,
#highfly-training-window [data-hf-set-complete]:disabled {
  opacity: .40 !important;
  pointer-events: none !important;
}

#highfly-training-window .hf-exercise.is-skipped {
  opacity: .72;
  border-color: rgba(255, 183, 77, .28) !important;
}

@media (max-height: 520px) and (orientation: landscape) {
  #loading-screen .ls-logo {
    width: 84px !important;
    max-width: 84px !important;
    max-height: 84px !important;
  }
  #loading-screen .highfly-loading-wordmark {
    margin-top: -3px;
    margin-bottom: 8px;
    font-size: 27px;
  }
  body.mobile-touch #highfly-training-window .window-titlebar {
    min-height: 40px !important;
    height: 40px !important;
  }
  body.mobile-touch #highfly-training-window .highfly-training-shell {
    height: calc(100dvh - 40px) !important;
    padding-top: 8px !important;
  }
  #highfly-training-window .hf-rest-actions {
    grid-template-columns: minmax(160px, auto) minmax(145px, auto) 1fr;
  }
}
"""
shell_css.write_text(shell_text, encoding="utf-8")

print("HIGHFLY_RUN1J_REAL_DEVICE_FIX_APPLIED=1")
