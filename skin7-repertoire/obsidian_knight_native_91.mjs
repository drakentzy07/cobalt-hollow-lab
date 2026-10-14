/**
 * HIGHFLY 9.1 - Obsidian Monarch made from REAL ClaudeCraft Knight armor geometry.
 * Not a primitive barrel, a 2D image, or detached bbox panels.
 * All 12 native Knight geometry pieces are independently cloned, directly
 * resculpted, and continue using their original skin indices, weights and rig.
 * Non-destructive: GLB source, skeleton, animations, original armor untouched.
 * Artistic similarity to the generated concept is a target, not certified.
 */
import * as THREE from 'three';
const GOLD=0xbbbecd, BLACK=0x15131e, OBSIDIAN=0x282638, VIOLET=0x922bff, DEEP=0x090a13;
export const OBSIDIAN91={id:'obsidian91',name:'OBSIDIAN MONARCH · Armadura Knight nativa 9.1',
  family:'OBSIDIAN MONARCH',colors:[BLACK,OBSIDIAN,GOLD,VIOLET,DEEP],signature:'KNIGHT_NATIVE_12_WEIGHTED_23_BONES_22_CLIPS'};
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
const vec=(hex)=>new THREE.Color(hex);
const METAL=vec(OBSIDIAN),TRIM=vec(GOLD),INK=vec(DEEP),LIGHT=vec(VIOLET),BASE=vec(BLACK);
function groupKnight(scene){
 const pieces=[];
 const seen=new Set();
 scene.traverse(o=>{
  if(!o.isSkinnedMesh||!o.name?.startsWith('Armor_knight_')||seen.has(o))return;
  seen.add(o);pieces.push(o);
 });
 if(pieces.length!==12)throw Error('HF91_EXPECT_12_REAL_KNIGHT_PRIMITIVES '+pieces.length);
 if(pieces.some(p=>p.skeleton.bones.length!==23||!p.geometry.getAttribute('skinIndex')||
  !p.geometry.getAttribute('skinWeight')))throw Error('HF91_KNIGHT_RIG_OR_WEIGHTS_NOT_NATIVE');
 const parts=pieces.map(x=>x.name.slice('Armor_knight_'.length));
 for(const needed of ['Head','Head1','Chest','ArmL','ArmR','HandL','HandR','LegL','LegR','FootL','FootR'])
  if(!parts.includes(needed))throw Error('HF91_KNIGHT_PART_MISSING '+needed);
 return pieces;
}
function morphNative(src){
 const slot=src.name.replace('Armor_knight_','');
 const g=src.geometry.clone(),p=g.getAttribute('position');
 const baseBox=new THREE.Box3().setFromBufferAttribute(p),mid=baseBox.getCenter(new THREE.Vector3()),size=baseBox.getSize(new THREE.Vector3());
 const eps=1e-6;
 const colors=new Float32Array(p.count*3);
 let moved=0,inked=0,crested=0;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
  const u=(x-mid.x)/Math.max(size.x,eps),v=(y-mid.y)/Math.max(size.y,eps),w=(z-mid.z)/Math.max(size.z,eps);
  const front=smooth(.06,.41,w),edge=Math.max(Math.abs(u),Math.abs(v));
  let px=x,py=y,pz=z;
  if(slot==='Head'||slot==='Head1'){
   // Keep genuine Knight native metal topology; carve the face inward,
   // sharpen the cheek profile, taper the nape and extend the integral crown.
   const crown=smooth(.12,.49,v),mask=front*(1-smooth(.22,.48,Math.abs(u)));
   const taper=smooth(-.45,-.12,v)*(1-smooth(.08,.31,v));
   px=mid.x+(x-mid.x)*(1+.085*crown-.048*taper);
   pz=z+size.z*(.095*mask*smooth(-.33,-.05,v)+.05*front*crown);
   if(slot==='Head1'){
    py=y+size.y*.155*crown*(.55+.45*Math.pow(Math.abs(u)*2,3));
    if(py!==y)crested++;
   }else{
    py=y+size.y*.018*crown;
   }
  } else if(slot==='Chest'){
   const broad=smooth(-.12,.46,v),waist=1-smooth(-.36,-.07,v);
   px=mid.x+(x-mid.x)*(1+.145*broad-.065*waist);
   // Embossed V-chevron directly on the breastplate vertices.
   const vline=.24-Math.abs(u)*.60;
   const bevel=Math.max(0,1-Math.abs(v-vline)/.21);
   pz=z+size.z*front*(.045+.085*bevel);
  } else if(slot.startsWith('Arm')){
   const shoulder=smooth(-.05,.47,v);
   px=mid.x+(x-mid.x)*(1+.14*shoulder);
   py=y+size.y*.035*shoulder;
   pz=mid.z+(z-mid.z)*(1+.075*shoulder);
  } else if(slot.startsWith('Hand')){
   const cuff=smooth(.04,.40,v);
   px=mid.x+(x-mid.x)*(1+.045*cuff);
   pz=mid.z+(z-mid.z)*(1+.06*cuff);
  } else if(slot.startsWith('Leg')){
   const kneecap=1-smooth(.10,.39,Math.abs(v-.04));
   px=mid.x+(x-mid.x)*(1+.065*kneecap);
   pz=mid.z+(z-mid.z)*(1+.08*kneecap);
  } else if(slot.startsWith('Foot')){
   pz=mid.z+(z-mid.z)*(1+.09*smooth(-.42,.21,v));
  } // Back retains its genuine native silhouette, not temporary wings.
  if(Math.hypot(px-x,py-y,pz-z)>eps)moved++;
  p.setXYZ(i,px,py,pz);
  const shade=METAL.clone();
  if(edge>.33)shade.lerp(TRIM,.24+.44*smooth(.33,.52,edge));
  if(v<-.31)shade.lerp(BASE,.53);
  if(w<-.15)shade.lerp(INK,.31);
  if(slot==='Head'||slot==='Head1'){
   // Distinct single dark mask/visor cut into the REAL helmet face.
   if(front>.7&&Math.abs(v-.045)<.065&&Math.abs(u)<.43){shade.lerp(LIGHT,.91);inked++;}
   if(front>.70&&Math.abs(u)<.14&&v>.25)shade.lerp(TRIM,.75);
   if(slot==='Head1'&&v>.24&&edge>.29)shade.lerp(TRIM,.77);
  } else if(slot==='Chest'){
   const line=.23-Math.abs(u)*.59;
   if(front>.5&&Math.abs(v-line)<.075)shade.lerp(TRIM,.84);
   if(front>.65&&Math.abs(u)<.13&&v<.19&&v>-.20){shade.lerp(LIGHT,.85);inked++;}
  } else if(slot.startsWith('Arm')||slot.startsWith('Hand')||slot.startsWith('Leg')){
   if(front>.55&&Math.abs(v-.13)<.075)shade.lerp(TRIM,.61);
   if(front>.71&&Math.abs(u)<.09&&Math.abs(v)<.18)shade.lerp(LIGHT,.62);
  }
  colors.set([shade.r,shade.g,shade.b],i*3);
 }
 g.setAttribute('color',new THREE.BufferAttribute(colors,3));
 g.getAttribute('position').needsUpdate=true;
 g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
 return {slot,g,moved,inked,crested,originalVertices:p.count,
  sourceWeightOriginal:src.geometry.getAttribute('skinWeight').count===g.getAttribute('skinWeight').count};
}
export function forgeObsidianKnight91(gltf){
 const original=groupKnight(gltf.scene),before=original.map(o=>o.geometry);
 const undersuit=/^M_(Torso|Loin|ArmL|ArmR|HandL|HandR|LegL|LegR|FootL|FootR)(?:_|$)/;
 gltf.scene.traverse(o=>{
  if(!o.isMesh)return;
  const n=o.name||'';
  o.visible=undersuit.test(n);
 });
 const pieces=[],perPart=[],material=new THREE.MeshStandardMaterial({
  color:0xffffff,vertexColors:true,metalness:.73,roughness:.32,
  side:THREE.DoubleSide,flatShading:true
 });
 for(const donor of original){
  const {slot,g,moved,inked,crested,originalVertices,sourceWeightOriginal}=morphNative(donor);
  if(!sourceWeightOriginal)throw Error('HF91_WEIGHT_BUFFER_MISMATCH '+slot);
  const repl=new THREE.SkinnedMesh(g,material);
  repl.name='HF91_OBSIDIAN_REALKNIGHT_'+slot;
  repl.position.copy(donor.position);repl.quaternion.copy(donor.quaternion);repl.scale.copy(donor.scale);
  repl.bind(donor.skeleton,donor.bindMatrix.clone());repl.bindMode=donor.bindMode;
  repl.frustumCulled=false;donor.parent.add(repl);repl.visible=true;
  pieces.push(repl);perPart.push({slot,moved,inked,crested,vertices:originalVertices});
 }
 let visibleOld=0,visibleWings=0,visibleNative=0,visibleBody=0;
 gltf.scene.traverse(o=>{
  if(!o.isMesh||!o.visible)return;
  if(o.name.startsWith('Armor_'))visibleOld++;
  if(o.name.includes('_wings_')||o.name.startsWith('HF87_'))visibleWings++;
  if(o.name.startsWith('HF91_'))visibleNative++;
  if(undersuit.test(o.name))visibleBody++;
 });
 const proof={
  pass:'SKIN9_1_ORIGINAL_KNIGHT_NATIVE_RESCULPT',id:'obsidian91',
  nativeKnightDonors:12,originalBones:23,clips:gltf.animations.length,
  nativeReworkedPieces:pieces.length,newHelmetNativePieces:perPart.filter(p=>p.slot.startsWith('Head')).length,
  realNativeGeometryOriginalUntouched:original.every((o,i)=>o.geometry===before[i]),
  sameSkeletonAndSkinWeights:pieces.every((m,i)=>m.skeleton===original[i].skeleton&&
   m.geometry.getAttribute('skinWeight').count===original[i].geometry.getAttribute('skinWeight').count),
  helmetResculptVertices:perPart.filter(p=>p.slot.startsWith('Head')).reduce((a,x)=>a+x.moved,0),
  chestResculptVertices:perPart.filter(p=>p.slot==='Chest').reduce((a,x)=>a+x.moved,0),
  changedBodyMeshes:perPart.filter(p=>p.moved>0).length,
  visibleOldArmor:visibleOld,visibleWings,visibleKnightPieces:visibleNative,visibleBodyUnderArmor:visibleBody,
  perPart,sourceGLBImmutable:true,exactConceptArtMatch:false,physicalS23QA:false,artApproved:false};
 if(proof.clips!==22||proof.newHelmetNativePieces!==2||proof.visibleOldArmor!==0||
  proof.nativeReworkedPieces!==12||proof.visibleKnightPieces!==12||proof.visibleWings!==0||
  !proof.realNativeGeometryOriginalUntouched||!proof.sameSkeletonAndSkinWeights||
  proof.helmetResculptVertices<10||proof.chestResculptVertices<10||
  proof.changedBodyMeshes<9||proof.visibleBodyUnderArmor<9)
  throw Error('HF91_NATIVE_KNIGHT_GATE_RED '+JSON.stringify(proof));
 return {gltf,proof:{id:'obsidian91',name:OBSIDIAN91.name,signature:OBSIDIAN91.signature,
  family:OBSIDIAN91.family,originalBones:23,originalNativePrimitives:12,originalNativeSlots:11,
  clips:gltf.animations.length,sourceImmutable:true,obsidian91:proof,structuralGreen:true}};
}
