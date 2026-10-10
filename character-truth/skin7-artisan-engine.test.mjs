import assert from 'node:assert/strict';
import {CONTROLS,GROUPS,defaults,normalizeDesign,recipeFromText,groupFor,
 transformPositions,transformNormals,compareGeometry,rewriteGlb} from './skin7-artisan-engine.mjs';
const a=defaults(),b=recipeFromText('Armadura samurai demon rojo carmesi asimetrica con hombrera izquierda enorme y faldones segmentados largos y pechera heroica');
assert.equal(b.controls.shoulderLeft,1.38);
assert.equal(b.controls.shoulderRight,.87);
assert.equal(b.controls.waistFlare,1.28);
assert.equal(b.controls.chestDepth,1.22);
assert.equal(groupFor('HF7_M_SHOULDER_L_PAGODA_1'),'SHOULDER_L');
assert.equal(groupFor('HF7_F_CHEST_ENERGY_FRAME'),'CHEST');
assert.equal(groupFor('HFV12_M_CHEST_ABDOMINAL_CUIRASS'),null);
assert.equal(normalizeDesign(b).title,'Crimson Tech Oni');
assert.throws(()=>normalizeDesign({...a,controls:{shoulderLeft:Infinity}}),/NONFINITE/);
assert.throws(()=>normalizeDesign({...a,controls:{waistFlare:7}}),/SAFE_RANGE/);
assert.throws(()=>normalizeDesign({...a,palette:{primary:'javascript:bad'}}),/COLOR_INVALID/);
const pos=new Float32Array([-1,0,0,1,0,0,0,1,0,0,-1,0,1,1,0,-1,-1,0]);
const mod=transformPositions(pos,'HF7_M_SHOULDER_L_PAGODA_0',b);
assert(Math.abs(mod[0]+1.38)<.0001);
assert(Math.abs(mod[3]-1.38)<.0001);
assert(compareGeometry(a,b,'HF7_M_SHOULDER_L_PAGODA_0',pos)>1);
assert.equal(compareGeometry(a,b,'HF7_M_SHOULDER_R_PAGODA_0',pos)>0,true);
assert.equal(compareGeometry(a,b,'HFV12_M_CHEST',pos),0);
const norm=transformNormals(new Float32Array([.5,.5,.7]),'HF7_M_SHOULDER_L_PAGODA_0',b);
assert(Math.abs(Math.hypot(...norm)-1)<.000001);
const E=new TextEncoder(),jsonPad=x=>(x+3)&~3;
function syntheticGLB(){
 const f=new Float32Array([
  -1,0,0,1,0,0,0,1,0,0,-1,0,0,
  0,1,0,0,1,0,0,1,0,0,1,0]);
 const raw=new Uint8Array(f.buffer);
 const doc={
 asset:{version:'2.0'},buffers:[{byteLength:raw.byteLength}],
 bufferViews:[{buffer:0,byteOffset:0,byteLength:48},{buffer:0,byteOffset:48,byteLength:48}],
 accessors:[{bufferView:0,componentType:5126,count:4,type:'VEC3',min:[-1,0,0],max:[1,1,0]},
 {bufferView:1,componentType:5126,count:4,type:'VEC3'}],
 materials:[{name:'HF7_SCULPTED_ENAMEL',pbrMetallicRoughness:{baseColorFactor:[1,0,0,1]}}],
 meshes:[{primitives:[{attributes:{POSITION:0,NORMAL:1,JOINTS_0:2,WEIGHTS_0:3},material:0}]}],
 nodes:[{name:'Rig_Medium',children:[1]},{name:'HF7_M_SHOULDER_L_PAGODA_0',mesh:0,skin:0}],
 skins:[{joints:[0],skeleton:0}],scenes:[{nodes:[0]}],scene:0};
 const data=E.encode(JSON.stringify(doc)),jp=jsonPad(data.length),bp=jsonPad(raw.length);
 const out=new Uint8Array(12+8+jp+8+bp);
 const v=new DataView(out.buffer);
 v.setUint32(0,0x46546c67,true);v.setUint32(4,2,true);
 v.setUint32(8,out.length,true);v.setUint32(12,jp,true);v.setUint32(16,0x4e4f534a,true);
 out.set(data,20);out.fill(32,20+data.length,20+jp);
 v.setUint32(20+jp,bp,true);v.setUint32(24+jp,0x004e4942,true);out.set(raw,28+jp);
 return out;
}
const raw=syntheticGLB(),edit=rewriteGlb(raw,b);
assert(edit.bytes.byteLength>raw.byteLength);
assert.equal(edit.report.editedPrimitives,1);
assert.equal(edit.report.nativeSkinCount,1);
function split(out){
 const v=new DataView(out.buffer,out.byteOffset,out.byteLength);
 assert.equal(v.getUint32(8,true),out.byteLength);
 const json=JSON.parse(new TextDecoder().decode(out.subarray(20,20+v.getUint32(12,true))).trim());
 const pos=20+v.getUint32(12,true);assert.equal(v.getUint32(pos+4,true),0x4e4942);
 return {json,bin:new Float32Array(out.buffer,out.byteOffset+pos+8,24)};
}
const before=split(raw),after=split(edit.bytes);
assert.equal(before.json.skins[0].joints[0],after.json.skins[0].joints[0]);
assert.equal(before.json.nodes[1].skin,after.json.nodes[1].skin);
assert.equal(after.json.meshes[0].primitives[0].attributes.WEIGHTS_0,3);
assert.equal(after.json.materials[0].pbrMetallicRoughness.baseColorFactor[0],168/255);
assert(Math.abs(after.bin[0]+1.38)<.0001,'ACTUAL_POSITION_BUFFER_NOT_EDITED');
assert(Math.abs(after.bin[3]-1.38)<.0001,'SECOND_ACTUAL_POSITION_BUFFER_NOT_EDITED');
assert.equal(before.bin[0],-1,'ORIGINAL_EXACT_BYTES_MUTATED');
assert(!new TextDecoder().decode(raw).includes('highflySkin7'),'INPUT_GLB_MUST_BE_UNCHANGED');
const hidden=structuredClone(b);hidden.visible.SHOULDER_L=false;
const hiddenBin=rewriteGlb(raw,hidden);
const parsed=split(hiddenBin.bytes);
assert.equal(parsed.json.nodes[0].children.length,0,'DISCARDED_PART_STILL_EXPORTED_VISIBLE');
assert.equal(hiddenBin.report.hiddenParts,1);
assert.throws(()=>rewriteGlb(new Uint8Array(30),b),/INVALID_GLB/);
assert.deepEqual(Object.keys(CONTROLS).length,8);
assert.equal(GROUPS.length,8);
console.log('HIGHFLY_SKIN7_ARTISAN_ACTUAL_VERTEX_AND_WEIGHT_PRESERVING_GLB_EXPORT_TEST_GREEN=1');
