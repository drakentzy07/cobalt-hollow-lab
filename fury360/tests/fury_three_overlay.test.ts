import assert from 'node:assert/strict';
import {test} from 'node:test';
import {FuryThreeGroundOverlay} from '../src/three_ground_overlay.ts';
import {makeFurySkillPreview} from '../src/skill_preview.ts';

class FakeBufferAttribute {
  needsUpdate=false;
  usage=0;
  readonly array:Float32Array;
  readonly itemSize:number;
  constructor(array:Float32Array,itemSize:number){this.array=array;this.itemSize=itemSize;}
  setUsage(x:number){this.usage=x;return this;}
}
class FakeGeometry {
  attributes=new Map<string,FakeBufferAttribute>();
  count=0;disposed=false;
  setAttribute(k:string,v:FakeBufferAttribute){this.attributes.set(k,v);}
  setDrawRange(_start:number,count:number){this.count=count;}
  dispose(){this.disposed=true;}
}
class FakeMaterial {
  disposed=false;
  tint=0;
  color={setHex:(v:number)=>{this.tint=v;}};
  readonly opts:Record<string,unknown>;
  constructor(opts:Record<string,unknown>){this.opts=opts;}
  dispose(){this.disposed=true;}
}
class FakeObject { visible=true;
  readonly geometry:FakeGeometry;
  readonly material:FakeMaterial;
  constructor(geometry:FakeGeometry,material:FakeMaterial){this.geometry=geometry;this.material=material;}}
const THREE={
  BufferGeometry:FakeGeometry,BufferAttribute:FakeBufferAttribute,
  MeshBasicMaterial:FakeMaterial,LineBasicMaterial:FakeMaterial,
  Mesh:FakeObject,Line:FakeObject,DoubleSide:2,DynamicDrawUsage:35048,
};
const a=(shape:'circle'|'line'|'cone'='circle')=>{
  const intent={abilityId:'native',shape,world:{x:0,z:9},facing:0,distance:9,isTap:false};
  return makeFurySkillPreview({x:0,z:0},intent,{abilityId:'native',shape,range:12,radius:2,width:1,coneDegrees:70})!;
};
test('existing scene receives exactly 3 mesh/line objects and reuses buffers on drag',()=>{
  const objects:FakeObject[]=[];
  let removed=0;
  const overlay=new FuryThreeGroundOverlay({
    scene:{add:o=>objects.push(o as FakeObject),remove:()=>removed++},
    three:THREE,terrainHeightAt:(_x,z)=>z*0.1,
  });
  assert.equal(overlay.show(a()),true);
  assert.equal(objects.length,3);
  assert.ok(objects.every(o=>o.visible || o.geometry.count===0));
  const firstAttr=objects.map(o=>o.geometry.attributes.get('position')!.array);
  assert.equal(overlay.show(a('line')),true);
  assert.equal(objects.length,3); // no additional drawables
  assert.ok(objects.every((o,i)=>firstAttr[i]===o.geometry.attributes.get('position')!.array));
  assert.ok(objects.every(o=>o.geometry.attributes.get('position')!.needsUpdate));
  assert.ok(objects[0].geometry.count>=12);
  overlay.hide();
  assert.ok(objects.every(o=>!o.visible));
  assert.equal(overlay.show(a('cone')),true);
  overlay.dispose();
  assert.equal(removed,3);
  assert.ok(objects.every(o=>o.geometry.disposed&&o.material.disposed));
});
test('ground telegraph is hidden, not drawn, when terrain height unavailable',()=>{
  const objects:FakeObject[]=[];
  const overlay=new FuryThreeGroundOverlay({
    scene:{add:o=>objects.push(o as FakeObject),remove:()=>{}},
    three:THREE,terrainHeightAt:()=>NaN,
  });
  assert.equal(overlay.show(a()),false);
  assert.equal(objects.length,0);
});
test('friendly and mobility tint stay readable and do not change native VFX',()=>{
  const objects:FakeObject[]=[];
  const overlay=new FuryThreeGroundOverlay({
    scene:{add:o=>objects.push(o as FakeObject),remove:()=>{}},
    three:THREE,terrainHeightAt:()=>0,
  });
  overlay.show({...a('circle'),tone:'friendly'});
  const green=objects[0].material.tint;
  overlay.show({...a('line'),tone:'mobility'});
  assert.notEqual(objects[0].material.tint,green);
  assert.equal(objects.length,3);
});
