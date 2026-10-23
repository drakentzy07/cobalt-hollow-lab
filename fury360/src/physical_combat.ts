/**
 * HIGHFLY FURY F3 — physical combat timeline (NO native movement authority).
 * All native hit rules, costs, melee range, jump/dash cooldowns, cast restrictions
 * and state mutations belong to ClaudeCraft's existing simulation.
 */
import { FuryComboClock, gateFuryAction } from './fury_core.ts';
import type { FuryActionRequest, FuryGroundPoint } from './fury_core.ts';

export type FuryPhysicalKind = 'basic' | 'native-skill';
export interface FuryPhysicalRequest {
  readonly kind: FuryPhysicalKind;
  /** Native ability ID is required for skill; never invent a skill. */
  readonly abilityId?: string;
  readonly gate: FuryActionRequest;
  /** Earliest presentation-only transition, relative to a successful native action. */
  readonly cancelOpensMs: number;
  /** Total visual action window, relative to successful acceptance. */
  readonly durationMs: number;
  readonly bufferMs?: number;
  readonly allowCancelPrevious?: boolean;
}
export type FuryProposal = Readonly<{ ticket: number; action: FuryPhysicalRequest }>;
export type FuryRequestResult =
  | { status: 'ready'; proposal: FuryProposal }
  | { status: 'buffered' | 'rejected'; reason: string };
export interface FuryAcceptedAction {
  readonly kind: FuryPhysicalKind;
  readonly abilityId: string | null;
  readonly acceptedAtMs: number;
  readonly expiresAtMs: number;
  readonly cancelOpensAtMs: number;
  readonly comboStep: number;
}
const finite = (...xs: number[]) => xs.every(Number.isFinite);
export class FuryPhysicalCombatTimeline {
  private nextTicket = 0;
  private pending: FuryProposal | null = null;
  private current: FuryAcceptedAction | null = null;
  private buffered: {action:FuryPhysicalRequest; queuedAtMs:number}|null=null;
  private readonly combos = new FuryComboClock();

  /** Request does not deal damage, enter a cooldown, cast or show an attack. */
  request(action:FuryPhysicalRequest,nowMs:number):FuryRequestResult {
    if (!finite(nowMs,action.cancelOpensMs,action.durationMs,action.bufferMs??140) ||
        nowMs<0 || action.cancelOpensMs<0 || action.durationMs<=0 ||
        action.cancelOpensMs>action.durationMs || (action.bufferMs??140)<0 ||
        (action.kind==='native-skill' && !action.abilityId)) {
      return {status:'rejected',reason:'invalid-action-timing'};
    }
    const gate=gateFuryAction(action.gate);
    if(!gate.allowed)return {status:'rejected',reason:gate.reason??'native-denied'};
    if(this.pending)return {status:'rejected',reason:'awaiting-native-result'};
    if(this.current && nowMs>=this.current.expiresAtMs)this.current=null;
    if(this.current && nowMs<this.current.expiresAtMs) {
      const interruptible=!!action.allowCancelPrevious;
      if(!interruptible || nowMs<this.current.cancelOpensAtMs) {
        const bufferWindow=action.bufferMs??140;
        if(interruptible && nowMs+bufferWindow>=this.current.cancelOpensAtMs) {
          // Bounded single-slot buffer; latest deliberate press wins.
          this.buffered={action,queuedAtMs:nowMs};
          return {status:'buffered',reason:'waiting-cancel-window'};
        }
        return {status:'rejected',reason:'current-action-busy'};
      }
    }
    const proposal={ticket:++this.nextTicket,action};
    this.pending=proposal;
    return {status:'ready',proposal};
  }

  /** May return a proposal, but NEVER automatically performs the native hit. */
  pollBuffered(nowMs:number):FuryProposal|null {
    const b=this.buffered;
    if(!b || this.pending || !finite(nowMs))return null;
    const ttl=Math.max(180,b.action.bufferMs??140);
    if(nowMs-b.queuedAtMs>ttl){this.buffered=null;return null;}
    if(this.current && nowMs<this.current.cancelOpensAtMs)return null;
    this.buffered=null;
    const result=this.request(b.action,nowMs);
    return result.status==='ready'?result.proposal:null;
  }

  /** Native acceptance is the ONLY event that advances combos and visuals. */
  confirmNative(ticket:number,accepted:boolean,nowMs:number):FuryAcceptedAction|null {
    const p=this.pending;
    if(!p || p.ticket!==ticket || !finite(nowMs) || nowMs<0)return null;
    this.pending=null;
    if(!accepted)return null;
    const a=p.action;
    const comboStep=a.kind==='basic'?this.combos.registerAcceptedHit(nowMs):0;
    this.current={kind:a.kind,abilityId:a.abilityId??null,acceptedAtMs:nowMs,
      expiresAtMs:nowMs+a.durationMs,cancelOpensAtMs:nowMs+a.cancelOpensMs,comboStep};
    return this.current;
  }

  get currentAction():FuryAcceptedAction|null{return this.current;}
  get bufferedInput():boolean{return this.buffered!==null;}
  reset():void {this.pending=null;this.current=null;this.buffered=null;this.combos.reset();}
}

/** Turn avatar toward an already validated target WITHOUT rotating camera. */
export function planFuryAttackFacing(
  origin:FuryGroundPoint,currentFacing:number,target:FuryGroundPoint|null,
  maxTurnRadians:number,
):number {
  if (!target || !finite(origin.x,origin.z,target.x,target.z,currentFacing,maxTurnRadians) ||
      maxTurnRadians<0)return currentFacing;
  const dx=target.x-origin.x,dz=target.z-origin.z;
  if(Math.hypot(dx,dz)<1e-6)return currentFacing;
  const aim=Math.atan2(dx,dz);
  const delta=Math.atan2(Math.sin(aim-currentFacing),Math.cos(aim-currentFacing));
  const limited=Math.max(-maxTurnRadians,Math.min(maxTurnRadians,delta));
  return currentFacing+limited;
}

/**
 * Only a VISUAL cue for the second jump the existing Sim already authorized.
 * Never changes vertical velocity, position, stamina or jump count.
 */
export type FuryFlipDirection='forward'|'back'|'left'|'right';
export function furySecondJumpVisual(
  nativeSecondJumpApproved:boolean,
  direction:FuryFlipDirection,
):Readonly<{kind:'somersault';direction:FuryFlipDirection}>|null {
  return nativeSecondJumpApproved?{kind:'somersault',direction}:null;
}

export function furyPhysicalDashCue(
  nativeEvadeApproved:boolean,
  moving:boolean,
):'dash'|'roll'|null {
  return nativeEvadeApproved?(moving?'dash':'roll'):null;
}
