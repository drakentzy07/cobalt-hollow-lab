/** HIGHFLY V20.1 — Guided Reference → Editable Recipe → REAL RIGGED GLB.
 * V16 still only recognizes pixel colors, not 3D architecture. V19 forges real existing
 * geometry; this iteration reliably parameterizes colors, bounded proportions, export.
 */
import {buildRecipe,styleGlb} from './supreme-recipe-v20.mjs';
import {analyzeReferencePixels} from './dream-image-v16.mjs';
const $=id=>document.getElementById(id);
const body=$('bodyPanel'),cockpit=$('dreamCockpit');
if(!body||!cockpit)throw Error('V20_FROZEN_GENUINE_HUNTER_STUDIO_MISSING');
const go=document.createElement('button');go.id='hf20Launch';go.className='primary';
go.textContent='👑 V20 · FORJA SUPREMA POR TEXTO / IMAGEN';
go.style.cssText='margin:6px 0;border:1px solid #eebc7e';
cockpit.querySelector('#hf19Launch')?.after(go);
if(!go.isConnected)cockpit.querySelector('h2').after(go);
const panel=document.createElement('section');panel.id='hf20Panel';panel.className='studio';
panel.style.cssText='border:1px solid #c89c65;background:linear-gradient(125deg,#36202b,#161623);margin:8px 0;';
panel.innerHTML=`<h2>👑 V20.1 · SUPREME RECIPE & ARMOR FORGE</h2>
 <p style="font-size:12px">De una idea o referencia a receta editable y variante GLB 3D real.
 Usa armadura Nightfall + piezas V19 creadas en Blender. Imagen: colores aproximados, NO reconstrucción automática de formas desconocidas.</p>
 <label for="hf20Prompt">Describí tu armadura (la descripción define las piezas)</label>
 <textarea id="hf20Prompt" rows="4" maxlength="1800" style="width:100%;box-sizing:border-box;background:#29213e;color:white;border:1px solid #8c7598;border-radius:6px;padding:8px">Armadura samurai legendaria roja carmesí y dorada, cuernos grandes en casco kabuto, máscara oni, pechera blindada con núcleo cian, hombrera izquierda gigante asimétrica, faldones segmentados, guanteletes y grebas negras.</textarea>
 <label for="hf20Image">Imagen de referencia (opcional, procesada en tu navegador)</label>
 <input id="hf20Image" type="file" accept="image/png,image/jpeg,image/webp" style="width:100%" />
 <img id="hf20ImagePreview" alt="Tu referencia" style="display:none;max-width:100%;max-height:140px;object-fit:contain;margin-top:7px" />
 <div class="buttonrow">
   <button id="hf20Analyze">1. Analizar y preparar receta</button>
   <button id="hf20Wear" class="primary">2. Vestir Hunter auténtico</button>
 </div>
 <div class="buttonrow">
   <button id="hf20ExportRecipe">↓ Guardar receta editable JSON</button>
   <button id="hf20ExportGlb">↓ Exportar armadura GLB con paleta</button>
 </div>
 <div class="buttonrow">
   <button id="hf20ClearImage">Quitar referencia</button>
   <button id="hf20Reset">Restaurar colores de V19</button>
 </div>
 <div id="hf20Status" role="status" aria-live="polite" style="font-size:12px;white-space:pre-wrap;margin-top:8px;color:#f5dfb9">Primero describí tu idea o adjuntá una imagen. La forma de las piezas todavía proviene de Nightfall y V19.</div>
 <pre id="hf20Json" style="font-size:10px;white-space:pre-wrap;overflow:auto;max-height:220px"></pre>`;
body.prepend(panel);
go.onclick=()=>{window.__HF_DREAM_V17__.selectTab('editor');panel.scrollIntoView({behavior:'smooth',block:'nearest'})};
let file=null,objectUrl=null,pixelAnalysis=null,recipe=null,lastPrompt=null;
const styles=new Map();const status=t=>$('hf20Status').textContent=t;
$('hf20Image').onchange=()=>{
 const f=$('hf20Image').files?.[0]||null;
 if(f&&(f.size>8_000_000||!['image/jpeg','image/png','image/webp'].includes(f.type))){
  file=null;status('Imagen rechazada: JPG/PNG/WEBP de hasta 8 MB.');return
 }
 file=f;pixelAnalysis=null;recipe=null;
 if(objectUrl)URL.revokeObjectURL(objectUrl);
 if(file){
  objectUrl=URL.createObjectURL(file);$('hf20ImagePreview').src=objectUrl;
  $('hf20ImagePreview').style.display='';
  status('Referencia lista. Se extraerá la paleta localmente. Describí en texto la forma de casco, hombros y cuerpo.');
 }else{$('hf20ImagePreview').style.display='none';objectUrl=null}
};
function clearImage(){
 file=null;pixelAnalysis=null;recipe=null;$('hf20Image').value='';
 if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=null;
 $('hf20ImagePreview').style.display='none';status('Referencia retirada. La próxima receta usará el texto.');
}
async function localImagePixels(){
 if(!file)return null;
 const bitmap=await createImageBitmap(file);
 try{
  const scale=Math.min(1,512/bitmap.width,512/bitmap.height);
  const c=document.createElement('canvas');
  c.width=Math.max(16,Math.round(bitmap.width*scale));
  c.height=Math.max(16,Math.round(bitmap.height*scale));
  const ctx=c.getContext('2d',{willReadFrequently:true});
  if(!ctx)throw Error('V20_CANVAS_UNAVAILABLE');
  ctx.drawImage(bitmap,0,0,c.width,c.height);
  return analyzeReferencePixels(ctx.getImageData(0,0,c.width,c.height));
 }finally{bitmap.close()}
}
async function analyze(){
 pixelAnalysis=await localImagePixels();
 recipe=buildRecipe($('hf20Prompt').value,{analysis:pixelAnalysis});
 lastPrompt=$('hf20Prompt').value;
 $('hf20Json').textContent=JSON.stringify({
  fuente:'Hunter original Rig_Medium',nombre:recipe.name,
  piezas:recipe.pieces,colores:recipe.palette,geometria:recipe.geometry,
  disponible:recipe.implementation.ready,pendiente:recipe.implementation.requiresNextForge,
  confianza:recipe.confidence
 },null,2);
 status('Receta V20.1 válida: '+Object.values(recipe.pieces).flat().length+
  ' características detectadas. '+(pixelAnalysis?'Colores de referencia V16 aproximados. ':
  'Colores desde texto. ')+
  'La pieza 3D base es auténtica V19, no una reconstrucción libre de la foto.');
 return recipe;
}
const colorRole=name=>/(?:RUNE|VIOLET|HEART|EMBER|STITCH)/.test(name)?'accent':
 /(?:EDGE|TRIM|BRACER|CUISSE_VIOLET_BAND|BUCKLE|SILVER|CRESCENT|SPIKE|GREAVE|SABATON)/.test(name)?'trim':'base';
function restore(){
 for(const [obj,entry] of styles){
  obj.material=entry.mat;
  obj.scale.copy(entry.scale);
  entry.clone?.dispose();
 }
 styles.clear();
 window.__HF_V19_SCENE__.render();
}
async function wear(){
 const r=!recipe||lastPrompt!==$('hf20Prompt').value?await analyze():recipe;
 const info=await window.__HF_LEGENDARY_V19__.wear();
 if(!info||!window.__HF_LEGENDARY_V19__.state().mounted)
  throw Error('V20_PREEXISTING_AUTHENTIC_V19_SKINNING_NOT_READY');
 restore();
 const actor=window.__HF_V19_SCENE__.root();
 const THREE=await import('three');
 let affected=0,shoulder=0;
 actor.traverse(o=>{
  if(!o.isSkinnedMesh||!/^HFV(?:8|12|19)_[MF]_(?:CHEST|BACK|ARMS|HANDS|LEGS|FEET)_/.test(o.name))return;
  const role=colorRole(o.name),original=o.material;
  if(!original||Array.isArray(original))return;
  const clone=original.clone();
  clone.color.set(r.palette[role]);
  clone.metalness=role==='base'?.77:.82;
  clone.roughness=role==='base'?.32:.24;
  if(role==='accent'&&clone.emissive){
   clone.emissive.set(r.palette.accent);clone.emissiveIntensity=.22;
  }
  const entry={mat:original,clone,scale:o.scale.clone()};
  styles.set(o,entry);o.material=clone;affected++;
  if(/^HFV19_[MF]_ARMS_DRAGON_SPIKE_/.test(o.name)){
   o.scale.multiplyScalar(r.geometry.shoulderScale);shoulder++;
  }
 });
 if(affected<60)throw Error('V20_REAL_WEIGHTED_ARMOR_NOT_READY');
 window.__HF_V19_SCENE__.render();
 status('Armado en Hunter auténtico: '+affected+' mallas con materiales reales. '+
  shoulder+' espinas ajustadas de forma acotada. '+
  'Geometría original V19; casco, cuernos especiales y hombrera asimétrica personalizada requieren la siguiente forja.');
 return {affected,shoulder,rig:'Rig_Medium',geometryFromV19:true,newFreeformMeshes:false};
}
function download(name,data,mime){
 const uri=URL.createObjectURL(new Blob([data],{type:mime}));
 const a=document.createElement('a');a.href=uri;a.download=name;a.click();
 setTimeout(()=>URL.revokeObjectURL(uri),2500);
}
async function exportRecipe(){
 const r=!recipe||lastPrompt!==$('hf20Prompt').value?await analyze():recipe;
 download('HIGHFLY-V20-SUPREME-ARMOR-recipe.json',JSON.stringify(r,null,2),'application/json');
 return r;
}
async function exportGlb(){
 const r=!recipe||lastPrompt!==$('hf20Prompt').value?await analyze():recipe;
 await wear();
 const res=await fetch('./assets/HIGHFLY-V19-LEGENDARY-COMBINED.glb',{cache:'no-store'});
 if(!res.ok)throw Error('V20_REAL_V19_COMBINED_GLB_UNAVAILABLE');
 const baked=styleGlb(new Uint8Array(await res.arrayBuffer()),r);
 download('HIGHFLY-V20-SUPREME-rigged-restyled.glb',baked.bytes,'model/gltf-binary');
 status('Exportado GLB 3D skinned con '+baked.summary.affectedPrimitives+
  ' primitivas recoloreadas y '+baked.summary.shoulderNodesScaled+
  ' transformaciones de hombro. Sin cuerpo fuente. No creó mallas libres desde imagen. Unity y S23 físico pendientes.');
 return baked.summary;
}
const action=fn=>async()=>{try{return await fn()}catch(e){status('V20 ERROR: '+String(e));throw e}};
$('hf20Analyze').onclick=()=>analyze().catch(e=>status('V20: '+e));
$('hf20Wear').onclick=()=>wear().catch(e=>status('V20: '+e));
$('hf20ExportRecipe').onclick=()=>exportRecipe().catch(e=>status('V20: '+e));
$('hf20ExportGlb').onclick=()=>exportGlb().catch(e=>status('V20: '+e));
$('hf20ClearImage').onclick=clearImage;
$('hf20Reset').onclick=()=>{restore();status('V20 edición revertida. Nightfall y V19 originales siguen intactos.')};
window.__HF_SUPREME_V20__=Object.freeze({analyze,wear,exportRecipe,exportGlb,restore,
 state:()=>({ready:true,hasReference:!!file,analyzed:!!recipe,
  mountedStyled:styles.size,originalHunterPreserved:true,
  realBlenderGeometrySource:'Nightfall V12 and V19',
  imageToArbitraryNewMesh:false,unityVerified:false,physicalSamsungVerified:false}),
 recipe:()=>recipe});
