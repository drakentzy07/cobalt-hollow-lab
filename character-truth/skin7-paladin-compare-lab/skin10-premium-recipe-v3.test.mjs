import assert from 'node:assert/strict';
import {buildPremiumFromText,buildPremiumV3,checkPremiumCandidate,legacyPrototypeVerdict,
 PREMIUM_SCHEMA,ELEVEN,PROTOTYPE_NO_GO} from './skin10-premium-recipe-v3.mjs';
import {parseArmorIntent} from './skin9-armor-core.mjs';
const prompts=[
 'Armadura de rey oscuro con corona fina, visor cerrado y hombreras grandes',
 'Quiero una armadura celestial blanca y oro con plumas suaves',
 'Armadura de dragon rojo con escamas, casco y garras discretas',
 'Armadura futurista tecnológica con placas de titanio y energía azul',
 'Armadura samurai negra con cresta, bordes rojos y peto laminado',
 'Armadura de bosque verde con ramas, madera y acero élfico',
 'Armadura de demonio con cuernos anatómicos y placas negras',
 'Armadura de hielo con gema en el pecho y visera transparente',
 'Armadura del rayo con cristales y placas de metal plateado',
 'Armadura de guerrero vikingo elegante con hombreras de acero',
];
for(const p of prompts){
 const recipe=buildPremiumFromText(p);
 assert.equal(recipe.schema,PREMIUM_SCHEMA);
 assert.deepEqual(Object.keys(recipe.pieces),ELEVEN);
 assert.equal(recipe.assemblyRules.preserve23Joints,true);
 assert.equal(recipe.assemblyRules.preserve22Clips,true);
 assert.equal(recipe.artGate.userApproved,false);
 assert.equal(recipe.artGate.gameDeployAllowed,false);
 assert.equal(recipe.exports.status,'BLUEPRINT_NOT_YET_MODELED');
 assert.equal(recipe.craftStandards.minimumDetailLayersPerSlot,4);
 for(const slot of ELEVEN){
  let x=recipe.pieces[slot];
  assert(x.anatomyReference.startsWith('M_'));
  assert(x.donorNativeMesh.startsWith('Armor_paladin_'));
  assert(x.steps.length>=5&&x.requiredDetailLayers.length>=4);
  assert.equal(x.requiresFreshBlenderGeometry,true);
 }
 assert.equal(checkPremiumCandidate(recipe,undefined).status,'NO_GO');
}
const r=buildPremiumV3(parseArmorIntent(prompts[0]));
assert(r.pieces.head.requestedForms.includes('crown'));
assert.equal(r.anatomyConstraints.hardLimits.headHeightToOriginalHead,1.15);
assert.equal(legacyPrototypeVerdict().gameDeployAllowed,false);
const good={
 candidateId:'NEW_INDEPENDENT_ART_MODEL',headHeightToOriginalHead:1.10,
 headWidthToOriginalHead:1.09,shoulderSpanToOriginalShoulderSpan:1.18,
 totalArmoredWidthToOriginalBodyWidth:1.30,feetWidthToOriginalFootWidth:1.07,
 maxUnattachedComponentGapMeters:.01,maxSevereClippingFrames:0,
 maxNakedHeadPixelsWhenClosedHelmet:0,skinnedArmorPieces:11,rigJointCount:23,
 originalClipCount:22,originalThirdHashUnchanged:true,maleAndFemaleVisualProof:true,
 frontSideBackScreenshots:true
};
let gp=checkPremiumCandidate(r,good);
assert.equal(gp.status,'NO_GO');assert(gp.reasons.includes('EXPLICIT_HUMAN_ART_APPROVAL_REQUIRED'));
assert.equal(gp.technicalMeasurementsPass,true);
assert.equal(checkPremiumCandidate(r,good,{humanApproved:true}).status,'ART_QA_PASSED_PENDING_GAME_INTEGRATION');
assert.equal(checkPremiumCandidate(r,good,{humanApproved:true}).gameDeployAllowed,false);
const bad={...good,candidateId:PROTOTYPE_NO_GO,headHeightToOriginalHead:1.8,
 maxUnattachedComponentGapMeters:.3,frontSideBackScreenshots:false};
const bg=checkPremiumCandidate(r,bad,{humanApproved:true});
assert.equal(bg.status,'NO_GO');
assert(bg.reasons.includes('REJECTED_SKIN9B_PROTOTYPE'));
assert(bg.reasons.some(x=>x.includes('headHeightToOriginalHead')));
assert(bg.reasons.includes('THREE_CAMERA_ANGLES_REQUIRED'));
const noSource=checkPremiumCandidate(r,{...good,rigJointCount:5},{humanApproved:true});
assert(noSource.reasons.includes('ORIGINAL_23_JOINTS_REQUIRED'));
assert.throws(()=>buildPremiumV3({}));
console.log('HIGHFLY_SKIN10_PREMIUM_RECIPE_V3_TEN_BRIEFS_ELEVEN_SLOTS_ANATOMY_HARD_NOGO_ART_APPROVAL_GATE_GREEN=1');
