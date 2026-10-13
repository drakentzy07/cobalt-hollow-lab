// HIGHFLY SKIN 7.4 — Canonical Native Armor Bridge, 1st real art pilot
// Source of geometry+skinning: unchanged ClaudeCraft Armor_paladin_* originals.
// Source of NEW geometry: deterministic faceted crystal, crest, visor and spike components.
// The imported SupaVoxel is an art reference, NOT a naked mesh fitted over the Hunter.
import * as THREE from 'three';

export const ARMOR_BRIDGE_RECIPE = Object.freeze({
 id:'highfly-violet-crystal-paladin-v1',
 title:'PALADIN · OBSIDIAN VIOLET',
 donor:'Armor_paladin_',
 canonicalPieces:{
  helmet:'Head',torso:'Chest',back:'Back',
  shoulderLeft:'ArmL',shoulderRight:'ArmR',
  gloveLeft:'HandL',gloveRight:'HandR',
  legLeft:'LegL',legRight:'LegR',
  bootLeft:'FootL',bootRight:'FootR'
 },
 colors:{metal:0x11131f,trim:0xc6c4db,crystal:0x8123fa,liner:0x231438,cape:0x28154c},
 version:1
});
const NAMES=new Set(Object.values(ARMOR_BRIDGE_RECIPE.canonicalPieces));
function nativeName(o,prefix='Armor_paladin_'){return o.name?.startsWith(prefix) ? o.name.slice(prefix.length) : null;}
function makeMaterial(color, metalness=.6, roughness=.28, emissive=0x000000){
 return new THREE.MeshStandardMaterial({
  color,metalness,roughness,emissive,emissiveIntensity:emissive?0.55:0,
  side:THREE.DoubleSide
 });
}
function localBounds(donor){
 const attr=donor.geometry?.getAttribute('position');
 if(!attr || attr.count<3)throw Error('Slot sin vértices: '+donor.name);
 const b=new THREE.Box3().setFromBufferAttribute(attr);
 if(![...b.min,...b.max].every(Number.isFinite))throw Error('Bounds inválidos: '+donor.name);
 const size=b.getSize(new THREE.Vector3());
 if(Math.max(size.x,size.y,size.z)<.00001)throw Error('Slot degenerado: '+donor.name);
 return {b,size,center:b.getCenter(new THREE.Vector3())};
}
function reformSurface(donor,slot){
 const p=donor.geometry.getAttribute('position');
 const {b,size,center}=localBounds(donor);
 // Reshape REAL donor geometry; only positions/normals change, original JOINTS_0,
 // WEIGHTS_0, inverse bind matrices, skeleton and animation data stay byte-identical.
 donor.geometry=donor.geometry.clone();
 const attr=donor.geometry.getAttribute('position');
 const n=attr.count;
 let moved=0;
 for(let i=0;i<n;i++){
  const x=attr.getX(i),y=attr.getY(i),z=attr.getZ(i);
  const nx=(x-center.x)/Math.max(size.x*.5,1e-5);
  const ny=(y-center.y)/Math.max(size.y*.5,1e-5);
  const nz=(z-center.z)/Math.max(size.z*.5,1e-5);
  let X=x,Y=y,Z=z;
  if(slot==='Head'){
   const jaw=Math.max(0,-ny);
   const upper=Math.max(0,ny);
   X+=(x-center.x)*(.065*upper+.055*jaw);
   Z+=(z-center.z)*(.075*upper+.08*jaw);
   Y+=size.y*.018*Math.max(0,ny);
  }else if(slot==='Chest'){
   const cap=Math.max(0,1-Math.abs(ny)*.64);
   X+=(x-center.x)*.09*cap;
   Z+=(z-center.z)*.11*cap;
  }else if(slot==='ArmL'||slot==='ArmR'){
   const cap=Math.max(0,(ny+.45));
   X+=(x-center.x)*(.12*cap);
   Y+=size.y*.025*cap;
   Z+=(z-center.z)*.07*cap;
  }else if(slot==='LegL'||slot==='LegR'){
   X+=(x-center.x)*.07*Math.max(0,ny+.25);
   Z+=(z-center.z)*.035;
  }else if(slot.startsWith('Foot')){
   Z+=(z-center.z)*.11; X+=(x-center.x)*.045;
  }else if(slot==='Back'){
   Z+=(z-center.z)*.04;
  }
  if(Math.abs(X-x)+Math.abs(Y-y)+Math.abs(Z-z)>1e-8)moved++;
  attr.setXYZ(i,X,Y,Z);
 }
 attr.needsUpdate=true;
 donor.geometry.computeVertexNormals();
 donor.geometry.computeBoundingBox();
 donor.geometry.computeBoundingSphere();
 donor.frustumCulled=false;
 return moved;
}
function jewelGeometry(radius, height, depth, x,y,z){
 const g=new THREE.OctahedronGeometry(1,0);
 g.scale(radius,height,depth).translate(x,y,z);
 g.computeVertexNormals();return g;
}
function flareGeometry(radius,height,x,y,z,side=0){
 const g=new THREE.ConeGeometry(radius,height,5,1);
 g.rotateZ(side*.40);g.translate(x,y,z);g.computeVertexNormals();return g;
}
function trimGeometry(x,y,z,w,h,d){
 const g=new THREE.BoxGeometry(w,h,d);g.translate(x,y,z);return g;
}
function nearestNativeSkin(donor,g){
 const src=donor.geometry.getAttribute('position');
 const si=donor.geometry.getAttribute('skinIndex'),sw=donor.geometry.getAttribute('skinWeight');
 if(!si||!sw)throw Error('NO_NATIVE_WEIGHTS: '+donor.name);
 const dst=g.getAttribute('position'),ji=new Uint16Array(dst.count*4),jw=new Float32Array(dst.count*4);
 for(let i=0;i<dst.count;i++){
  const x=dst.getX(i),y=dst.getY(i),z=dst.getZ(i);
  let best=0,bestD=Infinity;
  for(let j=0;j<src.count;j++){
   const dx=x-src.getX(j),dy=y-src.getY(j),dz=z-src.getZ(j);
   const dist=dx*dx+dy*dy+dz*dz;
   if(dist<bestD){bestD=dist;best=j;}
  }
  let sum=0;
  for(let k=0;k<4;k++){
   ji[i*4+k]=si.getComponent(best,k);
   jw[i*4+k]=sw.getComponent(best,k);
   sum+=jw[i*4+k];
  }
  if(sum>.00001)for(let k=0;k<4;k++)jw[i*4+k]/=sum;
  else {ji[i*4]=0;jw[i*4]=1;}
 }
 g.setAttribute('skinIndex',new THREE.BufferAttribute(ji,4));
 g.setAttribute('skinWeight',new THREE.BufferAttribute(jw,4));
 g.computeBoundingSphere();
 return g;
}
function addArt(donor,slot,material,geometry,name,registry){
 const result=new THREE.SkinnedMesh(nearestNativeSkin(donor,geometry),material);
 result.name='HIGHFLY_VIOLET_'+slot+'_'+name;
 result.bind(donor.skeleton,donor.bindMatrix.clone());
 result.frustumCulled=false;
 donor.parent.add(result);
 registry.push(result);
 return result;
}
function artisanDetail(donor,slot,materials,registry){
 const {b,size:s,center:c}=localBounds(donor);
 const z=b.max.z+s.z*.075, x=c.x, y=c.y;
 const a=(material,geo,name)=>addArt(donor,slot,materials[material],geo,name,registry);
 if(slot==='Head'){
  // New forward diamond, gem brow, 2 metallic winged crests, visor blades.
  a('crystal',jewelGeometry(s.x*.13,s.y*.20,s.z*.12,x,b.max.y-s.y*.23,z),'FOREHEAD_CRYSTAL');
  for(const dir of [-1,1]){
   a('trim',flareGeometry(s.x*.14,s.y*.45,x+dir*s.x*.36,b.max.y+s.y*.12,c.z,dir),'WING_'+dir);
   a('crystal',flareGeometry(s.x*.075,s.y*.31,x+dir*s.x*.43,b.max.y+s.y*.15,c.z+s.z*.10,dir),'WING_CORE_'+dir);
  }
  a('crystal',trimGeometry(x,c.y+s.y*.06,z+s.z*.025,s.x*.73,s.y*.030,s.z*.055),'VISOR_HORIZONTAL');
  a('crystal',trimGeometry(x,c.y-s.y*.12,z+s.z*.03,s.x*.044,s.y*.41,s.z*.050),'VISOR_VERTICAL');
  a('trim',trimGeometry(x,c.y+s.y*.10,z,s.x*.80,s.y*.02,s.z*.055),'BROW_RAIL');
 }else if(slot==='Chest'){
  a('trim',jewelGeometry(s.x*.31,s.y*.35,s.z*.045,x,y,z),'CHEST_BEVEL');
  a('crystal',jewelGeometry(s.x*.20,s.y*.29,s.z*.095,x,y,z+s.z*.06),'HEART_CRYSTAL');
  a('trim',trimGeometry(x,y-s.y*.42,z+s.z*.025,s.x*.75,s.y*.035,s.z*.035),'WAIST_RAIL');
 }else if(slot==='ArmL'||slot==='ArmR'){
  const side=c.x<0?-1:1;
  a('trim',flareGeometry(s.x*.26,s.y*.62,b.min.x+(side>0?s.x*.84:s.x*.16),b.max.y+s.y*.12,c.z,side),'SHOULDER_SPIRE');
  a('crystal',jewelGeometry(s.x*.24,s.y*.19,s.z*.14,c.x,c.y+s.y*.27,z),'SHOULDER_GEM');
  a('trim',trimGeometry(c.x,c.y+s.y*.02,z+s.z*.01,s.x*.60,s.y*.035,s.z*.04),'SHOULDER_EDGE');
 }else if(slot==='HandL'||slot==='HandR'){
  a('crystal',jewelGeometry(s.x*.20,s.y*.26,s.z*.10,x,y,z),'GAUNTLET_GEM');
 }else if(slot==='LegL'||slot==='LegR'){
  a('crystal',jewelGeometry(s.x*.22,s.y*.19,s.z*.10,x,c.y+s.y*.18,z),'KNEE_GEM');
 }else if(slot==='FootL'||slot==='FootR'){
  a('trim',trimGeometry(c.x,b.min.y+s.y*.19,z,s.x*.58,s.y*.045,s.z*.08),'BOOT_EDGE');
 }else if(slot==='Back'){
  a('crystal',jewelGeometry(s.x*.12,s.y*.16,s.z*.08,x,c.y+s.y*.30,b.min.z-s.z*.06),'BACK_SIGIL');
 }
}
export function applyNativeArmorBridge(gltf,recipe=ARMOR_BRIDGE_RECIPE){
 if(!gltf?.scene||gltf.animations?.length!==22)throw Error('Se requieren 22 animaciones originales ClaudeCraft');
 if(recipe.donor!=='Armor_paladin_')throw Error('Donor no aprobado');
 const donorMeshes={},nativeBody=[];
 gltf.scene.traverse(o=>{
  if(!o.isMesh)return;
  const slot=nativeName(o,recipe.donor);
  if(slot&&NAMES.has(slot))donorMeshes[slot]=o;
  if(o.name?.startsWith('M_'))nativeBody.push(o);
 });
 const missing=[...NAMES].filter(slot=>!donorMeshes[slot]||!donorMeshes[slot].isSkinnedMesh);
 if(missing.length)throw Error('SLOT_NATIVE_MISSING: '+missing.join(', '));
 for(const part of Object.values(donorMeshes)){
  if(part.skeleton?.bones?.length!==23)throw Error('Rig_Medium inválido en '+part.name);
 }
 const mats={
  metal:makeMaterial(recipe.colors.metal,.82,.24),
  trim:makeMaterial(recipe.colors.trim,.79,.24),
  crystal:makeMaterial(recipe.colors.crystal,.34,.16,recipe.colors.crystal),
  cape:makeMaterial(recipe.colors.cape,.25,.72),
  liner:makeMaterial(recipe.colors.liner,.20,.80)
 };
 const shapes=[];
 let mutated=0;
 for(const [slot,part] of Object.entries(donorMeshes)){
  mutated+=reformSurface(part,slot);
  part.material=(slot==='Back'?mats.cape:mats.metal);
  part.visible=true;
  artisanDetail(part,slot,mats,shapes);
 }
 // The native appearance is only these authentic Paladin skinned donor pieces plus
 // custom geometry. Hide ALL alternatives and naked body, preventing a white-face T-pose.
 gltf.scene.traverse(o=>{
  if(!o.isMesh)return;
  const original=o.name||'';
  if(original.startsWith('HIGHFLY_VIOLET_'))return;
  if(original.startsWith('Armor_paladin_')){o.visible=!!donorMeshes[original.slice('Armor_paladin_'.length)];return;}
  if(original.startsWith('M_')){o.visible=false;return;}
  if(original.startsWith('Armor_')||original.startsWith('F_'))o.visible=false;
 });
 gltf.scene.updateMatrixWorld(true);
 const validated=[...NAMES].every(slot=>donorMeshes[slot].visible&&donorMeshes[slot].isSkinnedMesh);
 const proof={
  version:'SKIN7.4',artApproved:false,mode:'GUIDED_NATIVE_RECONSTRUCTION',
  recipe:recipe.id,donor:recipe.donor,pieces:[...NAMES],
  nativePieces:Object.keys(donorMeshes).length,newAuthoredGeometry:shapes.length,
  movedNativeVertices:mutated,skinnedDetailMeshes:shapes.filter(x=>x.isSkinnedMesh&&x.skeleton?.bones.length===23).length,
  originalBones:23,originalClips:gltf.animations.length,
  bodyHidden:nativeBody.every(x=>!x.visible),safeRuntime:validated&&shapes.length>=15,
  gates:{nativeRig:true,geometryAuthored:true,animationClipsPreserved:true,
   visualApproved:false,motionClippingApproved:false,maleFitApproved:false,femaleFitApproved:false,androidApproved:false},
  disclaimer:'A designed armor built from ClaudeCraft native weighted parts; no automatic accurate image-to-armor reconstruction is claimed.'
 };
 if(!proof.safeRuntime||!proof.bodyHidden)throw Error('NATIVE_ARMOR_BRIDGE_INCOMPLETE');
 return {gltf,proof};
}
