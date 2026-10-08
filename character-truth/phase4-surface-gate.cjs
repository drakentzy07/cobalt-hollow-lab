/* HIGHFLY SKIN 3 · Phase4 source-only deformed triangle intersection checks.
   A triangle crossing can be intentional seam contact; no clipping clearance
   or gameplay equivalence is authorized by passing this suite. */
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
 const dir=path.resolve('character-truth/phase4-proof');fs.mkdirSync(dir,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1450,height:850}});
  const errors=[];page.on('pageerror',e=>errors.push('pageerror '+e.message));page.on('requestfailed',r=>errors.push('request '+r.url()));
  await page.goto('http://127.0.0.1:4173/character-truth/phase4-surface.html',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.__HF_SKIN3_CAGE__?.ready||window.__HF_SKIN3_CAGE__?.error,null,{timeout:120000});
  const start=await page.evaluate(()=>({ready:window.__HF_SKIN3_CAGE__.ready,error:window.__HF_SKIN3_CAGE__.error,names:window.__HF_SKIN3_CAGE__.names,selfTest:window.__HF_SKIN3_CAGE__.surfaceDetectorSelfTest}));
  assert(start.ready,start.error||'Source model not ready');
  assert.equal(start.names.sets.length,7);assert.equal(start.names.glbs.length,6);
  assert.equal(start.selfTest.intersectingControl,true,'BVH positive contact control failed');
  assert.equal(start.selfTest.nonIntersectingControl,false,'BVH negative disjoint control failed');
  const cases=[],csv=['case,sex,kit,clip,phase,morph,value,mesh_a,mesh_b,pair_type,aabb_overlap_volume,triangle_contact'];
  const totals={testedPairs:0,contacts:0,armorBodyContacts:0,armorArmorContacts:0,perNativeKit:{}};
  async function sample(spec,id,screenshot){
   const d=await page.evaluate(x=>window.__HF_SKIN3_CAGE__.measure(x),{...spec,checkSurfaces:true});
   const k=d.surfaces;
   assert(k&&k.method==='ORIGINAL_SKINNED_WORLD_TRIANGLES_BVH','No BVH triangle evaluation '+id);
   assert(d.sourceOnly&&!d.PF6Verified&&!d.clippingCertified&&!k.notPF6Runtime===false);
   assert(k.totalAABBCandidates>=k.surfaceContacts);
   assert(d.bones>=23&&d.vertices>100);
   if(spec.kit!=='none')assert(d.parts.some(x=>x.name.startsWith('Armor_'+spec.kit+'_')),'No authentic outfit selected '+id);
   totals.testedPairs+=k.totalAABBCandidates;totals.contacts+=k.surfaceContacts;
   for(const x of k.contacts)if(x.pairType==='armor-body')totals.armorBodyContacts++;else totals.armorArmorContacts++;
   totals.perNativeKit[spec.kit]=(totals.perNativeKit[spec.kit]||0)+k.surfaceContacts;
   cases.push({id,gender:d.gender,kit:d.kit,clip:d.clip,phase:d.phase,feature:d.feature,value:d.value,
    vertexCount:d.vertices,meshCount:d.meshes,measuredPairs:k.totalAABBCandidates,triangleContacts:k.surfaceContacts,
    AABBRejected:k.AABBRejected,contacts:k.contacts});
   for(const item of k.candidates){
    const v=[id,d.gender,d.kit,d.clip,d.phase,d.feature||'',d.value,item.a,item.b,item.pairType,item.AABBOverlapVolume,item.trianglesIntersect];
    csv.push(v.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(','));
   }
   if(screenshot)await page.locator('#stage').screenshot({path:path.join(dir,id+'.png'),timeout:30000});
  }
  for(const gender of ['male','female'])for(const kit of start.names.sets)
   await sample({gender,kit,clip:'Idle',phase:0.33},gender+'-'+kit+'-idle',true);
  for(const gender of ['male','female'])for(const kit of ['knight','rogue','mage'])
   for(const clip of ['Block','Running_A'])
    await sample({gender,kit,clip,phase:0.7},gender+'-'+kit+'-'+clip,clip==='Block');
  for(const gender of ['male','female'])for(const kit of ['knight','rogue'])
   for(const feature of ['chest','shoulders','hips'])
    await sample({gender,kit,clip:'Idle',phase:0.33,feature,value:1},gender+'-'+kit+'-'+feature+'-max',false);
  assert.equal(cases.length,38);assert.equal(errors.length,0,errors.join('\n'));
  fs.writeFileSync(path.join(dir,'surface-intersections.json'),JSON.stringify({
   proof:'SOURCE_ONLY_TRIANGLE_SURFACE_CONTACT_EVIDENCE',
   upstreamSha:'9b57e49c9676d75962700f828cc00a50a9a988b5',
   priorSourceCageRun:37808537212,nativeModels:6,sampledPoses:cases.length,
   sourceOnly:true,visualClippingApproval:false,PF6RuntimeApproval:false,realDeviceApproval:false,
   triangleEdgeContactMayBeIntended:true,fullPoseCoverage:false,totals,cases,browserErrors:errors
  },null,2));
  fs.writeFileSync(path.join(dir,'pair-verdicts.csv'),csv.join('\n')+'\n');
  fs.writeFileSync(path.join(dir,'REVIEW_LIMITS.md'),
   '# HIGHFLY SKIN3 — Original source triangle surface intersections\n\n'+
   'Original frozen GLBs and original composition function, 38 sampled cases. '+ 
   'Temporary CPU-skinned triangles were evaluated in common world space; AABB screening merely narrows pair candidates. '+ 
   'Each candidate is tested using the real three-mesh-bvh triangle-intersection algorithm.\n\n'+
   'A detected contact can mean an intentional seam, surface edge overlap or actual visible clipping. '+ 
   'No contact does not rule out a wholly nested surface, intersections between samples, shader artifacts or cloth physics. '+ 
   'No PF6/gameplay runtime equivalence, armor artistic approval, production skinning or Samsung S23 clearance is certified.\n\n'+
   'Sampled poses: '+cases.length+'; checked source mesh pairs: '+totals.testedPairs+
   '; flagged possible surface contacts: '+totals.contacts+'.\n');
  console.log('HIGHFLY_SKIN3_ORIGINAL_TRIANGLE_EVIDENCE_GREEN='+cases.length+' TESTED_PAIRS='+totals.testedPairs+
   ' SURFACE_CONTACTS='+totals.contacts+' NO_CLIPPING_APPROVAL=1');
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack||e);fs.mkdirSync('character-truth/phase4-proof',{recursive:true});
 fs.writeFileSync('character-truth/phase4-proof/failure.txt',String(e.stack||e));process.exit(1)});
