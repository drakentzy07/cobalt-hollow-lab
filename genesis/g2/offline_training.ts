/**
 * Opt-in OFFLINE GENESIS G2 prototype: ?hfGenesis=1
 * A working Training UI using HIGHFLY's scored session pipeline and TP wallet.
 * It does not replace donor account saves or modify the multiplayer server.
 */
import type { Sim } from '../../sim/sim';
import { recalcPlayerStats } from '../../sim/entity';
import type { PlayerClass } from '../../sim/types';
import {
  createHighflyHunterProfile,
  applyHunterProgression,
  allocateTrainingPoints,
  HIGHFLY_CORE_STATS,
  type HighflyCoreStat,
  type HighflyHunterProfile,
} from '../training/core';
import {
  runTrainingSessionPipeline,
} from '../training/pipeline';
import type { ExerciseDefinition, SessionRecord } from '../training/engine';
import {
  genesisAttachTraining, genesisBoundProfile,
} from './training_runtime';

const PRESETS = {
  squat: { exerciseId: 'back_squat', pattern: 'squat', role: 'strength', label: 'Sentadilla — fuerza' },
  power: { exerciseId: 'power_clean', pattern: 'hinge', role: 'power', label: 'Levantamiento explosivo — potencia' },
  endurance: { exerciseId: 'split_squat', pattern: 'unilateral', role: 'hypertrophy', label: 'Sentadilla búlgara — resistencia' },
} as const;

function storageKey(cls: PlayerClass, name: string): string {
  return 'highfly.genesis.g2.training.v1:' + encodeURIComponent(cls) + ':' + encodeURIComponent(name);
}

function loadProfile(key: string, cls: PlayerClass, level: number): HighflyHunterProfile {
  const fresh = () => createHighflyHunterProfile({ profileId: key, classId: cls, level });
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fresh();
    const parsed = JSON.parse(raw) as HighflyHunterProfile;
    // Exact schema only; old Hunter profile migrations are never automatic.
    if (parsed.schemaVersion !== 5 || parsed.profileId !== key ||
        parsed.awakening?.classId !== cls || !parsed.training?.points ||
        !parsed.training?.core || !parsed.hunter) return fresh();
    return applyHunterProgression(parsed, { level });
  } catch {
    return fresh();
  }
}

function saveProfile(key: string, profile: HighflyHunterProfile): void {
  try {
    localStorage.setItem(key, JSON.stringify(profile));
  } catch {
    // Private browsing / quota cannot corrupt ClaudeCraft save state.
  }
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K, parent: HTMLElement, text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  parent.append(node);
  return node;
}

function floatEntry(parent: HTMLElement, label: string, value: string): HTMLInputElement {
  const wrap = el('label', parent);
  wrap.style.cssText = 'display:flex;justify-content:space-between;gap:8px;margin:7px 0;align-items:center';
  el('span', wrap, label);
  const input = el('input', wrap);
  input.type = 'number';
  input.min = '0';
  input.step = 'any';
  input.value = value;
  input.style.cssText = 'width:86px;min-height:32px;font-size:16px;border:1px solid #88775c;background:#222;color:white;border-radius:6px;padding:4px';
  return input;
}

/** Public game entry. Called only for an explicitly opted-in offline session. */
export function bootGenesisOfflineTraining(sim: Sim, cls: PlayerClass, name: string): void {
  if (typeof document === 'undefined' || document.getElementById('hf-genesis-training')) return;
  const identity = storageKey(cls, name);
  let profile = loadProfile(identity, cls, sim.player.level);
  genesisAttachTraining(sim.player, cls, profile);

  const recalculate = () => {
    const meta = sim.players.get(sim.playerId);
    if (!meta) return;
    genesisAttachTraining(sim.player, cls, profile);
    recalcPlayerStats(sim.player, cls, meta.equipment, meta.talentMods, meta.equipmentInstance);
  };
  recalculate();

  const root = el('div', document.body);
  root.id = 'hf-genesis-training';
  root.style.cssText = 'position:fixed;z-index:2147482500;right:12px;top:60px;color:#fff;font-family:system-ui,sans-serif;touch-action:manipulation';
  const toggle = el('button', root, '🏋️ HIGHFLY TRAINING');
  toggle.type = 'button';
  toggle.style.cssText = 'background:#162a25;border:2px solid #c99f51;color:#fff;padding:9px 12px;border-radius:9px;font-weight:700;font-size:13px;min-height:40px';
  const panel = el('section', root);
  panel.setAttribute('aria-label','Training HIGHFLY');
  panel.hidden = true;
  panel.style.cssText = 'display:none;background:rgba(12,18,23,.98);border:1px solid #a9884c;border-radius:10px;padding:14px;width:min(320px,85vw);max-height:72vh;overflow:auto;box-shadow:0 8px 30px #000a;font-size:13px';
  toggle.onclick = () => { panel.hidden = !panel.hidden; panel.style.display = panel.hidden ? 'none' : 'block'; if(!panel.hidden) repaint(); };
  el('strong', panel, 'HIGHFLY — entrenamiento real');
  el('p', panel, 'G2 offline · Clase original: ' + cls + ' · LV máximo 20').style.color = '#d6c49e';
  const tally = el('div', panel);
  tally.style.cssText = 'white-space:pre-line;line-height:1.5;margin:10px 0;color:#e8f2dc';
  const exercise = el('select', panel);
  exercise.style.cssText = 'width:100%;padding:7px;background:#25342e;color:white;border:1px solid #88775c;border-radius:5px;font-size:15px';
  for (const [key, spec] of Object.entries(PRESETS)) {
    const opt = el('option', exercise, spec.label);
    opt.value = key;
  }
  const reps = floatEntry(panel, 'Repeticiones', '5');
  const kg = floatEntry(panel, 'Peso usado (kg)', '30');
  const rm = floatEntry(panel, '1RM referencia (kg)', '40');
  const rest = floatEntry(panel, 'Descanso (segundos)', '150');
  const record = el('button', panel, 'Registrar sesión real');
  record.type='button';
  record.style.cssText = 'width:100%;background:#c49e57;color:#121212;border:0;border-radius:7px;font-weight:700;padding:10px;margin:10px 0';
  const allocateLabel = el('div', panel, 'Asignar Training Points:');
  allocateLabel.style.marginTop='5px';
  const statSel = el('select', panel);
  statSel.style.cssText = exercise.style.cssText;
  for (const stat of HIGHFLY_CORE_STATS) { const opt=el('option',statSel,stat); opt.value=stat; }
  const assign = el('button',panel,'Asignar 0.1 TP');
  assign.type='button';
  assign.style.cssText='background:#2d5a47;color:white;padding:9px;border:1px solid #709a7b;border-radius:6px;width:100%;margin-top:8px';
  const note = el('p',panel,'');
  note.style.cssText = 'color:#e6be73;white-space:pre-line;line-height:1.4';
  const repaint = () => {
    const actual = genesisBoundProfile(sim.player) ?? profile;
    if (actual.hunter.level !== profile.hunter.level) {
      profile = actual;
      saveProfile(identity, profile);
    }
    tally.textContent =
      'Clase ' + cls.toUpperCase() + ' · LV ' + sim.player.level +
      '\n' + HIGHFLY_CORE_STATS.map(s => s + ': ' + profile.training.core[s].trainingAllocated.toFixed(2)).join('  ') +
      '\nTP disponibles: ' + profile.training.points.available.toFixed(3) +
      '\nAP: ' + sim.player.attackPower + ' · HP: ' + sim.player.maxHp;
  };
  record.onclick = () => {
    try {
      const preset = PRESETS[exercise.value as keyof typeof PRESETS];
      if (!preset) throw new Error('Elegí un ejercicio');
      const n = Number(reps.value), weight = Number(kg.value), reference = Number(rm.value), restSec = Number(rest.value);
      if (!Number.isInteger(n) || n<1 || n>30 || weight<=0 || weight>500 ||
          reference<=0 || reference>600 || restSec<0 || restSec>900)
        throw new Error('Datos fuera de rango: reps 1-30; peso/1RM positivos; descanso 0-900s.');
      const today = new Date().toISOString().slice(0,10);
      const sessionId = 'g2:' + today + ':' + preset.exerciseId;
      if (profile.training.history?.some(h => h.sessionId === sessionId))
        throw new Error('Este ejercicio ya fue registrado hoy. Volvé otro día.');
      const definition: ExerciseDefinition = {
        exerciseId: preset.exerciseId,
        pattern: preset.pattern,
        role: preset.role,
        loadMode: 'external_kg',
        rmReferenceKg: reference,
      };
      const session: SessionRecord = {
        sessionId,
        routineId:'hf-g2-training',
        block:'GENESIS',
        week:1,
        day:1,
        readiness:1,
        isDeload:false,
        completed:true,
        sets: [{
          setId:sessionId+':set1', exerciseId:preset.exerciseId,
          reps:n, loadKg:weight, restSec, intent:preset.role,
          quality:1,
        }],
        plannedSets:1, completedSets:1, plannedExercises:1, completedExercises:1,
        prescriptionCompliance:1, sequentialCompletion:true,
      };
      const result = runTrainingSessionPipeline({
        profile,
        session,
        definitions:new Map([[preset.exerciseId,definition]]),
      });
      profile = result.profile;
      saveProfile(identity, profile);
      recalculate();
      note.textContent = 'Sesión registrada: ' +
        (result.outcomes.map(o => o.stat+' '+o.outcome+' (+'+o.trainingPointsEarned.toFixed(3)+' TP)').join(', ') || 'sin estímulo válido');
      repaint();
    } catch (err) {
      note.textContent = err instanceof Error ? err.message : 'Error de entrenamiento';
    }
  };
  assign.onclick = () => {
    try {
      const amount = Math.min(0.1, profile.training.points.available);
      if (amount<0.00001) throw new Error('Necesitás ganar TP registrando una sesión válida.');
      profile=allocateTrainingPoints(profile, statSel.value as HighflyCoreStat, amount);
      saveProfile(identity,profile);
      recalculate();
      note.textContent = 'TP asignados a '+statSel.value+' · Bonificación aplicada al combate.';
      repaint();
    } catch(err) {note.textContent=err instanceof Error?err.message:'No se pudo asignar TP';}
  };
  repaint();
}
