/** SKIN 8.1 — geometry fit + native gambeson review pass.
 * Fit authored overlays to SOURCE slot extents, not their accumulated overlay extents.
 * Designed for the original 23-bone Rig_Medium; no GLB, skeleton or clip writes.
 */
import * as THREE from 'three';
const SLOTS=['Head','Chest','Back','ArmL','ArmR','HandL','HandR','LegL','LegR','FootL','FootR'];
const RIGID={violet:[1.25,1.36,1.27],dragon:[1.32,1.39,1.34],
 celestial:[1.34,1.40,1.30],royal:[1.25,1.35,1.26],
 berserker:[1.34,1.34,1.36],arcane:[1.26,1.43,1.26]};
const FACTORS={
 Chest:[1.22,1.20,1.47],Back:[1.32,1.31,1.55],
 ArmL:[1.57,1.31,1.60],ArmR:[1.57,1.31,1.60],
 HandL:[1.31,1.30,1.44],HandR:[1.31,1.30,1.44],
 LegL:[1.32,1.29,1.55],LegR:[1.32,1.29,1.55],
 FootL:[1.35,1.27,1.47],FootR:[1.35,1.27,1.47]
};
const skinnedBody=/^M_(Torso|Loin|ArmL|ArmR|HandL|HandR|LegL|LegR|FootL|FootR)(?:_|$)/;
const v=new THREE.Vector3();
function originalSlot(name){
 if(!name.startsWith('Armor_paladin_'))return null;
 return SLOTS.find(s=>name==='Armor_paladin_'+s || name.startsWith('Armor_paladin_'+s+'_'))||null;
}
function authoredSlot(name,style){
 if(name.startsWith('HF_DUAL_shell_'))return null; // Native sculpt shell stays source weighted.
 let rest=null;
 if(name.startsWith('HF_DNA_'+style+'_'))rest=name.slice(('HF_DNA_'+style+'_').length);
 else if(name.startsWith('HF_SKIN8_'+style+'_'))rest=name.slice(('HF_SKIN8_'+style+'_').length);
 else if(name.startsWith('HF_DUAL_'))rest=name.replace(/^HF_DUAL_[^_]+_/,'');
 else if(name.startsWith('HIGHFLY_VIOLET_'))rest=name.slice('HIGHFLY_VIOLET_'.length);
 return rest?SLOTS.find(slot=>rest===slot||rest.startsWith(slot+'_'))||null:null;
}
function clampMeshToSlot(mesh,box,factor){
 if(!mesh.geometry?.getAttribute('position'))return false;
 const geometry=mesh.geometry.clone(),p=geometry.getAttribute('position');
 const srcBox=new THREE.Box3().setFromBufferAttribute(p);
 if(srcBox.isEmpty())return false;
 const cb=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3()),mi=[],ma=[];
 for(let a=0;a<3;a++){
  const extent=Math.max(size.getComponent(a)*factor[a]*.5,.04);
  mi[a]=cb.getComponent(a)-extent;ma[a]=cb.getComponent(a)+extent;
 }
 const srcMin=srcBox.min.toArray(),srcMax=srcBox.max.toArray();
 const s=[1,1,1],shift=[0,0,0];
 for(let a=0;a<3;a++){
  const length=Math.max(srcMax[a]-srcMin[a],1e-8),target=ma[a]-mi[a];
  s[a]=Math.min(1,target/length);
  const avg=(srcMin[a]+srcMax[a])*.5,half=length*s[a]*.5;
  const desired=Math.max(mi[a]+half,Math.min(ma[a]-half,avg));
  shift[a]=desired-avg*s[a];
 }
 let changed=false;
 for(let i=0;i<p.count;i++){
  const o=[p.getX(i),p.getY(i),p.getZ(i)];
  const n=o.map((x,a)=>x*s[a]+shift[a]);
  if(o.some((x,a)=>Math.abs(x-n[a])>1e-6))changed=true;
  p.setXYZ(n[0],n[1],n[2]);
 }
 if(!changed){geometry.dispose();return false;}
 p.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
 mesh.geometry=geometry;mesh.frustumCulled=false;return true;
}
export function balanceNativeArmorSilhouette(gltf,style){
 if(!RIGID[style])throw Error('SKIN8_ART_STYLE_UNKNOWN '+style);
 const bySlot=new Map(SLOTS.map(s=>[s,new THREE.Box3()])),native=new Map(SLOTS.map(s=>[s,0]));
 gltf.scene.traverse(o=>{
  const slot=originalSlot(o.name||'');
  if(slot&&o.isSkinnedMesh&&o.geometry?.getAttribute('position')){
   bySlot.get(slot).union(new THREE.Box3().setFromBufferAttribute(o.geometry.getAttribute('position')));
   native.set(slot,native.get(slot)+1);
  }
 });
 if([...native.values()].reduce((a,b)=>a+b,0)!==17 || [...native.values()].some(x=>!x))throw Error('SKIN8_ART_NATIVE_TRUTH_RED');
 let inspected=0,constrained=0;const slotFits={};
 gltf.scene.traverse(o=>{
  if(!o.isSkinnedMesh)return;
  const slot=authoredSlot(o.name||'',style);if(!slot)return;
  inspected++;const changed=clampMeshToSlot(o,bySlot.get(slot),slot==='Head'?RIGID[style]:FACTORS[slot]);
  if(changed){constrained++;slotFits[slot]=(slotFits[slot]||0)+1;}
 });
 // Original native anatomical inner garment: fills major neck-to-torso and joint gaps.
 // No M_Head/face is displayed through full helmets. Preserve all original 17 armor primitives.
 const cloth=new THREE.MeshStandardMaterial({color:style==='royal'?0x35404c:style==='celestial'?0x48506c:0x121620,
  metalness:.12,roughness:.86,side:THREE.DoubleSide});
 let underArmor=0;const names=[];
 gltf.scene.traverse(o=>{
  if(o.isSkinnedMesh&&skinnedBody.test(o.name||'')){
   o.visible=true;o.material=cloth;underArmor++;names.push(o.name);
  }
 });
 gltf.scene.updateMatrixWorld(true);
 const proof={pass:'SKIN8_1_ART_FIT',nativePrimitives:17,authoredInspected:inspected,
  correctedOverlays:constrained,sourceBoundsSlots:bySlot.size,underArmor,underArmorNames:names,
  fittedSlots:slotFits,clips:gltf.animations.length,artReviewed:false,
  noFloatingPartsCertified:false,physicalAndroid:false};
 if(proof.clips!==22||inspected<30||underArmor<6)throw Error('SKIN8_ART_FIT_GATE_RED '+JSON.stringify(proof));
 return proof;
}
