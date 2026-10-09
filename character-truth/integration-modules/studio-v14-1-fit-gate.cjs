/* V14.1 real Hunter closed Oni headset fit with 5 presets, no bone modification. */
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const out=path.resolve('character-truth/v14-1-fit-proof');fs.mkdirSync(out,{recursive:true});
const report={checks:[],errors:[],green:false,physicalSamsungVerified:false,unityImportVerified:false,
 visualArtistApproved:false,sourceHeadNeverRescaled:true};
const ok=(v,s)=>{assert(v,s);report.checks.push(s)};
(async()=>{
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
  const ctx=await browser.newContext({viewport:{width:915,height:412},isMobile:true,hasTouch:true,deviceScaleFactor:2});
  const page=await ctx.newPage();
  page.on('pageerror',e=>report.errors.push('PAGE '+e.message));
  const port=process.env.HF_SITE_PORT||'4173',url='http://127.0.0.1:'+port+
    (port==='4173'?'/character-truth/integration-modules/studio-v14-1.html':'/');
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.__HF_SKIN_STUDIO_V5__?.state().ready,null,{timeout:120000});
  ok(await page.locator('#helmetFitPanel').count()===1,'Real Helmet Fit UI exists on phone landscape');
  const original=await page.evaluate(()=>{
    const root=window.__HF_SKIN_STUDIO_V6__?.state?.();
    return {rig:root?.rigOriginal,head:window.__HF_SKIN_STUDIO_V6__.state().headName};
  });
  ok(original.rig,'Original real upstream Hunter Rig_Medium before fitting');
  await page.locator('#forgeLoad').click();
  await page.waitForFunction(()=>window.__HF_SKIN_STUDIO_V14_1__?.state().realHeadAttached,null,{timeout:40000});
  const first=await page.evaluate(()=>window.__HF_SKIN_STUDIO_V14_1__.state());
  ok(first.autoFitHeadMeasured&&first.originalHeadBindCorrected,'Calibrated actual original M_Head dimensions and inverse BIND matrix');
  ok(first.currentFit.preset==='oni_heavy'&&first.currentFit.occlusion==='full',
    'Closed Oni default fit hides original scalp intentionally, not source skeleton');
  ok(first.sourceFacialFeaturesOccluded&&first.sourceHeadsPreserved,
    'All original head/ears remain in source but are occluded under closed helmet');
  ok(first.faceFit.headGeometryScaled===false&&first.headSkeletonUntouched,
    'Never shrink/mutate authentic M/F head geometry, bones or weights');
  ok(Number.isFinite(first.faceFit.crownHeadWidthRatio)&&first.faceFit.crownHeadWidthRatio>.65&&
    first.faceFit.crownHeadWidthRatio<1.4,
    'Measured helmet crown is near original human Hunter skull proportions; ratio='+
    first.faceFit.crownHeadWidthRatio?.toFixed(3));
  ok(first.helmetScale>=.55&&first.helmetScale<=1.15,
    'Automatic helmet scaling is within bounded safety limits');
  await page.locator('#front').click();
  await page.screenshot({path:path.join(out,'01-v14-1-oni-front.png')});
  await page.locator('#profile').click();
  await page.screenshot({path:path.join(out,'02-v14-1-oni-profile.png')});
  await page.locator('#backview').click();
  await page.screenshot({path:path.join(out,'03-v14-1-oni-back.png')});
  const api=await page.evaluate(()=>{
   const a=window.__HF_SKIN_STUDIO_V14_1__;
   a.setFit({preset:'closed',scale:.82,x:.025,y:.01,z:-.02});
   return a.state();
  });
  ok(api.currentFit.scale===.82&&api.currentFit.x===.025&&
    api.currentFit.y===.01&&api.currentFit.z===-.02,'Exact X/Y/Z/scale manual fit applies to actual rigid model');
  ok(api.sourceFacialFeaturesOccluded,'Closed manual fit retains authentic scalp occlusion');
  const startFace=await page.evaluate(()=>window.__HF_SKIN_STUDIO_V6__.faceplateWorld());
  await page.evaluate(()=>window.__HF_SKIN_STUDIO_V14_1__.setFit({
    preset:'closed',scale:.87,x:.035,y:.04,z:0}));
  const nextFace=await page.evaluate(()=>window.__HF_SKIN_STUDIO_V6__.faceplateWorld());
  ok(Math.hypot(...startFace.map((v,i)=>v-nextFace[i]))>.015,
    'Actual helmet faceplate WORLD geometry moves after user fit transform, not fake state');
  for(const preset of ['open','semi_closed','closed','oni_heavy','samurai_masked']){
    const state=await page.evaluate(p=>{
      window.__HF_SKIN_STUDIO_V14_1__.setFit({preset:p});
      return window.__HF_SKIN_STUDIO_V14_1__.state();
    },preset);
    ok(state.currentFit.preset===preset&&state.currentFit.occlusion===
      (['open','semi_closed'].includes(preset)?'none':'full'),
      'All five presets select safe authentic head visibility: '+preset);
    ok(['open','semi_closed'].includes(preset)?!state.sourceFacialFeaturesOccluded:
      state.sourceFacialFeaturesOccluded,'Scalp & facial occlusion matches helmet mode '+preset);
  }
  const restored=await page.evaluate(()=>window.__HF_SKIN_STUDIO_V14_1__.resetFit());
  ok(restored.preset==='oni_heavy'&&restored.headGeometryScaled===false,
    'Auto-fit reset recalibrates rigid helmet only');
  const previous=await page.evaluate(()=>window.__HF_SKIN_STUDIO_V14_1__.state().currentFit);
  const throws=await page.evaluate(()=>{
   try{window.__HF_SKIN_STUDIO_V14_1__.setFit({preset:'oni_heavy',scale:9});return false}
   catch{return true}
  });
  ok(throws&&JSON.stringify(previous)===
    JSON.stringify(await page.evaluate(()=>window.__HF_SKIN_STUDIO_V14_1__.state().currentFit)),
    'Out-of-range transforms fail before changing authentic Hunter or helmet');
  await page.locator('#gender').selectOption('female');
  const female=await page.evaluate(()=>window.__HF_SKIN_STUDIO_V14_1__.state());
  ok(female.realHeadAttached&&female.sourceFacialFeaturesOccluded&&female.rigOriginal,
    'Source female Hunter remains compatible with closed helmet and original rig');
  await page.locator('#front').click();
  await page.screenshot({path:path.join(out,'04-v14-1-female-oni-front.png')});
  await page.locator('#forgeOff').click();
  const off=await page.evaluate(()=>window.__HF_SKIN_STUDIO_V14_1__.state());
  ok(!off.realHeadAttached&&!off.sourceHeadOccluded&&!off.currentFit&&off.rigOriginal,
    'Unequip returns real source Hunter facial visibility with no extra rig');
  ok(report.errors.length===0,'No browser errors in real source 3D shader and fit editor');
  report.green=true;
  report.fit={defaultScale:first.helmetScale,ratio:first.faceFit.crownHeadWidthRatio,
    validatedFivePresets:true,originalHeadAndRigNeverTransformed:true};
  console.log('HIGHFLY_V14_1_TRUE_NATIVE_HELMET_AUTOFIT_5_PRESETS_BROWSER_GREEN=1 CHECKS='+report.checks.length+
    ' HEAD_CROWN_RATIO='+first.faceFit.crownHeadWidthRatio.toFixed(3));
  await ctx.close();
 }catch(e){report.failure=String(e.stack||e);
   console.error('HIGHFLY_V14_1_AUTHENTIC_HELMET_FIT_RED',report.failure);throw e
 }finally{fs.writeFileSync(path.join(out,'v14-1-report.json'),JSON.stringify(report,null,2));
   if(browser)await browser.close()}
})().catch(()=>process.exitCode=1);
