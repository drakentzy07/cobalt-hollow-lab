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

const HIGHFLY_GAME_C22_BUILD = 'C2.8.2-s23-camera-clear';
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

function highflySurfaceVisible(id: string): boolean {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLElement) || el.hidden) return false;
  const style = getComputedStyle(el);
  const rects = el.getClientRects();
  if (rects.length === 0) return false;
  const rect = el.getBoundingClientRect();
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    Number(style.opacity || '1') > 0.01 &&
    rect.width > 1 &&
    rect.height > 1
  );
}

const HIGHFLY_WORLD_BLOCKERS = [
  'start-screen',
  'offline-select',
  'charselect-panel',
  'charcreate-panel',
  'mobile-preflight',
  'rotate-device',
  'loading-screen',
] as const;

function syncHighflyWorldReady(): void {
  const blocked = HIGHFLY_WORLD_BLOCKERS.some((id) => highflySurfaceVisible(id));
  const ready =
    document.body.classList.contains('game-active') &&
    Boolean(w.__game?.sim?.player) &&
    !blocked;
  document.body.classList.toggle('hf-c25-world-ready', ready);
  document.body.classList.toggle('hf-c27-pregame', !ready);
}

function installHighflyWorldReadyObserver(): void {
  if (document.body.dataset.hfC27WorldObserver === '1') return;
  document.body.dataset.hfC27WorldObserver = '1';
  const observer = new MutationObserver(syncHighflyWorldReady);
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  for (const id of HIGHFLY_WORLD_BLOCKERS) {
    const el = document.getElementById(id);
    if (!el) continue;
    observer.observe(el, {
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'aria-hidden'],
    });
  }
  document.addEventListener('visibilitychange', syncHighflyWorldReady);
}


type HighflyHudTransform = { x: number; y: number; scale: number; opacity: number };
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
  { id: 'move', label: 'JOYSTICK', selectors: ['#mobile-move-zone'] },
  { id: 'menu', label: 'MENÚ', selectors: ['#mobile-menu-anchor'] },
  { id: 'gem', label: 'GEMA', selectors: ['#hf-c1-gem-seat'] },
  { id: 'potion', label: 'POCIÓN / CONSUMIBLE', selectors: ['#mobile-consumable-seat'] },
  { id: 'stance', label: 'ITEM / POSTURA', selectors: ['#mobile-stance-anchor'] },
  { id: 'buffs', label: 'BUFFS / PASIVAS', selectors: ['#buff-bar'] },
  { id: 'debuffs', label: 'DEBUFFS', selectors: ['#debuff-bar'] },
];

const HIGHFLY_HUD_STORE_PREFIX = 'highfly:c282:hud:';

const HIGHFLY_HUD_DEFAULTS: Record<string, HighflyHudTransform> = {
  s1: { x: 21, y: 15, scale: 1, opacity: 1 },
  s2: { x: 27, y: 13, scale: 1, opacity: 1 },
  s3: { x: 63, y: 3, scale: 1, opacity: 1 },
  s4: { x: 74, y: -4, scale: 1, opacity: 1 },
  s5: { x: 59, y: -11, scale: 1, opacity: 1 },
  s6: { x: 9, y: 17, scale: 1, opacity: 1 },
  s7: { x: 28, y: 1, scale: 1, opacity: 1 },
  s8: { x: 65, y: -14, scale: 1, opacity: 1 },
  s9: { x: 76, y: -19, scale: 1, opacity: 1 },
  s10: { x: 61, y: -24, scale: 1, opacity: 1 },
  esp1: { x: 58, y: 15, scale: 1, opacity: 1 },
  esp2: { x: 72, y: 4, scale: 1, opacity: 1 },
  ult: { x: 60, y: -7, scale: 1, opacity: 1 },
  target: { x: 12, y: 23, scale: 1, opacity: 1 },
  attack: { x: 13, y: 8, scale: 1.08, opacity: 1 },
  evade: { x: 55, y: 18, scale: 1, opacity: 1 },
  jump: { x: -74, y: 14, scale: 1, opacity: 1 },
  move: { x: 0, y: 0, scale: 1, opacity: 1 },
  menu: { x: 0, y: 0, scale: 1, opacity: 1 },
  gem: { x: 0, y: 0, scale: 1, opacity: 1 },
  potion: { x: 0, y: 0, scale: 1, opacity: 1 },
  stance: { x: 0, y: 0, scale: 1, opacity: 1 },
  buffs: { x: 0, y: 0, scale: 1, opacity: 1 },
  debuffs: { x: 0, y: 0, scale: 1, opacity: 1 },
};

function highflyHudDefault(targetId: string): HighflyHudTransform {
  const value = HIGHFLY_HUD_DEFAULTS[targetId];
  return value ? { ...value } : { x: 0, y: 0, scale: 1, opacity: 1 };
}
let highflyHudEditing = false;
let highflyHudSelected = 's1';
let highflyHudDrag:
  | { pointerId: number; targetId: string; startX: number; startY: number; base: HighflyHudTransform }
  | null = null;

function highflyHudClampOffset(value: number): number {
  return Math.max(-420, Math.min(420, Math.round(value)));
}

function highflyHudElements(target: HighflyHudTarget): HTMLElement[] {
  const out: HTMLElement[] = [];
  for (const selector of target.selectors) {
    const el = document.querySelector<HTMLElement>(selector);
    if (el) out.push(el);
  }
  return out;
}

function highflyHudRead(targetId: string): HighflyHudTransform {
  const fallback = highflyHudDefault(targetId);
  try {
    const raw = localStorage.getItem(HIGHFLY_HUD_STORE_PREFIX + targetId);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<HighflyHudTransform>;
    return {
      x: Number.isFinite(parsed.x) ? highflyHudClampOffset(Number(parsed.x)) : fallback.x,
      y: Number.isFinite(parsed.y) ? highflyHudClampOffset(Number(parsed.y)) : fallback.y,
      scale: Number.isFinite(parsed.scale)
        ? Math.min(1.45, Math.max(0.65, Number(parsed.scale)))
        : fallback.scale,
      opacity: Number.isFinite(parsed.opacity)
        ? Math.min(1, Math.max(0.35, Number(parsed.opacity)))
        : fallback.opacity,
    };
  } catch {
    return fallback;
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
    el.style.setProperty('opacity', String(value.opacity));
  }
}

function highflyHudSave(targetId: string, value: HighflyHudTransform): void {
  const normalized: HighflyHudTransform = {
    x: highflyHudClampOffset(value.x),
    y: highflyHudClampOffset(value.y),
    scale: Math.min(1.45, Math.max(0.65, Math.round(value.scale * 100) / 100)),
    opacity: Math.min(1, Math.max(0.35, Math.round(value.opacity * 100) / 100)),
  };
  try {
    localStorage.setItem(HIGHFLY_HUD_STORE_PREFIX + targetId, JSON.stringify(normalized));
  } catch {
    // Storage can be unavailable in a hardened browser; the live edit still works.
  }
  highflyHudApply(targetId, normalized);
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
    el.style.removeProperty('opacity');
  }
  highflyHudApply(targetId);
  highflyHudPaintToolbar();
}

function highflyHudResetAll(): void {
  for (const target of HIGHFLY_HUD_TARGETS) highflyHudReset(target.id);
  toast('HUD RESTAURADO', 'Volvimos a la distribución HIGHFLY por defecto.');
}

function highflyHudSelect(id: string): void {
  if (!HIGHFLY_HUD_TARGETS.some((target) => target.id === id)) return;
  highflyHudSelected = id;
  document.body.dataset.hfHudSelected = id;
  for (const target of HIGHFLY_HUD_TARGETS) {
    for (const el of highflyHudElements(target)) {
      el.classList.toggle('hf-c28-hud-selected', target.id === id);
    }
  }
  highflyHudPaintToolbar();
}

function highflyHudPaintToolbar(): void {
  const root = document.getElementById('hf-c28-hud-editor');
  if (!root) return;
  const target = HIGHFLY_HUD_TARGETS.find((candidate) => candidate.id === highflyHudSelected);
  const value = highflyHudRead(highflyHudSelected);
  const label = root.querySelector<HTMLElement>('[data-hf-hud-label]');
  const scaleText = root.querySelector<HTMLElement>('[data-hf-hud-scale-text]');
  const opacityText = root.querySelector<HTMLElement>('[data-hf-hud-opacity-text]');
  const xText = root.querySelector<HTMLElement>('[data-hf-hud-x-text]');
  const yText = root.querySelector<HTMLElement>('[data-hf-hud-y-text]');
  const scale = root.querySelector<HTMLInputElement>('[data-hf-hud-scale]');
  const opacity = root.querySelector<HTMLInputElement>('[data-hf-hud-opacity]');
  const x = root.querySelector<HTMLInputElement>('[data-hf-hud-x]');
  const y = root.querySelector<HTMLInputElement>('[data-hf-hud-y]');
  if (label) label.textContent = target?.label ?? 'HUD';
  if (scaleText) scaleText.textContent = Math.round(value.scale * 100) + '%';
  if (opacityText) opacityText.textContent = Math.round(value.opacity * 100) + '%';
  if (xText) xText.textContent = (value.x >= 0 ? '+' : '') + value.x;
  if (yText) yText.textContent = (value.y >= 0 ? '+' : '') + value.y;
  if (scale) scale.value = String(Math.round(value.scale * 100));
  if (opacity) opacity.value = String(Math.round(value.opacity * 100));
  if (x) x.value = String(value.x);
  if (y) y.value = String(value.y);
}

function highflyHudUpdateSelected(patch: Partial<HighflyHudTransform>): void {
  highflyHudSave(highflyHudSelected, { ...highflyHudRead(highflyHudSelected), ...patch });
}

function highflyHudPresetPayload(): string {
  const targets: Record<string, HighflyHudTransform> = {};
  for (const target of HIGHFLY_HUD_TARGETS) targets[target.id] = highflyHudRead(target.id);
  return JSON.stringify({
    version: 4,
    build: HIGHFLY_GAME_C22_BUILD,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    targets,
  });
}

async function highflyHudExportPreset(): Promise<void> {
  const payload = highflyHudPresetPayload();
  try {
    await navigator.clipboard.writeText(payload);
    toast('PRESET HUD COPIADO', 'Pegalo en el chat y lo convierto en el default oficial.');
  } catch {
    window.prompt('COPIÁ ESTE PRESET HUD', payload);
  }
}

function closeHighflyHudEditor(): void {
  highflyHudEditing = false;
  highflyHudDrag = null;
  document.body.classList.remove('hf-c23-hud-editing', 'hf-c28-hud-editing');
  document.querySelectorAll('.hf-c28-hud-selected').forEach((el) =>
    el.classList.remove('hf-c28-hud-selected'),
  );
  const root = document.getElementById('hf-c28-hud-editor');
  if (root) root.hidden = true;
  toast('HUD GUARDADO', 'La distribución quedó guardada en este dispositivo.');
}

function ensureHighflyHudEditor(): HTMLElement {
  let root = document.getElementById('hf-c28-hud-editor');
  if (root) return root;
  root = document.createElement('div');
  root.id = 'hf-c28-hud-editor';
  root.hidden = true;
  root.innerHTML =
    '<div class="hf-c28-hud-editor__head">' +
      '<div><small>INTERFAZ PERSONALIZADA</small><b data-hf-hud-label>HABILIDAD S1</b></div>' +
      '<button type="button" class="hf-c28-hud-editor__close" data-hf-hud-done aria-label="Guardar y salir">✓</button>' +
    '</div>' +
    '<div class="hf-c28-hud-editor__sliders">' +
      '<label><span>TAMAÑO <b data-hf-hud-scale-text>100%</b></span><input data-hf-hud-scale type="range" min="65" max="145" step="1" value="100"></label>' +
      '<label><span>TRANSPARENCIA <b data-hf-hud-opacity-text>100%</b></span><input data-hf-hud-opacity type="range" min="35" max="100" step="1" value="100"></label>' +
      '<label><span>X <b data-hf-hud-x-text>+0</b></span><input data-hf-hud-x type="range" min="-420" max="420" step="1" value="0"></label>' +
      '<label><span>Y <b data-hf-hud-y-text>+0</b></span><input data-hf-hud-y type="range" min="-320" max="320" step="1" value="0"></label>' +
    '</div>' +
    '<div class="hf-c28-hud-editor__actions">' +
      '<button type="button" data-hf-hud-reset>RESTABLECER ELEMENTO</button>' +
      '<button type="button" data-hf-hud-reset-all>RESTABLECER TODO</button>' +
      '<button type="button" data-hf-hud-export>EXPORTAR PRESET</button>' +
      '<button type="button" class="primary" data-hf-hud-done>GUARDAR</button>' +
    '</div>' +
    '<small class="hf-c28-hud-editor__hint">TOCÁ UN CONTROL DEL HUD Y ARRASTRALO · TAMBIÉN PODÉS AJUSTARLO CON LOS DESLIZADORES</small>';

  root.querySelector<HTMLInputElement>('[data-hf-hud-scale]')?.addEventListener('input', (event) => {
    highflyHudUpdateSelected({ scale: Number((event.currentTarget as HTMLInputElement).value) / 100 });
  });
  root.querySelector<HTMLInputElement>('[data-hf-hud-opacity]')?.addEventListener('input', (event) => {
    highflyHudUpdateSelected({ opacity: Number((event.currentTarget as HTMLInputElement).value) / 100 });
  });
  root.querySelector<HTMLInputElement>('[data-hf-hud-x]')?.addEventListener('input', (event) => {
    highflyHudUpdateSelected({ x: Number((event.currentTarget as HTMLInputElement).value) });
  });
  root.querySelector<HTMLInputElement>('[data-hf-hud-y]')?.addEventListener('input', (event) => {
    highflyHudUpdateSelected({ y: Number((event.currentTarget as HTMLInputElement).value) });
  });
  root.querySelector('[data-hf-hud-reset]')?.addEventListener('click', () => highflyHudReset(highflyHudSelected));
  root.querySelector('[data-hf-hud-reset-all]')?.addEventListener('click', highflyHudResetAll);
  root.querySelector('[data-hf-hud-export]')?.addEventListener('click', () => void highflyHudExportPreset());
  root.querySelectorAll('[data-hf-hud-done]').forEach((button) =>
    button.addEventListener('click', closeHighflyHudEditor),
  );
  document.body.append(root);
  return root;
}

function openHighflyHudEditor(): void {
  const settings = document.getElementById('hf-c28-mobile-settings');
  if (settings) settings.hidden = true;
  document.body.classList.remove('hf-c28-mobile-settings-open');
  highflyHudEditing = true;
  const root = ensureHighflyHudEditor();
  root.hidden = false;
  document.body.classList.add('hf-c23-hud-editing', 'hf-c28-hud-editing');
  highflyHudApplyAll();
  highflyHudSelect(highflyHudSelected);
}

function ensureHighflyMobileSettings(): HTMLElement {
  let root = document.getElementById('hf-c28-mobile-settings');
  if (root) return root;
  root = document.createElement('div');
  root.id = 'hf-c28-mobile-settings';
  root.hidden = true;
  root.innerHTML =
    '<div class="hf-c28-mobile-settings__panel" role="dialog" aria-modal="true" aria-label="Ajustes HIGHFLY">' +
      '<div class="hf-c28-mobile-settings__head"><div><small>HIGHFLY</small><h2>AJUSTES</h2></div><button type="button" data-hf-settings-close aria-label="Cerrar">×</button></div>' +
      '<div class="hf-c28-mobile-settings__section">' +
        '<span class="hf-c28-mobile-settings__eyebrow">INTERFAZ</span>' +
        '<h3>HUD MÓVIL</h3>' +
        '<p>Mové y escalá habilidades, especiales, joystick, menú, utilidades, buffs y controles de combate sobre el juego real.</p>' +
        '<button type="button" class="hf-c28-mobile-settings__customize" data-hf-settings-customize>PERSONALIZAR HUD</button>' +
      '</div>' +
      '<div class="hf-c28-mobile-settings__note">La distribución se guarda sólo en este dispositivo. Podés exportarla para convertirla en preset oficial.</div>' +
    '</div>';
  const close = () => {
    root!.hidden = true;
    document.body.classList.remove('hf-c28-mobile-settings-open');
  };
  root.querySelector('[data-hf-settings-close]')?.addEventListener('click', close);
  root.addEventListener('pointerdown', (event) => {
    if (event.target === root) close();
  });
  root.querySelector('[data-hf-settings-customize]')?.addEventListener('click', openHighflyHudEditor);
  document.body.append(root);
  return root;
}

function openHighflyMobileSettings(): void {
  if (!document.body.classList.contains('mobile-touch')) {
    w.__game?.hud?.toggleOptionsMenu?.();
    return;
  }
  const root = ensureHighflyMobileSettings();
  root.hidden = false;
  document.body.classList.add('hf-c28-mobile-settings-open');
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
  window.addEventListener('highfly:mobile-settings', openHighflyMobileSettings);
  document.addEventListener(
    'pointerdown',
    (event) => {
      if (!highflyHudEditing) return;
      const target = highflyHudTargetFromEvent(event);
      if (!target) return;
      event.preventDefault();
      event.stopImmediatePropagation();
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
      event.stopImmediatePropagation();
      highflyHudSave(drag.targetId, {
        x: drag.base.x + event.clientX - drag.startX,
        y: drag.base.y + event.clientY - drag.startY,
        scale: drag.base.scale,
        opacity: drag.base.opacity,
      });
    },
    { capture: true },
  );
  const finish = (event: PointerEvent) => {
    if (!highflyHudEditing || highflyHudDrag?.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    highflyHudDrag = null;
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
  installHighflyWorldReadyObserver();
  syncHighflyWorldReady();
  highflyHudApplyAll();

  const tick = () => {
    syncHighflyWorldReady();
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
