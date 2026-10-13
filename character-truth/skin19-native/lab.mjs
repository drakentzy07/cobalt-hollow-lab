import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {KTX2Loader} from 'three/addons/loaders/KTX2Loader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {MeshoptDecoder} from 'https://cdn.jsdelivr.net/npm/meshoptimizer@0.23.0/meshopt_decoder.module.js';

const SOURCE='https://raw.githubusercontent.com/drakentzy07/cobalt-hollow-lab/highfly-skin7-live-preview-site/skin7-paladin-compare-lab/assets/warrior_modular.glb';
const ECLIPSE='https://raw.githubusercontent.com/drakentzy07/cobalt-hollow-lab/highfly-skin19-native-eclipse-assets/skin19/assets/HF19-ECLIPSE-NATIVE-PALADIN-22-CLIPS.glb';
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
const state={root:null,mixer:null,clips:[],action:null,rig:null,mode:'original',overlay:[],
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
 if(!['base','original','eclipse'].includes(mode))return;
 state.mode=mode;
 let nativeBody=0,originalArmor=0,eclipseCount=0;
 state.root.traverse(o=>{
  if(!o.isMesh)return;
  // Reforged Paladin children retain original mesh datablock names.
  // Never count them as native suit renderers during mode switches.
  if(state.overlay.includes(o)){o.visible=false;return}
  const family=rootArmorFamily(o);
  const slot=maleNames.has(o.name);
  if(slot){o.visible=true;nativeBody++}
  else if(family){o.visible=mode==='original'&&family===state.family;if(o.visible)originalArmor++}
  else{o.visible=false}
 });
 for(const obj of state.overlay){obj.visible=mode==='eclipse';if(obj.visible)eclipseCount++}
 for(const id of ['base','original','eclipse'])$('#'+id).classList.toggle('active',id===mode);
 status.textContent='✅ ClaudeCraft ORIGINAL | '+nativeBody+' partes corporales | Armadura nativa '+state.family+': '+(mode==='original'?originalArmor+' render meshes':'apagada')+
 ' | Eclipse: '+(mode==='eclipse'?eclipseCount+' primitivas skinned':'apagado')+' | '+state.clips.length+' movimientos | '+(mode==='eclipse'?'NUEVA ARMADURA NATIVA EN REVISIÓN':'ARMADURA NATIVA');
 window.HIGHFLY_SKIN19={ready:true,mode,nativeBody,originalArmorMeshes:originalArmor,
  newArmorPrimitives:state.overlay.length,newArmorSlots:state.armorSlots,nativeSourcePaladinReused:true,legacyExperimentsAvailable:false,availableNativeFamilies:state.originalFamilies,nativeFamily:state.family,clips:state.clips.length,
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
function addNewArmor(gltf,nativeBones){
 const byName=new Map(nativeBones.map(b=>[b.name,b]));
 const extras=[];const unique=new Set();
 gltf.scene.updateMatrixWorld(true);state.root.updateMatrixWorld(true);
 // Blender glTF export keeps object nodes as HF19_PALADIN_* but can
 // name child skinned material primitives after ORIGINAL mesh datablocks,
 // e.g. Armor_paladin_Head002_1. Both refer to the SAME source-derived suit.
 function slotFromSkinnedNode(o){
  for(let p=o;p;p=p.parent){
   const name=p.name||'';
   const authored=name.match(/^HF19_PALADIN_(HEAD|CHEST|ARML|ARMR|HANDL|HANDR|LEGL|LEGR|FOOTL|FOOTR|BACK)(?:_|$)/);
   if(authored)return authored[1];
   const native=name.match(/^Armor_paladin_(Head|Chest|ArmL|ArmR|HandL|HandR|LegL|LegR|FootL|FootR|Back)00[0-9](?:_|$)/);
   if(native)return native[1].toUpperCase();
  }
  return null;
 }
 gltf.scene.traverse(o=>{
  if(!o.isSkinnedMesh)return;
  const slot=slotFromSkinnedNode(o);
  if(!slot)return;
  extras.push(o);unique.add(slot);
 });
 if(unique.size!==11||extras.length<11)throw Error('GLB Eclipse nativo incompleto: '+unique.size+' slots / '+extras.length+' mallas; skinned='+JSON.stringify((()=>{const found=[];gltf.scene.traverse(o=>{if(o.isSkinnedMesh)found.push(o.name)});return found.slice(0,35)})()));
 for(const o of extras){
  const original=o.skeleton;
  const remapped=original.bones.map(b=>byName.get(b.name));
  if(remapped.some(b=>!b)||original.boneInverses.length!==remapped.length)
    throw Error('La nueva armadura no coincide con los huesos del Hunter original: '+o.name);
  const m=new THREE.Skeleton(remapped,original.boneInverses.map(x=>x.clone()));
  state.root.attach(o);o.bind(m,o.bindMatrix.clone());
  o.frustumCulled=false;o.visible=false;
  state.overlay.push(o);
 }
 state.armorSlots=unique.size;
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
     const slot=rootArmorName(o).match(/^Armor_paladin_(HEAD|CHEST|ARML|ARMR|HANDL|HANDR|LEGL|LEGR|FOOTL|FOOTR|BACK)(?:$|_)/i)?.[1];
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
  // Keep real ClaudeCraft intact. Our new suit derives from source Paladin skinned meshes.
  // The old bodypaint/minion GLBs do not load in this lab.
  try{
   const experimental=await loader.loadAsync(ECLIPSE);
   if(experimental.animations.length!==22)throw Error('El GLB experimental cambió las 22 animaciones');
   addNewArmor(experimental,bones);
  }catch(e){
   status.textContent='Paladín ORIGINAL disponible. Eclipse de Paladín nativo no cargó: '+e.message;
   window.HIGHFLY_SKIN19_LOAD_ERROR=e.message;
   console.error('HF19_OVERLAY_LOAD',e.message);
   // Base remains available even if the experimental overlay fails.
  }
  const picker=$('#clip');picker.replaceChildren();
  state.clips.forEach((c,i)=>{const o=document.createElement('option');o.value=String(i);o.textContent=c.name;picker.append(o)});
  const exactIdle=state.clips.findIndex(c=>c.name==='Idle');
  const genericIdle=state.clips.findIndex(c=>/^Idle($|_)/i.test(c.name));
  picker.value=String(exactIdle>=0?exactIdle:Math.max(0,genericIdle));
  state.ready=true;
  for(const id of ['original','base','eclipse','nativeArmor','clip','pause','focus','rotate','speed'])$('#'+id).disabled=false;
  if(state.overlay.length===0)$('#eclipse').disabled=true;
  switchAnimation(Number(picker.value));selectView('original');fit();
  window.HIGHFLY_SKIN19.sourceVariantMeshesHidden=removed;
  window.HIGHFLY_SKIN19.nativeArmorRendererCount=armorMeshes;
 }catch(e){
  status.textContent='❌ No se pudo cargar el ClaudeCraft auténtico: '+e.message;
  console.error('SKIN17',e);
 }
}
for(const key of ['original','base','eclipse'])$('#'+key).onclick=()=>selectView(key);
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