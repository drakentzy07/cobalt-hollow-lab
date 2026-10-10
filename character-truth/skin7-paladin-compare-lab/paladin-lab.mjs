import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {KTX2Loader} from 'three/addons/loaders/KTX2Loader.js';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';
import {MeshoptDecoder} from '../v20/vendor/meshopt_decoder.module.js';
const $=id=>document.getElementById(id);
const status=text=>{$('status').textContent=text};
const BASE_URL='./assets/warrior_modular.glb';
const FORGE_URL='./assets/PALADIN-HIGHFLY-SOURCE-REFORGE-11-PARTS.glb';
const SOURCE_BLOB='e3fb52b8e064ab3927f3bc34a5ba7d04e8d701c2';
const CORE=['Head','Torso','ArmL','ArmR','HandL','HandR','LegL','LegR','FootL','FootR'];
const SLOTS=['Head','Chest','ArmL','ArmR','HandL','HandR','LegL','LegR','FootL','FootR','Back'];
const ARMOR=SLOTS.map(s=>'Armor_paladin_'+s);
const expectedBones=['root','hips','spine','chest','upperarm.l','upperarm.r','head','handslot.r','handslot.l'];
const renderer=new THREE.WebGLRenderer({canvas:$('viewport'),antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
renderer.setClearColor(0x101725);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.26;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x111927);
scene.fog=new THREE.Fog(0x111927,9,20);
const camera=new THREE.PerspectiveCamera(36,1,.06,80);
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.dampingFactor=.09;
controls.target.set(0,1.05,0);
controls.minDistance=2.4;controls.maxDistance=16;
controls.maxPolarAngle=Math.PI*.78;
scene.add(new THREE.HemisphereLight(0xd9e9ff,0x293951,2.1));
const sun=new THREE.DirectionalLight(0xffe5bd,3.0);sun.position.set(4,7,6);scene.add(sun);
const fill=new THREE.DirectionalLight(0x66beff,1.4);fill.position.set(-6,3,-4);scene.add(fill);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(80,80),new THREE.MeshStandardMaterial({color:0x182435,roughness:1}));
floor.rotation.x=-Math.PI/2;floor.position.y=-.12;scene.add(floor);
const marks=new THREE.GridHelper(70,70,0x425773,0x283447);marks.position.y=-.11;scene.add(marks);
const loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder);
// The AUTHENTIC source Hunter GLB uses KHR_texture_basisu / KTX2. Reuse V20's
// preinstalled official Basis transcoder; without it original models CANNOT load.
const ktx2=new KTX2Loader().setTranscoderPath('../v20/vendor/three/examples/jsm/libs/basis/');
ktx2.detectSupport(renderer);loader.setKTX2Loader(ktx2);
const state={actors:[],gltf:null,forge:null,clip:null,playing:true,speed:1,view:'all',gender:'M',t:0,custom:null,assetsReady:false};
function skinned(mesh){return !!mesh?.isSkinnedMesh&&mesh.skeleton?.bones?.length>0}
function namedBones(actor){
 // Strict authority: the original KayKit M_Torso SKIN joint palette is the true
 // 23-bone animation skeleton. Counting every Bone scene node mistakenly includes
 // auxiliary bones emitted for the many unrelated modular parts in the full source.
 const witness=actor.getObjectByName('M_Torso');
 if(!witness?.isSkinnedMesh||!witness.skeleton)throw Error('No existe el cuerpo modular M_Torso con skin nativo');
 const list=witness.skeleton.bones,m=new Map();
 for(const joint of list){if(m.has(joint.name))throw Error('Skin contiene hueso repetido: '+joint.name);m.set(joint.name,joint)}
 if(list.length!==23||m.size!==23||expectedBones.some(n=>!m.has(n)))
  throw Error('Rig_Medium del torso no tiene los 23 huesos originales. Recibidos '+list.length+': '+list.map(x=>x.name).join(','));
 return m;
}
function actorSource(){
 const sceneRoot=cloneSkeleton(state.gltf.scene);
 const bones=namedBones(sceneRoot);const rig=sceneRoot.getObjectByName('Rig_Medium');
 if(!rig)throw Error('No se encontró Rig_Medium');
 sceneRoot.traverse(o=>{if(o.isMesh){o.visible=false;o.frustumCulled=false}});
 return {root:sceneRoot,bones,rig,mixer:new THREE.AnimationMixer(sceneRoot)};
}
function selectParts(actor,variant,gender){
 const set=new Set(CORE.map(s=>gender+'_'+s));
 if(variant==='base')set.add(gender+'_Loin');
 if(gender==='F')set.add('F_Top');
 if(variant==='original')for(const n of ARMOR)set.add(n);
 actor.root.traverse(o=>{if(o.isMesh&&!o.userData.skin7Commission) {
  o.visible=set.has(o.name);
  o.frustumCulled=false;
 }});
 return set;
}
function normalizeSource(m,donor,actor){
 if(!skinned(m))throw Error('La pieza reforjada carece de pesos reales: '+m.name);
 const src=m.skeleton;
 const names=src.bones.map(b=>b.name);
 const bones=names.map(n=>actor.bones.get(n));
 if(bones.some(b=>!b)||src.boneInverses.length!==bones.length)throw Error('La reforja no coincide con los huesos nativos');
 const bind=m.bindMatrix.clone();
 const mapped=new THREE.Skeleton(bones,src.boneInverses.map(x=>x.clone()));
 actor.root.updateMatrixWorld(true);donor.updateMatrixWorld(true);
 actor.root.attach(m);
 m.bind(mapped,bind);
 m.frustumCulled=false;return m;
}
function equipGlb(actor,g,expectedPrefix,tag,strict=true){
 const meshes=[];g.scene.traverse(o=>{if(skinned(o)&&o.name.startsWith(expectedPrefix))meshes.push(o)});
 if(strict&&meshes.length!==11)throw Error('La armadura reforjada debe tener exactamente 11 piezas nativas; encontradas '+meshes.length);
 const found=new Set(meshes.map(m=>m.name));
 if(strict)for(const part of SLOTS)if(![...found].some(name=>name.toUpperCase().includes('_'+part.toUpperCase())))throw Error('Falta slot '+part);
 for(const m of meshes){m.userData.skin7Commission=true;normalizeSource(m,g.scene,actor);m.visible=true}
 actor.overlays??=[];actor.overlays.push({tag,meshes});
 return meshes;
}
function clearOverlays(actor,tag){
 for(const o of actor.overlays||[])if(o.tag===tag){for(const mesh of o.meshes)mesh.removeFromParent()}
 actor.overlays=(actor.overlays||[]).filter(o=>o.tag!==tag);
}
const stagePositions=[-2.55,0,2.55];
function showStation(v){
 state.view=v;const compare=v==='all';
 for(let i=0;i<state.actors.length;i++){
  const actor=state.actors[i],visible=compare||v===['base','original','reforged'][i]||v==='commission'&&i===2;
  actor.root.visible=visible;
  actor.root.position.x=compare?stagePositions[i]:0;
 }
 $('actorLabels').style.display=compare?'grid':'none';
 for(const b of $('stations').querySelectorAll('button'))b.classList.toggle('active',b.id===v);
 $('workshop').hidden=v!=='commission';
 camera.position.set(compare?1.7:1.8,2.4,compare?11.4:4.5);
 controls.target.set(0,1.05,0);controls.update();
}
function selectClip(name,atTime=0){
 const clip=state.gltf.animations.find(x=>x.name===name);
 if(!clip)throw Error('Clip original no encontrado: '+name);
 state.clip=name;state.t=atTime;
 for(const a of state.actors){
  a.mixer.stopAllAction();a.mixer.setTime(0);
  const action=a.mixer.clipAction(clip);action.reset().play();
  action.setLoop(THREE.LoopRepeat,Infinity);
  a.mixer.setTime(atTime);
 }
 $('stats').textContent='Rig_Medium · 23 huesos · 22 movimientos originales · '+name+' · 3 actores sincronizados. Solo QA visual, sin físicas de gameplay.';
}
function clocked(){
 const now=performance.now();
 if(!clocked.last)clocked.last=now;
 const dt=Math.min((now-clocked.last)/1000,.1);clocked.last=now;
 if(state.playing&&state.actors.length){
  for(const actor of state.actors)actor.mixer.update(dt*state.speed);
  state.t+=dt*state.speed;
 }
 controls.update();
 const w=$('viewer').clientWidth,h=$('viewer').clientHeight;
 if(w&&h){
  const ww=Math.round(w*renderer.getPixelRatio()),hh=Math.round(h*renderer.getPixelRatio());
  if(renderer.domElement.width!==ww||renderer.domElement.height!==hh){
   renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  }
  renderer.render(scene,camera);
 }
 requestAnimationFrame(clocked);
}
requestAnimationFrame(clocked);
function materialFix(actor){
 // Restore original PBR model colors if source material has tint; no overlay paint.
 actor.root.traverse(o=>{if(o.isSkinnedMesh)o.frustumCulled=false});
}
async function load(){
 status('Descargando Hunter original y reforja real…');
 const [gltf,forge]=await Promise.all([loader.loadAsync(BASE_URL),loader.loadAsync(FORGE_URL)]);
 // ClaudeCraft ships 247 variant meshes; preserve only the requested body M/F and
 // 11 original Paladin armor meshes. Remove unused variants BEFORE THREE scene
 // cloning or GPU update: 3 actors must remain light enough for mobile.
 const retained=new Set([...ARMOR,...CORE.flatMap(n=>['M_'+n,'F_'+n]),
   'M_Loin','F_Loin','F_Top']);
 const obsolete=[];gltf.scene.traverse(o=>{if(o.isMesh&&!retained.has(o.name))obsolete.push(o)});
 for(const o of obsolete)o.removeFromParent();
 state.gltf=gltf;state.forge=forge;
 if(gltf.animations.length!==22||forge.animations.length!==22)throw Error('Los 22 movimientos auténticos no coinciden');
 if(!gltf.scene.getObjectByName('Armor_paladin_Head'))throw Error('Faltan las piezas originales del Paladín');
 if(!forge.scene.getObjectByName('HF7RF_PALADIN_HEAD'))throw Error('Falta casco Paladín reforjado');
 for(let i=0;i<3;i++){
  const actor=actorSource();actor.variant=['base','original','reforged'][i];
  selectParts(actor,actor.variant,state.gender);
  if(i===2){actor.recipeMeshes=equipGlb(actor,forge,'HF7RF_PALADIN_','recipe',true);}
  materialFix(actor);scene.add(actor.root);state.actors.push(actor);
 }
 const select=$('animation');select.replaceChildren();
 for(const clip of gltf.animations){
  const option=document.createElement('option');option.value=clip.name;option.textContent=clip.name.replaceAll('_',' ');
  select.append(option);
 }
 select.value='Idle';
 selectClip('Idle');
 showStation('all');state.assetsReady=true;
 status('✅ Tres Hunter auténticos preparados · Paladín original y reforja · 22 movimientos sincronizados.');
 window.__HF_SKIN7_LAB__=Object.freeze({
  state:()=>({ready:true,actors:state.actors.length,clip:state.clip,gender:state.gender,sourceBlobSha1:SOURCE_BLOB,
   rig:'Rig_Medium',nativeBones:23,clips:state.gltf.animations.map(a=>a.name),
   gameDeployment:false,gameMechanicsSimulated:false,customAssetLoaded:!!state.custom}),
  selectClip,showStation,selectGender,addCustomGlb:importCustom,poseTime:t=>{
   state.playing=false;for(const a of state.actors)a.mixer.setTime(t);state.t=t;
  }
 });
}
function selectGender(g){
 if(!['M','F'].includes(g))throw Error('Género inválido');
 state.gender=g;
 for(const a of state.actors){
  selectParts(a,a.variant,g);
  for(const x of a.overlays||[])for(const m of x.meshes)m.visible=true;
 }
 $('gender').value=g;
}
async function importCustom(buffer){
 if(buffer.byteLength<15000||buffer.byteLength>12e6)throw Error('GLB fuera del límite seguro');
 const gltf=await loader.parseAsync(buffer,'');
 const actor=state.actors[2];const data=gltf.scene;
 const list=[];data.traverse(o=>{if(skinned(o)&&o.name.startsWith('HF7RF_'))list.push(o)});
 if(!list.length||list.length>85)throw Error('GLB sin mallas de forja HF7RF_ válidas');
 // Atomic: validate BEFORE swapping displayed candidates
 const mapping=list.map(m=>m.skeleton.bones.map(b=>actor.bones.get(b.name)));
 if(mapping.some(arr=>arr.some(x=>!x)))throw Error('GLB incompatible con los huesos originales');
 clearOverlays(actor,'custom');clearOverlays(actor,'recipe');
 for(const m of list){m.userData.skin7Commission=true;normalizeSource(m,data,actor);m.visible=true}
 actor.overlays??=[];actor.overlays.push({tag:'custom',meshes:list});
 state.custom={parts:list.length,bytes:buffer.byteLength};
 selectParts(actor,'reforged',state.gender);showStation('commission');
 $('order').textContent='✅ GLB de candidato cargado en el Hunter auténtico: '+list.length+' mallas skinned. Revisá cada animación. NO se integró al juego.';
 return state.custom;
}
$('gender').onchange=e=>selectGender(e.target.value);
$('animation').onchange=e=>selectClip(e.target.value);
$('play').onclick=()=>{state.playing=!state.playing;$('play').textContent=state.playing?'⏸ Pausar':'▶ Reproducir'};
$('step').onclick=()=>{state.playing=false;$('play').textContent='▶ Reproducir';state.t+=1/30;for(const a of state.actors)a.mixer.setTime(state.t)};
$('speed').oninput=e=>state.speed=Number(e.target.value);
for(const v of ['all','base','original','reforged','commission'])$(v).onclick=()=>showStation(v);
$('front').onclick=()=>{camera.position.set(0,1.75,state.view==='all'?11.4:4.5);controls.target.set(0,1.05,0)};
$('side').onclick=()=>{camera.position.set(state.view==='all'?11.4:4.5,1.8,0);controls.target.set(0,1.05,0)};
$('back').onclick=()=>{camera.position.set(0,1.75,state.view==='all'?-11.4:-4.5);controls.target.set(0,1.05,0)};
$('reset').onclick=()=>showStation(state.view);
$('reference').onchange=async e=>{
 const f=e.target.files?.[0];if(!f)return;
 if(f.size>8e6||!['image/png','image/jpeg','image/webp'].includes(f.type)){status('Referencia inválida: máximo 8 MB PNG/JPG/WEBP');return}
 if($('referencePreview').dataset.url)URL.revokeObjectURL($('referencePreview').dataset.url);
 const url=URL.createObjectURL(f);$('referencePreview').dataset.url=url;$('referencePreview').src=url;$('referencePreview').style.display='block';
 $('order').textContent='Referencia local cargada. Adjuntala también en nuestro chat: la página no transmite automáticamente fotos a ChatGPT.';
};
$('customGlb').onchange=async e=>{try{const f=e.target.files?.[0];if(f)await importCustom(await f.arrayBuffer())}catch(err){status('❌ '+err.message)}finally{e.target.value=''}};
$('clearCustom').onclick=()=>{const actor=state.actors[2];clearOverlays(actor,'custom');
 for(const mesh of actor.recipeMeshes||[]){actor.root.add(mesh);mesh.visible=true}
 actor.overlays??=[];actor.overlays.push({tag:'recipe',meshes:actor.recipeMeshes||[]});
 state.custom=null;selectParts(actor,'reforged',state.gender);$('order').textContent='Reforja experimental original restaurada. Ninguna armadura publicada.'};
function orderText(){
 const t=$('prompt').value.trim();
 if(t.length<12)throw Error('Describí qué querés modificar o fabricar (mínimo 12 caracteres).');
 return 'HIGHFLY SKIN7 · ENCARGO PARA GUINE\nBase: armadura Paladín original ClaudeCraft 0.44.0, Rig_Medium 23 huesos, once mallas en siete slots.\nPedido: '+t+
  '\nFoto adjunta: '+($('reference').files?.[0]?.name||'no adjuntada')+
  '\nReglas: reutilizar piezas nativas, fabricar cambios verdaderos con Blender, nueva receta versionada, evitar overlay Nightfall, conservar 22 movimientos originales, mostrar QA visual M/F, NO publicar gameplay ni aprobar arte sin revisar.';
}
$('copyOrder').onclick=async()=>{try{await navigator.clipboard.writeText(orderText());$('order').textContent='✅ Encargo copiado. Pegalo en nuestro chat y adjuntá la foto allí para que pueda verla.'}catch(e){$('order').textContent='No pude copiar automáticamente: '+String(e)}};
$('saveOrder').onclick=()=>{try{const data={schema:'highfly.skin7.paladin-commission/1',prompt:orderText(),
 referenceFilename:$('reference').files?.[0]?.name||null,sourceSha:SOURCE_BLOB,
 nativeRig:'Rig_Medium',artistApproved:false,gameDeployed:false};
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='HIGHFLY-SKIN7-ENCARGO.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
 $('order').textContent='Receta descargada. Adjuntá también la imagen en nuestro chat para diseñar la armadura.'}catch(e){$('order').textContent=e.message}};
load().catch(e=>{status('❌ No se pudo iniciar el laboratorio: '+e.message);console.error(e)});
