/**
 * SKIN7 Workbench: additive controls on the existing GREEN native Hunter editor.
 * No edits to V17/V18/V19/V20 scripts; only this version's preview HTML imports it.
 * Blender generated topology -> real preview vertex buffer morph -> SAME edited GLB export.
 */
import * as THREE from 'three';
import {CONTROLS,GROUPS,defaults,normalizeDesign,recipeFromText,applyDesignToMeshes,
 rewriteGlb,groupFor} from './skin7-artisan-engine.mjs';
import {approveInLocalCatalog,catalogList,catalogGet,catalogExport} from './skin7-artisan-catalog.mjs';
const base=window.__HF_SKIN7_SUPREME_FORGE__;
const $=id=>document.getElementById(id);
if(!base?.state().ready||!$('skin7Panel'))throw Error('SKIN7_AUTHENTIC_ORIGINAL_FORGE_NOT_READY');
const panel=$('skin7Panel'),section=document.createElement('details');
section.id='skin7ArtisanEditor';section.open=false;
section.style.cssText='padding:8px;margin:10px 0;border-radius:8px;background:#282232;border:1px solid #795e75';
section.innerHTML=`<summary style="font-weight:700;cursor:pointer">🎨 EDICIÓN 3D POR PIEZA · Taller del artesano</summary>
 <p style="font-size:11px">Los controles modifican VÉRTICES de las piezas originales creadas en Blender y se guardan dentro del GLB final. No crean huesos ni alteran el juego.</p>
 <div class="buttonrow"><button id="s7ApplyText">✨ Interpretar texto y fabricar</button><button id="s7Undo">↶ Deshacer</button><button id="s7Redo">↷ Rehacer</button></div>
 <label for="s7Name">Nombre del diseño</label>
 <input id="s7Name" type="text" maxlength="90" value="Crimson Tech Oni" style="width:95%;padding:6px;background:#15131b;color:white;border:1px solid #806d86"/>
 <div id="s7Controls" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(165px,1fr));gap:6px;margin:10px 0"></div>
 <div id="s7PieceToggle" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(115px,1fr));gap:5px"></div>
 <div style="display:flex;flex-wrap:wrap;gap:8px;margin:10px 0" id="s7Colors">
  <label>Primario <input id="s7Primary" type="color" value="#a82739"/></label>
  <label>Metal <input id="s7Trim" type="color" value="#c6a05a"/></label>
  <label>Energía <input id="s7Accent" type="color" value="#25cce2"/></label>
 </div>
 <label>Imagen de referencia local (colores orientativos; formas según texto y edición, NO generación automática exacta)
 <input id="s7Reference" type="file" accept="image/png,image/jpeg,image/webp" style="width:95%"/></label>
 <div class="buttonrow"><button id="s7Apply">⚒ Aplicar forma y materiales</button><button id="s7Reset">Restaurar formas originales</button><button id="s7Recipe">↓ Guardar receta editable</button></div>
 <div id="s7EditStatus" style="font-size:11px;color:#f7dcaa;white-space:pre-wrap"></div>
 <h3 style="margin:12px 0 5px">📚 Mi catálogo de armaduras aprobadas</h3>
 <p style="font-size:11px">«ADENTRO» guarda el GLB modificado y la receta en este navegador (IndexedDB). No publica HIGHFLY. Exportá una copia por seguridad.</p>
 <div class="buttonrow"><button id="s7CatalogRefresh">Actualizar catálogo</button><button id="s7CatalogOpen">Abrir selección</button><button id="s7CatalogDownload">↓ GLB aprobado</button></div>
 <select id="s7CatalogList" aria-label="Diseños aprobados" style="max-width:100%;width:100%;color:#fff;background:#24212d;padding:7px;border:1px solid #927f91"></select>
 <div id="s7CatalogStatus" style="white-space:pre-wrap;font-size:11px;color:#d9dfd2"></div>`;
$('skin7Prompt').insertAdjacentElement('afterend',section);
const sliderRoot=$('s7Controls'),pieces=$('s7PieceToggle');
for(const [key,cfg] of Object.entries(CONTROLS)){
 const el=document.createElement('label');el.style.cssText='display:block;font-size:11px;padding:5px;background:#211d28;border-radius:5px';
 el.innerHTML=`<span>${cfg.label}</span><div style="display:flex;align-items:center;gap:5px"><input id="s7_${key}" type="range" min="${cfg.min}" max="${cfg.max}" step="${cfg.step}" value="${cfg.default}" style="width:80%"/><output id="s7out_${key}">1.00</output></div>`;
 sliderRoot.append(el);
}
const nice={HEAD:'Casco',SHOULDER_L:'Hombrera IZQ',SHOULDER_R:'Hombrera DER',CHEST:'Pechera',WAIST:'Faldones',BACK:'Espalda',ARM:'Brazos',LEG:'Piernas'};
for(const g of GROUPS){
 const el=document.createElement('label');el.style.cssText='font-size:11px;padding:4px;background:#211d28;border-radius:5px';
 el.innerHTML=`<input id="s7v_${g}" type="checkbox" checked> ${nice[g]}`;pieces.append(el);
}
let design=defaults(),baseGeometry=new Map(),history=[structuredClone(design)],cursor=0,sourceGlb=null;
const editMsg=x=>$('s7EditStatus').textContent=x;
const catalogMsg=x=>$('s7CatalogStatus').textContent=x;
const error=e=>editMsg('SKIN7 · '+String(e));
function setInput(d){
 d=normalizeDesign(d);
 $('s7Name').value=d.title;
 for(const k of Object.keys(CONTROLS)){
  $('s7_'+k).value=d.controls[k];$('s7out_'+k).textContent=d.controls[k].toFixed(2);
 }
 for(const k of GROUPS)$('s7v_'+k).checked=d.visible[k];
 $('s7Primary').value=d.palette.primary;
 $('s7Trim').value=d.palette.trim;$('s7Accent').value=d.palette.accent;
}
function fromInputs(){
 const out={controls:{},visible:{},palette:{
  primary:$('s7Primary').value,trim:$('s7Trim').value,accent:$('s7Accent').value},
  title:$('s7Name').value};
 for(const k of Object.keys(CONTROLS))out.controls[k]=Number($('s7_'+k).value);
 for(const k of GROUPS)out.visible[k]=$('s7v_'+k).checked;
 return normalizeDesign(out);
}
function meshes(){
 const root=window.__HF_V19_SCENE__?.root();
 const group=root?.getObjectByName('SKIN7_AUTHORED_BLENDER_RIG_MEDIUM_ARMOR');
 if(!group)return [];
 const ret=[];group.traverse(x=>{if(x.isSkinnedMesh&&groupFor(x.name))ret.push(x)});
 return ret;
}
function colorMaterial(mesh,d){
 if(!mesh.material||Array.isArray(mesh.material))return;
 if(!mesh.userData.skin7MaterialIsolated){
  mesh.material=mesh.material.clone();mesh.userData.skin7MaterialIsolated=true;
 }
 const n=mesh.material.name;
 const color=/GOLD|TRIM/i.test(n)?d.palette.trim:
  /ENERGY|NUCLEUS/i.test(n)?d.palette.accent:d.palette.primary;
 mesh.material.color.set(color);
 if(/ENERGY|NUCLEUS/i.test(n)&&mesh.material.emissive)mesh.material.emissive.set(color);
 mesh.material.needsUpdate=true;
}
function apply(input,{push=true,silent=false}={}){
 if(meshes().length!==70)throw Error('SKIN7_FIRST_FORGE_ORIGINAL_3D_ARMOR');
 const next=normalizeDesign(input);
 const current=meshes();
 const m=current.length;
 applyDesignToMeshes(current,next,baseGeometry);
 for(const mesh of current){
  colorMaterial(mesh,next);
  mesh.visible=mesh.visible&&mesh.name.startsWith('HF7_'+($('gender')?.value==='female'?'F':'M')+'_');
 }
 design=next;setInput(design);
 if(push){
  history=history.slice(0,cursor+1);
  history.push(structuredClone(next));
  if(history.length>26)history.shift();
  cursor=history.length-1;
 }
 window.__HF_V19_SCENE__.render();
 if(!silent)editMsg('Forma aplicada a '+m+' mallas de renderizado glTF procedentes de 68 objetos nuevos de Blender (35 visibles por Hunter).\nEl GLB exportado conservará los vértices editados, materiales y piezas ocultas.');
 return {design:structuredClone(design),meshes:m,realVerticesChanged:true,
  nativeRigModified:false,gamePublicModified:false};
}
async function forgeAndEdit(prompt=$('skin7Prompt').value,override=null){
 const parsed=override?normalizeDesign(override):recipeFromText(prompt);
 const currentPrompt=$('skin7Prompt').value; // choose original family from prompt, never invent unsupported 3D source.
 const info=await base.forge();
 baseGeometry=new Map();
 sourceGlb=await (async()=>{const r=await fetch('./assets/HIGHFLY-SKIN7-'+info.profile+'-overlay.glb',{cache:'no-store'});
  if(!r.ok)throw Error('SKIN7_SOURCE_BLENDER_GLB_UNAVAILABLE');
  return new Uint8Array(await r.arrayBuffer());
 })();
 history=[structuredClone(parsed)];cursor=0;
 const result=apply(parsed,{push:false});
 editMsg('RECETA APLICADA · '+parsed.title+'\n'+info.realBlenderNewMeshCount+
 ' mallas genuinas de Blender, dos géneros, geometría editable y exportable.\n'+
 'El texto guía parámetros compatibles; una foto por sí sola NO crea geometría inédita.');
 return {...info,design:result.design};
}
function undo(){
 if(cursor<=0)throw Error('SKIN7_NO_EARLIER_DESIGN');cursor--;
 return apply(history[cursor],{push:false});
}
function redo(){
 if(cursor>=history.length-1)throw Error('SKIN7_NO_NEXT_DESIGN');cursor++;
 return apply(history[cursor],{push:false});
}
function clearEditor(){
 base.clear();baseGeometry=new Map();sourceGlb=null;
 editMsg('Candidato retirado. Las versiones anteriores no se modificaron.');
}
function doDownload(filename,bytes,type='model/gltf-binary'){
 const u=URL.createObjectURL(new Blob([bytes],{type}));
 const a=document.createElement('a');a.href=u;a.download=filename;a.click();
 setTimeout(()=>URL.revokeObjectURL(u),5000);
}
async function editedGlb(kind='overlay'){
 const s=base.state(),profile=s.profile;
 if(!['crimson','guardian'].includes(profile)||meshes().length!==70)
  throw Error('SKIN7_NO_ACTIVE_EDITED_CANDIDATE');
 if(!sourceGlb)throw Error('SKIN7_ORIGINAL_BLENDER_SOURCE_UNAVAILABLE');
 const source=kind==='overlay'?sourceGlb:await (async()=>{
  const r=await fetch('./assets/HIGHFLY-SKIN7-'+profile+'-combined.glb',{cache:'no-store'});
  if(!r.ok)throw Error('SKIN7_COMBINED_SOURCE_NOT_FOUND');
  return new Uint8Array(await r.arrayBuffer());
 })();
 return rewriteGlb(source,design);
}
async function exportGlb(kind){
 const result=await editedGlb(kind);
 doDownload('HIGHFLY-SKIN7-'+base.state().profile+'-EDITED-'+kind+'.glb',result.bytes);
 editMsg('GLB EDITADO exportado: '+result.report.editedPrimitives+' primitivas, '+
  result.report.hiddenParts+' piezas ocultas. Originales y rig intactos.');
 return {bytes:result.bytes.length,...result.report,profile:base.state().profile};
}
async function artDecision(which){
 if(!['liked','discarded'].includes(which)||!base.state().mounted)
  throw Error('SKIN7_ART_REVIEW_NEEDS_ACTIVE_CANDIDATE');
 if(which==='discarded'){const record=base.decision('discarded');
  baseGeometry=new Map();sourceGlb=null;editMsg('AFUERA · candidato descartado, sin cambios en el catálogo aprobado.');
  return record;
 }
 const result=await editedGlb('overlay');
 const record=await approveInLocalCatalog({design,prompt:$('skin7Prompt').value,
  profile:base.state().profile,glb:result.bytes});
 base.decision('liked');
 catalogMsg('✔ ADENTRO · '+record.title+' · guardado en catálogo local con GLB editado y SHA256.\n'+
  'No se integró al juego. Exportá el GLB por seguridad.');
 await refresh();
 $('s7CatalogList').value=record.id;
 return {...record,userDecision:'liked',authorizedGameplayDeployment:false};
}
async function refresh(){
 const list=await catalogList(),sel=$('s7CatalogList');
 sel.replaceChildren();
 for(const rec of list){
  const opt=document.createElement('option');opt.value=rec.id;
  opt.textContent=rec.title+' · '+rec.profile+' · '+rec.createdAt.slice(0,10);
  sel.append(opt);
 }
 catalogMsg(list.length+' diseño(s) aprobados en este navegador. Los originales siguen intactos.');
 return list;
}
async function openApproved(id=$('s7CatalogList').value){
 const candidate=await catalogGet(id);
 const actual=await (async()=>{
  const old=$('skin7Prompt').value;
  $('skin7Prompt').value=candidate.prompt;
  try{return await forgeAndEdit(candidate.prompt,candidate.design)}
  catch(e){$('skin7Prompt').value=old;throw e}
 })();
 if(base.state().profile!==candidate.profile)throw Error('SKIN7_CATALOG_DESIGN_SOURCE_PROFILE_DRIFT');
 catalogMsg('Diseño aprobado recuperado de tu catálogo. Si lo modificás y volvés a aprobar, se crea otra versión; jamás se sobrescribe la original.');
 return {...actual,sourceArchiveSha256:candidate.sha256};
}
async function downloadApproved(id=$('s7CatalogList').value){
 const pack=await catalogExport(id);
 doDownload(pack.name,pack.bytes);catalogMsg('GLB original de catálogo exportado, SHA256 '+pack.meta.sha256);
 return {name:pack.name,sha256:pack.meta.sha256,bytes:pack.bytes.length};
}
function exportRecipe(){
 const p={schema:'highfly.skin7.artisan-recipe/1',profile:base.state().profile,
  prompt:$('skin7Prompt').value,originalRig:'Rig_Medium',nativeJointCount:23,
  style:design,sourceProducedBy:'Blender 4.2.23 original authored armor',
  imageShapeInference:'not automatic',gamePublicUnmodified:true};
 const bytes=new TextEncoder().encode(JSON.stringify(p,null,2));
 doDownload('HIGHFLY-SKIN7-RECETA.json',bytes,'application/json');
 return p;
}
async function referenceChanged(){
 const f=$('s7Reference').files?.[0];if(!f)return;
 if(f.size>8_000_000||!['image/jpeg','image/png','image/webp'].includes(f.type))
  throw Error('SKIN7_REFERENCE_8MB_JPG_PNG_WEBP_ONLY');
 const blob=URL.createObjectURL(f);
 try{
  const img=new Image();img.src=blob;await img.decode();
  const can=document.createElement('canvas');can.width=64;can.height=64;
  const ctx=can.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,64,64);
  const data=ctx.getImageData(0,0,64,64).data;
  let sum=[0,0,0],weights=0;
  for(let i=0;i<data.length;i+=4){
   if(data[i+3]<128)continue;
   const saturation=Math.max(data[i],data[i+1],data[i+2])-Math.min(data[i],data[i+1],data[i+2]);
   if(saturation<22)continue;
   for(let j=0;j<3;j++)sum[j]+=data[i+j];weights++;
  }
  if(weights){
   const hex='#'+sum.map(x=>Math.round(x/weights).toString(16).padStart(2,'0')).join('');
   $('s7Primary').value=hex;
   editMsg('Referencia leída LOCALMENTE: color principal aproximado '+hex+
    '. Para fabricar una forma concreta, describí casco/hombreras/pecho o modificá sus controles.');
   if(meshes().length===70)apply(fromInputs());
  }else editMsg('Referencia leída sin colores dominantes confiables. Probá describir las formas en texto.');
 }finally{URL.revokeObjectURL(blob)}
}
function safe(action,where=editMsg){return ()=>Promise.resolve().then(action).catch(e=>where('SKIN7 · '+String(e)))}
$('skin7Design').onclick=safe(()=>forgeAndEdit());
$('skin7Off').onclick=safe(clearEditor);
$('s7ApplyText').onclick=safe(()=>forgeAndEdit());
$('s7Apply').onclick=safe(()=>apply(fromInputs()));
$('s7Reset').onclick=safe(()=>apply(defaults()));
$('s7Undo').onclick=safe(undo);
$('s7Redo').onclick=safe(redo);
$('skin7ExportOverlay').onclick=safe(()=>exportGlb('overlay'));
$('skin7ExportFull').onclick=safe(()=>exportGlb('combined'));
$('skin7Keep').onclick=safe(()=>artDecision('liked'),catalogMsg);
$('skin7Reject').onclick=safe(()=>artDecision('discarded'));
$('s7Recipe').onclick=safe(exportRecipe);
$('s7CatalogRefresh').onclick=safe(refresh,catalogMsg);
$('s7CatalogOpen').onclick=safe(()=>openApproved(),catalogMsg);
$('s7CatalogDownload').onclick=safe(()=>downloadApproved(),catalogMsg);
$('s7Reference').onchange=safe(referenceChanged);
$('gender').addEventListener('change',()=>{if(meshes().length===70){
  const visible=$('gender').value==='female'?'F':'M';
  for(const mesh of meshes())mesh.visible=mesh.name.startsWith('HF7_'+visible+'_')&&
    design.visible[groupFor(mesh.name)];
  window.__HF_V19_SCENE__.render();
}});
for(const k of Object.keys(CONTROLS)){
 $('s7_'+k).addEventListener('input',()=>{
  $('s7out_'+k).textContent=Number($('s7_'+k).value).toFixed(2);
  if(meshes().length===70)safe(()=>apply(fromInputs(),{silent:true}))();
 });
 $('s7_'+k).addEventListener('change',()=>{if(meshes().length===70){
  // Last input already applied; finalize edit to undo/redo history.
  safe(()=>apply(fromInputs()))();
 }});
}
setInput(design);
refresh().catch(e=>catalogMsg('Catálogo no disponible aquí: '+String(e)));
window.__HF_SKIN7_ARTISAN__=Object.freeze({
 state:()=>({ready:true,design:structuredClone(design),meshes:meshes().length,
  catalogLocalOnly:true,productionApproved:false,imageToArbitraryMesh:false,
  unityCertified:false,gamePublicUnchanged:true,history:history.length}),
 forge:forgeAndEdit,apply,undo,redo,exportGlb,editedGlb,artDecision,refresh,
 openApproved,downloadApproved,exportRecipe,clear:clearEditor,recipeFromText});
