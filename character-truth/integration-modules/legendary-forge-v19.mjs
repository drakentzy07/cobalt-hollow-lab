/** V19 — mount NEW Blender-authored premium meshes to authentic ClaudeCraft Rig_Medium.
 * Reuses Nightfall and V18. Never creates new character skeletons or touches gameplay.
 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const $=id=>document.getElementById(id);
const body=$('bodyPanel'),cockpit=$('dreamCockpit');
if(!body||!cockpit||!window.__HF_V19_SCENE__)throw Error('V19_FROZEN_STUDIO_DEPENDENCY_MISSING');
const launch=document.createElement('button');launch.id='hf19Launch';
launch.textContent='⚒ V19 · FORJA DE GEOMETRÍA LEGENDARIA';
launch.className='primary';launch.style.margin='8px 0';
cockpit.querySelector('h2').after(launch);
const panel=document.createElement('section');panel.id='hf19Panel';
panel.className='studio';panel.style.cssText='border:1px solid #bf6f66;margin:8px 0;background:linear-gradient(115deg,#2d1727,#191222)';
panel.innerHTML=`<h2>⚒ LEGENDARY GEOMETRY FORGE · V19</h2>
 <small>Artesanía Blender NUEVA sobre Nightfall: 32 mallas originales de crestas, grabados, placas posteriores y espinas de hombrera, pesadas para el Rig_Medium auténtico. Casco Kage-Oni sigue separado.</small>
 <div class="buttonrow"><button id="hf19Wear" class="primary">Vestir ornamentos legendarios</button><button id="hf19Off">Retirar ornamentos</button></div>
 <div class="buttonrow"><button id="hf19Overlay">↓ GLB NUEVAS piezas 3D</button><button id="hf19Full">↓ GLB COMPLETO · Nightfall + V19</button></div>
 <div class="buttonrow"><button id="hf19Inspect">Verificar huesos y polígonos</button><button id="hf19Pose">Probar pose auténtica</button></div>
 <div id="hf19Feedback" role="status" aria-live="polite" style="white-space:pre-wrap;color:#eee0f6;font-size:11px;margin-top:8px">
  Estas geometrías SE FABRICARON en Blender. No son capturas 2D ni una reconstrucción automática de cualquier imagen.</div>`;
body.prepend(panel);
launch.onclick=()=>{window.__HF_DREAM_V17__.selectTab('editor');panel.scrollIntoView({block:'nearest',behavior:'smooth'})};
const status=s=>$('hf19Feedback').textContent=s;
const filename='HIGHFLY-V19-LEGENDARY-ORNAMENTS.glb';
const fullName='HIGHFLY-V19-LEGENDARY-COMBINED.glb';
let parent=null,all=[],byteCache=null,infos=null,busy=false;
const root=()=>window.__HF_V19_SCENE__.root();
function native(){
 const actor=root(),rig=actor?.getObjectByName('Rig_Medium');
 if(!actor||!rig)throw Error('V19_ORIGINAL_HUNTER_NOT_READY');
 const bones=new Map();actor.traverse(x=>{if(x.isBone){
  if(bones.has(x.name))throw Error('V19_DUPLICATE_SOURCE_BONE_'+x.name);
  bones.set(x.name,x);
 }});
 if(bones.size!==23)throw Error('V19_REAL_23_BONES_MISMATCH');
 return {actor,rig,bones};
}
const gender=()=>$('gender')?.value==='female'?'F':'M';
function sync(){
 const g=gender();
 for(const o of all)o.visible=o.name.startsWith('HFV19_'+g+'_');
 window.__HF_V19_SCENE__.render();
 return {gender:g,visible:all.filter(o=>o.visible).length};
}
async function fetchGlb(name){
 const response=await fetch('./assets/'+name,{cache:'no-store'});
 if(!response.ok)throw Error('V19_GLB_NOT_READY_HTTP_'+response.status);
 return await response.arrayBuffer();
}
function audit(parsed){
 const objs=[];parsed.scene.traverse(o=>{if(o.isSkinnedMesh)objs.push(o)});
 if(objs.length!==32)throw Error('V19_EXPECTS_32_NEW_3D_MESHES_'+objs.length);
 const names=new Set(),stats={meshes:0,vertices:0,triangles:0,bones:0};
 for(const m of objs){
  if(!/^HFV19_[MF]_(CHEST|BACK|ARMS)_/.test(m.name)||names.has(m.name))
   throw Error('V19_INVALID_NEW_MESH_ID_'+m.name);
  names.add(m.name);stats.meshes++;
  const pos=m.geometry.getAttribute('position'),wt=m.geometry.getAttribute('skinWeight');
  const j=m.geometry.getAttribute('skinIndex');
  if(!pos||!wt||!j||pos.count!==wt.count||pos.count!==j.count)
   throw Error('V19_REAL_SKINNING_DATA_MISSING_'+m.name);
  stats.vertices+=pos.count;stats.triangles+=(m.geometry.index?.count||pos.count)/3;
  if(!m.skeleton||m.skeleton.bones.length>23)throw Error('V19_IMPORTED_RIG_TOO_LARGE');
  for(let k=0;k<wt.count;k++){
   const weight=wt.getX(k)+wt.getY(k)+wt.getZ(k)+wt.getW(k);
   if(!Number.isFinite(weight)||Math.abs(weight-1)>.05)throw Error('V19_BAD_SKIN_WEIGHT');
  }
 }
 if(stats.vertices>6500||stats.triangles>9000)
  throw Error('V19_MOBILE_GEOMETRY_BUDGET');
 stats.triangles=Math.round(stats.triangles);return {objects:objs,stats};
}
async function ensureNightfall(){
 if(window.__HF_SKIN_STUDIO_V10__.state().mounted)return;
 $('bodyForgeLoad').click();
 for(let i=0;i<130;i++){
  if(window.__HF_SKIN_STUDIO_V10__.state().mounted)return;
  await new Promise(r=>setTimeout(r,100));
 }
 throw Error('V19_MUST_HAVE_NATIVE_NIGHTFALL_3D');
}
async function wear(){
 if(parent)return {alreadyMounted:true,...infos};
 if(busy)throw Error('V19_WORK_IN_PROGRESS');busy=true;
 try{
  await ensureNightfall();const actor=native();
  const bytes=await fetchGlb(filename);
  if(bytes.byteLength<9000||bytes.byteLength>5_000_000)throw Error('V19_OVERLAY_BINARY_BUDGET');
  const decoded=await new GLTFLoader().parseAsync(bytes.slice(0),'');
  const checked=audit(decoded);
  const bindings=checked.objects.map(mesh=>{
   const sk=mesh.skeleton,actual=sk.bones.map(b=>actor.bones.get(b.name));
   if(actual.some(x=>!x))throw Error('V19_WRONG_ORIGINAL_BONE_'+mesh.name);
   if(sk.boneInverses.length!==actual.length)throw Error('V19_INVALID_INVERSE_BIND_COUNT');
   return {mesh,skeleton:new THREE.Skeleton(actual,sk.boneInverses.map(i=>i.clone())),
    bind:mesh.bindMatrix.clone()};
  });
  const holder=new THREE.Group();holder.name='HF_V19_NEW_GEOMETRY_RIG_MEDIUM';
  actor.actor.add(holder);actor.actor.updateMatrixWorld(true);decoded.scene.updateMatrixWorld(true);
  for(const b of bindings){
   holder.attach(b.mesh);b.mesh.bind(b.skeleton,b.bind);b.mesh.frustumCulled=false;
  }
  parent=holder;all=bindings.map(b=>b.mesh);byteCache=bytes;
  infos={...checked.stats,authenticRig:true,sourceJointCount:actor.bones.size,
   geometryOriginal:true,visualArtistApproved:false};
  sync();status('V19 NUEVA armadura 3D montada: '+infos.meshes+' mallas / '+
   infos.vertices+' vértices / '+infos.triangles+' triángulos. Peso y animación: Rig_Medium original. '+
   'Inspección visual y clipping pendientes.');
  return {...infos};
 }finally{busy=false}
}
function remove(){
 if(parent)parent.removeFromParent();parent=null;all=[];byteCache=null;infos=null;
 window.__HF_V19_SCENE__.render();status('Ornamentos V19 retirados. Nightfall y el Hunter original quedan intactos.');
}
function inspect(){
 if(!parent)throw Error('V19_EQUIP_FIRST');
 const a=native(),mapped=all.every(mesh=>mesh.skeleton.bones.every(b=>a.bones.get(b.name)===b));
 if(!mapped)throw Error('V19_NONNATIVE_BONE');
 const result={...infos,mapped,gender:gender(),visible:sync().visible,
  originalOnly:true,weightedNewGeometry:true,compatibleInStudio:true,unityUnverified:true,
  artisticFitApproved:false};
 status(JSON.stringify(result,null,2));return result;
}
function pose(){
 if(!parent)throw Error('V19_EQUIP_FIRST');
 const movement=window.__HF_SKIN3_FACTORY_V4__.sourceAnimation('Walking_A',.38);
 let count=0;
 for(const m of all.filter(x=>x.visible)){
  const p=new THREE.Vector3();m.getVertexPosition(0,p);
  if(![p.x,p.y,p.z].every(Number.isFinite))throw Error('V19_NONFINITE_ANIMATED_VERTEX');
  count++;
 }
 if(!count||!movement.finiteVertices)throw Error('V19_NO_REAL_POSE');
 window.__HF_SKIN3_FACTORY_V4__.sourceAnimation('Idle',.23);
 window.__HF_V19_SCENE__.render();
 status('Rig_Medium original: caminata, '+movement.animatedMeshes+
  ' mallas fuente animadas y '+count+' nuevos adornos con vértices finitos. No prueba ausencia total de clipping.');
 return {sourceClip:'Walking_A',newSkinnedMeshes:count,finite:true};
}
function download(filename,bytes){
 const u=URL.createObjectURL(new Blob([bytes],{type:'model/gltf-binary'})),a=document.createElement('a');
 a.href=u;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(u),2200);
}
async function saveOverlay(){
 if(!parent)await wear();
 download(filename,byteCache);return {bytes:byteCache.byteLength,authenticNewGeometry:true};
}
async function saveFull(){
 if(!parent)await wear();
 const bytes=await fetchGlb(fullName);
 if(bytes.byteLength<=byteCache.byteLength)throw Error('V19_COMBINED_SKINNED_GLB_INVALID');
 download(fullName,bytes);
 status('GLB COMPLETO descargado: Nightfall original + 32 mallas V19 nuevas y el Rig_Medium del archivo. '+
  'Sin mallas corporales fuente. Todavía requiere QA de importación Unity antes de integrar al juego.');
 return {bytes:bytes.byteLength,containsNightfall:true,containsV19:true,unityCertified:false};
}
const action=f=>async()=>{try{return await f()}catch(e){status('V19: '+e);return null}};
$('hf19Wear').onclick=action(wear);$('hf19Off').onclick=action(remove);
$('hf19Overlay').onclick=action(saveOverlay);$('hf19Full').onclick=action(saveFull);
$('hf19Inspect').onclick=action(inspect);$('hf19Pose').onclick=action(pose);
$('gender').addEventListener('change',()=>{if(parent)sync()});
window.__HF_LEGENDARY_V19__=Object.freeze({state:()=>({ready:true,mounted:!!parent,
 ...infos,sex:gender(),originalHunterUntouched:true,arbitraryTextImageTo3D:false,
 noClipCertified:false,physicalSamsungVerified:false}),
 wear,remove,inspect,pose,saveOverlay,saveFull,sync});
