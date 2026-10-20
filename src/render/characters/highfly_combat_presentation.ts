/** HIGHFLY ORIGIN — 3D presentation rules for FREE combat.
 *
 * Keep ClaudeCraft's locomotion clip running during physical attacks. ONLY
 * spine / chest / arms / hand rotations are allowed on the attack overlay:
 * translating hips/root or replacing leg tracks is the source of skating.
 * Small, pure logic: independent of Three.js, testable without a GPU.
 */
export function isHighflyUpperBodyTrack(path: string): boolean {
  if (!/\.(?:quaternion|rotation)(?:\[[^\]]+\])?$/.test(path)) return false;
  return /(?:spine|chest|clavicle|shoulder|upperarm|lowerarm|forearm|rightarm|leftarm|wrist|hand|finger|thumb|neck|head|torso|arm_l|arm_r)/i.test(path);
}

export function highflyPhysicalBasic(abilityId: string | undefined): boolean {
  return !abilityId || /^highfly_basic_(?:[1-4]|whiff|air)(?:_|$)/.test(abilityId);
}

/** One air somersault initiated on the second TAP; one revolution on local X,
 * returning to exact neutral at completion. Native fall/jump pose stays active.
 * Direction is the existing camera-relative stick facing, not a new mover. */
export const HIGHFLY_SOMERSAULT_SECONDS = 0.72;
export function highflySomersaultPitch(t: number, reducedMotion = false): number {
  if (reducedMotion || !Number.isFinite(t)) return 0;
  if (t <= 0 || t >= HIGHFLY_SOMERSAULT_SECONDS) return 0;
  const u = Math.min(1, Math.max(0, t / HIGHFLY_SOMERSAULT_SECONDS));
  // Ease out of takeoff and into descent without a visible angular snap.
  return -2 * Math.PI * (u * u * (3 - 2 * u));
}

/** F2.3: visually distinct strikes, with no fake second movement controller.
 * Native warrior clips remain 1H Chop -> Diagonal -> Reaping Arc; change only
 * playback cadence, never the simulation hit frames, damage or input rate.
 * The third contact has heavier follow-through without becoming slow motion. */
export function highflyComboAnimationRate(abilityId: string | undefined, nativeRate: number): number {
  const step = abilityId?.match(/^highfly_basic_([1-4])(?:_|$)/)?.[1];
  const factor = step === '1' ? 1.08 : step === '2' ? 1.02 : step === '3' ? 0.92 : step === '4' ? 1.04 : abilityId === 'highfly_basic_air' ? 0.94 : 1;
  return Math.max(0.5, Math.min(2.5, nativeRate * factor));
}

/** Per-strike contact follow-through without translating the Sim body.
 * A strong third slash is read as the FINISHER rather than another tap. */
export function highflyComboAccent(abilityId:string|undefined,t:number):{roll:number;pitch:number}{
  const n=abilityId==='highfly_basic_air'?5:Number(abilityId?.match(/^highfly_basic_([1-4])(?:_|$)/)?.[1]??0);
  if(n===0||t<0||t>0.52)return {roll:0,pitch:0};
  const u=t/0.52;
  const pulse=Math.sin(Math.PI*u)**2;
  const roll=n===1?-0.11:n===2?0.17:n===3?-0.26:n===4?0.22:0.09;
  return {roll:roll*pulse,pitch:(n===5?0.36:n===3?0.16:0.06)*pulse};
}

// Directional aerial revolutions: true full 360° around the Hunter's local
// axis, returned to identity by landing. No physics impulse, no teleport.
export function highflyDirectionalFlip(t:number,dir:'forward'|'back'|'left'|'right'){
  if(!Number.isFinite(t)||t<=0||t>=HIGHFLY_SOMERSAULT_SECONDS)return {pitch:0,roll:0};
  const u=Math.max(0,Math.min(1,t/HIGHFLY_SOMERSAULT_SECONDS));
  const turn=2*Math.PI*(u*u*(3-2*u));
  return dir==='forward' ? {pitch:-turn,roll:0}
    : dir==='left' ? {pitch:0,roll:-turn}
    : dir==='right' ? {pitch:0,roll:turn}
    : {pitch:turn,roll:0};
}

/** F2.6.3 only: reverse the frontal rotation direction for the modular
 * Rig_Medium presentation; older builds keep their verified donor pose. */
export function highflyF263DirectionalFlip(t:number,dir:'forward'|'back'|'left'|'right'){
  const pose=highflyDirectionalFlip(t,dir);
  return dir==='forward'?{pitch:-pose.pitch,roll:pose.roll}:pose;
}

/** Keep the rig's chest / spine support while isolating the LEFT blade stroke.
 * Matching the actual Rig_Medium bone names avoids mirror-faking a weapon. */
export function isHighflyLeftArmTrack(path:string):boolean{
  if(!isHighflyUpperBodyTrack(path))return false;
  return /(?:spine|chest|torso|neck|head|clavicle[._-]?l|shoulder[._-]?l|upperarm[._-]?l|lowerarm[._-]?l|forearm[._-]?l|hand[._-]?l|wrist[._-]?l|arm_l|leftarm|lefthand|leftshoulder)/i.test(path);
}
