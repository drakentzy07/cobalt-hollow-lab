/**
 * HIGHFLY V10 — genuine V8 Blender weighted NIGHTFALL GLB on the REAL animated
 * KayKit/ClaudeCraft Rig_Medium. No invented skeleton, no game authority.
 * Skeleton binding is native-name matched and rejects missing bones/weights.
 */
export function nativeBodyForgeV10({THREE,loader,getRoot,getGender,removeSourceArmor,restoreSourceArmor,redraw}){
 const $=x=>document.getElementById(x);
 const SAMPLE='/character-truth/integration-modules/assets/HIGHFLY-NIGHTFALL-rigged-body.glb';
 const allSlots=['CHEST','ARMS','HANDS','LEGS','FEET','BACK'];
 let active=null,original=null,buffer=null,importedMeshes=[],stats=null,attachedRig=null;
 const show=s=>$('bodyForgeState').textContent=s;
 function rig(){
  const actor=getRoot(),skeleton=actor?.getObjectByName('Rig_Medium');
  if(!actor||!skeleton)throw Error('NATIVE_RIG_NOT_READY');
  const bones=new Map();actor.traverse(o=>{if(o.isBone){
   if(bones.has(o.name))throw Error('DUPLICATE_NATIVE_BONE_'+o.name);
   bones.set(o.name,o);
  }});
  if(bones.size!==23)throw Error('NATIVE_BONE_COUNT_CHANGED_'+bones.size);
  return {actor,skeleton,bones};
 }
 function inspect(g){
  const list=[];g.traverse(o=>{if(o.isSkinnedMesh)list.push(o)});
  if(list.length!==36)throw Error('WEIGHTED_BODY_MESH_COUNT_'+list.length);
  let vertices=0,triangles=0;
  for(const o of list){
   if(!/^HFV8_[MF]_(?:CHEST|ARMS|HANDS|LEGS|FEET|BACK)_/.test(o.name))
    throw Error('NON_ORIGINAL_FORGE_MESH_'+o.name);
   const pos=o.geometry?.getAttribute('position'),wt=o.geometry?.getAttribute('skinWeight');
   const joint=o.geometry?.getAttribute('skinIndex');
   if(!pos||!wt||!joint||wt.count!==pos.count||joint.count!==pos.count)
    throw Error('MISSING_WEIGHTED_GEOMETRY_'+o.name);
   if(!o.skeleton?.bones?.length||o.skeleton.bones.length>23)
    throw Error('NATIVE_WEIGHTED_SKELETON_INVALID_'+o.name);
   for(let i=0;i<wt.count;i++){
    const sum=wt.getX(i)+wt.getY(i)+wt.getZ(i)+wt.getW(i);
    if(!Number.isFinite(sum)||Math.abs(sum-1)>.035)throw Error('BAD_SKIN_NORMALIZATION_'+o.name+'_'+i);
   }
   vertices+=pos.count;triangles+=(o.geometry.index?.count||pos.count)/3;
  }
  for(const gender of ['M','F'])for(const slot of allSlots)
   if(!list.some(o=>o.name.startsWith('HFV8_'+gender+'_'+slot+'_')))
    throw Error('ARMOR_GENDER_SLOT_MISSING_'+gender+'_'+slot);
  if(vertices<1500||vertices>120000||triangles>100000)throw Error('MOBILE_GEOMETRY_BUDGET');
  return {list,vertices,triangles:Math.round(triangles)};
 }
 function wearGender(){
  const gender=getGender()==='female'?'F':'M';
  for(const m of importedMeshes)m.visible=m.name.startsWith('HFV8_'+gender+'_');
  return gender;
 }
 async function importData(bytes,isSample=true){
  if(!(bytes instanceof ArrayBuffer)||bytes.byteLength<12000||bytes.byteLength>9_000_000)
   throw Error('ORIGINAL_WEIGHTED_GLB_SIZE_INVALID');
  const src=await loader.parseAsync(bytes.slice(0),'');
  // Blender V8 exported animation tracks with the ARMATURE metadata.
  // These are discarded: this module mounts ONLY forged skinned meshes and
  // references ONLY existing native bones. Never create a second mixer/rig.
  const ignoredDonorClips=src.animations?.length||0;
  if(ignoredDonorClips>150)throw Error('FORGE_UNEXPECTED_ANIMATION_PAYLOAD');
  src.animations.length=0;
  const checked=inspect(src.scene),native=rig();
  // FIRST validate exact bone mapping for all parts without scene mutations.
  const bindings=checked.list.map(mesh=>{
   const old=mesh.skeleton;
   const bones=old.bones.map(b=>native.bones.get(b.name));
   if(bones.some(b=>!b))throw Error('ARMOR_NATIVE_BONE_MISSING_'+mesh.name);
   if(old.boneInverses.length!==bones.length)throw Error('ARMOR_BIND_MATRIX_INCOMPLETE');
   const originalBoneInverses=old.boneInverses.map(m=>m.clone());
   return {mesh,newSkeleton:new THREE.Skeleton(bones,originalBoneInverses),
     bindMatrix:mesh.bindMatrix.clone()};
  });
  // All data and bind validation complete. Source state changes now reversible.
  if(!active)original=removeSourceArmor();
  else{for(const m of importedMeshes)m.removeFromParent();active.removeFromParent()}
  const holder=new THREE.Group();holder.name='HIGHFLY_V10_NIGHTFALL_WEIGHTED_NATIVE_RIG';
  native.actor.add(holder);
  // Reparent preserving world pose. Bound original native bones stay authoritative.
  native.actor.updateMatrixWorld(true);
  src.scene.updateMatrixWorld(true);
  importedMeshes=[];
  for(const {mesh,newSkeleton,bindMatrix} of bindings){
   holder.attach(mesh);
   mesh.bind(newSkeleton,bindMatrix);
   mesh.frustumCulled=false;
   importedMeshes.push(mesh);
  }
  wearGender();
  active=holder;buffer=bytes.slice(0);attachedRig=native.skeleton;
  stats={vertices:checked.vertices,triangles:checked.triangles,meshes:checked.list.length,
    nativeBones:native.bones.size,originalRig:true,ignoredDonorClips,
    nativeAnimationAuthority:true,visualQualityCertified:false,phoneTested:false};
  redraw();show('Nightfall real: '+stats.meshes+' mallas skinned · '+stats.vertices+
    ' vértices · '+stats.triangles+' triángulos · rig original '+stats.nativeBones+' huesos.');
  return stats;
 }
 async function sample(){
  const response=await fetch(SAMPLE,{cache:'no-store'});
  if(!response.ok)throw Error('V8_NIGHTFALL_NOT_AVAILABLE_HTTP_'+response.status);
  return importData(await response.arrayBuffer(),true);
 }
 function clear(){
  if(active){active.removeFromParent();active=null}
  importedMeshes=[];buffer=null;stats=null;attachedRig=null;
  if(original){restoreSourceArmor(original);original=null}
  redraw();show('Armadura Nightfall retirada. Hunter original conservado.');
 }
 function download(){
  if(!buffer)throw Error('NIGHTFALL_GLB_NOT_LOADED');
  const url=URL.createObjectURL(new Blob([buffer],{type:'model/gltf-binary'}));
  const a=document.createElement('a');a.href=url;a.download='HIGHFLY-NIGHTFALL-original-weighted.glb';
  a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
  show('GLB original Nightfall guardado: riggeado en 23 huesos.');
 }
 function sampleDeformation(){
  if(!active)throw Error('NIGHTFALL_NOT_MOUNTED');
  rig().actor.updateMatrixWorld(true);
  const ret=[];
  for(const m of importedMeshes.filter(m=>m.visible)){
   m.skeleton.update();
   const p=new THREE.Vector3(),a=new THREE.Vector3();
   for(let i=0;i<Math.min(6,m.geometry.attributes.position.count);i++){
    m.getVertexPosition(i,p);a.copy(p).applyMatrix4(m.matrixWorld);
    if(![a.x,a.y,a.z].every(Number.isFinite))throw Error('ANIMATED_ARMOR_NONFINITE_'+m.name);
   }
   ret.push({name:m.name,worldSample:a.toArray()});
  }
  return ret;
 }
 $('bodyForgeLoad').onclick=()=>sample().catch(e=>show('RECHAZADO: '+String(e)));
 $('bodyForgeOff').onclick=()=>{try{clear()}catch(e){show('Error: '+String(e))}};
 $('bodyForgeDownload').onclick=()=>{try{download()}catch(e){show('Error: '+String(e))}};
 $('bodyForgeImport').onclick=()=>$('bodyForgeFile').click();
 $('bodyForgeFile').onchange=async()=>{
  const file=$('bodyForgeFile').files?.[0];
  try{if(!file||file.size>9_000_000)throw Error('WEIGHTED_GLB_TOO_LARGE');
   await importData(await file.arrayBuffer(),false);
  }catch(e){show('GLB rechazado: '+String(e))}
  finally{$('bodyForgeFile').value=''}
 };
 const api=Object.freeze({
  state:()=>({ready:!!getRoot(),mounted:!!active&&active.parent===getRoot(),
   originalRig:!!attachedRig&&attachedRig===getRoot()?.getObjectByName('Rig_Medium'),
   skinnedMeshes:importedMeshes.length,activeMeshes:importedMeshes.filter(o=>o.visible).length,
   mappedToOriginalBones:!!stats&&stats.originalRig,gender:getGender(),
   bytes:buffer?.byteLength||0,stats:stats?{...stats}:null,
   gameUnchanged:true,visualQualityApproved:false}),
  sample,importData,remove:clear,syncGender:wearGender,
  download,sampleDeformation,
  bonesMatch:()=>importedMeshes.every(o=>o.skeleton.bones.every(b=>{
   let p=b;while(p){if(p===getRoot())return true;p=p.parent}return false;
  }))
 });
 window.__HF_SKIN_STUDIO_V10__=api;
 return api;
}
