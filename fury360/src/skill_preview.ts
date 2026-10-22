/**
 * HIGHFLY FURY F1 — Mobile Legends-like skill telegraph geometry.
 *
 * Pure XY-ground plane (+X,+Z); NO rendering engine and NO damage computation.
 * The game scene renderer may consume polylines/polygons with its existing THREE.
 * Actual hit checks, targeting, obstacles, resources and VFX remain native.
 */
import type { FuryAimResult, FuryAimSpec, FuryGroundPoint } from './fury_core.ts';

export interface FurySkillVisualSpec extends FuryAimSpec {
  /** Radius for circles, leap landing, target and self effects (world units). */
  radius?: number;
  /** Full width of projected rectangular hit corridor (world units). */
  width?: number;
  /** Cone's total included arc (degrees); not a half-angle. */
  coneDegrees?: number;
}
export type FuryPreviewTone = 'offensive' | 'friendly' | 'mobility';
export interface FuryGroundPreview {
  readonly abilityId: string;
  readonly shape: FuryAimResult['shape'];
  readonly center: FuryGroundPoint;
  readonly fill: readonly FuryGroundPoint[];
  readonly outline: readonly FuryGroundPoint[];
  readonly trajectory: readonly FuryGroundPoint[];
  readonly tone: FuryPreviewTone;
}
export interface FuryPoint3 { readonly x: number; readonly y: number; readonly z: number }
export interface FuryRaisedPreview {
  readonly fill: readonly FuryPoint3[];
  readonly outline: readonly FuryPoint3[];
  readonly trajectory: readonly FuryPoint3[];
}
const finite = (...args: number[]) => args.every(Number.isFinite);
const point = (x: number, z: number): FuryGroundPoint => ({x,z});
const clamp = (v: number, a: number, b: number): number => Math.min(b,Math.max(a,v));
const polygonCircle = (center: FuryGroundPoint, radius: number, samples: number): FuryGroundPoint[] => {
  const pts: FuryGroundPoint[] = [];
  for (let i=0;i<samples;i++) {
    const a = 2*Math.PI*i/samples;
    pts.push(point(center.x+radius*Math.cos(a),center.z+radius*Math.sin(a)));
  }
  return pts;
};
const closed = (points: FuryGroundPoint[]): FuryGroundPoint[] =>
  points.length ? [...points,points[0]] : [];

/** One mathematically consistent geometry snapshot for preview and cast pointer. */
export function makeFurySkillPreview(
  origin: FuryGroundPoint,
  intent: FuryAimResult,
  spec: FurySkillVisualSpec,
  tone: FuryPreviewTone = 'offensive',
  samples = 32,
): FuryGroundPreview | null {
  if (!spec.abilityId || spec.abilityId !== intent.abilityId || intent.shape !== spec.shape ||
      !finite(origin.x,origin.z,intent.world.x,intent.world.z,intent.facing,
        intent.distance, spec.range) ||
      intent.distance < 0 || spec.range < 0 || intent.distance > spec.range+0.001) return null;
  const n = clamp(Math.floor(samples),12,48);
  const shape = intent.shape;
  const radius = Number.isFinite(spec.radius) ? clamp(spec.radius!,0.05,100) : 2;
  const width = Number.isFinite(spec.width) ? clamp(spec.width!,0.05,100) : 1.4;
  const dir = point(Math.sin(intent.facing), Math.cos(intent.facing));
  const destination = shape === 'self' ? origin : intent.world;
  const trajectory: FuryGroundPoint[] = [origin,destination];

  if (shape === 'circle' || shape === 'leap' || shape === 'target' || shape === 'self') {
    const fill = polygonCircle(destination,radius,n);
    return {abilityId:spec.abilityId,shape,center:destination,fill,
      outline:closed(fill),trajectory:shape==='self'?[]:trajectory,tone};
  }
  if (shape === 'cone' || shape === 'triangle') {
    const halfAngle = clamp(spec.coneDegrees ?? (shape==='triangle'?55:75),5,175)*Math.PI/360;
    const d = intent.distance;
    const corner = (angle:number) => point(origin.x+Math.sin(angle)*d,origin.z+Math.cos(angle)*d);
    if (shape === 'triangle') {
      const fill = [origin,corner(intent.facing-halfAngle),corner(intent.facing+halfAngle)];
      return {abilityId:spec.abilityId,shape,center:destination,fill,
        outline:closed(fill),trajectory,tone};
    }
    const fill: FuryGroundPoint[] = [origin];
    for(let i=0;i<=n;i++) fill.push(corner(intent.facing-halfAngle+2*halfAngle*i/n));
    return {abilityId:spec.abilityId,shape,center:destination,fill,
      outline:closed(fill),trajectory,tone};
  }
  if (shape === 'line' || shape === 'dash' || shape === 'rectangle') {
    const half=width/2;
    const perp=point(-dir.z*half,dir.x*half);
    const fill=[
      point(origin.x+perp.x,origin.z+perp.z),
      point(destination.x+perp.x,destination.z+perp.z),
      point(destination.x-perp.x,destination.z-perp.z),
      point(origin.x-perp.x,origin.z-perp.z),
    ];
    return {abilityId:spec.abilityId,shape,center:destination,fill,
      outline:closed(fill),trajectory,tone};
  }
  return null;
}

/** Project ground overlays onto terrain without replacing any terrain/collision logic. */
export function raiseFuryPreview(
  geometry: FuryGroundPreview,
  terrainHeightAt: (x:number,z:number)=>number,
  offset = 0.06,
): FuryRaisedPreview | null {
  if (!finite(offset)) return null;
  const lift = (pts: readonly FuryGroundPoint[]): FuryPoint3[] | null => {
    const result: FuryPoint3[] = [];
    for(const p of pts) {
      const height = terrainHeightAt(p.x,p.z);
      if (!finite(height)) return null; // no misleading reticle over invalid terrain
      result.push({x:p.x, y:height+offset, z:p.z});
    }
    return result;
  };
  const fill = lift(geometry.fill), outline = lift(geometry.outline),
        trajectory = lift(geometry.trajectory);
  return fill && outline && trajectory ? {fill,outline,trajectory} : null;
}
