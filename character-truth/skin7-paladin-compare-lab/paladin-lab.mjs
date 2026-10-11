import * as THREE from 'three';
import {commissionRecipe,commissionIntensity,SLOTS as RECIPE_SLOTS} from './commission-recipe-v2.mjs';
import {parseArmorIntent,mutateArmorIntent,makeBlenderCandidate} from './skin9-armor-core.mjs';
import {buildPremiumV3,checkPremiumCandidate,legacyPrototypeVerdict,ELEVEN as PREMIUM_PIECES} from './skin10-premium-recipe-v3.mjs';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {KTX2Loader} from 'three/addons/loaders/KTX2Loader.js';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';
import {MeshoptDecoder} from '../v20/vendor/meshopt_decoder.module.js';
const $=id=>document.getElementById(id);
const status=text=>{$('status').textContent=text};
const BASE_URL='./assets/warrior_modular.glb';
const FORGE_URL='./assets/PALADIN-HIGHFLY-SOURCE-REFORGE-11-PARTS.glb';
const NEW_ARMOR_URL='./assets/HF9-ROYAL-DARK-NEW-GEOMETRY-11-PIECES.glb';
const SOURCE_BLOB='e3fb52b8e064ab3927f3bc34a5ba7d04e8d701c2';
const CORE=['Head','Torso','ArmL','ArmR','HandL','HandR','LegL','LegR','FootL','FootR'];
const SLOTS=['Head','Chest','ArmL','ArmR','HandL','HandR','LegL','LegR','FootL','FootR','Back'];
const ARMOR=SLOTS.map(s=>'Armor_paladin_'+s);
const PALADIN_SET=new Set(ARMOR);
// In genuine ClaudeCraft GLB, the 2-material Paladin Helmet/Chest/Arms/Legs
// are THREE.Group nodes with TWO nested skinned primitive meshes. Source audit:
// exactly 11 original armor equipment nodes and 17 true skinned render meshes.
// Match equip slots by the original mesh NODE / ancestry, never child primitive
// name alone. Otherwise we silently remove real armor during mobile pruning.
function originalArmorSlotOf(node){
 let cur=node;
 while(cur){
  if(PALADIN_SET.has(cur.name))return cur.name;
  cur=cur.parent;
 }
 return null;
}
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
 const canonical=name=>name.toLowerCase().replace(/[^a-z0-9]/g,'');
 if(list.length!==23||m.size!==23||expectedBones.some(n=>![...m.keys()].some(k=>canonical(k)===canonical(n))))
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
  const originalSlot=originalArmorSlotOf(o);
  // For multi-primitive armors, ORIGINAL SLOT name belongs to the container.
  o.visible=originalSlot?(variant==='original'&&set.has(originalSlot)):set.has(o.name);
  o.frustumCulled=false;
 }});
 return set;
}
function originalPaladinVisualInventory(actor){
 const slots=new Map(),meshNames=[],missing=[];
 actor.root.traverse(o=>{
  if(!o.isSkinnedMesh||!o.visible)return;
  const slot=originalArmorSlotOf(o);
  if(!slot)return;
  const parentsVisible=(()=>{
   for(let cur=o.parent;cur;cur=cur.parent){if(!cur.visible)return false}
   return true;
  })();
  if(parentsVisible){slots.set(slot,(slots.get(slot)||0)+1);meshNames.push(o.name)}
 });
 for(const slot of ARMOR)if(!slots.has(slot))missing.push(slot);
 return {slots:Object.fromEntries(slots),renderMeshes:meshNames.length,missing};
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
 // An exported authored Blender armor may have 1-3 skinned primitives per
 // original *logical slot* due to separate enamel/gold/gem materials.
 // The GLB root node has HF9NEW_PALADIN_<SLOT> but its children are primitive
 // meshes whose names don't start with HF9NEW_. Collect via real ancestry.
 const meshes=[],parts=new Set();let meshOrdinal=0;
 g.scene.traverse(o=>{
  if(!skinned(o))return;
  let node=o;
  while(node&&!node.name.startsWith(expectedPrefix))node=node.parent;
  if(!node)return;
  const part=node.name.slice(expectedPrefix.length).replace(/[._]\\d+$/,'').toUpperCase();
  parts.add(part);
  // Never confuse the previous Paladin third-actor asset with the new armor.
  if(!o.name.startsWith(expectedPrefix))o.name=node.name+'_PRIM_'+(meshOrdinal++);
  o.userData.skin9LogicalPart=part;
  meshes.push(o);
 });
 if(strict&&parts.size!==11)throw Error('El GLB debe aportar 11 PARTES skinned reales; recibió '+parts.size+
  ' grupos, '+meshes.length+' superficies de material');
 if(strict)for(const part of SLOTS)if(!parts.has(part.toUpperCase()))throw Error('Falta pieza real '+part);
 if(!meshes.length)throw Error('GLB sin mallas skinned reales');
 for(const m of meshes){m.userData.skin7Commission=true;normalizeSource(m,g.scene,actor);m.visible=true}
 actor.overlays??=[];actor.overlays.push({tag,meshes,logicalParts:parts.size});
 return meshes;
}
function clearOverlays(actor,tag){
 for(const o of actor.overlays||[])if(o.tag===tag){for(const mesh of o.meshes)mesh.removeFromParent()}
 actor.overlays=(actor.overlays||[]).filter(o=>o.tag!==tag);
}
// Fourth station LIVE skinning-safe preview: bounded deformation of the
// ELEVEN Blender-sculpted native skinned meshes, NOT a Nightfall overlay.
// This cannot substitute actual Blender topology authoring for a legendary suit.
const LIVE_DEFAULT={head:.91,chest:.97,arms:1.05,hands:.88,legs:.93,feet:.86,back:.89};
const LIVE_SLOTS={
 head:/^head/i,chest:/^chest/i,arms:/^arm/i,hands:/^hand/i,
 legs:/^leg/i,feet:/^foot/i,back:/^back/i
};
let liveStats={editedVertices:0,meshes:0,intensity:{...LIVE_DEFAULT},palette:{enamel:'#314f74',metal:'#d4a953',accent:'#70d5e6'}};
function liveMeshSlot(mesh){
 const part=mesh.name.replace(/^HF(?:7RF|9NEW)_PALADIN_/i,'');
 const slot=Object.keys(LIVE_SLOTS).find(k=>LIVE_SLOTS[k].test(part));
 if(!slot)throw Error('Pieza skinned fuera de los siete slots: '+mesh.name);
 return slot;
}
function rememberNativeMesh(mesh){
 const geom=mesh.geometry,attr=geom.attributes.position;
 if(!attr||!attr.array||!mesh.isSkinnedMesh)throw Error('No es malla original skinned');
 const original=new Float32Array(attr.array);
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<original.length;i+=3)for(let k=0;k<3;k++){
  min[k]=Math.min(min[k],original[i+k]);max[k]=Math.max(max[k],original[i+k]);
 }
 mesh.userData.skin7Base={original,center:min.map((lo,i)=>(lo+max[i])/2),slot:liveMeshSlot(mesh)};
 mesh.material=Array.isArray(mesh.material)?mesh.material.map(m=>m.clone()):mesh.material.clone();
}
function updateLiveArmor(intensity,palette){
 if(!state.assetsReady)return liveStats;
 if(state.custom)throw Error('Quitá primero el GLB importado para editar la receta nativa.');
 if(Object.keys(LIVE_DEFAULT).some(k=>!Number.isFinite(intensity[k])||intensity[k]<.15||intensity[k]>1.3))
  throw Error('Control de pieza fuera de rango');
 const colorValues=Object.values(palette);
 if(colorValues.length!==3||colorValues.some(x=>!/^#[0-9a-fA-F]{6}$/.test(x)))
  throw Error('Color fuera de rango');
 const arm=state.actors[3],meshes=arm.recipeMeshes||[];
 if(new Set(meshes.map(m=>m.userData.skin9LogicalPart)).size!==11)throw Error('El cuarto traje necesita once piezas reales, aunque cada una tenga varios materiales');
 let edited=0;
 for(const mesh of meshes){
  const base=mesh.userData.skin7Base;
  if(!base)throw Error('Geometría nativa sin captura inicial');
  const {original,center,slot}=base;
  const delta=Math.max(-.16,Math.min(.16,(intensity[slot]-LIVE_DEFAULT[slot])*.33));
  const scale=[1+delta,1+delta*.65,1+delta*.83];
  const attr=mesh.geometry.attributes.position;
  for(let i=0;i<original.length;i+=3){
   for(let k=0;k<3;k++)attr.array[i+k]=center[k]+(original[i+k]-center[k])*scale[k];
  }
  if(Math.abs(delta)>.00001)edited+=original.length/3;
  attr.needsUpdate=true;
  mesh.geometry.computeVertexNormals();
  mesh.geometry.computeBoundingSphere();
  const metal=['hands','legs','feet'].includes(slot);
  const c=new THREE.Color(metal?palette.metal:palette.enamel);
  if(slot==='head'||slot==='arms'||slot==='back')c.lerp(new THREE.Color(palette.accent),.20);
  for(const mat of (Array.isArray(mesh.material)?mesh.material:[mesh.material])){
   const n=(mat?.name||'').toUpperCase();
   if(n.includes('ROYAL_GOLD'))c.set(palette.metal);
   else if(n.includes('CRIMSON_GEM'))c.set(palette.accent);
   else if(n.includes('ROYAL_PLATE'))c.set(palette.enamel);
   if(mat?.color)mat.color.copy(c);
   mat.needsUpdate=true;
  }
 }
 liveStats={editedVertices:edited,meshes:meshes.length,logicalParts:new Set(meshes.map(m=>m.userData.skin9LogicalPart)).size,
  intensity:{...intensity},palette:{...palette},rig:'Rig_Medium',nativeMeshesOnly:true};
 return liveStats;
}
const stagePositions=[-2.55,0,2.55];
function showStation(v){
 state.view=v;const compare=v==='all',difference=v==='compare34';
 for(let i=0;i<state.actors.length;i++){
  const actor=state.actors[i];
  actor.root.visible=compare?i<3:difference?(i===2||i===3):
   v===['base','original','reforged','commission'][i];
  actor.root.position.x=compare?stagePositions[i]:
   difference?(i===2?-1.30:i===3?1.30:0):0;
 }
 $('actorLabels').style.display=compare||difference?'grid':'none';
 $('actorLabels').style.gridTemplateColumns=difference?'repeat(2,minmax(0,1fr))':'repeat(3,minmax(0,1fr))';
 $('actorLabels').innerHTML=difference?'<div class="pill"><b>3 · REFORJA ANTERIOR</b>Geometría SKIN 7</div><div class="pill"><b>4 · REY OSCURO NUEVO</b>Otra geometría · 11 piezas skinned</div>':
  '<div class="pill"><b>1 · BASE</b>Hunter original</div><div class="pill"><b>2 · CLAUDECRAFT</b>Paladín original</div><div class="pill"><b>3 · REFORJA</b>Receta experimental</div>';
 for(const b of $('stations').querySelectorAll('button'))b.classList.toggle('active',b.id===v);
 $('workshop').hidden=v!=='commission';
 camera.position.set(0,1.92,compare?11.3:difference?6.8:4.45);
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
 $('stats').textContent='Rig_Medium · 23 huesos · 22 movimientos originales · '+name+' · 4 actores y nueva cuarta armadura skinned. Solo QA visual.';
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
 const [gltf,forge,royal]=await Promise.all([loader.loadAsync(BASE_URL),loader.loadAsync(FORGE_URL),loader.loadAsync(NEW_ARMOR_URL)]);
 // ClaudeCraft ships 247 variant meshes; preserve only the requested body M/F and
 // 11 original Paladin armor meshes. Remove unused variants BEFORE THREE scene
 // cloning or GPU update: 3 actors must remain light enough for mobile.
 const retained=new Set([...ARMOR,...CORE.flatMap(n=>['M_'+n,'F_'+n]),
   'M_Loin','F_Loin','F_Top']);
 const obsolete=[];gltf.scene.traverse(o=>{
  if(o.isMesh&&!retained.has(o.name)&&!originalArmorSlotOf(o))obsolete.push(o);
 });
 for(const o of obsolete)o.removeFromParent();
 state.gltf=gltf;state.forge=forge;state.royal=royal;
 if(gltf.animations.length!==22||forge.animations.length!==22||royal.animations.length!==22)throw Error('Los 22 movimientos auténticos no coinciden');
 if(!gltf.scene.getObjectByName('Armor_paladin_Head'))throw Error('Faltan las piezas originales del Paladín');
 if(!forge.scene.getObjectByName('HF7RF_PALADIN_HEAD'))throw Error('Falta casco Paladín reforjado');
 for(let i=0;i<4;i++){
  const actor=actorSource();actor.variant=['base','original','reforged','commission'][i];
  selectParts(actor,actor.variant,state.gender);
  if(i===2)actor.recipeMeshes=equipGlb(actor,forge,'HF7RF_PALADIN_','recipe',true);
  if(i===3){
   actor.recipeMeshes=equipGlb(actor,royal,'HF9NEW_PALADIN_','recipe',true);
   for(const mesh of actor.recipeMeshes)rememberNativeMesh(mesh);
  }
  materialFix(actor);
  if(i===1){
   const visible=originalPaladinVisualInventory(actor);
   if(visible.missing.length||visible.renderMeshes!==17)
    throw Error('Paladín original incompleto: '+JSON.stringify(visible));
  }
  scene.add(actor.root);state.actors.push(actor);
 }
 const select=$('animation');select.replaceChildren();
 for(const clip of gltf.animations){
  const option=document.createElement('option');option.value=clip.name;option.textContent=clip.name.replaceAll('_',' ');
  select.append(option);
 }
 select.value='Idle';
 selectClip('Idle');
 showStation('all');state.assetsReady=true;
 status('✅ Cuatro Hunter: base, Paladín, reforja intacta y NUEVO Rey Oscuro con 22 movimientos.');
 updateLiveArmor(sliderData(),getLivePalette());
 window.__HF_SKIN7_LAB__=Object.freeze({
  state:()=>({ready:true,actors:state.actors.length,clip:state.clip,gender:state.gender,sourceBlobSha1:SOURCE_BLOB,
   rig:'Rig_Medium',nativeBones:23,clips:state.gltf.animations.map(a=>a.name),
   gameDeployment:false,gameMechanicsSimulated:false,customAssetLoaded:!!state.custom,
   originalPaladin:originalPaladinVisualInventory(state.actors[1]),
   liveCommission:liveStats,skin9Intent:skin9Current,
   independentArmor:{
    oldThirdMeshCount:state.actors[2].recipeMeshes?.length||0,
    newlyAuthoredMeshCount:state.actors[3].recipeMeshes?.length||0,
    newArmorLogicalParts:new Set(state.actors[3].recipeMeshes?.map(m=>m.userData.skin9LogicalPart)).size||0,
    oldThirdVertices:state.actors[2].recipeMeshes?.reduce((n,m)=>n+m.geometry.attributes.position.count,0)||0,
    newFourthVertices:state.actors[3].recipeMeshes?.reduce((n,m)=>n+m.geometry.attributes.position.count,0)||0,
    fourthPrefix:state.actors[3].recipeMeshes?.every(m=>m.name.startsWith('HF9NEW_PALADIN_')),
    thirdPrefix:state.actors[2].recipeMeshes?.every(m=>m.name.startsWith('HF7RF_PALADIN_')),
    sameActor:state.actors[2]===state.actors[3],
    thirdColor:state.actors[2].recipeMeshes?.[0]?.material?.color?.getHexString()||'',
    fourthColor:state.actors[3].recipeMeshes?.[0]?.material?.color?.getHexString()||''
   }
  }),
  applyCommission:(intensity,palette)=>updateLiveArmor(intensity,palette),
  selectClip,showStation,selectGender,addCustomGlb:importCustom,
  skin9:()=>({intent:skin9Current,mode:'deterministic-text-intent-preview',newTopologyGenerated:false}),
  premiumV3:()=>({blueprint:skin10Current,prototype:legacyPrototypeVerdict(),modelFromTextGenerated:false}),
  studio:()=>({styleCount:Object.keys(FACTORY_STYLES).length,saved:localDesigns.map(d=>d.name),undoDepth:undoStack.length,redoDepth:redoStack.length,cameraX:camera.position.x}),
  poseTime:t=>{
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
 const actor=state.actors[3];const data=gltf.scene;
 const list=[];data.traverse(o=>{if(skinned(o)&&o.name.startsWith('HF7RF_'))list.push(o)});
 if(!list.length||list.length>85)throw Error('GLB sin mallas de forja HF7RF_ válidas');
 // Atomic: validate BEFORE swapping displayed candidates
 const mapping=list.map(m=>m.skeleton.bones.map(b=>actor.bones.get(b.name)));
 if(mapping.some(arr=>arr.some(x=>!x)))throw Error('GLB incompatible con los huesos originales');
 clearOverlays(actor,'custom');clearOverlays(actor,'recipe');
 for(const m of list){m.userData.skin7Commission=true;normalizeSource(m,data,actor);m.visible=true}
 actor.overlays??=[];actor.overlays.push({tag:'custom',meshes:list});
 state.custom={parts:list.length,bytes:buffer.byteLength};
 selectParts(actor,'commission',state.gender);showStation('commission');
 $('order').textContent='✅ GLB de candidato cargado en el Hunter auténtico: '+list.length+' mallas skinned. Revisá cada animación. NO se integró al juego.';
 return state.custom;
}
$('gender').onchange=e=>selectGender(e.target.value);
$('animation').onchange=e=>selectClip(e.target.value);
$('play').onclick=()=>{state.playing=!state.playing;$('play').textContent=state.playing?'⏸ Pausar':'▶ Reproducir'};
$('step').onclick=()=>{state.playing=false;$('play').textContent='▶ Reproducir';state.t+=1/30;for(const a of state.actors)a.mixer.setTime(state.t)};
$('speed').oninput=e=>state.speed=Number(e.target.value);
for(const v of ['all','base','original','reforged','commission','compare34'])$(v).onclick=()=>showStation(v);
$('front').onclick=()=>{camera.position.set(0,1.75,state.view==='all'?11.4:4.5);controls.target.set(0,1.05,0)};
$('epic').onclick=()=>{const compare=state.view==='all';camera.position.set(compare?2.4:1.25,2.02,compare?11.2:4.4);controls.target.set(0,1.10,0);controls.update()};
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
$('clearCustom').onclick=()=>{const actor=state.actors[3];clearOverlays(actor,'custom');
 for(const mesh of actor.recipeMeshes||[]){actor.root.add(mesh);mesh.visible=true}
 actor.overlays??=[];actor.overlays.push({tag:'recipe',meshes:actor.recipeMeshes||[]});
 state.custom=null;selectParts(actor,'commission',state.gender);$('order').textContent='Reforja experimental original restaurada. Ninguna armadura publicada.'};
function orderText(){
 const t=$('prompt').value.trim();
 if(t.length<12)throw Error('Describí qué querés modificar o fabricar (mínimo 12 caracteres).');
 return 'HIGHFLY SKIN9 · ENCARGO PARA GUINE\nBase: armadura Paladín original ClaudeCraft 0.44.0, Rig_Medium 23 huesos, once mallas en siete slots.\nPedido: '+t+
  '\nFoto adjunta: '+($('reference').files?.[0]?.name||'no adjuntada')+
  '\nReglas: reutilizar piezas nativas, fabricar cambios verdaderos con Blender, nueva receta versionada, evitar overlay Nightfall, conservar 22 movimientos originales, mostrar QA visual M/F, NO publicar gameplay ni aprobar arte sin revisar.';
}
$('copyOrder').onclick=async()=>{try{await navigator.clipboard.writeText(orderText());$('order').textContent='✅ Encargo copiado. Pegalo en nuestro chat y adjuntá la foto allí para que pueda verla.'}catch(e){$('order').textContent='No pude copiar automáticamente: '+String(e)}};
// Source-native commission bridge. A reference photo can supply color palette,
// NEVER unverified photo-to-3D shape. Text presets are bounded starter parameters.

const FACTORY_KEY='highfly.skin8.paladin.local-presets.v1';
const FACTORY_STYLES={
 sagrado:{label:'Paladín Sagrado',intensity:{head:.9,chest:1.07,arms:1.12,hands:.89,legs:.94,feet:.89,back:1.04},palette:{enamel:'#e2dfd2',metal:'#d8af63',accent:'#60b9e9'}},
 obsidiana:{label:'Guardián Obsidiana',intensity:{head:.92,chest:1.01,arms:1.22,hands:.93,legs:1.04,feet:.97,back:1.14},palette:{enamel:'#202435',metal:'#8d929d',accent:'#a54dba'}},
 real:{label:'Cruzado Real',intensity:{head:.9,chest:1.15,arms:1.14,hands:1.0,legs:.98,feet:1.02,back:.94},palette:{enamel:'#522439',metal:'#e7b855',accent:'#f2dfb8'}},
 celestial:{label:'Centinela Celestial',intensity:{head:.83,chest:.98,arms:1.02,hands:.86,legs:.91,feet:.88,back:1.2},palette:{enamel:'#e3eaf0',metal:'#cbd6dd',accent:'#5ac7db'}},
 dragon:{label:'Juramento Dragón',intensity:{head:1.08,chest:1.1,arms:1.28,hands:1.03,legs:1.04,feet:.98,back:1.27},palette:{enamel:'#305149',metal:'#b88d53',accent:'#dc7546'}}
};
let localDesigns=[],undoStack=[],redoStack=[],lastSnapshot=null;
function factoryNotice(t){$('factoryStatus').textContent=t}
function takeSnapshot(){return {version:1,description:$('prompt').value.slice(0,1000),intensity:sliderData(),palette:getLivePalette()}}
function validateSnapshot(d){
 if(!d||d.version!==1||typeof d.description!=='string'||d.description.length>1000||
  typeof d.intensity!=='object'||!d.intensity||typeof d.palette!=='object'||!d.palette)throw Error('Archivo incompatible con SKIN 8');
 const slots=Object.keys(LIVE_DEFAULT),colors=['enamel','metal','accent'];
 if(Object.keys(d.intensity).sort().join('|')!==slots.sort().join('|') ||
    slots.some(s=>typeof d.intensity[s]!=='number'||!Number.isFinite(d.intensity[s])||d.intensity[s]<.15||d.intensity[s]>1.3) ||
    Object.keys(d.palette).sort().join('|')!==colors.sort().join('|') ||
    colors.some(s=>typeof d.palette[s]!=='string'||!/^#[0-9a-f]{6}$/i.test(d.palette[s])))
  throw Error('Receta inválida: forma o paleta fuera de límites');
 return {version:1,description:d.description,intensity:{...d.intensity},palette:{...d.palette}}
}
function restoreSnapshot(snapshot,{view=true}={}){
 const d=validateSnapshot(snapshot);
 $('prompt').value=d.description;
 renderSliders(d.intensity);
 for(const key of ['enamel','metal','accent'])$(key+'Color').value=d.palette[key];
 if(view)applyLiveControls();
}

function recordHistory(){
 const next=takeSnapshot();
 if(lastSnapshot&&JSON.stringify(next)!==JSON.stringify(lastSnapshot)){
  undoStack.push(lastSnapshot);if(undoStack.length>45)undoStack.shift();
  redoStack.length=0;
 }
 lastSnapshot=next;
 $('undoDesign').disabled=undoStack.length===0;
 $('redoDesign').disabled=redoStack.length===0;
}
function stepHistory(undo){
 const from=undo?undoStack:redoStack,to=undo?redoStack:undoStack;
 if(!from.length)return;
 to.push(takeSnapshot());
 restoreSnapshot(from.pop());
 lastSnapshot=takeSnapshot();
 $('undoDesign').disabled=undoStack.length===0;
 $('redoDesign').disabled=redoStack.length===0;
 factoryNotice((undo?'Deshecho':'Rehecho')+' · cambios visibles en la armadura nativa.');
}
function downloadJson(filename,object){
 const url=URL.createObjectURL(new Blob([JSON.stringify(object,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download=filename;a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function refreshDesignOptions(){
 const el=$('savedDesigns'),previous=el.value;el.replaceChildren();
 const o=document.createElement('option');o.value='';o.textContent=localDesigns.length?'Elegir diseño':'Sin diseños guardados';el.append(o);
 for(const d of localDesigns){const opt=document.createElement('option');opt.value=d.name;opt.textContent=d.name;el.append(opt)}
 if(localDesigns.some(x=>x.name===previous))el.value=previous;
}
function loadBrowserDesigns(){
 try{
  const saved=JSON.parse(localStorage.getItem(FACTORY_KEY)||'[]');
  if(!Array.isArray(saved)||saved.length>16)throw Error('Biblioteca local fuera de límites');
  localDesigns=saved.map(x=>{
   if(typeof x.name!=='string'||x.name.length<1||x.name.length>60)throw Error('Nombre de diseño inválido');
   return {name:x.name,snapshot:validateSnapshot(x.snapshot)};
  });
 }catch(err){localDesigns=[];factoryNotice('Biblioteca local no disponible. Podés exportar diseños a JSON. '+err.message)}
 refreshDesignOptions();
}
function persistDesigns(){
 try{localStorage.setItem(FACTORY_KEY,JSON.stringify(localDesigns));return true}
 catch(err){factoryNotice('No pude guardar en este navegador: exportá el diseño a JSON.');return false}
}
function factoryApply(style){
 const design=FACTORY_STYLES[style];if(!design)throw Error('Preset desconocido');
 restoreSnapshot({version:1,description:'Diseño de prueba: '+design.label+'. Aprobación artística pendiente.',intensity:design.intensity,palette:design.palette});
 recordHistory();factoryNotice('Variante '+design.label+' aplicada en vivo sobre 11 piezas nativas. No es una skin legendaria final.');
}
$('factoryStyles').addEventListener('click',e=>{
 const btn=e.target.closest('button[data-style]');if(!btn)return;
 try{factoryApply(btn.dataset.style)}catch(err){factoryNotice('❌ '+err.message)}
});
$('undoDesign').onclick=()=>stepHistory(true);
$('redoDesign').onclick=()=>stepHistory(false);
$('storeDesign').onclick=()=>{
 try{
  const name=$('designName').value.trim().slice(0,60);
  if(name.length<2)throw Error('Escribí un nombre de al menos dos caracteres.');
  const existing=localDesigns.findIndex(x=>x.name===name);
  if(existing<0&&localDesigns.length>=16)throw Error('Máximo 16 diseños; exportá y eliminá uno.');
  const rec={name,snapshot:validateSnapshot(takeSnapshot())};
  if(existing>=0)localDesigns[existing]=rec;else localDesigns.push(rec);
  const stored=persistDesigns();refreshDesignOptions();$('savedDesigns').value=name;
  if(stored)factoryNotice('✅ '+name+' guardado solo en este navegador.');
 }catch(err){factoryNotice('❌ '+err.message)}
};
$('loadDesign').onclick=()=>{
 try{
  const item=localDesigns.find(x=>x.name===$('savedDesigns').value);
  if(!item)throw Error('Elegí un diseño guardado.');
  restoreSnapshot(item.snapshot);recordHistory();factoryNotice('Cargado: '+item.name);
 }catch(err){factoryNotice('❌ '+err.message)}
};
$('removeDesign').onclick=()=>{
 const name=$('savedDesigns').value;if(!name)return;
 localDesigns=localDesigns.filter(x=>x.name!==name);persistDesigns();refreshDesignOptions();
 factoryNotice('Diseño borrado solo de la biblioteca local: '+name);
};
$('exportDesign').onclick=()=>{
 try{
  const snapshot=validateSnapshot(takeSnapshot());
  downloadJson('HIGHFLY-SKIN8-DISENO-LOCAL.json',{format:'highfly-skin8-local-preset/1',name:$('designName').value.trim().slice(0,60),snapshot});
  factoryNotice('✅ Diseño exportado a JSON: podés recuperarlo en otro navegador.');
 }catch(err){factoryNotice('❌ '+err.message)}
};
$('importDesign').onchange=async e=>{
 try{
  const f=e.target.files?.[0];if(!f)return;
  if(f.size>30000)throw Error('Archivo excesivamente grande (máximo 30 KB).');
  const obj=JSON.parse(await f.text());
  if(obj.format!=='highfly-skin8-local-preset/1')throw Error('Formato de diseño desconocido.');
  const validated=validateSnapshot(obj.snapshot);
  restoreSnapshot(validated);recordHistory();
  const n=String(obj.name||'Paladín importado').trim().slice(0,60);
  $('designName').value=n;
  factoryNotice('✅ Diseño importado y aplicado: '+n+'. Guardalo si querés conservarlo en este dispositivo.');
 }catch(err){factoryNotice('❌ '+err.message)}finally{e.target.value=''}
};
loadBrowserDesigns();
$('undoDesign').disabled=true;$('redoDesign').disabled=true;

let skin9Current=null;
function displaySkin9Intent(intent){
 const pieces=Object.entries(intent.slotShapes).filter(([,p])=>p.length).map(([k,v])=>k+': '+v.join(', '));
 $('skin9Interpretation').textContent=
  'Temas: '+intent.themes.join(', ')+' · estilo: '+intent.mood+
  '\nMateriales: '+intent.materials.join(', ')+' · foco: '+(intent.focus.join(', ')||'todas las piezas')+
  '\nFormas NUEVAS para Blender: '+(pieces.join(' | ')||'interpretación abierta: diseño artesanal pendiente')+
  '\nVista actual: modificación limitada de 11 piezas nativas; nueva topología todavía NO generada.';
}
function applySkin9Intent(intent){
 if(state.custom)throw Error('Retirá primero el GLB importado para usar el diseño paramétrico.');
 skin9Current=intent;
 $('prompt').value=intent.brief;
 renderSliders(intent.intensity);
 for(const c of ['enamel','metal','accent'])$(c+'Color').value=intent.palette[c];
 applyLiveControls();recordHistory();displaySkin9Intent(intent);
 $('order').textContent='✅ Vista sobre el CUARTO TRAJE NUEVO Rey Oscuro. El pedido se interpreta, pero su geometría inédita requiere otra forja Blender. Nuevas formas requeridas: '+
  (intent.actualNewMeshRequired?'sí, se deben modelar en Blender':'según aprobación artística')+
  '. Podés mutar, guardar variante o preparar candidato Blender.';
}
$('skin9Mutate').onclick=()=>{
 try{
  if(!skin9Current)skin9Current=parseArmorIntent($('prompt').value,{imagePalette:commissionPalette});
  applySkin9Intent(mutateArmorIntent(skin9Current,$('skin9Mutation').value));
 }catch(e){$('skin9Interpretation').textContent='❌ '+e.message}
};
$('skin9BlenderCandidate').onclick=()=>{
 try{
  const latest=parseArmorIntent($('prompt').value,{imagePalette:commissionPalette});
  const intent=skin9Current&&skin9Current.brief===$('prompt').value?skin9Current:latest;
  const candidate=makeBlenderCandidate(intent);
  downloadJson('HIGHFLY-SKIN9-BLENDER-CANDIDATE.json',candidate);
  $('order').textContent='✅ Candidato exportado. NO genera un GLB solo, NO modifica HIGHFLY. Lleva las formas nuevas para la siguiente etapa Blender.';
 }catch(e){$('order').textContent='❌ '+e.message}
};


let skin10Current=null;
function compileStructuralRecipe(){
 const existing=skin9Current&&skin9Current.brief===$('prompt').value?skin9Current:
    parseArmorIntent($('prompt').value,{imagePalette:commissionPalette});
 const v3=buildPremiumV3(existing,{name:'HIGHFLY '+existing.themes.join('+')+' · premium candidate'});
 const guard=checkPremiumCandidate(v3,null);
 if(guard.status!=='NO_GO'||guard.artistApproved||guard.gameDeployAllowed)
   throw Error('La receta experimental jamás debe desbloquearse sin geometría revisada');
 skin10Current=v3;
 const names=Object.keys(v3.pieces);
 $('premiumV3Status').textContent='✅ Blueprint estructural compilado: '+names.length+
   ' piezas skinned · '+v3.style.themes.join(', ')+'\n'+
   'Silueta: '+v3.silhouette.overall+' · cintura '+v3.silhouette.waist+
   '\nLímites: casco ≤115% altura del original, hombros ≤124% ancho original'+
   '\nCada pieza: curvatura + biseles + panel secundario + grabado. 5 pasos de modelado.'+
   '\nNO-GO: sin geometría nueva auditada, encastre M/F, 22 clips y tu aprobación visual.'+
   '\nESTADO: '+v3.exports.status+' · 4ª armadura actual RECHAZADA, no es salida de esta receta.';
 return v3;
}
$('compilePremiumV3').onclick=()=>{
 try{compileStructuralRecipe()}catch(e){$('premiumV3Status').textContent='❌ '+e.message}
};
$('downloadPremiumV3').onclick=()=>{
 try{
  const blueprint=skin10Current&&skin10Current.origin.text===$('prompt').value?skin10Current:compileStructuralRecipe();
  downloadJson('HIGHFLY-SKIN10-RECETA-V3-PREMIUM-BLENDER.json',blueprint);
  $('premiumV3Status').textContent+='\n✅ Plano completo descargado (NO es GLB, no es arte aprobado).';
 }catch(e){$('premiumV3Status').textContent='❌ '+e.message}
};

const sliderNames={head:'Casco',chest:'Pechera',arms:'Hombreras',hands:'Manoplas',legs:'Piernas',feet:'Botas',back:'Espalda'};
let commissionPalette=null;
const settings=$('recipeControls');
function renderSliders(values){
 settings.replaceChildren();
 for(const slot of RECIPE_SLOTS){
  const label=document.createElement('label');label.textContent=sliderNames[slot]+' ';
  const inp=document.createElement('input');inp.type='range';inp.min='.15';inp.max='1.3';inp.step='.01';inp.value=values[slot];
  inp.dataset.slot=slot;
  const value=document.createElement('output');value.textContent=String(values[slot]);
  inp.oninput=()=>{value.textContent=inp.value;applyLiveControls();recordHistory()};
  label.append(inp,value);settings.append(label);
 }
}
function sliderData(){return Object.fromEntries([...settings.querySelectorAll('input')].map(x=>[x.dataset.slot,Number(x.value)]))}
function getLivePalette(){return {enamel:$('enamelColor').value,metal:$('metalColor').value,accent:$('accentColor').value}}
function applyLiveControls(){
 try{
  if(!state.assetsReady)return;
  const data=updateLiveArmor(sliderData(),getLivePalette());
  if(state.view!=='commission')showStation('commission');
  $('liveQa').textContent='VISTA VIVA · '+data.logicalParts+' piezas nuevas / '+data.meshes+' superficies skinned · '+data.editedVertices+' vértices de previsualización ajustados · Rig_Medium intacto.';
 }catch(err){$('liveQa').textContent='❌ '+err.message}
}
for(const id of ['enamelColor','metalColor','accentColor'])$(id).addEventListener('input',()=>{applyLiveControls();recordHistory()});
$('resetLive').onclick=()=>{
 commissionPalette=null;
 $('enamelColor').value='#314f74';$('metalColor').value='#d4a953';$('accentColor').value='#70d5e6';
 renderSliders({...LIVE_DEFAULT});applyLiveControls();recordHistory();
};
renderSliders(commissionIntensity('Armadura Paladín de forja sagrada.'));
lastSnapshot=takeSnapshot();
$('interpretOrder').onclick=()=>{
 try{applySkin9Intent(parseArmorIntent($('prompt').value,{imagePalette:commissionPalette}))}
 catch(e){$('order').textContent='❌ '+e.message}
};
$('extractColors').onclick=async()=>{
 try{
  const f=$('reference').files?.[0];if(!f)throw Error('Elegí antes una imagen PNG/JPEG/WEBP');
  const bitmap=await createImageBitmap(f);
  const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;
  const cx=canvas.getContext('2d',{willReadFrequently:true});cx.drawImage(bitmap,0,0,64,64);bitmap.close?.();
  const raw=cx.getImageData(0,0,64,64).data,bins=new Map();
  for(let i=0;i<raw.length;i+=4){
   if(raw[i+3]<180)continue;
   const [r,g,b]=[raw[i],raw[i+1],raw[i+2]];
   if(Math.max(r,g,b)<28||Math.min(r,g,b)>246)continue;
   const key=[r,g,b].map(v=>Math.min(255,Math.round(v/32)*32)).join(',');
   bins.set(key,(bins.get(key)||0)+1);
  }
  const ranked=[...bins.entries()].sort((a,b)=>b[1]-a[1]).slice(0,12);
  if(!ranked.length)throw Error('La imagen no contiene colores legibles');
  const colors=ranked.map(([key])=>key.split(',').map(Number));
  const hex=a=>'#'+a.map(x=>x.toString(16).padStart(2,'0')).join('');
  const saturation=c=>Math.max(...c)-Math.min(...c);
  const bySat=[...colors].sort((a,b)=>saturation(b)-saturation(a));
  const bright=[...colors].sort((a,b)=>b.reduce((x,y)=>x+y,0)-a.reduce((x,y)=>x+y,0));
  commissionPalette={enamel:hex(colors[0]),metal:hex(bright[0]),accent:hex(bySat[0])};
  $('enamelColor').value=commissionPalette.enamel;$('metalColor').value=commissionPalette.metal;$('accentColor').value=commissionPalette.accent;
  if($('prompt').value.trim().length>=12){try{applySkin9Intent(parseArmorIntent($('prompt').value,{imagePalette:commissionPalette}))}catch(e){applyLiveControls();recordHistory()}}
  else {applyLiveControls();recordHistory()}
  $('order').textContent='🎨 Paleta extraída de la foto: '+JSON.stringify(commissionPalette)+'. La silueta NO se deduce automáticamente de la imagen.';
 }catch(e){$('order').textContent='❌ '+e.message}
};
$('saveOrder').onclick=()=>{
 try{
  const recipe=commissionRecipe($('prompt').value,{intensity:sliderData(),palette:getLivePalette()});
  const url=URL.createObjectURL(new Blob([JSON.stringify(recipe,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='HIGHFLY-SKIN8-PALADIN-RECETA-BLENDER-V2.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
  $('order').textContent='✅ Receta descargada y lista para el generador Blender V2. Pegala en el chat con tu imagen para el encargo; el laboratorio no publica ni crea un GLB remotamente por sí solo.';
 }catch(e){$('order').textContent='❌ '+e.message}
};
load().catch(e=>{status('❌ No se pudo iniciar el laboratorio: '+e.message);console.error(e)});
