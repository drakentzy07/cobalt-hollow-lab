/**
 * HIGHFLY: WORLD/REST ↔ ORIGINAL LOCAL invertibility audit (zero alteration).
 * Source (immutable) original ClaudeCraft Warrior, 23-bone meshes Knight + Paladin.
 * Mathematically proves we can transform EXISTING weighted vertices to true world/rest
 * and back, with no changes, before any sculpting.
 * Never changes the game, a GLB source, or any published Skin Lab route.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {loadModularBody} from '../scripts/skin_lab/extract_bind_reference.mjs';
import path from 'node:path';
const [source,output]=process.argv.slice(2);
if(!source||!output)throw Error('Usage: node skin-factory-core/audit_zero_rest_roundtrip_r02.mjs SOURCE.glb OUT.json');
const original=readFileSync(source);
if(original.subarray(0,4).toString()!=='glTF')throw Error('GLB_MUST_BE_REAL');
const src=await loadModularBody(path.resolve(source));
const nodes=src.getRoot().listNodes();
const gltfAnimations=src.getRoot().listAnimations();
if(gltfAnimations.length!==22)throw Error('RIG_22_CLIPS_REQUIRED');
const slots=nodes.filter(n=>/^Armor_(paladin|knight)_/.test(n.getName())&&n.getMesh());
const pals=slots.filter(n=>n.getName().startsWith('Armor_paladin_'));
const knights=slots.filter(n=>n.getName().startsWith('Armor_knight_'));
if(pals.length!==11||knights.length!==12)throw Error('EXPECTED_11_PALADIN_AND_12_KNIGHT_PIECES');
const mul=(A,B)=>{
 const C=new Array(16).fill(0);
 for(let r=0;r<4;r++)for(let c=0;c<4;c++)for(let k=0;k<4;k++)
   C[c*4+r]+=A[k*4+r]*B[c*4+k];
 return C;
};
const apply=(m,p)=>{
 const x=p[0],y=p[1],z=p[2];
 const w=m[3]*x+m[7]*y+m[11]*z+m[15];
 if(Math.abs(w)<1e-10)throw Error('PROJECTIVE_W_ZERO');
 return [(m[0]*x+m[4]*y+m[8]*z+m[12])/w,
         (m[1]*x+m[5]*y+m[9]*z+m[13])/w,
         (m[2]*x+m[6]*y+m[10]*z+m[14])/w];
};
const invert=(m)=>{
 // inverse of an arbitrary 4x4 matrix via Gauss-Jordan pivoting
 const a=Array.from({length:4},(_,r)=>[
   ...Array.from({length:4},(_,c)=>m[c*4+r]),
   ...Array.from({length:4},(_,c)=>r===c?1:0)
 ]);
 for(let c=0;c<4;c++){
  let pivot=c;
  for(let r=c+1;r<4;r++)if(Math.abs(a[r][c])>Math.abs(a[pivot][c]))pivot=r;
  if(Math.abs(a[pivot][c])<1e-11)throw Error('NEAR_SINGULAR_WEIGHTED_BIND_AT_AXIS_'+c);
  [a[pivot],a[c]]=[a[c],a[pivot]];
  const t=a[c][c];for(let k=0;k<8;k++)a[c][k]/=t;
  for(let r=0;r<4;r++)if(r!==c){
   const q=a[r][c];for(let k=0;k<8;k++)a[r][k]-=q*a[c][k];
  }
 }
 return Array.from({length:16},(_,i)=>a[i%4][4+Math.floor(i/4)]);
};
let total=0,maxLocalErr=0,sumSq=0,minEffective=-Infinity,maxEffective=Infinity;
const parts=[];
for(const node of slots){
 const skin=node.getSkin();
 if(!skin||skin.listJoints().length!==23)throw Error('NATIVE_23_BONE_SKIN_EXPECTED '+node.getName());
 const inv=skin.getInverseBindMatrices(); if(inv.getCount()!==23)throw Error('IBM_LIST_BAD');
 const transforms=skin.listJoints().map((joint,j)=>mul(joint.getWorldMatrix(),inv.getElement(j,new Array(16))));
 let vertices=0,error=0;
 for(const prim of node.getMesh().listPrimitives()){
  const pos=prim.getAttribute('POSITION'),jts=prim.getAttribute('JOINTS_0'),
        ws=prim.getAttribute('WEIGHTS_0');
  if(!pos||!jts||!ws||pos.getCount()!==jts.getCount()||pos.getCount()!==ws.getCount())
    throw Error('INVALID_SOURCE_ATTRIBUTE_BUNDLE '+node.getName());
  const p=[0,0,0],ji=[0,0,0,0],wt=[0,0,0,0];
  for(let v=0;v<pos.getCount();v++){
   pos.getElement(v,p);jts.getElement(v,ji);ws.getElement(v,wt);
   const mass=wt.reduce((a,b)=>a+b,0);
   if(mass<.9||mass>1.1)throw Error('WEIGHTS_NOT_NORMALIZED '+node.getName()+' '+v+' '+mass);
   const M=new Array(16).fill(0);
   for(let k=0;k<4;k++){
    if(ji[k]<0||ji[k]>=23)throw Error('JOINT_OUT_OF_RANGE');
    for(let i=0;i<16;i++)M[i]+=transforms[ji[k]][i]*wt[k]/mass;
   }
   const world=apply(M,p);
   const again=apply(invert(M),world);
   const dist=Math.hypot(again[0]-p[0],again[1]-p[1],again[2]-p[2]);
   error=Math.max(error,dist);maxLocalErr=Math.max(maxLocalErr,dist);sumSq+=dist*dist;total++;vertices++;
  }
 }
 parts.push({name:node.getName(),vertices,maximumAbsoluteRoundTripError:error});
}
if(total<9500)throw Error('INCOMPLETE_SOURCE_VERTICES '+total);
if(maxLocalErr>1e-5)throw Error('INACCURATE_WORLD_LOCAL_ROUNDTRIP '+maxLocalErr);
const proof={
 schema:'highfly.source.geometry-roundtrip/2',sourceBytes:original.length,
 sourceOriginalImmutable:true,armorFamilies:['paladin','knight'],
 nativeArmorNodes:slots.length,paladinNodes:pals.length,knightNodes:knights.length,
 originalRigBones:23,originalAnimationClips:22,
 vertexCountChecked:total,
 maxReconstructionPositionError:maxLocalErr,
 rmsReconstructionPositionError:Math.sqrt(sumSq/total),
 pass:true,kind:'rest pose mathematical zero-change coordinate roundtrip ONLY',
 futureCaution:'Identity pass does NOT prove edited skin quality or any animated clearance. New shapes need weighted world-rest deformation with exact inverse source transformations, preservation of normals, UVs, bindings and full animated screenshot review.',
 parts
};
writeFileSync(path.resolve(output),JSON.stringify(proof,null,2));
console.log('HIGHFLY_11_PALADIN_12_KNIGHT_REAL_REST_WORLD_LOCAL_ROUNDTRIP_GREEN=1');
console.log('HIGHFLY_ROUNDTRIP_CHECKED_VERTICES='+total);
console.log('HIGHFLY_ROUNDTRIP_MAX_LOCAL_POSITION_ERROR='+maxLocalErr);
