/** HIGHFLY Skin Studio V6 — genuine Blender-produced rigid head accessory.
 * Native rig-only binding, explicit GLB validation, never modifies base assets.
 */
export function nativeForgeV6({THREE,loader,getRoot,removeNativeHelmet,restoreNativeHelmet,redraw,onError}){
 const $=id=>document.getElementById(id);
 const ASSET='/character-truth/integration-modules/assets/HIGHFLY-KAGE-ONI-head.glb';
 let node=null,bytes=null,head=null,headSelection=null,isSample=false;
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
  // All input validation completes before any mutation to the scene.
  const native=realHead();
  if(!node){headSelection=removeNativeHelmet()}
  else{node.removeFromParent()}
  native.add(group);group.name='HIGHFLY_KAGE_ONI_RIGID_HEAD_GLB';
  node=group;head=native;bytes=buffer.slice(0);isSample=sample;redraw();
  report('Casco 3D real · '+quality.meshes+' mallas · '+quality.vertices+
    ' vértices · '+quality.triangles+' triángulos · hueso: '+native.name);
  return quality;
 }
 async function sample(){
  const resp=await fetch(ASSET,{cache:'no-store'});
  if(!resp.ok)throw Error('CASCO_FORJADO_NO_DISPONIBLE_HTTP_'+resp.status);
  return importData(await resp.arrayBuffer(),true);
 }
 function clear(){
  if(node){node.removeFromParent();node=null}
  bytes=null;head=null;isSample=false;
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
    binaryBytes:bytes?.byteLength??0,sample:isSample,gameUnchanged:true}),
  sample,importData,remove:clear,download,
  headWorld:()=>head?(head.updateWorldMatrix(true,false),head.getWorldPosition(new THREE.Vector3()).toArray()):null
 });
 window.__HF_SKIN_STUDIO_V6__=api;
 return api;
}
