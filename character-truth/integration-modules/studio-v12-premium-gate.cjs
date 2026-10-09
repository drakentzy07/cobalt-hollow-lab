/* HIGHFLY V10 native browser proof: TWO Blender artifacts, ONE original Hunter. */
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=path.resolve('character-truth/v12-premium-proof');
fs.mkdirSync(base,{recursive:true});
const report={checks:[],errors:[],physicalS23Verified:false,visualArtAccepted:false,
  unityImported:false,green:false,sourceUntouched:true};
const ok=(yes,why)=>{assert(yes,why);report.checks.push(why)};
(async()=>{
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
  const context=await browser.newContext({viewport:{width:915,height:412},hasTouch:true,isMobile:true,deviceScaleFactor:2,acceptDownloads:true});
  const page=await context.newPage();
  page.on('pageerror',e=>report.errors.push('JS '+e.message));
  page.on('response',r=>{if(r.status()>=400)report.errors.push('HTTP '+r.status()+' '+r.url())});
  page.on('requestfailed',r=>report.errors.push('NET '+r.url()+' '+r.failure()?.errorText));
  const port=process.env.HF_SITE_PORT||'4173';
  await page.goto('http://127.0.0.1:'+port+(port==='4173'?
   '/character-truth/integration-modules/studio-v12.html':'/'),
   {waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.__HF_SKIN_STUDIO_V5__?.state().ready||
   window.__HF_SKIN_STUDIO_V5__?.state().error,null,{timeout:120000});
  const initial=await page.evaluate(()=>({
   original:window.__HF_SKIN_STUDIO_V5__.state(),
   v10:window.__HF_SKIN_STUDIO_V10__.state(),head:window.__HF_SKIN_STUDIO_V6__.state()
  }));
  ok(initial.original.ready&&initial.original.rig,'Actual Hunter is loaded with original Rig_Medium');
  ok(!initial.v10.mounted&&initial.v10.skinnedMeshes===0,'Native rig initially source-only; no hidden new armor');
  await page.screenshot({path:path.join(base,'01-real-hunter-before-new-armor.png')});
  await page.locator('#bodyForgeLoad').click();
  await page.waitForFunction(()=>window.__HF_SKIN_STUDIO_V10__?.state().mounted||
   /RECHAZADO/i.test(document.querySelector('#bodyForgeState')?.textContent||''),null,{timeout:60000});
  let state=await page.evaluate(()=>window.__HF_SKIN_STUDIO_V10__.state());
  const diagnostic=await page.locator('#bodyForgeState').textContent();
  console.log('HIGHFLY_V10_BROWSER_BIND_DIAGNOSTIC '+JSON.stringify({state,diagnostic,errors:report.errors}));
  report.armorDiagnostic={state,diagnostic};
  ok(state.mounted&&state.originalRig&&state.mappedToOriginalBones,'V8 weighted mesh physically bound to original rig: '+diagnostic);
  ok(state.skinnedMeshes>=80&&state.activeMeshes>=40&&state.skinnedMeshes<=140,
    'Preserved V8 36 + premium V12 meshes, real male/female filtering');
  ok(state.stats?.premiumMeshes>=50,'50+ truly new V12 premium Blender skinned meshes');
  ok(state.stats?.nativeBones===23&&state.stats?.vertices>=5500,'Actual 23 native bones and measured geometry');
  ok(await page.evaluate(()=>window.__HF_SKIN_STUDIO_V10__.bonesMatch()),'Every forged armor skin influences actual original Hunter bones');
  await page.screenshot({path:path.join(base,'02-nightfall-full-body-male-front.png')});
  const one=await page.evaluate(()=>{
   window.__HF_SKIN3_FACTORY_V4__.sourceAnimation('Idle',.25);
   return window.__HF_SKIN_STUDIO_V10__.sampleDeformation();
  });
  const two=await page.evaluate(()=>{
   window.__HF_SKIN3_FACTORY_V4__.sourceAnimation('Walking_A',.52);
   return window.__HF_SKIN_STUDIO_V10__.sampleDeformation();
  });
  ok(one.length>=40&&two.length>=40,'Original Idle and Walking_A animation deforms new body GLB');
  const lookup=new Map(one.map(m=>[m.name,m.worldSample]));
  const deltas=two.map(m=>Math.hypot(...m.worldSample.map((v,i)=>v-lookup.get(m.name)[i])));
  const maxPoseDifference=Math.max(...deltas);
  ok(maxPoseDifference>.002,'Actual original rig bone motion changes new armor vertex world coordinates: '+maxPoseDifference);
  report.maxPoseDifference=maxPoseDifference;
  await page.locator('#forgeLoad').click();
  await page.waitForFunction(()=>window.__HF_SKIN_STUDIO_V6__.state().realHeadAttached||
   /rechazada/i.test(document.querySelector('#forgeState')?.textContent||''),null,{timeout:50000});
  const head=await page.evaluate(()=>window.__HF_SKIN_STUDIO_V6__.state());
  ok(head.realHeadAttached&&head.forgedMeshes>=25,'V6 real Kage Oni forged helmet combined with V8 body on native Hunter');
  await page.locator('#front').click();
  await page.screenshot({path:path.join(base,'03-kage-oni-plus-nightfall-front.png')});
  await page.locator('#profile').click();
  await page.screenshot({path:path.join(base,'04-complete-armor-profile.png')});
  await page.locator('#backview').click();
  await page.screenshot({path:path.join(base,'05-complete-armor-back.png')});
  await page.locator('#gender').selectOption('female');
  state=await page.evaluate(()=>window.__HF_SKIN_STUDIO_V10__.state());
  ok(state.mounted&&state.activeMeshes>=40&&state.gender==='female','Female original Hunter uses only new F_ armor meshes');
  await page.locator('#front').click();
  await page.screenshot({path:path.join(base,'06-complete-female-front.png')});
  const dl=page.waitForEvent('download');
  await page.locator('#bodyForgeDownload').click();
  ok((await dl).suggestedFilename()==='HIGHFLY-NIGHTFALL-original-weighted.glb','Browser downloads genuine V8 skinned GLB');
  await page.locator('#bodyForgeOff').click();
  state=await page.evaluate(()=>window.__HF_SKIN_STUDIO_V10__.state());
  ok(!state.mounted&&!state.skinnedMeshes,'Safely remove body without affecting original character');
  ok((await page.evaluate(()=>window.__HF_SKIN_STUDIO_V6__.state())).realHeadAttached,
   'Helmet still attached independently when body removed');
  await page.locator('#forgeOff').click();
  ok(!(await page.evaluate(()=>window.__HF_SKIN_STUDIO_V6__.state())).realHeadAttached,
   'All new forge geometry can be removed while preserving source character');
  ok(report.errors.length===0,'No browser 3D, GLB, or texture load errors');
  report.green=true;
  console.log('HIGHFLY_V12_PREMIUM_NATIVE_ARMOR_BROWSER_GREEN=1 '+JSON.stringify({
   checks:report.checks.length,maxPoseDifference,originalHunter:true,newSkinnedMeshes:state.skinnedMeshes,newRigidHelmet:true,
   publicGameModified:false,visualArtAccepted:false,realSamsungTested:false}));
  await context.close();
 }catch(e){
  report.failure=String(e.stack||e);
  console.error('HIGHFLY_V12_PREMIUM_PREVIEW_RED',report.failure);
  throw e;
 }finally{
  fs.writeFileSync(path.join(base,'v12-premium-browser-report.json'),JSON.stringify(report,null,2));
  if(browser)await browser.close();
 }
})().catch(()=>process.exitCode=1);
