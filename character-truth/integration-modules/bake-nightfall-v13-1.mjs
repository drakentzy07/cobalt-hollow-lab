/**
 * HIGHFLY V13.1 — SAFE BAKED PBR GLB, not a screenshot or just a JSON recipe.
 * Edits ONLY glTF JSON mesh/material bindings in a COPY of genuine Blender
 * Nightfall V12 GLB; byte-identical binary buffers preserve original 23-bone
 * skin weights, geometry and inverse bind matrices. No new rig or game changes.
 * This is a portable armor-only GLB, NOT the original Hunter source mesh.
 */
import {forgedPaintKey,validPremiumPaint} from './premium-paint-v13.mjs';
const JSON_CHUNK=0x4e4f534a,BIN_CHUNK=0x004e4942,MAX_BYTES=14_000_000;
const DECODER=new TextDecoder('utf-8',{fatal:true}),ENCODER=new TextEncoder();
function must(x,message){if(!x)throw Error('V13_1_'+message)}
const isIndex=(n,length)=>Number.isInteger(n)&&n>=0&&n<length;
export function inspectNightfallGlb(input){
 const bytes=input instanceof ArrayBuffer?new Uint8Array(input):
             input instanceof Uint8Array?new Uint8Array(input.buffer,input.byteOffset,input.byteLength):null;
 must(bytes&&bytes.byteLength>12000&&bytes.byteLength<MAX_BYTES,'INVALID_GLB_BUFFER');
 const dat=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 must(dat.getUint32(0,true)===0x46546c67&&dat.getUint32(4,true)===2,'INVALID_GLB_HEADER');
 must(dat.getUint32(8,true)===bytes.length,'INVALID_GLB_LENGTH');
 let offset=12;const chunks=[];
 while(offset<bytes.length){
  must(offset+8<=bytes.length,'TRUNCATED_CHUNK_HEADER');
  const len=dat.getUint32(offset,true),type=dat.getUint32(offset+4,true);
  must(len%4===0&&len>0&&offset+8+len<=bytes.length,'CHUNK_LENGTH');
  chunks.push({type,bytes:bytes.slice(offset+8,offset+8+len)});
  offset+=8+len;
 }
 must(chunks.length>=2&&chunks[0].type===JSON_CHUNK&&chunks[1].type===BIN_CHUNK,
    'GLB_JSON_AND_BINARY_CHUNKS_REQUIRED');
 must(chunks.every((c,i)=>i<2||c.type!==JSON_CHUNK),'DUPLICATE_JSON_CHUNK');
 let json;
 try{json=JSON.parse(DECODER.decode(chunks[0].bytes).replace(/[ \t\r\n\0]+$/g,''))}
 catch{throw Error('V13_1_BAD_GLTF_JSON')}
 must(json?.asset?.version==='2.0','REQUIRE_GLTF_V2');
 must(Array.isArray(json.nodes)&&Array.isArray(json.meshes)&&Array.isArray(json.skins)&&
  Array.isArray(json.materials),'REQUIRE_NATIVE_FORGE_AND_SKIN');
 const nodes=json.nodes.filter(n=>n.mesh!==undefined);
 must(nodes.length===92&&nodes.every(n=>isIndex(n.mesh,json.meshes.length)&&
   isIndex(n.skin,json.skins.length)),'ONLY_92_SKINNED_PREMIUM_NIGHTFALL_MESHES');
 const names=nodes.map(n=>n.name||json.meshes[n.mesh].name||'');
 must(new Set(names).size===92&&names.every(n=>forgedPaintKey(n)),
   'ORIGINAL_SOURCE_MESH_LEAK_OR_DUPLICATE');
 must(names.filter(n=>n.startsWith('HFV8_')).length===36&&
   names.filter(n=>n.startsWith('HFV12_')).length===56,'EXACT_PREMIUM_SOURCE_MESH_COUNTS');
 for(const n of nodes){
  const mesh=json.meshes[n.mesh];
  must(Array.isArray(mesh.primitives)&&mesh.primitives.length>=1,'EMPTY_NATIVE_FORGE_PRIMITIVES');
  for(const prim of mesh.primitives){
   must(isIndex(prim.material,json.materials.length),'FORGED_PBR_MATERIAL_MISSING');
   must(prim.attributes&&
     Number.isInteger(prim.attributes.JOINTS_0)&&
     Number.isInteger(prim.attributes.WEIGHTS_0)&&
     Number.isInteger(prim.attributes.POSITION),'FORGED_NATIVE_SKINNING_MISSING');
  }
 }
 return {bytes,chunks,json,nodes,names};
}
function hexLinear(hex){
 return [1,3,5].map(i=>{
  const c=parseInt(hex.slice(i,i+2),16)/255;
  return c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4);
 });
}
/**
 * Returns modified GLB as Uint8Array. Geometry/BIN buffers remain byte-exact.
 * Every selected semantic key MUST exist in both genders in this actual GLB.
 * Original shared materials must never be edited in place.
 */
export function bakeNightfallGlb(original,rawRecipe){
 const recipe=validPremiumPaint(rawRecipe),source=inspectNightfallGlb(original);
 must(recipe.paints.length>=1,'NOTHING_PAINTED');
 const json=source.json,sourceMaterials=json.materials.length;
 const groups=new Map();
 for(const n of source.nodes){
  const name=n.name||json.meshes[n.mesh].name,key=forgedPaintKey(name);
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push({node:n,name});
 }
 let paintedMeshes=0,materialClones=0;
 for(const paint of recipe.paints){
  const refs=groups.get(paint.key);
  must(refs&&refs.length===2&&refs.some(r=>r.name.startsWith('HFV8_M_')||r.name.startsWith('HFV12_M_'))&&
   refs.some(r=>r.name.startsWith('HFV8_F_')||r.name.startsWith('HFV12_F_')),
   'PAINT_KEY_MUST_TARGET_BOTH_REAL_HUNTERS_'+paint.key);
  for(const {node,name} of refs){
   const base=json.meshes[node.mesh];
   const copy=JSON.parse(JSON.stringify(base));
   copy.name=name+'_HFV13_1_BAKED';
   for(const prim of copy.primitives){
    const old=json.materials[prim.material];
    const mat=JSON.parse(JSON.stringify(old));
    const pbr=mat.pbrMetallicRoughness||(mat.pbrMetallicRoughness={});
    const originalFactor=pbr.baseColorFactor||[1,1,1,1];
    pbr.baseColorFactor=[...hexLinear(paint.color),originalFactor[3]??1];
    pbr.metallicFactor=paint.metalness;
    pbr.roughnessFactor=paint.roughness;
    mat.name='HIGHFLY_BAKED_'+name;
    prim.material=json.materials.push(mat)-1;
    materialClones++;
   }
   node.mesh=json.meshes.push(copy)-1;
   paintedMeshes++;
  }
 }
 // Blender's GLB carried donor reference action clips. In HIGHFLY only the
 // authentic Hunter animation mixer has authority: do NOT ship orphan donor
 // animations as if the new armor had a second animation controller.
 const droppedDonorAnimations=json.animations?.length||0;
 delete json.animations;
 json.asset.extras={...(json.asset.extras||{}),highfly:{
  kind:'NIGHTFALL_V13_1_PBR_BAKE',source:'HIGHFLY_V12_ORIGINAL_RIGGED_ARMOR',
  bakedPaintSchema:recipe.schema,paintedSemanticParts:recipe.paints.length,
  originalRigName:'Rig_Medium',originalHunterMeshesIncluded:false,
  sourceAnimationControllerNotDuplicated:true}};
 const serialized=ENCODER.encode(JSON.stringify(json));
 const padded=Math.ceil(serialized.length/4)*4;
 const chunks=[{type:JSON_CHUNK,bytes:new Uint8Array(padded)},...source.chunks.slice(1)];
 chunks[0].bytes.fill(0x20);chunks[0].bytes.set(serialized);
 const length=12+chunks.reduce((n,c)=>n+8+c.bytes.length,0);
 must(length<MAX_BYTES,'OUTPUT_MOBILE_GLB_TOO_LARGE');
 const output=new Uint8Array(length),v=new DataView(output.buffer);
 v.setUint32(0,0x46546c67,true);v.setUint32(4,2,true);v.setUint32(8,length,true);
 let offset=12;
 for(const c of chunks){
  v.setUint32(offset,c.bytes.length,true);v.setUint32(offset+4,c.type,true);
  output.set(c.bytes,offset+8);offset+=8+c.bytes.length;
 }
 // Re-validate actual output and prove all original binary chunks bit-identical.
 const baked=inspectNightfallGlb(output);
 must(baked.chunks.length===source.chunks.length&&baked.chunks.every((c,i)=>
   i===0||(c.type===source.chunks[i].type&&
    c.bytes.length===source.chunks[i].bytes.length&&
    c.bytes.every((b,j)=>b===source.chunks[i].bytes[j]))),'NATIVE_BUFFER_MUTATION');
 must(baked.json.skins.length===source.json.skins.length,'SOURCE_NATIVE_RIG_MUTATED');
 return {bytes:output,summary:{
  paintedSemanticParts:recipe.paints.length,paintedMeshes,materialClones,
  sourceMaterialCount:sourceMaterials,bakedMaterialCount:baked.json.materials.length,
  originalSkinnedMeshes:92,originalBonesUnmodified:true,
  byteIdenticalBinaryBuffers:true,droppedDonorAnimations,
  originalHunterGLBNotIncluded:true,trianglesChanged:false,
  isTrueModifiedGLB:true}};
}
