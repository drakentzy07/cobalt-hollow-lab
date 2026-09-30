import { bindTouchTap } from '../../ui/touch_tap';
import type { ExerciseDefinition, SessionRecord } from './engine';
import type { HighflyHunterProfile, HighflyRmLiftId } from './core';
import {
  HIGHFLY_4_WEEK_BLOCK,
  HIGHFLY_PERSONAL_5D_ROUTINE,
  HF_HIGHFLY_PERSONAL_5D_V2_ID,
  HIGHFLY_LOAD_ROUND_KG,
  HIGHFLY_TM_FACTOR,
  flattenSetPlans,
  isEditableAccessory,
  planLoadKg,
  plannedSetCount,
  prescriptionForWeek,
  restClockLabel,
  trainingMaxKg,
  type HighflyRoutineExercise,
  type HighflySetPlan,
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
let readinessPct = 100;
let calibrationOpen = false;
let lastResult: ReturnType<typeof runTrainingSessionPipeline>['sessionResult'] | null = null;
let lastOutcomes: ReturnType<typeof runTrainingSessionPipeline>['outcomes'] = [];

const completedSets = new Map<string, number>();
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
  defaultRm: number;
}[] = [
  { id: 'hang_power_clean', label: 'Hang Power Clean', defaultRm: 80 },
  { id: 'back_squat', label: 'Sentadilla', defaultRm: 120 },
  { id: 'push_press', label: 'Push Press', defaultRm: 70 },
  { id: 'bench_press', label: 'Banco Plano', defaultRm: 75 },
  { id: 'deadlift_rack_pull', label: 'Peso Muerto / Rack Pull', defaultRm: 115 },
  { id: 'pendlay_row', label: 'Remo Pendlay', defaultRm: 75 },
  { id: 'overhead_press', label: 'Press Militar', defaultRm: 60 },
  { id: 'incline_barbell', label: 'Banco Inclinado con Barra', defaultRm: 75 },
  { id: 'front_squat', label: 'Sentadilla Frontal', defaultRm: 75 },
  { id: 'zercher_good_morning', label: 'Buenos días Zercher', defaultRm: 75 },
] as const;

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
  if (!lift) return null;
  const stored = profile?.training.loadCalibration?.lifts?.[lift]?.oneRmKg;
  if (typeof stored === 'number' && Number.isFinite(stored) && stored > 0) return stored;
  return RM_FIELDS.find((field) => field.id === lift)?.defaultRm ?? null;
}

function calibrationComplete(profile: HighflyHunterProfile | null): boolean {
  return RM_FIELDS.every(({ id }) => calibratedOneRm(profile, id) !== null);
}

function readinessLabel(value: number): string {
  if (value >= 100) return 'ÓPTIMA';
  if (value >= 90) return 'BUENA';
  if (value >= 80) return 'NORMAL';
  if (value >= 70) return 'CARGADO';
  return 'MUY CARGADO';
}

function readinessModifier(value: number): number {
  return 0.65 + 0.35 * Math.max(0, Math.min(1, value / 100));
}

function intentLabel(intent: HighflyRoutineExercise['intent']): string {
  switch (intent) {
    case 'strength': return 'FUERZA';
    case 'power': return 'POTENCIA';
    case 'hypertrophy': return 'HIPERTROFIA';
    case 'accessory': return 'ACCESORIO';
    case 'recovery': return 'RECUPERACIÓN';
  }
}

function authorityLabel(exercise: HighflyRoutineExercise): string {
  switch (exercise.authority) {
    case 'percent_tm': return 'SISTEMA · % TM';
    case 'fixed_locked': return 'SISTEMA · FIJO';
    case 'editable_accessory': return 'CARGA EDITABLE';
  }
}

function coreCards(): string {
  const profile = profileOrNull();
  if (!profile) {
    return '<div class="hf-training-empty">Entrá con tu Hunter para ver el Núcleo Hunter.</div>';
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
            <span>Pico <b>${state.peak.toFixed(1)}</b></span>
            <span>Progreso <b>${state.progress.toFixed(1)}</b></span>
            <span>Conf. <b>${Math.round(state.confidence * 100)}%</b></span>
            <span>Preparación <b>${Math.round(state.readiness * 100)}%</b></span>
          </div>
        </article>
      `;
    })
    .join('');
}

function weekOptions(): string {
  return HIGHFLY_4_WEEK_BLOCK.map(
    (week) =>
      `<option value="${week.week}" ${week.week === selectedWeek ? 'selected' : ''}>S${week.week} · ${week.phase}</option>`,
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

function currentDay() {
  return HIGHFLY_PERSONAL_5D_ROUTINE.find((candidate) => candidate.day === selectedDay) ?? null;
}

function setCount(exercise: HighflyRoutineExercise): number {
  return plannedSetCount(exercise, selectedWeek);
}

function completedSetCount(exercise: HighflyRoutineExercise): number {
  return Math.min(setCount(exercise), completedSets.get(exercise.exerciseId) ?? 0);
}

function exerciseComplete(exercise: HighflyRoutineExercise): boolean {
  return completedSetCount(exercise) >= setCount(exercise);
}

function exerciseUnlocked(exercise: HighflyRoutineExercise): boolean {
  const day = currentDay();
  if (!day) return false;
  const index = day.exercises.findIndex((candidate) => candidate.exerciseId === exercise.exerciseId);
  if (index <= 0) return index === 0;
  return day.exercises.slice(0, index).every(exerciseComplete);
}

function dayComplete(): boolean {
  const day = currentDay();
  return !!day && day.exercises.every(exerciseComplete);
}

function accessoryKg(exercise: HighflyRoutineExercise): number {
  const stored = profileOrNull()?.training.accessoryLoads?.[exercise.exerciseId]?.kg;
  if (typeof stored === 'number' && Number.isFinite(stored) && stored > 0) return stored;
  const suggested = prescriptionForWeek(exercise, selectedWeek).work.suggestedKg;
  return typeof suggested === 'number' && suggested > 0 ? suggested : 0;
}

function formatPlan(plan: HighflySetPlan, exercise: HighflyRoutineExercise): string {
  const rm = calibratedOneRm(profileOrNull(), exercise.rmLift);
  const kg =
    exercise.authority === 'editable_accessory'
      ? accessoryKg(exercise)
      : planLoadKg(plan, rm);
  const load = kg > 0 ? ` · ${kg} kg` : '';
  const pct = typeof plan.percentTm === 'number' ? ` @${Math.round(plan.percentTm * 100)}%` : '';
  return `${plan.sets}×${plan.reps}${pct}${load}`;
}

function loadPlan(exercise: HighflyRoutineExercise): {
  ready: boolean;
  primary: string;
  secondary: string;
  systemLoadKg: number;
  rmReferenceKg?: number;
} {
  const prescription = prescriptionForWeek(exercise, selectedWeek);

  if (exercise.authority === 'percent_tm' && exercise.rmLift) {
    const rm = calibratedOneRm(profileOrNull(), exercise.rmLift);
    if (!rm) {
      return {
        ready: false,
        primary: 'RM REQUERIDO',
        secondary: 'Revisalo en Calibración de Fuerza',
        systemLoadKg: 0,
      };
    }
    const workKg = planLoadKg(prescription.work, rm);
    const primary = prescription.top
      ? `TOP ${formatPlan(prescription.top, exercise)} · TRABAJO ${formatPlan(prescription.work, exercise)}`
      : formatPlan(prescription.work, exercise);
    return {
      ready: true,
      primary,
      secondary: `RM ${rm} kg · TM ${trainingMaxKg(rm)} kg`,
      systemLoadKg: workKg,
      rmReferenceKg: trainingMaxKg(rm),
    };
  }

  if (exercise.authority === 'fixed_locked') {
    const kg = planLoadKg(prescription.work);
    return {
      ready: kg > 0,
      primary: formatPlan(prescription.work, exercise),
      secondary: 'Carga exacta de tu rutina · bloqueada',
      systemLoadKg: kg,
    };
  }

  const kg = accessoryKg(exercise);
  return {
    ready: kg > 0,
    primary: kg > 0 ? `${prescription.work.sets}×${prescription.work.reps} · ${kg} kg` : `${prescription.work.sets}×${prescription.work.reps} · PESO PENDIENTE`,
    secondary: prescription.work.suggestedKg
      ? `Rutina base: ${prescription.work.suggestedKg} kg · editable`
      : 'Mancuerna / máquina · ingresá el peso usado',
    systemLoadKg: Math.max(0, kg),
  };
}

function calibrationPanel(): string {
  const profile = profileOrNull();
  const fields = RM_FIELDS.map(({ id, label, defaultRm }) => {
    const stored = profile?.training.loadCalibration?.lifts?.[id]?.oneRmKg;
    const rm = typeof stored === 'number' && stored > 0 ? stored : defaultRm;
    const tm = trainingMaxKg(rm);
    return `
      <label class="hf-rm-field">
        <span>${escapeHtml(label)}</span>
        <div class="hf-rm-input-wrap">
          <input data-hf-rm="${id}" type="number" inputmode="decimal" min="1" step="0.5" value="${rm}">
          <small>RM ${rm} kg · TM 90% = ${tm} kg</small>
        </div>
      </label>
    `;
  }).join('');

  return `
    <section class="hf-calibration ${calibrationOpen ? 'is-open' : ''}">
      <button type="button" id="hf-calibration-toggle" class="hf-system-line">
        <span>CALIBRACIÓN DE FUERZA</span>
        <b>${calibrationComplete(profile) ? 'LISTA' : 'REQUERIDA'}</b>
      </button>
      <div class="hf-calibration-body">
        <p>
          Estos RM salen de <b>tu rutina adjunta</b>. HIGHFLY usa TM = 90% y reproduce
          exactamente las cuatro semanas. Podés recalibrarlos cuando cambie tu RM.
        </p>
        <div class="hf-rm-grid">${fields}</div>
        <button type="button" id="hf-calibration-save" class="hf-primary-action">GUARDAR CALIBRACIÓN</button>
        <div id="hf-calibration-status" class="hf-inline-status"></div>
      </div>
    </section>
  `;
}

function exerciseRows(): string {
  const day = currentDay();
  if (!day) return '';

  return day.exercises
    .map((exercise, index) => {
      const load = loadPlan(exercise);
      const total = setCount(exercise);
      const done = completedSetCount(exercise);
      const unlocked = exerciseUnlocked(exercise);
      const complete = done >= total;
      const active = activeRest?.exerciseId === exercise.exerciseId;
      const blockedByPrevious = !unlocked;
      const canCompleteSet = unlocked && load.ready && !complete && !activeRest;
      const editable = isEditableAccessory(exercise);
      const kg = accessoryKg(exercise);
      const restDone = restRecords.get(exercise.exerciseId)?.length ?? 0;
      const restNeeded = Math.max(0, total - 1);

      return `
        <article class="hf-exercise ${complete ? 'is-complete' : ''} ${blockedByPrevious || !load.ready ? 'is-sequence-locked' : ''}" data-exercise-id="${exercise.exerciseId}">
          <div class="hf-exercise__head">
            <div>
              <span class="hf-exercise-code">D${selectedDay} // ${intentLabel(exercise.intent)}</span>
              <strong>${index + 1}. ${escapeHtml(exercise.label)}</strong>
              <small>${escapeHtml(exercise.notes ?? 'Rutina HIGHFLY exacta')}</small>
            </div>
            <span class="hf-intent">${authorityLabel(exercise)}</span>
          </div>

          <div class="hf-exercise-system">
            <div class="hf-prescription">
              <span>PRESCRIPCIÓN</span>
              <b>${escapeHtml(load.primary)}</b>
              <small>${escapeHtml(load.secondary)}</small>
            </div>
            <div class="hf-prescription">
              <span>PROGRESO</span>
              <b>SET ${done}/${total}</b>
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
                      ${!unlocked || complete ? 'disabled' : ''}
                    >
                  </label>`
                : `<div class="hf-lock-chip"><span>🔒</span><b>CARGA DEL SISTEMA</b></div>`
            }
          </div>

          <div class="hf-rest-actions">
            <button
              type="button"
              data-hf-set-complete="${exercise.exerciseId}"
              ${canCompleteSet ? '' : 'disabled'}
            >
              ${
                complete
                  ? '✓ EJERCICIO COMPLETADO'
                  : blockedByPrevious
                    ? '🔒 COMPLETÁ EL EJERCICIO ANTERIOR'
                    : !load.ready
                      ? 'CARGA PENDIENTE'
                      : active
                        ? 'RECUPERACIÓN EN CURSO'
                        : `COMPLETAR SET ${done + 1}/${total}`
              }
            </button>
            <small>
              ${complete
                ? 'Secuencia completada.'
                : 'Cada set habilita su descanso. El siguiente ejercicio permanece bloqueado hasta terminar éste.'}
            </small>
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
        <span>[ SISTEMA // RECUPERACIÓN ]</span>
        <strong id="hf-rest-label">—</strong>
        <small id="hf-rest-message">Recuperación óptima en curso</small>
      </div>
      <div class="hf-rest-clock" id="hf-rest-clock">00:00</div>
      <div class="hf-rest-progress"><i id="hf-rest-progress-bar"></i></div>
      <button type="button" id="hf-rest-skip">CORTAR DESCANSO</button>
    </aside>
  `;
}

function outcomeLabel(value: string): string {
  switch (value) {
    case 'calibrated': return 'CALIBRADO';
    case 'progress_only': return 'PROGRESO';
    case 'awaiting_performance': return 'ESPERANDO PRUEBA';
    case 'awaiting_confidence': return 'ESPERANDO CONFIANZA';
    case 'maintenance': return 'MANTENIMIENTO';
    case 'stat_up': return 'STAT UP';
    default: return value.toUpperCase();
  }
}

function resultHtml(): string {
  if (!lastResult) {
    return '<div class="hf-training-empty">Completá la sesión real para convertirla en Evidencia → Estímulo → Progreso → Stat Up.</div>';
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
              <span>${outcomeLabel(o.outcome)}</span>
              <small>Estímulo ${o.stimulus.toFixed(2)}${o.statDelta ? ' · +1 consolidado' : ''}</small>
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
      <span>Evidencia <b>${lastResult.evidence.length}</b></span>
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

  const phase = HIGHFLY_4_WEEK_BLOCK[selectedWeek - 1];
  const prepMod = Math.round(readinessModifier(readinessPct) * 100);

  mount.innerHTML = `
    <section class="hf-training-header">
      <div>
        <span class="hf-eyebrow">[ HIGHFLY // SISTEMA DE ENTRENAMIENTO ]</span>
        <h3>RUTINA HIGHFLY · 5 DÍAS</h3>
        <p>${HF_HIGHFLY_PERSONAL_5D_V2_ID} · Bloque exacto 3+1 · 4 semanas</p>
      </div>
      <div class="hf-training-controls">
        <label>
          <span>SEMANA</span>
          <select id="hf-training-week">${weekOptions()}</select>
        </label>
        <label class="hf-readiness-control">
          <span>PREPARACIÓN <output id="hf-training-readiness-value">${readinessPct}% · ${readinessLabel(readinessPct)}</output></span>
          <input id="hf-training-readiness" type="range" min="60" max="100" step="10" value="${readinessPct}">
          <small>No cambia tus kilos · estímulo calculado ${prepMod}%</small>
        </label>
      </div>
    </section>

    <section class="hf-cycle-status">
      <div><span>BLOQUE</span><b>SEMANA ${phase.week}</b></div>
      <div><span>FASE</span><b>${phase.phase.toUpperCase()}</b></div>
      <div><span>RUTINA</span><b>EXACTA · ADJUNTA</b></div>
      <div><span>SECUENCIA</span><b>${dayComplete() ? 'COMPLETA' : 'ACTIVA'}</b></div>
    </section>

    ${calibrationPanel()}

    <section>
      <div class="hf-section-title">
        <h4>NÚCLEO HUNTER</h4>
        <span>STR / AGI / VIT / PER / INT sólo suben por entrenamiento real</span>
      </div>
      <div class="hf-core-grid">${coreCards()}</div>
    </section>

    <section>
      <div class="hf-section-title">
        <h4>SESIÓN</h4>
        <span>Ejercicios secuenciales · carga y descanso gobernados por el Sistema</span>
      </div>
      <div class="hf-training-days">${dayTabs()}</div>
      <div class="hf-exercise-list">${exerciseRows()}</div>
      <div class="hf-training-actions">
        <button type="button" id="hf-training-register" class="hf-primary-action" ${dayComplete() ? '' : 'disabled'}>
          ${dayComplete() ? 'REGISTRAR SESIÓN COMPLETA' : 'COMPLETÁ TODOS LOS EJERCICIOS'}
        </button>
        <small>HIGHFLY sólo registra sets realmente completados. Nunca completa una sesión por vos.</small>
      </div>
    </section>

    <section>
      <div class="hf-section-title">
        <h4>RESULTADO DEL SISTEMA</h4>
        <span>Evidencia · Estímulo · Fatiga · Performance Gate</span>
      </div>
      <div id="hf-training-result" class="hf-training-result">${resultHtml()}</div>
    </section>

    ${restDockHtml()}
  `;

  bindRenderedUi(mount);
  if (activeRest) paintRestDock();
}

function resetSessionProgress(): void {
  cancelActiveRest();
  completedSets.clear();
  restRecords.clear();
  lastResult = null;
  lastOutcomes = [];
}

function bindRenderedUi(mount: HTMLElement): void {
  mount.querySelectorAll<HTMLElement>('[data-hf-training-day]').forEach((button) => {
    bindTouchTap(button, (event) => {
      event.preventDefault();
      selectedDay = Number(button.dataset.hfTrainingDay) || 1;
      resetSessionProgress();
      render();
    });
  });

  const week = mount.querySelector('#hf-training-week');
  if (week instanceof HTMLSelectElement) {
    week.addEventListener('change', () => {
      selectedWeek = Math.max(1, Math.min(4, Number(week.value) || 1));
      resetSessionProgress();
      render();
    });
  }

  const readiness = mount.querySelector('#hf-training-readiness');
  if (readiness instanceof HTMLInputElement) {
    readiness.addEventListener('input', () => {
      readinessPct = Math.max(60, Math.min(100, Number(readiness.value) || 100));
      render();
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
      render();
    });
  });

  mount.querySelectorAll<HTMLElement>('[data-hf-set-complete]').forEach((button) => {
    bindTouchTap(button, (event) => {
      event.preventDefault();
      const exerciseId = button.dataset.hfSetComplete;
      const exercise = currentDay()?.exercises.find((candidate) => candidate.exerciseId === exerciseId);
      if (exercise) completeSet(exercise);
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

function numericInput(root: ParentNode, selector: string, fallback: number): number {
  const input = root.querySelector(selector);
  if (!(input instanceof HTMLInputElement)) return fallback;
  const value = Number(input.value);
  return Number.isFinite(value) ? value : fallback;
}

function saveCalibration(mount: HTMLElement): void {
  const profile = profileOrNull();
  if (!profile) return;
  const now = new Date().toISOString();
  const lifts = { ...(profile.training.loadCalibration?.lifts ?? {}) };

  for (const { id, defaultRm } of RM_FIELDS) {
    const value = Math.max(0, numericInput(mount, `[data-hf-rm="${id}"]`, defaultRm));
    if (value > 0) lifts[id] = { oneRmKg: value, updatedAt: now };
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
  calibrationOpen = false;
  resetSessionProgress();
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
        [exerciseId]: { kg, updatedAt: new Date().toISOString() },
      },
    },
  });
}

function completeSet(exercise: HighflyRoutineExercise): void {
  if (activeRest || !exerciseUnlocked(exercise)) return;
  const load = loadPlan(exercise);
  if (!load.ready) return;
  const total = setCount(exercise);
  const done = completedSetCount(exercise);
  if (done >= total) return;

  const next = done + 1;
  completedSets.set(exercise.exerciseId, next);

  if (next < total) {
    startRest(exercise);
  } else {
    render();
  }
}

function startRest(exercise: HighflyRoutineExercise): void {
  if (activeRest) return;
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
  render();
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
  const compliance = Math.max(0.55, Math.min(1, elapsed / activeRest.targetSec));
  const penalty = Math.round((1 - compliance) * 100);

  const label = dock.querySelector('#hf-rest-label');
  const clock = dock.querySelector('#hf-rest-clock');
  const message = dock.querySelector('#hf-rest-message');
  const skip = dock.querySelector<HTMLButtonElement>('#hf-rest-skip');
  const bar = dock.querySelector<HTMLElement>('#hf-rest-progress-bar');

  if (label) label.textContent = activeRest.label;
  if (clock) clock.textContent = restClockLabel(Math.ceil(remaining));
  if (message) {
    message.textContent = penalty > 0
      ? `Si cortás ahora: -${penalty}% de estímulo en el próximo set`
      : 'Recuperación óptima alcanzada';
  }
  if (skip) skip.textContent = penalty > 0 ? `CORTAR AHORA · -${penalty}%` : 'CONTINUAR';
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
  return Math.max(0, restRecords.get(exercise.exerciseId)?.[setIndex - 1] ?? 0);
}

function setLoadForExercise(exercise: HighflyRoutineExercise, plan: HighflySetPlan): number {
  if (exercise.authority === 'editable_accessory') return accessoryKg(exercise);
  return planLoadKg(plan, calibratedOneRm(profileOrNull(), exercise.rmLift));
}

function registerSession(): void {
  const day = currentDay();
  const profile = profileOrNull();
  if (!day || !profile || !dayComplete() || activeRest) return;

  const definitions = new Map<string, ExerciseDefinition>();
  const sets: SessionRecord['sets'][number][] = [];

  for (const exercise of day.exercises) {
    const plans = flattenSetPlans(exercise, selectedWeek);
    const load = loadPlan(exercise);
    if (!load.ready) return;

    definitions.set(exercise.exerciseId, {
      exerciseId: exercise.exerciseId,
      pattern: exercise.pattern,
      role: exercise.intent,
      loadMode: load.systemLoadKg > 0 ? 'external_kg' : 'bodyweight',
      rmReferenceKg: load.rmReferenceKg,
    });

    plans.forEach((plan, index) => {
      sets.push({
        setId: `${exercise.exerciseId}-${index + 1}`,
        exerciseId: exercise.exerciseId,
        reps: plan.reps,
        loadKg: setLoadForExercise(exercise, plan),
        restSec: restForSet(exercise, index),
        intent: exercise.intent,
        quality: 1,
      });
    });
  }

  const sessionId = `ui-${Date.now()}`;
  const pipeline = runTrainingSessionPipeline({
    profile,
    session: {
      sessionId,
      routineId: HF_HIGHFLY_PERSONAL_5D_V2_ID,
      block: selectedWeek === 4 ? 'Descarga' : 'Carga',
      week: selectedWeek,
      day: selectedDay,
      readiness: readinessPct / 100,
      isDeload: selectedWeek === 4,
      completed: true,
      sets,
    },
    definitions,
  });

  setActiveHighflyHunterProfile(pipeline.profile);
  refreshActiveTrainingCombatBridge();
  lastResult = pipeline.sessionResult;
  lastOutcomes = pipeline.outcomes;

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
  render();
}

export function installHighflyTrainingUi(): void {
  if (installed) return;
  installed = true;

  const trainingWindow = document.querySelector<HTMLElement>('#highfly-training-window');
  if (trainingWindow) {
    if (trainingWindow.parentElement !== document.body) {
      document.body.appendChild(trainingWindow);
    }

    const forceSystemViewport = () => {
      if (!document.body.classList.contains('mobile-touch')) return;
      trainingWindow.style.setProperty('position', 'fixed', 'important');
      trainingWindow.style.setProperty('left', '6px', 'important');
      trainingWindow.style.setProperty('top', '6px', 'important');
      trainingWindow.style.setProperty('right', '6px', 'important');
      trainingWindow.style.setProperty('bottom', '6px', 'important');
      trainingWindow.style.setProperty('width', 'calc(100vw - 12px)', 'important');
      trainingWindow.style.setProperty('height', 'calc(100vh - 12px)', 'important');
      trainingWindow.style.setProperty('max-width', 'none', 'important');
      trainingWindow.style.setProperty('max-height', 'none', 'important');
      trainingWindow.style.setProperty('transform', 'none', 'important');
      trainingWindow.style.setProperty('z-index', '95', 'important');
    };

    forceSystemViewport();
    window.addEventListener('resize', forceSystemViewport);
  }

  window.addEventListener('highfly:open-training', () => {
    resetSessionProgress();
    render();
  });

  render();
}
