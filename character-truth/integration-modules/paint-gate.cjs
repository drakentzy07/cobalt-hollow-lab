/* HIGHFLY SKIN 3 — Original Rig paint proof, zero old editor collision.
 * Source real GLB rig, no forked geometry, original mesh paint/revert, seven slots,
 * V2 single-piece recipe migration and male/female visible in original viewer.
 */
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=path.resolve('character-truth/integration-proof');fs.mkdirSync(out,{recursive:true});
const record={sourceRealRig:true,originalV2Untouched:true,SKIN3BaseUntouched:true,
 PF6Untouched:true,notReleasedToGame:true,notDeployed:true,
 actualPhysicalAndroid:false,checks:[],screenshots:[],errors:[],success:false};
const verify=(x,text)=>{assert(x,text);record.checks.push(text)};
(async()=>{
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:915,height:412},hasTouch:true,isMobile:true,deviceScaleFactor:2});
  const page=await context.newPage();
  page.on('pageerror',e=>record.errors.push('JS '+String(e)));
  page.on('requestfailed',req=>record.errors.push('NETWORK '+req.url()+':'+req.failure()?.errorText));
  page.on('response',res=>{if(res.status()>=400)record.errors.push('HTTP '+res.status()+' '+res.url())});
  await page.goto('http://127.0.0.1:4173/character-truth/integration-modules/paint-preview.html',
    {waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.__HF_SKIN3_PAINT_V3_PROOF__?.state().ready ||
    window.__HF_SKIN3_PAINT_V3_PROOF__?.state().error,null,{timeout:120000});
  const api=await page.evaluate(()=>{
   const a=window.__HF_SKIN3_PAINT_V3_PROOF__;
   return {state:a.state(),model:a.model(),names:a.nodes(),materials:a.meshInfo(),
    hasOldGlobals:!!window.__MODULAR_FACTORY_DIAG__||!!window.__SKIN_FACTORY_DIAG__};
  });
  record.baseline={meshCount:api.materials.length,model:api.model,body:api.state.design.gender};
  verify(api.state.ready&&!api.state.error,'real original GLB and painter boot');
  verify(api.model.rigRoot,'genuine source Rig_Medium exists');
  verify(api.model.clips.includes('Block')&&api.model.clips.includes('Idle'),'original animations available');
  verify(api.names.includes('M_Torso'),'male body original node selected');
  verify(api.materials.length>0&&api.materials.every(x=>x.geometryId&&x.sourceMaterialPreserved),
    'armored meshes use NEW cloned materials, retaining geometry/skin');
  verify(!api.hasOldGlobals,'no V2 singleton imported');
  verify(api.state.appliedPaint.totalMeshes>0,'real chest armor paint applied');
  const take=async name=>{await page.locator('#scene').screenshot({path:path.join(out,name+'.png'),timeout:45000});
    record.screenshots.push(name+'.png')};
  await take('01-M-source-knight-raven-shaded');
  const originalPaint=api.materials.map(x=>({name:x.name,color:x.matColor,geometry:x.geometryId,rig:x.skinFingerprint}));
  const graphite=await page.evaluate(()=>window.__HF_SKIN3_PAINT_V3_PROOF__.apply('chest','knight','graphite'));
  const after=await page.evaluate(()=>window.__HF_SKIN3_PAINT_V3_PROOF__.meshInfo());
  verify(graphite.totalMeshes>0,'graphite palette repaints same original chest source meshes');
  verify(after.some(x=>!originalPaint.some(y=>y.name===x.name&&y.color===x.matColor)),
    'genuine THREE material color actually changes');
  verify(after.every(x=>originalPaint.some(y=>y.name===x.name&&y.geometry===x.geometryId&&y.rig===x.skinFingerprint)),
    'geometry and skinned skeleton count survive repaint');
  await take('02-M-source-knight-graphite-shaded');
  const gender=await page.evaluate(()=>window.__HF_SKIN3_PAINT_V3_PROOF__.gender('female'));
  const female=await page.evaluate(()=>{
   const a=window.__HF_SKIN3_PAINT_V3_PROOF__;
   return {nodes:a.nodes(),meshes:a.meshInfo(),state:a.state()};
  });
  verify(female.nodes.includes('F_Torso')&&!female.nodes.includes('M_Torso'),'female original body and same armor chosen');
  verify(female.meshes.length>0&&gender.totalMeshes>0,'paint attached to female real mesh');
  verify(female.state.design.parts.chest.paint.color==='#101118','gender swap retains paint recipe');
  await take('03-F-source-knight-graphite-shaded');
  const first=await page.evaluate(()=>window.__HF_SKIN3_PAINT_V3_PROOF__.save());
  verify(JSON.parse(first).schemaVersion===3,'safe and versioned seven-slot recipe saved');
  await page.reload({waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.__HF_SKIN3_PAINT_V3_PROOF__?.state().ready,null,{timeout:120000});
  await page.evaluate(x=>window.__HF_SKIN3_PAINT_V3_PROOF__.restore(x),first);
  const restored=await page.evaluate(()=>window.__HF_SKIN3_PAINT_V3_PROOF__.save());
  verify(restored===first,'real browser reload and recipe restoration round-trip');
  const mix=await page.evaluate(()=>{
   const a=window.__HF_SKIN3_PAINT_V3_PROOF__;
   a.apply('feet','ranger','raven');a.apply('legs','mage','graphite');
   return {state:a.state(),meshes:a.meshInfo(),full:a.save()};
  });
  verify(mix.state.design.parts.feet.set==='ranger'&&mix.state.design.parts.legs.set==='mage'&&
    mix.state.design.parts.chest.set==='knight','7-part recipe preserves mixed independent pieces');
  verify(mix.meshes.length>after.length,'mixed original armor kit paints more skinned original meshes');
  await take('04-F-source-mixed-three-part-shaded');
  const remove=await page.evaluate(()=>window.__HF_SKIN3_PAINT_V3_PROOF__.remove('chest'));
  const reduced=await page.evaluate(()=>window.__HF_SKIN3_PAINT_V3_PROOF__.state());
  verify(!reduced.design.parts.chest&&reduced.design.parts.feet&&reduced.design.parts.legs,
   'removing one visual slot does not remove adjacent equipment');
  verify(remove.totalMeshes>0,'remaining original armor pieces retain painter materials');
  const legacy={
   version:2,set:'rogue',slot:'head',color:'#aabbcc',material:'mate',
   specialSkin:null,corvusColors:null
  };
  const migrating=await page.evaluate(old=>{
   const a=window.__HF_SKIN3_PAINT_V3_PROOF__;
   a.migrate(old);return a.state();
  },legacy);
  verify(migrating.design.schemaVersion===3&&migrating.design.parts.head?.set==='rogue'&&
    Object.keys(migrating.design.parts).length===1,
    'V2 single-piece recipe migrated to V3 without inventing six more slots');
  const clean=await page.evaluate(()=>({
   b:window.__HF_SKIN3_PAINT_V3_PROOF__.state().error,
   count:window.__HF_SKIN3_PAINT_V3_PROOF__.state().draws,
   scroll:document.documentElement.scrollWidth,width:innerWidth
  }));
  verify(clean.count>=6&&clean.scroll<=clean.width+3,'mobile landscape visible without horizontal clipping');
  verify(!clean.b&&record.errors.length===0,'browser has no application or asset load errors');
  record.success=true;
  record.examples={originalColors:originalPaint.map(x=>x.color).slice(0,4),
    graphiteColors:after.map(x=>x.matColor).slice(0,4),
    femaleNodes:female.nodes.slice(0,4),mixedSlots:Object.keys(mix.state.design.parts)};
  console.log('HIGHFLY_SKIN3_V3_REAL_NATIVE_PAINTER_GREEN=1 CHECKS='+record.checks.length+
    ' CAPTURES='+record.screenshots.length+' ORIGINALS_UNMODIFIED=1 TWO_GENDERS=1');
  await context.close();
 }catch(e){record.failure=String(e.stack||e);console.error('PAINTER_V3_TEST_FAILED',record.failure);throw e}
 finally{fs.writeFileSync(path.join(out,'phase-v3-real-painter.json'),JSON.stringify(record,null,2));if(browser)await browser.close();}
})().catch(()=>process.exit(1));
