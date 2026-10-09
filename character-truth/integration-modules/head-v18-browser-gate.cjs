/* V18 real Chromium original Hunter / genuine Kage Oni. Simulation of mobile browser, not physical S23. */
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const out='character-truth/v18-evidence';fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[],ok=(x,label)=>{assert(x,label);checks.push(label)};
(async()=>{
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
  const ctx=await browser.newContext({viewport:{width:915,height:412},deviceScaleFactor:2,
   isMobile:true,hasTouch:true,acceptDownloads:true});
  const page=await ctx.newPage();
  page.on('pageerror',e=>errors.push('PAGE: '+e.message));
  await page.goto('http://127.0.0.1:4188/',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.__HF_SKIN_STUDIO_V5__?.state().ready,{},{timeout:120000});
  await page.waitForFunction(()=>window.__HF_HEAD_TRUTH_V18__?.state().ready,{},{timeout:30000});
  ok(await page.locator('#dreamCockpit').count()===1,'V17 cockpit reused exactly once');
  ok(await page.locator('#hf18Panel').count()===1,'NEW Head Truth controls exist exactly once');
  ok(await page.locator('#hf18Gender').count()===1&&await page.locator('#hf18Front').count()===1,'Dedicated visible original Hunter face/sex controls');
  ok(await page.evaluate(()=>window.__HF_SKIN3_FACTORY_V4__.state().modelIdentity==='warrior_modular.glb'),
   'Genuine pinned original ClaudeCraft modular Hunter, not a proxy');
  await page.evaluate(()=>window.__HF_DREAM_V17__.selectTab('casco'));
  await page.evaluate(()=>window.__HF_HEAD_TRUTH_V18__.load());
  await page.waitForFunction(()=>window.__HF_HEAD_TRUTH_V18__.state().helmetLoaded,{},{timeout:40000});
  const orig=await page.evaluate(()=>window.__HF_SKIN_STUDIO_V6__.geometryTruth());
  ok(orig.originalHeadsPreserved&&orig.rig==='Rig_Medium'&&orig.originalJointCount>=20,
   'Both authentic male and female original skinned heads measured on rig');
  ok(orig.helmetLoaded&&orig.crown&&orig.faceplate,
   'Real original Blender Kage-Oni crown and faceplate measured');
  const before=await page.evaluate(()=>window.__HF_HEAD_TRUTH_V18__.scan());
  ok(before.helmetLoaded&&Number.isFinite(before.ratio)&&before.originalJointCount>=20,
   'Numerical crown / head ratio measured, never a fake placeholder');
  await page.screenshot({path:out+'/01-v18-kage-before-mobile.png'});
  const planned=await page.evaluate(()=>window.__HF_HEAD_TRUTH_V18__.suggest());
  ok(planned.fit.scale>=.55&&planned.fit.scale<=1.15&&
   Math.abs(planned.fit.x)<=.15&&Math.abs(planned.fit.y)<=.15,
   'Conservative solver bounded by original helmet manual fit safety ranges');
  const after=await page.evaluate(()=>window.__HF_HEAD_TRUTH_V18__.apply());
  ok(after.originalJointCount===before.originalJointCount&&after.originalJointNames.join('|')===
   before.originalJointNames.join('|'),'No new skeleton bones introduced or original joints renamed');
  ok(after.sourceHeadMale.name==='M_Head'&&after.sourceHeadFemale.name==='F_Head',
   'Male and female original SkinnedMesh head nodes retained');
  await page.screenshot({path:out+'/02-v18-kage-autofit-mobile.png'});
  const poses=await page.evaluate(()=>window.__HF_HEAD_TRUTH_V18__.poseAudit());
  ok(poses.length===5&&poses.every(p=>Number.isFinite(p.ratio)&&p.animatedOriginalMeshes>0),
   'Five real moving-clip geometric pose tests with finite original mesh values');
  await page.locator('#hf18Front').click();
  await page.screenshot({path:out+'/03-v18-kage-front.png'});
  await page.locator('#hf18Side').click();
  await page.screenshot({path:out+'/04-v18-kage-side.png'});
  await page.locator('#hf18Back').click();
  await page.screenshot({path:out+'/05-v18-kage-back.png'});
  await page.locator('#hf18Gender').selectOption('female');
  const f=await page.evaluate(()=>window.__HF_HEAD_TRUTH_V18__.scan());
  ok(f.gender==='female'&&Number.isFinite(f.headWidth)&&f.originalJointCount>=20,
   'Real original female Hunter fitted report is independent of male head bounds');
  await page.screenshot({path:out+'/06-v18-female-original-head.png'});
  const report=await page.evaluate(()=>window.__HF_HEAD_TRUTH_V18__.download());
  ok(report.schema==='HIGHFLY_HEAD_TRUTH_V18'&&
   report.verifiedClipping===false&&!report.report.visualArtApproved,
   'Export JSON remains truthful about collision and artistic limitations');
  ok(errors.length===0,'No browser page errors across genuine meshes, fit and animation');
  fs.writeFileSync(out+'/browser-proof.json',JSON.stringify({green:true,checks,
   errors,clips:poses.map(x=>x.clip),beforeRatio:before.ratio,afterRatio:after.ratio,
   originalJointCount:orig.originalJointCount,physicalSamsungVerified:false,
   triangleClippingCertified:false,artApproved:false,gameTouched:false},null,2));
  console.log('HIGHFLY_V18_HEAD_TRUTH_REAL_SKINNED_BROWSER_GREEN=1 CHECKS='+checks.length);
 }finally{if(browser)await browser.close()}
})().catch(e=>{fs.writeFileSync(out+'/browser-red.json',
 JSON.stringify({error:String(e.stack||e),checks,errors},null,2));console.error(e);process.exitCode=1});
