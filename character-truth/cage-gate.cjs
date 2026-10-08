const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright');
// Native full-body skinned-vertex measurement, not a proof of clipping clearance.
(async()=>{
 const dir=path.resolve('character-truth/cage-proof');fs.mkdirSync(dir,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 try {
  const page=await browser.newPage({viewport:{width:1450,height:850}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(r.url()));
  await page.goto('http://127.0.0.1:4173/character-truth/cage.html',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.__HF_SKIN3_CAGE__?.ready||window.__HF_SKIN3_CAGE__?.error,null,{timeout:120000});
  const boot=await page.evaluate(()=>({ready:window.__HF_SKIN3_CAGE__.ready,error:window.__HF_SKIN3_CAGE__.error,names:window.__HF_SKIN3_CAGE__.names}));
  assert(boot.ready,boot.error||'Cage startup failed');
  assert.equal(boot.names.glbs.length,6);assert.equal(boot.names.sets.length,7);
  assert.equal(boot.names.slots.length,7);assert.equal(boot.names.body.length,7);assert.equal(boot.names.face.length,8);
  const results=[],csv=['sex,kit,clip,phase,feature,value,mesh,zone,vertices,min_x,min_y,min_z,max_x,max_y,max_z'];
  async function sample(s,id,screenshot=false){
   const d=await page.evaluate(x=>window.__HF_SKIN3_CAGE__.measure(x),s);
   assert(d.sourceOnly&&!d.PF6Verified&&!d.clippingCertified);
   assert(d.full.size.every(Number.isFinite)&&d.full.size.every(x=>x>0));
   assert(d.vertices>100&&d.bones>=23&&d.meshes>=5&&d.parts.length===d.meshes);
   if(s.kit!=='none')assert(d.parts.some(x=>x.name.startsWith('Armor_'+s.kit+'_')),'Missing source armor '+id);
   if(s.feature)assert(Object.keys(d.morphHits).length>0,'Missing original morph '+id);
   results.push({id,sex:d.gender,kit:d.kit,clip:d.clip,phase:d.phase,feature:d.feature,value:d.value,
    full:d.full,zones:d.zones,vertices:d.vertices,meshes:d.meshes,bones:d.bones,morphTargets:Object.keys(d.morphHits)});
   for(const p of d.parts){
    const record=[d.gender,d.kit,d.clip,d.phase,d.feature||'',d.value,p.name,p.zone,p.vertices,...p.bounds.min,...p.bounds.max];
    csv.push(record.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(','));
   }
   if(screenshot)await page.locator('#stage').screenshot({path:path.join(dir,id+'.png'),timeout:30000});
  }
  for(const gender of ['male','female']){
   await sample({gender,kit:'none',clip:'Idle'},gender+'-bare',true);
   for(const kit of boot.names.sets)await sample({gender,kit,clip:'Idle'},gender+'-'+kit,true);
  }
  for(const gender of ['male','female'])for(const kit of ['knight','rogue','mage'])
   for(const clip of ['Walking_A','Running_A','Block','1H_Melee_Attack_Chop'])
    for(const phase of [0.2,0.7])
     await sample({gender,kit,clip,phase},gender+'-'+kit+'-'+clip+'-'+phase,clip==='Block'&&phase===0.7);
  for(const gender of ['male','female']){
   for(const feature of boot.names.body)for(const value of [-1,1])
    await sample({gender,kit:'none',clip:'Idle',feature,value},gender+'-body-'+feature+'-'+value);
   for(const feature of boot.names.face)for(const value of [-1,1])
    await sample({gender,kit:'none',clip:'Idle',feature,value},gender+'-face-'+feature+'-'+value);
  }
  assert.equal(results.length,16+48+60);
  assert(!errors.length,errors.join('\n'));
  fs.writeFileSync(path.join(dir,'cage-summary.json'),JSON.stringify({sourceRun:37803666522,
   upstream:'9b57e49c9676d75962700f828cc00a50a9a988b5',
   originalComposer:true,numberOfOriginalGLBs:6,totalCases:results.length,morphExtremes:60,
   PF6SceneCertified:false,clippingCertified:false,mobileCertified:false,
   cases:results,errors},null,2));
  fs.writeFileSync(path.join(dir,'per-mesh-cages.csv'),csv.join('\n')+'\n');
  fs.writeFileSync(path.join(dir,'LIMITATIONS.md'),
   '# HIGHFLY SKIN3 Phase 3: authentic source body cage\n\nThis is original modular.ts composition + native skinned vertices and real morphs at sampled source animation times. 124 cases. Measured per-mesh bounds are NOT triangle intersections, garment clearance, PF6 runtime integration, S23 profiling or compatible legendary armor certification.\n');
  console.log('HIGHFLY_SKIN3_NATIVE_BODY_CAGE_GREEN='+results.length+' MORPH_EXTREMES=60');
 } finally {await browser.close()}
})().catch(e=>{console.error(e.stack||e);fs.mkdirSync('character-truth/cage-proof',{recursive:true});
 fs.writeFileSync('character-truth/cage-proof/failure.txt',String(e.stack||e));process.exit(1)});
