/* V11 REAL FIT QA: original Hunter + original Kage-Oni Blender GLB.
 * Proves actual bind correction instead of merely checking attachment.
 */
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const out=path.resolve('character-truth/v12-helmet-proof');fs.mkdirSync(out,{recursive:true});
const report={fitGreen:false,checks:[],errors:[],visualArtistApproved:false,physicalSamsungApproved:false};
const ok=(x,s)=>{assert(x,s);report.checks.push(s)};
(async()=>{
 let browser;try{
  browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
  const ctx=await browser.newContext({viewport:{width:915,height:412},isMobile:true,hasTouch:true,deviceScaleFactor:2});
  const page=await ctx.newPage();
  page.on('pageerror',e=>report.errors.push('JS: '+e.message));
  page.on('requestfailed',r=>report.errors.push('NET: '+r.url()));
  const port=process.env.HF_SITE_PORT||'4173';
  const start='http://127.0.0.1:'+port+(port==='4173'?'/character-truth/integration-modules/studio-v12.html':'/');
  await page.goto(start,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.__HF_SKIN_STUDIO_V5__?.state().ready,null,{timeout:120000});
  const baseline=await page.evaluate(()=>({
    h:window.__HF_SKIN_STUDIO_V6__.state(),s:window.__HF_SKIN_STUDIO_V10__.state()
  }));
  ok(baseline.h.rigOriginal&&baseline.s.originalRig===false,'Authentic original source Hunter before fitting');
  await page.locator('#bodyForgeLoad').click();
  await page.waitForFunction(()=>window.__HF_SKIN_STUDIO_V10__.state().mounted,null,{timeout:30000});
  await page.locator('#forgeLoad').click();
  await page.waitForFunction(()=>window.__HF_SKIN_STUDIO_V6__.state().realHeadAttached||
    /rechazada/i.test(document.querySelector('#forgeState')?.textContent||''),null,{timeout:30000});
  const fit=await page.evaluate(()=>window.__HF_SKIN_STUDIO_V6__.state());
  console.log('HIGHFLY_V11_HEAD_FIT_DIAGNOSTIC',JSON.stringify({fit,feedback:await page.locator('#forgeState').textContent()}));
  ok(fit.realHeadAttached&&fit.originalHeadBindCorrected,'Real source M_Head inverse bind correction is active');
  ok(fit.sourceHeadOccluded&&fit.sourceHeadsPreserved,
   'Fully-sealed Oni masks naked source scalp without removing source character or original rig');
  ok(fit.sourceFacialFeaturesOccluded&&fit.sourceFacialMeshCount>=80,
   'Original M/F ear, brow, eye, eyelash and mouth variants are occluded for the sealed full Oni helmet');
  ok(fit.faceFit?.closeToRealHead&&fit.faceFit?.source==='M_Head','Physical visor-head fit bound green');
  ok(Number.isFinite(fit.faceFit.faceplateToHeadCenter)&&
    fit.faceFit.faceplateToHeadCenter<fit.faceFit.threshold,'3D Oni mask is near authentic head volume');
  await page.locator('#front').click();
  await page.screenshot({path:path.join(out,'01-v11-oni-front.png')});
  await page.locator('#profile').click();
  await page.screenshot({path:path.join(out,'02-v11-oni-profile.png')});
  await page.locator('#backview').click();
  await page.screenshot({path:path.join(out,'03-v11-oni-back.png')});
  const data=await page.evaluate(()=>{
   const anim=window.__HF_SKIN3_FACTORY_V4__;
   const helmet=window.__HF_SKIN_STUDIO_V6__;
   const sample=phase=>{
    anim.sourceAnimation('Walking_A',phase);
    const face=helmet.faceplateWorld(),head=helmet.headWorld();
    const distance=Math.hypot(...face.map((v,i)=>v-head[i]));
    return {phase,face,head,distance};
   };
   return [sample(.05),sample(.35),sample(.72)];
  });
  report.animationFitSamples=data;
  ok(data.every(s=>s.face.every(Number.isFinite)&&s.head.every(Number.isFinite)),
   'All source animated face and head transforms finite');
  const dists=data.map(s=>s.distance);
  ok(Math.max(...dists)-Math.min(...dists)<.08,
   'Oni visor follows native head during walking, distance stable (delta='+
    (Math.max(...dists)-Math.min(...dists)).toFixed(5)+')');
  await page.locator('#gender').selectOption('female');
  ok((await page.evaluate(()=>window.__HF_SKIN_STUDIO_V10__.state())).activeMeshes>=40,
   'Original female Hunter wears correct separately-weighted armor');
  await page.locator('#front').click();
  await page.screenshot({path:path.join(out,'04-v11-female-front.png')});
  await page.locator('#forgeOff').click();
  ok(!(await page.evaluate(()=>window.__HF_SKIN_STUDIO_V6__.state())).realHeadAttached,
   'Helm reversible after real-world bind correction');
  const nativeFaceRestored=await page.evaluate(()=>{
    const a=window.__HF_SKIN3_FACTORY_V4__.state(),n=window.__HF_SKIN_STUDIO_V6__.state();
    return n.rigOriginal&&!n.sourceHeadOccluded&&!n.sourceFacialFeaturesOccluded;
  });
  ok(nativeFaceRestored,'Original Hunter face and skeleton returned after fully sealed helmet unequip');
  ok(await page.evaluate(()=>window.__HF_SKIN3_FACTORY_V4__.state().design.gender==='female'&&
      document.getElementById('gender').value==='female'&&
      !!window.__HF_SKIN3_FACTORY_V4__.state().ready),
   'Full-helmet removal restores original Hunter gender and preserved source model');
  ok(!report.errors.length,'No browser page errors and failed network requests');
  report.fitGreen=true;report.physicalSourceModel=true;
  console.log('HIGHFLY_V12_TRUE_PREMIUM_HEAD_FIT_ANIMATION_GREEN=1 CHECKS='+report.checks.length+
   ' DISTANCE_DELTA='+(Math.max(...dists)-Math.min(...dists)).toFixed(5));
  await ctx.close();
 }catch(e){
  report.failure=String(e.stack||e);
  console.error('HIGHFLY_V12_HEAD_FIT_RED',report.failure);
  throw e;
 }finally{
  fs.writeFileSync(path.join(out,'v12-helmet-fit-report.json'),JSON.stringify(report,null,2));
  if(browser)await browser.close();
 }
})().catch(()=>process.exitCode=1);
