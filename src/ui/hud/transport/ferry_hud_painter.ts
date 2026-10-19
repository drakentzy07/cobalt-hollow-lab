// Thin facet-routed painter for the ferry HUD: the small timetable panel near
// the top of the screen (the countdown to the next departure plus the
// boarding hint, or the quiet sailing line aboard). The consumer half of the
// pure-core + thin-painter split over ferry_hud_view.ts: it owns only the
// lazily built DOM under the injected mount, and EVERY per-update write
// routes through the PainterHost elided writers. It runs on the HUD's medium
// band. Text re-renders through t() each update and relies on writer elision,
// so a language switch applies on the next update.
//
// Fairness: the countdown is the same on every graphics tier.

import type { Entity } from '../../../sim/types';
import type { TransportFerryView } from '../../../world_api';
import { poiMarkLabel } from '../../entity_i18n';
import { formatNumber, t } from '../../i18n';
import type { PainterHostWriters } from '../../painter_host';
import { emptyFerryHudModel, type FerryHudModel, ferryHudModel } from './ferry_hud_view';

interface FerryHudEls {
  root: HTMLElement;
  line: HTMLElement;
  hint: HTMLElement;
}

/** m:ss with localized digits (the Yumi match clock's form). */
function clock(seconds: number): string {
  const minutes = formatNumber(Math.floor(seconds / 60), { maximumFractionDigits: 0 });
  const rest = formatNumber(seconds % 60, { minimumIntegerDigits: 2, maximumFractionDigits: 0 });
  return `${minutes}:${rest}`;
}

export class FerryHudPainter {
  private els: FerryHudEls | null = null;
  private readonly model: FerryHudModel = emptyFerryHudModel();
  private dismissed = false;

  constructor(
    private readonly w: PainterHostWriters,
    private readonly mount: () => HTMLElement | null,
  ) {}

  update(view: TransportFerryView | null, player: Entity | undefined): void {
    const m = ferryHudModel(view, player?.pos.x ?? 0, player?.pos.z ?? 0, this.model);
    if (m.line === 'none') this.dismissed = false;
    if (m.line === 'none' && !this.els) return;
    const els = this.ensureEls();
    if (!els) return;
    const dest = poiMarkLabel(m.destPoi) ?? '';
    this.w.setDisplay(els.root, m.line === 'none' || this.dismissed ? 'none' : 'flex');
    if (m.line === 'departsIn') {
      this.w.setText(els.line, t('hudChrome.ferry.departsIn', { dest, time: clock(m.seconds) }));
    } else if (m.line === 'castingOff') {
      this.w.setText(els.line, t('hudChrome.ferry.castingOff', { dest }));
    } else if (m.line === 'sailing') {
      this.w.setText(els.line, t('hudChrome.ferry.sailing', { dest }));
    }
    // Visibility rides setStyleProp, not setDisplay: the hint node also carries
    // its text, and two single-slot writers on one node would never elide.
    this.w.setStyleProp(els.hint, 'display', m.hint ? 'block' : 'none');
    if (m.hint) this.w.setText(els.hint, t('hudChrome.ferry.boardHint'));
    this.w.setAttr(els.root, 'aria-label', t('hudChrome.ferry.regionLabel'));
  }

  // Build the DOM once under the mount; static structure only (all text and
  // dynamic state flow through the elided writers in update()).
  private ensureEls(): FerryHudEls | null {
    if (this.els) return this.els;
    const mount = this.mount();
    if (!mount) return null;
    const root = document.createElement('div');
    root.id = 'ferry-hud';
    root.className = 'ferry-hud ui-panel';
    root.setAttribute('role', 'status');
    const line = document.createElement('div');
    line.className = 'ferry-hud-line';
    const hint = document.createElement('div');
    hint.className = 'ferry-hud-hint';
    // A real dismiss control — the ferry timetable is optional information,
    // never a modal and never a travel/camera lock. Only Origin exposes it.
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'ferry-hud-dismiss';
    close.setAttribute('aria-label', 'Cerrar aviso del barco');
    close.textContent = '×';
    close.addEventListener('click', () => {
      this.dismissed = true;
      this.w.setDisplay(root, 'none');
    });
    root.append(line, hint, close);
    mount.append(root);
    this.els = { root, line, hint };
    return this.els;
  }
}
