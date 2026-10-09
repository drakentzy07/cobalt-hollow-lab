/** HIGHFLY Skin Studio V6 — genuine Blender-produced rigid head accessory.
 * Native rig-only binding, explicit GLB validation, never modifies base assets.
 */
export function nativeForgeV6({THREE,loader,getRoot,removeNativeHelmet,restoreNativeHelmet,redraw,onError}){
 const $=id=>document.getElementById(id);
 const ASSET='/character-truth/integration-modules/assets/HIGHFLY-KAGE-ONI-head.glb';
 let node=null,bytes=null,head=null,headSelection=null,isSample=false,fitState=null;
 const nativeHeadVisibility=new Map();
 const report=s=>{$('forgeState').textContent=s};
 function realHead(){
  const root=getRoot();
  if(!root?.getObjectByName('Rig_Medium'))throw Error('NATIVE_RIG_MISSING');
  let bone=null,number=0;
  root.traverse(o=>{if(!o.isBone)return;number++;
   if(o.name.toLowerCase().replace(/[^a-z0-9]/g,'')==='head')bone=o;
  });
  if(number<20||!bone)throw Error('AUTHENTIC_HEAD_BONE_MISSING');
  return bone;
 }
 /** Kage-Oni's GLB was authored in original Hunter BODY/world bind coordinates.
  * Three.js Bone.add() wrongly interprets that as bone-local, offsetting the
  * helmet by the whole head-bone translation (~the floating mask in V10).
  * Derive exact inverse-BIND transform from the original real M_Head skin.
  * Never use the bone's currently animated inverse matrix: it would only
  * align correctly for the current pose and slip on subsequent animation. */
 function originalHeadInverseBind(native){
  const root=getRoot(),part=root?.getObjectByName('M_Head');
  if(!part?.isSkinnedMesh||!part.skeleton)throw Error('REAL_ORIGINAL_M_HEAD_SKIN_MISSING');
  const i=part.skeleton.bones.indexOf(native);
  if(i<0||i>=part.skeleton.boneInverses.length)throw Error('HEAD_BONE_NOT_IN_ORIGINAL_M_HEAD_SKIN');
  const inverse=part.skeleton.boneInverses[i].clone();
  if(!inverse.elements.every(Number.isFinite))throw Error('HEAD_BIND_INVERSE_INVALID');
  const bind=inverse.clone().invert(),inverseCheck=bind.clone().multiply(inverse);
  if(inverseCheck.elements.some((v,j)=>Math.abs(v-(j%5===0?1:0))>1e-4))
   throw Error('AUTHENTIC_HEAD_BIND_NOT_INVERTIBLE');
  return inverse;
 }
 function fitToSourceHead(g){
  const root=getRoot(),part=root?.getObjectByName('M_Head');
  if(!part?.isSkinnedMesh)throw Error('M_HEAD_FIT_REFERENCE_MISSING');
  part.updateWorldMatrix(true,false);
  const ref=new THREE.Box3().setFromObject(part,true);
  const visor=g.getObjectByName('KO_08_ONI_FACEPLATE');
  if(!visor?.isMesh)throw Error('ORIGINAL_ONI_FACEPLATE_MISSING');
  g.updateWorldMatrix(true,true);
  const plate=new THREE.Box3().setFromObject(visor,true);
  if(ref.isEmpty()||plate.isEmpty())throw Error('FIT_BOUNDS_UNAVAILABLE');
  const faceCenter=plate.getCenter(new THREE.Vector3());
  const refCenter=ref.getCenter(new THREE.Vector3());
  const refSize=ref.getSize(new THREE.Vector3());
  const distance=faceCenter.distanceTo(refCenter),threshold=refSize.length()*.65;
  if(!Number.isFinite(distance)||!Number.isFinite(threshold)||threshold<.1||
     distance>threshold)throw Error('KAGE_ONI_NOT_ALIGNED_WITH_REAL_HEAD_'+distance.toFixed(3));
  return {source:'M_Head',faceplateToHeadCenter:distance,threshold,
    closeToRealHead:true,nativeHeadSize:refSize.toArray(),sourceMeshCopied:false};
 }
 /* A sealed full Oni helmet needs to OCCLUDE source naked scalp/head mesh.
  * Full-head replacement is standard for full helmets. Do not delete meshes,
  * alter skinning, or modify the user's saved character design. */
 function nativeFacialMeshes(){
  const actor=getRoot(),found=[];
  if(!actor)return found;
  actor.traverse(mesh=>{
   if(mesh.isSkinnedMesh&&/^[MF]_(?:Head$|Brow_|Ear_|Eye_|Lash_|Mouth_)/.test(mesh.name))
    found.push(mesh);
  });
  if(!found.some(mesh=>mesh.name==='M_Head')||!found.some(mesh=>mesh.name==='F_Head'))
   throw Error('AUTHENTIC_FACIAL_PARTS_MISSING');
  return found;
 }
 function hideNativeScalp(){
  // FULL SEALED HELM only. Must hide original ear and eyebrow variants too:
  // those are independent genuine M_/F_ skinned meshes, not part of M_Head.
  const parts=nativeFacialMeshes();
  for(const mesh of parts){
   if(!nativeHeadVisibility.has(mesh))nativeHeadVisibility.set(mesh,mesh.visible);
   mesh.visible=false;
  }
  return parts.length;
 }
 function restoreNativeScalp(){
  for(const [mesh,wasVisible] of nativeHeadVisibility)mesh.visible=wasVisible;
  nativeHeadVisibility.clear();
 }
 function inspect(group){
  let meshes=0,vertices=0,triangles=0,skinned=0;
  const materials=new Set();
  group.traverse(o=>{
   if(o.isSkinnedMesh)skinned++;
   if(!o.isMesh)return;
   meshes++;
   const p=o.geometry?.getAttribute('position'),index=o.geometry?.index;
   if(!p||p.count<3)throw Error('INVALID_NATIVE_FORGE_MESH');
   vertices+=p.count;triangles+=(index?.count||p.count)/3;
   for(let i=0;i<p.count;i++){
    if(!Number.isFinite(p.getX(i))||!Number.isFinite(p.getY(i))||!Number.isFinite(p.getZ(i)))
     throw Error('NONFINITE_3D_VERTEX');
   }
   for(const m of Array.isArray(o.material)?o.material:[o.material])if(m)materials.add(m.uuid);
  });
  if(skinned||meshes<1||meshes>125||vertices>90000||triangles>60000||materials.size>24)
   throw Error('RIGID_FORGE_GLTF_BUDGET_EXCEEDED');
  const bounds=new THREE.Box3().setFromObject(group),extent=bounds.getSize(new THREE.Vector3());
  if(bounds.isEmpty()||!extent.toArray().every(v=>Number.isFinite(v)&&v<8)||extent.length()<.02)
   throw Error('RIGID_FORGE_BOUNDS_INVALID');
  return {meshes,vertices,triangles:Math.round(triangles),materials:materials.size};
 }
 async function importData(buffer,sample=false){
  if(!(buffer instanceof ArrayBuffer)||buffer.byteLength<1000||buffer.byteLength>9000000)
   throw Error('GLB_SIZE_REJECTED');
  const decoded=await loader.parseAsync(buffer.slice(0),'');
  if(decoded.animations?.length)throw Error('FORGE_ANIMATIONS_NOT_ALLOWED');
  const group=decoded.scene,quality=inspect(group);
  if(sample){
   const names=[];group.traverse(o=>{if(o.isMesh)names.push(o.name)});
   if(!names.some(x=>x.startsWith('KO_02_ONI_HORN_'))||
      !names.some(x=>x.startsWith('KO_08_ONI_FACEPLATE')))
     throw Error('ORIGINAL_KAGE_ONI_FORGE_IDENTITY_INVALID');
   if(quality.meshes<25)throw Error('INCOMPLETE_FORGED_HELMET');
  }
  // Resolve the original skin's TRUE inverse bind matrix before mutating scene.
  const native=realHead(),inverseBind=originalHeadInverseBind(native);
  group.applyMatrix4(inverseBind);
  native.add(group);group.name='HIGHFLY_KAGE_ONI_RIGID_HEAD_GLB';
  native.updateWorldMatrix(true,true);
  let verifiedFit;
  try{verifiedFit=fitToSourceHead(group)}
  catch(e){group.removeFromParent();throw e}
  // Validation has completed. Hide original helmet only now.
  if(!node){headSelection=removeNativeHelmet()}
  else{node.removeFromParent()}
  node=group;head=native;fitState=verifiedFit;
  bytes=buffer.slice(0);isSample=sample;
  hideNativeScalp();
  redraw();
  report('Kage-Oni V11 alineado al M_Head original · '+quality.meshes+
    ' mallas · ajuste '+verifiedFit.faceplateToHeadCenter.toFixed(3)+
    ' unidades · hueso: '+native.name);
  return {...quality,fit:verifiedFit};
 }
 async function sample(){
  const resp=await fetch(ASSET,{cache:'no-store'});
  if(!resp.ok)throw Error('CASCO_FORJADO_NO_DISPONIBLE_HTTP_'+resp.status);
  return importData(await resp.arrayBuffer(),true);
 }
 function clear(){
  if(node){node.removeFromParent();node=null}
  bytes=null;head=null;isSample=false;fitState=null;
  restoreNativeScalp();
  if(headSelection!==null){restoreNativeHelmet(headSelection);headSelection=null}
  redraw();report('Casco forjado retirado; diseño nativo preservado.');
 }
 function download(){
  if(!bytes)throw Error('PRIMERO_CARGAR_GLB');
  const href=URL.createObjectURL(new Blob([bytes],{type:'model/gltf-binary'}));
  const a=document.createElement('a');a.href=href;
  a.download=isSample?'HIGHFLY-KAGE-ONI-original.glb':'HIGHFLY-HEAD-FORGE.glb';
  a.click();setTimeout(()=>URL.revokeObjectURL(href),1500);
  report('GLB descargado. No incluye personaje, inventario ni animaciones originales.');
 }
 $('forgeLoad').onclick=()=>sample().catch(e=>report('Forja rechazada: '+String(e)));
 $('forgeOff').onclick=()=>{try{clear()}catch(e){report('Error: '+String(e))}};
 $('forgeImport').onclick=()=>$('forgeFile').click();
 $('forgeFile').onchange=async()=>{
  const file=$('forgeFile').files?.[0];
  try{
   if(!file||file.size>9000000)throw Error('ARCHIVO_GLB_RECHAZADO');
   await importData(await file.arrayBuffer(),false);
  }catch(e){report('Importación rechazada: '+String(e))}
  finally{$('forgeFile').value=''}
 };
 $('forgeDownload').onclick=()=>{try{download()}catch(e){report('Descarga: '+String(e))}};
 const api=Object.freeze({
  state:()=>({ready:!!getRoot(),rigOriginal:!!getRoot()?.getObjectByName('Rig_Medium'),
    realHeadAttached:!!node&&node.parent===head,
    headName:head?.name??null,forgedMeshes:node?inspect(node).meshes:0,
    binaryBytes:bytes?.byteLength??0,sample:isSample,
    faceFit:fitState?{...fitState}:null,originalHeadBindCorrected:!!fitState,
    sourceHeadOccluded:!!node&&['M_Head','F_Head'].every(n=>getRoot()?.getObjectByName(n)?.visible===false),
    sourceFacialFeaturesOccluded:!!node&&nativeFacialMeshes().every(m=>m.visible===false),
    sourceFacialMeshCount:node?nativeFacialMeshes().length:0,
    sourceHeadsPreserved:['M_Head','F_Head'].every(n=>!!getRoot()?.getObjectByName(n)),
    gameUnchanged:true}),
  sample,importData,remove:clear,download,
  maintainFullHelmetOcclusion:()=>node?hideNativeScalp():0,
  headWorld:()=>head?(head.updateWorldMatrix(true,false),head.getWorldPosition(new THREE.Vector3()).toArray()):null,
  faceplateWorld:()=>{
   if(!node)return null;
   node.updateWorldMatrix(true,true);
   const plate=node.getObjectByName('KO_08_ONI_FACEPLATE');
   if(!plate)throw Error('MISSING_TRUE_FACEPLATE');
   return new THREE.Box3().setFromObject(plate,true).getCenter(new THREE.Vector3()).toArray();
  }
 });
 window.__HF_SKIN_STUDIO_V6__=api;
 return api;
}
