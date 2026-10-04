from pathlib import Path

def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")

ui = Path("src/highfly/training/ui.ts")
main = Path("src/main.ts")
css = Path("src/styles/shell.css")

# ---------------------------------------------------------------------------
# RUN137 A — Adaptive accessory/machine load memory.
# ---------------------------------------------------------------------------
replace_once(
    ui,
    "import { refreshActiveTrainingCombatBridge } from './combat_runtime';\n",
    """import { refreshActiveTrainingCombatBridge } from './combat_runtime';
import {
  acceptAccessorySuggestion,
  defaultAccessoryStepKg,
  inferAccessoryEquipmentKind,
  markAccessoryRepeat,
  normalizeAccessoryEntry,
  recordAccessoryCompletion,
} from './accessory_adaptation';
""",
    "accessory adaptation import",
)

replace_once(
    ui,
    """function savedAccessoryKg(exerciseId: string): number {
  return profileOrNull()?.training.accessoryLoads?.[exerciseId]?.kg ?? 0;
}
""",
    """function savedAccessoryEntry(exerciseId: string) {
  return profileOrNull()?.training.accessoryLoads?.[exerciseId];
}

function savedAccessoryKg(exerciseId: string): number {
  return savedAccessoryEntry(exerciseId)?.kg ?? 0;
}
""",
    "accessory entry reader",
)

replace_once(
    ui,
    """  if (editable) {
    return {
      ready: accessoryKg > 0,
      primary: accessoryKg > 0 ? `${accessoryKg} kg` : 'INGRESÁ EL PESO',
      secondary: 'Accesorio de la planilla · carga registrada por vos',
      systemLoadKg: accessoryKg,
      editable: true,
      rmReferenceKg,
    };
  }
""",
    """  if (editable) {
    const entry = savedAccessoryEntry(exercise.exerciseId);
    const suggestion = entry?.nextSuggestedKg ?? 0;
    return {
      ready: accessoryKg > 0,
      primary: accessoryKg > 0 ? `${accessoryKg} kg` : 'INGRESÁ EL PESO',
      secondary:
        suggestion > 0 && Math.abs(suggestion - accessoryKg) > 0.001
          ? `HIGHFLY sugiere ${suggestion} kg para la próxima exposición`
          : entry?.repeatRequested
            ? `Repetir ${accessoryKg} kg · readaptación solicitada`
            : 'Accesorio/máquina · HIGHFLY aprende tu carga real',
      systemLoadKg: accessoryKg,
      editable: true,
      rmReferenceKg,
    };
  }
""",
    "adaptive accessory load plan",
)

replace_once(
    ui,
    "      const resting = activeRest?.exerciseId === exercise.exerciseId;\n",
    """      const resting = activeRest?.exerciseId === exercise.exerciseId;
      const accessory = load.editable ? savedAccessoryEntry(exercise.exerciseId) : undefined;
      const accessoryKind =
        accessory?.equipmentKind ?? inferAccessoryEquipmentKind(exercise.exerciseId);
      const accessoryStep =
        accessory?.progressionStepKg ?? defaultAccessoryStepKg(accessoryKind);
      const accessorySuggestion = accessory?.nextSuggestedKg ?? 0;
""",
    "accessory card state",
)

replace_once(
    ui,
    """                ? `<label class="hf-accessory-load">
                    <span>PESO USADO</span>
                    <input
                      data-hf-accessory-load="${exercise.exerciseId}"
                      type="number"
                      inputmode="decimal"
                      min="0"
                      step="0.5"
                      value="${savedAccessoryKg(exercise.exerciseId) || ''}"
                      placeholder="kg"
                      ${lockedSession ? 'disabled' : ''}
                    >
                  </label>`
""",
    """                ? `<div class="hf-accessory-adaptive">
                    <label class="hf-accessory-load">
                      <span>PESO USADO</span>
                      <input
                        data-hf-accessory-load="${exercise.exerciseId}"
                        type="number"
                        inputmode="decimal"
                        min="0"
                        step="0.5"
                        value="${savedAccessoryKg(exercise.exerciseId) || ''}"
                        placeholder="kg"
                        ${lockedSession ? 'disabled' : ''}
                      >
                    </label>
                    <label class="hf-accessory-meta">
                      <span>EQUIPO</span>
                      <select data-hf-accessory-kind="${exercise.exerciseId}" ${lockedSession ? 'disabled' : ''}>
                        <option value="dumbbell" ${accessoryKind === 'dumbbell' ? 'selected' : ''}>Mancuerna</option>
                        <option value="machine" ${accessoryKind === 'machine' ? 'selected' : ''}>Máquina</option>
                        <option value="cable" ${accessoryKind === 'cable' ? 'selected' : ''}>Cable</option>
                        <option value="other" ${accessoryKind === 'other' ? 'selected' : ''}>Otro</option>
                      </select>
                    </label>
                    <label class="hf-accessory-meta">
                      <span>SALTO</span>
                      <input data-hf-accessory-step="${exercise.exerciseId}" type="number" inputmode="decimal"
                        min="0.5" step="0.5" value="${accessoryStep}" ${lockedSession ? 'disabled' : ''}>
                    </label>
                    ${accessorySuggestion > 0 ? `<div class="hf-accessory-suggestion">
                      <span>SUGERENCIA HIGHFLY</span><b>${accessorySuggestion} kg</b>
                      <button type="button" data-hf-accessory-accept="${exercise.exerciseId}" ${lockedSession ? 'disabled' : ''}>USAR ${accessorySuggestion} KG</button>
                    </div>` : ''}
                    ${savedAccessoryKg(exercise.exerciseId) > 0 ? `<button type="button" class="hf-accessory-repeat" data-hf-accessory-repeat="${exercise.exerciseId}" ${lockedSession ? 'disabled' : ''}>NO LOGRÉ OBJETIVO · REPETIR ${savedAccessoryKg(exercise.exerciseId)} KG</button>` : ''}
                  </div>`
""",
    "adaptive accessory controls",
)

old_bind = """  mount.querySelectorAll<HTMLInputElement>('[data-hf-accessory-load]').forEach((input) => {
    input.addEventListener('change', () => {
      if (!selectedSessionTrainable()) return;
      const exerciseId = input.dataset.hfAccessoryLoad;
      if (!exerciseId) return;
      saveAccessoryLoad(exerciseId, Math.max(0, Number(input.value) || 0));
      render();
    });
  });
"""
new_bind = old_bind + """
  mount.querySelectorAll<HTMLSelectElement>('[data-hf-accessory-kind]').forEach((select) => {
    select.addEventListener('change', () => {
      if (!selectedSessionTrainable()) return;
      const exerciseId = select.dataset.hfAccessoryKind;
      if (!exerciseId) return;
      saveAccessoryMeta(exerciseId, select.value, undefined);
      render();
    });
  });

  mount.querySelectorAll<HTMLInputElement>('[data-hf-accessory-step]').forEach((input) => {
    input.addEventListener('change', () => {
      if (!selectedSessionTrainable()) return;
      const exerciseId = input.dataset.hfAccessoryStep;
      if (!exerciseId) return;
      saveAccessoryMeta(exerciseId, undefined, Math.max(0.5, Number(input.value) || 0.5));
      render();
    });
  });

  mount.querySelectorAll<HTMLElement>('[data-hf-accessory-accept]').forEach((button) => {
    bindTouchTap(button, (event) => {
      event.preventDefault();
      const exerciseId = button.dataset.hfAccessoryAccept;
      if (!exerciseId || !selectedSessionTrainable()) return;
      acceptSuggestedAccessoryLoad(exerciseId);
      render();
    });
  });

  mount.querySelectorAll<HTMLElement>('[data-hf-accessory-repeat]').forEach((button) => {
    bindTouchTap(button, (event) => {
      event.preventDefault();
      const exerciseId = button.dataset.hfAccessoryRepeat;
      if (!exerciseId || !selectedSessionTrainable()) return;
      markAccessoryForRepeat(exerciseId);
      render();
    });
  });
"""
replace_once(ui, old_bind, new_bind, "adaptive accessory bindings")

replace_once(
    ui,
    """function saveAccessoryLoad(exerciseId: string, kg: number): void {
  const profile = profileOrNull();
  if (!profile) return;
  setActiveHighflyHunterProfile({
    ...profile,
    training: {
      ...profile.training,
      accessoryLoads: {
        ...(profile.training.accessoryLoads ?? {}),
        [exerciseId]: {
          kg,
          updatedAt: new Date().toISOString(),
        },
      },
    },
  });
}
""",
    """function updateAccessoryEntry(
  exerciseId: string,
  updater: (entry: NonNullable<HighflyHunterProfile['training']['accessoryLoads']>[string]) =>
    NonNullable<HighflyHunterProfile['training']['accessoryLoads']>[string],
): void {
  const profile = profileOrNull();
  if (!profile) return;
  const previous = profile.training.accessoryLoads?.[exerciseId] ?? {
    kg: 0,
    updatedAt: new Date().toISOString(),
  };
  const next = updater(normalizeAccessoryEntry(exerciseId, previous));
  setActiveHighflyHunterProfile({
    ...profile,
    training: {
      ...profile.training,
      accessoryLoads: {
        ...(profile.training.accessoryLoads ?? {}),
        [exerciseId]: next,
      },
    },
  });
}

function saveAccessoryLoad(exerciseId: string, kg: number): void {
  updateAccessoryEntry(exerciseId, (entry) => ({
    ...entry,
    kg,
    nextSuggestedKg: undefined,
    repeatRequested: false,
    updatedAt: new Date().toISOString(),
  }));
}

function saveAccessoryMeta(
  exerciseId: string,
  kind?: string,
  stepKg?: number,
): void {
  updateAccessoryEntry(exerciseId, (entry) => {
    const equipmentKind =
      kind === 'dumbbell' || kind === 'machine' || kind === 'cable' || kind === 'other'
        ? kind
        : entry.equipmentKind;
    return normalizeAccessoryEntry(exerciseId, {
      ...entry,
      ...(equipmentKind ? { equipmentKind } : {}),
      ...(stepKg !== undefined ? { progressionStepKg: stepKg } : {}),
      updatedAt: new Date().toISOString(),
    });
  });
}

function acceptSuggestedAccessoryLoad(exerciseId: string): void {
  updateAccessoryEntry(exerciseId, (entry) =>
    acceptAccessorySuggestion(exerciseId, entry, new Date().toISOString()),
  );
}

function markAccessoryForRepeat(exerciseId: string): void {
  const exercise = activeDayExercises().find((candidate) => candidate.exerciseId === exerciseId);
  const prescription = exercise ? prescriptionForWeek(exercise, selectedWeek) : null;
  if (!prescription) return;
  updateAccessoryEntry(exerciseId, (entry) =>
    markAccessoryRepeat(exerciseId, entry, {
      sets: prescription.sets,
      reps: prescription.reps,
      recordedAt: new Date().toISOString(),
    }),
  );
}
""",
    "adaptive accessory persistence",
)

replace_once(
    ui,
    """  const cycledProfile = withCycleSession(pipeline.profile, sessionId);
""",
    """  let adaptiveProfile = pipeline.profile;
  for (const exercise of exercises) {
    if (!isEditableAccessory(exercise)) continue;
    const prescription = prescriptionForWeek(exercise, selectedWeek);
    if (!prescription) continue;
    const actualSets = Math.min(
      prescription.sets,
      completedSets.get(exercise.exerciseId) ?? 0,
    );
    if (actualSets < prescription.sets) continue;
    const entry = adaptiveProfile.training.accessoryLoads?.[exercise.exerciseId];
    if (!entry || !(entry.kg > 0)) continue;
    const nextWeek =
      selectedWeek === 1 ? 2 : selectedWeek === 2 ? 3 : selectedWeek === 3 ? 4 : null;
    const nextPrescription =
      nextWeek === null ? null : prescriptionForWeek(exercise, nextWeek);
    const learned = recordAccessoryCompletion(exercise.exerciseId, entry, {
      sets: prescription.sets,
      reps: prescription.reps,
      nextReps: nextPrescription?.reps ?? null,
      recordedAt: new Date().toISOString(),
    });
    adaptiveProfile = {
      ...adaptiveProfile,
      training: {
        ...adaptiveProfile.training,
        accessoryLoads: {
          ...(adaptiveProfile.training.accessoryLoads ?? {}),
          [exercise.exerciseId]: learned,
        },
      },
    };
  }

  const cycledProfile = withCycleSession(adaptiveProfile, sessionId);
""",
    "learn accessory completion",
)

replace_once(
    ui,
    "<h4>RESULTADO DE ESTA SESIÓN</h4>",
    "<h4>ESTÍMULO DE ESTA SESIÓN</h4>",
    "session stimulus title",
)
replace_once(
    ui,
    "<span>Evidencia · Estímulo · Fatiga · Puerta de Rendimiento</span>",
    "<span>No es tu Core consolidado · Evidencia · Estímulo · Puerta de Rendimiento</span>",
    "session stimulus explanation",
)

# ---------------------------------------------------------------------------
# RUN137 B — Training Focus Mode. Pause simulation + renderer while the real
# workout UI is in front. Rest remains wall-clock based in ui.ts.
# ---------------------------------------------------------------------------
replace_once(
    ui,
    "export function installHighflyTrainingUi(): void {",
    """function setTrainingFocusMode(active: boolean): void {
  document.body.classList.toggle('highfly-training-focus', active);
  window.dispatchEvent(
    new CustomEvent('highfly:training-focus', { detail: { active } }),
  );
}

export function installHighflyTrainingUi(): void {""",
    "Training focus helper",
)

replace_once(
    ui,
    """  window.addEventListener('highfly:open-training', () => {
    trainingWindow?.removeAttribute('hidden');
""",
    """  window.addEventListener('highfly:open-training', () => {
    setTrainingFocusMode(true);
    trainingWindow?.removeAttribute('hidden');
""",
    "Training focus enter",
)

replace_once(
    ui,
    """      if (activeRest) {
        paintRestDock();
        return;
      }
      document.querySelector('#highfly-training-window')?.setAttribute('hidden', '');
""",
    """      if (activeRest) {
        paintRestDock();
        return;
      }
      setTrainingFocusMode(false);
      document.querySelector('#highfly-training-window')?.setAttribute('hidden', '');
""",
    "Training focus exit",
)

replace_once(
    main,
    "  let graphicsRebuildPaused = false;\n",
    """  let graphicsRebuildPaused = false;
  // HIGHFLY RUN137: while Training is foreground, the real-world workout owns
  // the device. Freeze sim + renderer so buffs, AI, physics and GPU world work
  // do not advance or burn battery behind the Training sheet.
  let highflyTrainingFocusActive = false;
  window.addEventListener('highfly:training-focus', (event) => {
    const detail = (event as CustomEvent<{ active?: boolean }>).detail;
    highflyTrainingFocusActive = detail?.active === true;
  });
""",
    "Training focus state",
)

replace_once(
    main,
    "    gateInput.graphicsRebuildPaused = graphicsRebuildPaused;\n",
    "    gateInput.graphicsRebuildPaused = graphicsRebuildPaused || highflyTrainingFocusActive;\n",
    "Training focus frame gate",
)

css_text = css.read_text(encoding="utf-8")
css_text += r"""

/* HIGHFLY RUN137 — Training Focus + adaptive load coach. */
body.highfly-training-focus #ui {
  contain: layout style paint;
}
#highfly-training-window .hf-training-header::after {
  content: "FOCUS · MUNDO 3D PAUSADO";
  font-size: 11px;
  letter-spacing: .12em;
  opacity: .72;
}
#highfly-training-window .hf-accessory-adaptive {
  display: grid;
  grid-template-columns: minmax(120px, 1fr) auto auto;
  gap: 8px;
  align-items: end;
}
#highfly-training-window .hf-accessory-meta {
  display: grid;
  gap: 4px;
  min-width: 92px;
}
#highfly-training-window .hf-accessory-meta span,
#highfly-training-window .hf-accessory-suggestion span {
  font-size: 10px;
  letter-spacing: .1em;
  opacity: .7;
}
#highfly-training-window .hf-accessory-suggestion {
  grid-column: 1 / -1;
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  padding: 8px 10px;
  border: 1px solid rgba(106, 220, 255, .25);
  border-radius: 10px;
}
#highfly-training-window .hf-accessory-repeat {
  grid-column: 1 / -1;
}
@media (max-width: 900px) {
  #highfly-training-window .hf-accessory-adaptive {
    grid-template-columns: 1fr 1fr;
  }
  #highfly-training-window .hf-accessory-load {
    grid-column: 1 / -1;
  }
}
"""
css.write_text(css_text, encoding="utf-8")

final_ui = ui.read_text(encoding="utf-8")
final_main = main.read_text(encoding="utf-8")
for needle in (
    "ESTÍMULO DE ESTA SESIÓN",
    "NO LOGRÉ OBJETIVO · REPETIR",
    "data-hf-accessory-accept",
    "setTrainingFocusMode(true)",
):
    if needle not in final_ui:
        raise SystemExit(f"RUN137 missing UI contract: {needle}")
if "graphicsRebuildPaused || highflyTrainingFocusActive" not in final_main:
    raise SystemExit("RUN137 Training focus frame gate missing")

print("HIGHFLY_RUN137_TRAINING_INTELLIGENCE_APPLIED=1")
