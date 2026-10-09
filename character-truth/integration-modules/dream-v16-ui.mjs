/** Pixel inspection occurs locally in browser; no image is uploaded. */
import {analyzeReferencePixels,imageToSkinRecipe} from './dream-image-v16.mjs';
const $=id=>document.getElementById(id);
const s=document.createElement('section');s.className='studio';s.id='dreamImagePanel';
s.innerHTML=`<h2>✦ V16 · IMAGEN A SKIN</h2>
 <p style="font-size:12px">Tomá una imagen JPG/PNG/WEBP. La lectura de paleta y silueta es aproximada, no reconstrucción 3D automática.</p>
 <label>Referencia de armadura <input id="dreamImageFile" type="file" accept="image/png,image/jpeg,image/webp"/></label>
 <img id="dreamImagePreview" alt="Referencia cargada" style="display:none;max-width:100%;max-height:170px;object-fit:contain" />
 <label>Indicaciones de la referencia <textarea id="dreamImageNotes" rows="2" style="width:100%;background:#29213e;color:white">Armadura samurái demoníaca Oni negra, hombreras enormes, metal plateado y runas violetas</textarea></label>
 <div class="buttonrow"><button id="dreamImageAnalyze">Analizar píxeles</button><button id="dreamImageApply" class="primary">Fabricar con V14</button></div>
 <button id="dreamImageExport">↓ Exportar referencia y receta JSON</button>
 <div id="dreamImageState" role="status" aria-live="polite" style="font-size:11px;white-space:pre-wrap">La imagen permanece en este navegador.</div>
 <pre id="dreamImageInfo" style="font-size:10px;white-space:pre-wrap;max-height:155px;overflow:auto"></pre>`;
document.getElementById('dreamTextPanel').after(s);
let imgFile=null,plan=null,raw=null,uri=null;
const status=t=>$('dreamImageState').textContent=t;
$('dreamImageFile').onchange=()=>{
 imgFile=$('dreamImageFile').files?.[0];plan=null;raw=null;
 if(uri)URL.revokeObjectURL(uri);
 if(!imgFile)return;
 if(imgFile.size>8_000_000||!/^image\/(png|jpeg|webp)$/.test(imgFile.type)){
  imgFile=null;status('Solo PNG/JPEG/WEBP de hasta 8 MB.');return
 }
 uri=URL.createObjectURL(imgFile);$('dreamImagePreview').src=uri;
 $('dreamImagePreview').style.display='block';status('Referencia cargada localmente.');
};
const imageData=async()=>{
 if(!imgFile)throw Error('Seleccioná una imagen primero');
 const bitmap=await createImageBitmap(imgFile);
 try{
  const w=Math.min(512,bitmap.width),h=Math.min(512,bitmap.height);
  const scale=Math.min(1,512/Math.max(w,h));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(16,Math.round(bitmap.width*Math.min(1,512/bitmap.width,512/bitmap.height)));
  canvas.height=Math.max(16,Math.round(bitmap.height*Math.min(1,512/bitmap.width,512/bitmap.height)));
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
  return ctx.getImageData(0,0,canvas.width,canvas.height);
 }finally{bitmap.close()}
};
async function analyze(){
 raw=analyzeReferencePixels(await imageData());
 const catalog=await window.__HF_DREAM_V15__.catalog();
 plan=imageToSkinRecipe(raw,catalog,$('dreamImageNotes').value);
 $('dreamImageInfo').textContent=JSON.stringify({
  colores:raw.palette,silueta:raw.boundsNormalized,distribucion:raw.bands,
  cubrimiento:raw.coverage,advertencias:plan.textRecipe.pending},null,2);
 status('V16 interpretó píxeles y preparó '+plan.textRecipe.paint.paints.length+
 ' materiales sobre GLB real. El diseño 3D nuevo necesita Blender y revisión humana.');
 return plan;
}
async function mount(){
 if(window.__HF_SKIN_STUDIO_V13__.state().mounted)return;
 $('bodyForgeLoad').click();
 for(let i=0;i<160;i++){
  if(window.__HF_SKIN_STUDIO_V13__.state().mounted)return;
  await new Promise(r=>setTimeout(r,100));
 }
 throw Error('GLB Nightfall no cargado');
}
async function apply(){
 const p=plan||await analyze();await mount();
 window.__HF_SKIN_STUDIO_V13__.loadRecipe(p.textRecipe.paint);
 window.__HF_SKIN_STUDIO_V14__.restore(p.textRecipe.shape);
 const result=window.__HF_SKIN_STUDIO_V14__.bake();
 const url=URL.createObjectURL(new Blob([result.bytes],{type:'model/gltf-binary'}));
 const a=document.createElement('a');a.href=url;a.download='HIGHFLY-DREAM-V16-IMAGE-PAINTED-NIGHTFALL-real.glb';a.click();
 setTimeout(()=>URL.revokeObjectURL(url),3000);
 status('GLB 3D real exportado con paleta de imagen y fuente original. No se inventaron piezas invisibles.');
 return p;
}
$('dreamImageAnalyze').onclick=()=>analyze().catch(e=>status('Error: '+e));
$('dreamImageApply').onclick=()=>apply().catch(e=>status('Error: '+e));
$('dreamImageExport').onclick=async()=>{
 try{
  const p=plan||await analyze(),url=URL.createObjectURL(new Blob([JSON.stringify(p,null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download='HIGHFLY-DREAM-V16-image-recipe.json';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
 }catch(e){status('Error: '+e)}
};
window.__HF_DREAM_V16__=Object.freeze({analyze,apply,recipe:()=>plan,
 state:()=>({imageLoaded:!!imgFile,analysed:!!plan,freeformImage3D:false,
  browserLocalImage:true,geometryConfidence:plan?.geometryConfidence})});
