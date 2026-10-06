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
const C22_TRAINING_GUIDE_KEY = 'highfly.c22.training-guide.v1';

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

function ensureHighflyHudAuthority(): void {
  // ClaudeCraft mutates root state classes during mobile/window transitions.
  // C2.2 makes HIGHFLY HUD ownership self-healing instead of assuming the
  // one-time boot marker can never disappear.
  document.body.classList.add('hf-game-c1');
  document.body.dataset.highflyHudBuild = 'C2.2_VIDEO_QA';
}

function visibleElement(selector: string): HTMLElement | null {
  const el = document.querySelector(selector);
  if (!(el instanceof HTMLElement)) return null;
  const style = getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    Number(style.opacity || '1') > 0 &&
    rect.width > 0 &&
    rect.height > 0
  )
    ? el
    : null;
}

function removeFirstUseCoach(): void {
  document.getElementById('hf-c22-first-use-coach')?.remove();
}

function paintFirstUseCoach(): void {
  if (!document.body.classList.contains('mobile-touch') || !game()) {
    removeFirstUseCoach();
    return;
  }

  try {
    if (localStorage.getItem(C22_TRAINING_GUIDE_KEY) === 'done') {
      removeFirstUseCoach();
      return;
    }
  } catch {
    // Storage can be unavailable in private/embedded contexts; keep guidance transient.
  }

  // Never stack HIGHFLY guidance over Claude's own first-spawn/tutorial sheets.
  if (
    visibleElement('#tutorial-greeting') ||
    visibleElement('.tutorial-overlay') ||
    visibleElement('.camera-prompt')
  ) {
    removeFirstUseCoach();
    return;
  }

  if (visibleElement('#highfly-training-window')) {
    try {
      localStorage.setItem(C22_TRAINING_GUIDE_KEY, 'done');
    } catch {}
    removeFirstUseCoach();
    return;
  }

  let coach = document.getElementById('hf-c22-first-use-coach') as HTMLButtonElement | null;
  if (!coach) {
    coach = document.createElement('button');
    coach.type = 'button';
    coach.id = 'hf-c22-first-use-coach';
    coach.className = 'hf-c22-first-use-coach';
    document.body.append(coach);
  }

  if (document.body.classList.contains('mobile-more-open')) {
    coach.textContent = 'ENTRENAMIENTO · TOCÁ PARA ABRIR';
    coach.onclick = () => document.getElementById('mobile-training')?.click();
  } else {
    coach.textContent = 'MENÚ · TOCÁ ⋯ PARA ENTRAR A ENTRENAMIENTO';
    coach.onclick = () => document.getElementById('mobile-menu-anchor')?.click();
  }
}

function paintCreatorPreviewStatus(): void {
  const container = visibleElement('#offline-preview-container');
  if (!container) {
    document.getElementById('hf-c22-preview-status')?.remove();
    return;
  }
  const canvas = container.querySelector('#char-preview-canvas');
  const ready =
    canvas instanceof HTMLCanvasElement &&
    !!canvas.dataset.highflyPreviewVisual &&
    Number(canvas.dataset.highflyPreviewFrame ?? '0') > 0;
  if (ready) {
    document.getElementById('hf-c22-preview-status')?.remove();
    return;
  }
  let status = document.getElementById('hf-c22-preview-status');
  if (!status) {
    status = document.createElement('div');
    status.id = 'hf-c22-preview-status';
    status.className = 'hf-c22-preview-status';
    status.textContent = 'CARGANDO HUNTER…';
    container.append(status);
  }
}

function boot(): void {
  ensureHighflyHudAuthority();
  ensureSpecialSeats();
  ensureUtilityLane();

  const tick = () => {
    ensureHighflyHudAuthority();
    ensureSpecialSeats();
    ensureUtilityLane();
    installSkillTouch();
    paintContextualAttack();
    paintFirstUseCoach();
    paintCreatorPreviewStatus();
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
