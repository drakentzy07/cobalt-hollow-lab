/** Adds one Spanish text-to-real-armor panel WITHOUT changing legacy editor. */
import {catalogFromNightfallGlb,createTextSkinRecipe,validateTextSkinRecipe} from './dream-recipe-v15.mjs';
const $=id=>document.getElementById(id);
const download=(filename,data,type)=>{
 const u=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');
 a.href=u;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(u),3000);
};
const panel=document.createElement('section');
panel.className='studio';panel.id='dreamTextPanel';
panel.innerHTML=`<h2>✦ V15 · TEXTO A SKIN REAL</h2>
 <p style="font-size:12px">Usa la armadura Nightfall real V12, sus materiales PBR y la forja V14. Las piezas no fabricables se declaran pendientes.</p>
 <label for="dreamText">Describí tu armadura en español</label>
 <textarea id="dreamText" rows="4" maxlength="1800" style="width:100%;background:#29213e;color:white;border:1px solid #765da7;border-radius:7px;padding:8px">Fabricá una armadura Oni samurái negra, con cuernos plateados curvados, detalles violetas, hombreras enormes, pechera segmentada y máscara demoníaca.</textarea>
 <div class="buttonrow"><button id="dreamPlan">Interpretar receta</button><button id="dreamApply" class="primary">Aplicar a Nightfall</button></div>
 <div class="buttonrow"><button id="dreamSave">↓ Guardar receta</button><button id="dreamGlb">↓ GLB 3D real</button></div>
 <div id="dreamStatus" role="status" aria-live="polite" style="white-space:pre-wrap;font-size:12px;padding:8px">V15 lista para interpretar una descripción.</div>
 <pre id="dreamPreview" style="max-height:180px;overflow:auto;white-space:pre-wrap;font-size:10px"></pre>`;
document.getElementById('bodyPanel').before(panel);
let realCatalog=null,rawBytes=null,recipe=null;
async function catalog(){
 if(realCatalog)return realCatalog;
 const r=await fetch('./assets/HIGHFLY-NIGHTFALL-rigged-body.glb');
 if(!r.ok)throw Error('No se encontro el GLB Blender real de Nightfall');
 rawBytes=new Uint8Array(await r.arrayBuffer());
 realCatalog=catalogFromNightfallGlb(rawBytes);return realCatalog;
}
function show(s){$('dreamStatus').textContent=s}
async function plan(){
 const keys=await catalog();
 recipe=createTextSkinRecipe($('dreamText').value,keys);
 $('dreamPreview').textContent=JSON.stringify({
  catalogOriginal:recipe.source.catalogKeys,palette:recipe.palette,
  partes:recipe.ingredients,pendientes:recipe.pending,
  materialesReales:recipe.paint.paints.length,formasReales:recipe.shape.shapes.length
 },null,2);
 show('Receta V15 reproducible creada. Modelo original intacto. Pendientes: '+recipe.pending.length);
 return recipe;
}
async function mounted(){
 if(window.__HF_SKIN_STUDIO_V13__?.state().mounted)return;
 $('bodyForgeLoad').click();
 for(let i=0;i<160;i++){
  if(window.__HF_SKIN_STUDIO_V13__?.state().mounted)return;
  await new Promise(r=>setTimeout(r,100));
 }
 throw Error('No se cargo Nightfall. Revisar conexion y GLB.');
}
async function apply(){
 const r=recipe||await plan();
 validateTextSkinRecipe(r,await catalog());
 await mounted();
 window.__HF_SKIN_STUDIO_V13__.loadRecipe(r.paint);
 window.__HF_SKIN_STUDIO_V14__.restore(r.shape);
 show('APLICADA: '+r.paint.paints.length+' materiales reales / '+r.shape.shapes.length+
 ' grupos 3D con pesos originales. Casco y otros pendientes NO aplicados automaticamente.\n'+
 r.pending.join('\n'));
 return r;
}
$('dreamPlan').onclick=()=>plan().catch(e=>show('Error: '+e));
$('dreamApply').onclick=()=>apply().catch(e=>show('Error: '+e));
$('dreamSave').onclick=()=>{(recipe?Promise.resolve(recipe):plan()).then(r=>download(
 'HIGHFLY-DREAM-V15-receta.json',JSON.stringify(r,null,2),'application/json')).catch(e=>show('Error: '+e))};
$('dreamGlb').onclick=async()=>{
 try{
  await apply();
  const {bytes,summary}=window.__HF_SKIN_STUDIO_V14__.bake();
  download('HIGHFLY-DREAM-V15-NIGHTFALL-real-skinned.glb',bytes,'model/gltf-binary');
  show('GLB 3D real exportado: '+summary.paintedSemanticPieces+' conjuntos pintados y '+
    summary.shapedGenderMeshes+' mallas moldeadas. No contiene el Hunter ni arregla el casco.');
 }catch(e){show('Exportacion rechazada: '+e)}
};
window.__HF_DREAM_V15__=Object.freeze({plan,apply,recipe:()=>recipe,catalog,
 state:()=>({planned:!!recipe,originalCatalogKeys:realCatalog?.length||0,
  sourceHunterUntouched:true,helmetScaleArtistApproved:false,realGlbAvailable:!!rawBytes})});
