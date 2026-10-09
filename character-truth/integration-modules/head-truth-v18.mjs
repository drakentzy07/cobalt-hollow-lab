/** V18 — Real Hunter Helmet Truth cockpit, composed over frozen V17. */
import {geometryReport,proposeFit} from './head-fit-math-v18.mjs';
const $=s=>document.getElementById(s);
const v14=()=>window.__HF_SKIN_STUDIO_V14_1__;
const v6=()=>window.__HF_SKIN_STUDIO_V6__;
const host=$('helmetFitPanel');
if(!host||!window.__HF_DREAM_V17__||!v6())throw Error('V18_REQUIRES_NATIVE_V17');
const panel=document.createElement('div');panel.id='hf18Panel';
panel.style.cssText='margin-top:12px;padding:10px;border:1px solid #806ab0;border-radius:10px;background:#1e1835';
panel.innerHTML=`<h2>✦ SKIN STUDIO SUPREMO · V18 HEAD TRUTH</h2>
 <small>Medición geométrica del cráneo ORIGINAL masculino/femenino y casco REAL. Ajustes solo en Kage-Oni; no reemplazamos rig, pesos ni animaciones. La inspección no certifica clipping de triángulos ni acabado artístico.</small>
 <div class="buttonrow"><button id="hf18Load">1 · Vestir casco auténtico</button><button id="hf18Scan">2 · Auditar encastre</button></div>
 <div class="buttonrow"><button id="hf18Suggest">3 · Calcular ajuste</button><button id="hf18Apply" class="primary">4 · Aplicar al casco</button></div>
 <div class="buttonrow"><button id="hf18Poses">Probar animaciones reales</button><button id="hf18Reset">Restaurar Kage-Oni</button></div>
 <button id="hf18Export">↓ Informe JSON · medidas y pruebas</button>
 <div id="hf18Status" role="status" aria-live="polite" style="font-size:11px;white-space:pre-wrap;color:#e4d8ff;margin-top:6px">Cargá el casco para analizar el encastre sobre el Hunter auténtico.</div>`;
host.append(panel);
let last=null,proposed=null,poses=null,lastError=null;
const note=s=>$('hf18Status').textContent=s;
const activeGender=()=>$('gender')?.value==='female'?'female':'male';
function scan(){
 const g=v6().geometryTruth(),gender=activeGender(),r=geometryReport(g,gender);
 last={...r,originalJointCount:g.originalJointCount,originalJointNames:g.originalJointNames,
  sourceHeadMale:g.male,sourceHeadFemale:g.female,helmetCrown:g.crown,
  helmetFaceplate:g.faceplate,fit:g.fit,gender,threeJsBounds:true,
  triangleCollisionCertified:false,physicalSamsungVerified:false,visualArtApproved:false,
  provenance:'Real frozen ClaudeCraft warrior_modular; native Kage-Oni rigid GLB'};
 note(!r.helmetLoaded?'Casco todavía no cargado.':
  'CRÁNEO '+gender.toUpperCase()+' · '+g.originalJointCount+' huesos reales\\n'+
  'Ancho cabeza '+r.headWidth.toFixed(3)+' · corona '+r.crownWidth.toFixed(3)+
  ' · proporción '+r.ratio.toFixed(3)+'\\n'+
  'Descentrado horizontal '+r.xError.toFixed(3)+' · vertical '+r.yError.toFixed(3)+
  '\\n'+(r.warnings.length?'ATENCIÓN: '+r.warnings.join(' / '):'Medidas dentro del rango ORIENTATIVO; revisar el aspecto y las poses.')+
  '\\nNo se han certificado ausencia de clipping ni fidelidad artística.');
 return last;
}
function suggest(){
 const g=v6().geometryTruth(),f=v14().state().currentFit;
 if(!f)throw Error('Primero cargar casco');
 proposed=proposeFit(f,g,activeGender());
 note('PROPUESTA geométrica (sin modificar la armadura):\\n'+
  'Escala '+proposed.fit.scale.toFixed(3)+
  ' · X '+proposed.fit.x.toFixed(3)+' · Y '+proposed.fit.y.toFixed(3)+
  ' · Z '+proposed.fit.z.toFixed(3)+
  (proposed.scaleLimited?'\\nEscala limitada por seguridad.':'')+
  '\\n'+proposed.warning);
 return proposed;
}
function apply(){
 if(!proposed||activeGender()!==last?.gender&&last)throw Error('Primero calculá el ajuste para el sexo activo');
 const before=v6().geometryTruth();
 const state=v14().setFit(proposed.fit);
 const after=scan();
 if(before.originalJointCount!==v6().geometryTruth().originalJointCount)
  throw Error('V18_RIG_CHANGED');
 proposed=null;
 note('APLICADO sobre el casco separado, nunca sobre el Hunter.\\n'+
  'Corona/cabeza '+after.ratio.toFixed(3)+
  ' · X '+state.x.toFixed(3)+' · Y '+state.y.toFixed(3)+
  '\\nRevisá la vista frontal, lateral y las animaciones.');
 return after;
}
async function load(){
 if(v6().state().realHeadAttached)return scan();
 $('forgeLoad').click();
 for(let i=0;i<100;i++){
  if(v6().state().realHeadAttached)return scan();
  await new Promise(resolve=>setTimeout(resolve,100));
 }
 throw Error('V18_AUTHENTIC_KAGE_ONI_NOT_LOADED');
}
async function poseAudit(){
 if(!v6().state().realHeadAttached)throw Error('Cargá Kage-Oni antes de probar animaciones');
 const clips=['Idle','Walking_A','Running_A','Block','1H_Melee_Attack_Chop'];
 const results=[];
 try{
  for(const clip of clips){
   const animation=window.__HF_SKIN3_FACTORY_V4__.sourceAnimation(clip,.38);
   const g=v6().geometryTruth(),r=geometryReport(g,activeGender());
   if(!animation.finiteVertices||!r.structuralValid)throw Error('V18_POSE_GEOMETRY_INVALID_'+clip);
   results.push({clip,animatedOriginalMeshes:animation.animatedMeshes,ratio:r.ratio,
    lateralOffset:r.xError,verticalOffset:r.yError,warnings:r.warnings});
  }
 }finally{
  window.__HF_SKIN3_FACTORY_V4__.sourceAnimation('Idle',.23);
 }
 poses=results;
 note('5 clips originales evaluados geométricamente:\\n'+
  results.map(x=>x.clip+': corona/cabeza '+x.ratio.toFixed(3)+
   ', lateral '+x.lateralOffset.toFixed(3)+(x.warnings.length?' · Revisar':'')).join('\\n')+
  '\\nEsto comprueba medidas en cinco poses, NO todas las penetraciones de mallas.');
 return results;
}
function download(){
 if(!last)scan();
 const data={schema:'HIGHFLY_HEAD_TRUTH_V18',createdBy:'measured-geometry',
  report:last,poseAudit:poses,geometricSuggestion:proposed,verifiedClipping:false,
  meshoptSourceOriginalUnchanged:true};
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='HIGHFLY-V18-HEAD-TRUTH.json';a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1500);
 return data;
}
function task(fn){return async()=>{try{lastError=null;return await fn()}catch(e){lastError=String(e);note('V18 · Acción rechazada: '+lastError);return null}}}
$('hf18Load').onclick=task(load);
$('hf18Scan').onclick=task(scan);
$('hf18Suggest').onclick=task(suggest);
$('hf18Apply').onclick=task(apply);
$('hf18Poses').onclick=task(poseAudit);
$('hf18Reset').onclick=task(()=>{proposed=null;const r=v14().resetFit();scan();return r});
$('hf18Export').onclick=task(download);
$('gender')?.addEventListener('change',()=>{proposed=null;if(v6().state().realHeadAttached)task(scan)()});
window.__HF_HEAD_TRUTH_V18__=Object.freeze({state:()=>({ready:true,originalOnly:true,
 helmetLoaded:v6().state().realHeadAttached,gender:activeGender(),last,proposed,poses,lastError,
 physicallyTested:false,artApproved:false,triangleClippingCertified:false}),
 scan,suggest,apply,load,poseAudit,download,
 reset:()=>v14().resetFit()});
