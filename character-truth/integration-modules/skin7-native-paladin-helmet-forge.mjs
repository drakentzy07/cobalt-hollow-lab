/**
 * HIGHFLY SKIN 7 — First TRUE native geometry clone, NO BODYPAINT / NO PROXY.
 * Input: SHA-pinned ClaudeCraft Rig_Medium modular GLB.
 * Output: independent variant GLB; source file remains byte-identical.
 * Preserves skins, animations, skeleton, JOINTS_0, WEIGHTS_0 and source meshes.
 * V1 controlled deform; NOT AI image-to-3D, NOT a full armor factory.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { MeshoptDecoder } from 'meshoptimizer';

const INPUT='public/models/chars/modular/warrior_modular.glb';
const OUTPUT='character-truth/skin7-evidence/HIGHFLY-SKIN7-PALADIN-HELMET-NATIVE-VARIANT.glb';
const RECIPE='character-truth/integration-modules/skin7-paladin-helmet-recipe.json';
const raw=fs.readFileSync(INPUT);
const actualSha=crypto.createHash('sha1').update(Buffer.concat([
 Buffer.from('blob '+raw.length),Buffer.from([0]),raw])).digest('hex');
assert.equal(actualSha,'e3fb52b8e064ab3927f3bc34a5ba7d04e8d701c2','SOURCE_SHA_DRIFT');
assert.equal(raw.toString('ascii',0,4),'glTF');
assert.equal(raw.readUInt32LE(4),2);
assert.equal(raw.readUInt32LE(8),raw.length);
let offset=12,src=null,bin=null;
while(offset<raw.length){
 const len=raw.readUInt32LE(offset),type=raw.readUInt32LE(offset+4);
 offset+=8;
 assert(offset+len<=raw.length,'CORRUPTED_CHUNK');
 if(type===0x4e4f534a)src=JSON.parse(raw.subarray(offset,offset+len).toString('utf8'));
 if(type===0x004e4942)bin=raw.subarray(offset,offset+len);
 offset+=len;
}
assert(src?.nodes?.length&&src?.meshes?.length&&src?.skins?.length&&src?.animations?.length&&bin,'MISSING_NATIVE_ASSETS');
const recipe=JSON.parse(fs.readFileSync(RECIPE,'utf8'));
assert.equal(recipe.sourceNode,'Armor_paladin_Head','UNSAFE_NON_NATIVE_SOURCE');
assert.equal(recipe.rig,'Rig_Medium');
for(const key of ['crownLift','upperFlare','visorProjection']){
 assert(typeof recipe.geometry[key]==='number'&&recipe.geometry[key]>=0&&recipe.geometry[key]<=0.25,'UNSAFE_DEFORMATION_'+key);
}
for(const color of [recipe.colors.base,recipe.colors.trim])assert(/^#[0-9a-fA-F]{6}$/.test(color),'INVALID_COLOR');
const dst=structuredClone(src);
const sourceNodeIndex=src.nodes.findIndex(x=>x.name===recipe.sourceNode);
assert(sourceNodeIndex>=0,'PALADIN_HELMET_SOURCE_NODE_MISSING');
const originalNode=src.nodes[sourceNodeIndex];
assert(Number.isInteger(originalNode.mesh)&&Number.isInteger(originalNode.skin),'PALADIN_HELMET_MUST_BE_RIGGED');
const originalMesh=src.meshes[originalNode.mesh];
assert(originalMesh.primitives?.length>0,'MISSING_NATIVE_HELMET_GEOMETRY');
await MeshoptDecoder.ready;
function sourceAccessorPositions(accessorIndex){
 const a=src.accessors[accessorIndex],v=src.bufferViews[a.bufferView];
 assert(a.type==='VEC3'&&Number.isInteger(a.count)&&a.count>5,'POSITION_NOT_VEC3');
 const componentSize=({5120:1,5121:1,5122:2,5123:2,5125:4,5126:4})[a.componentType];
 assert(componentSize,'UNSUPPORTED_POSITION_COMPONENT');
 const e=v.extensions?.EXT_meshopt_compression;
 let data;
 if(e){
  assert.equal(e.buffer,0,'MESHOPT_REAL_BUFFER_REQUIRED');
  assert(e.count*e.byteStride===v.byteLength,'MESHOPT_UNCOMPRESSED_SIZE_MISMATCH');
  data=new Uint8Array(v.byteLength);
  const chunk=bin.subarray(e.byteOffset||0,(e.byteOffset||0)+e.byteLength);
  assert.equal(chunk.length,e.byteLength,'MESHOPT_COMPRESSED_BOUNDS');
  MeshoptDecoder.decodeGltfBuffer(data,e.count,e.byteStride,chunk,e.mode,e.filter||'NONE');
 } else {
  assert.equal(v.buffer,0,'EXTERNAL_BUFFER_UNSUPPORTED');
  data=bin.subarray(v.byteOffset||0,(v.byteOffset||0)+v.byteLength);
 }
 const stride=v.byteStride||e?.byteStride||componentSize*3;
 const accessorOffset=a.byteOffset||0;
 assert(accessorOffset+(a.count-1)*stride+componentSize*3<=data.length,'POSITION_ACCESSOR_OUT_OF_BOUNDS');
 const view=new DataView(data.buffer,data.byteOffset,data.byteLength);
 const get=(p)=>a.componentType===5126?view.getFloat32(p,true):
 a.componentType===5122?view.getInt16(p,true):
 a.componentType===5123?view.getUint16(p,true):
 a.componentType===5120?view.getInt8(p):
 a.componentType===5121?view.getUint8(p):
 view.getUint32(p,true);
 const result=[];
 for(let i=0;i<a.count;i++){
  const pos=accessorOffset+i*stride;
  const x=[get(pos),get(pos+componentSize),get(pos+componentSize*2)];
  const div=a.normalized?({5120:127,5121:255,5122:32767,5123:65535,5125:4294967295})[a.componentType]:null;
  result.push(div?x.map(n=>Math.max(-1,n/div)):x);
 }
 return result;
}
const align4=n=>(n+3)&~3;
let outputBin=Buffer.from(bin);
const mesh=structuredClone(originalMesh);
mesh.name='HIGHFLY_SKIN7_PALADIN_HELMET_LEGENDARY_MESH';
let edited=0,primitiveProof=[];
for(let j=0;j<mesh.primitives.length;j++){
 const primitive=mesh.primitives[j],position=primitive.attributes.POSITION;
 assert(Number.isInteger(position),'NATIVE_POSITION_MISSING');
 assert(Number.isInteger(primitive.attributes.JOINTS_0)&&Number.isInteger(primitive.attributes.WEIGHTS_0),'NATIVE_SKIN_WEIGHTS_MISSING');
 const coords=sourceAccessorPositions(position);
 const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 for(const xyz of coords)for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],xyz[k]);hi[k]=Math.max(hi[k],xyz[k]);}
 const span=hi.map((v,k)=>v-lo[k]),h=Math.max(span[1],1e-6),w=Math.max(span[0],1e-6),depth=Math.max(span[2],1e-6);
 const arr=Buffer.alloc(coords.length*12);
 const outMin=[Infinity,Infinity,Infinity],outMax=[-Infinity,-Infinity,-Infinity];
 let changed=0;
 for(let i=0;i<coords.length;i++){
  const p=coords[i];
  const top=Math.max(0,Math.min(1,(p[1]-lo[1])/h));
  const crown=Math.max(0,(top-0.57)/0.43);
  const face=Math.max(0,1-Math.abs(top-0.52)*2);
  const x=p[0]+(p[0]-(lo[0]+hi[0])/2)*recipe.geometry.upperFlare*crown;
  const y=p[1]+h*recipe.geometry.crownLift*crown*crown;
  const z=p[2]+depth*recipe.geometry.visorProjection*face*(p[2]>(lo[2]+hi[2])/2?1:0);
  const result=[x,y,z];
  for(let k=0;k<3;k++){assert(Number.isFinite(result[k]));outMin[k]=Math.min(outMin[k],result[k]);outMax[k]=Math.max(outMax[k],result[k]);arr.writeFloatLE(result[k],i*12+k*4);}
  if(result.some((v,k)=>Math.abs(v-p[k])>1e-8))changed++;
 }
 assert(changed>0,'NO_ACTUAL_VERTEX_MODIFICATION');
 outputBin=Buffer.concat([outputBin,Buffer.alloc(align4(outputBin.length)-outputBin.length)]);
 const bv=dst.bufferViews.push({buffer:0,byteOffset:outputBin.length,byteLength:arr.length,target:34962})-1;
 outputBin=Buffer.concat([outputBin,arr]);
 const originalAccessor=src.accessors[position];
 const replacement={bufferView:bv,byteOffset:0,componentType:5126,count:originalAccessor.count,type:'VEC3',min:outMin,max:outMax};
 const newAccessor=dst.accessors.push(replacement)-1;
 primitive.attributes.POSITION=newAccessor;
 const originalMaterial=src.materials[primitive.material];
 assert(originalMaterial,'MISSING_ORIGINAL_MATERIAL');
 const material=structuredClone(originalMaterial);
 material.name='HIGHFLY_SKIN7_HELMET_'+(j===0?'MIDNIGHT_STEEL':'GOLD_TRIM');
 material.pbrMetallicRoughness??={};
 const color=j===0?recipe.colors.base:recipe.colors.trim;
 const srgb=x=>{x=parseInt(x,16)/255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4};
 material.pbrMetallicRoughness.baseColorFactor=[srgb(color.slice(1,3)),srgb(color.slice(3,5)),srgb(color.slice(5,7)),1];
 material.pbrMetallicRoughness.metallicFactor=.82;
 material.pbrMetallicRoughness.roughnessFactor=.28;
 delete material.pbrMetallicRoughness.baseColorTexture;
 material.doubleSided=originalMaterial.doubleSided||false;
 primitive.material=dst.materials.push(material)-1;
 assert.equal(primitive.attributes.JOINTS_0,originalMesh.primitives[j].attributes.JOINTS_0);
 assert.equal(primitive.attributes.WEIGHTS_0,originalMesh.primitives[j].attributes.WEIGHTS_0);
 primitiveProof.push({primitive:j,vertices:coords.length,changedVertices:changed,originalPositionAccessor:position,newPositionAccessor:newAccessor,originalJointsAccessor:originalMesh.primitives[j].attributes.JOINTS_0,originalWeightsAccessor:originalMesh.primitives[j].attributes.WEIGHTS_0});
 edited+=changed;
}
const meshId=dst.meshes.push(mesh)-1;
const variant=structuredClone(originalNode);
variant.name='HIGHFLY_SKIN7_PALADIN_HELMET_LEGENDARY';
variant.mesh=meshId;
variant.extras={...(variant.extras||{}),highflySkin7:{source:recipe.sourceNode,kind:'native-vertex-variant',preset:recipe.name}};
const newNodeId=dst.nodes.push(variant)-1;
let swapped=0;
for(const parent of dst.nodes){
 if(!parent.children)continue;
 for(let i=0;i<parent.children.length;i++){
  if(parent.children[i]===sourceNodeIndex){parent.children[i]=newNodeId;swapped++;}
 }
}
for(const scene of dst.scenes||[]){
 if(!scene.nodes)continue;
 for(let i=0;i<scene.nodes.length;i++)if(scene.nodes[i]===sourceNodeIndex){scene.nodes[i]=newNodeId;swapped++;}
}
assert(swapped>0,'NATIVE_HEAD_PARENT_NOT_FOUND');
assert.equal(dst.nodes[newNodeId].skin,originalNode.skin,'SKIN_LINK_CHANGED');
assert.deepEqual(dst.skins,src.skins,'SKELETON_CHANGED');
assert.deepEqual(dst.animations,src.animations,'ANIMATIONS_CHANGED');
assert.deepEqual(dst.meshes[originalNode.mesh],src.meshes[originalNode.mesh],'ORIGINAL_HELMET_MUTATED');
dst.buffers[0].byteLength=outputBin.length;
dst.asset={...dst.asset,generator:'HIGHFLY SKIN7 native Paladin helmet duplicate + actual POSITION deformation'};
const doc=Buffer.from(JSON.stringify(dst));
const jsonPad=Buffer.alloc(align4(doc.length)-doc.length,0x20);
const binPad=Buffer.alloc(align4(outputBin.length)-outputBin.length);
outputBin=Buffer.concat([outputBin,binPad]);
const total=12+8+doc.length+jsonPad.length+8+outputBin.length;
const out=Buffer.alloc(total);
out.write('glTF',0);out.writeUInt32LE(2,4);out.writeUInt32LE(total,8);
out.writeUInt32LE(doc.length+jsonPad.length,12);out.writeUInt32LE(0x4e4f534a,16);
doc.copy(out,20);jsonPad.copy(out,20+doc.length);
const binHeader=20+doc.length+jsonPad.length;
out.writeUInt32LE(outputBin.length,binHeader);out.writeUInt32LE(0x004e4942,binHeader+4);
outputBin.copy(out,binHeader+8);
fs.mkdirSync('character-truth/skin7-evidence',{recursive:true});
fs.writeFileSync(OUTPUT,out);
const after=fs.readFileSync(INPUT);
assert(after.equals(raw),'SOURCE_GLB_MODIFIED');
const report={stage:'NATIVE_PALADIN_HELMET_GEOMETRY_CLONE',sourceNode:originalNode.name,outputNode:variant.name,sourceGitBlobSha:actualSha,sourceFileUnchanged:true,originalMeshUnchanged:true,originalRigSkinIndex:originalNode.skin,variantRigSkinIndex:variant.skin,skeletonAndAnimationsUnchanged:true,vertexGeometryReallyModified:true,totalVerticesChanged:edited,swappedNodeReferences:swapped,primitives:primitiveProof,sourceBytes:raw.length,variantBytes:out.length,generatedNewArmorFromImage:false,usesNativeGeometry:true,gamePublicUntouched:true,licensingAndMobileVisualGate:'not certified',recipe};
fs.writeFileSync('character-truth/skin7-evidence/helmet-forge-report.json',JSON.stringify(report,null,2));
console.log('SKIN7_REAL_CLAUDECRAFT_PALADIN_HELMET_GEOMETRY_DUPLICATED_GREEN=1',JSON.stringify({edited,swapped,primitiveProof,variantBytes:out.length}));
