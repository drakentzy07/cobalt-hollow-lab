/**
 * HIGHFLY V14 true sculpt GLB exporter.
 * Reuses authentic Blender Nightfall V12 rig, 92 SkinnedMesh nodes, indices,
 * inverse bind matrices, JOINTS_0 and WEIGHTS_0 entirely unchanged.
 * Appends only new POSITION/NORMAL float32 buffers for selected armor parts.
 * Source buffer prefix must remain byte-identical. Bake paint from V13.1
 * first, then append 3D shape, permitting BOTH effects in one file.
 */
import {inspectNightfallGlb,bakeNightfallGlb} from './bake-nightfall-v13-1.mjs';
import {PREMIUM_PAINT_SCHEMA,validPremiumPaint,forgedPaintKey} from './premium-paint-v13.mjs';
import {PREMIUM_SHAPE_SCHEMA,validPremiumShape,vertexShape,normalShape} from './native-shape-v14.mjs';
const encoder=new TextEncoder();
const READABLE_BYTES=20_000_000;
function required(c,m){if(!c)throw Error('V14_GLB_'+m)}
function accessorValues(glb,accessorId){
 const j=glb.json,a=j.accessors?.[accessorId],v=j.bufferViews?.[a?.bufferView];
 required(a?.componentType===5126&&a.type==='VEC3'&&!a.sparse&&!a.normalized&&
   a.count>=3&&a.count<=5000&&v?.buffer===0,'UNSUPPORTED_VERTEX_ACCESSOR');
 const stride=v.byteStride||12,off=(v.byteOffset||0)+(a.byteOffset||0),count=a.count;
 required(stride===12&&off%4===0&&off+count*stride<=glb.chunks[1].bytes.length,
    'OUT_OF_BOUNDS_OR_INTERLEAVED_BUFFER');
 const d=new DataView(glb.chunks[1].bytes.buffer,
   glb.chunks[1].bytes.byteOffset,glb.chunks[1].bytes.byteLength);
 const values=[];
 for(let i=0;i<count;i++){
  const p=[d.getFloat32(off+i*stride,true),d.getFloat32(off+i*stride+4,true),
    d.getFloat32(off+i*stride+8,true)];
  required(p.every(Number.isFinite),'NONFINITE_ORIGINAL_3D_VERTEX');
  values.push(p);
 }
 return values;
}
function appendBytes(json,array,pending){
 const v=new Uint8Array(array.length*12),data=new DataView(v.buffer);
 const extremaMin=[Infinity,Infinity,Infinity],extremaMax=[-Infinity,-Infinity,-Infinity];
 array.forEach((pt,i)=>{
  required(pt.every(Number.isFinite),'NONFINITE_DEFORMED_VERTEX');
  for(let k=0;k<3;k++){
   data.setFloat32(i*12+4*k,pt[k],true);
   const f=data.getFloat32(i*12+4*k,true);extremaMin[k]=Math.min(extremaMin[k],f);
   extremaMax[k]=Math.max(extremaMax[k],f);
  }
 });
 let offset=pending.offset;
 required(offset%4===0,'OUTPUT_BUFFER_ALIGNMENT');
 const view=json.bufferViews.push({buffer:0,byteOffset:offset,byteLength:v.length,target:34962})-1;
 const accessor=json.accessors.push({
  bufferView:view,componentType:5126,count:array.length,type:'VEC3',
  min:extremaMin,max:extremaMax
 })-1;
 pending.parts.push(v);pending.offset+=v.length;
 return accessor;
}
function outputGlb(json,newBin,base){
 const string=encoder.encode(JSON.stringify(json)),aligned=(string.length+3)&~3;
 const raw=new Uint8Array(aligned);raw.fill(32);raw.set(string);
 const extra=base.chunks.slice(2);const parts=[{t:0x4e4f534a,b:raw},{t:0x004e4942,b:newBin},
   ...extra.map(c=>({t:c.type,b:c.bytes}))];
 const length=12+parts.reduce((a,p)=>a+8+p.b.length,0);
 required(length<READABLE_BYTES,'OUTPUT_TOO_LARGE_FOR_ANDROID');
 const u=new Uint8Array(length),v=new DataView(u.buffer);
 v.setUint32(0,0x46546c67,true);v.setUint32(4,2,true);v.setUint32(8,length,true);
 let o=12;for(const part of parts){
  required(part.b.length%4===0,'UNALIGNED_GLB_CHUNK');
  v.setUint32(o,part.b.length,true);v.setUint32(o+4,part.t,true);
  u.set(part.b,o+8);o+=8+part.b.length;
 }
 return u;
}
export function bakeNativeShapeV14(original,rawPaint,rawShape){
 const paints=validPremiumPaint(rawPaint||{schema:PREMIUM_PAINT_SCHEMA,paints:[]});
 const shapes=validPremiumShape(rawShape);
 required(paints.paints.length+shapes.shapes.length>0,'NO_MATERIAL_OR_SHAPE_EDITS');
 const bakedPaint=paints.paints.length?bakeNightfallGlb(original,paints).bytes:original;
 const source=inspectNightfallGlb(bakedPaint),base=inspectNightfallGlb(original);
 const j=source.json;
 required(j.buffers?.length===1&&j.buffers[0].byteLength===source.chunks[1].bytes.length,
   'EXACT_ONE_ORIGINAL_FORGE_BUFFER_REQUIRED');
 const pending={offset:source.chunks[1].bytes.length,parts:[]};
 required(pending.offset%4===0,'NATIVE_GLB_BINARY_ALIGNMENT');
 let sculpted=0,positions=0,normalCount=0;
 for(const s of shapes.shapes){
  const hits=source.nodes.filter(n=>
    forgedPaintKey(n.name||j.meshes[n.mesh].name)===s.key);
  required(hits.length===2&&
   hits.some(n=>(n.name||'').startsWith('HFV8_M_')||(n.name||'').startsWith('HFV12_M_'))&&
   hits.some(n=>(n.name||'').startsWith('HFV8_F_')||(n.name||'').startsWith('HFV12_F_')),
   'GEOMETRY_MUST_MATCH_EXACT_BOTH_AUTHENTIC_GENDERS_'+s.key);
  for(const node of hits){
   const cloned=JSON.parse(JSON.stringify(j.meshes[node.mesh]));
   cloned.name=(node.name||cloned.name)+'_V14_SCULPTED';
   for(const prim of cloned.primitives){
    required(prim.attributes?.POSITION!==undefined&&
      prim.attributes?.NORMAL!==undefined&&
      prim.attributes?.JOINTS_0!==undefined&&
      prim.attributes?.WEIGHTS_0!==undefined,'SKIN_ATTRIBUTES_MISSING');
    const oldP=accessorValues(source,prim.attributes.POSITION),
      oldN=accessorValues(source,prim.attributes.NORMAL);
    required(oldP.length===oldN.length,'UNEQUAL_POSITIONS_AND_NORMALS');
    const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
    for(const p of oldP)for(let k=0;k<3;k++){
     min[k]=Math.min(min[k],p[k]);max[k]=Math.max(max[k],p[k]);
    }
    const center=min.map((v,k)=>(v+max[k])/2);
    const newP=oldP.map(p=>vertexShape(p,center,s)),
          newN=oldN.map(n=>normalShape(n,s));
    prim.attributes.POSITION=appendBytes(j,newP,pending);
    prim.attributes.NORMAL=appendBytes(j,newN,pending);
    positions+=newP.length;normalCount+=newN.length;
   }
   node.mesh=j.meshes.push(cloned)-1;
   sculpted++;
  }
 }
 // Read-only Hunter controls the live animations. The Nightfall standalone
 // forge should not carry a second donor mixer/clip authority.
 const droppedDonorClips=j.animations?.length||0;delete j.animations;
 j.asset.extras={...(j.asset.extras||{}),highfly:{
  kind:'NIGHTFALL_V14_REAL_SCULPT_PLUS_PBR',
  originalHunterMeshesBundled:false,sourceRig:'Rig_Medium',
  faceHelmetIsSeparate:true,
  sourceBinaryPrefixByteIdentical:true,
  untouchedSkinWeightsAndInverseBindMatrices:true,
  newPositionAndNormalDataOnly:true,
  shapedSemanticPieces:shapes.shapes.length,
  paintedSemanticPieces:paints.paints.length}};
 const bin=new Uint8Array(pending.offset);bin.set(source.chunks[1].bytes);
 let o=source.chunks[1].bytes.length;for(const p of pending.parts){bin.set(p,o);o+=p.length}
 required(o===bin.length,'APPENDED_BUFFER_LENGTH');
 j.buffers[0].byteLength=bin.length;
 const bytes=outputGlb(j,bin,source),check=inspectNightfallGlb(bytes);
 required(check.json.skins.length===base.json.skins.length&&
   JSON.stringify(check.json.skins)===JSON.stringify(base.json.skins),
   'AUTHENTIC_ORIGINAL_SKELETON_CHANGED');
 required(JSON.stringify(check.json.nodes.map(n=>n.skin??null))===
   JSON.stringify(base.json.nodes.map(n=>n.skin??null)),
   'SKIN_NODE_ASSOCIATIONS_CHANGED');
 required(JSON.stringify(check.json.bufferViews.slice(0,base.json.bufferViews.length))===
   JSON.stringify(base.json.bufferViews),'PREEXISTING_BUFFER_VIEWS_MUTATED');
 required(JSON.stringify(check.json.accessors.slice(0,base.json.accessors.length))===
   JSON.stringify(base.json.accessors),'EXISTING_SKIN_ACCESSORS_MUTATED');
 required(check.chunks[1].bytes.slice(0,base.chunks[1].bytes.length)
    .every((v,k)=>v===base.chunks[1].bytes[k]),'ORIGINAL_WEIGHT_VERTEX_BYTES_CHANGED');
 return {bytes,summary:{shapedGenderMeshes:sculpted,shapedSemanticPieces:shapes.shapes.length,
  paintedSemanticPieces:paints.paints.length,verticesMoved:positions,
  normalsUpdated:normalCount,originalRig:'Rig_Medium',
  originalWeightedBinaryPrefixPreserved:true,unchangedOriginalSkins:true,
  sourceMeshes:92,donorAnimationClipsRemoved:droppedDonorClips,
  exportIsRealSculptedGlb:true}};
}
