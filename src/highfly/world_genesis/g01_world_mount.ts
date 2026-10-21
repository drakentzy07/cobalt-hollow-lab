/**
 * G1 preview mounting. Does NOT touch current WORLD/LAB, their save DBs or Sim.
 * A real manifest and real GLB are both required. Fails closed on either error.
 */
import { Scene, Group } from 'three';
import { G01GltfLoader, attachG01Map } from './g01_map_loader';
import {
  type G01WorldManifest, parseG01Manifest, g01ManifestUrl, g01Anchor,
} from './g01_manifest';

export interface G01WorldMount {
  readonly visual: Group;
  readonly manifest: G01WorldManifest;
  readonly hunterSpawn: import('three').Vector3;
  readonly forgeDoor: ReturnType<typeof g01Anchor>;
}
export type G01ManifestFetcher = (url: string) => Promise<unknown>;
export const fetchG01Manifest: G01ManifestFetcher = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error('G1: missing RG Poly manifest HTTP ' + response.status);
  return response.json();
};
export async function mountG01World(
  scene: Scene, base: string,
  manifestFetcher: G01ManifestFetcher = fetchG01Manifest,
  gltfLoader?: G01GltfLoader,
): Promise<G01WorldMount> {
  const manifest = parseG01Manifest(await manifestFetcher(g01ManifestUrl(base)));
  const visual = await attachG01Map(scene, base, gltfLoader);
  return {
    visual, manifest,
    hunterSpawn: (await import('./g01_manifest')).unityG01Position(manifest.unityHunterSpawn),
    forgeDoor: g01Anchor(manifest, 'anchor.capital.forge.door'),
  };
}
