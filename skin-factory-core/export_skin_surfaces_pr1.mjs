/**
 * HIGHFLY PR1: exact original rest pose surfaces of the naked Warrior and
 * each Paladin armor slot after matrix-weighted skinning.
 * Python trimesh/rTree computes point-to-triangle clearance PROXY.
 * No user body dimension guessed; no altered mesh; no published Pages.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {loadModularBody} from '../scripts/skin_lab/extract_bind_reference.mjs';
const [source,out]=process.argv.slice(2);
if(!source||!out)throw Error('Usage export_skin_surfaces_pr1.mjs warrior.glb surface.json');
const raw=readFileSync(source);
if(raw.toString('ascii',0,4)!=='glTF'||raw.length!==3477500)throw Error('NOT_ORIGINAL_3477500_BYTE_WARRIOR');
const doc=await loadModularBody(resolve(source));
if(doc.getRoot().listAnimations().length!==22)throw Error('NOT_ORIGINAL_22_CLIPS');
const wanted=['M_Head','M_Torso','M_ArmL','M_ArmR','M_HandL','M_HandR',
 'M_LegL','M_LegR','M_FootL','M_FootR','M_Loin',
 'Armor_paladin_Head','Armor_paladin_Chest','Armor_paladin_Back',
 'Armor_paladin_ArmL','Armor_paladin_ArmR','Armor_paladin_HandL',
 'Armor_paladin_HandR','Armor_paladin_LegL','Armor_paladin_LegR',
 'Armor_paladin_FootL','Armor_paladin_FootR'];
const map=new Map(doc.getRoot().listNodes().map(n=>[n.getName(),n]));
const mul=(A,B)=>{
 let C=new Array(16).fill(0);
 for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)
  C[4*c+r]+=A[4*k+r]*B[4*c+k];
 return C;
};
const data={schema:'highfly.pr1.authentic-claudecraft-rest-surfaces/1',
 originalBytes:raw.length,originalClips:22,originalBones:23,
 kind:'exact source rest pose skinned triangle meshes',
 warning:'No physical centimetres, no guaranteed signed interior, no clip-wide collision proof.',
 surfaces:{}};
for(const name of wanted){
 const node=map.get(name);
 if(!node?.getMesh()||!node.getSkin())throw Error('NATIVE_SURFACE_NOT_FOUND '+name);
 const skin=node.getSkin(),ibm=skin.getInverseBindMatrices();
 if(skin.listJoints().length!==23||ibm.getCount()!==23)throw Error('NOT_SAME_23_JOINTS '+name);
 const transforms=skin.listJoints().map((b,i)=>mul(b.getWorldMatrix(),ibm.getElement(i,new Array(16))));
 const result={vertices:[],faces:[],submeshes:0};
 for(const prim of node.getMesh().listPrimitives()){
  const pos=prim.getAttribute('POSITION'),si=prim.getAttribute('JOINTS_0'),sw=prim.getAttribute('WEIGHTS_0');
  if(!pos||!si||!sw||pos.getCount()!==si.getCount()||pos.getCount()!==sw.getCount())
   throw Error('MISSING_SOURCE_SKIN_ATTRIBUTES '+name);
  const offset=result.vertices.length, p=[0,0,0],j=[0,0,0,0],w=[0,0,0,0];
  for(let k=0;k<pos.getCount();k++){
   pos.getElement(k,p);si.getElement(k,j);sw.getElement(k,w);
   let sum=w.reduce((a,b)=>a+b,0),val=[0,0,0];
   if(sum<.9||sum>1.1)throw Error('BAD_SOURCE_WEIGHTS '+name);
   for(let q=0;q<4;q++){
    const alpha=w[q]/sum;if(alpha<=1e-9)continue;
    const m=transforms[j[q]],norm=m[3]*p[0]+m[7]*p[1]+m[11]*p[2]+m[15];
    if(Math.abs(norm)<1e-9)throw Error('BAD_W_COORDINATE');
    for(let z=0;z<3;z++)val[z]+=alpha*(m[z]*p[0]+m[z+4]*p[1]+m[z+8]*p[2]+m[z+12])/norm;
   }
   if(val.some(x=>!Number.isFinite(x)))throw Error('NONFINITE_REST_VERTEX '+name);
   result.vertices.push(val);
  }
  const idx=prim.getIndices()?.getArray();
  const mode=prim.getMode();
  if(mode!==4)throw Error('NON_TRIANGLES_PRIMITIVE_MODE_'+mode+'_IN_'+name);
  if(idx){
   if(idx.length%3)throw Error('ODD_TRIANGLE_INDICES '+name);
   for(let k=0;k<idx.length;k+=3)result.faces.push([offset+idx[k],offset+idx[k+1],offset+idx[k+2]]);
  }else{
   if(pos.getCount()%3)throw Error('ODD_TRIANGLE_VERTEX_COUNT '+name);
   for(let k=0;k<pos.getCount();k+=3)result.faces.push([offset+k,offset+k+1,offset+k+2]);
  }
  result.submeshes++;
 }
 if(result.faces.length<3)throw Error('EMPTY_TRIANGLE_SURFACE '+name);
 data.surfaces[name]=result;
 console.log('REAL_PR1_SURFACE '+name+' vertices='+result.vertices.length+' triangles='+result.faces.length);
}
if(Object.keys(data.surfaces).length!==22)throw Error('PR1_22_ORIGINAL_BODY_AND_PALADIN_GROUPS_NOT_FOUND');
writeFileSync(resolve(out),JSON.stringify(data));
console.log('HIGHFLY_PR1_ALL_SOURCE_TRIANGLE_SURFACES_EXPORTED_GREEN=1');
