/**
 * HIGHFLY 7.5 / 7.6 — Dual Native Shell Factory.
 * Original ClaudeCraft 23-bone Rig_Medium and 22 animation clips are NEVER edited.
 * Source: 11 original Paladin armor slots (17 skinned mesh primitives).
 * Art variants: violet obsidian plates vs physically distinct scale/dragon armor.
 * This is an authored procedural *experimental* design, not image-to-3D automation.
 */
import * as THREE from 'three';
import {applyNativeArmorBridge} from './native_armor_bridge.mjs';

export const VARIANTS=Object.freeze({
 violet:{id:'violet',name:'Obsidiana Violeta v2',metal:0x10111e,plates:0x25263b,trim:0xc2c8d8,glow:0x8e31ff,secondary:0x37224f},
 dragon:{id:'dragon',name:'Dragón Rojo — Escamas',metal:0x290908,plates:0xa51a15,trim:0xf3a84b,glow:0xff5c19,secondary:0x61110f}
});
const SLOTS=['Head','Chest','Back','ArmL','ArmR','HandL','HandR','LegL','LegR','FootL','FootR'];
const v3=(x,y,z)=>new THREE.Vector3(x,y,z);
function mat(hex,metalness=.5,roughness=.4,emissive=0x000000,emissiveIntensity=.5){
 return new THREE.MeshStandardMaterial({color:hex,metalness,roughness,emissive,emissiveIntensity,side:THREE.DoubleSide});
}
function bounds(m){
 const p=m.geometry.getAttribute('position'),box=new THREE.Box3().setFromBufferAttribute(p);
 if(box.isEmpty())throw Error('INVALID_BOUNDS '+m.name);
 const size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
 return {box,size,center,x:center.x,y:center.y,z:center.z,
  front:box.max.z,back:box.min.z,top:box.max.y,bottom:box.min.y};
}
function donorCollection(scene){
 const result=new Map(SLOTS.map(s=>[s,[]]));
 scene.traverse(o=>{
  if(!o.isSkinnedMesh)return;
  for(const slot of SLOTS){
   if(o.name==='Armor_paladin_'+slot || o.name.startsWith('Armor_paladin_'+slot+'_')){
    result.get(slot).push(o);break;
   }
  }
 });
 // ClaudeCraft multi-primitive GLB may rename children. Recover by group traversal.
 scene.traverse(o=>{
  const n=o.name||'';
  const slot=n.startsWith('Armor_paladin_')?n.replace('Armor_paladin_',''):null;
  if(!SLOTS.includes(slot))return;
  o.traverse(child=>{if(child.isSkinnedMesh&&!result.get(slot).includes(child))result.get(slot).push(child);});
 });
 const missing=SLOTS.filter(s=>result.get(s).length===0);
 if(missing.length)throw Error('MISSING_NATIVE_SLOT '+missing);
 for(const [s,meshes] of result)for(const m of meshes){
  if(m.skeleton?.bones.length!==23)throw Error('RIG_BONES_MISMATCH '+s);
 }
 return result;
}
function shellGeometry(source,amount,plateFactor=1){
 const g=source.geometry.clone(),pos=g.getAttribute('position'),normal=g.getAttribute('normal');
 const b=bounds(source),{size,center}=b;
 const strength=Math.min(size.x,size.y,size.z)*amount;
 for(let i=0;i<pos.count;i++){
  const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);
  const ox=(x-center.x),oy=(y-center.y),oz=(z-center.z);
  let normalX=normal?.getX(i)??0,normalY=normal?.getY(i)??0,normalZ=normal?.getZ(i)??0;
  // Shell cannot be a uniform rescale: silhouettes need per-slot outward shell space.
  const out=v3(ox/Math.max(size.x,.001),oy/Math.max(size.y,.001),oz/Math.max(size.z,.001)).normalize();
  normalX=.42*normalX+.58*out.x;
  normalY=.25*normalY+.75*out.y;
  normalZ=.42*normalZ+.58*out.z;
  let k=strength*plateFactor;
  if(source.name.includes('Head'))k*=1.2;
  if(source.name.includes('Arm'))k*=1.24;
  pos.setXYZ(i,x+normalX*k,y+normalY*k,z+normalZ*k);
 }
 pos.needsUpdate=true;g.computeVertexNormals();g.computeBoundingSphere();
 return g;
}
function attachNative(source,geometry,material,name,added,slot,type){
 // Same skeleton, bind matrices and original skin weights; no new rig.
 if(!geometry.getAttribute('skinIndex')||!geometry.getAttribute('skinWeight')){
  transferWeights(source,geometry);
 }
 const mesh=new THREE.SkinnedMesh(geometry,material);
 mesh.name='HF_DUAL_'+type+'_'+slot+'_'+name;
 mesh.bind(source.skeleton,source.bindMatrix.clone());
 mesh.frustumCulled=false;
 source.parent.add(mesh);
 added.push({mesh,slot,type});
 return mesh;
}
function transferWeights(source,geometry){
 const from=source.geometry.getAttribute('position'),si=source.geometry.getAttribute('skinIndex'),sw=source.geometry.getAttribute('skinWeight');
 const to=geometry.getAttribute('position');
 if(!si||!sw||!from)throw Error('ORIGINAL_SKIN_WEIGHTS_MISSING');
 const joint=new Uint16Array(to.count*4),weight=new Float32Array(to.count*4);
 // Deterministic donor-nearest transfer, only within the SAME native armor slot.
 for(let i=0;i<to.count;i++){
  const x=to.getX(i),y=to.getY(i),z=to.getZ(i);let best=0,dist=Infinity;
  for(let j=0;j<from.count;j++){
   const a=x-from.getX(j),b=y-from.getY(j),c=z-from.getZ(j);
   const d=a*a+b*b+c*c;
   if(d<dist){dist=d;best=j;}
  }
  let total=0;
  for(let k=0;k<4;k++){joint[4*i+k]=si.getComponent(best,k);weight[4*i+k]=sw.getComponent(best,k);total+=weight[4*i+k];}
  if(total>1e-6)for(let k=0;k<4;k++)weight[4*i+k]/=total;
  else weight[4*i]=1;
 }
 geometry.setAttribute('skinIndex',new THREE.BufferAttribute(joint,4));
 geometry.setAttribute('skinWeight',new THREE.BufferAttribute(weight,4));
 return geometry;
}
function diamond(w,h,d,x,y,z){const g=new THREE.OctahedronGeometry(1,0);g.scale(w,h,d);g.translate(x,y,z);return g;}
function spike(radius,height,x,y,z,lean=0,segments=6){
 const g=new THREE.ConeGeometry(radius,height,segments);
 g.rotateZ(lean);g.translate(x,y,z);return g;
}
function plate(w,h,d,x,y,z,rot=0){
 const g=new THREE.BoxGeometry(w,h,d);g.rotateZ(rot);g.translate(x,y,z);return g;
}
function fang(w,h,d,x,y,z,lean=0){
 return spike(w,h,x,y,z,lean,4);
}
function armorArt(donors,variant,added,materials){
 let count=0,scales=0,horns=0,plates=0;
 const add=(slot,type,geo,m,name)=>{
  const list=donors.get(slot),host=[...list].sort((a,b)=>b.geometry.getAttribute('position').count-a.geometry.getAttribute('position').count)[0];
  attachNative(host,geo,m,name+'_'+count++,added,slot,type);
  if(type==='scale')scales++;if(type==='horn')horns++;if(type==='plate')plates++;
 };
 const B=slot=>bounds([...donors.get(slot)].sort((a,b)=>b.geometry.getAttribute('position').count-a.geometry.getAttribute('position').count)[0]);
 const head=B('Head'),chest=B('Chest');
 if(variant==='violet'){
  // A real over-plate (breastplate) and layered shoulders; crystals sit in raised bezels.
  const c=chest,s=c.size;
  add('Chest','plate',plate(s.x*.80,s.y*.35,s.z*.15,c.x,c.y+s.y*.11,c.front+s.z*.065),'plate','CHEST_HERO');
  add('Chest','trim',diamond(s.x*.29,s.y*.25,s.z*.10,c.x,c.y+s.y*.13,c.front+s.z*.15),'silver','HEART_RIM');
  add('Chest','crystal',diamond(s.x*.20,s.y*.19,s.z*.13,c.x,c.y+s.y*.13,c.front+s.z*.21),'light','HEART');
  for(const dir of [-1,1]){
   add('Chest','plate',plate(s.x*.29,s.y*.15,s.z*.11,c.x+dir*s.x*.25,c.y-s.y*.24,c.front+s.z*.04,dir*.23),'plate','RIB');
  }
  const h=head;
  add('Head','plate',plate(h.size.x*.7,h.size.y*.29,h.size.z*.11,h.x,h.y+h.size.y*.16,h.front+h.size.z*.038),'plate','CROWN_SHELL');
  add('Head','trim',plate(h.size.x*.86,h.size.y*.034,h.size.z*.085,h.x,h.y-h.size.y*.055,h.front+h.size.z*.06),'silver','VISOR_BAR');
  for(const dir of [-1,1]){
   add('Head','horn',spike(h.size.x*.10,h.size.y*.31,h.x+dir*h.size.x*.35,h.top+h.size.y*.09,h.z,dir*.25),'silver','WING_TIP');
  }
  for(const slot of ['ArmL','ArmR']){
   const b=B(slot),s=b.size;
   add(slot,'plate',plate(s.x*.93,s.y*.35,s.z*.23,b.x,b.y+s.y*.21,b.front+s.z*.06),'plate','PAULDRON_LAYER');
   add(slot,'trim',plate(s.x*.94,s.y*.035,s.z*.12,b.x,b.y+s.y*.06,b.front+s.z*.19),'silver','EDGE');
   add(slot,'crystal',diamond(s.x*.22,s.y*.14,s.z*.13,b.x,b.y+s.y*.20,b.front+s.z*.22),'light','GEM_SET');
  }
  for(const slot of ['LegL','LegR','FootL','FootR']){
   const b=B(slot),s=b.size;
   add(slot,'plate',plate(s.x*.74,s.y*.30,s.z*.16,b.x,b.y+s.y*.12,b.front+s.z*.09),'plate','LEG_SHELL');
   add(slot,'trim',plate(s.x*.77,s.y*.035,s.z*.16,b.x,b.y-s.y*.055,b.front+s.z*.09),'silver','EDGE');
  }
 }else{
  // DRAGON RED deliberately differs from violet: scales, horns, mouth, talons and wings.
  const h=head,s=h.size;
  add('Head','plate',plate(s.x*.92,s.y*.28,s.z*.18,h.x,h.y+s.y*.07,h.front+s.z*.12),'plate','DRAGON_FACE');
  add('Head','plate',plate(s.x*.51,s.y*.14,s.z*.30,h.x,h.y-s.y*.23,h.front+s.z*.28),'plate','DRAGON_SNOUT');
  add('Head','trim',plate(s.x*.46,s.y*.035,s.z*.19,h.x,h.y-s.y*.31,h.front+s.z*.35),'gold','JAW_RIM');
  for(const dir of [-1,1]){
   add('Head','horn',spike(s.x*.13,s.y*.68,h.x+dir*s.x*.32,h.top+s.y*.20,h.z-s.z*.10,dir*.27,7),'horn','HORN_OUTER');
   add('Head','horn',spike(s.x*.08,s.y*.47,h.x+dir*s.x*.14,h.top+s.y*.16,h.z-s.z*.19,dir*.12,6),'horn','HORN_INNER');
   add('Head','light',diamond(s.x*.15,s.y*.045,s.z*.07,h.x+dir*s.x*.21,h.y+s.y*.01,h.front+s.z*.29),'light','EMBER_EYE');
   add('Head','fang',fang(s.x*.045,s.y*.14,s.z*.05,h.x+dir*s.x*.15,h.y-s.y*.32,h.front+s.z*.4),'gold','FANG');
  }
  for(let row=0;row<3;row++)
   add('Head','horn',spike(s.x*.075,s.y*.22,h.x,h.top+s.y*(.06+row*.04),h.z-s.z*(.23+row*.19),0,5),'horn','SPINAL_CREST');
  const c=chest,t=c.size;
  add('Chest','plate',plate(t.x*.82,t.y*.41,t.z*.18,c.x,c.y+t.y*.07,c.front+t.z*.14),'plate','DRAGON_BREASTPLATE');
  // Scales are individually weighted, overlapping downward: tiled masonry rather than dots.
  for(let row=0;row<5;row++)for(let col=0;col<5;col++){
   if((row===0||row===4)&&(col===0||col===4))continue;
   const x=c.x+(col-2)*t.x*.145+(row%2)*t.x*.045;
   const y=c.y+t.y*.22-row*t.y*.115;
   const z=c.front+t.z*(.18+(2-Math.abs(col-2))*.032);
   const palette=(row+col)%4===0?'gold':((row+col)%3===0?'dark':'scale');
   add('Chest','scale',diamond(t.x*.10,t.y*.088,t.z*.065,x,y,z),palette,'TORSO_SCALE_'+row+'_'+col);
  }
  add('Chest','light',diamond(t.x*.18,t.y*.20,t.z*.12,c.x,c.y+t.y*.18,c.front+t.z*.35),'light','FURNACE_HEART');
  for(const slot of ['ArmL','ArmR']){
   const b=B(slot),q=b.size,dir=b.x<0?-1:1;
   add(slot,'plate',plate(q.x*.96,q.y*.39,q.z*.24,b.x,b.y+q.y*.23,b.front+q.z*.13),'plate','WING_PAULDRON');
   for(let i=0;i<3;i++){
    add(slot,'horn',spike(q.x*.20,q.y*(.48-i*.065),b.x+dir*q.x*(.2+i*.19),b.top+q.y*(.12+i*.04),b.z-q.z*.12,dir*(.18+i*.08)),'horn','SHOULDER_SPIKE_'+i);
   }
   for(let row=0;row<4;row++)for(let col=0;col<3;col++){
    add(slot,'scale',diamond(q.x*.11,q.y*.085,q.z*.085,b.x+(col-1)*q.x*.23,b.y+q.y*.20-row*q.y*.18,b.front+q.z*.22),
     (row+col)%4===0?'gold':'scale','ARM_SCALE');
   }
  }
  for(const slot of ['HandL','HandR','LegL','LegR','FootL','FootR']){
   const b=B(slot),q=b.size;
   add(slot,'plate',plate(q.x*.85,q.y*.55,q.z*.21,b.x,b.y+q.y*.06,b.front+q.z*.10),'plate','DRAGON_GUARD');
   for(let row=0;row<3;row++)for(let col=-1;col<=1;col++)
    add(slot,'scale',diamond(q.x*.12,q.y*.12,q.z*.09,b.x+col*q.x*.26,b.y+q.y*(.27-row*.25),b.front+q.z*.24),
      (col+row)%3===0?'gold':'scale','SCALE');
   if(slot.startsWith('Foot'))for(let i=-1;i<=1;i++){
    add(slot,'fang',fang(q.x*.10,q.y*.21,q.z*.17,b.x+i*q.x*.25,b.bottom-q.y*.02,b.front+q.z*.24,Math.PI),'horn','TALON');
   }
  }
  const bk=B('Back'),k=bk.size;
  for(const dir of [-1,1])for(let i=0;i<3;i++){
   add('Back','horn',spike(k.x*.09,k.y*.32,k.x*dir*.28+bk.x,bk.y+k.y*(.27-i*.23),bk.back-k.z*.17,dir*.33),'horn','DORSAL_FIN');
  }
 }
 return {scales,horns,plates,artObjects:count};
}

export function forgeDualArmor(gltf,variant='violet'){
 if(!VARIANTS[variant])throw Error('UNKNOWN_ARMOR_VARIANT '+variant);
 const original=applyNativeArmorBridge(gltf);
 const donors=donorCollection(gltf.scene);
 const v=VARIANTS[variant],added=[];
 const materials={
  inner:mat(v.metal,.82,.38),
  plate:mat(v.plates,.77,.31),
  dark:mat(v.secondary,.74,.34),
  scale:mat(variant==='dragon'?0xc63120:0x44356d,.75,.27),
  silver:mat(v.trim,.82,.24),
  gold:mat(0xffb85f,.77,.29),
  light:mat(v.glow,.42,.2,v.glow,1),
  horn:mat(variant==='dragon'?0x47100d:0xc9c8d7,.55,.3)
 };
 // Old SKIN 7.4 violet "stick-on" shapes are withdrawn from BOTH new variants.
 // The 11 native donor slots remain visible as inner structure.
 gltf.scene.traverse(o=>{if(o.isMesh&&o.name.startsWith('HIGHFLY_VIOLET_'))o.visible=false;});
 for(const [slot,meshes] of donors){
  for(const donor of meshes){
   donor.material=materials.inner;
   donor.visible=true;
   // Shell is a new REAL weighted geometry following native plate,
   // with separate outer offset and material; no free-floating body proxy.
   const geo=shellGeometry(donor,slot==='Head'?.10:(slot.startsWith('Arm')?.11:.075),
    variant==='dragon'?1.19:1.0);
   attachNative(donor,geo,materials.plate,'NATIVE_SHELL',added,slot,'shell');
  }
 }
 const authored=armorArt(donors,variant,added,materials);
 const shellCount=added.filter(e=>e.type==='shell').length;
 const addedVisible=added.filter(e=>e.mesh.visible&&e.mesh.isSkinnedMesh&&e.mesh.skeleton.bones.length===23);
 const proof={
  variant,variantName:v.name,version:'7.5-7.6',
  nativeSlots:donors.size,nativePrimitives:[...donors.values()].reduce((s,m)=>s+m.length,0),
  authoredGeometry:authored.artObjects+shellCount,scaleCount:authored.scales,hornCount:authored.horns,
  shellCount,plateCount:authored.plates,skinnedAdded:addedVisible.length,
  originalBones:23,originalClips:gltf.animations.length,
  originalBodyHidden:original.proof.bodyHidden,sourceGlbUnmodified:true,
  flags:{skeletonPreserved:true,weightTransferImplemented:true,visualApproved:false,
   clippingApproved:false,femaleApproved:false,physicalAndroidApproved:false},
  structuralGreen:donors.size===11&&addedVisible.length===added.length&&
   gltf.animations.length===22&&original.proof.bodyHidden&&
   (variant!=='dragon'||authored.scales>=35)&&shellCount>=11
 };
 if(!proof.structuralGreen)throw Error('DUAL_ARMOR_NATIVE_GATE_FAIL '+JSON.stringify(proof));
 gltf.userData={...(gltf.userData||{}),dualArmorProof:proof};
 return {gltf,proof};
}
