import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {KTX2Loader} from 'three/addons/loaders/KTX2Loader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {MeshoptDecoder} from 'https://cdn.jsdelivr.net/npm/meshoptimizer@0.23.0/meshopt_decoder.module.js';

const SOURCE='https://raw.githubusercontent.com/drakentzy07/cobalt-hollow-lab/highfly-skin7-live-preview-site/skin7-paladin-compare-lab/assets/warrior_modular.glb';
const ECLIPSE='https://raw.githubusercontent.com/drakentzy07/cobalt-hollow-lab/highfly-skin16-preview-assets/skin16-atelier/assets/HF16-ECLIPSE-NATIVE-RIG-22-CLIPS.glb';
const ECLIPSE_VOLUME='https://raw.githubusercontent.com/drakentzy07/cobalt-hollow-lab/highfly-skin18-volume-preview-assets/skin18-volume/assets/HF18-ECLIPSE-REAL-VOLUME-22-CLIPS.glb';
const slots=['Head','Chest','ArmL','ArmR','HandL','HandR','LegL','LegR','FootL','FootR','Back'];
const armorNames=new Set(slots.map(x=>'Armor_paladin_'+x));
const armorFamilies=['paladin','knight','rogue','mage','druid','ranger','barbarian','warrior','shaman'];
const maleNames=new Set(['M_Head','M_Torso','M_ArmL','M_ArmR','M_HandL','M_HandR','M_LegL','M_LegR','M_FootL','M_FootR','M_Loin']);
const $=s=>document.querySelector(s);
const host=$('#view');const status=$('#status');
const scene=new THREE.Scene();scene.background=new THREE.Color(0x101928);
scene.fog=new THREE.Fog(0x101928,9,20);
const camera=new THREE.PerspectiveCamera(36,1,.03,60);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.24;
host.appendChild(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.dampingFactor=.09;
controls.enablePan=false;controls.minDistance=1.5;controls.maxDistance=14;
controls.maxPolarAngle=Math.PI*.82;
scene.add(new THREE.HemisphereLight(0xe1eaff,0x37445a,2.1));
for(const [color,intensity,pos] of [[0xffe8ca,2.9,[4,7,6]],[0x6db7ff,1.35,[-5,3,-4]]]){
 const light=new THREE.DirectionalLight(color,intensity);light.position.set(...pos);scene.add(light)
}
const floor=new THREE.GridHelper(70,70,0x425773,0x283447);
floor.position.y=-.11;scene.add(floor);
const loader=new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
const tex=new KTX2Loader().setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/libs/basis/');
tex.detectSupport(renderer);loader.setKTX2Loader(tex);
const clock=new THREE.Clock();
const state={root:null,mixer:null,clips:[],action:null,rig:null,mode:'original',overlay:[],overlay18:[],armorSlots18:0,
  baseVisible:0,armorSlots:0,originalArmorMeshes:0,originalFamilies:[],family:'paladin',angle:0,ready:false,playing:true};
function rootArmorName(o){
 let p=o;
 while(p){
  if(/^Armor_([a-z0-9]+)_(.+)$/i.test(p.name))return p.name;
  p=p.parent;
 }
 return null;
}
function rootArmorFamily(o){
 const name=rootArmorName(o);
 return name?.match(/^Armor_([a-z0-9]+)_/i)?.[1]?.toLowerCase()||null;
}
function nativeRootParts(root){
 const witness=root.getObjectByName('M_Torso');
 if(!witness?.isSkinnedMesh||!witness.skeleton)throw Error('M_Torso sin esqueleto original ClaudeCraft');
 const bones=witness.skeleton.bones;
 if(bones.length!==23)throw Error('Rig_Medium no preserva los 23 huesos originales ('+bones.length+')');
 const jointNames=new Set(bones.map(x=>x.name));
 for(const n of ['root','hips','spine','chest','head']){
  if(![...jointNames].some(x=>x.toLowerCase().replace(/[^a-z0-9]/g,'')===n))throw Error('Falta hueso original '+n);
 }
 const rig=root.getObjectByName('Rig_Medium');
 if(!rig)throw Error('Falta Rig_Medium de la fuente auténtica');
 return {bones,rig};
}
function selectView(mode){
 if(!state.ready)return;
 if(!['base','original','experiment','volume'].includes(mode))return;
 state.mode=mode;
 let nativeBody=0,originalArmor=0,experiment=0,volume=0;
 state.root.traverse(o=>{
  if(!o.isMesh)return;
  const family=rootArmorFamily(o);
  const slot=maleNames.has(o.name);
  if(slot){o.visible=true;nativeBody++}
  else if(family){o.visible=mode==='original'&&family===state.family;if(o.visible)originalArmor++}
  else{o.visible=false}
 });
 for(const obj of state.overlay){obj.visible=mode==='experiment';if(obj.visible)experiment++}
 for(const obj of state.overlay18){obj.visible=mode==='volume';if(obj.visible)volume++}
 for(const id of ['base','original','experiment','volume'])$('#'+id).classList.toggle('active',id===mode);
 status.textContent='✅ ClaudeCraft ORIGINAL | '+nativeBody+' partes corporales | Armadura nativa '+state.family+': '+(mode==='original'?originalArmor+' render meshes':'apagada')+
 ' | Eclipse anterior: '+(mode==='experiment'?experiment+' primitivas':'apagado')+' | Eclipse VOLUMEN: '+(mode==='volume'?volume+' primitivas':'apagado')+' | '+state.clips.length+' movimientos | '+(mode==='experiment'?'ARTE EXPERIMENTAL NO APROBADO':'ARMADURA NATIVA');
 window.HIGHFLY_SKIN18={ready:true,mode,nativeBody,originalArmorMeshes:originalArmor,
  volumeArmorPrimitives:state.overlay18.length,volumeArmorSlots:state.armorSlots18,
  newArmorPrimitives:state.overlay.length,newArmorSlots:state.armorSlots,availableNativeFamilies:state.originalFamilies,nativeFamily:state.family,clips:state.clips.length,
  originalRigBones:23,sourceOriginal:true,publicGameModified:false,artApproved:false};
}
function switchAnimation(index){
 if(!state.mixer)return;
 state.mixer.stopAllAction();
 state.action=state.mixer.clipAction(state.clips[index]);state.action.reset().play();
 state.mixer.timeScale=Number($('#speed').value);
 state.playing=true;$('#pause').textContent='⏸ Pausa';
}
function fit(){
 if(!state.root)return;
 state.root.updateMatrixWorld(true);
 const b=new THREE.Box3();
 for(const o of state.root.children){
  if(o.isObject3D&&o.visible)b.expandByObject(o);
 }
 if(b.isEmpty())b.setFromCenterAndSize(new THREE.Vector3(0,1,0),new THREE.Vector3(1,2,1));
 const mid=new THREE.Vector3();b.getCenter(mid);
 controls.target.set(mid.x,mid.y,mid.z);
 camera.position.set(mid.x+0.15,mid.y+0.8,mid.z+Math.max(3.2,b.getSize(new THREE.Vector3()).y*2.2));
 controls.update();floor.position.y=b.min.y-.08;
}
function addNewArmor(gltf,nativeBones,prefix,collection){
 const byName=new Map(nativeBones.map(b=>[b.name,b]));
 const extras=[];const unique=new Set();
 gltf.scene.updateMatrixWorld(true);state.root.updateMatrixWorld(true);
 gltf.scene.traverse(o=>{
  if(!o.isSkinnedMesh||!o.name.startsWith(prefix))return;
  extras.push(o);
  const m=o.name.slice(prefix.length).match(/^(Head|Chest|ArmL|ArmR|HandL|HandR|LegL|LegR|FootL|FootR|Back)(?:_|$)/);
  if(m)unique.add(m[1]);
 });
 if(unique.size!==11||extras.length<11)throw Error('GLB experimental incompleto: '+unique.size+' slots / '+extras.length+' primitivas');
 for(const o of extras){
  const original=o.skeleton;
  const remapped=original.bones.map(b=>byName.get(b.name));
  if(remapped.some(b=>!b)||original.boneInverses.length!==remapped.length)
    throw Error('La nueva armadura no coincide con los huesos del Hunter original: '+o.name);
  const m=new THREE.Skeleton(remapped,original.boneInverses.map(x=>x.clone()));
  state.root.attach(o);o.bind(m,o.bindMatrix.clone());
  o.frustumCulled=false;o.visible=false;
  collection.push(o);
 }
 return unique.size;
}
async function load(){
 try{
  status.textContent='Descargando personaje ORIGINAL ClaudeCraft (con texturas KTX2, Meshopt, 23 huesos)…';
  const original=await loader.loadAsync(SOURCE);
  if(original.animations.length!==22)throw Error('La fuente original no conserva sus 22 clips');
  const root=original.scene;
  const {bones}=nativeRootParts(root);
  let native=0,armorSlots=new Set(),armorMeshes=0,removed=0;const familyRenderers=new Map();
  const toRemove=[];
  root.traverse(o=>{
   if(!o.isMesh)return;
   if(maleNames.has(o.name)){native++;return}
   const family=rootArmorFamily(o);
   if(family){
    familyRenderers.set(family,(familyRenderers.get(family)||0)+1);
    if(family==='paladin'){
     const slot=rootArmorName(o).match(/^Armor_paladin_(Head|Chest|ArmL|ArmR|HandL|HandR|LegL|LegR|FootL|FootR|Back)(?:$|_)/i)?.[1];
     if(slot)armorSlots.add(slot);
     armorMeshes++
    }
    return;
   }
   toRemove.push(o);
  });
  if(native!==11||armorMeshes!==17)
   throw Error('La fuente original quedó incompleta: '+native+' cuerpo / '+armorMeshes+' render meshes de Paladín; esperado 11 cuerpo, 17 armadura');
  // ClaudeCraft has several multi-material primitives inside each equipment
  // group; never equate the number of renderer names with equipment slots.
  for(const item of toRemove){item.removeFromParent();removed++}
  state.originalFamilies=[...familyRenderers].filter(([,n])=>n>=6).map(([family,count])=>({family,count}));
  if(!state.originalFamilies.some(x=>x.family==='paladin'))throw Error('Paladín original ya no figura en los equipamientos');
  const wardrobe=$('#nativeArmor');wardrobe.replaceChildren();
  for(const entry of state.originalFamilies){
   const option=document.createElement('option');option.value=entry.family;
   option.textContent=entry.family.charAt(0).toUpperCase()+entry.family.slice(1)+' · '+entry.count+' piezas';
   wardrobe.append(option);
  }
  wardrobe.value='paladin';
  state.root=root;state.clips=original.animations;state.mixer=new THREE.AnimationMixer(root);
  scene.add(root);
  status.textContent='✅ Hunter auténtico cargado. Preparando armadura nueva sobre el rig existente…';
  // Restore original 11-slot armor first; then equip the experimental GLB
  // only on demand. Never use experimental body meshes.
  try{
   const experimental=await loader.loadAsync(ECLIPSE);
   if(experimental.animations.length!==22)throw Error('El GLB experimental cambió las 22 animaciones');
   state.armorSlots=addNewArmor(experimental,bones,'HF13_TRUE_NEW_MESH_',state.overlay);
  }catch(e){
   status.textContent='Paladín ORIGINAL disponible. Eclipse experimental no cargó: '+e.message;
   // Base remains available even if the experimental overlay fails.
  }
  try{
   const volumeGltf=await loader.loadAsync(ECLIPSE_VOLUME);
   if(volumeGltf.animations.length!==22)throw Error('SKIN18 no conserva 22 clips');
   state.armorSlots18=addNewArmor(volumeGltf,bones,'HF18_VOLUME_SOLID_',state.overlay18);
  }catch(e){
   status.textContent='ClaudeCraft original y Paladín disponibles. La nueva SKIN18 aún no carga: '+e.message;
   console.error('SKIN18_VOL_LOAD',e);
  }
  const picker=$('#clip');picker.replaceChildren();
  state.clips.forEach((c,i)=>{const o=document.createElement('option');o.value=String(i);o.textContent=c.name;picker.append(o)});
  const exactIdle=state.clips.findIndex(c=>c.name==='Idle');
  const genericIdle=state.clips.findIndex(c=>/^Idle($|_)/i.test(c.name));
  picker.value=String(exactIdle>=0?exactIdle:Math.max(0,genericIdle));
  state.ready=true;
  for(const id of ['original','base','experiment','volume','nativeArmor','clip','pause','focus','rotate','speed'])$('#'+id).disabled=false;
  if(state.overlay.length===0)$('#experiment').disabled=true;
  if(state.overlay18.length===0)$('#volume').disabled=true;
  switchAnimation(Number(picker.value));selectView('original');fit();
  window.HIGHFLY_SKIN18.sourceVariantMeshesHidden=removed;
  window.HIGHFLY_SKIN18.nativeArmorRendererCount=armorMeshes;
 }catch(e){
  status.textContent='❌ No se pudo cargar el ClaudeCraft auténtico: '+e.message;
  console.error('SKIN17',e);
 }
}
for(const key of ['original','base','experiment','volume'])$('#'+key).onclick=()=>selectView(key);
$('#nativeArmor').onchange=()=>{state.family=$('#nativeArmor').value;selectView('original')};
$('#clip').onchange=()=>switchAnimation(Number($('#clip').value));
$('#pause').onclick=()=>{state.playing=!state.playing;state.mixer.timeScale=state.playing?Number($('#speed').value):0;$('#pause').textContent=state.playing?'⏸ Pausa':'▶ Seguir'};
$('#speed').onchange=()=>{if(state.mixer&&state.playing)state.mixer.timeScale=Number($('#speed').value)};
$('#rotate').onclick=()=>{controls.autoRotate=!controls.autoRotate;$('#rotate').classList.toggle('active',controls.autoRotate)};
$('#focus').onclick=fit;
const observer=new ResizeObserver(()=>{
 const w=host.clientWidth,h=host.clientHeight;
 if(w>0&&h>0){camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h)}
});observer.observe(host);
function animate(){requestAnimationFrame(animate);if(state.mixer)state.mixer.update(Math.min(clock.getDelta(),.05));else clock.getDelta();controls.update();renderer.render(scene,camera)}
animate();load();