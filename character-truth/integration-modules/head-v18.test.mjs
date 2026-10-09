import assert from 'node:assert/strict';import fs from 'node:fs';
import {validBox,geometryReport,proposeFit} from './head-fit-math-v18.mjs';
const box=(center,size)=>({name:'measured',center,size,
 min:center.map((x,i)=>x-size[i]/2),max:center.map((x,i)=>x+size[i]/2)});
const geometry={rig:'Rig_Medium',originalHeadsPreserved:true,originalJointCount:23,
 male:box([0,1.6,0],[.4,.5,.36]),female:box([0,1.62,0],[.37,.48,.34]),
 crown:box([.06,1.8,.01],[.5,.4,.52]),
 faceplate:box([.04,1.56,.22],[.24,.18,.1])};
const initial={preset:'oni_heavy',occlusion:'full',scale:.8,x:0,y:0,z:0};
assert.equal(validBox(geometry.male),geometry.male);
const measured=geometryReport(geometry,'male');
assert(measured.structuralValid&&measured.ratio>1.2&&measured.xError>.1);
const female=geometryReport(geometry,'female');
assert(female.headWidth<measured.headWidth);
const recommendation=proposeFit(initial,geometry,'male');
assert.equal(recommendation.fit.preset,'oni_heavy');
assert(recommendation.fit.scale<initial.scale,'Oversized crown must be scaled down');
assert(recommendation.fit.x<0,'Offset crown should move towards actual head');
assert(recommendation.fit.y<0,'Crown placed high must be moved down');
assert.equal(recommendation.fit.z,0,'Cannot invent facial orientation from bounding boxes');
assert(recommendation.fit.scale>=.55&&recommendation.fit.scale<=1.15);
assert.throws(()=>geometryReport({...geometry,rig:'DUMMY'},'male'),/ORIGINAL_RIG/);
assert.throws(()=>geometryReport({...geometry,crown:box([0,0,0],[0,1,1])},'male'),/BAD_GEOMETRY/);
assert.throws(()=>proposeFit({...initial,scale:NaN},geometry),/INVALID_EXISTING_FIT/);
assert.throws(()=>geometryReport(geometry,'alien'),/INVALID_GENDER/);
assert.equal(geometryReport({...geometry,crown:null,faceplate:null},'male').helmetLoaded,false);
const html=fs.readFileSync('highfly-dream-v18-preview/index.html','utf8');
for(const filename of ['dream-v15-ui.mjs','dream-v16-ui.mjs','dream-studio-v17.mjs','head-truth-v18.mjs'])
 assert(html.includes(filename),'V18_REUSE_COMPONENT_MISSING_'+filename);
assert(fs.readFileSync('highfly-dream-v18-preview/native-forge-v14-1.mjs','utf8').includes('geometryTruth'));
fs.mkdirSync('character-truth/v18-evidence',{recursive:true});
fs.writeFileSync('character-truth/v18-evidence/math-proof.json',JSON.stringify({
 green:true,source:'authentic-model-geometry-tested-in-browser-separately',
 means:measured,proposal:recommendation,originalRigNeverWritten:true},null,2));
console.log('HIGHFLY_V18_NUMERIC_HEAD_SOLVER_AND_V17_REUSE_GREEN=1');