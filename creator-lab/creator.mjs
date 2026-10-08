import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {KTX2Loader} from 'three/addons/loaders/KTX2Loader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {TransformControls} from 'three/addons/controls/TransformControls.js';
import {nativeFacialLandmarks,facialOverlay} from './facial.mjs';
import {inspectAccessory} from './quality.mjs';
import {defaultRecipe,sanitizeRecipe,buildFeatherSet,checkGeometry} from './geometry.mjs';
import {buildLegendaryHelmet,HELMET_PARTS} from './helmet.mjs';
import {parseGuidedCommand,applyGuidedCommand} from './command-engine.mjs';

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

let actor=null,headBone=null,bounds=null,mixer=null,clips=[],accessory=null,helmetRoot=null,headSurfaceMeshes=[],selectedId='crown',selectedHelmetPart='beak',activeClip='Idle';
let landmarks=null,faceGuideRoot=null,showGuides=false,gizmoMode=null,gizmoBaseline=null,applyingGizmo=false;
let recipe=defaultRecipe(),undo=[],redo=[],dragBaseline=null,uid=0,requestCount=0;
const DIAG=window.__CREATOR_DIAG__={ready:false,error:null,product:'HIGHFLY_CREATOR_LAB',sourceBlob:SOURCE.blob,sourceBytes:SOURCE.bytes,
  isolated:true,nativeRig:false,realHead:false,clips:0,bones:0,geometries:0,vertices:0,nonfinite:0,version:1,undoDepth:0,redoDepth:0,
  exportedBytes:0,saved:false,headReferenceReal:false,selectedId,featherCount:0,sourceOriginalIntact:true,
  helmetReady:false,helmetAttached:false,helmetMeshCount:0,helmetPartCount:0,helmetVisible:false,helmetSelectedPart:'beak',fullFaceFitted:false,faceFitParts:0,faceFitCoverage:null,faceFitWarnings:[],
  faceLandmarksVerified:false,landmarkCount:0,nativeEyeY:null,eyeYResult:null,gizmoAttached:false,gizmoMode:null,
  quality:null,toolboxVersion:3};

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
  selectedId=id;renderControls();renderParts();markSelection();syncGizmo();persistStatus();
}
function dispose(root){root?.traverse(o=>{if(o.geometry)o.geometry.dispose();const m=o.material;if(Array.isArray(m))m.forEach(x=>x.dispose());else m?.dispose()});root?.removeFromParent()}
const gizmo=new TransformControls(camera,renderer.domElement);
gizmo.setSize(.70);gizmo.setSpace('local');
scene.add(gizmo.getHelper());
gizmo.detach();gizmo.getHelper().visible=false;
gizmo.addEventListener('dragging-changed',e=>{controls.enabled=!e.value;});
gizmo.addEventListener('mouseDown',()=>{gizmoBaseline=snap()});
gizmo.addEventListener('mouseUp',()=>{
  if(!gizmo.object||!bounds||!selected()||!gizmoBaseline)return;
  const p=selected(),ob=gizmo.object;
  const side=ob.name.endsWith('_L')?-1:1;
  p.x=side*(ob.position.x-bounds.center.x)/(bounds.size.x*.8);
  p.y=(ob.position.y-bounds.center.y)/bounds.size.y;
  p.z=(ob.position.z-bounds.center.z)/bounds.size.z;
  p.rx=THREE.MathUtils.radToDeg(ob.rotation.x);p.ry=THREE.MathUtils.radToDeg(ob.rotation.y)*side;
  p.rz=THREE.MathUtils.radToDeg(ob.rotation.z)*side;
  p.scale=(ob.scale.x+ob.scale.y+ob.scale.z)/3;
  recipe=sanitizeRecipe(recipe);pushHistory(gizmoBaseline);gizmoBaseline=null;refresh();
  report('Pieza transformada: valores exactos guardados y deshacer disponible.');
});
function syncGizmo(){
  gizmo.detach();gizmo.getHelper().visible=false;
  if(!accessory||!gizmoMode||!recipe.showFeathers)return;
  const featherRoot=accessory.getObjectByName('HIGHFLY_CREATOR_HEAD_ACCESSORIES');
  if(!featherRoot)return;
  const matches=featherRoot.children.filter(o=>o.userData.creatorPieceId===selectedId);
  const candidate=matches.find(o=>o.name.endsWith('_R'))||matches[0];
  if(!candidate)return;
  gizmo.attach(candidate);gizmo.getHelper().visible=true;gizmo.setMode(gizmoMode);
  DIAG.gizmoAttached=true;
}
function setGizmoMode(mode){
  gizmoMode=mode;
  if(mode&&!recipe.showFeathers)transact(()=>{recipe.showFeathers=true});
  syncGizmo();DIAG.gizmoMode=mode;DIAG.gizmoAttached=!!gizmo.object;
  for(const [btn,m] of [['gizmoMove','translate'],['gizmoRotate','rotate'],['gizmoScale','scale']])
    byId(btn).classList.toggle('active',mode===m);
  byId('gizmoOff').classList.toggle('active',mode===null);
  report(mode?'Manipulador '+({translate:'mover',rotate:'rotar',scale:'escalar'}[mode])+' activo para '+selected()?.name+'.':'Manipulador desactivado.');
}
function updateGizmoSnap(){
  const on=byId('gizmoSnap').checked;
  gizmo.setTranslationSnap(on ? .04 : null);
  gizmo.setRotationSnap(on?THREE.MathUtils.degToRad(15):null);
  gizmo.setScaleSnap(on ? .1 : null);
}
updateGizmoSnap();
for(const [btn,mode] of [['gizmoMove','translate'],['gizmoRotate','rotate'],['gizmoScale','scale'],['gizmoOff',null]])
  byId(btn).onclick=()=>setGizmoMode(mode);
byId('gizmoSnap').onchange=updateGizmoSnap;
function rebuild(){
  if(!headBone||!bounds)return;
  gizmo.detach();gizmo.getHelper().visible=false;
  dispose(accessory);
  accessory=new THREE.Group();accessory.name='HIGHFLY_CREATOR_HEADWEAR';
  accessory.userData.hfAttachBone='head';
  const feathers=buildFeatherSet(recipe,bounds);
  feathers.visible=recipe.showFeathers;
  accessory.add(feathers);
  helmetRoot=buildLegendaryHelmet(bounds,recipe.helmet,landmarks);
  accessory.add(helmetRoot);
  headBone.add(accessory); // true native head-bone local frame, no proxy rig.
  for(const o of headSurfaceMeshes)o.visible=!recipe.helmet.enabled;
  const ck=checkGeometry(accessory);
  let helmetMeshes=0;const uniqueParts=new Set(),helmetColors=new Set();
  helmetRoot.traverse(o=>{if(!o.isMesh)return;helmetMeshes++;
    if(o.userData.creatorHelmetPart){
      uniqueParts.add(o.userData.creatorHelmetPart);
      if(o.material?.color)helmetColors.add('#'+o.material.color.getHexString());
    }
  });
  Object.assign(DIAG,{nativeRig:!!headBone,realHead:true,headParentOK:accessory.parent===headBone,
    rootIdentity:accessory.position.lengthSq()===0&&[accessory.rotation.x,accessory.rotation.y,accessory.rotation.z].every(v=>v===0)&&accessory.scale.toArray().every(v=>v===1),
    geometries:ck.meshCount,vertices:ck.vertices,nonfinite:ck.nonfinite,
    helmetReady:recipe.helmet.enabled&&helmetMeshes>=30,helmetAttached:helmetRoot.parent===accessory&&accessory.parent===headBone,
    helmetVisible:recipe.helmet.enabled,helmetMeshCount:helmetMeshes,helmetPartCount:uniqueParts.size,
    helmetColorCount:helmetColors.size,helmetSelectedPart:selectedHelmetPart,
    fullFaceFitted:helmetRoot.userData.facialFit?.verified===true,
    faceFitParts:helmetRoot.userData.facialFit?.partTypes?.length||0,
    faceFitCoverage:helmetRoot.userData.facialFit?.coverage||null,
    faceFitWarnings:helmetRoot.userData.facialFit?.warnings||[],headFacesHidden:recipe.helmet.enabled&&headSurfaceMeshes.length>0&&headSurfaceMeshes.every(o=>o.visible===false),
    sourceOriginalIntact:true,featherCount:recipe.pieces.length,selectedId});
  const qa=inspectAccessory(accessory);
  DIAG.quality=qa;
  DIAG.eyeYResult=helmetRoot.userData.facialAlignment?.absoluteVisorY??null;
  byId('qualityReport').textContent=qa.triangles+' triángulos · '+qa.materials+' materiales · '+
    (qa.mobileBudget?'presupuesto móvil OK':'revisar presupuesto móvil')+
    (qa.warnings.length?' · '+qa.warnings.join('; '):'');
  markSelection();syncGizmo();return ck;
}
function markSelection(){
  if(!accessory)return;
  accessory.traverse(o=>{
    if(!o.isMesh||!o.userData.creatorPieceId)return;
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
const ranges={length:100,width:100,bend:100,tilt:100,twist:1,
  x:100,y:100,z:100,rx:1,ry:1,rz:1,scale:100};
const transformSpecs=[
  ['x','X (posición)',-160,160],['y','Y (posición)',-160,160],['z','Z (posición)',-160,160],
  ['rx','Rotación X',-180,180],['ry','Rotación Y',-180,180],['rz','Rotación Z',-180,180],
  ['scale','Escala',30,250]
];
for(const [name,title,min,max] of transformSpecs){
  const label=document.createElement('label');
  label.textContent=title+' ';
  const slider=document.createElement('input');slider.id=name;slider.type='range';slider.min=min;slider.max=max;slider.step=1;
  const input=document.createElement('input');input.id=name+'Number';input.type='number';input.min=min;input.max=max;input.step=1;input.className='precise';
  const reset=document.createElement('button');reset.id=name+'Reset';reset.className='mini';reset.type='button';reset.title='Restaurar';reset.textContent='↺';
  label.append(slider,input,reset);byId('transformControls').appendChild(label);
}
const helmetPartSelect=byId('helmetPartSelect');
for(const [key,def] of Object.entries(HELMET_PARTS)){
  const option=document.createElement('option');option.value=key;option.textContent=def.name;helmetPartSelect.appendChild(option);
}
helmetPartSelect.value=selectedHelmetPart;
function renderControls(){
  const p=selected();
  for(const [name,mult] of Object.entries(ranges)){
    const el=byId(name);el.disabled=!p;
    const num=byId(name+'Number');if(num)num.disabled=!p;
    if(p){const v=Math.round((p[name]??(name==='scale'?1:0))*mult);
      el.value=v;if(num)num.value=v;}
  }
  byId('color').disabled=!p;byId('accent').disabled=!p;
  if(p){byId('color').value=p.color;byId('accent').value=p.accent;}
  byId('material').value=recipe.material;byId('symmetry').checked=recipe.symmetry;
  byId('deleteBtn').disabled=!p;byId('duplicateBtn').disabled=!p;
  byId('undoBtn').disabled=undo.length===0;byId('redoBtn').disabled=redo.length===0;
  byId('helmetOnBtn').classList.toggle('active',recipe.helmet.enabled);
  byId('helmetOffBtn').classList.toggle('active',!recipe.helmet.enabled);
  byId('showFeathers').checked=recipe.showFeathers;
  helmetPartSelect.value=selectedHelmetPart;
  byId('helmetPartColor').value=recipe.helmet.colors[selectedHelmetPart]||HELMET_PARTS[selectedHelmetPart].color;
  for(const [prop,key] of [['helmetBeak','beak'],['helmetCrest','crest'],['helmetGlow','glow'],['helmetEye','eyeOffset']]){
    const v=Math.round(recipe.helmet[key]*100);
    byId(prop).value=v;byId(prop+'Number').value=v;
  }
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
  gizmoMode=null;
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
  const safe=inspectAccessory(accessory);
  if(!safe.valid||!safe.mobileBudget)throw Error('Malla inválida o fuera de presupuesto móvil: '+JSON.stringify(safe));
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
  const num=byId(name+'Number');if(num)num.value=String(value);
  rebuild();
}
function finishRange(){if(dragBaseline!==null){pushHistory(dragBaseline);dragBaseline=null;renderControls()}}
for(const name of Object.keys(ranges)){
  byId(name).addEventListener('input',e=>setRange(name,e.target.value));
  byId(name).addEventListener('change',finishRange);
  byId(name).addEventListener('pointerup',finishRange);
  byId(name+'Number').addEventListener('change',e=>{
    const v=Number(e.target.value),slider=byId(name);
    if(!Number.isFinite(v)){renderControls();return}
    setRange(name,Math.max(Number(slider.min),Math.min(Number(slider.max),Math.round(v))));finishRange();
  });
  byId(name+'Reset').addEventListener('click',()=>{
    const original=defaultRecipe().pieces.find(x=>x.id===selectedId);
    const fallback=name==='scale'?100:0;
    const v=Math.round((original?.[name]??(fallback/ranges[name]))*ranges[name]);
    setRange(name,v);finishRange();
  });
}
// Helmet controls and painting are recipe-level, therefore undo/redo and save/load work.
byId('helmetOnBtn').onclick=()=>{transact(()=>{recipe.helmet.enabled=true});cameraHeadView('three');report('Casco legendario equipado en el hueso real head.');};
byId('helmetOffBtn').onclick=()=>{transact(()=>{recipe.helmet.enabled=false});report('Casco oculto. Los huesos y animaciones permanecen intactos.');};
byId('showFeathers').onchange=e=>transact(()=>{recipe.showFeathers=e.target.checked});
helmetPartSelect.onchange=e=>{selectedHelmetPart=e.target.value;renderControls();report('Pintar detalle: '+HELMET_PARTS[selectedHelmetPart].name)};
byId('helmetPartColor').oninput=e=>{if(dragBaseline===null)dragBaseline=snap();
  recipe.helmet.colors[selectedHelmetPart]=e.target.value;recipe=sanitizeRecipe(recipe);rebuild();
};
byId('helmetPartColor').onchange=finishRange;
for(const [id,key] of [['helmetBeak','beak'],['helmetCrest','crest'],['helmetGlow','glow'],['helmetEye','eyeOffset']]){
  const change=(value)=>{if(dragBaseline===null)dragBaseline=snap();
    const el=byId(id),v=Math.max(Number(el.min),Math.min(Number(el.max),Number(value)));
    if(!Number.isFinite(v)){renderControls();return}
    recipe.helmet[key]=v/100;recipe=sanitizeRecipe(recipe);
    el.value=v;byId(id+'Number').value=v;rebuild();
  };
  byId(id).oninput=e=>change(e.target.value);
  byId(id).onchange=finishRange;
  byId(id+'Number').onchange=e=>{change(e.target.value);finishRange();};
}
byId('headViewBtn').onclick=()=>cameraHeadView('three');
byId('guidesBtn').onclick=()=>{
  if(!faceGuideRoot||!landmarks?.verified){report('Guías no disponibles: falta referencia ocular real.');return}
  showGuides=!showGuides;faceGuideRoot.visible=showGuides;
  byId('guidesBtn').classList.toggle('active',showGuides);
  byId('guidesBtn').textContent=showGuides?'Ocultar guías':'Mostrar guías';
};
byId('faceFocusBtn').onclick=()=>{
  if(!landmarks?.verified){report('No hay coordenadas oculares verificadas.');return}
  headBone.updateWorldMatrix(true,false);
  const target=headBone.localToWorld(new THREE.Vector3(0,landmarks.eyeY,landmarks.headCenter.z));
  camera.position.copy(target).add(new THREE.Vector3(.25,.15,2.7));
  controls.target.copy(target);controls.update();
};
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
byId('importBtn').onclick=()=>byId('importFile').click();
byId('importFile').onchange=async e=>{
  const file=e.target.files?.[0];if(!file)return;
  try{
    if(file.size>1024*1024)throw Error('Receta demasiado grande: 1 MB máximo');
    const result=sanitizeRecipe(JSON.parse(await file.text()));
    transact(()=>{recipe=result;selectedId=recipe.pieces[0]?.id||null});
    report('Receta importada: casco, plumas y colores restaurados.');
  }catch(err){report('Error al importar receta: '+err.message,true)}
  finally{e.target.value=''}
};
byId('qualityBtn').onclick=()=>{
  if(!accessory){report('Primero debe cargarse el modelo original.');return}
  const qa=inspectAccessory(accessory);DIAG.quality=qa;
  report('AUDITORÍA: '+qa.triangles+' triángulos · '+qa.vertices+' vértices · '+
    qa.materials+' materiales · '+qa.degenerate+' degenerados · '+
    (qa.valid&&qa.mobileBudget?'apto para esta prueba móvil.':'requiere revisión.')+
    (qa.warnings.length?' '+qa.warnings.join(' / '):''));
};
function executeForgeCommand(raw){
  try{
    const plan=parseGuidedCommand(raw);
    if(plan.action==='inspect'){
      byId('qualityBtn').click();return true;
    }
    const applied=transact(()=>{recipe=applyGuidedCommand(recipe,plan).recipe});
    report(applied?'Orden de forja ejecutada y guardada en historial.':'La orden no cambió la pieza.');
    return true;
  }catch(error){
    report('Orden no ejecutada: '+error.message);
    return false;
  }
}
byId('forgeRunBtn').onclick=()=>executeForgeCommand(byId('forgeCommand').value);
byId('forgeCommand').addEventListener('keydown',e=>{
  if(e.key==='Enter'){e.preventDefault();executeForgeCommand(e.target.value);}
});
byId('exportBtn').onclick=async()=>{
  const btn=byId('exportBtn');btn.disabled=true;try{await exportGLB(true)}catch(e){report('Exportación fallida: '+e.message,true)}finally{btn.disabled=false}
};
document.addEventListener('keydown',e=>{
  if(!(e.ctrlKey||e.metaKey)||e.altKey)return;
  if(e.key.toLowerCase()==='z'){e.preventDefault();if(e.shiftKey)redoOp();else undoOp()}
  if(e.key.toLowerCase()==='y'){e.preventDefault();redoOp()}
});
const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
let pressStart=null;
renderer.domElement.addEventListener('pointerdown',event=>{
  pressStart={x:event.clientX,y:event.clientY};
});
renderer.domElement.addEventListener('pointerup',event=>{
  const delta=pressStart?Math.hypot(pressStart.x-event.clientX,pressStart.y-event.clientY):Infinity;
  pressStart=null;
  // Dragging rotates the camera; only a genuine short tap picks a mesh.
  if(!accessory||delta>7||gizmo.dragging)return;
  const rect=renderer.domElement.getBoundingClientRect();
  pointer.x=(event.clientX-rect.left)/rect.width*2-1;pointer.y=-(event.clientY-rect.top)/rect.height*2+1;
  ray.setFromCamera(pointer,camera);
  const hits=ray.intersectObjects(accessory.children,true).filter(h=>{
    let o=h.object;while(o&&o!==accessory){if(!o.visible)return false;o=o.parent}return true;
  });
  const match=hits.find(h=>h.object?.userData?.creatorHelmetPart||h.object?.userData?.creatorPieceId);
  const helmetPart=match?.object?.userData?.creatorHelmetPart;
  if(helmetPart){selectedHelmetPart=helmetPart;renderControls();
    report('Casco: '+HELMET_PARTS[helmetPart].name+'. Pintalo con el selector de color.');return;}
  const id=match?.object?.userData?.creatorPieceId;
  if(id){setSelected(id);report('Pluma seleccionada: '+selected()?.name+'.')}
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
function cameraHeadView(view='three'){
  if(!headBone||!bounds)return;
  headBone.updateWorldMatrix(true,false);
  const target=headBone.localToWorld(bounds.center.clone());
  const dir={front:new THREE.Vector3(0,.02,1),side:new THREE.Vector3(1,.02,0),
    back:new THREE.Vector3(0,.02,-1),three:new THREE.Vector3(.52,.12,1)}[view]||new THREE.Vector3(.52,.12,1);
  const d=Math.max(2.6,bounds.size.length()*2.05);
  camera.position.copy(target).add(dir.normalize().multiplyScalar(d));
  controls.target.copy(target);controls.update();
}
byId('frontBtn').onclick=()=>cameraHeadView('front');byId('sideBtn').onclick=()=>cameraHeadView('side');byId('backBtn').onclick=()=>cameraHeadView('back');
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
        if(['M_Head','M_Ear_round','M_Eye_almond','M_Brow_soft','M_Mouth_neutral'].some(n=>normalized===n||normalized.startsWith(n+'_')))
          headSurfaceMeshes.push(o);
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
    landmarks=nativeFacialLandmarks(reference.scene);
    DIAG.faceLandmarksVerified=landmarks.verified;
    DIAG.landmarkCount=[landmarks.leftEye,landmarks.rightEye,landmarks.brow,landmarks.mouth].filter(Boolean).length;
    DIAG.nativeEyeY=landmarks.eyeY;
    faceGuideRoot=facialOverlay(landmarks);
    headBone.add(faceGuideRoot);
    byId('faceReport').textContent=landmarks.verified
      ?'Ojos: '+landmarks.samples.left+' / '+landmarks.samples.right+
        ' vértices · Cejas: '+(landmarks.browVerified?'OK':'sin bilateral')+
        ' · Boca: '+(landmarks.mouthVerified?'OK':'sin referencia')+
        ' · Orejas: '+(landmarks.earVerified?'OK':'sin bilateral')+
        ' · Ajuste conjunto del casco, no sólo del visor.'
      :'REFERENCIA INCOMPLETA: falta M_Eye_almond bilateral; no se simularon ojos.';
    if(!landmarks.verified)throw Error('Se requiere referencia ocular izquierda/derecha auténtica; no se acepta proxy');
    mixer=new THREE.AnimationMixer(actor);
    const idle=THREE.AnimationClip.findByName(clips,'Idle');if(idle)mixer.clipAction(idle).play();
    Object.assign(DIAG,{ready:true,nativeRig:true,headReferenceReal:true,bones,clips:clips.length,realHead:true,
      headSize:size.toArray(),sourceOriginalIntact:true,sourceHeadBoneName:headBone.name});
    const pill=byId('rigPill');pill.textContent='Rig_Medium · '+bones+' huesos · '+clips.length+' animaciones ✓';
    pill.style.color='#8ae8ac';
    refresh();cameraHeadView('three');DIAG.gizmoAttached=!!gizmo.object;
    report('CASCO AVIAR LEGENDARIO REAL montado. Seleccioná un detalle y pintalo; podés usar los controles numéricos.');
    const s=checkGeometry(accessory);if(!s.valid)throw Error('Geometría no finita');
    byId('diag').textContent=s.meshCount+' mallas · '+s.vertices+' vértices · M_Head REAL';
  }catch(e){report('Error de carga: '+(e?.message||e),true);console.error(e)}
}
window.__CREATOR_API__={getRecipe:()=>structuredClone(recipe),getSelected:()=>selected()?structuredClone(selected()):null,
  addPiece,duplicate,erase,undo:undoOp,redo:redoOp,reset,save,load,exportGLB,check:()=>accessory?checkGeometry(accessory):null,
  cameraView,cameraHeadView,
  getLandmarks:()=>landmarks?{verified:landmarks.verified,
    leftEye:landmarks.leftEye?.toArray()||null,rightEye:landmarks.rightEye?.toArray()||null,
    eyeY:landmarks.eyeY,
    leftBrow:landmarks.leftBrow?.toArray()||null,rightBrow:landmarks.rightBrow?.toArray()||null,
    mouth:landmarks.mouth?.toArray()||null,
    leftEar:landmarks.leftEar?.toArray()||null,rightEar:landmarks.rightEar?.toArray()||null,
    browVerified:landmarks.browVerified,mouthVerified:landmarks.mouthVerified,
    earVerified:landmarks.earVerified,samples:landmarks.samples}:null,
  getQuality:()=>accessory?inspectAccessory(accessory):null,
  runCommand:executeForgeCommand,
  setGizmoMode,importRecipe:r=>transact(()=>{recipe=sanitizeRecipe(r);selectedId=recipe.pieces[0]?.id||null}),
  applyHelmet:()=>transact(()=>{recipe.helmet.enabled=true}),
  hideHelmet:()=>transact(()=>{recipe.helmet.enabled=false}),
  selectHelmetPart:key=>{if(!HELMET_PARTS[key])return false;selectedHelmetPart=key;renderControls();return true},
  loadRecipe:r=>transact(()=>{recipe=sanitizeRecipe(r);selectedId=recipe.pieces[0]?.id||null})};
refresh();boot();
