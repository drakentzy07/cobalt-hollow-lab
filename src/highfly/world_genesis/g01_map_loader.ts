/**
 * G01 visual asset adapter (Unity-free runtime). Requires a REAL GLB exported
 * from licensed RG Poly geometry; rejects missing assets instead of faking a map.
 * Collisions, nav and semantic anchors have separate future adapters.
 */
import { Group, Scene } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { G01_BINDINGS } from './g01_bindings';

export interface G01GltfLoader {
  loadAsync(path: string): Promise<{ scene: Group }>;
}
export function g01MapUrl(base: string): string {
  return base.replace(/\/+$/, '') + '/' + G01_BINDINGS.map.glb;
}
export async function attachG01Map(
  scene: Scene, assetBase: string, loader: G01GltfLoader = new GLTFLoader(),
): Promise<Group> {
  const result = await loader.loadAsync(g01MapUrl(assetBase));
  if (!result.scene || result.scene.children.length === 0) {
    throw new Error('G01: RG Poly GLB has no renderable scene');
  }
  const group = result.scene;
  group.name = 'HIGHFLY_G01_RG_POLY_CITY';
  group.userData.highflyWorldId = G01_BINDINGS.map.id;
  scene.add(group);
  return group;
}
