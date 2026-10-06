import '../styles/hf_game_c1.css';
import {
  configureHighflyWeaponElement,
  HIGHFLY_WEAPON_ELEMENTS,
  type HighflyWeaponElement,
} from '../sim/combat/highfly_elemental_basic';

type HighflyGameWindow = Window & {
  __game?: any;
  __highflyGameC1Context?: { canUse?: () => boolean };
  __highflyGameC1?: {
    element(): HighflyWeaponElement;
    setElement(next: HighflyWeaponElement, active?: boolean): void;
  };
};

const w = window as HighflyGameWindow;
const params = new URLSearchParams(location.search);
const testMode = params.get('c1test') === '1';
let mode: HighflyWeaponElement =
  testMode && HIGHFLY_WEAPON_ELEMENTS.includes(params.get('gem') as HighflyWeaponElement)
    ? (params.get('gem') as HighflyWeaponElement)
    : 'base';
let enabled = mode !== 'base';
let lastElementSignature = '';
let toastTimer = 0;

const HIGHFLY_GAME_C22_BUILD = 'C2.5-hud-target-polish';
let coachSuppressTimer = 0;

function game(): any {
  return w.__game?.sim ? w.__game : null;
}

function equippedWeaponId(): string | null {
  const g = game();
  return g?.sim?.equipment?.mainhand ?? g?.sim?.player?.mainhandItemId ?? null;
}

function toast(titleText: string, detail = ''): void {
  let el = document.getElementById('hf-c1-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'hf-c1-toast';
    document.body.append(el);
  }
  el.replaceChildren();
  const title = document.createElement('strong');
  title.textContent = titleText;
  el.append(title);
  if (detail) {
    const body = document.createElement('span');
    body.textContent = detail;
    el.append(body);
  }
  el.classList.add('show');
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el?.classList.remove('show'), 1500);
}

function configureElement(): void {
  const g = game();
  if (!g) return;
  const weapon = equippedWeaponId();
  const effective = enabled ? mode : 'base';
  const signature = [weapon ?? '', effective].join(':');
  if (signature === lastElementSignature) return;
  lastElementSignature = signature;
  configureHighflyWeaponElement(g.sim.player, weapon, effective, enabled);
  paintGemSeat();
}

function elementGlyph(value: HighflyWeaponElement): string {
  if (value === 'fire') return '🔥';
  if (value === 'frost') return '❄️';
  if (value === 'lightning') return '⚡';
  if (value === 'air') return '🌪️';
  return '◇';
}

function paintGemSeat(): void {
  const el = document.getElementById('hf-c1-gem-seat');
  if (!(el instanceof HTMLButtonElement)) return;
  const effective = enabled ? mode : 'base';
  el.dataset.element = effective;
  el.textContent = elementGlyph(effective);
  el.title =
    effective === 'base'
      ? 'Sin gema elemental activa'
      : `Gema ${effective.toUpperCase()} activa · ATK4 habilitado`;
  el.setAttribute('aria-label', el.title);
}

function ensureSpecialSeats(): void {
  if (document.getElementById('hf-c1-special-seats')) return;
  const host = document.createElement('div');
  host.id = 'hf-c1-special-seats';
  for (const [id, label] of [
    ['hf-c1-esp1', 'ESP1'],
    ['hf-c1-esp2', 'ESP2'],
    ['hf-c1-ult', 'ULT'],
  ] as const) {
    const button = document.createElement('button');
    button.type = 'button';
    button.id = id;
    button.className = 'hf-c1-special-seat';
    button.disabled = true;
    button.textContent = label;
    button.title = label + ' · reservado para habilidad especial de descubrimiento';
    host.append(button);
  }
  document.body.append(host);
}

function ensureGhostSkillSeats(): void {
  let host = document.getElementById('hf-c22-ghost-skills');
  if (!host) {
    host = document.createElement('div');
    host.id = 'hf-c22-ghost-skills';
    host.setAttribute('aria-hidden', 'true');
    for (let slot = 1; slot <= 10; slot++) {
      const ghost = document.createElement('span');
      ghost.className = 'hf-c22-ghost-skill';
      ghost.dataset.slot = String(slot);
      ghost.textContent = 'S' + slot;
      host.append(ghost);
    }
    document.body.append(host);
  }
}

function syncCreatorPreviewState(): void {
  const box = document.getElementById('offline-preview-container');
  if (!(box instanceof HTMLElement)) return;
  const canvas = box.querySelector<HTMLCanvasElement>('#char-preview-canvas');
  box.classList.toggle('hf-preview-loading', !canvas?.dataset.highflyPreviewVisual);
}

function installCoachmarkRelease(): void {
  if (document.body.dataset.hfC22CoachRelease === '1') return;
  document.body.dataset.hfC22CoachRelease = '1';
  document.addEventListener(
    'pointerup',
    (event) => {
      const target = event.target as Element | null;
      if (!target?.closest('.qd-coach, .tut-prompt')) return;
      document.body.classList.add('hf-c22-coach-actioned');
      if (coachSuppressTimer) window.clearTimeout(coachSuppressTimer);
      coachSuppressTimer = window.setTimeout(
        () => document.body.classList.remove('hf-c22-coach-actioned'),
        2200,
      );
    },
    { capture: true },
  );
}

function ensureBuildStamp(): void {
  document.body.dataset.highflyBuild = HIGHFLY_GAME_C22_BUILD;
  if (document.getElementById('hf-c22-build-stamp')) return;
  const stamp = document.createElement('small');
  stamp.id = 'hf-c22-build-stamp';
  stamp.textContent = 'HIGHFLY C2.3';
  stamp.setAttribute('aria-hidden', 'true');
  document.body.append(stamp);
}

function ensureUtilityLane(): void {
  let lane = document.getElementById('hf-c1-utility-lane');
  if (!lane) {
    lane = document.createElement('div');
    lane.id = 'hf-c1-utility-lane';
    document.body.append(lane);
  }

  let gem = document.getElementById('hf-c1-gem-seat') as HTMLButtonElement | null;
  if (!gem) {
    gem = document.createElement('button');
    gem.id = 'hf-c1-gem-seat';
    gem.type = 'button';
    gem.className = 'hf-c1-utility-seat';
    gem.addEventListener('click', () => {
      const effective = enabled ? mode : 'base';
      toast(
        effective === 'base' ? 'SIN GEMA ACTIVA' : `GEMA · ${effective.toUpperCase()}`,
        effective === 'base'
          ? 'Equipá y activá una gema válida para habilitar ATK4 elemental.'
          : 'ATK4 elemental habilitado.',
      );
    });
    lane.append(gem);
  }

  const consumable = document.getElementById('mobile-consumable-seat');
  if (consumable && consumable.parentElement !== lane) lane.append(consumable);
  const stance = document.getElementById('mobile-stance-anchor');
  if (stance && stance.parentElement !== lane) lane.append(stance);
  paintGemSeat();
}

function skillInfo(btn: HTMLButtonElement): { title: string; detail: string } {
  const raw = btn.getAttribute('aria-label') || 'Skill';
  const title = raw.replace(/^Slot\s+\d+:\s*/i, '').trim() || 'Skill';
  const detail =
    btn.getAttribute('aria-description') ||
    btn.getAttribute('title') ||
    'Habilidad original de la clase.';
  return { title, detail };
}

/**
 * The normal desktop actionbar uses browser click events. On phones a second
 * touch may not synthesize click while the left thumb owns the joystick.
 * GAME-C1 owns the touch pointer path for S1-S10 and invokes the SAME native
 * click handler programmatically. Mouse/keyboard remain untouched.
 */
function installSkillTouch(): void {
  document
    .querySelectorAll<HTMLButtonElement>('#actionbar .action-btn[data-hotbar-slot]')
    .forEach((btn) => {
      const slot = Number(btn.dataset.hotbarSlot);
      if (slot < 1 || slot > 10 || btn.dataset.hfC1Touch === '1') return;
      btn.dataset.hfC1Touch = '1';

      let pointerId: number | null = null;
      let downX = 0;
      let downY = 0;
      let timer = 0;
      let inspected = false;
      let dispatchingNativeClick = false;
      let suppressClickUntil = 0;

      const clearTimer = () => {
        if (timer) window.clearTimeout(timer);
        timer = 0;
      };

      btn.addEventListener(
        'pointerdown',
        (event) => {
          if (event.pointerType !== 'touch') return;
          event.preventDefault();
          event.stopImmediatePropagation();
          clearTimer();
          pointerId = event.pointerId;
          downX = event.clientX;
          downY = event.clientY;
          inspected = false;
          timer = window.setTimeout(() => {
            timer = 0;
            inspected = true;
            suppressClickUntil = Date.now() + 800;
            const info = skillInfo(btn);
            toast(info.title, info.detail);
          }, 520);
        },
        { capture: true },
      );

      btn.addEventListener(
        'pointermove',
        (event) => {
          if (event.pointerType !== 'touch' || event.pointerId !== pointerId) return;
          if (Math.hypot(event.clientX - downX, event.clientY - downY) > 12) {
            clearTimer();
            pointerId = null;
          }
        },
        { capture: true },
      );

      btn.addEventListener(
        'pointerup',
        (event) => {
          if (event.pointerType !== 'touch' || event.pointerId !== pointerId) return;
          event.preventDefault();
          event.stopImmediatePropagation();
          clearTimer();
          pointerId = null;
          if (inspected) {
            inspected = false;
            suppressClickUntil = Date.now() + 800;
            return;
          }
          dispatchingNativeClick = true;
          btn.click();
          dispatchingNativeClick = false;
          suppressClickUntil = Date.now() + 800;
        },
        { capture: true },
      );

      btn.addEventListener(
        'pointercancel',
        (event) => {
          if (event.pointerId !== pointerId) return;
          clearTimer();
          pointerId = null;
        },
        { capture: true },
      );

      btn.addEventListener(
        'click',
        (event) => {
          if (dispatchingNativeClick) return;
          if (Date.now() > suppressClickUntil) return;
          event.preventDefault();
          event.stopImmediatePropagation();
        },
        { capture: true },
      );
    });
}

function paintContextualAttack(): void {
  const attack = document.getElementById('mobile-action-attack');
  if (!(attack instanceof HTMLButtonElement)) return;
  const use = w.__highflyGameC1Context?.canUse?.() === true;
  const label = use ? 'USAR' : 'ATK';
  if (attack.dataset.highflyContext !== label) {
    attack.dataset.highflyContext = label;
    attack.setAttribute('aria-label', use ? 'Usar / Interactuar' : 'Ataque básico');
    attack.title = use ? 'Usar / Interactuar' : 'Ataque básico';
  }
}


type HighflyHudTransform = { x: number; y: number; scale: number };
type HighflyHudTarget = {
  id: string;
  label: string;
  selectors: string[];
};

const HIGHFLY_HUD_TARGETS: HighflyHudTarget[] = [
  ...Array.from({ length: 10 }, (_, index) => ({
    id: 's' + (index + 1),
    label: 'HABILIDAD S' + (index + 1),
    selectors: ['#actionbar [data-hotbar-slot="' + (index + 1) + '"]'],
  })),
  { id: 'esp1', label: 'ESPECIAL 1', selectors: ['#hf-c1-esp1'] },
  { id: 'esp2', label: 'ESPECIAL 2', selectors: ['#hf-c1-esp2'] },
  { id: 'ult', label: 'ULT', selectors: ['#hf-c1-ult'] },
  { id: 'target', label: 'TARGET', selectors: ['#mobile-target-cycle'] },
  { id: 'attack', label: 'ATK / USAR', selectors: ['#mobile-action-attack'] },
  { id: 'evade', label: 'EVADIR', selectors: ['#mobile-evade'] },
  { id: 'jump', label: 'SALTAR', selectors: ['#mobile-jump'] },
  { id: 'gem', label: 'GEMA', selectors: ['#hf-c1-gem-seat'] },
  { id: 'potion', label: 'POCIÓN / CONSUMIBLE', selectors: ['#mobile-consumable-seat'] },
  { id: 'stance', label: 'ITEM / POSTURA', selectors: ['#mobile-stance-anchor'] },
  { id: 'buffs', label: 'BUFFS / PASIVAS', selectors: ['#buff-bar'] },
  { id: 'debuffs', label: 'DEBUFFS', selectors: ['#debuff-bar'] },
];

const HIGHFLY_HUD_STORE_PREFIX = 'highfly:c23:hud:';
let highflyHudEditing = false;
let highflyHudSelected = 's1';
let highflyHudDrag:
  | { pointerId: number; targetId: string; startX: number; startY: number; base: HighflyHudTransform }
  | null = null;

function highflyHudElements(target: HighflyHudTarget): HTMLElement[] {
  const out: HTMLElement[] = [];
  for (const selector of target.selectors) {
    const el = document.querySelector<HTMLElement>(selector);
    if (el) out.push(el);
  }
  return out;
}

function highflyHudRead(targetId: string): HighflyHudTransform {
  try {
    const raw = localStorage.getItem(HIGHFLY_HUD_STORE_PREFIX + targetId);
    if (!raw) return { x: 0, y: 0, scale: 1 };
    const parsed = JSON.parse(raw) as Partial<HighflyHudTransform>;
    return {
      x: Number.isFinite(parsed.x) ? Number(parsed.x) : 0,
      y: Number.isFinite(parsed.y) ? Number(parsed.y) : 0,
      scale: Number.isFinite(parsed.scale)
        ? Math.min(1.45, Math.max(0.65, Number(parsed.scale)))
        : 1,
    };
  } catch {
    return { x: 0, y: 0, scale: 1 };
  }
}

function highflyHudApply(targetId: string, value = highflyHudRead(targetId)): void {
  const target = HIGHFLY_HUD_TARGETS.find((candidate) => candidate.id === targetId);
  if (!target) return;
  for (const el of highflyHudElements(target)) {
    el.dataset.hfHudTarget = targetId;
    el.style.setProperty(
      'transform',
      'translate(' + value.x + 'px, ' + value.y + 'px) scale(' + value.scale + ')',
      'important',
    );
    el.style.setProperty('transform-origin', 'center center', 'important');
  }
}

function highflyHudSave(targetId: string, value: HighflyHudTransform): void {
  try {
    localStorage.setItem(HIGHFLY_HUD_STORE_PREFIX + targetId, JSON.stringify(value));
  } catch {
    // Storage can be unavailable in a hardened browser; the live edit still works.
  }
  highflyHudApply(targetId, value);
  highflyHudPaintToolbar();
}

function highflyHudApplyAll(): void {
  for (const target of HIGHFLY_HUD_TARGETS) highflyHudApply(target.id);
}

function highflyHudReset(targetId: string): void {
  try {
    localStorage.removeItem(HIGHFLY_HUD_STORE_PREFIX + targetId);
  } catch {
    // no-op
  }
  const target = HIGHFLY_HUD_TARGETS.find((candidate) => candidate.id === targetId);
  if (!target) return;
  for (const el of highflyHudElements(target)) {
    el.style.removeProperty('transform');
    el.style.removeProperty('transform-origin');
  }
  highflyHudPaintToolbar();
}

function highflyHudResetAll(): void {
  for (const target of HIGHFLY_HUD_TARGETS) highflyHudReset(target.id);
}

function highflyHudSelect(id: string): void {
  if (!HIGHFLY_HUD_TARGETS.some((target) => target.id === id)) return;
  highflyHudSelected = id;
  document.body.dataset.hfHudSelected = id;
  highflyHudPaintToolbar();
}

function highflyHudPaintToolbar(): void {
  const root = document.getElementById('hf-c23-hud-editor');
  if (!root) return;
  const target = HIGHFLY_HUD_TARGETS.find((candidate) => candidate.id === highflyHudSelected);
  const value = highflyHudRead(highflyHudSelected);
  const label = root.querySelector<HTMLElement>('[data-hf-hud-label]');
  const scale = root.querySelector<HTMLElement>('[data-hf-hud-scale]');
  if (label) label.textContent = target?.label ?? 'HUD';
  if (scale) scale.textContent = Math.round(value.scale * 100) + '%';
}

function highflyHudScale(delta: number): void {
  const value = highflyHudRead(highflyHudSelected);
  value.scale = Math.min(1.45, Math.max(0.65, Math.round((value.scale + delta) * 100) / 100));
  highflyHudSave(highflyHudSelected, value);
}

function ensureHighflyHudEditor(): HTMLElement {
  let root = document.getElementById('hf-c23-hud-editor');
  if (root) return root;
  root = document.createElement('div');
  root.id = 'hf-c23-hud-editor';
  root.innerHTML =
    '<div class="hf-c23-hud-editor__title">HIGHFLY · EDITAR HUD</div>' +
    '<div class="hf-c23-hud-editor__selected"><b data-hf-hud-label>HABILIDAD S1</b><span data-hf-hud-scale>100%</span></div>' +
    '<div class="hf-c23-hud-editor__actions">' +
      '<button type="button" data-hf-hud-minus>−</button>' +
      '<button type="button" data-hf-hud-plus>+</button>' +
      '<button type="button" data-hf-hud-reset>RESTAURAR BLOQUE</button>' +
      '<button type="button" data-hf-hud-reset-all>RESTAURAR TODO</button>' +
      '<button type="button" data-hf-hud-done>LISTO</button>' +
    '</div>' +
    '<small>TOCÁ Y ARRASTRÁ CUALQUIER BLOQUE · −/+ CAMBIA SU TAMAÑO</small>';
  root.querySelector('[data-hf-hud-minus]')?.addEventListener('click', () => highflyHudScale(-0.05));
  root.querySelector('[data-hf-hud-plus]')?.addEventListener('click', () => highflyHudScale(0.05));
  root.querySelector('[data-hf-hud-reset]')?.addEventListener('click', () => highflyHudReset(highflyHudSelected));
  root.querySelector('[data-hf-hud-reset-all]')?.addEventListener('click', highflyHudResetAll);
  root.querySelector('[data-hf-hud-done]')?.addEventListener('click', () => {
    highflyHudEditing = false;
    highflyHudDrag = null;
    document.body.classList.remove('hf-c23-hud-editing');
    root!.hidden = true;
  });
  document.body.append(root);
  return root;
}

function openHighflyHudEditor(): void {
  const close = document.querySelector<HTMLElement>('#options-window [data-close], #options [data-close]');
  close?.click();
  highflyHudEditing = true;
  highflyHudSelect(highflyHudSelected);
  const root = ensureHighflyHudEditor();
  root.hidden = false;
  document.body.classList.add('hf-c23-hud-editing');
  highflyHudApplyAll();
}

function highflyHudTargetFromEvent(event: PointerEvent): HighflyHudTarget | null {
  const path = event.composedPath();
  for (const target of HIGHFLY_HUD_TARGETS) {
    const elements = highflyHudElements(target);
    if (elements.some((el) => path.includes(el))) return target;
  }
  return null;
}

function installHighflyHudEditorInput(): void {
  if (document.body.dataset.hfC23HudEditorInput === '1') return;
  document.body.dataset.hfC23HudEditorInput = '1';
  window.addEventListener('highfly:mobile-hud-editor', openHighflyHudEditor);
  document.addEventListener(
    'pointerdown',
    (event) => {
      if (!highflyHudEditing) return;
      const target = highflyHudTargetFromEvent(event);
      if (!target) return;
      event.preventDefault();
      highflyHudSelect(target.id);
      highflyHudDrag = {
        pointerId: event.pointerId,
        targetId: target.id,
        startX: event.clientX,
        startY: event.clientY,
        base: highflyHudRead(target.id),
      };
    },
    { capture: true },
  );
  document.addEventListener(
    'pointermove',
    (event) => {
      const drag = highflyHudDrag;
      if (!highflyHudEditing || !drag || drag.pointerId !== event.pointerId) return;
      event.preventDefault();
      highflyHudSave(drag.targetId, {
        x: drag.base.x + event.clientX - drag.startX,
        y: drag.base.y + event.clientY - drag.startY,
        scale: drag.base.scale,
      });
    },
    { capture: true },
  );
  const finish = (event: PointerEvent) => {
    if (highflyHudDrag?.pointerId === event.pointerId) highflyHudDrag = null;
  };
  document.addEventListener('pointerup', finish, { capture: true });
  document.addEventListener('pointercancel', finish, { capture: true });
}

function syncHighflyBagsCoach(): void {
  const bags = document.getElementById('bags');
  const open =
    !!bags &&
    bags.style.display !== 'none' &&
    getComputedStyle(bags).display !== 'none';
  if (open) {
    try {
      localStorage.setItem('highfly:c23:coach:bags', '1');
    } catch {
      // no-op
    }
  }
  let done = false;
  try {
    done = localStorage.getItem('highfly:c23:coach:bags') === '1';
  } catch {
    done = open;
  }
  document.querySelectorAll<HTMLElement>('.qd-coach, .tut-prompt').forEach((coach) => {
    const bagsCoach = (coach.textContent ?? '').toLocaleUpperCase('es').includes('BOLSAS');
    coach.classList.toggle('hf-c23-bags-complete', bagsCoach && done);
    if (!bagsCoach || done || coach.dataset.hfC23BagsTap === '1') return;
    coach.dataset.hfC23BagsTap = '1';
    coach.addEventListener('click', () => {
      const button =
        document.getElementById('mobile-menu-bags') ??
        document.getElementById('mobile-bags');
      if (button instanceof HTMLElement) button.click();
    });
  });
}

function boot(): void {
  document.body.classList.add('hf-game-c1', 'hf-game-c22', 'hf-game-c23', 'hf-game-c24', 'hf-game-c25');
  ensureBuildStamp();
  ensureSpecialSeats();
  ensureGhostSkillSeats();
  ensureUtilityLane();
  installCoachmarkRelease();
  installHighflyHudEditorInput();
  highflyHudApplyAll();

  const tick = () => {
    ensureSpecialSeats();
    ensureGhostSkillSeats();
    ensureUtilityLane();
    installSkillTouch();
    paintContextualAttack();
    syncCreatorPreviewState();
    syncHighflyBagsCoach();
    if (!highflyHudEditing) highflyHudApplyAll();
    configureElement();
    window.setTimeout(tick, 180);
  };
  tick();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}

w.__highflyGameC1 = {
  element: () => (enabled ? mode : 'base'),
  setElement: (next, active = true) => {
    if (!HIGHFLY_WEAPON_ELEMENTS.includes(next)) return;
    mode = next;
    enabled = active && next !== 'base';
    lastElementSignature = '';
    configureElement();
  },
};
