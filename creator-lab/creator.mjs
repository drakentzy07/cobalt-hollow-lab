import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {KTX2Loader} from 'three/addons/loaders/KTX2Loader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {defaultRecipe,sanitizeRecipe,buildFeatherSet,checkGeometry} from './geometry.mjs';

const SOURCE={sha:'9b57e49c9676d75962700f828cc00a50a9a988b5',blob:'e3fb52b8e064ab3927f3bc34a5ba7d04e8d701c2',bytes:3477500};
const STORE_KEY='HIGHFLY_CREATOR_LAB_V1';
const CORE=new Set(['M_Head','M_Torso','M_ArmL','M_ArmR','M_HandL','M_HandR','M_LegL','M_LegR','M_FootL','M_FootR','M_Loin','M_Ear_round','M_Eye_almond','M_Brow_soft','M_Mouth_neutral']);
const byId=id=>document.getElementById(id);
const stage=byId('stage');
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.18;
stage.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x090a12);
const pmrem=new THREE.PMREMGenerator(renderer);
scene.environment=pmrem.fromScene(new RoomEnvironment(),.03).texture;
pmrem.dispose();
scene.add(new THREE.HemisphereLight(0xcfd5ff,0x17121e,2));
const main=new THREE.DirectionalLight(0xffffff,3.3);main.position.set(3,6,5);scene.add(main);
const rim=new THREE.DirectionalLight(0x9368ff,3);rim.position.set(-3,3,-4);scene.add(rim);
const floor=new THREE.Mesh(new THREE.CircleGeometry(5,80),new THREE.MeshStandardMaterial({color:0x10121d,roughness:.94}));
floor.rotation.x=-Math.PI/2;floor.position.y=-.03;scene.add(floor);
const camera=new THREE.PerspectiveCamera(38,1,.01,80);
camera.position.set(2.8,2.3,5.8);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxDistance=12;controls.minDistance=.55;

let actor=null,headBone=null,bounds=null,mixer=null,clips=[],accessory=null,selectedId='crown',activeClip='Idle';
let recipe=defaultRecipe(),undo=[],redo=[],dragBaseline=null,uid=0,requestCount=0;
const DIAG=window.__CREATOR_DIAG__={ready:false,error:null,product:'HIGHFLY_CREATOR_LAB',sourceBlob:SOURCE.blob,sourceBytes:SOURCE.bytes,
  isolated:true,nativeRig:false,realHead:false,clips:0,bones:0,geometries:0,vertices:0,nonfinite:0,version:1,undoDepth:0,redoDepth:0,
  exportedBytes:0,saved:false,headReferenceReal:false,selectedId,featherCount:0,sourceOriginalIntact:true};

function report(msg,isError=false){
  byId('status').textContent=msg;if(isError){DIAG.error=msg;byId('error').style.display='block';byId('error').textContent=msg}
}
function snap(){return JSON.stringify(recipe)}
function persistStatus(){DIAG.undoDepth=undo.length;DIAG.redoDepth=redo.length;DIAG.selectedId=selectedId;DIAG.featherCount=recipe.pieces.length;}
function pushHistory(previous){
  if(previous===snap())return false;
  undo.push(previous);if(undo.length>80)undo.shift();redo=[];persistStatus();return true;
}
function transact(fn){
  const prev=snap();fn();recipe=sanitizeRecipe(recipe);pushHistory(prev);refresh();return prev!==snap();
}
function selected(){return recipe.pieces.find(p=>p.id===selectedId)||recipe.pieces[0]||null}
function setSelected(id){if(!recipe.pieces.some(x=>x.id===id))return;
  selectedId=id;renderControls();renderParts();markSelection();persistStatus();
}
function dispose(root){root?.traverse(o=>{if(o.geometry)o.geometry.dispose();const m=o.material;if(Array.isArray(m))m.forEach(x=>x.dispose());else m?.dispose()});root?.removeFromParent()}
function rebuild(){
  if(!headBone||!bounds)return;
  dispose(accessory);
  accessory=buildFeatherSet(recipe,bounds);
  headBone.add(accessory); // identity transform in true head-bone local frame
  const ck=checkGeometry(accessory);
  Object.assign(DIAG,{nativeRig:!!headBone,realHead:true,headParentOK:accessory.parent===headBone,rootIdentity:
    accessory.position.lengthSq()===0&&accessory.rotation.toArray().every(v=>v===0)&&accessory.scale.toArray().every(v=>v===1),
    geometries:ck.meshCount,vertices:ck.vertices,nonfinite:ck.nonfinite,
    sourceOriginalIntact:true,featherCount:recipe.pieces.length,selectedId});
  markSelection();return ck;
}
function markSelection(){
  if(!accessory)return;
  accessory.traverse(o=>{
    if(!o.isMesh)return;
    const selected=o.userData.creatorPieceId===selectedId;
    o.material.emissive?.setHex(selected?0x1a1032:0x000000);
    o.material.emissiveIntensity=selected?.43:0;
  });
}
function renderParts(){
  const el=byId('parts');el.textContent='';
  for(const p of recipe.pieces){
    const b=document.createElement('button');b.type='button';b.textContent=p.name;
    b.dataset.pieceId=p.id;b.classList.toggle('active',p.id===selectedId);
    b.addEventListener('click',()=>setSelected(p.id));el.appendChild(b);
  }
}
const ranges={length:100,width:100,bend:100,tilt:100,twist:1};
function renderControls(){
  const p=selected();
  for(const [name,mult] of Object.entries(ranges)){
    const el=byId(name);el.disabled=!p;
    if(p){el.value=Math.round(p[name]*mult);byId(name+'Value').textContent=String(el.value);}
  }
  byId('color').disabled=!p;byId('accent').disabled=!p;
  if(p){byId('color').value=p.color;byId('accent').value=p.accent;}
  byId('material').value=recipe.material;byId('symmetry').checked=recipe.symmetry;
  byId('deleteBtn').disabled=!p;byId('duplicateBtn').disabled=!p;
  byId('undoBtn').disabled=undo.length===0;byId('redoBtn').disabled=redo.length===0;
}
function refresh(){rebuild();renderParts();renderControls();persistStatus();}
function addPiece(){
  if(recipe.pieces.length>=60){report('Límite de 60 piezas alcanzado.');return}
  const id='feather_'+(++uid)+'_'+Date.now().toString(36);
  transact(()=>{
    const source=selected()||defaultRecipe().pieces[0];
    recipe.pieces.push({...structuredClone(source),id,name:'Pluma '+(recipe.pieces.length+1),x:Math.min(1.4,source.x+.12),y:source.y+.05,mirror:true});
    selectedId=id;
  });
  report('Pluma creada. Podés moldearla, pintarla y usar simetría.');
}
function duplicate(){
  if(!selected()||recipe.pieces.length>=60)return;
  const src=selected(),id='copy_'+(++uid)+'_'+Date.now().toString(36);
  transact(()=>{recipe.pieces.push({...structuredClone(src),id,name:src.name+' copia',y:src.y+.09});selectedId=id;});
  report('Subpieza duplicada sin fusionar el resto del diseño.');
}
function erase(){
  const p=selected();if(!p)return;
  transact(()=>{recipe.pieces=recipe.pieces.filter(x=>x.id!==p.id);selectedId=recipe.pieces[0]?.id||null});
  report('Pieza eliminada. Deshacer restaura la geometría y sus colores.');
}
function undoOp(){
  if(!undo.length)return;
  redo.push(snap());recipe=sanitizeRecipe(JSON.parse(undo.pop()));
  if(!selected())selectedId=recipe.pieces[0]?.id||null;refresh();report('Último cambio deshecho.');
}
function redoOp(){
  if(!redo.length)return;
  undo.push(snap());recipe=sanitizeRecipe(JSON.parse(redo.pop()));
  if(!selected())selectedId=recipe.pieces[0]?.id||null;refresh();report('Cambio restaurado.');
}
function reset(){
  transact(()=>{recipe=defaultRecipe();selectedId='crown'});
  report('Reinicio completado. El Warrior original no fue modificado.');
}
function downloadBlob(data,filename,mime){
  const blob=data instanceof Blob?data:new Blob([data],{type:mime});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function save(){
  localStorage.setItem(STORE_KEY,snap());DIAG.saved=true;report('Diseño guardado en este navegador. Incluye cada pluma y sus colores.');
}
function load(){
  const raw=localStorage.getItem(STORE_KEY);
  if(!raw){report('Todavía no hay diseño guardado.');return false}
  try{const r=sanitizeRecipe(JSON.parse(raw));transact(()=>{recipe=r;selectedId=recipe.pieces[0]?.id||null});report('Diseño recuperado sin perder subpiezas.');return true}
  catch(e){report('Diseño guardado inválido: '+e.message);return false}
}
async function exportGLB(download=true){
  if(!accessory)throw Error('No hay accesorio preparado');
  const safe=checkGeometry(accessory);if(!safe.valid)throw Error('Geometría no válida para exportar');
  // Export accessory only. Native rig and base avatar are intentionally excluded.
  const clone=accessory.clone(true);
  clone.updateMatrixWorld(true);
  const exporter=new GLTFExporter();
  const data=await exporter.parseAsync(clone,{binary:true,onlyVisible:true,trs:true});
  if(!(data instanceof ArrayBuffer)||data.byteLength<500)throw Error('GLB vacío');
  DIAG.exportedBytes=data.byteLength;
  if(download)downloadBlob(data,'HIGHFLY-CREATOR-CORVUS-head.glb','model/gltf-binary');
  report('Accesorio GLB exportado ('+Math.round(data.byteLength/1024)+' KB). Anclaje requerido: head; no incluye el personaje.');
  return data.byteLength;
}
function setRange(name,value){
  const p=selected();if(!p)return;
  if(dragBaseline===null)dragBaseline=snap();
  p[name]=Number(value)/ranges[name];recipe=sanitizeRecipe(recipe);
  byId(name+'Value').textContent=String(value);
  rebuild();
}
function finishRange(){if(dragBaseline!==null){pushHistory(dragBaseline);dragBaseline=null;renderControls()}}
for(const name of Object.keys(ranges)){
  byId(name).addEventListener('input',e=>setRange(name,e.target.value));
  byId(name).addEventListener('change',finishRange);
  byId(name).addEventListener('pointerup',finishRange);
}
for(const key of ['color','accent']){
  byId(key).addEventListener('input',e=>{const p=selected();if(!p)return;if(dragBaseline===null)dragBaseline=snap();p[key]=e.target.value;rebuild();});
  byId(key).addEventListener('change',finishRange);
}
byId('material').onchange=e=>transact(()=>{recipe.material=e.target.value});
byId('symmetry').onchange=e=>transact(()=>{recipe.symmetry=e.target.checked});
byId('addBtn').onclick=addPiece;byId('duplicateBtn').onclick=duplicate;byId('deleteBtn').onclick=erase;
byId('undoBtn').onclick=undoOp;byId('redoBtn').onclick=redoOp;byId('resetBtn').onclick=reset;
byId('saveBtn').onclick=save;byId('loadBtn').onclick=load;
byId('recipeBtn').onclick=()=>{downloadBlob(JSON.stringify(recipe,null,2),'HIGHFLY-CREATOR-recipe.json','application/json');report('Receta descargada como JSON.');};
byId('exportBtn').onclick=async()=>{
  const btn=byId('exportBtn');btn.disabled=true;try{await exportGLB(true)}catch(e){report('Exportación fallida: '+e.message,true)}finally{btn.disabled=false}
};
document.addEventListener('keydown',e=>{
  if(!(e.ctrlKey||e.metaKey)||e.altKey)return;
  if(e.key.toLowerCase()==='z'){e.preventDefault();if(e.shiftKey)redoOp();else undoOp()}
  if(e.key.toLowerCase()==='y'){e.preventDefault();redoOp()}
});
const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
renderer.domElement.addEventListener('pointerup',event=>{
  if(!accessory||controls.state!==-1)return;
  const rect=renderer.domElement.getBoundingClientRect();
  pointer.x=(event.clientX-rect.left)/rect.width*2-1;pointer.y=-(event.clientY-rect.top)/rect.height*2+1;
  ray.setFromCamera(pointer,camera);
  const hits=ray.intersectObjects(accessory.children,true);
  const id=hits[0]?.object?.userData?.creatorPieceId;
  if(id){setSelected(id);report('Detalle seleccionado: '+selected()?.name+'.')}
});
function resize(){
  const w=Math.max(1,stage.clientWidth),h=Math.max(1,stage.clientHeight);
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}
const ro=new ResizeObserver(resize);ro.observe(stage);window.addEventListener('resize',resize);resize();
function cameraView(view){
  const box=new THREE.Box3().setFromObject(actor||floor),c=new THREE.Vector3(),size=new THREE.Vector3();
  box.getCenter(c);box.getSize(size);c.y=Math.max(.5,c.y);
  const distance=Math.max(3.4,size.y*1.65);
  const v={front:new THREE.Vector3(.15,.08,1),side:new THREE.Vector3(1,.08,0),back:new THREE.Vector3(0,.08,-1)}[view]||new THREE.Vector3(.25,.1,1);
  camera.position.copy(c).add(v.normalize().multiplyScalar(distance));
  controls.target.copy(c);controls.update();
}
byId('frontBtn').onclick=()=>cameraView('front');byId('sideBtn').onclick=()=>cameraView('side');byId('backBtn').onclick=()=>cameraView('back');
byId('moveBtn').onclick=()=>{
  if(!mixer||!clips.length)return;
  const names=['Idle','Walking_A','Running_A','1H_Melee_Attack'];const idx=names.indexOf(activeClip);
  const next=names[(idx+1)%names.length];const clip=THREE.AnimationClip.findByName(clips,next)||clips.find(x=>new RegExp(next.split('_')[0],'i').test(x.name))||clips[0];
  mixer.stopAllAction();mixer.clipAction(clip).reset().fadeIn(.12).play();activeClip=clip.name;
  DIAG.activeClip=clip.name;byId('moveBtn').textContent='Animación: '+clip.name;
};
const clock=new THREE.Clock();
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05);mixer?.update(dt);controls.update();renderer.render(scene,camera)}
animate();
async function boot(){
  try{
    const loader=new GLTFLoader(),ktx2=new KTX2Loader()
      .setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.185.0/examples/jsm/libs/basis/').detectSupport(renderer);
    loader.setKTX2Loader(ktx2);loader.setMeshoptDecoder(MeshoptDecoder);
    const [source,reference]=await Promise.all([
      loader.loadAsync('./assets/warrior_modular.glb'),
      loader.loadAsync('./assets/bind/reference_head.glb')
    ]);
    actor=source.scene;clips=source.animations||[];actor.userData.clips=clips;scene.add(actor);
    let bones=0;actor.traverse(o=>{
      if(o.isBone){bones++;if(String(o.name).toLowerCase().replace(/[^a-z0-9]/g,'')==='head')headBone=o;}
      if(o.isMesh||o.isSkinnedMesh){
        const normalized=String(o.name).replace(/[[\].:/]/g,'');
        const keep=[...CORE].some(n=>normalized===n||normalized.startsWith(n+'_'));
        o.visible=keep;o.castShadow=true;o.receiveShadow=true;
      }
    });
    if(!headBone||bones<20||clips.length!==22)throw Error('Contrato Rig_Medium incompleto: '+bones+' huesos / '+clips.length+' clips');
    const headMesh=reference.scene.getObjectByName('M_Head')||
      reference.scene.getObjectByName('M_Head_1');
    if(!headMesh)throw Error('M_Head nativo ausente en reference_head.glb');
    const box=new THREE.Box3().setFromObject(headMesh);if(box.isEmpty())throw Error('Referencia craneal vacía');
    const size=new THREE.Vector3(),center=new THREE.Vector3();box.getSize(size);box.getCenter(center);
    if(![size.x,size.y,size.z].every(v=>v>0.02&&Number.isFinite(v)))throw Error('Dimensiones craneales inválidas');
    bounds={size,center};
    mixer=new THREE.AnimationMixer(actor);
    const idle=THREE.AnimationClip.findByName(clips,'Idle');if(idle)mixer.clipAction(idle).play();
    Object.assign(DIAG,{ready:true,nativeRig:true,headReferenceReal:true,bones,clips:clips.length,realHead:true,
      headSize:size.toArray(),sourceOriginalIntact:true,sourceHeadBoneName:headBone.name});
    const pill=byId('rigPill');pill.textContent='Rig_Medium · '+bones+' huesos · '+clips.length+' animaciones ✓';
    pill.style.color='#8ae8ac';
    refresh();cameraView('front');
    report('Forja lista. '+recipe.pieces.length+' elementos editables · Seleccioná una pluma o tocala en el modelo.');
    const s=checkGeometry(accessory);if(!s.valid)throw Error('Geometría no finita');
    byId('diag').textContent=s.meshCount+' mallas · '+s.vertices+' vértices · M_Head REAL';
  }catch(e){report('Error de carga: '+(e?.message||e),true);console.error(e)}
}
window.__CREATOR_API__={getRecipe:()=>structuredClone(recipe),getSelected:()=>selected()?structuredClone(selected()):null,
  addPiece,duplicate,erase,undo:undoOp,redo:redoOp,reset,save,load,exportGLB,check:()=>accessory?checkGeometry(accessory):null,
  cameraView,loadRecipe:r=>transact(()=>{recipe=sanitizeRecipe(r);selectedId=recipe.pieces[0]?.id||null})};
refresh();boot();
