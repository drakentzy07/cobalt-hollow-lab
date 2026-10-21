import { describe, expect, it } from 'vitest';
import { Group, Object3D, Scene } from 'three';
import {
  type G01WorldManifest, parseG01Manifest, g01Anchor, unityG01Position,
  unityG01Rotation, g01ManifestUrl, G01_REQUIRED_ANCHORS,
} from '../src/highfly/world_genesis/g01_manifest';
import { mountG01World } from '../src/highfly/world_genesis/g01_world_mount';
const v = (x=0,y=0,z=0) => ({x,y,z});
function fixture(): G01WorldManifest {
  return {
    id:'highfly.capital.rgpoly.g01',
    provenance:'RG Poly [Free] Stylized Medieval Village - Unity URP (CC0)',
    scene:'Assets/Stylized Medieval Kingdom URP/Scenes/Demo Stylized Medieval.unity',
    geometryFile:'rgpoly-city01.glb',
    coordinateSystem:'Unity LH to glTF RH',
    collisionRepresentation:'Unity collider audit only',
    unityHunterSpawn:v(0,13.35,-42),
    rootCount:42,renderMeshCount:650,terrainCount:0,colliderCount:1,
    glbBytes:521122,
    anchors:G01_REQUIRED_ANCHORS.map((id,i)=>({
      id,sourceObject:'Structure '+i,unityPosition:v(i+1,13,20),
      unityRotation:{x:0,y:0,z:0,w:1},
    })),
    colliders:[{
      hierarchy:'Smithy/Box',type:'BoxCollider',
      unityWorldBoundsCenter:v(1,2,3),unityWorldBoundsSize:v(4,5,6),
    }],
  };
}
describe('G1 — actual NEXUS export manifest + Three.js placement, NO DEPLOY', () => {
  it('demands actual geometry evidence and original four audited anchors', () => {
    expect(parseG01Manifest(fixture()).renderMeshCount).toBe(650);
    expect(() => parseG01Manifest({...fixture(),renderMeshCount:0})).toThrow();
    expect(() => parseG01Manifest({...fixture(),terrainCount:1})).toThrow();
    expect(() => parseG01Manifest({...fixture(),anchors:[]})).toThrow();
    expect(() => parseG01Manifest({...fixture(),glbBytes:0})).toThrow();
  });
  it('converts source Unity coordinates without flipping Z by accident', () => {
    const p=unityG01Position(v(8,13,-42));
    expect(p.toArray()).toEqual([-8,13,-42]);
    expect(unityG01Rotation({x:0,y:0,z:0,w:1}).toArray()).toEqual([0,0,0,1]);
    expect(g01Anchor(fixture(),'anchor.capital.forge.door').position.x).toBe(-3);
  });
  it('rejects map until BOTH physical manifest and actual GLB resolve', async () => {
    const scene=new Scene();
    expect(g01ManifestUrl('/cobalt-hollow-lab/')).toBe('/cobalt-hollow-lab/highfly/world-genesis/rgpoly-city01.manifest.json');
    await expect(mountG01World(scene,'/',async()=>null)).rejects.toThrow();
    expect(scene.children).toHaveLength(0);
    await expect(mountG01World(scene,'/',async()=>fixture(),{
      async loadAsync(){throw new Error('GLB not yet delivered');},
    })).rejects.toThrow('GLB not yet delivered');
    expect(scene.children).toHaveLength(0);
  });
  it('successfully mounts the REAL loader seam without spawning second Sim', async () => {
    const scene=new Scene(), model=new Group();model.add(new Object3D());
    const result=await mountG01World(scene,'/cobalt-hollow-lab/',async()=>fixture(),{
      async loadAsync(path){
        expect(path).toBe('/cobalt-hollow-lab/highfly/world-genesis/rgpoly-city01.glb');
        return {scene:model};
      },
    });
    expect(result.visual).toBe(model);
    expect(result.hunterSpawn.z).toBe(-42);
    expect(result.forgeDoor.position.x).toBe(-3);
    expect(scene.children).toContain(model);
  });
});
