/**
 * HIGHFLY AIM CONTRACT V1
 *
 * Data-only contract. It does NOT replace current soft-target or manual LOCK.
 * Runtime implementation comes after Training Core integration.
 */

export const HIGHFLY_AIM_CONTRACT_VERSION = 1 as const;

export type HighflyAimType =
  | 'SELF'
  | 'TARGET'
  | 'LINE'
  | 'CONE'
  | 'CIRCLE'
  | 'DASH'
  | 'LEAP_AREA'
  | 'RING';

export interface HighflyAimSpec {
  /** Geometry/selection model used by the skill. */
  aimType: HighflyAimType;

  /** Maximum cast/placement distance in world units. */
  range: number;

  /** Radius for CIRCLE, LEAP_AREA or RING outer radius. */
  radius?: number;

  /** Cone sweep in degrees. */
  angleDeg?: number;

  /** Optional inner radius for RING. */
  innerRadius?: number;

  /** Tap may cast immediately using seeded targeting/direction. */
  quickCast: boolean;

  /** Long-range aiming may request a temporary camera composition shift. */
  cameraShift: boolean;

  /** Current manual LOCK may seed this skill. It never overrides explicit aim. */
  lockCompatible: boolean;

  /** Current soft-target may seed quick-cast target/direction. */
  softTargetCompatible: boolean;

  /** Optional 0..1 strength for future assisted directional snapping. */
  snapStrength?: number;
}

export interface HighflyAimIntent {
  /** World-space origin resolved at press/cast time. */
  originX: number;
  originZ: number;

  /** Normalized horizontal direction when directional geometry is used. */
  dirX?: number;
  dirZ?: number;

  /** Explicit entity selection for TARGET skills. */
  targetEntityId?: number | null;

  /** Explicit ground placement for CIRCLE/LEAP_AREA/RING. */
  groundX?: number;
  groundZ?: number;

  /** True only when the user explicitly dragged/aimed instead of accepting seed. */
  manuallyAimed: boolean;
}

/**
 * Input contract planned for Aim Runtime:
 *
 * tap     -> quick cast when allowed
 * hold    -> show functional indicator
 * drag    -> update explicit aim
 * release -> cast
 * cancel  -> abort without spending skill/cooldown
 *
 * Existing targeting hierarchy remains:
 * manual explicit aim > manual LOCK seed > soft-target seed > camera-forward fallback
 */
