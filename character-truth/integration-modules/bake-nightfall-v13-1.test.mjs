import assert from 'node:assert/strict';
import {bakeNightfallGlb,inspectNightfallGlb} from './bake-nightfall-v13-1.mjs';
import {PREMIUM_PAINT_SCHEMA} from './premium-paint-v13.mjs';
const json={asset:{version:'2.0',generator:'HIGHFLY_V13_1_MOCK_ONLY'},
 skins:[{joints:[0],inverseBindMatrices:0}],nodes:[{name:'root'}],
 meshes:[],materials:[{name:'NIGHTFALL_ORIGINAL',pbrMetallicRoughness:{baseColorFactor:[.3,.4,.5,1],metallicFactor:.5,roughnessFactor:.4}}],
 buffers:[{byteLength:40000}],bufferViews:[],accessors:[],
 animations:[{name:'DONOR_CLIP',channels:[],samplers:[]}]};
for(const gender of ['M','F']){
 for(let i=0;i<18;i++)json.nodes.push({name:'HFV8_'+gender+'_CHEST_TEST_'+i,mesh:json.meshes.push({
 name:'HFV8_'+gender+'_CHEST_TEST_'+i,
 primitives:[{attributes:{POSITION:0,JOINTS_0:1,WEIGHTS_0:2},material:0}]
 })-1,skin:0});
 for(let i=0;i<28;i++)json.nodes.push({name:'HFV12_'+gender+'_CHEST_TEST_'+i,mesh:json.meshes.push({
 name:'HFV12_'+gender+'_CHEST_TEST_'+i,
 primitives:[{attributes:{POSITION:0,JOINTS_0:1,WEIGHTS_0:2},material:0}]
 })-1,skin:0});
}
function mockGlb(j){
 const source=new TextEncoder().encode(JSON.stringify(j)),jsonSize=Math.ceil(source.length/4)*4;
 const bin=new Uint8Array(40000);for(let k=0;k<bin.length;k++)bin[k]=(k*19)%251;
 const len=12+8+jsonSize+8+bin.length,bytes=new Uint8Array(len),d=new DataView(bytes.buffer);
 d.setUint32(0,0x46546c67,true);d.setUint32(4,2,true);d.setUint32(8,len,true);
 d.setUint32(12,jsonSize,true);d.setUint32(16,0x4e4f534a,true);
 bytes.fill(32,20,20+jsonSize);bytes.set(source,20);
 d.setUint32(20+jsonSize,bin.length,true);d.setUint32(24+jsonSize,0x004e4942,true);
 bytes.set(bin,28+jsonSize);return bytes;
}
const original=mockGlb(json),source=inspectNightfallGlb(original);
assert.equal(source.names.length,92);
const recipe={schema:PREMIUM_PAINT_SCHEMA,paints:[
 {key:'HFV12_CHEST_TEST_0',color:'#Ee4488',metalness:.52,roughness:.25}]};
const baked=bakeNightfallGlb(original,recipe),after=inspectNightfallGlb(baked.bytes);
assert.equal(baked.summary.paintedMeshes,2);
assert.equal(baked.summary.byteIdenticalBinaryBuffers,true);
assert.equal(baked.summary.droppedDonorAnimations,1);
assert.equal(after.json.meshes.length,94);
assert.equal(after.json.materials.length,3);
assert.equal(after.json.animations,undefined);
assert.deepEqual([...source.chunks[1].bytes],[...after.chunks[1].bytes]);
assert.deepEqual(after.json.skins,json.skins);
assert.deepEqual(after.json.accessors,json.accessors);
assert.deepEqual(after.json.bufferViews,json.bufferViews);
assert.deepEqual(after.json.buffers,json.buffers);
assert.equal(original.byteLength,source.bytes.byteLength);
assert.equal(source.json.materials.length,1); // original GLB input untouched
const painted=after.json.nodes.filter(n=>n.name?.endsWith('_CHEST_TEST_0')&&n.name.startsWith('HFV12_'));
assert.equal(painted.length,2);
for(const n of painted){
 const prim=after.json.meshes[n.mesh].primitives[0],m=after.json.materials[prim.material];
 assert.equal(m.pbrMetallicRoughness.roughnessFactor,.25);
 assert.equal(m.pbrMetallicRoughness.metallicFactor,.52);
 assert.equal(m.pbrMetallicRoughness.baseColorFactor[3],1);
 assert(Math.abs(m.pbrMetallicRoughness.baseColorFactor[0]-.854993)<.005);
}
const other=after.json.nodes.find(n=>n.name==='HFV12_M_CHEST_TEST_1');
assert.equal(after.json.meshes[other.mesh].primitives[0].material,0,'Unpainted meshes cannot lose shared original material');
for(const invalid of [
 {...recipe,paints:[{...recipe.paints[0],key:'M_Head'}]},
 {...recipe,paints:[{...recipe.paints[0],color:'#xxxxxx'}]},
 {...recipe,paints:[{...recipe.paints[0],roughness:-1}]},
 {...recipe,paints:[]}
])assert.throws(()=>bakeNightfallGlb(original,invalid));
assert.throws(()=>bakeNightfallGlb(original.slice(4),recipe));
console.log('HIGHFLY_V13_1_BAKED_GLB_BINARY_EXACT_PBR_AND_TWO_GENDERS_UNIT_GREEN=1');
