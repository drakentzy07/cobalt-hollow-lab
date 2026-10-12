import assert from 'node:assert/strict';
import {normalizeForgeRequest,newForgeJob,advancePhase,clientJobStatus} from './skin13-job-core.mjs';
const req={prompt:'Eclipse Eterno armadura negra y plata original con núcleo violeta y casco proporcional',preset:'eclipse'};
const n=normalizeForgeRequest(req);
assert.equal(n.geometryInputs,'NEW_MESHES_ONLY');assert.equal(n.gameDeploymentAllowed,false);
assert.equal(n.generateGltf,true);
const job=newForgeJob({id:'hf13-eclipse-test-001',request:req,createdAt:'2026-10-12T18:00:00Z',source:'manual-ci-test'});
assert.equal(job.phase,'queued');assert.equal(job.provenance.parentSourceArmorGeometryCopied,false);
assert.throws(()=>advancePhase(job,'ready_for_art_review'),/ILLEGAL_JOB_TRANSITION/);
let j=job;for(const p of ['designing','design_ready','modeling','rigging','qa'])j=advancePhase(j,p);
assert.throws(()=>advancePhase(j,'ready_for_art_review'),/MODEL_QA_PROOF_REQUIRED/);
const proof={freshOriginalGeometry:true,copiedSourceTriangles:0,originalRigBones:23,
 originalAnimationClips:22,glbSha256:'a'.repeat(64),glbBytes:102400,
 newSkinnedPieces:12,artApproved:false};
j=advancePhase(j,'ready_for_art_review',{proof});
assert.equal(j.output.artApproved,false);assert.equal(j.output.gameDeployed,false);
assert.throws(()=>advancePhase(j,'modeling'),/ILLEGAL_JOB_TRANSITION/);
const img={mime:'image/png',width:256,height:256,sha256:'a'.repeat(64),dominantColors:['#ff0000']};
assert.throws(()=>normalizeForgeRequest({...req,reference:img}),/CONSENT/);
assert.equal(normalizeForgeRequest({...req,reference:img,consentForImageAnalysis:true}).mode,'text+image');
assert.throws(()=>normalizeForgeRequest({...req,reference:{...img,mime:'text/html'},consentForImageAnalysis:true}));
assert.throws(()=>normalizeForgeRequest({prompt:'x'}));
assert.equal(clientJobStatus({mode:'offline'},null).state,'blocked');
assert.equal(clientJobStatus({mode:'operational'},job).phase,'queued');
console.log('SKIN13_SECURE_REAL_JOBS_STATE_MACHINE_AND_NO_FAKE_AI_GREEN=1');
