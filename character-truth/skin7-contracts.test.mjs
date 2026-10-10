import assert from 'node:assert/strict';
import {SCHEMAS,NATIVE,CONTRACT_VERSION,validatePart,validateRecipe,validateForgeJob,
 validateCandidate,transitionCandidate,STATE} from './skin7-contracts.mjs';
const hex='a'.repeat(64),hashB='b'.repeat(64),hashC='c'.repeat(64),hashD='d'.repeat(64);
function part(id,slot,sex='M',kind='shell'){
 const map={HEAD:'M_Head',CHEST:'M_Torso',SHOULDER_L:'M_ArmL',SHOULDER_R:'M_ArmR',
  WAIST_FRONT:'M_Loin',BACK:'M_Torso'};
 const gender=sex==='F'?'F':'M';
 return {
  schema:SCHEMAS.part,id,slot,kind,gender:sex,
  donor:{family:'native-source',mesh:map[slot].replace(/^M_/,gender+'_'),
    method:slot==='HEAD'?'rigid-head':'native-transfer'},
  shape:{width:.25,height:.35,depth:.21,thickness:.02,curvature:.35,flare:.14,segments:12},
  material:{base:'#aa1133',metallic:.8,roughness:.29,emissive:'#11cdee'},
  generator:{system:'blender',primitive:'original-hard-surface-pauldron',newTopology:true,version:'1'},
  sourceRights:'ClaudeCraft/KayKit CC0 original donor geometry reference'
 };
}
const p=part('left_pauldron_m','SHOULDER_L');
assert.equal(validatePart(p).donor.mesh,'M_ArmL');
assert.throws(()=>validatePart({...p,shape:{...p.shape,width:100}}),/UNSAFE/);
assert.throws(()=>validatePart({...p,generator:{...p.generator,newTopology:false}}),/TRUE_MESH/);
assert.throws(()=>validatePart({...p,slot:'HEAD'}),/HEAD_BIND_METHOD/);
assert.throws(()=>validatePart({...p,extra:'unsafe'}),/UNKNOWN_FIELD/);
const slots=['CHEST','SHOULDER_L','SHOULDER_R','WAIST_FRONT','BACK'];
const parts=['M','F'].flatMap(g=>slots.map(slot=>part((g+'_'+slot).toLowerCase(),slot,g)));
const recipe={schema:SCHEMAS.recipe,version:CONTRACT_VERSION,id:'crimson_oni_pilot',title:'Crimson Tech Oni',
 prompt:'Fabricar una armadura samurai carmesi heroica con hombro izquierdo XL, pecho real y faldones',
 reference:{type:'image',sha256:hashB,semanticSource:'assistant-analysis',
  unseenGeometry:'requires-authored-design'},
 rig:NATIVE.rig,genders:['M','F'],palette:{base:'#aa1133',trim:'#f0a832',accent:'#0bdbea'},
 parts,sourceCommit:NATIVE.exactSourceCommit,notes:'Referencia conceptual; diseño 3D es original para HIGHFLY'};
assert.equal(validateRecipe(recipe).parts.length,10);
assert.throws(()=>validateRecipe({...recipe,parts:parts.slice(1)}),/MISSING_FULL_SET/);
assert.throws(()=>validateRecipe({...recipe,parts:[...parts,parts[0]]}),/DUPLICATE/);
assert.throws(()=>validateRecipe({...recipe,sourceCommit:'main'}),/IDENTITY/);
assert.throws(()=>validateRecipe({...recipe,reference:{...recipe.reference,unseenGeometry:'automatically-guessed'}}),/REFERENCE/);
const forge={schema:SCHEMAS.forge,version:CONTRACT_VERSION,id:'crimson_forge_001',
 recipeSha256:hex,generatorSha256:hashB,donorGlbSha256:hashC,nativeActorSha256:hashD,
 blenderVersion:'4.2.23',targetRig:NATIVE.rig,
 output:{overlayGlb:'candidate/crimson/overlay.glb',
  combinedGlb:'candidate/crimson/combined.glb',
  evidenceDir:'candidate/crimson/qa'},
 sourceUnmodified:true,gameDeployEnabled:false};
assert.equal(validateForgeJob(forge).targetRig,NATIVE.rig);
assert.throws(()=>validateForgeJob({...forge,gameDeployEnabled:true}),/AUTHORITY/);
assert.throws(()=>validateForgeJob({...forge,output:{...forge.output,overlayGlb:'../../public/models/chars/modular/hunter.glb'}}),/PATH_ESCAPE/);
const gates={glbValidator:true,native23:true,skinWeights:true,animation:true,
 blenderReimport:true,threeBrowser:true,historicalHash:true,visual4views:true};
const candidate={schema:SCHEMAS.candidate,version:CONTRACT_VERSION,id:'crimson_candidate_001',
 recipeSha256:hex,overlaySha256:hashB,combinedSha256:hashC,rig:NATIVE.rig,bones:23,
 sourceGameUnchanged:true,status:STATE.draft,gates,
 review:{userDecision:'pending',artistNotes:'',reviewedOutputSha256:null},
 release:{catalogOnly:true,autoDeployGame:false,unityCertified:false,physicalS23Certified:false}};
assert.equal(validateCandidate(candidate).status,STATE.draft);
assert.throws(()=>validateCandidate({...candidate,status:STATE.approved}),/AUTO_APPROVAL/);
assert.throws(()=>validateCandidate({...candidate,release:{...candidate.release,autoDeployGame:true}}),/GAME_DEPLOY/);
let obj=transitionCandidate(candidate,{actor:'ci',decision:'startQa'});
assert.equal(obj.status,STATE.qa);
assert.throws(()=>transitionCandidate(obj,{actor:'ci',decision:'approve',reviewedSha256:hashC}),/EXPLICIT_USER/);
obj=transitionCandidate(obj,{actor:'ci',decision:'submitForReview'});
assert.equal(obj.status,STATE.review);
assert.throws(()=>transitionCandidate(obj,{actor:'user',decision:'approve',reviewedSha256:hex}),/SHA_MISMATCH/);
assert.throws(()=>transitionCandidate(obj,{actor:'ci',decision:'approve',reviewedSha256:hashC}),/EXPLICIT_USER/);
const accepted=transitionCandidate(obj,{actor:'user',decision:'approve',reviewedSha256:hashC,notes:'Me gusta, adentro'});
assert.equal(accepted.status,STATE.approved);
assert.equal(accepted.release.autoDeployGame,false);
assert.throws(()=>transitionCandidate(accepted,{actor:'user',decision:'reject'}),/IMMUTABLE_FINAL/);
const rejected=transitionCandidate(obj,{actor:'user',decision:'reject',notes:'Las hombreras flotan'});
assert.equal(rejected.status,STATE.rejected);
assert.throws(()=>transitionCandidate(rejected,{actor:'user',decision:'approve',reviewedSha256:hashC}),/IMMUTABLE_FINAL/);
assert.throws(()=>transitionCandidate({...obj,gates:{...gates,visual4views:false}},
 {actor:'user',decision:'approve',reviewedSha256:hashC}),/AUTO_APPROVAL/);
assert.equal(recipe.parts.length,10);
console.log('HIGHFLY_SKIN7_STEP1_ARCHITECTURE_CONTRACTS_NATIVE_BONES_APPROVE_REJECT_SECURITY_GREEN=1');
