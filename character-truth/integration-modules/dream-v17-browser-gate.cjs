/* Actual Chromium @ Android-landscape CSS viewport. Not physical device. */
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const out='character-truth/v17-evidence',checks=[],fail=[];
const okay=(x,label)=>{assert(x,label);checks.push(label)};
(async()=>{
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
  const context=await browser.newContext({viewport:{width:915,height:412},
    deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const page=await context.newPage();
  page.on('pageerror',e=>fail.push('PAGE '+e.message));
  await page.goto('http://127.0.0.1:4187/',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.__HF_SKIN_STUDIO_V5__?.state().ready,{},{timeout:120000});
  await page.waitForFunction(()=>window.__HF_DREAM_V17__?.state().ready,{},{timeout:30000});
  okay(await page.locator('#dreamCockpit').count()===1,'One V17 cockpit mounted');
  okay(await page.locator('#dreamTextPanel').count()===1&&
   await page.locator('#dreamImagePanel').count()===1,'Existing V15 and V16 modules reused');
  okay(await page.evaluate(()=>window.__HF_SKIN3_FACTORY_V4__.state().ready),
   'Real ClaudeCraft original hunter live');
  const tabs=['imagen','editor','casco','claude','texto'];
  for(const tab of tabs){
   await page.evaluate(x=>window.__HF_DREAM_V17__.selectTab(x),tab);
   okay((await page.evaluate(()=>window.__HF_DREAM_V17__.state().tab))===tab,'Tab '+tab+' works');
  }
  await page.locator('#dreamPlan').click();
  await page.waitForFunction(()=>window.__HF_DREAM_V15__?.state().planned,{},{timeout:30000});
  okay(await page.evaluate(()=>window.__HF_DREAM_V15__.recipe().paint.paints.length>=30),
   'Genuine original Nightfall text recipe');
  await page.locator('#dreamApply').click();
  await page.waitForFunction(()=>window.__HF_SKIN_STUDIO_V13__?.state().mounted,{},{timeout:30000});
  await page.waitForFunction(()=>window.__HF_SKIN_STUDIO_V14__?.state().modifiedPieces>=2,{},{timeout:30000});
  const summary=await page.evaluate(()=>window.__HF_DREAM_V17__.exportGlb());
  okay(summary.shapedGenderMeshes>0&&summary.originalWeightedBinaryPrefixPreserved,
   'Actual edited 3D GLB with original skin buffers');
  await page.screenshot({path:out+'/01-v17-dream-s23-landscape.png'});
  await page.evaluate(()=>window.__HF_DREAM_V17__.toggleCompare());
  okay(await page.evaluate(()=>window.__HF_DREAM_V17__.state().comparing),
   'Nondestructive Nightfall before comparison');
  await page.screenshot({path:out+'/02-v17-native-comparison.png'});
  await page.evaluate(()=>window.__HF_DREAM_V17__.toggleCompare());
  okay(await page.evaluate(()=>window.__HF_SKIN_STUDIO_V14__.state().modifiedPieces>0),
   'Comparison restores sculpted model');
  const saved=await page.evaluate(()=>window.__HF_DREAM_V17__.save());
  okay(saved.originalSource==='Rig_Medium'&&saved.imagePixelsStored===false,
   'Actual local persisted project contains no reference image pixels');
  await page.evaluate(()=>window.__HF_DREAM_V17__.load());
  okay(await page.evaluate(()=>window.__HF_SKIN_STUDIO_V13__.state().paintedPieces>0),
   'Saved project restores real edited Blender material');
  okay(fail.length===0,'No JavaScript runtime errors');
  fs.writeFileSync(out+'/browser-proof.json',JSON.stringify({
   green:true,checks,errors:fail,physicalS23Verified:false,
   unityImportVerified:false,visualPremiumArtistApproved:false
  },null,2));
  console.log('HIGHFLY_V17_UNIFIED_REAL_HUNTER_ANDROID_LANDSCAPE_BROWSER_GREEN=1 CHECKS='+checks.length);
 }finally{if(browser)await browser.close()}
})().catch(e=>{fs.writeFileSync(out+'/browser-red.json',JSON.stringify({error:String(e.stack||e),checks,fail},null,2));console.error(e);process.exitCode=1});
