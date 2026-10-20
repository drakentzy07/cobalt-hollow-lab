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
  return !abilityId || /^highfly_basic_(?:[1-4]|whiff)(?:_|$)/.test(abilityId);
}

/** One air somersault initiated on the second TAP; one revolution on local X,
 * returning to exact neutral at completion. Native fall/jump pose stays active.
 * Direction is the existing camera-relative stick facing, not a new mover. */
export const HIGHFLY_SOMERSAULT_SECONDS = 0.52;
export function highflySomersaultPitch(t: number, reducedMotion = false): number {
  if (reducedMotion || !Number.isFinite(t)) return 0;
  if (t <= 0 || t >= HIGHFLY_SOMERSAULT_SECONDS) return 0;
  const u = Math.min(1, Math.max(0, t / HIGHFLY_SOMERSAULT_SECONDS));
  // Ease out of takeoff and into descent without a visible angular snap.
  return -2 * Math.PI * (u * u * (3 - 2 * u));
}
