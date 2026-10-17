/**
 * HIGHFLY ORIGIN P3 — One visible Android combat HUD.
 * Keeps every real native action/cooldown/aim/slot owner; this code only
 * relocates the R23 buff buttons and exposes the existing training panel
 * behind an explicit ?hf_lab=1 development switch.
 *
 * No ability is granted by this module. Four R32 candidates are suggested,
 * and only genuinely learned, admitted native skills may be equipped.
 */
import type { Sim } from '../sim/sim';
import { ABILITIES } from '../sim/content/classes';
import { originSkillRole } from './highfly_origin_r17_hud';

export const P3_BASE_IDS = ['fireball', 'heroic_leap', 'blink', 'flamestrike'] as const;

type SlotState = { slots: (string | null)[] };
const fire = (kind: string, slot?: number, id?: string): void => {
  document.dispatchEvent(new CustomEvent('hf-origin-command', { detail: { kind, slot, id } }));
};

export function installHighflyAndroidP3(
  sim: Sim,
  shell: HTMLElement,
  originalToggle: HTMLButtonElement,
  editorPanel: HTMLElement,
): void {
  if (!document.body.classList.contains('hf-android-p3') || !sim.player.originResources)
    return;
  if (document.getElementById('hf-p3-aux-root')) return;

  // R17/R23 keep the authoritative B1-B8 click handlers and buff icon painter.
  // Relocate THOSE SAME BUTTON NODES, never duplicate an ability action.
  const utility = document.getElementById('hf-origin-utility-row');
  const oldButtons = utility ? [...utility.querySelectorAll<HTMLButtonElement>('button[data-origin-buff]')] : [];
  const aux = document.createElement('div');
  aux.id = 'hf-p3-aux-root';
  const auxToggle = document.createElement('button');
  auxToggle.type = 'button';
  auxToggle.id = 'hf-p3-aux-toggle';
  auxToggle.textContent = 'AUX';
  auxToggle.setAttribute('aria-label', 'Mostrar u ocultar técnicas auxiliares');
  auxToggle.setAttribute('aria-expanded', 'false');
  const grid = document.createElement('div');
  grid.id = 'hf-p3-aux-grid';
  grid.hidden = true;
  grid.setAttribute('aria-label', 'Buffs y apoyo');
  for (const button of oldButtons) grid.appendChild(button);
  auxToggle.addEventListener('click', () => {
    if (document.body.classList.contains('mobile-window-open')) return;
    grid.hidden = !grid.hidden;
    auxToggle.setAttribute('aria-expanded', String(!grid.hidden));
  });
  aux.append(auxToggle, grid);
  document.body.appendChild(aux);
  // Do not show unused empty buff buttons: the menu expands only assigned buffs.
  document.addEventListener('hf-origin-loadout-state', (event) => {
    const state = (event as CustomEvent<SlotState>).detail;
    if (!state?.slots) return;
    oldButtons.forEach((button, index) => {
      const skill = state.slots[index + 10];
      button.hidden = !skill;
      button.title = skill ? (ABILITIES[skill]?.name ?? skill) : 'Sin asignar';
    });
    auxToggle.hidden = !oldButtons.some(b => !b.hidden);
    if (auxToggle.hidden) {
      grid.hidden = true;
      auxToggle.setAttribute('aria-expanded', 'false');
    }
  });
  fire('sync');

  // Only the opt-in dev URL can access the training editor. This is NOT
  // shipped as part of the normal P3 combat HUD.
  const isLab = new URLSearchParams(location.search).get('hf_lab') === '1';
  if (!isLab) {
    shell.dataset.p3Lab = 'disabled';
    return;
  }
  shell.dataset.p3Lab = 'enabled';
  const entry = document.createElement('button');
  entry.id = 'hf-p3-lab-entry';
  entry.type = 'button';
  entry.textContent = '🧪 LAB · HABILIDADES';
  entry.title = 'Editor temporal de laboratorio (solo URL hf_lab=1)';
  // Native More dialog already owns menu focus/touch dispatch. Place the
  // launcher inside that dialog rather than adding a second gameplay HUD.
  const more = document.getElementById('mobile-extra-controls');
  if (more) more.appendChild(entry);
  else document.body.appendChild(entry);
  const syncPanel = (): void => {
    const open = !editorPanel.hidden;
    document.body.classList.toggle('hf-p3-lab-open', open);
    entry.setAttribute('aria-expanded', String(open));
  };
  entry.addEventListener('click', () => {
    originalToggle.click();
    syncPanel();
  });
  const close = document.createElement('button');
  close.id = 'hf-p3-lab-close';
  close.type = 'button';
  close.textContent = '✕ CERRAR LAB';
  close.addEventListener('click', () => {
    if (!editorPanel.hidden) originalToggle.click();
    syncPanel();
  });
  editorPanel.prepend(close);
  originalToggle.setAttribute('tabindex', '-1');

  const preset = document.createElement('button');
  preset.id = 'hf-p3-base-preset';
  preset.type = 'button';
  preset.textContent = 'EQUIPAR LAS 4 BASE R32 (si están aprendidas)';
  const result = document.createElement('p');
  result.id = 'hf-p3-base-result';
  result.setAttribute('role', 'status');
  result.textContent = 'Prueba: Fireball · Heroic Leap · Blink · Flamestrike. Sin desbloqueos artificiales.';
  preset.addEventListener('click', () => {
    const admitted = P3_BASE_IDS.filter(id =>
      sim.known.some(known => known.def.id === id) && originSkillRole(id) === 'combat');
    // Refuse partial replacement of the saved native loadout.
    if (admitted.length !== P3_BASE_IDS.length) {
      const missing = P3_BASE_IDS.filter(id => !admitted.includes(id));
      result.textContent = 'Aún no equipables: ' + missing.join(', ') +
        '. Requieren aprendizaje o adaptación nativa. No se conceden gratis.';
      return;
    }
    P3_BASE_IDS.forEach((id, i) => fire('set', i + 1, id));
    fire('sync');
    result.textContent = 'Cuatro BASE equipadas en la barra nativa. Probá cada una en el mundo.';
  });
  editorPanel.prepend(result);
  editorPanel.prepend(preset);
  syncPanel();
}
