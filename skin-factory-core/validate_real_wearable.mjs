/**
 * HIGHFLY WEARABLE FACTORY R0.1 — Real 3D GLB intake and original Rig_Medium gate.
 * No fake image->mesh transformation, bodypaint, generic geometric stand-ins,
 * imported animations, or changed skeleton. Validation is NOT artistic approval.
 * Offline Node >=20, no network packages, suitable for GitHub Actions gates.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

const COMPONENTS={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4};
const TYPES={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
const SOURCE_MAX=35*1024*1024,WEAR_MAX=25*1024*1024;
function demand(x,message){if(!x)throw Error(message);}
export function parseGLB(path,limit=WEAR_MAX){
 const bytes=readFileSync(path);
 demand(bytes.length>=28&&bytes.length<=limit,'GLB_FILE_SIZE_OR_EMPTY');
 demand(bytes.toString('ascii',0,4)==='glTF'&&bytes.readUInt32LE(4)===2&&bytes.readUInt32LE(8)===bytes.length,'GLB_HEADER_VERSION_LENGTH_INVALID');
 let off=12,doc=null,bin=null;
 while(off<bytes.length){
  demand(off+8<=bytes.length,'GLB_CHUNK_HEADER_TRUNCATED');
  const len=bytes.readUInt32LE(off),type=bytes.readUInt32LE(off+4);off+=8;
  demand(len>=0&&off+len<=bytes.length,'GLB_CHUNK_LENGTH_INVALID');
  if(type===0x4E4F534A)doc=JSON.parse(bytes.subarray(off,off+len).toString('utf8').trim());
  if(type===0x004E4942)bin=bytes.subarray(off,off+len);
  off+=len;
 }
 demand(doc?.asset?.version==='2.0'&&bin,'GLB_MISSING_VALID_JSON_OR_BIN');
 demand(Array.isArray(doc.nodes)&&Array.isArray(doc.meshes)&&Array.isArray(doc.accessors)&&Array.isArray(doc.bufferViews),'GLB_MISSING_SCENE_GEOMETRY');
 demand(doc.meshes.length>0,'GLB_IMAGE_OR_MATERIAL_ONLY_NOT_WEARABLE');
 return {doc,bin,bytes:bytes.length,path};
}
export function sampleAccessor(glb,index,i){
 const {doc,bin}=glb,acc=doc.accessors[index];
 demand(acc&&Number.isInteger(i)&&i>=0&&i<acc.count&&acc.sparse===undefined,'GLB_ACCESSOR_INVALID_OR_SPARSE_UNSUPPORTED');
 const v=doc.bufferViews[acc.bufferView];
 demand(v&&!v.extensions?.EXT_meshopt_compression,'GLB_ACCESSOR_COMPRESSED_REQUIRES_DECODE');
 const size=COMPONENTS[acc.componentType],parts=TYPES[acc.type];
 demand(size&&parts,'GLB_UNSUPPORTED_ACCESSOR_TYPE');
 const stride=v.byteStride||size*parts,ptr=(v.byteOffset||0)+(acc.byteOffset||0)+i*stride;
 demand(ptr>=0&&ptr+size*parts<=bin.length,'GLB_ACCESSOR_OUT_OF_RANGE');
 const out=[],view=new DataView(bin.buffer,bin.byteOffset,bin.byteLength);
 for(let k=0;k<parts;k++){
  const at=ptr+k*size;
  let val=acc.componentType===5126?view.getFloat32(at,true):
   acc.componentType===5125?view.getUint32(at,true):
   acc.componentType===5123?view.getUint16(at,true):
   acc.componentType===5122?view.getInt16(at,true):
   acc.componentType===5121?view.getUint8(at):view.getInt8(at);
  if(acc.normalized&&acc.componentType!==5126){
   if(acc.componentType===5121)val/=255;
   else if(acc.componentType===5123)val/=65535;
   else if(acc.componentType===5120)val=Math.max(val/127,-1);
   else if(acc.componentType===5122)val=Math.max(val/32767,-1);
  }
  demand(Number.isFinite(val),'GLB_NONFINITE_ATTRIBUTE');
  out.push(val);
 }
 return out;
}
function joints(glb){
 const {doc}=glb;
 return (doc.skins||[]).map(s=>{
  demand(Array.isArray(s.joints)&&s.joints.length>0,'RIG_SKIN_HAS_NO_JOINTS');
  const names=s.joints.map(i=>doc.nodes[i]?.name);
  demand(names.every(x=>typeof x==='string'&&x.length),'RIG_JOINT_NAMES_MISSING');
  demand(new Set(names).size===names.length,'RIG_DUPLICATE_BONE_NAMES');
  return names;
 });
}
export function validateFactoryGlb({source,wearable,stage='wearable',maxTriangles=65000}){
 demand(['raw','wearable'].includes(stage),'INVALID_STAGE');
 const src=parseGLB(source,SOURCE_MAX),item=parseGLB(wearable,WEAR_MAX);
 demand(src.doc.animations?.length===22,'ORIGINAL_22_CLAUDECRAFT_ANIMATIONS_MISSING');
 const canonical=joints(src).find(a=>a.length===23);
 demand(canonical,'CLAUDECRAFT_RIG_MEDIUM_23_MISSING');
 const canonicalNames=new Set(canonical);
 const importedJoints=joints(item);
 const tr=Object.fromEntries(['head','chest','arms','hands','legs','feet','back'].map(n=>[n,0]));
 let meshNodes=0,weightedMeshes=0,weightVertices=0,vertices=0,triangles=0,missingSkin=0,untrustedJoint=0;
 for(const node of item.doc.nodes){
  if(node.mesh===undefined)continue;
  const m=item.doc.meshes[node.mesh];
  demand(m?.primitives?.length,'WEARABLE_EMPTY_MESH');
  meshNodes++;
  if(node.skin===undefined)missingSkin++;
  else{
   const boneNames=importedJoints[node.skin];
   demand(boneNames?.length===23,'WEARABLE_NOT_23_BONES');
   for(const n of boneNames)if(!canonicalNames.has(n))untrustedJoint++;
   weightedMeshes++;
  }
  const name=(node.name||m.name||'').toLowerCase();
  if(/head|helmet|helm|casco/.test(name))tr.head++;
  if(/chest|torso|cuirass|pecho|coraza/.test(name))tr.chest++;
  if(/arm|pauldron|shoulder|bracer|braz/.test(name))tr.arms++;
  if(/hand|gauntlet|guante/.test(name))tr.hands++;
  if(/leg|knee|greave|pierna/.test(name))tr.legs++;
  if(/foot|boot|sabat|pie/.test(name))tr.feet++;
  if(/back|cape|espalda/.test(name))tr.back++;
  for(const p of m.primitives){
   demand((p.mode||4)===4,'WEARABLE_MUST_BE_TRIANGLES');
   const pos=item.doc.accessors[p.attributes?.POSITION];
   demand(pos?.type==='VEC3'&&pos.count>=3,'WEARABLE_NO_VERTEX_GEOMETRY');
   vertices+=pos.count;triangles+=(p.indices!==undefined?item.doc.accessors[p.indices]?.count:pos.count)/3;
   if(stage==='wearable'){
    demand(node.skin!==undefined&&p.attributes.JOINTS_0!==undefined&&p.attributes.WEIGHTS_0!==undefined,
      'WEARABLE_NOT_SKINNED_NO_RIG_INHERITANCE');
    const jointAcc=item.doc.accessors[p.attributes.JOINTS_0],weightAcc=item.doc.accessors[p.attributes.WEIGHTS_0];
    demand(jointAcc.count===pos.count&&weightAcc.count===pos.count&&jointAcc.type==='VEC4'&&weightAcc.type==='VEC4',
      'WEARABLE_SKIN_VERTEX_CORRESPONDENCE_RED');
    for(let i=0;i<pos.count;i++){
     // Detect invalid bare vertex data; generated geometry must be real, finite 3D.
     const xyz=sampleAccessor(item,p.attributes.POSITION,i);
     const w=sampleAccessor(item,p.attributes.WEIGHTS_0,i);
     const ind=sampleAccessor(item,p.attributes.JOINTS_0,i);
     const sum=w.reduce((a,v)=>a+v,0);
     demand(xyz.every(Number.isFinite)&&Math.abs(sum-1)<.045&&w.every(t=>t>=0),
      'WEARABLE_BAD_POSITION_OR_SKIN_WEIGHT');
     demand(ind.every(v=>Number.isInteger(v)&&v>=0&&v<23),'WEARABLE_SKIN_INDEX_OUT_OF_RANGE');
     weightVertices++;
    }
   }
  }
 }
 demand(vertices>=250&&triangles>=150&&triangles<=maxTriangles,'WEARABLE_NO_SUBSTANTIVE_3D_OR_MOBILE_BUDGET');
 demand(meshNodes>=1&&meshNodes<=256,'WEARABLE_MESH_NODE_BUDGET');
 demand(untrustedJoint===0,'WEARABLE_WRONG_SKELETON_OR_BONE_NAMES');
 if(stage==='wearable')demand(missingSkin===0&&weightedMeshes===meshNodes,'WEARABLE_UNRIGGED_PARTS_REJECTED');
 const report={schema:'highfly.wearable-intake/v0.1',stage,sourceRig:'Rig_Medium',
  originalAnimationClips:src.doc.animations.length,sourceBoneCount:canonical.length,
  originalGameModelUntouched:true,genuineMeshInput:true,meshNodes,vertices,triangles:Math.round(triangles),
  weightedMeshes,weightVertices,unskinnedNodes:missingSkin,regionHints:tr,
  skinMatchesExistingSkeleton:stage==='wearable',imageOnly:false,
  autoGeneratedFromText:false,automaticFittingImplemented:false,
  artisticFidelityReviewed:false,collisionAndClippingReviewed:false,physicalAndroidReviewed:false,
  nextRequired:stage==='raw'?'segment geometry by armor slots, align to source native body, Blender weight transfer':'remap imported bone nodes onto the live ClaudeCraft skeleton, review full armor and art'};
 return report;
}
function args(argv){
 const q={};
 for(let i=0;i<argv.length;i++){
  const key=argv[i];demand(key.startsWith('--')&&argv[i+1]&&!argv[i+1].startsWith('--'),'CLI_PARAMETER_INVALID '+key);
  q[key.slice(2)]=argv[++i];
 }
 demand(q.source&&q.wearable&&q.out,'SOURCE_WEARABLE_OUT_REQUIRED');return q;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{const a=args(process.argv.slice(2));
  const r=validateFactoryGlb({source:a.source,wearable:a.wearable,stage:a.stage||'wearable',maxTriangles:Number(a['max-triangles']||65000)});
  writeFileSync(a.out,JSON.stringify(r,null,2));
  console.log('HIGHFLY_TRUE_3D_WEARABLE_INTAKE_GREEN',JSON.stringify(r));
 }catch(e){console.error('HIGHFLY_3D_WEARABLE_INTAKE_RED',e.message);process.exitCode=1;}
}
