/**
 * HIGHFLY SKIN 7 — architecture contracts only, zero legacy runtime modifications.
 * Step 1 FREEZE: native rig truth, Blender generator intent, QA states, honest approvals.
 * Browser-compatible ESM. NEVER import old studio/editor code into this boundary.
 */
export const CONTRACT_VERSION='skin7.1';
export const SCHEMAS=Object.freeze({
  recipe:'highfly.skin7.recipe/1',
  part:'highfly.skin7.part/1',
  forge:'highfly.skin7.forge-job/1',
  candidate:'highfly.skin7.candidate/1',
  decision:'highfly.skin7.art-decision/1'
});
export const NATIVE=Object.freeze({
  rig:'Rig_Medium',bones:23,genders:Object.freeze(['M','F']),
  animations:Object.freeze(['Idle','Walking_A','Running_A','Block','1H_Melee_Attack_Chop']),
  exactSourceCommit:'9b57e49c9676d75962700f828cc00a50a9a988b5'
});
export const SLOTS=Object.freeze([
 'HEAD','SHOULDER_L','SHOULDER_R','CHEST','WAIST_FRONT','WAIST_L','WAIST_R',
 'BACK','ARM_L','ARM_R','HAND_L','HAND_R','LEG_L','LEG_R','FOOT_L','FOOT_R'
]);
export const KINDS=Object.freeze(['shell','layered-plate','horn','mask','crest','fauld','bracer','greave','sabatons','inlay']);
export const STATE=Object.freeze({
 draft:'DRAFT',qa:'QA_READY',review:'ART_REVIEW',
 approved:'APPROVED',rejected:'REJECTED'
});
const SHA=/^[a-f0-9]{64}$/i;
const KEY=/^[a-z][a-z0-9_-]{2,62}$/;
const S=set=>new Set(set);
function fail(code){throw Error('SKIN7_'+code)}
function plain(x){return !!x&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype}
function num(x,min,max){return typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max}
function boundedString(s,min,max){return typeof s==='string'&&s.trim().length>=min&&s.length<=max}
function jsonBound(x,max){
 let json;try{json=JSON.stringify(x)}catch{fail('NOT_SERIALIZABLE')}
 if(!json||json.length>max)fail('TOO_LARGE_OR_NOT_SERIALIZABLE');
 return x;
}
function clone(x){return JSON.parse(JSON.stringify(x))}
function exactKeys(obj,allowed,required=allowed){
 if(!plain(obj))fail('EXPECTED_OBJECT');
 for(const k of Object.keys(obj))if(!allowed.includes(k))fail('UNKNOWN_FIELD_'+k);
 for(const k of required)if(!(k in obj))fail('MISSING_'+k);
}
const hex=s=>typeof s==='string'&&/^#[0-9a-f]{6}$/i.test(s);
export function validatePart(value){
 jsonBound(value,4000);
 const keys=['schema','id','slot','kind','gender','donor','shape','material','generator','sourceRights'];
 exactKeys(value,keys);
 if(value.schema!==SCHEMAS.part||!KEY.test(value.id)||!S(SLOTS).has(value.slot)||
  !S(KINDS).has(value.kind)||!['M','F','both'].includes(value.gender))
   fail('PART_ID_OR_KIND');
 const p=value;
 if(!plain(p.donor)||!['native-source','forged-v12','forged-v19'].includes(p.donor.family)||
    !/^[MF]_(?:Head|Torso|Arm[LR]|Hand[LR]|Leg[LR]|Foot[LR]|Loin)$|^HFV(?:8|12|19)_[MF]_[A-Z0-9_]+$/.test(p.donor.mesh)||
    !['native-transfer','rigid-head','native-fused'].includes(p.donor.method))fail('DONOR_INVALID');
 if(!plain(p.shape))fail('SHAPE_REQUIRED');
 exactKeys(p.shape,['width','height','depth','thickness','curvature','flare','segments']);
 if(!num(p.shape.width,.015,2)||!num(p.shape.height,.015,2)||
    !num(p.shape.depth,.015,2)||!num(p.shape.thickness,.002,.18)||
    !num(p.shape.curvature,-1,1)||!num(p.shape.flare,-1,1)||
    !Number.isInteger(p.shape.segments)||p.shape.segments<3||p.shape.segments>48)
  fail('UNSAFE_GEOMETRY_PARAMETER');
 if(!plain(p.material))fail('MATERIAL_REQUIRED');
 exactKeys(p.material,['base','metallic','roughness','emissive']);
 if(!hex(p.material.base)||!num(p.material.metallic,0,1)||
  !num(p.material.roughness,.05,1)||!hex(p.material.emissive))fail('MATERIAL_INVALID');
 if(!plain(p.generator))fail('GENERATOR_REQUIRED');
 exactKeys(p.generator,['system','primitive','newTopology','version']);
 if(p.generator.system!=='blender' ||p.generator.newTopology!==true||
    !boundedString(p.generator.primitive,3,65)||
    !boundedString(p.generator.version,1,30))fail('GENERATOR_MUST_AUTHOR_TRUE_MESH');
 if(!boundedString(p.sourceRights,4,140))fail('RIGHTS_UNKNOWN');
 if((p.slot==='HEAD')!==(p.donor.method==='rigid-head'))fail('HEAD_BIND_METHOD_MISMATCH');
 return clone(p);
}
export function validateRecipe(value){
 jsonBound(value,60000);
 const keys=['schema','version','id','title','prompt','reference','rig','genders','palette','parts','sourceCommit','notes'];
 exactKeys(value,keys);
 if(value.schema!==SCHEMAS.recipe||value.version!==CONTRACT_VERSION||
  !KEY.test(value.id)||!boundedString(value.title,4,90)||
  !boundedString(value.prompt,12,3000)||value.rig!==NATIVE.rig||
  value.sourceCommit!==NATIVE.exactSourceCommit||
  !Array.isArray(value.genders)||value.genders.length!==2||
  !NATIVE.genders.every(g=>value.genders.includes(g))||
  !Array.isArray(value.parts)||value.parts.length<5||value.parts.length>42)
  fail('RECIPE_IDENTITY_OR_COMPLETENESS');
 exactKeys(value.palette,['base','trim','accent']);
 if(!Object.values(value.palette).every(hex))fail('RECIPE_PALETTE');
 exactKeys(value.reference,['type','sha256','semanticSource','unseenGeometry']);
 if(!['none','image','text'].includes(value.reference.type)||
  !(value.reference.sha256===null||SHA.test(value.reference.sha256))||
  !['manual-artist','assistant-analysis','text-parser'].includes(value.reference.semanticSource)||
  value.reference.unseenGeometry!=='requires-authored-design')fail('REFERENCE_IS_NOT_3D_TRUTH');
 if(!boundedString(value.notes,0,1200))fail('RECIPE_NOTES');
 const parts=value.parts.map(validatePart);
 if(new Set(parts.map(x=>x.id)).size!==parts.length)fail('DUPLICATE_PART_ID');
 for(const g of NATIVE.genders){
  for(const slot of ['CHEST','SHOULDER_L','SHOULDER_R','WAIST_FRONT','BACK']){
   if(!parts.some(p=>p.slot===slot && (p.gender===g||p.gender==='both')))
     fail('MISSING_FULL_SET_'+g+'_'+slot);
  }
 }
 return clone(value);
}
export function validateForgeJob(v){
 jsonBound(v,10000);
 exactKeys(v,['schema','version','id','recipeSha256','generatorSha256','donorGlbSha256',
  'nativeActorSha256','blenderVersion','targetRig','output','sourceUnmodified','gameDeployEnabled']);
 if(v.schema!==SCHEMAS.forge||v.version!==CONTRACT_VERSION||!KEY.test(v.id)||
   ![v.recipeSha256,v.generatorSha256,v.donorGlbSha256,v.nativeActorSha256].every(x=>SHA.test(x))||
   !/^4\.[0-9]+(?:\.[0-9]+)?$/.test(v.blenderVersion)||v.targetRig!==NATIVE.rig||
   v.sourceUnmodified!==true||v.gameDeployEnabled!==false)
   fail('FORGE_INPUT_AUTHORITY');
 exactKeys(v.output,['overlayGlb','combinedGlb','evidenceDir']);
 for(const s of Object.values(v.output)){
  if(!boundedString(s,3,220)||s.includes('..')||s.startsWith('/')||
    /(?:public\/models\/chars|\.github\/workflows\/deploy)/i.test(s))
    fail('FORGE_OUTPUT_PATH_ESCAPE');
 }
 return clone(v);
}
const gateNames=['glbValidator','native23','skinWeights','animation','blenderReimport','threeBrowser','historicalHash',
  'visual4views'];
export function validateCandidate(v){
 jsonBound(v,12000);
 exactKeys(v,['schema','version','id','recipeSha256','overlaySha256','combinedSha256',
  'rig','bones','sourceGameUnchanged','status','gates','review','release']);
 if(v.schema!==SCHEMAS.candidate||v.version!==CONTRACT_VERSION||!KEY.test(v.id)||
   ![v.recipeSha256,v.overlaySha256,v.combinedSha256].every(x=>SHA.test(x))||
   v.rig!==NATIVE.rig||v.bones!==NATIVE.bones||v.sourceGameUnchanged!==true||
   !S(Object.values(STATE)).has(v.status))fail('CANDIDATE_TRUTH_INVALID');
 exactKeys(v.gates,gateNames);
 if(gateNames.some(k=>typeof v.gates[k]!=='boolean'))fail('QA_GATES_UNTRUSTWORTHY');
 exactKeys(v.review,['userDecision','artistNotes','reviewedOutputSha256']);
 if(!['pending','approve','reject'].includes(v.review.userDecision)||
    !boundedString(v.review.artistNotes,0,1200)||
    !(v.review.reviewedOutputSha256===null||SHA.test(v.review.reviewedOutputSha256)))
   fail('ART_REVIEW_INVALID');
 exactKeys(v.release,['catalogOnly','autoDeployGame','unityCertified','physicalS23Certified']);
 if(v.release.catalogOnly!==true||v.release.autoDeployGame!==false||
    typeof v.release.unityCertified!=='boolean'||
    typeof v.release.physicalS23Certified!=='boolean')fail('GAME_DEPLOY_MUST_STAY_OFF');
 if(v.status===STATE.approved&&(
    !Object.values(v.gates).every(Boolean)||
    v.review.userDecision!=='approve'||
    v.review.reviewedOutputSha256!==v.combinedSha256))
    fail('AUTO_APPROVAL_FORBIDDEN');
 if(v.status===STATE.rejected&&v.review.userDecision!=='reject')
    fail('REJECTION_MUST_BE_EXPLICIT');
 if(v.status!==STATE.approved&&v.status!==STATE.rejected&&v.review.userDecision!=='pending')
    fail('REVIEW_PREMATURE');
 return clone(v);
}
/**
 * Only decisions initiated by the user may finalize. GREEN CI is technical readiness.
 * A rejected/approved candidate is terminal and immutable; a new revision has a new ID/SHA.
 * No files are changed by this pure state function.
 */
export function transitionCandidate(current,{actor,decision,notes='',reviewedSha256=null}){
 const old=validateCandidate(current);
 if(old.status===STATE.approved||old.status===STATE.rejected)fail('IMMUTABLE_FINAL_CANDIDATE');
 if(!['startQa','submitForReview','approve','reject'].includes(decision))fail('UNKNOWN_DECISION');
 if(!boundedString(notes,0,1200))fail('REVIEW_NOTES');
 const next=clone(old);
 if(decision==='startQa'){
  if(old.status!==STATE.draft)fail('BAD_QA_TRANSITION');
  next.status=STATE.qa;
 }else if(decision==='submitForReview'){
  if(old.status!==STATE.qa||!Object.values(old.gates).every(Boolean))
   fail('CANNOT_REVIEW_FAILED_QA');
  next.status=STATE.review;
 }else{
  if(actor!=='user'||old.status!==STATE.review)fail('EXPLICIT_USER_CHOICE_REQUIRED');
  if(decision==='approve'){
   if(reviewedSha256!==old.combinedSha256)fail('APPROVED_ASSET_SHA_MISMATCH');
   next.status=STATE.approved;next.review.userDecision='approve';
  }else{next.status=STATE.rejected;next.review.userDecision='reject'}
  next.review.reviewedOutputSha256=reviewedSha256;
  next.review.artistNotes=notes;
 }
 return validateCandidate(next);
}
