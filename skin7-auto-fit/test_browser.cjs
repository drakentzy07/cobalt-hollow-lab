/* HIGHFLY SKIN7 Browser Gate — verifies the real isolated published viewer.
   Does not approve art quality, collisions, female fit or mobile performance. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const url = process.env.SKIN7_LAB_URL || 'https://highfly-skin7-autofit-factory.vercel.app/';
(async () => {
  fs.mkdirSync('tmp/skin7/evidence',{recursive:true});
  const browser = await chromium.launch({
    headless:true,
    args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl']
  });
  try {
    const page = await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
    const errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
    const res=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
    assert(res?.ok(), 'lab URL must return 2xx');
    await page.waitForFunction(()=>window.__SKIN7_AUTOFIT__?.sourceLoaded === true,null,{timeout:100000});
    await page.waitForFunction(()=>window.__SKIN7_AUTOFIT__?.nativeBridgeProof?.safeRuntime === true ||
      window.__SKIN7_AUTOFIT__?.error!==null,null,{timeout:140000});
    const nativeState=await page.evaluate(()=>window.__SKIN7_AUTOFIT__);
    if(nativeState.error)throw Error('NATIVE_BRIDGE_FAILED '+nativeState.error);
    assert.equal(nativeState.nativeBridgeProof.nativePieces,11);
    assert(nativeState.nativeBridgeProof.newAuthoredGeometry>=15);
    assert.equal(nativeState.nativeBridgeProof.originalClips,22);
    assert.equal(nativeState.nativeBridgeProof.bodyHidden,true);
    assert(nativeState.metrics.candidate.nativeDonors>=11);
    assert.equal(nativeState.nativeBridgeProof.nativePrimitives,nativeState.metrics.candidate.nativeDonors);
    assert.equal(nativeState.metrics.candidate.rigProof,true);
    console.log('SKIN74_NATIVE_BRIDGE_REAL_CHROME_GREEN=1',JSON.stringify(nativeState.metrics.candidate));
    await page.screenshot({path:'tmp/skin7/evidence/native-armor-violet-front.png',fullPage:true});
    await page.click('#side');
    await page.waitForTimeout(150);
    await page.screenshot({path:'tmp/skin7/evidence/native-armor-violet-profile.png',fullPage:true});
    await page.click('#back');
    await page.waitForTimeout(150);
    await page.screenshot({path:'tmp/skin7/evidence/native-armor-violet-back.png',fullPage:true});
    await page.click('#front');
    // Critical UX regression: upload UNRIGGED 3-view source as the user actually does.
    await page.locator('#file').setInputFiles('tmp/skin7/fixture_triptych.glb');
    const started=Date.now();
    const pulse=setInterval(async()=>{
      try{console.log('SKIN7_REAL_IMPORT_PROGRESS', Math.round((Date.now()-started)/1000)+'s',await page.locator('#import-progress').innerText());}
      catch(e){console.log('SKIN7_PROGRESS_UNAVAILABLE',String(e));}
    },15000);
    try{
      await page.waitForFunction(()=>document.querySelector('#import-progress')?.textContent.includes('Conversión experimental completada') ||
         document.querySelector('#import-progress')?.textContent.includes('No se pudo convertir'),null,{timeout:180000});
    }finally{clearInterval(pulse);}
    const outcome=await page.locator('#import-progress').innerText();
    console.log('SKIN7_RAW_OUTCOME',outcome);
    if(outcome.includes('No se pudo convertir')){
      throw Error('Real direct import browser conversion: '+outcome);
    }
    const autofit=await page.evaluate(()=>window.__SKIN7_AUTOFIT__);
    assert.equal(autofit.metrics.candidate.rigProof,true);
    assert(autofit.metrics.candidate.newParts>=7);
    console.log('SKIN7_RAW_GLB_AUTOFIT_UI_GREEN=1',JSON.stringify(autofit.metrics.candidate));
    await page.screenshot({path:'tmp/skin7/evidence/native-autofit-from-raw-browser.png',fullPage:true});
    // Regression: already-processed GLB must also remain supported.
    await page.locator('#file').setInputFiles('tmp/skin7/fixture_autofit.glb');
    await page.waitForFunction(()=>window.__SKIN7_AUTOFIT__?.candidateLoaded===true,{timeout:90000});
    const result=await page.evaluate(()=>window.__SKIN7_AUTOFIT__);
    assert.equal(result.metrics.original.rigBones,23);
    assert.equal(result.metrics.original.clips,22);
    assert.equal(result.metrics.candidate.rigProof,true);
    assert(result.metrics.candidate.newParts>=7);
    assert.equal(result.metrics.candidate.newParts,result.metrics.candidate.skinnedNewParts);
    for(const name of ['Running_A','Jump_Idle','1H_Melee_Attack_Chop']){
      await page.selectOption('#animation',{label:name});
      await page.waitForTimeout(500);
    }
    await page.selectOption('#animation',{label:'Idle'});
    await page.waitForTimeout(700);
    await page.screenshot({path:'tmp/skin7/evidence/native-autofit-browser.png',fullPage:true});
    fs.writeFileSync('tmp/skin7/evidence/native-autofit-browser.json',JSON.stringify({result,errors},null,2));
    console.log('SKIN7_BROWSER_REAL_WEBGL_LOAD_GREEN=1',JSON.stringify(result.metrics));
    await page.click('#native');
    await page.waitForFunction(()=>window.__SKIN7_AUTOFIT__?.metrics.candidate.mode==='NATIVE_ARMOR_BRIDGE',null,{timeout:100000});
    const reloaded=await page.evaluate(()=>window.__SKIN7_AUTOFIT__?.metrics.candidate);
    assert.equal(reloaded.rigProof,true);
    console.log('SKIN74_RETURN_TO_NATIVE_GREEN=1',reloaded.nativeDonors);
    if(errors.length)console.log('NON_FATAL_PAGE_ERRORS',JSON.stringify(errors.slice(0,8)));
  } finally {await browser.close();}
})().catch(e=>{console.error('SKIN7_BROWSER_GATE_FAIL',e.stack||e);process.exit(1)});
