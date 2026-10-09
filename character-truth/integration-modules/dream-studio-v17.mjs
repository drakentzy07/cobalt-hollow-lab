/** HIGHFLY Dream Studio V17 - ONE cockpit over frozen existing 3D tools. */
import {createDreamProject,validateDreamProject,serializeProject,historyReducer} from './dream-project-v17.mjs';
const $=id=>document.getElementById(id);
const aside=document.querySelector('aside');
const cockpit=document.createElement('section');cockpit.id='dreamCockpit';cockpit.className='studio';
cockpit.innerHTML=`<h2>✦ HIGHFLY · DREAM SKIN STUDIO V17</h2>
 <p style="font-size:11px">Hunter original · Rig_Medium · recetas reales V15/V16 · Blender Nightfall · editor V13/V14</p>
 <div id="dreamTabs" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px"></div>
 <div class="buttonrow"><label>Proyecto <input id="dreamProjectName" value="Mi skin legendaria" maxlength="70"/></label>
 <label>Ranura <select id="dreamProjectSlot"><option value="A">Proyecto A</option><option value="B">Proyecto B</option><option value="C">Proyecto C</option></select></label></div>
 <div class="buttonrow"><button id="dreamProjectSave" class="primary">💾 Guardar proyecto</button><button id="dreamProjectLoad">↩ Recuperar</button></div>
 <div class="buttonrow"><button id="dreamUndo">↶ Deshacer skin</button><button id="dreamRedo">↷ Rehacer skin</button></div>
 <div class="buttonrow"><button id="dreamCompare">◫ Comparar con Nightfall original</button><button id="dreamProjectReset">Restablecer proyecto</button></div>
 <div class="buttonrow"><button id="dreamProjectExport">↓ Proyecto JSON</button><button id="dreamProjectImport">↑ Importar proyecto</button></div>
 <button id="dreamFinalGlb" class="primary">↓ EXPORTAR ARMADURA GLB REAL</button>
 <input type="file" id="dreamProjectFile" accept=".json,application/json" style="display:none"/>
 <div id="dreamCockpitState" role="status" aria-live="polite" style="font-size:11px;white-space:pre-wrap;color:#d9bef8">Studio V17 · Conservamos el Hunter original y los módulos anteriores.</div>`;
aside.prepend(cockpit);
const tabs=[
 ['texto','Texto V15',['dreamTextPanel']],
 ['imagen','Imagen V16',['dreamImagePanel']],
 ['editor','Editor 3D',['bodyPanel','premiumPainterPanel','premiumModelerPanel']],
 ['casco','Casco Oni',['forgePanel','helmetFitPanel']],
 ['claude','ClaudeCraft',['bodyPanel','dreamLegacy']]
];
const nameToIds=new Map(tabs.map(([name,,ids])=>[name,ids]));
const legacy=document.createElement('details');legacy.id='dreamLegacy';
legacy.className='studio';
const summary=document.createElement('summary');summary.textContent='Herramientas nativas originales · siete piezas, animaciones, cámara e historial V4';
legacy.append(summary);
const managed=new Set(['dreamCockpit','dreamTextPanel','dreamImagePanel',
 'bodyPanel','premiumPainterPanel','premiumModelerPanel','forgePanel','helmetFitPanel']);
for(const element of [...aside.children])if(!managed.has(element.id))legacy.append(element);
aside.append(legacy);
const sty=document.createElement('style');sty.textContent=`
 #dreamCockpit{background:linear-gradient(130deg,#392050,#151124);border-color:#b06acb}
 #dreamCockpit .buttonrow{gap:5px}
 #dreamTabs button{padding:6px 3px;font-size:11px}
 #dreamTabs button[aria-pressed="true"]{background:#9460c0;outline:1px solid #e8c5ff}
 #dreamProjectName{font-size:11px}
 @media (orientation:landscape) and (max-height:530px){
 #dreamCockpit{padding:6px}#dreamCockpit h2{font-size:12px}
 #dreamCockpit p{font-size:10px}
 }
`;
document.head.append(sty);
let tab='texto',comparing=false,compareSnapshot=null;
let stack={current:null,undo:[],redo:[]},replaying=false;
const note=t=>$('dreamCockpitState').textContent=t;
function selectTab(id){
 if(!nameToIds.has(id))throw Error('V17_INVALID_TOOL_TAB');
 tab=id;
 const visible=new Set(nameToIds.get(id));
 for(const x of managed)if(x!=='dreamCockpit')$(x)&&( $(x).style.display=visible.has(x)?'':'none');
 legacy.style.display=visible.has('dreamLegacy')?'':'none';
 for(const button of $('dreamTabs').querySelectorAll('button'))
  button.setAttribute('aria-pressed',String(button.dataset.tab===id));
}
for(const [id,title] of tabs){
 const b=document.createElement('button');b.textContent=title;b.type='button';b.dataset.tab=id;
 b.onclick=async()=>{try{if(comparing)await toggleCompare();selectTab(id)}catch(e){note('Error: '+e)}};
 $('dreamTabs').append(b);
}
selectTab('texto');
function snapshot(){
 if(!window.__HF_SKIN3_FACTORY_V4__?.state().ready)throw Error('HUNTER_ORIGINAL_NOT_READY');
 return createDreamProject({
  name:$('dreamProjectName').value||'Mi skin',
  factory:window.__HF_SKIN3_FACTORY_V4__.save(),
  paint:window.__HF_SKIN_STUDIO_V13__.recipe(),
  shape:window.__HF_SKIN_STUDIO_V14__.recipe(),
  text:$('dreamText').value,notes:$('dreamImageNotes').value,
  helmetFit:window.__HF_SKIN_STUDIO_V14_1__.state().currentFit||null
 });
}
async function ensureArmor(){
 if(window.__HF_SKIN_STUDIO_V13__.state().mounted)return;
 $('bodyForgeLoad').click();
 for(let i=0;i<170;i++){
  if(window.__HF_SKIN_STUDIO_V13__.state().mounted)return;
  await new Promise(r=>setTimeout(r,100));
 }
 throw Error('BLENDER_ARMOR_NOT_MOUNTED');
}
async function restore(value){
 const p=validateDreamProject(value);
 replaying=true;
 try{
  await waitHunter();
  window.__HF_SKIN3_FACTORY_V4__.load(p.factory);
  $('dreamProjectName').value=p.name;$('dreamText').value=p.text;$('dreamImageNotes').value=p.notes;
  if(p.paint.paints.length||p.shape.shapes.length)await ensureArmor();
  if(window.__HF_SKIN_STUDIO_V13__.state().mounted){
   window.__HF_SKIN_STUDIO_V13__.loadRecipe(p.paint);
   window.__HF_SKIN_STUDIO_V14__.restore(p.shape);
  }
  if(p.helmetFit&&window.__HF_SKIN_STUDIO_V14_1__.state().realHeadAttached)
   window.__HF_SKIN_STUDIO_V14_1__.setFit(p.helmetFit);
  else if(p.helmetFit)note('Proyecto restaurado. Activá el casco manualmente para recuperar su ajuste (encastre artístico pendiente).');
  return p;
 }finally{replaying=false}
}
async function waitHunter(){
 for(let i=0;i<170;i++){
  if(window.__HF_SKIN3_FACTORY_V4__?.state().ready)return;
  await new Promise(r=>setTimeout(r,100));
 }
 throw Error('ORIGINAL_HUNTER_NOT_READY');
}
function track(){
 if(replaying||comparing)return;
 try{
  const p=snapshot();stack=historyReducer(stack,{type:'capture',snapshot:p});
  $('dreamUndo').disabled=stack.undo.length===0;$('dreamRedo').disabled=true;
 }catch(_){/* cannot snapshot before Hunter loads */}
}
const interesting=new Set(['apply','remove','mold','unmold','unmoldall',
 'kitApply','premiumApply','premiumReset','shapeApply','shapeReset','dreamApply',
 'dreamImageApply','helmetFitApply','helmetFitReset']);
document.addEventListener('click',event=>{
 if(interesting.has(event.target?.id))track();
},true);
async function undo(){
 if(comparing)await toggleCompare();
 if(!stack.undo.length)return note('No hay más cambios.');
 const current=snapshot(),previous=stack.undo.at(-1);
 stack={undo:stack.undo.slice(0,-1),redo:[current,...stack.redo].slice(0,30),current:previous};
 await restore(previous);note('Cambio anterior recuperado.');
}
async function redo(){
 if(comparing)await toggleCompare();
 if(!stack.redo.length)return note('No hay cambios para rehacer.');
 const current=snapshot(),next=stack.redo[0];
 stack={undo:[...stack.undo,current].slice(-30),redo:stack.redo.slice(1),current:next};
 await restore(next);note('Cambio rehecho.');
}
async function toggleCompare(){
 if(!window.__HF_SKIN_STUDIO_V13__.state().mounted)throw Error('Primero vestí la armadura 3D');
 if(!comparing){
  compareSnapshot=snapshot();replaying=true;
  window.__HF_SKIN_STUDIO_V13__.reset();
  window.__HF_SKIN_STUDIO_V14__.reset();
  replaying=false;comparing=true;
  $('dreamCompare').textContent='◫ Volver a skin editada';
  note('Comparando: Nightfall original SIN cambios de V13/V14; no es Hunter desnudo.');
 }else{
  await restore(compareSnapshot);comparing=false;compareSnapshot=null;
  $('dreamCompare').textContent='◫ Comparar con Nightfall original';
  note('Skin editada recuperada sin perder materiales ni vértices.');
 }
}
const storeKey=()=>('HIGHFLY_DREAM_V17_PROJECT_'+$('dreamProjectSlot').value);
async function save(){
 if(comparing)await toggleCompare();
 const p=snapshot();localStorage.setItem(storeKey(),serializeProject(p));
 note('Proyecto '+$('dreamProjectSlot').value+' guardado localmente; GLB no guardado hasta exportar.');
 return p;
}
async function load(){
 if(comparing)await toggleCompare();
 const raw=localStorage.getItem(storeKey());if(!raw)throw Error('RANURA_V17_SIN_PROYECTO');
 track();const r=await restore(raw);
 note('Proyecto '+$('dreamProjectSlot').value+' recuperado con recetas nativas.');
 return r;
}
async function reset(){
 if(comparing)await toggleCompare();
 track();await waitHunter();
 window.__HF_SKIN_STUDIO_V13__.reset();window.__HF_SKIN_STUDIO_V14__.reset();
 window.__HF_SKIN3_FACTORY_V4__.reset();
 $('dreamProjectName').value='Mi skin legendaria';
 note('Proyecto restablecido. El esqueleto y las GLB originales no fueron modificados.');
}
function download(file,data,mime){
 const blob=new Blob([data],{type:mime}),u=URL.createObjectURL(blob);
 const a=document.createElement('a');a.href=u;a.download=file;a.click();
 setTimeout(()=>URL.revokeObjectURL(u),3500);
}
function exportGlb(){
 if(comparing)throw Error('Salí de la comparación para exportar tu diseño');
 if(!window.__HF_SKIN_STUDIO_V13__.state().mounted)
  throw Error('Primero vestí Nightfall o aplicá una receta');
 const {bytes,summary}=window.__HF_SKIN_STUDIO_V14__.bake();
 download('HIGHFLY-DREAM-V17-skinned-real.glb',bytes,'model/gltf-binary');
 note('Exportación GLB real de Nightfall. '+summary.paintedSemanticPieces+
  ' mallas semánticas pintadas / '+summary.shapedGenderMeshes+
  ' mallas esculpidas. El casco es un GLB separado. Validación Unity y acabado artístico pendientes.');
 return summary;
}
const run=(fn)=>async()=>{try{return await fn()}catch(e){note('Operación rechazada: '+e)}};
$('dreamProjectSave').onclick=run(save);$('dreamProjectLoad').onclick=run(load);
$('dreamUndo').onclick=run(undo);$('dreamRedo').onclick=run(redo);
$('dreamCompare').onclick=run(toggleCompare);
$('dreamProjectReset').onclick=run(reset);
$('dreamProjectExport').onclick=run(async()=>{
 if(comparing)await toggleCompare();
 download('HIGHFLY-DREAM-V17-project.json',serializeProject(snapshot()),'application/json');
 note('Proyecto JSON de V17 descargado (sin datos de imagen ni modelo original).');
});
$('dreamProjectImport').onclick=()=>$('dreamProjectFile').click();
$('dreamProjectFile').onchange=run(async()=>{
 const file=$('dreamProjectFile').files?.[0];
 try{
  if(!file||file.size>180_000)throw Error('PROJECT_FILE_TOO_LARGE');
  const p=validateDreamProject(await file.text());
  track();await restore(p);note('Proyecto V17 importado y validado.');
 }finally{$('dreamProjectFile').value=''}
});
$('dreamFinalGlb').onclick=run(exportGlb);
window.__HF_DREAM_V17__=Object.freeze({
 state:()=>({ready:true,tab,sourceHunterStillOriginal:true,comparing,
  undoCount:stack.undo.length,redoCount:stack.redo.length,physicalS23Verified:false,
  arbitraryImageMeshReconstruction:false,unityCompatibilityCertified:false}),
 snapshot,save,load,restore,undo,redo,toggleCompare,exportGlb,selectTab,
 validate:validateDreamProject
});
