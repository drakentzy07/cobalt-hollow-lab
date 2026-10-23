/**
 * HIGHFLY REBIRTH <-> FURY 360 integration firewall.
 *
 * Inject a REAL, tested v0.44.7 host. This class does not own input devices,
 * network, world/Sim ticks, hit outcomes, resources, classes or GLB animations.
 */
import { acceptGoldenMovement } from './fury_core.ts';
import type { FuryGoldenIntent, FuryAimResult } from './fury_core.ts';
import { FurySkillTouchController } from './skill_gestures.ts';
import type { FuryTouchContext,FuryScreenPoint,FuryCancelZone } from './skill_gestures.ts';
import type { FuryGroundPreview } from './skill_preview.ts';
import { deriveFuryNativeVisual } from './native_visual_registry.ts';
import type { FuryNativeAbility,FuryVisualOverride } from './native_visual_registry.ts';
import { FuryPhysicalCombatTimeline } from './physical_combat.ts';
import type { FuryPhysicalRequest,FuryProposal,FuryAcceptedAction } from './physical_combat.ts';

export interface FuryRebirthNativeHost {
  /** Position and camera are READ from existing host, never written by Fury. */
  readonly readContext:()=>FuryTouchContext;
  /** Resolve from current native known/active skills, never global unlocked catalog. */
  readonly findKnownAbility:(abilityId:string)=>FuryNativeAbility|null;
  /** Submit through native cast API. True = command forwarded, NOT confirmation of cast/hit. */
  readonly tryNativeSkill:(intent:FuryAimResult)=>boolean;
  /** Existing basic ATK handler. True MUST mean a confirmed native acceptance. If the native API returns void, do not simulate an acceptance. */
  readonly tryNativeBasicAttack:()=>boolean;
  /** Revalidate native attack authorization when buffered request becomes ready. */
  readonly nativeBasicAttackAllowed:()=>boolean;
  /** Existing renderer instance consumes points; null clears preview. */
  readonly renderGroundPreview:(geometry:FuryGroundPreview|null)=>void;
  /** Optional animation adapter: use REAL clips and fallbacks of selected class. */
  readonly acceptedCombatCue?:(action:FuryAcceptedAction)=>void;
}
export interface FurySkillBeginOptions {
  readonly cancelZone?:FuryCancelZone|null;
}
export class FuryRebirthAdapter {
  private readonly gestures:FurySkillTouchController;
  private readonly melee=new FuryPhysicalCombatTimeline();
  private disposed=false;
  private readonly nativeHost:FuryRebirthNativeHost;
  private readonly visualOverrides:Readonly<Record<string,FuryVisualOverride>>;

  constructor(
    host:FuryRebirthNativeHost,
    overrides:Readonly<Record<string,FuryVisualOverride>>={},
  ){
    this.nativeHost=host;
    this.visualOverrides=overrides;
    this.gestures=new FurySkillTouchController({
      showPreview:frame=>host.renderGroundPreview(frame?.geometry??null),
      attemptNativeCast:intent=>{
        // Identity/learned-ability revalidated on release.
        const native=host.findKnownAbility(intent.abilityId);
        if(!native || native.passive || native.hiddenFromPlayer) return false;
        return host.tryNativeSkill(intent);
      },
    });
  }

  /** Optional read-only wrapper for existing GOLDEN input. */
  sampleGoldenMovement(intent:FuryGoldenIntent|null,blocked:boolean) {
    return acceptGoldenMovement(intent,blocked);
  }

  /**
   * Called by the existing touch_router only for a verified skill-button pointer.
   * Native target-locked spells with no ground targeting metadata remain on
   * their ORIGINAL input path. They are NOT silently converted to skillshots.
   */
  beginNativeSkill(
    pointerId:number,abilityId:string,buttonCenter:FuryScreenPoint,
    options:FurySkillBeginOptions={},
  ):boolean {
    if(this.disposed)return false;
    const ability=this.nativeHost.findKnownAbility(abilityId);
    if(!ability)return false;
    const mapping=deriveFuryNativeVisual(ability,this.visualOverrides);
    if(!mapping)return false;
    return this.gestures.begin(pointerId,mapping.spec,buttonCenter,
      this.nativeHost.readContext(),{cancelZone:options.cancelZone,tone:mapping.tone});
  }

  moveNativeSkill(pointerId:number,at:FuryScreenPoint):boolean {
    if(this.disposed)return false;
    return this.gestures.update(pointerId,at,this.nativeHost.readContext())!==null;
  }
  releaseNativeSkill(pointerId:number,at:FuryScreenPoint) {
    if(this.disposed)return 'ignored' as const;
    return this.gestures.release(pointerId,at,this.nativeHost.readContext());
  }
  cancelNativeSkill(pointerId:number):boolean {
    return this.gestures.cancel(pointerId);
  }

  /** No automatic attack: ONLY an existing ATK button can call this method. */
  pressBasicAttack(nowMs:number,request:FuryPhysicalRequest){
    if(this.disposed || request.kind!=='basic')return 'rejected' as const;
    const result=this.melee.request(request,nowMs);
    if(result.status==='ready'){
      return this.dispatchBasic(result.proposal,nowMs);
    }
    return result.status;
  }

  /** Called from existing host animation/update tick, not a new game loop. */
  pumpCombat(nowMs:number) {
    if(this.disposed)return null;
    const proposal=this.melee.pollBuffered(nowMs);
    if(!proposal)return null;
    return this.dispatchBasic(proposal,nowMs);
  }
  private dispatchBasic(proposal:FuryProposal,nowMs:number){
    const accepted=!!this.nativeHost.nativeBasicAttackAllowed() &&
      !!this.nativeHost.tryNativeBasicAttack();
    const cue=this.melee.confirmNative(proposal.ticket,accepted,nowMs);
    if(cue)this.nativeHost.acceptedCombatCue?.(cue);
    return accepted?'native-accepted' as const:'native-rejected' as const;
  }

  /** Pointer cancellation, modal open, death/respawn or scene unload. */
  reset():void {
    this.gestures.reset();
    this.melee.reset();
  }
  dispose():void {
    if(this.disposed)return;
    this.reset();
    this.disposed=true;
  }
}
