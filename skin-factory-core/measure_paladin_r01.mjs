/**
 * HIGHFLY: real original Warrior/Paladin/Knight geometry fit audit.
 * Loads OFFICIAL frozen ClaudeCraft GLB, decodes EXT_meshopt and KHR_mesh_quantization
 * using repo's existing skin_lab loader. Read-only input, zero invented sizing.
 * Units are original GLB scene units; not inferred centimetres.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {loadModularBody} from '../scripts/skin_lab/extract_bind_reference.mjs';

const [source,out]=process.argv.slice(2);
if(!source||!out)throw Error('USAGE node skin-factory-core/measure_paladin_r01.mjs SOURCE.glb REPORT.json');
const glb=readFileSync(source);
if(glb.toString('ascii',0,4)!=='glTF')throw Error('SOURCE_MUST_BE_NATIVE_GLB');
const original=JSON.parse(glb.subarray(20,20+glb.readUInt32LE(12)).toString());
if(original.animations?.length!==22)throw Error('ORIGINAL_22_ANIMATIONS_REQUIRED');
const realNames=new Set(original.nodes.map(n=>n.name));
const expected=['M_Head','M_Torso','M_ArmL','M_ArmR','M_HandL','M_HandR','M_LegL','M_LegR','M_FootL','M_FootR','M_Loin'];
const paladin=['Head','Chest','Back','ArmL','ArmR','HandL','HandR','LegL','LegR','FootL','FootR'].map(x=>'Armor_paladin_'+x);
const knight=['Head','Head1','Chest','Back','ArmL','ArmR','HandL','HandR','LegL','LegR','FootL','FootR'].map(x=>'Armor_knight_'+x);
for(const n of [...expected,...paladin,...knight])if(!realNames.has(n))throw Error('NATIVE_PART_MISSING:'+n);
const report={schema:'highfly.paladin-exact-geometry/r01',sceneUnits:"original GLB model units (not guaranteed physical metres)",inputBytes:glb.length,
  nativeMeshes:original.meshes.length, nativeMeshNodes:original.nodes.filter(n=>n.mesh!==undefined).length,
  animationClips:original.animations.length,paladinCount:paladin.length,knightCount:knight.length,
  skinJointSizes:[...new Set((original.skins||[]).map(s=>s.joints.length))],
  notes:[
    'BBoxes are geometric EXTERNAL envelopes of mesh vertices after real joint-world and inverseBindMatrix skinning in the source rest pose, in the source coordinate system. Not clothing interior dimensions or proof of collision-free fit.',
    'Paladin and Knight parts exist within one native warrior_modular.glb; they are NOT assembled armor separate from Warrior.',
    'Every native part is skinned to 23 Rig_Medium joints; use original mesh as a reusable deformation/weight donor, not a new rig.',
    'Interior negative space, plate thickness, topology/holes and animation clearance require per-surface analysis and movement QA; never infer from a bounding box.'
  ],parts:{},groups:{}};
const doc=await loadModularBody(resolve(source));
if(doc.getRoot().listAnimations().length!==22)throw Error('LOADER_DID_NOT_PRESERVE_22_CLIPS');
const nodes=doc.getRoot().listNodes();
const index=new Map(nodes.map(n=>[n.getName(),n]));
function partBounds(name){
 const node=index.get(name);
 if(!node?.getMesh())throw Error('NO_NODE_MESH:'+name);
 const primitives=node.getMesh().listPrimitives();
 const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 let vertices=0,triangles=0;
 const mats=new Set();const jointNames=node.getSkin()?.listJoints().map(x=>x.getName())||[];
 if(jointNames.length!==23)throw Error('NOT_23_BONES '+name);
 // IMPORTANT: native accessor POSITION values are *per-mesh normalized*.
 // Each native Skin has 23 DIFFERENT inverse bind matrices encoding original
 // mesh-specific dequantization + geometric placement. A raw AABB is invalid.
 // Reconstruct actual rest skinned coords: Sum weights * worldJoint * IBM * pos.
 const skin=node.getSkin();
 const ibmAccessor=skin.getInverseBindMatrices();
 if(!ibmAccessor||ibmAccessor.getCount()!==23)throw Error('MISSING_23_SKIN_BIND_MATRICES '+name);
 const joints=skin.listJoints().map(x=>x.getWorldMatrix());
 const ibms=[...Array(23)].map((_,i)=>ibmAccessor.getElement(i,new Array(16)));
 const mul=(A,B)=>{let C=new Array(16).fill(0);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)C[4*c+r]+=A[4*k+r]*B[4*c+k];return C;};
 const restMatrices=joints.map((m,i)=>mul(m,ibms[i]));
 const applied=[0,0,0,0],position=[0,0,0],jointIDs=[0,0,0,0],weights=[0,0,0,0];
 for(const prim of primitives){
  const pos=prim.getAttribute('POSITION'); if(!pos)throw Error('POSITION_MISSING '+name);
  const jAtt=prim.getAttribute('JOINTS_0'), wAtt=prim.getAttribute('WEIGHTS_0');
  if(!jAtt||!wAtt)throw Error('NO_REAL_WEIGHTED_MESH '+name);
  const material=prim.getMaterial();if(material)mats.add(material.getName());
  const count=pos.getCount();
  for(let j=0;j<count;j++){
   pos.getElement(j,position);
   jAtt.getElement(j,jointIDs);wAtt.getElement(j,weights);
   const v=[0,0,0],norm=weights.reduce((a,b)=>a+b,0);
   if(norm<.9||norm>1.1)throw Error('BAD_WEIGHT_SUM '+name+' '+norm);
   for(let q=0;q<4;q++){
    const weight=weights[q]/norm;if(weight<=1e-8)continue;
    const id=jointIDs[q];if(id>=23||id<0)throw Error('SKIN_JOINT_INDEX_OUT_OF_RANGE');
    const m=restMatrices[id];
    const x=position[0],y=position[1],z=position[2],w=m[3]*x+m[7]*y+m[11]*z+m[15];
    for(let k=0;k<3;k++)v[k]+=weight*(m[k]*x+m[k+4]*y+m[k+8]*z+m[k+12])/w;
   }
   for(let k=0;k<3;k++){
    if(!Number.isFinite(v[k]))throw Error('NON_FINITE_REST_SKIN_VERTEX '+name);
    lo[k]=Math.min(lo[k],v[k]);hi[k]=Math.max(hi[k],v[k]);
   }
  }
  vertices+=count;
  triangles+=((prim.getIndices()?.getCount()??count)/3);
 }
 if(vertices<3)throw Error('NO_GEOMETRY:'+name);
 const round=x=>Number(x.toFixed(5));
 return {vertices,triangles:Math.round(triangles),primitives:primitives.length,
  materials:[...mats],jointCount:jointNames.length,
  min:lo.map(round),max:hi.map(round),
  dimensions:lo.map((v,i)=>round(hi[i]-v)),
  center:lo.map((v,i)=>round((hi[i]+v)/2))};
}
for(const name of [...expected,...paladin,...knight])
  report.parts[name]=partBounds(name);
function combined(parts){
 let lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity],vertices=0,triangles=0;
 for(const p of parts){
  const b=report.parts[p];vertices+=b.vertices;triangles+=b.triangles;
  for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],b.min[k]);hi[k]=Math.max(hi[k],b.max[k]);}
 }
 return {pieces:parts.length,vertices,triangles,min:lo,max:hi,dimensions:lo.map((v,i)=>Number((hi[i]-v).toFixed(5)))};
}
report.groups={body:combined(expected),paladin:combined(paladin),knight:combined(knight)};
const matches={Head:'M_Head',Chest:'M_Torso',Back:'M_Torso',
  ArmL:'M_ArmL',ArmR:'M_ArmR',HandL:'M_HandL',HandR:'M_HandR',
  LegL:'M_LegL',LegR:'M_LegR',FootL:'M_FootL',FootR:'M_FootR'};
report.nativePairComparisons={};
for(const suffix of Object.keys(matches)){
 const a=report.parts['Armor_paladin_'+suffix],b=report.parts[matches[suffix]];
 report.nativePairComparisons[suffix]={
  paladin:'Armor_paladin_'+suffix,body:matches[suffix],
  armorExternalAabb:a.dimensions,bodyExternalAabb:b.dimensions,
  boundingWidthDifference:+(a.dimensions[0]-b.dimensions[0]).toFixed(5),
  boundingDepthDifference:+(a.dimensions[2]-b.dimensions[2]).toFixed(5),
  warning:'AABB differences are not measured interior clearances or armor thickness.'
 };
}
writeFileSync(out,JSON.stringify(report,null,2));
console.log('HIGHFLY_PALADIN_NATIVE_ACTUAL_DIMENSIONS_GREEN');
console.log('HIGHFLY_PALADIN_DIMENSIONS_JSON_BEGIN');
console.log(JSON.stringify({groups:report.groups,parts:Object.fromEntries(paladin.map(x=>[x,report.parts[x]])),pairComparisons:report.nativePairComparisons},null,2));
console.log('HIGHFLY_PALADIN_DIMENSIONS_JSON_END');
