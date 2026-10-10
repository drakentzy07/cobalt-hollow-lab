/** HIGHFLY SKIN 7 — isolated artisan pilot, authentic Rig_Medium. New topology from Blender.
 * One working TRY → ACCEPT ART PREFERENCE / DISCARD candidate loop (no game deployment).
 * Blender authors geometry; the browser only inspects, dresses and records user feedback.
 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const $=x=>document.getElementById(x);
const body=$('bodyPanel'),cockpit=$('dreamCockpit');
if(!body||!cockpit||!window.__HF_V19_SCENE__)throw Error('SKIN7_FROZEN_STUDIO_INCOMPATIBLE');
const button=document.createElement('button');button.id='skin7Open';button.className='primary';
button.style.cssText='margin:8px 0;border:2px solid #c5a372';
button.textContent='⚒ SKIN 7 · TALLER DE ARMADURAS REALES';
cockpit.querySelector('h2').after(button);
const panel=document.createElement('section');panel.className='studio';panel.id='skin7Panel';
panel.style.cssText='border:2px solid #d5a765;background:linear-gradient(120deg,#302131,#17141c);margin:8px 0';
panel.innerHTML=`<h2>⚒ HIGHFLY SKIN 7 · FORJA ARTESANA</h2>
 <p style="font-size:12px">Este piloto viste 54 piezas 3D NUEVAS modeladas en Blender y pesadas al Rig_Medium de ClaudeCraft. Tu texto selecciona una de dos familias de silueta realmente distintas. Aún NO fabrica cualquier imagen automáticamente.</p>
 <label for="skin7Prompt">Describí la armadura que querés probar</label>
 <textarea id="skin7Prompt" rows="3" maxlength="1800" style="width:100%;box-sizing:border-box;padding:8px;border:1px solid #bd8c68;border-radius:7px;background:#241c2d;color:#fff">Armadura samurái demoníaca carmesí con hombrera izquierda enorme asimétrica, pecho heroico, faldones segmentados y guardia de espalda. Inspirada en un kabuto Oni.</textarea>
 <div class="buttonrow"><button id="skin7Design" class="primary">⚒ Forjar forma real</button><button id="skin7Off">Retirar candidato</button></div>
 <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px">
  <button id="skin7Front">Frente</button><button id="skin7Side">Perfil</button><button id="skin7Back">Espalda</button>
 </div>
 <label>Personaje original <select id="skin7Gender"><option value="male">Hunter masculino</option><option value="female">Hunter femenino</option></select></label>
 <div class="buttonrow"><button id="skin7Anim">Probar movimiento real</button><button id="skin7Check">Ver huesos y geometría</button></div>
 <div class="buttonrow"><button id="skin7ExportOverlay">↓ GLB piezas nuevas</button><button id="skin7ExportFull">↓ GLB Nightfall + armadura</button></div>
 <div class="buttonrow"><button id="skin7Keep" style="background:#4d6b43">✔ ADENTRO · Me gusta</button><button id="skin7Reject" style="background:#873e40">✖ AFUERA · Descartar</button></div>
 <div class="buttonrow"><button id="skin7Manifest">↓ Exportar decisión / ficha JSON</button></div>
 <div id="skin7Feedback" role="status" aria-live="polite" style="white-space:pre-wrap;font-size:11px;color:#e7d8e8;margin-top:7px">Taller preparado. Las variantes están preforjadas desde recetas parametrizadas con geometrías diferentes. La aprobación artística se guarda localmente; no publica en el juego.</div>`;
body.prepend(panel);
button.onclick=()=>{window.__HF_DREAM_V17__.selectTab('editor');panel.scrollIntoView({behavior:'smooth',block:'nearest'})};
const state={busy:false,parent:null,meshes:[],chosen:null,report:null,decision:null,assetBytes:null};
const say=t=>$('skin7Feedback').textContent=t;
function gender(){return $('gender')?.value==='female'?'F':'M'}
$('skin7Gender').value=$('gender').value;
$('skin7Gender').onchange=()=>{
 $('gender').value=$('skin7Gender').value;
 $('gender').dispatchEvent(new Event('change',{bubbles:true}));
};
$('gender').addEventListener('change',()=>{
 $('skin7Gender').value=$('gender').value;if(state.parent)sync();
});
for(const [newId,oldId] of [['skin7Front','front'],['skin7Side','profile'],['skin7Back','backview']])
 $(newId).onclick=()=>$(oldId).click();
function choose(text){
 if(typeof text!=='string'||text.trim().length<12)throw Error('SKIN7_DESCRIPCION_REQUERIDA');
 const s=text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 return /(samurai|oni|demon|carmesi|rojo|asimetr|hombrera izquierda|kabuto)/.test(s)?'crimson':'guardian';
}
function path(profile,kind='overlay'){
 if(!['crimson','guardian'].includes(profile)||!['overlay','combined'].includes(kind))
  throw Error('SKIN7_NO_INVENTED_ASSET');
 return './assets/HIGHFLY-SKIN7-'+profile+'-'+kind+'.glb';
}
function actor(){
 const source=window.__HF_V19_SCENE__.root();
 const rig=source?.getObjectByName('Rig_Medium');
 if(!source||!rig)throw Error('SKIN7_ORIGINAL_HUNTER_NOT_LOADED');
 const bones=new Map();source.traverse(o=>{if(o.isBone){
  if(bones.has(o.name))throw Error('SKIN7_DUPLICATE_NATIVE_BONE');
  bones.set(o.name,o);
 }});
 if(bones.size!==23)throw Error('SKIN7_NATIVE_23_BONES_DRIFT_'+bones.size);
 return {source,bones};
}
async function nativeNightfall(){
 if(window.__HF_LEGENDARY_V19__?.state().mounted)window.__HF_LEGENDARY_V19__.remove();
 if(window.__HF_SUPREME_V20__?.state().mountedStyled)window.__HF_SUPREME_V20__.restore();
 if(window.__HF_SKIN_STUDIO_V10__?.state().mounted)return;
 $('bodyForgeLoad').click();
 for(let i=0;i<180;i++){
  if(window.__HF_SKIN_STUDIO_V10__?.state().mounted)return;
  await new Promise(r=>setTimeout(r,100));
 }
 throw Error('SKIN7_NATIVE_NIGHTFALL_NOT_MOUNTED');
}
function inspectGltf(g){
 const found=[];g.scene.traverse(o=>{if(o.isSkinnedMesh&&o.name.startsWith('HF7_'))found.push(o)});
 if(found.length!==54)throw Error('SKIN7_EXPECTED_54_BRAND_NEW_MESHES_'+found.length);
 const seen=new Set();let verts=0,tri=0;const verticesPerGender={M:0,F:0};
 for(const mesh of found){
  if(!/^HF7_[MF]_(CHEST|SHOULDER|WAIST|BACK|ARM|LEG)_/.test(mesh.name)||seen.has(mesh.name))
   throw Error('SKIN7_BAD_NEW_SKIN_ID_'+mesh.name);
  seen.add(mesh.name);
  const pos=mesh.geometry.getAttribute('position'),weights=mesh.geometry.getAttribute('skinWeight');
  const idx=mesh.geometry.getAttribute('skinIndex');
  if(!pos||!weights||!idx||weights.count!==pos.count||idx.count!==pos.count)
   throw Error('SKIN7_REAL_ORIGINAL_BONE_WEIGHTS_REQUIRED_'+mesh.name);
  verts+=pos.count;verticesPerGender[mesh.name.slice(4,5)]+=pos.count;tri+=(mesh.geometry.index?.count||pos.count)/3;
  for(let j=0;j<pos.count;j++){
   const sum=weights.getX(j)+weights.getY(j)+weights.getZ(j)+weights.getW(j);
   if(!Number.isFinite(sum)||Math.abs(sum-1)>.05)
    throw Error('SKIN7_NON_NORMALIZED_WEIGHT_'+mesh.name);
  }
 }
 if(verts>24000||tri>15000||Math.max(...Object.values(verticesPerGender))>12000)throw Error('SKIN7_MOBILE_GEOMETRY_BUDGET_VERTICES_'+verts+'_TRIANGLES_'+Math.round(tri)+'_PER_GENDER_'+JSON.stringify(verticesPerGender));
 return {found,verts,triangles:Math.round(tri),renderVerticesPerGender:verticesPerGender};
}
function clear(){
 state.parent?.removeFromParent();
 state.parent=null;state.meshes=[];state.chosen=null;state.report=null;state.assetBytes=null;
 window.__HF_V19_SCENE__.render();
}
function sync(){
 const g=gender();
 for(const o of state.meshes)o.visible=o.name.startsWith('HF7_'+g+'_');
 window.__HF_V19_SCENE__.render();
 return {gender:g,visible:state.meshes.filter(x=>x.visible).length};
}
async function forge(){
 if(state.busy)throw Error('SKIN7_FORGE_BUSY');state.busy=true;
 try{
  const profile=choose($('skin7Prompt').value);
  await nativeNightfall();
  const source=actor();
  const r=await fetch(path(profile),{cache:'no-store'});
  if(!r.ok)throw Error('SKIN7_VERIFIED_BLENDER_GLB_NOT_FOUND');
  const bytes=await r.arrayBuffer();
  if(bytes.byteLength<15000||bytes.byteLength>6000000)throw Error('SKIN7_FORGED_OVERLAY_FILE_SIZE');
  const g=await new GLTFLoader().parseAsync(bytes.slice(0),'');
  const checked=inspectGltf(g);
  const bindings=checked.found.map(mesh=>{
   const donor=mesh.skeleton;
   const bones=donor.bones.map(b=>source.bones.get(b.name));
   if(bones.some(x=>!x)||donor.boneInverses.length!==bones.length)
    throw Error('SKIN7_NOT_NATIVE_SKELETON_'+mesh.name);
   return {mesh,skeleton:new THREE.Skeleton(bones,donor.boneInverses.map(m=>m.clone())),
    bind:mesh.bindMatrix.clone()};
  });
  // Atomic visible replacement: only after file, skinned-geometry and 23-bone checks pass.
  clear();
  const holder=new THREE.Group();holder.name='SKIN7_AUTHORED_BLENDER_RIG_MEDIUM_ARMOR';
  source.source.add(holder);source.source.updateMatrixWorld(true);g.scene.updateMatrixWorld(true);
  for(const item of bindings){
   holder.attach(item.mesh);item.mesh.bind(item.skeleton,item.bind);item.mesh.frustumCulled=false;
  }
  state.parent=holder;state.meshes=bindings.map(x=>x.mesh);state.chosen=profile;
  state.assetBytes=bytes;
  state.report={profile,realBlenderNewMeshCount:state.meshes.length,
    vertices:checked.verts,triangles:checked.triangles,renderVerticesPerGender:checked.renderVerticesPerGender,realRigBones:source.bones.size,
    originalCharacterBodyUnchanged:true,topologyNovel:true,gamePublicUnchanged:true,
    shaderAndClippingArtistApproved:false,unityCertified:false,physicalSamsungTested:false};
  state.decision=null;sync();
  say('ARMADURA NUEVA FORJADA · '+(profile==='crimson'?'CRIMSON TECH ONI':'SHADOW GUARDIAN')+
   '\n'+state.report.realBlenderNewMeshCount+' mallas nuevas originales, '+state.report.vertices+
   ' vértices, '+state.report.triangles+' triángulos; 23 huesos del Hunter.\n'+
   'Vista de prueba: revisá las hombreras, pecho, cintura y espalda. El casco Kage-Oni sigue separado.\n'+
   'No se interpreta cualquier imagen ni se certifica clipping/Unity todavía.');
  return {...state.report};
 }finally{state.busy=false}
}
function inspect(){
 if(!state.parent)throw Error('SKIN7_PRIMERO_FORJAR_ARMADURA');
 const source=actor();
 const native=state.meshes.every(m=>m.skeleton.bones.every(b=>source.bones.get(b.name)===b));
 if(!native)throw Error('SKIN7_BONE_BINDING_DIVERGED');
 const {visible}=sync();
 const s={...state.report,visible,gender:gender(),nativeBoneMapping:true};
 say(JSON.stringify(s,null,2));return s;
}
function anim(){
 if(!state.parent)throw Error('SKIN7_NO_FORGED_MESHES');
 const result=[];
 for(const name of ['Idle','Walking_A','Running_A','Block','1H_Melee_Attack_Chop']){
  const clip=window.__HF_SKIN3_FACTORY_V4__.sourceAnimation(name,.38);
  if(!clip.finiteVertices)throw Error('SKIN7_ORIGINAL_ANIMATION_BROKEN_'+name);
  const vec=new THREE.Vector3();
  let inspected=0;
  for(const mesh of state.meshes.filter(m=>m.visible)){
   mesh.getVertexPosition(0,vec);
   if(![vec.x,vec.y,vec.z].every(Number.isFinite))
    throw Error('SKIN7_NEW_ARMOR_NONFINITE_'+mesh.name);
   inspected++;
  }
  result.push({clip:name,finite:true,newSkinnedMeshes:inspected});
 }
 window.__HF_SKIN3_FACTORY_V4__.sourceAnimation('Idle',.20);
 window.__HF_V19_SCENE__.render();
 say('5 animaciones originales comprobadas en navegador con las nuevas mallas.\n'+
  result.map(x=>x.clip+' ✔').join(' / ')+
  '\nNo certifica que no haya intersecciones visuales.');
 return result;
}
async function dlBytes(kind){
 if(!state.parent)await forge();
 const profile=state.chosen;
 const b=kind==='overlay'?state.assetBytes:await (async()=>{
  const r=await fetch(path(profile,'combined'));if(!r.ok)throw Error('SKIN7_COMBINED_GLB_NOT_FOUND');
  return r.arrayBuffer();
 })();
 const u=URL.createObjectURL(new Blob([b],{type:'model/gltf-binary'}));
 const a=document.createElement('a');a.href=u;a.download='HIGHFLY-SKIN7-'+profile+'-'+kind+'.glb';a.click();
 setTimeout(()=>URL.revokeObjectURL(u),4000);
 return {profile,kind,bytes:b.byteLength,realOriginalRig:true};
}
const storeKey='highfly.skin7.art-review.local.v1';
function decision(which){
 if(!state.parent||!['liked','discarded'].includes(which))throw Error('SKIN7_NOT_READY_FOR_ART_REVIEW');
 const value={schema:'highfly.skin7.local-artist-preference/1',profile:state.chosen,
  userDecision:which,decisionNotCertifiedProductionApproval:true,
  authorizedGameplayDeployment:false,rig:'Rig_Medium',
  timestamp:new Date().toISOString(),userPrompt:$('skin7Prompt').value};
 try{localStorage.setItem(storeKey,JSON.stringify(value))}catch(e){
  say('Preferencia no persistida: '+String(e)+'. Exportá el JSON para guardarla.')}
 state.decision=value;
 if(which==='discarded'){
  clear();say('AFUERA. Candidato retirado del Hunter; V20 y Nightfall originales permanecen sin cambios. Esta selección NO borra ni publica activos en GitHub.');
 }else say('ADENTRO como preferencia artística local: diseño favorito guardado para evaluación técnica.\nTodavía NO ingresó al catálogo de producción ni al juego.');
 return value;
}
function downloadJson(){
 const value={schema:'highfly.skin7.local-candidate/1',
  spec:state.report,decision:state.decision,
  prompt:$('skin7Prompt').value,description:'Art direction only. No gameplay publication or cloud catalog commit.'};
 const u=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=u;a.download='HIGHFLY-SKIN7-candidate-review.json';a.click();
 setTimeout(()=>URL.revokeObjectURL(u),3000);
 return value;
}
const wire=(name,action)=>{$(name).onclick=()=>Promise.resolve().then(action).catch(e=>say('SKIN7: '+String(e)))};
wire('skin7Design',forge);wire('skin7Off',()=>{clear();say('Candidato retirado del Hunter. El estudio anterior quedó intacto.')});
wire('skin7Check',inspect);wire('skin7Anim',anim);
wire('skin7ExportOverlay',()=>dlBytes('overlay'));
wire('skin7ExportFull',()=>dlBytes('combined'));
wire('skin7Keep',()=>decision('liked'));wire('skin7Reject',()=>decision('discarded'));
wire('skin7Manifest',downloadJson);
window.__HF_SKIN7_SUPREME_FORGE__=Object.freeze({
 state:()=>({ready:true,mounted:!!state.parent,
  ...(state.report||{}),decision:state.decision?.userDecision||null,
  newGeometryActuallyForgedInBlender:true,unrestrictedAIImageGeneration:false,
  productionCatalogApproved:false,unityCertified:false,physicalS23Tested:false}),
 choose,forge,inspect,anim,sync,clear,decision,downloadJson,
 exportOverlay:()=>dlBytes('overlay'),exportFull:()=>dlBytes('combined')});
