/**
 * HIGHFLY FURY F1 — Independent skill-thumb interaction coordinator.
 *
 * The EXISTING ClaudeCraft TouchOwnerLedger owns movement/camera fingers.
 * This object is called ONLY for a pointer already classified combatButton.
 * No DOM access, no event listeners, no joystick/camera rewriting.
 */
import { FuryAimGesture } from './fury_core.ts';
import type { FuryAimResult, FuryGroundPoint } from './fury_core.ts';
import { makeFurySkillPreview } from './skill_preview.ts';
import type { FurySkillVisualSpec, FuryGroundPreview, FuryPreviewTone } from './skill_preview.ts';

export interface FuryScreenPoint { readonly x: number; readonly y: number }
export interface FuryCancelZone { readonly center: FuryScreenPoint; readonly radiusPx: number }
export interface FuryTouchContext {
  readonly player: FuryGroundPoint;
  readonly cameraYaw: number;
}
export interface FuryPreviewFrame {
  readonly pointerId: number;
  readonly cancelled: boolean;
  readonly aim: FuryAimResult | null;
  readonly geometry: FuryGroundPreview | null;
}
export interface FurySkillHooks {
  /** Existing native spell execution: check class, cooldown, costs, status and hit rules. */
  readonly attemptNativeCast: (intent: FuryAimResult) => boolean;
  /** Optional scene renderer update; null removes all aiming telegraphs. */
  readonly showPreview?: (frame: FuryPreviewFrame | null) => void;
}
export type FurySkillReleaseStatus =
  'ignored' | 'cancelled' | 'native-accepted' | 'native-rejected';
const finite = (...v: number[]) => v.every(Number.isFinite);
const inCancelZone = (pos:FuryScreenPoint,zone:FuryCancelZone|null) =>
  !!zone && finite(pos.x,pos.y,zone.center.x,zone.center.y,zone.radiusPx) &&
  zone.radiusPx>0 &&
  Math.hypot(pos.x-zone.center.x,pos.y-zone.center.y) <= zone.radiusPx;

/**
 * Users can keep moving with thumb A while thumb B drags a skill button.
 * Start x/y are button-center screen coordinates, not relative to canvas.
 * Button release => native call once; cancel zone, pointercancel and focus
 * loss => never spend mana/cooldowns.
 */
export class FurySkillTouchController {
  private readonly gesture = new FuryAimGesture();
  private active: {
    pointerId: number; originScreen: FuryScreenPoint;
    spec: FurySkillVisualSpec; tone: FuryPreviewTone;
    cancelZone: FuryCancelZone | null;
  } | null = null;
  constructor(private readonly hooks: FurySkillHooks) {}

  get aiming(): boolean { return this.active !== null; }
  get activeAbilityId(): string | null { return this.active?.spec.abilityId ?? null; }

  begin(
    pointerId: number,
    spec: FurySkillVisualSpec,
    screen: FuryScreenPoint,
    context: FuryTouchContext,
    opts: {cancelZone?: FuryCancelZone | null; tone?: FuryPreviewTone} = {},
  ): boolean {
    if (this.active || !finite(screen.x,screen.y) || !Number.isInteger(pointerId)) return false;
    if (!this.gesture.start(pointerId,spec,context.player,context.cameraYaw)) return false;
    this.active = {pointerId, originScreen:screen, spec,
      cancelZone:opts.cancelZone??null, tone:opts.tone??'offensive'};
    this.update(pointerId,screen,context);
    return true;
  }

  update(pointerId: number, screen:FuryScreenPoint,context:FuryTouchContext):FuryPreviewFrame|null {
    const s=this.active;
    if (!s || s.pointerId!==pointerId || !finite(screen.x,screen.y)) return null;
    if (!this.gesture.updateContext(pointerId,context.player,context.cameraYaw)) return null;
    const cancelled=inCancelZone(screen,s.cancelZone);
    const dx=screen.x-s.originScreen.x, dy=screen.y-s.originScreen.y;
    const intent=this.gesture.preview(pointerId,dx,dy);
    const geometry=intent && !cancelled
      ? makeFurySkillPreview(context.player,intent,s.spec,s.tone)
      : null;
    const frame={pointerId,cancelled,aim:cancelled?null:intent,geometry};
    this.hooks.showPreview?.(frame);
    return frame;
  }

  release(pointerId: number,screen:FuryScreenPoint,context:FuryTouchContext):FurySkillReleaseStatus {
    const s=this.active;
    if (!s || s.pointerId!==pointerId) return 'ignored';
    // Process a final position update against CURRENT player position to
    // guarantee that what the user saw and what they cast share one geometry.
    const final=this.update(pointerId,screen,context);
    if (!final || final.cancelled || !final.aim || !final.geometry) {
      this.reset();
      return 'cancelled';
    }
    const intent=this.gesture.release(pointerId,
      screen.x-s.originScreen.x,screen.y-s.originScreen.y);
    this.active=null;
    this.hooks.showPreview?.(null);
    if (!intent) return 'cancelled';
    return this.hooks.attemptNativeCast(intent) ? 'native-accepted' : 'native-rejected';
  }

  cancel(pointerId:number):boolean {
    if (!this.active || this.active.pointerId!==pointerId) return false;
    this.reset();
    return true;
  }

  /** Use on pointercancel, lostpointercapture, menu/modal open or window blur. */
  reset():void {
    this.gesture.clear();
    this.active=null;
    this.hooks.showPreview?.(null);
  }
}
