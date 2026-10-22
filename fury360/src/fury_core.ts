/**
 * HIGHFLY FURY 360° — portable, native-safe intent layer (RUN F0).
 * Neither movement physics nor native classes, skills, cooldowns, resources,
 * equipment, animation rigs or saved states are owned by this module.
 * All functions except the pointer gesture/combo tracking are pure.
 */
export type FuryVec2 = Readonly<{ x: number; y: number }>;
export type FuryGroundPoint = Readonly<{ x: number; z: number }>;
export type FuryGoldenIntent = Readonly<{
  worldX: number; worldZ: number; analog: number; facing: number;
}>;
export type FuryMovementIntent = FuryGoldenIntent;
export type FuryAimShape =
  | 'line' | 'cone' | 'circle' | 'rectangle' | 'triangle'
  | 'leap' | 'dash' | 'target' | 'self';
export type FuryAimSpec = Readonly<{
  abilityId: string;
  shape: FuryAimShape;
  range: number;
  /** Pixels from starting thumb point needed for full range. */
  fullDragPx?: number;
  /** Inherit F2.6.1's S23 horizontal-axis correction, not camera control. */
  horizontalSign?: -1 | 1;
  /** Tune only aim rotation, never stick locomotion. */
  sensitivity?: number;
}>;
export type FuryAimResult = Readonly<{
  abilityId: string; shape: FuryAimShape;
  world: FuryGroundPoint; facing: number; distance: number;
  isTap: boolean;
}>;

const finite = (...values: number[]) => values.every(Number.isFinite);
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Decorate GOLDEN 360 intent, never calculate a competing movement vector. */
export function acceptGoldenMovement(
  golden: FuryGoldenIntent | null,
  blocked: boolean,
): FuryMovementIntent | null {
  if (blocked || !golden || !finite(golden.worldX, golden.worldZ, golden.analog, golden.facing)) {
    return null;
  }
  const length = Math.hypot(golden.worldX, golden.worldZ);
  if (length <= 0.001 || golden.analog <= 0.001) return null;
  // Maintain the donor's camera-relative direction and radial analog speed.
  const analog = clamp(golden.analog, 0, 1);
  return {
    worldX: (golden.worldX / length) * analog,
    worldZ: (golden.worldZ / length) * analog,
    analog,
    facing: golden.facing,
  };
}

/** Only emits preview/release intent; native ability execution stays authoritative. */
export class FuryAimGesture {
  private active: { pointer: number; spec: FuryAimSpec; origin: FuryGroundPoint; yaw: number } | null = null;
  start(pointer: number, spec: FuryAimSpec, origin: FuryGroundPoint, yaw: number): boolean {
    if (this.active || !Number.isInteger(pointer) || !spec.abilityId ||
        !finite(spec.range, origin.x, origin.z, yaw) || spec.range < 0) return false;
    this.active = { pointer, spec, origin, yaw };
    return true;
  }
  get busy(): boolean { return this.active !== null; }
  /** Follow the player's REAL current location while aiming on the move.
   * Never locks or modifies camera/physics; input yaw comes from native camera. */
  updateContext(pointer: number, origin: FuryGroundPoint, yaw: number): boolean {
    if (!this.active || this.active.pointer !== pointer ||
        !finite(origin.x, origin.z, yaw)) return false;
    this.active = { ...this.active, origin, yaw };
    return true;
  }
  preview(pointer: number, dx: number, dy: number): FuryAimResult | null {
    const a = this.active;
    if (!a || a.pointer !== pointer || !finite(dx, dy)) return null;
    const drag = Math.hypot(dx, dy);
    const isTap = drag < 12;
    const factor = clamp(a.spec.sensitivity ?? 0.68, 0, 2);
    const sign = a.spec.horizontalSign ?? -1;
    const facing = a.yaw + (isTap ? 0 : Math.atan2(sign * dx, -dy) * factor);
    const reach = a.spec.shape === 'self' ? 0 : Math.max(0, a.spec.range);
    const span = Math.max(20, a.spec.fullDragPx ?? 145);
    const distance = a.spec.shape === 'self' ? 0 :
      reach * (isTap ? 1 : 0.3 + 0.7 * clamp(drag / span, 0, 1));
    return {
      abilityId: a.spec.abilityId, shape: a.spec.shape,
      world: { x: a.origin.x + Math.sin(facing) * distance,
               z: a.origin.z + Math.cos(facing) * distance },
      facing, distance, isTap,
    };
  }
  release(pointer: number, dx: number, dy: number): FuryAimResult | null {
    const result = this.preview(pointer, dx, dy);
    if (result) this.active = null;
    return result;
  }
  cancel(pointer: number): boolean {
    if (!this.active || this.active.pointer !== pointer) return false;
    this.active = null;
    return true;
  }
  clear(): void { this.active = null; }
}

export type FuryTarget = Readonly<{
  id: number; pos: FuryGroundPoint; hp?: number; maxHp?: number;
}>;
export type FuryTargetRules<T extends FuryTarget> = Readonly<{
  origin: FuryGroundPoint; facing: number; maxRange: number;
  lockedTargetId?: number | null;
  /** Must implement native faction, dead, PvP and attackability rules. */
  canAttack: (entity: T) => boolean;
  /** Optional native line-of-sight / obstacle predicate. */
  lineOfSight?: (entity: T) => boolean;
  forwardConeDegrees?: number;
}>;
/** Current valid manual lock wins; otherwise front-facing nearest has priority. */
export function pickFuryTarget<T extends FuryTarget>(
  candidates: Iterable<T>, rules: FuryTargetRules<T>,
): number | null {
  if (!finite(rules.origin.x, rules.origin.z, rules.facing, rules.maxRange) ||
      rules.maxRange <= 0) return null;
  let bestId: number | null = null;
  let bestScore = Infinity;
  let locked: number | null = null;
  const fx = Math.sin(rules.facing), fz = Math.cos(rules.facing);
  const minDot = Math.cos(clamp(rules.forwardConeDegrees ?? 55, 1, 180) * Math.PI / 180);
  for (const e of candidates) {
    if (!Number.isFinite(e.id) || !finite(e.pos.x, e.pos.z) ||
        !rules.canAttack(e) || (rules.lineOfSight && !rules.lineOfSight(e))) continue;
    const dx = e.pos.x - rules.origin.x, dz = e.pos.z - rules.origin.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.001 || d > rules.maxRange) continue;
    if (e.id === rules.lockedTargetId) { locked = e.id; continue; }
    const dot = (dx * fx + dz * fz) / d;
    if (dot < minDot) continue;
    const score = d + (1 - dot) * 5;
    if (score < bestScore || (score === bestScore && (bestId === null || e.id < bestId))) {
      bestId = e.id; bestScore = score;
    }
  }
  return locked ?? bestId;
}

export type FuryActionRequest = Readonly<{
  kind: 'basic' | 'skill' | 'dash' | 'jump';
  /** Native combat authority has already checked class, resources, cooldowns and status. */
  nativeAllowed: boolean;
  stunned: boolean;
  airborne: boolean;
  moving: boolean;
  /** Authored metadata, not a blanket override of original abilities. */
  allowAirborne: boolean;
  allowMovement: boolean;
}>;
export type FuryActionDecision = Readonly<{ allowed: boolean; reason: string | null }>;
/** Movement and aerial combat are opt-in for each native ability/attack. */
export function gateFuryAction(action: FuryActionRequest): FuryActionDecision {
  if (!action.nativeAllowed) return { allowed: false, reason: 'native-denied' };
  if (action.stunned) return { allowed: false, reason: 'stunned' };
  if (action.airborne && !action.allowAirborne)
    return { allowed: false, reason: 'airborne-denied' };
  if (action.moving && !action.allowMovement)
    return { allowed: false, reason: 'moving-denied' };
  return { allowed: true, reason: null };
}

/** Presentation-only combo sequence: native Sim decides whether each hit lands. */
export class FuryComboClock {
  private lastMs = -Infinity;
  private hits = 0;
  registerAcceptedHit(nowMs: number, comboWindowMs = 500, maxHits = 4): number {
    if (!finite(nowMs, comboWindowMs, maxHits) || comboWindowMs <= 0 || maxHits < 1)
      return this.hits;
    if (nowMs < this.lastMs || nowMs - this.lastMs > comboWindowMs) this.hits = 0;
    this.hits = (this.hits % Math.floor(maxHits)) + 1;
    this.lastMs = nowMs;
    return this.hits;
  }
  reset(): void { this.hits = 0; this.lastMs = -Infinity; }
  get step(): number { return this.hits; }
}

export type FuryPose =
  | 'idle' | 'run' | 'jump' | 'fall' | 'dash' | 'attack' | 'cast' | 'dead';
/** Declarative animation request, not a new skeleton controller. */
export function chooseFuryPose(input: Readonly<{
  dead: boolean; dashing: boolean; attacking: boolean;
  casting: boolean; airborne: boolean; vy: number; moving: boolean;
}>): FuryPose {
  if (input.dead) return 'dead';
  if (input.dashing) return 'dash';
  if (input.attacking) return 'attack';
  if (input.casting) return 'cast';
  if (input.airborne) return input.vy >= 0 ? 'jump' : 'fall';
  return input.moving ? 'run' : 'idle';
}
