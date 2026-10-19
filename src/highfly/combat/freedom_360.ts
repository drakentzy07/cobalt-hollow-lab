/**
 * HIGHFLY ORIGIN F2.0 — authoritative input projection for free 360° movement.
 *
 * This is NOT a replacement locomotion/simulation engine. It extracts the exact
 * camera-relative math already shipped in F1 into a pure, fully testable contract.
 * The native Sim still owns position, speed, collisions, stamina and networking.
 * The camera continues to orbit independently: it changes the stick basis, not
 * the avatar's world position or current target.
 */
export interface Freedom360Stick {
  readonly x: number;
  readonly y: number;
}

export interface Freedom360Intent {
  readonly worldX: number;
  readonly worldZ: number;
  readonly analog: number;
  /** 0 points +Z; the Hunter's chest follows travel, not camera orbit alone. */
  readonly facing: number;
}

/**
 * Coordinates match ClaudeCraft's existing axes: screen-stick right is
 * (-cos(cameraYaw), sin(cameraYaw)); up is (sin(cameraYaw), cos(cameraYaw)).
 * Releasing the stick returns null (never makes a zero-bearing facing override).
 */
export function resolveFreedom360(
  stick: Freedom360Stick,
  cameraYaw: number,
): Freedom360Intent | null {
  if (!Number.isFinite(stick.x) || !Number.isFinite(stick.y) ||
      !Number.isFinite(cameraYaw)) return null;

  const magnitude = Math.hypot(stick.x, stick.y);
  const analog = Math.min(1, magnitude);
  if (analog <= 0.001) return null;

  const forward = -stick.y;
  const right = stick.x;
  const sin = Math.sin(cameraYaw);
  const cos = Math.cos(cameraYaw);
  const worldX = forward * sin - right * cos;
  const worldZ = forward * cos + right * sin;
  return { worldX, worldZ, analog, facing: Math.atan2(worldX, worldZ) };
}
