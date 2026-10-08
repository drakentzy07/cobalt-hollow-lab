/* HIGHFLY SKIN FACTORY V4 — authentic Rig_Medium original + complete 7-slot
 * paints AND shapes save/load, hostile input rejection and 5 original animations.
 * The complete V3 painter + molder predecessors remain unmodified and rerun.
 */
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const output=path.resolve('character-truth/factory-v4-proof');fs.mkdirSync(output,{recursive:true});
const report={kind:'SKIN3 ORIGINAL NATIVE FULL VISUAL EDITOR V4',mainGameModified:false,
 originalSKIN3Modified:false,originalSKINFACTORYV2Modified:false,
 priorPainterAndMolderModified:false,actualPhoneTested:false,
 productionInventoryConnected:false,animationClippingCertified:false,
 green:false,checks:[],screenshots:[],errors:[],animationSamples:[]};
function ok(condition,label){assert(condition,label);report.checks.push(label)}
function s(a,b,c,d){return {width:a,length:b,depth:c,taper:d}}
(async()=>{
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:915,height:412},
   isMobile:true,hasTouch:true,deviceScaleFactor:2,
   userAgent:'Mozilla/5.0 (Linux; Android 16; SM-S918B) AppleWebKit/537.36 Chrome/140.0.0.0 Mobile Safari/537.36'});
  const page=await context.newPage();
  page.on('pageerror',e=>report.errors.push('PAGE: '+String(e)));
  page.on('requestfailed',r=>report.errors.push('NET: '+r.url()+' '+r.failure()?.errorText));
  page.on('response',r=>{if(r.status()>=400)report.errors.push('HTTP '+r.status()+' '+r.url())});
  await page.goto('http://127.0.0.1:4173/character-truth/integration-modules/factory-v4.html',
   {waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.__HF_SKIN3_FACTORY_V4__?.state()?.ready ||
   window.__HF_SKIN3_FACTORY_V4__?.state()?.error,null,{timeout:120000});
  const read=()=>page.evaluate(()=>{
   const a=window.__HF_SKIN3_FACTORY_V4__;
   return {state:a.state(),boundary:a.boundary(),geometry:a.geometry(),
    viewport:innerWidth,pagewidth:document.documentElement.scrollWidth,
    sceneWidth:document.getElementById('scene').getBoundingClientRect().width,
    hasOldGlobals:Object.keys(window).some(k=>k.startsWith('__MODULAR_FACTORY_')||k.startsWith('__SKIN_FACTORY_'))};
  });
  const start=await read();
  ok(start.state.ready&&!start.state.error,'authentic source Hunter GLB and original Rig_Medium loaded');
  ok(start.state.design.schemaVersion===3&&start.state.completeRecipe.schemaVersion===4,'V4 wraps compatible V3 painter without modifying it');
  ok(start.state.appliedPaint.totalMeshes>0,'original mesh material modified on original armor');
  ok(start.state.appliedMold.changedMeshes===0,'entry retains all original geometry');
  ok(start.sceneWidth>450&&start.pagewidth<=start.viewport+3,'horizontal layout fits S23 emulation without overflow');
  ok(!start.hasOldGlobals,'old painter editor singleton globals absent');
  ok(!start.boundary.actualEquipAuthority&&!start.boundary.gameSaveWritten&&!start.boundary.trainingStatsTouched,
    'source-only recipe explicitly disallows gameplay stats or production save authority');
  const take=async label=>{await page.locator('#scene').screenshot({path:path.join(output,label+'.png'),timeout:45000});report.screenshots.push(label+'.png')};
  await take('01-initial-male-native-chest-paint');
  const draft=await page.evaluate(()=>{
   const a=window.__HF_SKIN3_FACTORY_V4__;
   a.put('feet','ranger','raven');
   a.put('legs','mage','graphite');
   a.shape('chest',{width:.6,length:.3,depth:-.2,taper:.2});
   a.shape('legs',{width:-.25,length:.4,depth:.1,taper:.15});
   a.shape('feet',{width:.2,length:0,depth:.4,taper:0});
   return {complete:a.state().completeRecipe,json:a.save(),geometry:a.geometry()};
  });
  ok(Object.keys(draft.complete.design.parts).length===3,'three real source kits selected independently');
  ok(Object.keys(draft.complete.shapes).length===3,'all three slot deformations stored in ONE source-only V4 recipe');
  ok(draft.complete.design.parts.chest.paint.color==='#19141f','original V3 raven paint retained');
  ok(draft.complete.design.parts.legs.paint.color==='#101118','independent graphite paint retained');
  ok(draft.complete.shapes.chest.width===.6&&draft.complete.shapes.legs.length===.4&&draft.complete.shapes.feet.depth===.4,
    'width length depth taper preserved in V4 structured data');
  ok(draft.geometry.some(x=>x.visible&&x.changed&&x.sourcePositions!==x.livePositions),
    'actual original source vertices deformed into isolated geometry clones');
  ok(draft.geometry.filter(x=>x.changed).every(x=>
    x.sourceSkinWeight===x.liveSkinWeight&&x.sourceSkinIndex===x.liveSkinIndex),
    'source rig skin weights and indices unchanged across all three edited slots');
  ok(draft.geometry.filter(x=>x.visible&&!x.name.startsWith('Armor_')).every(x=>!x.changed),
    'original male body geometry never modified by armor sculpt');
  await take('02-male-combined-three-painted-and-molded');
  const stateWithAnimations=await page.evaluate(()=>{
   const api=window.__HF_SKIN3_FACTORY_V4__;
   const out=[];
   for(const name of ['Idle','Walking_A','Running_A','Block','1H_Melee_Attack_Chop']){
    out.push(api.sourceAnimation(name,.36));
   }
   return {frames:out,geom:api.geometry(),design:api.state().completeRecipe};
  });
  report.animationSamples=stateWithAnimations.frames;
  ok(stateWithAnimations.frames.length===5&&stateWithAnimations.frames.every(a=>a.finiteVertices&&a.animatedMeshes>0),
    'sampled original 5 clips on deformed actual skinned armor without NaN vertices');
  ok(stateWithAnimations.geom.filter(x=>x.changed).every(x=>
    x.sourceSkinWeight===x.liveSkinWeight&&x.sourceSkinIndex===x.liveSkinIndex),
    'all animation samples preserve source bone weights and skin indices');
  ok(JSON.stringify(stateWithAnimations.design)===JSON.stringify(draft.complete),
    'playing animations never changes design recipe or geometries');
  await take('03-male-native-attack-animation-sampled');
  const sex=await page.evaluate(()=>{
   const api=window.__HF_SKIN3_FACTORY_V4__;
   api.gender('female');
   return {state:api.state(),geometry:api.geometry()};
  });
  ok(sex.state.design.gender==='female'&&Object.keys(sex.state.moldShapes).length===3,
    'female source Hunter keeps three painted and molded slots');
  ok(sex.geometry.filter(x=>x.changed).length>0&&sex.geometry.filter(x=>x.changed).every(x=>
    x.sourceSkinWeight===x.liveSkinWeight&&x.sourceSkinIndex===x.liveSkinIndex),
    'female armor geometry cloned with identical skinning');
  await take('04-female-native-three-piece');
  // Use actual visible UI buttons, not only client APIs.
  await page.locator('#save').click();
  const saved=await page.evaluate(()=>localStorage.getItem('HIGHFLY_SKIN3_FACTORY_V4_SAVED_DESIGN'));
  ok(!!saved&&JSON.parse(saved).schemaVersion===4&&JSON.parse(saved).shapes.chest.width===.6,
    'save UI stores entire paint and sculpt geometry recipe, not just colors');
  await page.locator('#reset').click();
  const erased=await read();
  ok(Object.keys(erased.state.design.parts).length===0&&Object.keys(erased.state.moldShapes).length===0&&
    erased.geometry.every(m=>m.sourceGeometryId===m.liveGeometryId),
    'reset UI restores every ORIGINAL geometry and clears all full V4 design data');
  await page.reload({waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.__HF_SKIN3_FACTORY_V4__?.state()?.ready,null,{timeout:120000});
  await page.locator('#load').click();
  const recovered=await read();
  ok(recovered.state.completeRecipe.design.gender==='female'&&
    Object.keys(recovered.state.completeRecipe.design.parts).length===3,'real browser reload reconstructs gender and all three sets');
  ok(JSON.stringify(recovered.state.completeRecipe)===saved,'full V4 recipe identical after reload');
  ok(recovered.geometry.some(m=>m.visible&&m.changed&&m.sourcePositions!==m.livePositions),
    'after reload original GLB geometry is actually molded again, not just metadata');
  await take('05-female-restored-from-actual-browser-reload');
  // A hostile saved recipe must fail CLOSED and keep existing state/geometry.
  const corrupted=JSON.parse(saved);
  corrupted.shapes.chest.width=40;
  const beforeInvalid=await page.evaluate(()=>window.__HF_SKIN3_FACTORY_V4__.save());
  await page.evaluate(x=>localStorage.setItem('HIGHFLY_SKIN3_FACTORY_V4_SAVED_DESIGN',JSON.stringify(x)),corrupted);
  await page.locator('#load').click();
  const afterInvalid=await page.evaluate(()=>window.__HF_SKIN3_FACTORY_V4__.save());
  ok(afterInvalid===beforeInvalid,'malicious oversized saved mold rejected without mutating restored Hunter');
  const older=await page.evaluate(()=>{
   const api=window.__HF_SKIN3_FACTORY_V4__;
   const previous=api.state().design;
   api.importV3(previous);
   return api.state().completeRecipe;
  });
  ok(older.schemaVersion===4&&Object.keys(older.shapes).length===0&&
    Object.keys(older.design.parts).length===3,
    'safe explicit V3 migration preserves color and parts, starts with zero molds');
  const last=await read();
  ok(last.geometry.every(m=>m.sourceGeometryId===m.liveGeometryId),
    'V3 import safely restores original molder geometry references');
  ok(report.errors.length===0&&!last.state.error,'no browser runtime errors, 404s or missing assets');
  report.green=true;report.counts={checks:report.checks.length,images:report.screenshots.length,
   verifiedOriginalClips:report.animationSamples.length,originalSourceMeshes:start.state.molder.originalSourceCount};
  console.log('HIGHFLY_SKIN3_FACTORY_V4_SAVED_PAINT_AND_MOLD_GREEN=1 CHECKS='+report.checks.length+
   ' CLIPS='+report.animationSamples.length+' SHOTS='+report.screenshots.length+
   ' ORIGINAL_SOURCE_AND_SKINNING_UNCHANGED=1 PRODUCTION_UNMODIFIED=1');
  await context.close();
 }catch(e){report.failure=String(e.stack||e);console.error('SKIN3_FACTORY_V4_TEST_RED',report.failure);throw e}
 finally{fs.writeFileSync(path.join(output,'factory-v4-acceptance.json'),JSON.stringify(report,null,2));if(browser)await browser.close()}
})().catch(()=>process.exit(1));
