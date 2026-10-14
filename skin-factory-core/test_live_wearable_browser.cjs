/* Visual WebGL gate. Runs real imported GLB on authentic live ClaudeCraft bone refs. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const dir='skin-factory-core/factory-evidence-r03';fs.mkdirSync(dir,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
 try{
  const page=await browser.newPage({viewport:{width:1300,height:920},deviceScaleFactor:1});
  const errs=[];page.on('pageerror',x=>errs.push(x.stack||String(x)));
  page.on('console',x=>{if(x.type()==='error')errs.push(x.text())});
  const res=await page.goto('http://127.0.0.1:4917/skin-factory-core/rigged_preview.html',{waitUntil:'domcontentloaded',timeout:50000});
  assert(res.ok());
  await page.waitForFunction(()=>window.__HIGHFLY_WEARABLE_FACTORY__?.ready||window.__HIGHFLY_WEARABLE_FACTORY__?.error,null,{timeout:155000});
  const s=await page.evaluate(()=>window.__HIGHFLY_WEARABLE_FACTORY__);
  assert.equal(s.error,null,'LIVE_RIG_IMPORT_'+JSON.stringify(s));
  assert.equal(s.ready,true);assert.equal(s.meshes,32);
  assert.equal(s.liveSourceJoints,23);assert.equal(s.allReferencesNative,true);
  assert.equal(s.sourceOriginal,true);assert(s.totalFinite>=4000);
  for(const [view,button] of [['front','front'],['side','side'],['back','back']]){
   await page.click('#'+button);await page.waitForTimeout(500);
   await page.locator('#scene').screenshot({path:dir+'/real-'+view+'.png'});
  }
  for(const label of ['Running_A','Jump_Idle','1H_Melee_Attack_Chop']){
   await page.selectOption('#clip',{label});
   await page.waitForTimeout(550);
   await page.locator('#scene').screenshot({path:dir+'/real-'+label.replace(/[^a-zA-Z0-9]/g,'_')+'.png'});
  }
  assert.deepEqual(errs,[],'BROWSER_ERRORS '+JSON.stringify(errs));
  const phone=await browser.newPage({viewport:{width:915,height:412},deviceScaleFactor:1});
  await phone.goto('http://127.0.0.1:4917/skin-factory-core/rigged_preview.html',{waitUntil:'domcontentloaded',timeout:60000});
  await phone.waitForFunction(()=>window.__HIGHFLY_WEARABLE_FACTORY__?.ready||window.__HIGHFLY_WEARABLE_FACTORY__?.error,null,{timeout:155000});
  const mobile=await phone.evaluate(()=>window.__HIGHFLY_WEARABLE_FACTORY__);
  assert(mobile.ready&&mobile.meshes===32&&mobile.allReferencesNative&&!mobile.error,'ANDROID_LANDSCAPE_RIG_BRIDGE_RED');
  await phone.screenshot({path:dir+'/android-landscape-simulated.png',fullPage:true});
  fs.writeFileSync(dir+'/real-browser-proof.json',JSON.stringify({desktop:s,phone:mobile,errors:errs,
   noAiProviderWasCalled:true,conceptFidelityApproved:false,realSamsungDeviceTested:false},null,2));
  console.log('HIGHFLY_R03_REAL_UNRIGGED_TO_SKINNED_TO_LIVE_ORIGINAL_WARRIOR_RIG_WEBGL_GREEN=1');
 }finally{await browser.close();}
})().catch(e=>{console.error('HIGHFLY_R03_REAL_LIVE_RIG_WEBGL_RED',e.stack||e);process.exit(1)});
