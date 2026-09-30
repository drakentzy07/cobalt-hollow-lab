import { bindTouchTap } from '../../ui/touch_tap';
import type { ExerciseDefinition, SessionRecord } from './engine';
import type {
  HighflyHunterProfile,
  HighflyRmLiftId,
} from './core';
import {
  HIGHFLY_12_WEEK_MACROCYCLE,
  HIGHFLY_PERSONAL_5D_ROUTINE,
  HF_HIGHFLY_PERSONAL_5D_V1_ID,
  HIGHFLY_LOAD_ROUND_KG,
  HIGHFLY_TM_FACTOR,
  derivedLoadRangeKg,
  isEditableAccessory,
  macrocycleWeek,
  mainPrescription,
  restClockLabel,
  roundHighflyLoadKg,
  trainingMaxKg,
  type HighflyRoutineExercise,
} from './personal_routine';
import {
  getActiveHighflyHunterProfile,
  setActiveHighflyHunterProfile,
} from './profile_store';
import { runTrainingSessionPipeline } from './pipeline';
import { refreshActiveTrainingCombatBridge } from './combat_runtime';

let installed = false;
let selectedDay = 1;
let selectedWeek = 1;
let calibrationOpen = false;
let lastResult: ReturnType<typeof runTrainingSessionPipeline>['sessionResult'] | null = null;
let lastOutcomes: ReturnType<typeof runTrainingSessionPipeline>['outcomes'] = [];
const restRecords = new Map<string, number[]>();

interface ActiveRestTimer {
  exerciseId: string;
  label: string;
  targetSec: number;
  startedAt: number;
  timerId: number;
}

let activeRest: ActiveRestTimer | null = null;

const RM_FIELDS: readonly {
  id: HighflyRmLiftId;
  label: string;
}[] = [
  { id: 'back_squat', label: 'Sentadilla' },
  { id: 'bench_press', label: 'Press banca' },
  { id: 'overhead_press', label: 'Press militar' },
  { id: 'deadlift', label: 'Peso muerto' },
] as const;

function numberValue(root: ParentNode, selector: string, fallback: number): number {
  const input = root.querySelector(selector);
  if (!(input instanceof HTMLInputElement)) return fallback;
  const value = Number(input.value);
  return Number.isFinite(value) ? value : fallback;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return map[char] ?? char;
  });
}

function profileOrNull(): HighflyHunterProfile | null {
  return getActiveHighflyHunterProfile();
}

function calibratedOneRm(
  profile: HighflyHunterProfile | null,
  lift: HighflyRmLiftId | undefined,
): number | null {
  if (!profile || !lift) return null;
  const value = profile.training.loadCalibration?.lifts?.[lift]?.oneRmKg;
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

function calibrationComplete(profile: HighflyHunterProfile | null): boolean {
  return RM_FIELDS.every(({ id }) => calibratedOneRm(profile, id) !== null);
}

function coreCards(): string {
  const profile = profileOrNull();
  if (!profile) {
    return '<div class="hf-training-empty">Entrá con tu Hunter para ver el Training Core.</div>';
  }
  return (['STR', 'AGI', 'VIT', 'PER', 'INT'] as const)
    .map((stat) => {
      const state = profile.training.core[stat];
      return `
        <article class="hf-core-card">
          <div class="hf-core-card__top">
            <strong>${stat}</strong>
            <span class="hf-core-badge ${state.calibrated ? 'is-ready' : ''}">
              ${state.calibrated ? 'CALIBRADO' : 'PENDIENTE'}
            </span>
          </div>
          <div class="hf-core-current">${state.current.toFixed(1)}</div>
          <div class="hf-core-meta">
            <span>Peak <b>${state.peak.toFixed(1)}</b></span>
            <span>Progress <b>${state.progress.toFixed(1)}</b></span>
            <span>Conf. <b>${Math.round(state.confidence * 100)}%</b></span>
            <span>Ready <b>${Math.round(state.readiness * 100)}%</b></span>
          </div>
        </article>
      `;
    })
    .join('');
}

function weekOptions(): string {
  return HIGHFLY_12_WEEK_MACROCYCLE.map(
    (week) =>
      `<option value="${week.week}" ${week.week === selectedWeek ? 'selected' : ''}>S${week.week} · ${week.block}</option>`,
  ).join('');
}

function dayTabs(): string {
  return HIGHFLY_PERSONAL_5D_ROUTINE.map(
    (day) => `
      <button
        type="button"
        class="hf-training-day ${day.day === selectedDay ? 'is-selected' : ''}"
        data-hf-training-day="${day.day}"
      >
        <span>DÍA ${day.day}</span>
        <b>${escapeHtml(day.name)}</b>
      </button>
    `,
  ).join('');
}

function plannedSetCount(exercise: HighflyRoutineExercise): number {
  if (exercise.authority !== 'tm_main' || !exercise.rmLift) return exercise.defaultSets;
  const profile = profileOrNull();
  const rm = calibratedOneRm(profile, exercise.rmLift);
  if (!rm) return 0;
  const p = mainPrescription(exercise.rmLift, rm, selectedWeek);
  if (p.topReps === 'TEST') return 0;
  return 1 + p.backoffSets;
}

function requiredRestCount(exercise: HighflyRoutineExercise): number {
  return Math.max(0, plannedSetCount(exercise) - 1);
}

function loadPlan(exercise: HighflyRoutineExercise): {
  ready: boolean;
  primary: string;
  secondary: string;
  systemLoadKg: number;
  rmReferenceKg?: number;
} {
  const profile = profileOrNull();

  if (exercise.authority === 'tm_main' && exercise.rmLift) {
    const rm = calibratedOneRm(profile, exercise.rmLift);
    if (!rm) {
      return {
        ready: false,
        primary: 'RM REQUERIDO',
        secondary: 'Cargalo en CALIBRACIÓN',
        systemLoadKg: 0,
      };
    }
    const p = mainPrescription(exercise.rmLift, rm, selectedWeek);
    const tm = trainingMaxKg(rm);
    if (p.topReps === 'TEST') {
      return {
        ready: true,
        primary: 'TEST DE RM',
        secondary: 'Actualizá el nuevo RM al terminar',
        systemLoadKg: 0,
        rmReferenceKg: tm,
      };
    }
    const top = p.topKg ?? 0;
    const backoff =
      p.backoffKg && p.backoffSets > 0
        ? ` · ${p.backoffKg} kg × ${p.backoffSets}×${p.backoffReps}`
        : '';
    return {
      ready: true,
      primary: `${top} kg × ${p.topReps}${backoff}`,
      secondary: `TM ${tm} kg · ${Math.round((p.topPercent ?? 0) * 100)}% top`,
      systemLoadKg: top,
      rmReferenceKg: tm,
    };
  }

  if (exercise.authority === 'derived_percent' && exercise.rmLift && exercise.derivedPercentRange) {
    const rm = calibratedOneRm(profile, exercise.rmLift);
    if (!rm) {
      return {
        ready: false,
        primary: 'RM BASE REQUERIDO',
        secondary: 'La carga se deriva automáticamente',
        systemLoadKg: 0,
      };
    }
    const [low, high] = derivedLoadRangeKg(rm, exercise.derivedPercentRange);
    const midpoint = roundHighflyLoadKg((low + high) / 2);
    return {
      ready: true,
      primary: `${low}–${high} kg`,
      secondary: `Objetivo sistema · ${Math.round(exercise.derivedPercentRange[0] * 100)}–${Math.round(exercise.derivedPercentRange[1] * 100)}% TM`,
      systemLoadKg: midpoint,
      rmReferenceKg: trainingMaxKg(rm),
    };
  }

  if (exercise.authority === 'editable_accessory') {
    const kg = profile?.training.accessoryLoads?.[exercise.exerciseId]?.kg ?? 0;
    return {
      ready: kg > 0,
      primary: kg > 0 ? `${kg} kg registrados` : 'CARGA PENDIENTE',
      secondary: 'Mancuerna / máquina · editable',
      systemLoadKg: Math.max(0, kg),
    };
  }

  if (exercise.authority === 'bodyweight_locked') {
    return {
      ready: true,
      primary: 'PESO CORPORAL',
      secondary: 'Carga bloqueada por el sistema',
      systemLoadKg: 0,
    };
  }

  return {
    ready: true,
    primary: 'CARGA GUIADA',
    secondary: 'No editable · sin e1RM comparable automático',
    systemLoadKg: 0,
  };
}

function calibrationPanel(): string {
  const profile = profileOrNull();
  const complete = calibrationComplete(profile);
  const fields = RM_FIELDS.map(({ id, label }) => {
    const rm = calibratedOneRm(profile, id);
    const tm = rm ? trainingMaxKg(rm) : null;
    return `
      <label class="hf-rm-field">
        <span>${label}</span>
        <div class="hf-rm-input-wrap">
          <input
            data-hf-rm="${id}"
            type="number"
            inputmode="decimal"
            min="1"
            step="0.5"
            placeholder="1RM kg"
            value="${rm ?? ''}"
          >
          <small>${tm ? `TM ${tm} kg` : 'TM = 90% del RM'}</small>
        </div>
      </label>
    `;
  }).join('');

  return `
    <section class="hf-calibration ${calibrationOpen || !complete ? 'is-open' : ''}">
      <button type="button" id="hf-calibration-toggle" class="hf-system-line">
        <span>CALIBRACIÓN DE FUERZA</span>
        <b>${complete ? 'LISTA' : 'REQUERIDA'}</b>
      </button>
      <div class="hf-calibration-body">
        <p>
          Cargás tu RM una sola vez. HIGHFLY calcula el <b>Training Max 90%</b>,
          la semana del macrociclo y los kilos de los básicos. Esos kilos no se editan durante la sesión.
        </p>
        <div class="hf-rm-grid">${fields}</div>
        <button type="button" id="hf-calibration-save" class="hf-primary-action">
          GUARDAR CALIBRACIÓN
        </button>
        <div id="hf-calibration-status" class="hf-inline-status"></div>
      </div>
    </section>
  `;
}

function exerciseRows(): string {
  const day = HIGHFLY_PERSONAL_5D_ROUTINE.find((candidate) => candidate.day === selectedDay);
  if (!day) return '';
  const profile = profileOrNull();

  return day.exercises
    .map((exercise) => {
      const load = loadPlan(exercise);
      const restDone = restRecords.get(exercise.exerciseId)?.length ?? 0;
      const restNeeded = requiredRestCount(exercise);
      const editable = isEditableAccessory(exercise);
      const kg = profile?.training.accessoryLoads?.[exercise.exerciseId]?.kg ?? 0;
      const active = activeRest?.exerciseId === exercise.exerciseId;

      return `
        <article class="hf-exercise ${load.ready ? '' : 'is-blocked'}" data-exercise-id="${exercise.exerciseId}">
          <div class="hf-exercise__head">
            <div>
              <span class="hf-exercise-code">D${selectedDay} // ${exercise.intent.toUpperCase()}</span>
              <strong>${escapeHtml(exercise.label)}</strong>
              <small>${escapeHtml(exercise.prescription)} · ${escapeHtml(exercise.target)}</small>
            </div>
            <span class="hf-intent">${exercise.authority.replaceAll('_', ' ').toUpperCase()}</span>
          </div>

          <div class="hf-exercise-system">
            <div class="hf-prescription">
              <span>CARGA</span>
              <b>${escapeHtml(load.primary)}</b>
              <small>${escapeHtml(load.secondary)}</small>
            </div>
            <div class="hf-prescription">
              <span>DESCANSO</span>
              <b>${restClockLabel(exercise.restSec)}</b>
              <small>${restDone}/${restNeeded} descansos registrados</small>
            </div>
            ${
              editable
                ? `<label class="hf-accessory-load">
                    <span>PESO USADO</span>
                    <input
                      data-hf-accessory-load="${exercise.exerciseId}"
                      type="number"
                      inputmode="decimal"
                      min="0"
                      step="0.5"
                      value="${kg || ''}"
                      placeholder="kg"
                    >
                  </label>`
                : `<div class="hf-lock-chip"><span>🔒</span><b>CARGA BLOQUEADA</b></div>`
            }
          </div>

          <div class="hf-rest-actions">
            <button
              type="button"
              data-hf-rest-start="${exercise.exerciseId}"
              ${restNeeded === 0 || restDone >= restNeeded || active ? 'disabled' : ''}
            >
              ${
                restNeeded === 0
                  ? 'SIN DESCANSO PENDIENTE'
                  : restDone >= restNeeded
                    ? 'DESCANSOS COMPLETOS'
                    : active
                      ? 'DESCANSO EN CURSO'
                      : `SET COMPLETADO · INICIAR ${restClockLabel(exercise.restSec)}`
              }
            </button>
            <small>Si cortás el contador antes, el tiempo real entra al score y aplica debuff.</small>
          </div>
        </article>
      `;
    })
    .join('');
}

function restDockHtml(): string {
  return `
    <aside id="hf-rest-dock" class="hf-rest-dock" hidden>
      <div>
        <span>RECUPERACIÓN</span>
        <strong id="hf-rest-label">—</strong>
      </div>
      <div class="hf-rest-clock" id="hf-rest-clock">00:00</div>
      <div class="hf-rest-progress"><i id="hf-rest-progress-bar"></i></div>
      <button type="button" id="hf-rest-skip">CORTAR DESCANSO · DEBUFF</button>
    </aside>
  `;
}

function resultHtml(): string {
  if (!lastResult) {
    return `
      <div class="hf-training-empty">
        El sistema convierte tu sesión real en <b>Evidence → Stimulus → Progress → Performance Gate</b>.
      </div>
    `;
  }
  const s = lastResult.stimulus;
  const restAverage =
    lastResult.evidence.length > 0
      ? lastResult.evidence.reduce((sum, evidence) => sum + evidence.restCompliance, 0) /
        lastResult.evidence.length
      : 1;
  const outcomes = lastOutcomes.length
    ? `<div class="hf-training-outcomes">${lastOutcomes
        .map(
          (o) => `
            <div class="hf-training-outcome">
              <b>${o.stat}</b>
              <span>${o.outcome.replaceAll('_', ' ')}</span>
              <small>${escapeHtml(o.reason)}</small>
            </div>
          `,
        )
        .join('')}</div>`
    : '';

  return `
    <div class="hf-training-result__grid">
      <div><span>STR</span><b>${s.STR.toFixed(2)}</b></div>
      <div><span>AGI</span><b>${s.AGI.toFixed(2)}</b></div>
      <div><span>VIT</span><b>${s.VIT.toFixed(2)}</b></div>
      <div><span>PER</span><b>${s.PER.toFixed(2)}</b></div>
      <div><span>INT</span><b>${s.INT.toFixed(2)}</b></div>
    </div>
    <div class="hf-training-result__meta">
      <span>Evidence <b>${lastResult.evidence.length}</b></span>
      <span>Tonelaje <b>${lastResult.diagnosticTonnageKg.toFixed(1)} kg</b></span>
      <span>Descanso <b>${Math.round(restAverage * 100)}%</b></span>
      <span>Fatiga sist. <b>${lastResult.fatigue.systemic.toFixed(2)}</b></span>
    </div>
    ${outcomes}
  `;
}

function render(): void {
  const mount = document.querySelector('#highfly-training-window .highfly-training-shell');
  if (!(mount instanceof HTMLElement)) return;

  const plan = macrocycleWeek(selectedWeek);
  const profile = profileOrNull();
  const complete = calibrationComplete(profile);
  if (!complete) calibrationOpen = true;

  mount.innerHTML = `
    <section class="hf-training-header">
      <div>
        <span class="hf-eyebrow">[ HIGHFLY // TRAINING SYSTEM ]</span>
        <h3>RUTINA HIGHFLY · 5D</h3>
        <p>${HF_HIGHFLY_PERSONAL_5D_V1_ID} · Macrociclo 12 semanas</p>
      </div>
      <div class="hf-training-controls">
        <label>
          <span>SEMANA</span>
          <select id="hf-training-week">${weekOptions()}</select>
        </label>
        <label class="hf-readiness-control">
          <span>READINESS <output id="hf-training-readiness-value">85%</output></span>
          <input id="hf-training-readiness" type="range" min="0" max="100" step="1" value="85">
        </label>
      </div>
    </section>

    <section class="hf-cycle-status">
      <div><span>BLOQUE</span><b>${plan.block.toUpperCase()}</b></div>
      <div><span>OBJETIVO</span><b>${escapeHtml(plan.objective)}</b></div>
      <div><span>ACCESORIOS</span><b>${escapeHtml(plan.accessoryVolume)}</b></div>
      <div><span>CALIBRACIÓN</span><b>${complete ? 'LISTA' : 'PENDIENTE'}</b></div>
    </section>

    ${calibrationPanel()}

    <section>
      <div class="hf-section-title">
        <h4>HUNTER CORE</h4>
        <span>STR / AGI / VIT / PER / INT sólo suben por entrenamiento real</span>
      </div>
      <div class="hf-core-grid">${coreCards()}</div>
    </section>

    <section>
      <div class="hf-section-title">
        <h4>SESIÓN</h4>
        <span>Las cargas %RM y los descansos los gobierna el sistema</span>
      </div>
      <div class="hf-training-days">${dayTabs()}</div>
      <div class="hf-exercise-list">${exerciseRows()}</div>
      <div class="hf-training-actions">
        <button type="button" id="hf-training-register" class="hf-primary-action">
          REGISTRAR SESIÓN
        </button>
        <small>
          Sólo se editan cargas de mancuernas/máquinas. Los básicos se calculan desde tu RM y el macrociclo.
        </small>
      </div>
    </section>

    <section>
      <div class="hf-section-title">
        <h4>RESULTADO DEL SISTEMA</h4>
        <span>Evidence · Stimulus · Fatigue · Performance Gate</span>
      </div>
      <div id="hf-training-result" class="hf-training-result">${resultHtml()}</div>
    </section>

    ${restDockHtml()}
  `;

  bindRenderedUi(mount);
  if (activeRest) paintRestDock();
}

function bindRenderedUi(mount: HTMLElement): void {
  mount.querySelectorAll<HTMLElement>('[data-hf-training-day]').forEach((button) => {
    bindTouchTap(button, (event) => {
      event.preventDefault();
      cancelActiveRest();
      selectedDay = Number(button.dataset.hfTrainingDay) || 1;
      restRecords.clear();
      lastResult = null;
      lastOutcomes = [];
      render();
    });
  });

  const week = mount.querySelector('#hf-training-week');
  if (week instanceof HTMLSelectElement) {
    week.addEventListener('change', () => {
      cancelActiveRest();
      selectedWeek = Math.max(1, Math.min(12, Number(week.value) || 1));
      restRecords.clear();
      lastResult = null;
      lastOutcomes = [];
      render();
    });
  }

  const readiness = mount.querySelector('#hf-training-readiness');
  const readinessValue = mount.querySelector('#hf-training-readiness-value');
  if (readiness instanceof HTMLInputElement && readinessValue instanceof HTMLOutputElement) {
    readiness.addEventListener('input', () => {
      readinessValue.value = `${readiness.value}%`;
    });
  }

  const calibrationToggle = mount.querySelector<HTMLElement>('#hf-calibration-toggle');
  if (calibrationToggle) {
    bindTouchTap(calibrationToggle, (event) => {
      event.preventDefault();
      calibrationOpen = !calibrationOpen;
      render();
    });
  }

  const calibrationSave = mount.querySelector<HTMLElement>('#hf-calibration-save');
  if (calibrationSave) {
    bindTouchTap(calibrationSave, (event) => {
      event.preventDefault();
      saveCalibration(mount);
    });
  }

  mount.querySelectorAll<HTMLInputElement>('[data-hf-accessory-load]').forEach((input) => {
    input.addEventListener('change', () => {
      const exerciseId = input.dataset.hfAccessoryLoad;
      if (!exerciseId) return;
      saveAccessoryLoad(exerciseId, Math.max(0, Number(input.value) || 0));
    });
  });

  mount.querySelectorAll<HTMLElement>('[data-hf-rest-start]').forEach((button) => {
    bindTouchTap(button, (event) => {
      event.preventDefault();
      const exerciseId = button.dataset.hfRestStart;
      const day = HIGHFLY_PERSONAL_5D_ROUTINE.find((candidate) => candidate.day === selectedDay);
      const exercise = day?.exercises.find((candidate) => candidate.exerciseId === exerciseId);
      if (exercise) startRest(exercise);
    });
  });

  const skipRest = mount.querySelector<HTMLElement>('#hf-rest-skip');
  if (skipRest) {
    bindTouchTap(skipRest, (event) => {
      event.preventDefault();
      finishRest(true);
    });
  }

  const register = mount.querySelector<HTMLElement>('#hf-training-register');
  if (register) {
    bindTouchTap(register, (event) => {
      event.preventDefault();
      registerSession();
    });
  }
}

function saveCalibration(mount: HTMLElement): void {
  const profile = profileOrNull();
  if (!profile) return;

  const now = new Date().toISOString();
  const lifts = { ...(profile.training.loadCalibration?.lifts ?? {}) };
  let validCount = 0;

  for (const { id } of RM_FIELDS) {
    const value = Math.max(0, numberValue(mount, `[data-hf-rm="${id}"]`, 0));
    if (value > 0) {
      lifts[id] = { oneRmKg: value, updatedAt: now };
      validCount++;
    }
  }

  setActiveHighflyHunterProfile({
    ...profile,
    training: {
      ...profile.training,
      loadCalibration: {
        tmFactor: HIGHFLY_TM_FACTOR,
        roundKg: HIGHFLY_LOAD_ROUND_KG,
        lifts,
      },
    },
  });

  calibrationOpen = validCount < RM_FIELDS.length;
  render();
}

function saveAccessoryLoad(exerciseId: string, kg: number): void {
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

function startRest(exercise: HighflyRoutineExercise): void {
  if (activeRest) return;
  const done = restRecords.get(exercise.exerciseId)?.length ?? 0;
  if (done >= requiredRestCount(exercise)) return;

  const timerId = window.setInterval(() => {
    if (!activeRest) return;
    const elapsed = (Date.now() - activeRest.startedAt) / 1000;
    if (elapsed >= activeRest.targetSec) {
      finishRest(false);
      return;
    }
    paintRestDock();
  }, 250);

  activeRest = {
    exerciseId: exercise.exerciseId,
    label: exercise.label,
    targetSec: exercise.restSec,
    startedAt: Date.now(),
    timerId,
  };
  paintRestDock();
}

function paintRestDock(): void {
  if (!activeRest) return;
  const dock = document.querySelector<HTMLElement>('#hf-rest-dock');
  if (!dock) return;
  dock.hidden = false;

  const elapsed = Math.max(0, (Date.now() - activeRest.startedAt) / 1000);
  const remaining = Math.max(0, activeRest.targetSec - elapsed);
  const progress = Math.min(1, elapsed / activeRest.targetSec);

  const label = dock.querySelector('#hf-rest-label');
  const clock = dock.querySelector('#hf-rest-clock');
  const bar = dock.querySelector<HTMLElement>('#hf-rest-progress-bar');
  if (label) label.textContent = activeRest.label;
  if (clock) clock.textContent = restClockLabel(Math.ceil(remaining));
  if (bar) bar.style.width = `${Math.round(progress * 100)}%`;
}

function finishRest(early: boolean): void {
  if (!activeRest) return;
  const current = activeRest;
  window.clearInterval(current.timerId);
  const elapsed = Math.max(0, (Date.now() - current.startedAt) / 1000);
  const credited = early ? Math.min(current.targetSec, elapsed) : current.targetSec;
  const records = restRecords.get(current.exerciseId) ?? [];
  records.push(credited);
  restRecords.set(current.exerciseId, records);
  activeRest = null;
  render();
}

function cancelActiveRest(): void {
  if (!activeRest) return;
  window.clearInterval(activeRest.timerId);
  activeRest = null;
}

function restForSet(exercise: HighflyRoutineExercise, setIndex: number): number {
  if (setIndex === 0) return exercise.restSec;
  const records = restRecords.get(exercise.exerciseId) ?? [];
  return Math.max(0, records[setIndex - 1] ?? 0);
}

function registerSession(): void {
  const mount = document.querySelector('#highfly-training-window .highfly-training-shell');
  if (!(mount instanceof HTMLElement)) return;

  cancelActiveRest();

  const day = HIGHFLY_PERSONAL_5D_ROUTINE.find((candidate) => candidate.day === selectedDay);
  const profile = profileOrNull();
  if (!day || !profile) return;

  const definitions = new Map<string, ExerciseDefinition>();
  const sets: SessionRecord['sets'][number][] = [];

  for (const exercise of day.exercises) {
    const plan = loadPlan(exercise);

    if (exercise.authority === 'tm_main' && exercise.rmLift) {
      const rm = calibratedOneRm(profile, exercise.rmLift);
      if (!rm) continue;
      const prescription = mainPrescription(exercise.rmLift, rm, selectedWeek);
      if (prescription.topReps === 'TEST' || prescription.topKg === null) continue;
      const tm = trainingMaxKg(rm);
      definitions.set(exercise.exerciseId, {
        exerciseId: exercise.exerciseId,
        pattern: exercise.pattern,
        role: exercise.intent,
        loadMode: 'external_kg',
        rmReferenceKg: tm,
      });
      sets.push({
        setId: `${exercise.exerciseId}-top`,
        exerciseId: exercise.exerciseId,
        reps: prescription.topReps,
        loadKg: prescription.topKg,
        restSec: restForSet(exercise, 0),
        intent: exercise.intent,
        quality: 1,
      });
      for (let index = 0; index < prescription.backoffSets; index++) {
        sets.push({
          setId: `${exercise.exerciseId}-backoff-${index + 1}`,
          exerciseId: exercise.exerciseId,
          reps: prescription.backoffReps,
          loadKg: prescription.backoffKg ?? 0,
          restSec: restForSet(exercise, index + 1),
          intent: exercise.intent,
          quality: 1,
        });
      }
      continue;
    }

    if (exercise.authority === 'editable_accessory' && plan.systemLoadKg <= 0) {
      continue;
    }

    definitions.set(exercise.exerciseId, {
      exerciseId: exercise.exerciseId,
      pattern: exercise.pattern,
      role: exercise.intent,
      loadMode: plan.systemLoadKg > 0 ? 'external_kg' : 'bodyweight',
      rmReferenceKg: plan.rmReferenceKg,
    });

    for (let index = 0; index < exercise.defaultSets; index++) {
      sets.push({
        setId: `${exercise.exerciseId}-${index + 1}`,
        exerciseId: exercise.exerciseId,
        reps: exercise.defaultReps,
        loadKg: plan.systemLoadKg,
        restSec: restForSet(exercise, index),
        intent: exercise.intent,
        quality: 1,
      });
    }
  }

  const readiness = Math.max(
    0,
    Math.min(1, numberValue(mount, '#hf-training-readiness', 85) / 100),
  );
  const cycle = macrocycleWeek(selectedWeek);
  const sessionId = `ui-${Date.now()}`;

  const pipeline = runTrainingSessionPipeline({
    profile,
    session: {
      sessionId,
      routineId: HF_HIGHFLY_PERSONAL_5D_V1_ID,
      block: cycle.block,
      week: selectedWeek,
      day: selectedDay,
      readiness,
      isDeload: cycle.block === 'Descarga',
      completed: true,
      sets,
    },
    definitions,
  });

  setActiveHighflyHunterProfile(pipeline.profile);
  refreshActiveTrainingCombatBridge();
  lastResult = pipeline.sessionResult;
  lastOutcomes = pipeline.outcomes;

  const result = mount.querySelector('#hf-training-result');
  if (result instanceof HTMLElement) result.innerHTML = resultHtml();
  const coreGrid = mount.querySelector('.hf-core-grid');
  if (coreGrid instanceof HTMLElement) coreGrid.innerHTML = coreCards();

  window.dispatchEvent(
    new CustomEvent('highfly:training-session-committed', {
      detail: {
        sessionId,
        outcomes: pipeline.outcomes.map((outcome) => ({
          stat: outcome.stat,
          outcome: outcome.outcome,
          statDelta: outcome.statDelta,
        })),
      },
    }),
  );
}

export function installHighflyTrainingUi(): void {
  if (installed) return;
  installed = true;

  const trainingWindow = document.querySelector<HTMLElement>('#highfly-training-window');
  if (trainingWindow && trainingWindow.parentElement !== document.body) {
    document.body.appendChild(trainingWindow);
  }

  window.addEventListener('highfly:open-training', () => {
    calibrationOpen = !calibrationComplete(profileOrNull());
    render();
  });

  const close = document.querySelector<HTMLElement>('#highfly-training-close');
  if (close) {
    bindTouchTap(close, (event) => {
      event.preventDefault();
      cancelActiveRest();
      document.querySelector('#highfly-training-window')?.setAttribute('hidden', '');
    });
  }
}
