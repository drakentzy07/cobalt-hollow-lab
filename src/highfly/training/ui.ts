import { bindTouchTap } from '../../ui/touch_tap';
import type { ExerciseDefinition, SessionRecord } from './engine';
import {
  allocateTrainingPoints,
  type HighflyCoreStat,
  type HighflyHunterProfile,
  type HighflyRmLiftId,
  type HighflySex,
} from './core';
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
  acceptAccessorySuggestion,
  defaultAccessoryStepKg,
  inferAccessoryEquipmentKind,
  markAccessoryRepeat,
  normalizeAccessoryEntry,
  recordAccessoryCompletion,
} from './accessory_adaptation';
import {
  HIGHFLY_RM_LIFT_LABELS,
  HIGHFLY_RM_LIFT_ORDER,
  evaluationDaysRemaining,
  submitRmCalibration,
} from './rm_calibration';
import { progressCostForCurrent } from './adaptation';
import {
  canTrainCycleSession,
  cycleSessionKey,
  cycleWeekComplete,
  normalizeCycleProgression,
  restartCurrentCycle,
  unlockNextCycleWeek,
} from './cycle_control';

let installed = false;
let selectedDay = 1;
let selectedWeek = 1;
let lastResult: ReturnType<typeof runTrainingSessionPipeline>['sessionResult'] | null = null;
let lastOutcomes: ReturnType<typeof runTrainingSessionPipeline>['outcomes'] = [];
let rmCalibrationMessage = '';
let cycleResetArmed = false;
let cycleResetMessage = '';
const rmDrafts = new Map<HighflyRmLiftId, { load: string; reps: number }>();
let rmAthleteDraft: { sex?: HighflySex; age?: string; bodyweight?: string } = {};
const restRecords = new Map<string, number[]>();
const completedSets = new Map<string, number>();
const skippedExercises = new Set<string>();

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
  return normalizeCycleProgression(profile);
}

function selectedSessionTrainable(): boolean {
  return canTrainCycleSession(cycleState(profileOrNull()), selectedWeek, selectedDay);
}

function coreCards(): string {
  const profile = profileOrNull();
  if (!profile) {
    return '<div class="hf-training-empty">Entrá con tu Hunter para ver el Training Core.</div>';
  }
  const available = profile.training.points.available;
  const step = available > 1e-8 ? Math.min(0.1, available) : 0;
  return (['STR', 'AGI', 'VIT', 'PER', 'INT'] as const)
    .map((stat) => {
      const state = profile.training.core[stat];
      return `
        <article class="hf-core-card">
          <div class="hf-core-card__top">
            <strong>${stat}</strong>
            <span class="hf-core-badge ${state.calibrated ? 'is-ready' : ''}">
              ${profile.awakening.initialized ? (state.calibrated ? 'CORE + TRAINING' : 'DESPERTAR ACTIVO') : 'SIN DESPERTAR'}
            </span>
          </div>
          <div class="hf-core-current">${state.current.toFixed(2)}</div>
          <div class="hf-core-source">
            <span>DESPERTAR <b>${state.awakeningBase.toFixed(2)}</b></span>
            <span>NIVEL <b>+${state.naturalLevelGrowth.toFixed(2)}</b></span>
            <span>TRAINING <b>+${state.trainingAllocated.toFixed(2)}</b></span>
          </div>
          <div class="hf-core-meta">
            <span>Máximo <b>${state.peak.toFixed(2)}</b></span>
            <span>Adaptación <b>${state.progress.toFixed(1)} / ${progressCostForCurrent(state.current).toFixed(1)}</b></span>
            <span>Puerta <b>${Math.min(100, Math.round((state.progress / progressCostForCurrent(state.current)) * 100))}%</b></span>
            <span>Confianza <b>${Math.round(state.confidence * 100)}%</b></span>
          </div>
          <button
            type="button"
            class="hf-core-allocate"
            data-hf-tp-allocate="${stat}"
            data-hf-tp-amount="${step}"
            ${step <= 0 ? 'disabled' : ''}
          >
            ${step > 0 ? `ASIGNAR +${step.toFixed(2)} TP` : 'SIN TP DISPONIBLES'}
          </button>
        </article>
      `;
    })
    .join('');
}

function weekOptions(): string {
  const state = cycleState(profileOrNull());
  return HIGHFLY_4_WEEK_CYCLE.map((week) => {
    const label =
      week.week === state.activeWeek
        ? `S${week.week} · ${week.block} · ACTIVA`
        : week.week < state.activeWeek
          ? `S${week.week} · ${week.block} · COMPLETADA`
          : `S${week.week} · ${week.block} · SOLO VISTA`;
    return `<option value="${week.week}" ${week.week === selectedWeek ? 'selected' : ''}>${label}</option>`;
  }).join('');
}

function dayTabs(): string {
  const state = cycleState(profileOrNull());
  return HIGHFLY_PERSONAL_5D_ROUTINE.map((day) => {
    const key = cycleSessionKey(selectedWeek, day.day);
    const done = state.completedSessions.includes(key);
    const viewOnly = selectedWeek !== state.activeWeek;
    return `
      <button
        type="button"
        class="hf-training-day ${day.day === selectedDay ? 'is-selected' : ''} ${done ? 'is-complete' : ''} ${viewOnly ? 'is-view-only' : ''}"
        data-hf-training-day="${day.day}"
        ${activeRest ? 'disabled' : ''}
      >
        <span>DÍA ${day.day}${done ? ' · ✓' : viewOnly ? ' · SOLO VISTA' : ''}</span>
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

function exerciseTerminal(exercise: HighflyRoutineExercise): boolean {
  return (
    skippedExercises.has(exercise.exerciseId) ||
    (completedSets.get(exercise.exerciseId) ?? 0) >= plannedSetCount(exercise)
  );
}

function canActOnExercise(exercise: HighflyRoutineExercise): boolean {
  if (!selectedSessionTrainable() || activeRest || exerciseTerminal(exercise)) return false;
  const exercises = activeDayExercises();
  const index = exercises.findIndex(
    (candidate) => candidate.exerciseId === exercise.exerciseId,
  );
  if (index < 0) return false;
  return exercises.slice(0, index).every(exerciseTerminal);
}

function savedAccessoryEntry(exerciseId: string) {
  return profileOrNull()?.training.accessoryLoads?.[exerciseId];
}

function savedAccessoryKg(exerciseId: string): number {
  return savedAccessoryEntry(exerciseId)?.kg ?? 0;
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

  if (exercise.authority === 'system_percent' && liftId && !rmEntry) {
    return {
      ready: false,
      primary: 'CALIBRÁ TU e1RM',
      secondary: HIGHFLY_RM_LIFT_LABELS[liftId] + ' · 2–6 reps para calcular la carga',
      systemLoadKg: 0,
      editable: false,
    };
  }

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
  const sex = rmAthleteDraft.sex ?? athlete?.sex ?? 'male';
  const age = rmAthleteDraft.age ?? (athlete?.ageYears?.toString() ?? '');
  const bodyweight = rmAthleteDraft.bodyweight ?? (athlete?.bodyweightKg?.toString() ?? '');

  const rows = HIGHFLY_RM_LIFT_ORDER.map((lift) => {
    const entry = calibration?.lifts?.[lift];
    const draft = rmDrafts.get(lift) ?? { load: '', reps: 5 };
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
      '<label><span>PESO</span><input data-hf-rm-load="' + lift + '" type="number" inputmode="decimal" min="0" step="0.5" value="' + escapeHtml(draft.load) + '" placeholder="kg"></label>',
      '<label><span>REPS</span><select data-hf-rm-reps="' + lift + '"><option value="2" ' + (draft.reps === 2 ? 'selected' : '') + '>2</option><option value="3" ' + (draft.reps === 3 ? 'selected' : '') + '>3</option><option value="4" ' + (draft.reps === 4 ? 'selected' : '') + '>4</option><option value="5" ' + (draft.reps === 5 ? 'selected' : '') + '>5</option><option value="6" ' + (draft.reps === 6 ? 'selected' : '') + '>6</option></select></label>',
      '<button type="button" data-hf-rm-submit="' + lift + '">' + (entry?.status === 'evaluation' ? 'REGISTRAR EVIDENCIA' : entry ? 'ACTUALIZAR' : 'CALIBRAR') + '</button>',
      '</div></article>',
    ].join('');
  }).join('');

  return [
    '<section class="hf-calibration is-open hf-rm-calibration">',
    '<div class="hf-system-line"><span>CALIBRACIÓN DE FUERZA</span><b>e1RM · EPLEY · 2–6 REPS</b></div>',
    '<div class="hf-calibration-body">',
    '<p>Cargás una serie real de 2 a 6 repeticiones. HIGHFLY calcula el e1RM: nunca escribís un máximo manual. Sexo y edad sólo sirven para detectar valores extraordinarios. El peso corporal normaliza la fuerza relativa; ninguno otorga Core Stats por sí solo.</p>',
    '<div class="hf-athlete-calibration">',
    '<label><span>SEXO</span><select id="hf-rm-sex"><option value="male" ' + (sex === 'male' ? 'selected' : '') + '>Masculino</option><option value="female" ' + (sex === 'female' ? 'selected' : '') + '>Femenino</option></select></label>',
    '<label><span>EDAD</span><input id="hf-rm-age" type="number" inputmode="numeric" min="14" max="100" value="' + escapeHtml(age) + '" placeholder="años"></label>',
    '<label><span>PESO CORPORAL</span><input id="hf-rm-bodyweight" type="number" inputmode="decimal" min="30" max="350" step="0.1" value="' + escapeHtml(bodyweight) + '" placeholder="kg"></label>',
    '</div>',
    '<small class="hf-rm-rule">Marca extraordinaria = 7 días en evaluación. Mientras tanto se congela una autoridad moderada; una segunda evidencia compatible libera el valor completo.</small>',
    rmCalibrationMessage ? '<div class="hf-rm-message">' + escapeHtml(rmCalibrationMessage) + '</div>' : '',
    '<div class="hf-rm-grid">' + rows + '</div>',
    '<button type="button" id="hf-rm-submit-all" class="hf-primary-action">CALIBRAR TODOS LOS CARGADOS</button>',
    '</div></section>',
  ].join('');
}

function cyclePanel(): string {
  const state = cycleState(profileOrNull());
  const weekComplete = cycleWeekComplete(state, state.activeWeek);
  const canUnlock = weekComplete && state.activeWeek < 4;
  const decision =
    state.lastDecision === 'advance'
      ? 'ÚLTIMO CICLO: SUPERADO · CARGAS AUMENTADAS'
      : state.lastDecision === 'repeat'
        ? 'ÚLTIMO CICLO: REPETIR · MISMAS CARGAS'
        : 'CICLO EN CURSO';

  return `
    <section class="hf-calibration is-open">
      <div class="hf-system-line">
        <span>CICLO ADAPTATIVO</span>
        <b>CICLO ${state.currentCycle} · SEMANA ACTIVA S${state.activeWeek}</b>
      </div>
      <div class="hf-calibration-body">
        <p>
          HIGHFLY usa bloques de <b>4 semanas</b>: 3 de carga + 1 de descarga.
          Cada día sólo puede registrarse una vez. Las semanas futuras pueden verse,
          pero no ejecutarse hasta que habilites la siguiente.
        </p>
        <div class="hf-cycle-status">
          <div><span>CICLOS SUPERADOS</span><b>${state.successfulCycles}</b></div>
          <div><span>CICLOS REPETIDOS</span><b>${state.repeatedCycles}</b></div>
          <div><span>SESIONES DEL BLOQUE</span><b>${state.completedSessions.length}/20</b></div>
          <div><span>ESTADO</span><b>${decision}</b></div>
        </div>
        ${canUnlock ? `<button type="button" id="hf-enable-next-week" class="hf-primary-action">HABILITAR SEMANA ${state.activeWeek + 1}</button>` : ''}
        <button type="button" id="hf-cycle-reset-arm" class="hf-secondary-action" ${activeRest ? 'disabled' : ''}>REINICIAR CICLO</button>
        ${cycleResetArmed ? `
          <div class="hf-cycle-reset-confirm">
            <b>[ SISTEMA // REINICIO DE CICLO ]</b>
            <p>¿REALMENTE DESEÁS COMENZAR DE NUEVO EL CICLO PROPUESTO POR EL SISTEMA HIGHFLY?</p>
            <label><span>MOTIVO OBLIGATORIO</span><input id="hf-cycle-reset-reason" type="text" maxlength="160" placeholder="Ej.: viaje, enfermedad, interrupción del bloque"></label>
            ${cycleResetMessage ? `<small>${escapeHtml(cycleResetMessage)}</small>` : ''}
            <div>
              <button type="button" id="hf-cycle-reset-cancel">CANCELAR</button>
              <button type="button" id="hf-cycle-reset-confirm">CONFIRMAR REINICIO</button>
            </div>
          </div>
        ` : ''}
      </div>
    </section>
  `;
}

function exerciseRows(): string {
  const exercises = activeDayExercises();
  const firstIncomplete = exercises.findIndex((exercise) => !exerciseTerminal(exercise));

  return exercises
    .map((exercise, index) => {
      const prescription = prescriptionForWeek(exercise, selectedWeek);
      if (!prescription) return '';
      const load = loadPlan(exercise);
      const doneSets = completedSets.get(exercise.exerciseId) ?? 0;
      const totalSets = prescription.sets;
      const skipped = skippedExercises.has(exercise.exerciseId);
      const finished = doneSets >= totalSets;
      const lockedSession = !selectedSessionTrainable();
      const lockedBySequence = firstIncomplete >= 0 && index > firstIncomplete;
      const active = !lockedSession && !finished && !skipped && !lockedBySequence;
      const restDone = restRecords.get(exercise.exerciseId)?.length ?? 0;
      const restNeeded = requiredRestCount(exercise);
      const resting = activeRest?.exerciseId === exercise.exerciseId;
      const accessory = load.editable ? savedAccessoryEntry(exercise.exerciseId) : undefined;
      const accessoryKind =
        accessory?.equipmentKind ?? inferAccessoryEquipmentKind(exercise.exerciseId);
      const accessoryStep =
        accessory?.progressionStepKg ?? defaultAccessoryStepKg(accessoryKind);
      const accessorySuggestion = accessory?.nextSuggestedKg ?? 0;

      let actionText = 'BLOQUEADO · COMPLETÁ O SALTÁ EL EJERCICIO ANTERIOR';
      if (sessionAlreadyRegistered()) actionText = 'DÍA REGISTRADO · SESIÓN CERRADA ✓';
      else if (selectedWeek !== cycleState(profileOrNull()).activeWeek) actionText = 'SOLO VISTA · SEMANA NO HABILITADA';
      else if (skipped) actionText = 'EJERCICIO SALTADO';
      else if (finished) actionText = 'EJERCICIO COMPLETADO ✓';
      else if (!load.ready) actionText = 'INGRESÁ LA CARGA PARA CONTINUAR';
      else if (resting) actionText = 'RECUPERACIÓN EN CURSO';
      else if (active) actionText = `COMPLETAR SET ${doneSets + 1}/${totalSets}`;

      return `
        <article class="hf-exercise ${lockedSession || lockedBySequence || !load.ready ? 'is-blocked' : ''} ${finished || sessionAlreadyRegistered() ? 'is-complete' : ''} ${skipped ? 'is-skipped' : ''}" data-exercise-id="${exercise.exerciseId}">
          <div class="hf-exercise__head">
            <div>
              <span class="hf-exercise-code">D${selectedDay} // ${exercise.intent.toUpperCase()}</span>
              <strong>${escapeHtml(exercise.label)}</strong>
              <small>${prescription.sets}×${prescription.reps}${exercise.target ? ` · ${escapeHtml(exercise.target)}` : ''}</small>
            </div>
            <span class="hf-intent">${skipped ? 'SALTADO' : finished ? 'COMPLETO' : active ? 'ACTIVO' : 'BLOQUEADO'}</span>
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
                ? `<div class="hf-accessory-adaptive">
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
      <div class="hf-rest-lock">DESCANSO OBLIGATORIO · EL SIGUIENTE SET SE HABILITA AL FINALIZAR</div>
    </aside>
  `;
}

function localizedOutcomeReason(reason: string): string {
  if (reason.startsWith('Productive Progress accumulated')) {
    return 'Progreso productivo acumulado; la Puerta de Rendimiento se evalúa cuando se alcanza el coste requerido.';
  }
  if (reason.startsWith('Enough Progress exists, but evidence Confidence')) {
    return 'Hay Progreso suficiente, pero la confianza de la evidencia todavía no alcanza el umbral.';
  }
  if (reason.startsWith('Enough Progress exists, but no valid behavioral performance sample')) {
    return 'Hay Progreso suficiente, pero falta una muestra válida de rendimiento.';
  }
  if (reason.startsWith('Behavioral gate not cleared')) {
    return 'La Puerta de Rendimiento todavía no fue superada en esta sesión.';
  }
  if (reason.startsWith('Enough Progress exists, but no comparable performance pair')) {
    return 'Hay Progreso suficiente, pero falta una comparación válida de rendimiento.';
  }
  if (reason.startsWith('Training maintained capacity')) {
    return 'El entrenamiento mantuvo la capacidad, pero todavía no superó la Puerta de Rendimiento.';
  }
  if (reason.startsWith('Progress cost and behavioral gate')) {
    return 'Progreso y Puerta de Rendimiento superados.';
  }
  if (reason.startsWith('Progress cost and comparable Performance Gate')) {
    return 'Progreso y mejora comparable confirmados.';
  }
  if (reason.startsWith('Comparable baseline seeded')) {
    return 'Se estableció una nueva referencia comparable para este Core Stat.';
  }
  return reason;
}

function trainingOutcomeLabel(outcome: string): string {
  const labels: Record<string, string> = {
    calibrated: 'BASE ESTABLECIDA',
    awaiting_performance: 'EN CALIBRACIÓN',
    progress_only: 'PROGRESO REGISTRADO',
    stat_up: 'STAT +1',
    maintained: 'MANTENIDO',
    insufficient_evidence: 'EVIDENCIA INSUFICIENTE',
    insufficient_performance: 'RENDIMIENTO INSUFICIENTE',
  };
  return labels[outcome] ?? outcome.replaceAll('_', ' ').toUpperCase();
}

function trainingOutcomeReason(reason: string): string {
  const known: Record<string, string> = {
    'Initial real training established the Core baseline and activated the Training Bridge.':
      'El primer entrenamiento real estableció la base del Core y activó el poder interior del Hunter.',
    'Stimulus recorded, but initial calibration needs a valid comparable performance sample.':
      'Se registró estímulo, pero la calibración inicial todavía necesita una muestra válida de rendimiento comparable.',
    'Comparable baseline seeded for an already-calibrated legacy profile.':
      'Se estableció una referencia comparable para un perfil previamente calibrado.',
  };
  return known[reason] ?? reason;
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
              <span>${o.outcome === 'stat_up' ? 'TP GANADOS' : o.outcome.replaceAll('_', ' ')}</span>
              <small>${escapeHtml(localizedOutcomeReason(o.reason))}</small>
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
      <span>TP ganados <b>${lastOutcomes.reduce((sum, outcome) => sum + outcome.trainingPointsEarned, 0).toFixed(2)}</b></span>
    </div>
    ${outcomes}
  `;
}

function allExercisesComplete(): boolean {
  const exercises = activeDayExercises();
  return exercises.length > 0 && exercises.every(exerciseTerminal);
}

function sessionAlreadyRegistered(): boolean {
  return cycleState(profileOrNull()).completedSessions.includes(cycleSessionKey(selectedWeek, selectedDay));
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
          <select id="hf-training-week" ${activeRest ? 'disabled' : ''}>${weekOptions()}</select>
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
        <h4>HUNTER CORE · PERMANENTE</h4>
        <span>BASE DE CLASE + NIVEL + TRAINING · sólo TRAINING se asigna libremente</span>
        <span class="hf-tp-wallet">TP DISPONIBLES <b>${(profileOrNull()?.training.points.available ?? 0).toFixed(2)}</b> · GANADOS <b>${(profileOrNull()?.training.points.earned ?? 0).toFixed(2)}</b></span>
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
          data-highfly-all-terminal="${allExercisesComplete() ? '1' : '0'}"
          ${sessionDone || activeRest || !selectedSessionTrainable() ? 'disabled' : ''}
        >
          ${sessionDone ? 'SESIÓN YA REGISTRADA ✓' : selectedWeek !== state.activeWeek ? 'SEMANA SOLO VISTA · NO HABILITADA' : 'COMPLETAR SESIÓN'}
        </button>
        <small>
          Cierra el día tal como está: sólo registra sets realmente completados.
          Ejercicios saltados o pendientes no cuentan como completados.
        </small>
      </div>
    </section>

    <section>
      <div class="hf-section-title">
        <h4>ESTÍMULO DE ESTA SESIÓN</h4>
        <span>No es tu Core consolidado · Evidencia · Estímulo · Puerta de Rendimiento</span>
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
  skippedExercises.clear();
  lastResult = null;
  lastOutcomes = [];
}

function syncRmDraftsFromDom(mount: HTMLElement): void {
  const sexEl = mount.querySelector<HTMLSelectElement>('#hf-rm-sex');
  const ageEl = mount.querySelector<HTMLInputElement>('#hf-rm-age');
  const bodyweightEl = mount.querySelector<HTMLInputElement>('#hf-rm-bodyweight');
  if (sexEl) rmAthleteDraft.sex = sexEl.value as HighflySex;
  if (ageEl) rmAthleteDraft.age = ageEl.value;
  if (bodyweightEl) rmAthleteDraft.bodyweight = bodyweightEl.value;

  for (const lift of HIGHFLY_RM_LIFT_ORDER) {
    const loadEl = mount.querySelector<HTMLInputElement>('[data-hf-rm-load="' + lift + '"]');
    const repsEl = mount.querySelector<HTMLSelectElement>('[data-hf-rm-reps="' + lift + '"]');
    if (!loadEl || !repsEl) continue;
    rmDrafts.set(lift, { load: loadEl.value, reps: Number(repsEl.value) || 5 });
  }
}

function calibrateRmLift(
  profile: HighflyHunterProfile,
  lift: HighflyRmLiftId,
): ReturnType<typeof submitRmCalibration> {
  const draft = rmDrafts.get(lift) ?? { load: '', reps: 5 };
  return submitRmCalibration(profile, lift, {
    sex: rmAthleteDraft.sex ?? 'male',
    ageYears: Number(rmAthleteDraft.age),
    bodyweightKg: Number(rmAthleteDraft.bodyweight),
    loadKg: Number(draft.load),
    reps: draft.reps,
  });
}

function bindRenderedUi(mount: HTMLElement): void {
  mount.querySelectorAll<HTMLElement>('[data-hf-tp-allocate]').forEach((button) => {
    bindTouchTap(button, (event) => {
      event.preventDefault();
      const profile = profileOrNull();
      const stat = button.dataset.hfTpAllocate as HighflyCoreStat | undefined;
      const amount = Number(button.dataset.hfTpAmount);
      if (!profile || !stat || !(amount > 0)) return;
      try {
        const allocated = allocateTrainingPoints(profile, stat, amount);
        setActiveHighflyHunterProfile(allocated);
        refreshActiveTrainingCombatBridge();
        render();
      } catch {
        render();
      }
    });
  });

  mount.querySelectorAll<HTMLElement>('[data-hf-training-day]').forEach((button) => {
    bindTouchTap(button, (event) => {
      event.preventDefault();
      if (activeRest) return;
      resetVisibleSession();
      selectedDay = Number(button.dataset.hfTrainingDay) || 1;
      render();
    });
  });

  const week = mount.querySelector('#hf-training-week');
  if (week instanceof HTMLSelectElement) {
    week.addEventListener('change', () => {
      if (activeRest) return;
      resetVisibleSession();
      selectedWeek = Math.max(1, Math.min(4, Number(week.value) || 1));
      render();
    });
  }

  const rmDraftInputs = mount.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
    '#hf-rm-sex, #hf-rm-age, #hf-rm-bodyweight, [data-hf-rm-load], [data-hf-rm-reps]',
  );
  rmDraftInputs.forEach((input) => {
    input.addEventListener('input', () => syncRmDraftsFromDom(mount));
    input.addEventListener('change', () => syncRmDraftsFromDom(mount));
  });

  mount.querySelectorAll<HTMLElement>('[data-hf-rm-submit]').forEach((button) => {
    bindTouchTap(button, (event) => {
      event.preventDefault();
      const profile = profileOrNull();
      const lift = button.dataset.hfRmSubmit as HighflyRmLiftId | undefined;
      if (!profile || !lift) return;
      syncRmDraftsFromDom(mount);
      try {
        const result = calibrateRmLift(profile, lift);
        setActiveHighflyHunterProfile(result.profile);
        rmCalibrationMessage = HIGHFLY_RM_LIFT_LABELS[lift] + ' · ' + result.reason;
        render();
      } catch (err) {
        rmCalibrationMessage = err instanceof Error ? err.message : String(err);
        render();
      }
    });
  });

  const calibrateAll = mount.querySelector<HTMLElement>('#hf-rm-submit-all');
  if (calibrateAll) {
    bindTouchTap(calibrateAll, (event) => {
      event.preventDefault();
      syncRmDraftsFromDom(mount);
      let profile = profileOrNull();
      if (!profile) return;
      let calibrated = 0;
      const messages: string[] = [];
      try {
        for (const lift of HIGHFLY_RM_LIFT_ORDER) {
          const draft = rmDrafts.get(lift);
          if (!draft || !(Number(draft.load) > 0)) continue;
          const result = calibrateRmLift(profile, lift);
          profile = result.profile;
          calibrated += 1;
          messages.push(HIGHFLY_RM_LIFT_LABELS[lift] + ': ' + result.status);
        }
        if (calibrated === 0) {
          throw new Error('HIGHFLY RM: cargá al menos un peso antes de calibrar.');
        }
        setActiveHighflyHunterProfile(profile);
        rmCalibrationMessage = calibrated + ' RM calibradas · ' + messages.join(' · ');
        render();
      } catch (err) {
        rmCalibrationMessage = err instanceof Error ? err.message : String(err);
        render();
      }
    });
  }

  const enableNextWeek = mount.querySelector<HTMLElement>('#hf-enable-next-week');
  if (enableNextWeek) {
    bindTouchTap(enableNextWeek, (event) => {
      event.preventDefault();
      const profile = profileOrNull();
      if (!profile) return;
      try {
        const next = unlockNextCycleWeek(profile);
        setActiveHighflyHunterProfile(next);
        selectedWeek = cycleState(next).activeWeek;
        selectedDay = 1;
        resetVisibleSession();
        render();
      } catch (err) {
        cycleResetMessage = err instanceof Error ? err.message : String(err);
        render();
      }
    });
  }

  const resetArm = mount.querySelector<HTMLElement>('#hf-cycle-reset-arm');
  if (resetArm) {
    bindTouchTap(resetArm, (event) => {
      event.preventDefault();
      cycleResetArmed = true;
      cycleResetMessage = '';
      render();
    });
  }

  const resetCancel = mount.querySelector<HTMLElement>('#hf-cycle-reset-cancel');
  if (resetCancel) {
    bindTouchTap(resetCancel, (event) => {
      event.preventDefault();
      cycleResetArmed = false;
      cycleResetMessage = '';
      render();
    });
  }

  const resetConfirm = mount.querySelector<HTMLElement>('#hf-cycle-reset-confirm');
  if (resetConfirm) {
    bindTouchTap(resetConfirm, (event) => {
      event.preventDefault();
      const profile = profileOrNull();
      const reason = mount.querySelector<HTMLInputElement>('#hf-cycle-reset-reason')?.value ?? '';
      if (!profile) return;
      try {
        const next = restartCurrentCycle(profile, reason);
        setActiveHighflyHunterProfile(next);
        selectedWeek = 1;
        selectedDay = 1;
        cycleResetArmed = false;
        cycleResetMessage = '';
        resetVisibleSession();
        render();
      } catch (err) {
        cycleResetMessage = err instanceof Error ? err.message : String(err);
        render();
      }
    });
  }

  mount.querySelectorAll<HTMLInputElement>('[data-hf-accessory-load]').forEach((input) => {
    input.addEventListener('change', () => {
      if (!selectedSessionTrainable()) return;
      const exerciseId = input.dataset.hfAccessoryLoad;
      if (!exerciseId) return;
      saveAccessoryLoad(exerciseId, Math.max(0, Number(input.value) || 0));
      render();
    });
  });

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

  mount.querySelectorAll<HTMLElement>('[data-hf-set-complete]').forEach((button) => {
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

  const register = mount.querySelector<HTMLElement>('#hf-training-register');
  if (register) {
    bindTouchTap(register, (event) => {
      event.preventDefault();
      if (!activeRest && selectedSessionTrainable()) registerSession();
    });
  }
}

function updateAccessoryEntry(
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

function completeSet(exercise: HighflyRoutineExercise): void {
  if (!canActOnExercise(exercise)) return;
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

function skipExercise(exercise: HighflyRoutineExercise): void {
  if (!canActOnExercise(exercise)) return;
  skippedExercises.add(exercise.exerciseId);
  render();
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
    targetSec: navigator.webdriver ? 0.5 : exercise.restSec,
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
      ...previous,
      currentCycle: previous.currentCycle + 1,
      activeWeek: 1,
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
  if (
    !profile ||
    exercises.length === 0 ||
    sessionAlreadyRegistered() ||
    activeRest ||
    !selectedSessionTrainable()
  ) return;

  cancelActiveRest();

  const state = cycleState(profile);
  const definitions = new Map<string, ExerciseDefinition>();
  const sets: SessionRecord['sets'][number][] = [];
  let plannedSets = 0;
  let completedSetCount = 0;
  let completedExerciseCount = 0;

  for (const exercise of exercises) {
    const prescription = prescriptionForWeek(exercise, selectedWeek);
    if (!prescription) continue;

    // Keep the complete plan as denominator, but ignore untouched work before
    // validating exercise-specific load input.
    plannedSets += prescription.sets;
    const actualSets = Math.min(
      prescription.sets,
      completedSets.get(exercise.exerciseId) ?? 0,
    );
    if (actualSets <= 0) continue;

    const load = loadPlan(exercise);
    if (!load.ready) continue;

    definitions.set(exercise.exerciseId, {
      exerciseId: exercise.exerciseId,
      pattern: exercise.pattern,
      role: exercise.intent,
      loadMode: load.systemLoadKg > 0 ? 'external_kg' : 'bodyweight',
      rmReferenceKg: load.rmReferenceKg,
    });
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
      completedSets: completedSetCount,
      plannedExercises: exercises.length,
      completedExercises: completedExerciseCount,
      sequentialCompletion: true,
      prescriptionCompliance:
        plannedSets > 0 ? completedSetCount / plannedSets : 0,
    },
    definitions,
  });

  let adaptiveProfile = pipeline.profile;
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
          trainingPointsEarned: outcome.trainingPointsEarned,
          statDelta: outcome.statDelta,
        })),
      },
    }),
  );

  render();
}

function setTrainingFocusMode(active: boolean): void {
  document.body.classList.toggle('highfly-training-focus', active);
  window.dispatchEvent(
    new CustomEvent('highfly:training-focus', { detail: { active } }),
  );
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
      trainingWindow.style.setProperty('left', '0', 'important');
      trainingWindow.style.setProperty('top', '0', 'important');
      trainingWindow.style.setProperty('right', '0', 'important');
      trainingWindow.style.setProperty('bottom', '0', 'important');
      trainingWindow.style.setProperty('width', '100vw', 'important');
      trainingWindow.style.setProperty('height', '100dvh', 'important');
      trainingWindow.style.setProperty('max-width', 'none', 'important');
      trainingWindow.style.setProperty('max-height', 'none', 'important');
      trainingWindow.style.setProperty('transform', 'none', 'important');
      trainingWindow.style.setProperty('z-index', '95', 'important');
    };

    forceSystemViewport();
    window.addEventListener('resize', forceSystemViewport);
  }

  window.addEventListener('highfly:open-training', () => {
    setTrainingFocusMode(true);
    trainingWindow?.removeAttribute('hidden');
    if (trainingWindow && document.body.classList.contains('mobile-touch')) {
      trainingWindow.style.setProperty('width', '100vw', 'important');
      trainingWindow.style.setProperty('height', '100dvh', 'important');
    }
    render();
  });

  const close = document.querySelector<HTMLElement>('#highfly-training-close');
  if (close) {
    bindTouchTap(close, (event) => {
      event.preventDefault();
      if (activeRest) {
        paintRestDock();
        return;
      }
      setTrainingFocusMode(false);
      document.querySelector('#highfly-training-window')?.setAttribute('hidden', '');
    });
  }
}
