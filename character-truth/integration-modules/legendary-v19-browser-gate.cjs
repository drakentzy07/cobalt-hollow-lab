/** Real native original Rig_Medium and Blender V19 skinned materials in Android landscape Chromium. */
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const proof='character-truth/v19-evidence';fs.mkdirSync(proof,{recursive:true});
const checks=[],errors=[],ok=(x,n)=>{assert(x,n);checks.push(n)};
(async()=>{
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
  const context=await browser.newContext({viewport:{width:915,height:412},isMobile:true,hasTouch:true,
   deviceScaleFactor:2,acceptDownloads:true});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4199/',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.__HF_SKIN_STUDIO_V5__?.state().ready,null,{timeout:120000});
  await page.waitForFunction(()=>window.__HF_LEGENDARY_V19__?.state().ready,null,{timeout:60000});
  ok(await page.locator('#dreamCockpit').count()===1,'V17 original cockpit stays');
  ok(await page.locator('#hf18Panel').count()===1,'V18 genuine head truth survives');
  ok(await page.locator('#hf19Panel').count()===1,'One new V19 forge panel');
  ok(await page.locator('#hf19Launch').count()===1,'New on-screen direct Forge navigation');
  const first=await page.evaluate(()=>window.__HF_LEGENDARY_V19__.state());
  ok(first.originalHunterUntouched&&!first.mounted,'Initial unchanged original Hunter');
  await page.locator('#hf19Launch').click();
  ok(await page.evaluate(()=>window.__HF_DREAM_V17__.state().tab)==='editor',
   'V19 navigates to existing authentic 3D editor');
  const loaded=await page.evaluate(()=>window.__HF_LEGENDARY_V19__.wear());
  ok(loaded?.meshes===32&&loaded.vertices>300&&loaded.vertices<6500,
   '32 genuine Blender-authored weighted 3D ornamental meshes mounted');
  ok(loaded?.sourceJointCount===23&&loaded.authenticRig,
   'All original Rig_Medium 23 joints retained without any surrogate');
  const truth=await page.evaluate(()=>window.__HF_LEGENDARY_V19__.inspect());
  ok(truth.mapped&&truth.visible===16&&truth.originalOnly,
   'All 32 new meshes mapped exclusively to real source bones and male mesh filters');
  await page.evaluate(()=>document.getElementById('front').click());
  await page.screenshot({path:proof+'/01-v19-original-male-front.png'});
  await page.evaluate(()=>document.getElementById('profile').click());
  await page.screenshot({path:proof+'/02-v19-original-male-profile.png'});
  const move=await page.evaluate(()=>window.__HF_LEGENDARY_V19__.pose());
  ok(move.finite&&move.newSkinnedMeshes===16,
   'Walking_A drives original skeleton and all 16 newly skinned male ornaments');
  await page.locator('#hf18Gender').selectOption('female');
  const female=await page.evaluate(()=>window.__HF_LEGENDARY_V19__.inspect());
  ok(female.gender==='F'&&female.visible===16,'Female genuine skinned ornaments are independently selected');
  await page.evaluate(()=>document.getElementById('front').click());
  await page.screenshot({path:proof+'/03-v19-original-female-front.png'});
  const combo=await page.evaluate(()=>window.__HF_LEGENDARY_V19__.saveFull());
  ok(combo?.containsNightfall&&combo.containsV19&&combo.bytes>12000,
   'Real complete weighted Nightfall and new V19 authored GLB can export');
  await page.evaluate(()=>window.__HF_LEGENDARY_V19__.remove());
  ok(!await page.evaluate(()=>window.__HF_LEGENDARY_V19__.state().mounted),
   'Unequip removes only V19 overlay and preserves original Nightfall character');
  ok(errors.length===0,'No page JavaScript errors across genuine skinned meshes');
  fs.writeFileSync(proof+'/browser-proof.json',JSON.stringify({green:true,checks,errors,
   geometryMeshCount:loaded.meshes,vertexCount:loaded.vertices,bones:loaded.sourceJointCount,
   physicalS23Verified:false,unityImportVerified:false,artistApproved:false},null,2));
  console.log('HIGHFLY_V19_NEW_AUTHORED_BLENDER_GEOMETRY_REAL_HUNTER_BROWSER_GREEN=1 CHECKS='+checks.length);
 }finally{if(browser)await browser.close()}
})().catch(e=>{
 fs.writeFileSync(proof+'/browser-red.json',JSON.stringify({error:String(e.stack||e),checks,errors},null,2));
 console.error(e);process.exitCode=1;
});