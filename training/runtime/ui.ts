import { evaluateTrainingSession, type ExerciseDefinition, type SessionRecord } from './engine';
import {
  HF_REFERENCE_5D_SUPREME_V1,
  HF_REFERENCE_5D_SUPREME_V1_ID,
  type ReferenceExercise,
} from './reference_routine';
import { getActiveHighflyHunterProfile } from './profile_store';

let installed = false;
let selectedDay = 1;
let lastResult: ReturnType<typeof evaluateTrainingSession> | null = null;

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

function defaultSetCount(exercise: ReferenceExercise): number {
  const explicit = exercise.sets.match(/^(\d+)x/);
  if (explicit) return Number(explicit[1]);
  return exercise.sets.includes('top + back-off') ? 5 : 3;
}

function defaultReps(exercise: ReferenceExercise): number {
  if (exercise.intent === 'power') return 3;
  if (exercise.intent === 'strength') return 5;
  if (exercise.intent === 'accessory') return 15;
  return 8;
}

function defaultRest(exercise: ReferenceExercise): number {
  if (exercise.intent === 'strength') return 180;
  if (exercise.intent === 'power') return 150;
  if (exercise.intent === 'hypertrophy') return 90;
  if (exercise.intent === 'accessory') return 75;
  return 60;
}

function coreCards(): string {
  const profile = getActiveHighflyHunterProfile();
  if (!profile) {
    return '<div class="hf-training-empty">Entrá con tu Hunter para ver el Training Core.</div>';
  }
  return (['STR', 'AGI', 'VIT', 'PER', 'INT'] as const)
    .map((stat) => {
      const state = profile.training.core[stat];
      const calibration = state.calibrated ? 'Calibrado' : 'Pendiente';
      return `
        <article class="hf-core-card">
          <div class="hf-core-card__top">
            <strong>${stat}</strong>
            <span class="hf-core-badge ${state.calibrated ? 'is-ready' : ''}">${calibration}</span>
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

function dayTabs(): string {
  return HF_REFERENCE_5D_SUPREME_V1.map(
    (day) => `
      <button
        type="button"
        class="hf-training-day ${day.day === selectedDay ? 'is-selected' : ''}"
        data-hf-training-day="${day.day}"
      >
        <span>Día ${day.day}</span>
        <b>${escapeHtml(day.name)}</b>
      </button>
    `,
  ).join('');
}

function exerciseRows(): string {
  const day = HF_REFERENCE_5D_SUPREME_V1.find((candidate) => candidate.day === selectedDay);
  if (!day) return '';
  return day.exercises
    .map(
      (exercise) => `
        <article class="hf-exercise" data-exercise-id="${exercise.exerciseId}">
          <div class="hf-exercise__head">
            <div>
              <strong>${escapeHtml(exercise.label)}</strong>
              <small>${escapeHtml(exercise.sets)} · ${escapeHtml(exercise.target)}</small>
            </div>
            <span class="hf-intent">${exercise.intent.toUpperCase()}</span>
          </div>
          <div class="hf-exercise__inputs">
            <label>Series
              <input data-field="sets" inputmode="numeric" type="number" min="1" max="12" step="1" value="${defaultSetCount(exercise)}">
            </label>
            <label>Reps
              <input data-field="reps" inputmode="numeric" type="number" min="1" max="50" step="1" value="${defaultReps(exercise)}">
            </label>
            <label>Kg
              <input data-field="kg" inputmode="decimal" type="number" min="0" max="1000" step="0.5" value="0">
            </label>
            <label>1RM ref.
              <input data-field="rm" inputmode="decimal" type="number" min="0" max="1000" step="0.5" value="0">
            </label>
            <label>Descanso
              <input data-field="rest" inputmode="numeric" type="number" min="0" max="900" step="5" value="${defaultRest(exercise)}">
            </label>
            <label>Calidad %
              <input data-field="quality" inputmode="numeric" type="number" min="40" max="100" step="5" value="100">
            </label>
          </div>
        </article>
      `,
    )
    .join('');
}

function resultHtml(): string {
  if (!lastResult) {
    return `
      <div class="hf-training-empty">
        Registrá la sesión para convertir los sets en <b>Evidence + Stimulus + Fatigue</b>.
        La rutina por sí sola no entrega Stats.
      </div>
    `;
  }
  const s = lastResult.stimulus;
  return `
    <div class="hf-training-result__grid">
      <div><span>STR</span><b>${s.STR.toFixed(2)}</b></div>
      <div><span>AGI</span><b>${s.AGI.toFixed(2)}</b></div>
      <div><span>VIT</span><b>${s.VIT.toFixed(2)}</b></div>
      <div><span>PER</span><b>${s.PER.toFixed(2)}</b></div>
      <div><span>INT</span><b>${s.INT.toFixed(2)}</b></div>
    </div>
    <div class="hf-training-result__meta">
      <span>Evidence: <b>${lastResult.evidence.length} sets</b></span>
      <span>Tonelaje diagnóstico: <b>${lastResult.diagnosticTonnageKg.toFixed(1)} kg</b></span>
      <span>Fatiga local: <b>${lastResult.fatigue.local.toFixed(2)}</b></span>
      <span>Fatiga sistémica: <b>${lastResult.fatigue.systemic.toFixed(2)}</b></span>
    </div>
  `;
}

function render(): void {
  const mount = document.querySelector('#highfly-training-window .highfly-training-shell');
  if (!(mount instanceof HTMLElement)) return;

  mount.innerHTML = `
    <section class="hf-training-header">
      <div>
        <span class="hf-eyebrow">HIGHFLY TRAINING CORE</span>
        <h3>Rutina de referencia 5D</h3>
        <p>${HF_REFERENCE_5D_SUPREME_V1_ID} · 3 semanas de carga + 1 descarga</p>
      </div>
      <div class="hf-training-controls">
        <label>Semana
          <select id="hf-training-week">
            <option value="1">1 · Carga</option>
            <option value="2">2 · Carga</option>
            <option value="3">3 · Carga</option>
            <option value="4">4 · Descarga</option>
          </select>
        </label>
        <label>Readiness
          <input id="hf-training-readiness" type="range" min="0" max="100" step="1" value="85">
          <output id="hf-training-readiness-value">85%</output>
        </label>
      </div>
    </section>

    <section>
      <div class="hf-section-title">
        <h4>Hunter</h4>
        <span>Core Stats reales · no dependen de Level/gear</span>
      </div>
      <div class="hf-core-grid">${coreCards()}</div>
    </section>

    <section>
      <div class="hf-section-title">
        <h4>Hoy</h4>
        <span>Elegí el día y registrá lo que realmente hiciste</span>
      </div>
      <div class="hf-training-days">${dayTabs()}</div>
      <div class="hf-exercise-list">${exerciseRows()}</div>
      <div class="hf-training-actions">
        <button type="button" id="hf-training-register">Registrar sesión</button>
        <small>Los Kg personales quedan sólo en el save local del Hunter; no están hardcodeados en el repo.</small>
      </div>
    </section>

    <section>
      <div class="hf-section-title">
        <h4>Resultado de sesión</h4>
        <span>RUN1-G · todavía no consolida Stat Up</span>
      </div>
      <div id="hf-training-result" class="hf-training-result">${resultHtml()}</div>
    </section>
  `;

  mount.querySelectorAll<HTMLElement>('[data-hf-training-day]').forEach((button) => {
    button.addEventListener('click', () => {
      selectedDay = Number(button.dataset.hfTrainingDay) || 1;
      lastResult = null;
      render();
    });
  });

  const readiness = mount.querySelector('#hf-training-readiness');
  const readinessValue = mount.querySelector('#hf-training-readiness-value');
  if (readiness instanceof HTMLInputElement && readinessValue instanceof HTMLOutputElement) {
    readiness.addEventListener('input', () => {
      readinessValue.value = `${readiness.value}%`;
    });
  }

  mount.querySelector('#hf-training-register')?.addEventListener('click', registerSession);
}

function registerSession(): void {
  const mount = document.querySelector('#highfly-training-window .highfly-training-shell');
  if (!(mount instanceof HTMLElement)) return;

  const referenceDay = HF_REFERENCE_5D_SUPREME_V1.find((day) => day.day === selectedDay);
  if (!referenceDay) return;

  const definitions = new Map<string, ExerciseDefinition>();
  const sets: SessionRecord['sets'][number][] = [];

  for (const exercise of referenceDay.exercises) {
    const row = mount.querySelector<HTMLElement>(
      `.hf-exercise[data-exercise-id="${exercise.exerciseId}"]`,
    );
    if (!row) continue;

    const count = Math.max(0, Math.min(12, Math.floor(numberValue(row, '[data-field="sets"]', 0))));
    const reps = Math.max(1, Math.floor(numberValue(row, '[data-field="reps"]', defaultReps(exercise))));
    const loadKg = Math.max(0, numberValue(row, '[data-field="kg"]', 0));
    const rm = Math.max(0, numberValue(row, '[data-field="rm"]', 0));
    const restSec = Math.max(0, numberValue(row, '[data-field="rest"]', defaultRest(exercise)));
    const quality = Math.max(0.4, Math.min(1, numberValue(row, '[data-field="quality"]', 100) / 100));

    definitions.set(exercise.exerciseId, {
      exerciseId: exercise.exerciseId,
      pattern: exercise.pattern,
      role: exercise.intent,
      loadMode: loadKg > 0 ? 'external_kg' : 'bodyweight',
      rmReferenceKg: rm > 0 ? rm : undefined,
    });

    for (let index = 0; index < count; index++) {
      sets.push({
        setId: `${exercise.exerciseId}-${index + 1}`,
        exerciseId: exercise.exerciseId,
        reps,
        loadKg,
        restSec,
        intent: exercise.intent,
        quality,
      });
    }
  }

  const weekRaw = Math.floor(numberValue(mount, '#hf-training-week', 1));
  const week = Math.max(1, Math.min(4, weekRaw));
  const readiness = Math.max(0, Math.min(1, numberValue(mount, '#hf-training-readiness', 85) / 100));

  lastResult = evaluateTrainingSession(
    {
      sessionId: `ui-${Date.now()}`,
      routineId: HF_REFERENCE_5D_SUPREME_V1_ID,
      block: 'reference',
      week,
      day: selectedDay,
      readiness,
      isDeload: week === 4,
      completed: true,
      sets,
    },
    definitions,
  );

  const result = mount.querySelector('#hf-training-result');
  if (result instanceof HTMLElement) result.innerHTML = resultHtml();
}

export function installHighflyTrainingUi(): void {
  if (installed) return;
  installed = true;

  window.addEventListener('highfly:open-training', () => {
    render();
  });

  document.querySelector('#highfly-training-close')?.addEventListener('click', () => {
    document.querySelector('#highfly-training-window')?.setAttribute('hidden', '');
  });
}
