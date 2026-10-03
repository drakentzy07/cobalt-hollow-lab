import { bindTouchTap } from '../../ui/touch_tap';
import type { ExerciseDefinition, SessionRecord } from './engine';
import type { HighflyHunterProfile, HighflyRmLiftId, HighflySex } from './core';
import {
  HIGHFLY_4_WEEK_CYCLE,
  HIGHFLY_PERSONAL_5D_ROUTINE,
  HF_HIGHFLY_PERSONAL_5D_V1_ID,
  isEditableAccessory,
  macrocycleWeek,
  plannedLoadKg,
  prescriptionForWeek,
  progressedTrainingMaxKg,
  rmLiftForExercise,
  restClockLabel,
  type HighflyRoutineExercise,
} from './personal_routine';
import {
  getActiveHighflyHunterProfile,
  setActiveHighflyHunterProfile,
} from './profile_store';
import { runTrainingSessionPipeline } from './pipeline';
import { refreshActiveTrainingCombatBridge } from './combat_runtime';
import {
  HIGHFLY_RM_LIFT_LABELS,
  HIGHFLY_RM_LIFT_ORDER,
  evaluationDaysRemaining,
  submitRmCalibration,
} from './rm_calibration';

let installed = false;
let selectedDay = 1;
let selectedWeek = 1;
let lastResult: ReturnType<typeof runTrainingSessionPipeline>['sessionResult'] | null = null;
let lastOutcomes: ReturnType<typeof runTrainingSessionPipeline>['outcomes'] = [];
let rmCalibrationMessage = '';
const restRecords = new Map<string, number[]>();
const completedSets = new Map<string, number>();

interface ActiveRestTimer {
  exerciseId: string;
  label: string;
  targetSec: number;
  startedAt: number;
  timerId: number;
}

let activeRest: ActiveRestTimer | null = null;

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

function cycleState(profile: HighflyHunterProfile | null) {
  return (
    profile?.training.cycleProgression ?? {
      currentCycle: 1,
      successfulCycles: 0,
      repeatedCycles: 0,
      lastDecision: null,
      completedSessions: [],
    }
  );
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
              ${state.calibrated ? 'BASE ESTABLECIDA' : 'EN CALIBRACIÓN'}
            </span>
          </div>
          <div class="hf-core-current">${state.current.toFixed(1)}</div>
          <div class="hf-core-meta">
            <span>Máximo <b>${state.peak.toFixed(1)}</b></span>
            <span>Progreso <b>${state.progress.toFixed(1)}</b></span>
            <span>Confianza <b>${Math.round(state.confidence * 100)}%</b></span>
          </div>
        </article>
      `;
    })
    .join('');
}

function weekOptions(): string {
  return HIGHFLY_4_WEEK_CYCLE.map(
    (week) =>
      `<option value="${week.week}" ${week.week === selectedWeek ? 'selected' : ''}>S${week.week} · ${week.block}</option>`,
  ).join('');
}

function dayTabs(): string {
  const state = cycleState(profileOrNull());
  return HIGHFLY_PERSONAL_5D_ROUTINE.map((day) => {
    const key = `${selectedWeek}:${day.day}`;
    const done = state.completedSessions.includes(key);
    return `
      <button
        type="button"
        class="hf-training-day ${day.day === selectedDay ? 'is-selected' : ''} ${done ? 'is-complete' : ''}"
        data-hf-training-day="${day.day}"
      >
        <span>DÍA ${day.day}${done ? ' · ✓' : ''}</span>
        <b>${escapeHtml(day.name)}</b>
      </button>
    `;
  }).join('');
}

function activeDayExercises(): HighflyRoutineExercise[] {
  const day = HIGHFLY_PERSONAL_5D_ROUTINE.find((candidate) => candidate.day === selectedDay);
  if (!day) return [];
  return day.exercises.filter((exercise) => prescriptionForWeek(exercise, selectedWeek) !== null);
}

function plannedSetCount(exercise: HighflyRoutineExercise): number {
  return prescriptionForWeek(exercise, selectedWeek)?.sets ?? 0;
}

function requiredRestCount(exercise: HighflyRoutineExercise): number {
  return Math.max(0, plannedSetCount(exercise) - 1);
}

function savedAccessoryKg(exerciseId: string): number {
  return profileOrNull()?.training.accessoryLoads?.[exerciseId]?.kg ?? 0;
}

function loadPlan(exercise: HighflyRoutineExercise): {
  ready: boolean;
  primary: string;
  secondary: string;
  systemLoadKg: number;
  editable: boolean;
  rmReferenceKg?: number;
} {
  const prescription = prescriptionForWeek(exercise, selectedWeek);
  if (!prescription) {
    return {
      ready: false,
      primary: 'SIN PRESCRIPCIÓN',
      secondary: 'No corresponde en esta semana',
      systemLoadKg: 0,
      editable: false,
    };
  }

  const profile = profileOrNull();
  const state = cycleState(profile);
  const liftId = rmLiftForExercise(exercise.exerciseId);
  const rmEntry = liftId ? profile?.training.loadCalibration?.lifts?.[liftId] : undefined;
  const calibratedOneRmKg = rmEntry?.oneRmKg;
  const systemKg = plannedLoadKg(
    exercise,
    selectedWeek,
    state.successfulCycles,
    calibratedOneRmKg,
  );
  const editable =
    isEditableAccessory(exercise) &&
    prescription.loadKg === undefined &&
    systemKg <= 0;
  const accessoryKg = editable ? savedAccessoryKg(exercise.exerciseId) : 0;
  const finalKg = editable ? accessoryKg : systemKg;
  const rmReferenceKg =
    progressedTrainingMaxKg(exercise, state.successfulCycles, calibratedOneRmKg) ?? undefined;

  if (editable) {
    return {
      ready: accessoryKg > 0,
      primary: accessoryKg > 0 ? `${accessoryKg} kg` : 'INGRESÁ EL PESO',
      secondary: 'Accesorio de la planilla · carga registrada por vos',
      systemLoadKg: accessoryKg,
      editable: true,
      rmReferenceKg,
    };
  }

  const percent =
    prescription.percent === undefined
      ? ''
      : ` · ${Math.round(prescription.percent * 100)}%`;
  return {
    ready: true,
    primary: finalKg > 0 ? `${finalKg} kg · ${prescription.sets}×${prescription.reps}` : `${prescription.sets}×${prescription.reps}`,
    secondary: rmReferenceKg
      ? `TM ${rmReferenceKg} kg${percent}${rmEntry ? (rmEntry.status === 'evaluation' ? ' · RM EN EVALUACIÓN' : ' · RM VERIFICADA') : ' · REFERENCIA INICIAL'}`
      : exercise.authority === 'system_fixed'
        ? 'Carga exacta de la rutina HIGHFLY'
        : 'Prescripción exacta de la rutina HIGHFLY',
    systemLoadKg: finalKg,
    editable: false,
    rmReferenceKg,
  };
}

function rmCalibrationPanel(): string {
  const profile = profileOrNull();
  if (!profile) return '';
  const calibration = profile.training.loadCalibration;
  const athlete = calibration?.athlete;
  const sex = athlete?.sex ?? 'male';
  const age = athlete?.ageYears ?? '';
  const bodyweight = athlete?.bodyweightKg ?? '';

  const rows = HIGHFLY_RM_LIFT_ORDER.map((lift) => {
    const entry = calibration?.lifts?.[lift];
    const days = entry ? evaluationDaysRemaining(entry) : 0;
    const status = !entry
      ? 'SIN CALIBRAR'
      : entry.status === 'evaluation'
        ? 'EVALUACIÓN · ' + days + 'D'
        : 'VERIFICADA';
    const authority = entry
      ? entry.oneRmKg.toFixed(1) + ' kg e1RM efectiva'
      : '2–6 reps · fórmula Epley';
    const raw = entry?.estimatedOneRmKg
      ? 'Última estimación ' + entry.estimatedOneRmKg.toFixed(1) + ' kg'
      : 'Nunca ingresás un 1RM manual';

    return [
      '<article class="hf-rm-card ' + (entry?.status === 'evaluation' ? 'is-evaluation' : '') + '">',
      '<div class="hf-rm-card__head"><strong>' + escapeHtml(HIGHFLY_RM_LIFT_LABELS[lift]) + '</strong><span>' + status + '</span></div>',
      '<div class="hf-rm-authority"><b>' + authority + '</b><small>' + raw + '</small></div>',
      '<div class="hf-rm-inputs">',
      '<label><span>PESO</span><input data-hf-rm-load="' + lift + '" type="number" inputmode="decimal" min="0" step="0.5" placeholder="kg"></label>',
      '<label><span>REPS</span><select data-hf-rm-reps="' + lift + '"><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5" selected>5</option><option value="6">6</option></select></label>',
      '<button type="button" data-hf-rm-submit="' + lift + '">' + (entry?.status === 'evaluation' ? 'REGISTRAR EVIDENCIA' : entry ? 'ACTUALIZAR' : 'CALIBRAR') + '</button>',
      '</div></article>',
    ].join('');
  }).join('');

  return [
    '<section class="hf-calibration is-open hf-rm-calibration">',
    '<div class="hf-system-line"><span>CALIBRACIÓN DE FUERZA</span><b>e1RM · EPLEY · 2–6 REPS</b></div>',
    '<div class="hf-calibration-body">',
    '<p>Cargás una serie real de 2 a 6 repeticiones. HIGHFLY calcula el e1RM: nunca escribís un máximo manual. Sexo, edad y peso corporal sólo sirven para detectar valores extraordinarios; no regalan ni quitan Core Stats.</p>',
    '<div class="hf-athlete-calibration">',
    '<label><span>SEXO</span><select id="hf-rm-sex"><option value="male" ' + (sex === 'male' ? 'selected' : '') + '>Masculino</option><option value="female" ' + (sex === 'female' ? 'selected' : '') + '>Femenino</option></select></label>',
    '<label><span>EDAD</span><input id="hf-rm-age" type="number" inputmode="numeric" min="14" max="100" value="' + age + '" placeholder="años"></label>',
    '<label><span>PESO CORPORAL</span><input id="hf-rm-bodyweight" type="number" inputmode="decimal" min="30" max="350" step="0.1" value="' + bodyweight + '" placeholder="kg"></label>',
    '</div>',
    '<small class="hf-rm-rule">Marca extraordinaria = 7 días en evaluación. Mientras tanto se congela una autoridad moderada; una segunda evidencia compatible libera el valor completo.</small>',
    rmCalibrationMessage ? '<div class="hf-rm-message">' + escapeHtml(rmCalibrationMessage) + '</div>' : '',
    '<div class="hf-rm-grid">' + rows + '</div>',
    '</div></section>',
  ].join('');
}

function cyclePanel(): string {
  const state = cycleState(profileOrNull());
  const decision =
    state.lastDecision === 'advance'
      ? 'ÚLTIMO CICLO: SUPERADO · CARGAS AUMENTADAS'
      : state.lastDecision === 'repeat'
        ? 'ÚLTIMO CICLO: REPETIR · MISMAS CARGAS'
        : 'PRIMER CICLO EN CURSO';

  return `
    <section class="hf-calibration is-open">
      <div class="hf-system-line">
        <span>CICLO ADAPTATIVO</span>
        <b>CICLO ${state.currentCycle}</b>
      </div>
      <div class="hf-calibration-body">
        <p>
          HIGHFLY usa bloques de <b>4 semanas</b>: 3 de carga + 1 de descarga.
          Si el bloque sale bien, el próximo aumenta un poco las cargas.
          Si no, se repite con los mismos kilos.
        </p>
        <div class="hf-cycle-status">
          <div><span>CICLOS SUPERADOS</span><b>${state.successfulCycles}</b></div>
          <div><span>CICLOS REPETIDOS</span><b>${state.repeatedCycles}</b></div>
          <div><span>SESIONES DEL BLOQUE</span><b>${state.completedSessions.length}/20</b></div>
          <div><span>ESTADO</span><b>${decision}</b></div>
        </div>
      </div>
    </section>
  `;
}

function exerciseRows(): string {
  const exercises = activeDayExercises();
  const firstIncomplete = exercises.findIndex(
    (exercise) => (completedSets.get(exercise.exerciseId) ?? 0) < plannedSetCount(exercise),
  );

  return exercises
    .map((exercise, index) => {
      const prescription = prescriptionForWeek(exercise, selectedWeek);
      if (!prescription) return '';
      const load = loadPlan(exercise);
      const doneSets = completedSets.get(exercise.exerciseId) ?? 0;
      const totalSets = prescription.sets;
      const finished = doneSets >= totalSets;
      const lockedBySequence = firstIncomplete >= 0 && index > firstIncomplete;
      const active = !finished && !lockedBySequence;
      const restDone = restRecords.get(exercise.exerciseId)?.length ?? 0;
      const restNeeded = requiredRestCount(exercise);
      const resting = activeRest?.exerciseId === exercise.exerciseId;

      let actionText = 'BLOQUEADO · COMPLETÁ EL EJERCICIO ANTERIOR';
      if (finished) actionText = 'EJERCICIO COMPLETADO ✓';
      else if (!load.ready) actionText = 'INGRESÁ LA CARGA PARA CONTINUAR';
      else if (resting) actionText = 'RECUPERACIÓN EN CURSO';
      else if (active) actionText = `COMPLETAR SET ${doneSets + 1}/${totalSets}`;

      return `
        <article class="hf-exercise ${lockedBySequence || !load.ready ? 'is-blocked' : ''} ${finished ? 'is-complete' : ''}" data-exercise-id="${exercise.exerciseId}">
          <div class="hf-exercise__head">
            <div>
              <span class="hf-exercise-code">D${selectedDay} // ${exercise.intent.toUpperCase()}</span>
              <strong>${escapeHtml(exercise.label)}</strong>
              <small>${prescription.sets}×${prescription.reps}${exercise.target ? ` · ${escapeHtml(exercise.target)}` : ''}</small>
            </div>
            <span class="hf-intent">${finished ? 'COMPLETO' : active ? 'ACTIVO' : 'BLOQUEADO'}</span>
          </div>

          <div class="hf-exercise-system">
            <div class="hf-prescription">
              <span>CARGA</span>
              <b>${escapeHtml(load.primary)}</b>
              <small>${escapeHtml(load.secondary)}</small>
            </div>
            <div class="hf-prescription">
              <span>RECUPERACIÓN</span>
              <b>${restClockLabel(exercise.restSec)}</b>
              <small>${restDone}/${restNeeded} descansos registrados</small>
            </div>
            ${
              load.editable
                ? `<label class="hf-accessory-load">
                    <span>PESO USADO</span>
                    <input
                      data-hf-accessory-load="${exercise.exerciseId}"
                      type="number"
                      inputmode="decimal"
                      min="0"
                      step="0.5"
                      value="${savedAccessoryKg(exercise.exerciseId) || ''}"
                      placeholder="kg"
                    >
                  </label>`
                : `<div class="hf-lock-chip"><span>🔒</span><b>PLAN HIGHFLY</b></div>`
            }
          </div>

          <div class="hf-rest-actions">
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
      </div>
      <div class="hf-rest-clock" id="hf-rest-clock">00:00</div>
      <div class="hf-rest-progress"><i id="hf-rest-progress-bar"></i></div>
      <small id="hf-rest-status">RECUPERACIÓN ÓPTIMA EN PROGRESO</small>
      <button type="button" id="hf-rest-skip">CONTINUAR ANTES DE TIEMPO</button>
    </aside>
  `;
}

function resultHtml(): string {
  if (!lastResult) {
    return `
      <div class="hf-training-empty">
        La sesión real alimenta <b>Evidencia → Estímulo → Progreso → Puerta de Rendimiento</b>.
        PER mide constancia/precisión; INT mide gestión de carga y recuperación.
      </div>
    `;
  }

  const s = lastResult.stimulus;
  const behavior = lastResult.behavioralPerformance;
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
      <span>Evidencias <b>${lastResult.evidence.length}</b></span>
      <span>Tonelaje <b>${lastResult.diagnosticTonnageKg.toFixed(1)} kg</b></span>
      <span>PER sesión <b>${Math.round(behavior.PER)}%</b></span>
      <span>INT sesión <b>${Math.round(behavior.INT)}%</b></span>
      <span>Descanso real <b>${Math.round(behavior.rest * 100)}%</b></span>
    </div>
    ${outcomes}
  `;
}

function allExercisesComplete(): boolean {
  const exercises = activeDayExercises();
  return (
    exercises.length > 0 &&
    exercises.every(
      (exercise) =>
        (completedSets.get(exercise.exerciseId) ?? 0) >= plannedSetCount(exercise),
    )
  );
}

function sessionAlreadyRegistered(): boolean {
  return cycleState(profileOrNull()).completedSessions.includes(`${selectedWeek}:${selectedDay}`);
}

function render(): void {
  const mount = document.querySelector('#highfly-training-window .highfly-training-shell');
  if (!(mount instanceof HTMLElement)) return;

  const plan = macrocycleWeek(selectedWeek);
  const state = cycleState(profileOrNull());
  const sessionDone = sessionAlreadyRegistered();

  mount.innerHTML = `
    <section class="hf-training-header">
      <div>
        <span class="hf-eyebrow">[ HIGHFLY // SISTEMA DE ENTRENAMIENTO ]</span>
        <h3>RUTINA HIGHFLY · 5D</h3>
        <p>${HF_HIGHFLY_PERSONAL_5D_V1_ID} · Ciclo ${state.currentCycle} · 4 semanas</p>
      </div>
      <div class="hf-training-controls">
        <label>
          <span>SEMANA</span>
          <select id="hf-training-week">${weekOptions()}</select>
        </label>
      </div>
    </section>

    <section class="hf-cycle-status">
      <div><span>FASE</span><b>${plan.block.toUpperCase()}</b></div>
      <div><span>OBJETIVO</span><b>${escapeHtml(plan.objective)}</b></div>
      <div><span>PER</span><b>CONSTANCIA + PRECISIÓN</b></div>
      <div><span>INT</span><b>GESTIÓN + RECUPERACIÓN</b></div>
    </section>

    ${rmCalibrationPanel()}

    ${cyclePanel()}

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
        <span>Completá cada ejercicio para desbloquear el siguiente</span>
      </div>
      <div class="hf-training-days">${dayTabs()}</div>
      <div class="hf-exercise-list">${exerciseRows()}</div>
      <div class="hf-training-actions">
        <button
          type="button"
          id="hf-training-register"
          class="hf-primary-action"
          ${!allExercisesComplete() || sessionDone ? 'disabled' : ''}
        >
          ${sessionDone ? 'SESIÓN YA REGISTRADA ✓' : allExercisesComplete() ? 'REGISTRAR SESIÓN COMPLETA' : 'COMPLETÁ LA SESIÓN PARA REGISTRAR'}
        </button>
        <small>
          No existe Readiness manual: el sistema usa lo que realmente completaste, el orden y los descansos medidos.
        </small>
      </div>
    </section>

    <section>
      <div class="hf-section-title">
        <h4>RESULTADO DEL SISTEMA</h4>
        <span>Evidencia · Estímulo · Fatiga · Puerta de Rendimiento</span>
      </div>
      <div id="hf-training-result" class="hf-training-result">${resultHtml()}</div>
    </section>

    ${restDockHtml()}
  `;

  bindRenderedUi(mount);
  if (activeRest) paintRestDock();
}

function resetVisibleSession(): void {
  cancelActiveRest();
  restRecords.clear();
  completedSets.clear();
  lastResult = null;
  lastOutcomes = [];
}

function bindRenderedUi(mount: HTMLElement): void {
  mount.querySelectorAll<HTMLElement>('[data-hf-training-day]').forEach((button) => {
    bindTouchTap(button, (event) => {
      event.preventDefault();
      resetVisibleSession();
      selectedDay = Number(button.dataset.hfTrainingDay) || 1;
      render();
    });
  });

  const week = mount.querySelector('#hf-training-week');
  if (week instanceof HTMLSelectElement) {
    week.addEventListener('change', () => {
      resetVisibleSession();
      selectedWeek = Math.max(1, Math.min(4, Number(week.value) || 1));
      render();
    });
  }

  mount.querySelectorAll<HTMLElement>('[data-hf-rm-submit]').forEach((button) => {
    bindTouchTap(button, (event) => {
      event.preventDefault();
      const profile = profileOrNull();
      const lift = button.dataset.hfRmSubmit as HighflyRmLiftId | undefined;
      const sexEl = mount.querySelector<HTMLSelectElement>('#hf-rm-sex');
      const ageEl = mount.querySelector<HTMLInputElement>('#hf-rm-age');
      const bodyweightEl = mount.querySelector<HTMLInputElement>('#hf-rm-bodyweight');
      if (!profile || !lift || !sexEl || !ageEl || !bodyweightEl) return;
      const loadEl = mount.querySelector<HTMLInputElement>('[data-hf-rm-load="' + lift + '"]');
      const repsEl = mount.querySelector<HTMLSelectElement>('[data-hf-rm-reps="' + lift + '"]');
      if (!loadEl || !repsEl) return;
      try {
        const result = submitRmCalibration(profile, lift, {
          sex: sexEl.value as HighflySex,
          ageYears: Number(ageEl.value),
          bodyweightKg: Number(bodyweightEl.value),
          loadKg: Number(loadEl.value),
          reps: Number(repsEl.value),
        });
        setActiveHighflyHunterProfile(result.profile);
        rmCalibrationMessage = HIGHFLY_RM_LIFT_LABELS[lift] + ' · ' + result.reason;
        render();
      } catch (err) {
        rmCalibrationMessage = err instanceof Error ? err.message : String(err);
        render();
      }
    });
  });

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
      const exercise = activeDayExercises().find(
        (candidate) => candidate.exerciseId === exerciseId,
      );
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
      if (allExercisesComplete() && !sessionAlreadyRegistered()) registerSession();
    });
  }
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

function completeSet(exercise: HighflyRoutineExercise): void {
  if (activeRest) return;
  const total = plannedSetCount(exercise);
  const done = completedSets.get(exercise.exerciseId) ?? 0;
  if (done >= total) return;

  const load = loadPlan(exercise);
  if (!load.ready) return;

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
  const status = dock.querySelector('#hf-rest-status');
  if (label) label.textContent = activeRest.label;
  if (clock) clock.textContent = restClockLabel(Math.ceil(remaining));
  if (bar) bar.style.width = `${Math.round(progress * 100)}%`;
  if (status) {
    status.textContent =
      progress >= 1
        ? 'RECUPERACIÓN COMPLETA'
        : 'RECUPERACIÓN ÓPTIMA EN PROGRESO';
  }
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

function withCycleSession(
  profile: HighflyHunterProfile,
  sessionId: string,
): HighflyHunterProfile {
  const previous = cycleState(profile);
  const key = `${selectedWeek}:${selectedDay}`;
  const completedSessions = previous.completedSessions.includes(key)
    ? previous.completedSessions
    : [...previous.completedSessions, key];

  let next = {
    ...previous,
    completedSessions,
  };

  // Week 4 / Day 5 closes the block. "Va bien" means strong adherence plus
  // sustained PER/INT behavior. Otherwise the next attempt repeats the same loads.
  if (selectedWeek === 4 && selectedDay === 5) {
    const prefix = `cycle-${previous.currentCycle}-`;
    const history = (profile.training.history ?? []).filter((entry) =>
      entry.sessionId.startsWith(prefix),
    );
    const behavioral = (stat: 'PER' | 'INT') =>
      history
        .filter((entry) => entry.stat === stat && typeof entry.performanceIndex === 'number')
        .map((entry) => entry.performanceIndex as number);
    const per = behavioral('PER');
    const int = behavioral('INT');
    const average = (values: number[]) =>
      values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

    const attendance = completedSessions.length / 20;
    const success =
      attendance >= 0.9 &&
      average(per) >= 90 &&
      average(int) >= 85;

    next = {
      currentCycle: previous.currentCycle + 1,
      successfulCycles: previous.successfulCycles + (success ? 1 : 0),
      repeatedCycles: previous.repeatedCycles + (success ? 0 : 1),
      lastDecision: success ? ('advance' as const) : ('repeat' as const),
      completedSessions: [],
    };
  }

  return {
    ...profile,
    training: {
      ...profile.training,
      cycleProgression: next,
    },
  };
}

function registerSession(): void {
  const profile = profileOrNull();
  const exercises = activeDayExercises();
  if (!profile || exercises.length === 0 || !allExercisesComplete()) return;

  cancelActiveRest();

  const state = cycleState(profile);
  const definitions = new Map<string, ExerciseDefinition>();
  const sets: SessionRecord['sets'][number][] = [];
  let plannedSets = 0;

  for (const exercise of exercises) {
    const prescription = prescriptionForWeek(exercise, selectedWeek);
    if (!prescription) continue;
    const load = loadPlan(exercise);
    if (!load.ready) return;

    definitions.set(exercise.exerciseId, {
      exerciseId: exercise.exerciseId,
      pattern: exercise.pattern,
      role: exercise.intent,
      loadMode: load.systemLoadKg > 0 ? 'external_kg' : 'bodyweight',
      rmReferenceKg: load.rmReferenceKg,
    });

    plannedSets += prescription.sets;
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
  }

  const cycle = macrocycleWeek(selectedWeek);
  const sessionId = `cycle-${state.currentCycle}-w${selectedWeek}-d${selectedDay}-${Date.now()}`;

  const pipeline = runTrainingSessionPipeline({
    profile,
    session: {
      sessionId,
      routineId: HF_HIGHFLY_PERSONAL_5D_V1_ID,
      block: cycle.block,
      week: selectedWeek,
      day: selectedDay,
      readiness: 1,
      isDeload: cycle.block === 'Descarga',
      completed: true,
      sets,
      plannedSets,
      completedSets: plannedSets,
      plannedExercises: exercises.length,
      completedExercises: exercises.length,
      sequentialCompletion: true,
      prescriptionCompliance: 1,
    },
    definitions,
  });

  const cycledProfile = withCycleSession(pipeline.profile, sessionId);
  setActiveHighflyHunterProfile(cycledProfile);
  refreshActiveTrainingCombatBridge();
  lastResult = pipeline.sessionResult;
  lastOutcomes = pipeline.outcomes;

  window.dispatchEvent(
    new CustomEvent('highfly:training-session-committed', {
      detail: {
        sessionId,
        week: selectedWeek,
        day: selectedDay,
        cycle: state.currentCycle,
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

  // Desktop microbar is rebuilt after this installer can run. Delegate from
  // document so the Training entry works regardless of HUD mount order.
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element) || !target.closest('#mm-training')) return;
    event.preventDefault();
    trainingWindow?.removeAttribute('hidden');
    window.dispatchEvent(new CustomEvent('highfly:open-training'));
  });

  window.addEventListener('highfly:open-training', () => {
    if (trainingWindow && document.body.classList.contains('mobile-touch')) {
      trainingWindow.style.setProperty('width', 'calc(100vw - 12px)', 'important');
      trainingWindow.style.setProperty('height', 'calc(100vh - 12px)', 'important');
    }
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
