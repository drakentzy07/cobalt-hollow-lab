const fs=require('node:fs'),assert=require('node:assert/strict');
const {NodeIO}=require('@gltf-transform/core');
const validator=require('gltf-validator');
(async()=>{
 const base='character-truth/v8-proof/HIGHFLY-NIGHTFALL-rigged-body';
 const raw=fs.readFileSync(base+'.glb');
 const authored=JSON.parse(fs.readFileSync(base+'.json','utf8'));
 const validation=await validator.validateBytes(new Uint8Array(raw),
  {uri:'HIGHFLY-NIGHTFALL-rigged-body.glb',maxIssues:200});
 fs.writeFileSync(base+'-validator.json',JSON.stringify(validation,null,2));
 assert.equal(validation.issues.numErrors,0,JSON.stringify(validation.issues.messages.slice(0,12)));
 assert.equal(authored.rig,'Rig_Medium');
 assert.equal(authored.original_meshes_included,false);
 assert.deepEqual(authored.genders,['M','F']);
 assert.equal(authored.original_bones>=23,true);
 const document=await new NodeIO().read(base+'.glb');
 const root=document.getRoot();
 const skins=root.listSkins();
 assert(skins.length>=1,'No exported native skeleton');
 const boneNames=[...new Set(skins.flatMap(s=>s.listJoints().map(j=>j.getName())))];
 for(const required of ['root','hips','spine','chest','head','upperarm.l','upperarm.r',
                        'lowerarm.l','lowerarm.r','upperleg.l','upperleg.r',
                        'lowerleg.l','lowerleg.r']){
    assert(boneNames.includes(required),'Missing original '+required);
 }
 const skinned=root.listNodes().filter(n=>n.getSkin()&&n.getMesh());
 assert(skinned.length>=80&&skinned.length<=140,'Missing premium V12 skinned forge geometry '+skinned.length);
 const names=skinned.map(n=>n.getMesh().getName()||n.getName());
 for(const name of names)assert(/^HFV(?:8|12)_/.test(name),'Original/nonforged mesh leaked '+name);
 const old=names.filter(n=>n.startsWith('HFV8_'));
 const extra=names.filter(n=>n.startsWith('HFV12_'));
 assert.equal(old.length,36,'Source V8 36 weighted armor parts must remain exactly intact');
 assert(extra.length>=50,'Premium V12 missing 3D geometric armor pieces');
 for(const gender of ['M','F']){
  for(const mark of ['CHEST_ABDOMINAL_CUIRASS','CHEST_CINCHED_WAIST',
      'CHEST_FAULD_CENTER','CHEST_FAULD_L','CHEST_FAULD_R',
      'BACK_RAISED_SPINE','CHEST_NECK_COLLAR',
      'ARMS_PAULDRON_WING_L','ARMS_PAULDRON_WING_R',
      'LEGS_UPPER_CUISSE_L','LEGS_UPPER_CUISSE_R',
      'LEGS_KNEE_WARD_L','LEGS_KNEE_WARD_R']){
    assert(extra.some(n=>n.startsWith('HFV12_'+gender+'_'+mark)),
      'Missing real premium '+gender+' / '+mark);
  }
 }
 for(const gender of ['M','F'])for(const slot of ['CHEST','ARMS','HANDS','LEGS','FEET','BACK'])
    assert(names.some(n=>n.startsWith('HFV8_'+gender+'_'+slot+'_')),
     'Missing new '+gender+' '+slot);
 let weighted=0,vertices=0,triangles=0;
 for(const node of skinned){
   for(const prim of node.getMesh().listPrimitives()){
     const pos=prim.getAttribute('POSITION'),j=prim.getAttribute('JOINTS_0'),w=prim.getAttribute('WEIGHTS_0');
     assert(pos&&j&&w,'Forge mesh lacks original-skeleton skinning '+node.getName());
     assert.equal(pos.getCount(),w.getCount(),'Invalid vertex weight count');
     const tuple=[0,0,0,0];
     for(let i=0;i<w.getCount();i++){
      const v=w.getElement(i,tuple);
      const sum=v.reduce((a,b)=>a+b,0);
      assert(Number.isFinite(sum)&&sum>.97&&sum<1.03,'Invalid normalized skinning '+node.getName()+' '+sum);
      weighted++;
     }
     vertices+=pos.getCount();triangles+=(prim.getIndices()?.getCount()||pos.getCount())/3;
   }
 }
 assert(vertices>=5500&&vertices<=30000&&triangles<=25000,'V12 mobile geometry budget exceeded: '+vertices+' vertices '+triangles+' triangles');
 const result={green:true,skinnedMeshes:skinned.length,newV12Meshes:extra.length,preservedV8Meshes:old.length,realNativeBones:boneNames.length,
   weightedVertices:weighted,triangles:Math.round(triangles),
   sixSlotsForBothGenders:true,originalModelsCopied:false,
   visualQualityApproved:false,physicalS23Certified:false,
   gltfValidatorErrors:validation.issues.numErrors};
 fs.writeFileSync('character-truth/v8-proof/nightfall-v12-skinning-gate.json',JSON.stringify(result,null,2));
 console.log('HIGHFLY_V12_PREMIUM_NATIVE_BODY_WEIGHTED_GLTF_GREEN=1 '+JSON.stringify(result));
})().catch(e=>{console.error('HIGHFLY_V12_PREMIUM_ARMOR_GLTF_RED',e.stack||e);process.exitCode=1});
