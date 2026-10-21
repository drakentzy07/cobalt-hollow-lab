/**
 * HIGHFLY WORLD GENESIS G1 — scene semantics delivered by the REAL Unity GLB export.
 *
 * Exported glTFast geometry is RH +Y-up. In that export Unity source positions
 * are converted by reflecting X. This conversion must stay aligned with the
 * selected glTFast version; verify visually before enabling physical collision.
 *
 * This is an observation/placement contract. Collider WORLD AABBs are not
 * collision meshes, and are never silently installed as authoritative physics.
 */
import { Quaternion, Vector3 } from 'three';
import { G01_BINDINGS } from './g01_bindings';

export interface G01UnityVector { readonly x: number; readonly y: number; readonly z: number }
export interface G01UnityQuaternion extends G01UnityVector { readonly w: number }
export interface G01Anchor {
  readonly id: string;
  readonly sourceObject: string;
  readonly unityPosition: G01UnityVector;
  readonly unityRotation: G01UnityQuaternion;
}
export interface G01ColliderAudit {
  readonly hierarchy: string;
  readonly type: string;
  readonly unityWorldBoundsCenter: G01UnityVector;
  readonly unityWorldBoundsSize: G01UnityVector;
}
export interface G01WorldManifest {
  readonly id: string;
  readonly provenance: string;
  readonly scene: string;
  readonly geometryFile: string;
  readonly coordinateSystem: string;
  readonly collisionRepresentation: string;
  readonly unityHunterSpawn: G01UnityVector;
  readonly rootCount: number;
  readonly renderMeshCount: number;
  readonly terrainCount: number;
  readonly colliderCount: number;
  readonly glbBytes: number;
  readonly anchors: readonly G01Anchor[];
  readonly colliders: readonly G01ColliderAudit[];
}
export const G01_REQUIRED_ANCHORS = [
  'anchor.capital.guild.door',
  'anchor.capital.inn.door',
  'anchor.capital.forge.door',
  'service.market',
] as const;
const numeric = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
function vector(v: unknown): v is G01UnityVector {
  return record(v) && numeric(v.x) && numeric(v.y) && numeric(v.z);
}
function quaternion(v: unknown): v is G01UnityQuaternion {
  return vector(v) && numeric((v as unknown as { w?: unknown }).w);
}
/** Reject partial/stale manifests so an empty city cannot be called G1 GREEN. */
export function parseG01Manifest(value: unknown): G01WorldManifest {
  if (!record(value) || value.id !== G01_BINDINGS.map.id ||
      value.geometryFile !== 'rgpoly-city01.glb' ||
      !numeric(value.rootCount) || value.rootCount < 10 ||
      !numeric(value.renderMeshCount) || value.renderMeshCount < 100 ||
      !numeric(value.glbBytes) || value.glbBytes < 10240 ||
      value.terrainCount !== 0 || !vector(value.unityHunterSpawn) ||
      !Array.isArray(value.anchors) || !Array.isArray(value.colliders) ||
      !numeric(value.colliderCount) || value.colliderCount !== value.colliders.length) {
    throw new Error('G1: real RG Poly export manifest absent, stale or incomplete');
  }
  const anchors = value.anchors;
  if (anchors.some((a: unknown) => !record(a) || typeof a.id !== 'string' ||
      typeof a.sourceObject !== 'string' || !vector(a.unityPosition) ||
      !quaternion(a.unityRotation)) ||
      G01_REQUIRED_ANCHORS.some(id => anchors.filter((a: G01Anchor) => a.id === id).length !== 1)) {
    throw new Error('G1: missing or invalid Unity semantic anchors');
  }
  if (value.colliders.some((c: unknown) => !record(c) ||
      typeof c.hierarchy !== 'string' || typeof c.type !== 'string' ||
      !vector(c.unityWorldBoundsCenter) || !vector(c.unityWorldBoundsSize))) {
    throw new Error('G1: invalid source collider audit');
  }
  return value as unknown as G01WorldManifest;
}
/** glTFast 6.x Unity LH -> glTF RH export reflects X (not Z). */
export function unityG01Position(v: G01UnityVector): Vector3 {
  return new Vector3(-v.x, v.y, v.z);
}
/** Basis reflection across X: glTF(x,-y,-z,w). */
export function unityG01Rotation(q: G01UnityQuaternion): Quaternion {
  return new Quaternion(q.x, q.y === 0 ? 0 : -q.y, q.z === 0 ? 0 : -q.z, q.w).normalize();
}
export function g01Anchor(manifest: G01WorldManifest, id: string) {
  const a = manifest.anchors.find(x => x.id === id);
  if (!a) throw new Error('G1: unknown mapped anchor: ' + id);
  return { position: unityG01Position(a.unityPosition), rotation: unityG01Rotation(a.unityRotation) };
}
export function g01ManifestUrl(assetBase: string): string {
  return assetBase.replace(/\/+$/, '') + '/highfly/world-genesis/rgpoly-city01.manifest.json';
}
