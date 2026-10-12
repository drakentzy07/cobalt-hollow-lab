/** HIGHFLY SKIN13-A — secure, auditable original 3D commission state machine.
 * No fake AI; browser messages are NOT a trusted modeling or approval source. */
export const JOB_SCHEMA='highfly.skin13.forge-job/1';
export const PHASES=Object.freeze(['queued','designing','design_ready','modeling','rigging','qa','ready_for_art_review','failed']);
export const ALLOWED=Object.freeze({
 queued:['designing','failed'],
 designing:['design_ready','failed'],
 design_ready:['modeling','failed'],
 modeling:['rigging','failed'],
 rigging:['qa','failed'],
 qa:['ready_for_art_review','failed'],
 ready_for_art_review:[],failed:[]
});
const HEX=/^[0-9a-f]{64}$/i;
const REQUEST_ID=/^[a-z0-9][a-z0-9-]{7,80}$/;
const VALID_STYLE=['original','eclipse','dragon','celestial','samurai'];
function clean(s,max){return String(s??'').replace(/\s+/g,' ').trim().slice(0,max)}
export function normalizeForgeRequest(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('INVALID_JOB_REQUEST');
 const prompt=clean(raw.prompt,1100);
 if(prompt.length<12||prompt.length>1000)throw Error('PROMPT_LENGTH_12_TO_1000');
 const hasImage=raw.reference!=null;
 let reference=null;
 if(hasImage){
  const {mime,width,height,sha256,dominantColors=[]}=raw.reference;
  if(!['image/png','image/jpeg','image/webp'].includes(mime)||!HEX.test(sha256||'')||
    !Number.isInteger(width)||!Number.isInteger(height)||width<32||height<32||
    width>8192||height>8192||!Array.isArray(dominantColors)||dominantColors.length>8||
    dominantColors.some(x=>!/^#[0-9a-f]{6}$/i.test(x)))throw Error('INVALID_REFERENCE');
  reference={mime,width,height,sha256:sha256.toLowerCase(),dominantColors:[...dominantColors]};
 }
 if(hasImage&&!raw.consentForImageAnalysis)throw Error('IMAGE_ANALYSIS_REQUIRES_EXPLICIT_CONSENT');
 const preset=VALID_STYLE.includes(raw.preset)?raw.preset:'original';
 return {prompt,reference,preset,mode:hasImage?'text+image':'text',generateGltf:true,
   recreateAsOriginal:true,geometryInputs:'NEW_MESHES_ONLY',
   humanArtApprovalRequired:true,gameDeploymentAllowed:false};
}
export function newForgeJob({id,request,createdAt,source='authenticated-api'}){
 if(typeof id!=='string'||!REQUEST_ID.test(id))throw Error('INVALID_JOB_ID');
 if(typeof createdAt!=='string'||Number.isNaN(Date.parse(createdAt)))throw Error('INVALID_DATE');
 if(!['authenticated-api','manual-ci-test'].includes(source))throw Error('UNTRUSTED_JOB_SOURCE');
 const x=normalizeForgeRequest(request);
 return {schema:JOB_SCHEMA,id,createdAt,source,phase:'queued',
  request:x,output:{glb:null,proof:null,artApproved:false,gameDeployed:false},
  provenance:{parentSourceArmorGeometryCopied:false,rigReference:'Rig_Medium',
   targetRigBones:23,originalAnimationClips:22,artStatus:'NOT_REVIEWED'}};
}
export function advancePhase(job,next,{proof=null}={}){
 if(!job||job.schema!==JOB_SCHEMA)throw Error('INVALID_JOB');
 if(!ALLOWED[job.phase]?.includes(next))throw Error('ILLEGAL_JOB_TRANSITION:'+job.phase+'->'+next);
 if(next==='ready_for_art_review'){
  if(!proof||proof.freshOriginalGeometry!==true||proof.copiedSourceTriangles!==0||
    proof.originalRigBones!==23||proof.originalAnimationClips!==22||
    !proof.glbSha256||!HEX.test(proof.glbSha256)||
    proof.glbBytes<12000||proof.newSkinnedPieces<1||
    proof.artApproved!==false)throw Error('MODEL_QA_PROOF_REQUIRED');
 }
 const nextJob={...job,phase:next,output:{...job.output}};
 if(proof)nextJob.output.proof=structuredClone(proof);
 return nextJob;
}
export function clientJobStatus(backend,job){
 const state=backend?.mode==='operational'?'operational':'offline';
 if(state==='offline')return {state:'blocked',phase:null,message:'La forja automática todavía necesita credenciales privadas del servidor. No se inició ningún trabajo.'};
 if(!job)return {state:'ready',phase:null,message:'La forja está disponible para iniciar un encargo.'};
 return {state:'started',phase:job.phase,message:'Trabajo real registrado. Estado sujeto al RUN del servidor.'};
}
