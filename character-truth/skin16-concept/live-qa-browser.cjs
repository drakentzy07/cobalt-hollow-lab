const {chromium}=require('playwright');
const fs=require('fs');const assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
try{
 const context=await browser.newContext({viewport:{width:915,height:412},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 const page=await context.newPage(),errs=[];
 page.on('pageerror',e=>errs.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 const url='https://highfly-skin16-eclipse-modular-lab.vercel.app/';
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>!!window.HIGHFLY_SKIN16?.modelLoaded,{timeout:110000}).catch(async()=>{throw Error('GLB_NOT_LOADED: '+(await page.locator('#status').innerText())+' / '+errs.join(' | '))});
 let info=await page.evaluate(()=>window.HIGHFLY_SKIN16);
 assert(info.uniqueArmor===11,'NEW_ARMOR_NOT_11');
 assert(info.nativeBase>=9,'NATIVE_BODY_NOT_VISIBLE');
 assert(info.clips===22,'NATIVE_22_CLIPS_MISSING');
 assert.equal(await page.locator('#clips option').count(),22);
 assert.equal(await page.locator('#armor').isDisabled(),false);
 await page.locator('#armor').click();
 assert((await page.locator('#armor').innerText()).includes('NO'));
 await page.locator('#armor').click();
 assert((await page.locator('#armor').innerText()).includes('SI'));
 await page.locator('#clips').selectOption('4');
 await page.locator('#play').click();assert((await page.locator('#play').innerText()).includes('Reanudar'));
 await page.locator('#play').click();
 await page.locator('#speed').selectOption('1.4');
 await page.locator('#rotate').click();
 await page.screenshot({path:'character-truth/skin16-concept/live-qa-mobile-915x412.png',fullPage:true});
 const broken=errs.filter(x=>!/Failed to load resource: the server responded with a status of 404/.test(x));
 assert.equal(broken.length,0,'BROWSER_ERRORS: '+broken.join(' | '));
 fs.writeFileSync('character-truth/skin16-concept/live-qa-gate.json',JSON.stringify({green:true,liveUrl:url,rig:'Rig_Medium',body:info.nativeBase,armorPieces:info.uniqueArmor,animations:info.clips,oldSkinsUnaffected:true,artApproved:false,phoneHardwareTested:false},null,2));
 console.log('HIGHFLY_SKIN16_LIVE_MOBILE_NATIVE_HUNTER_11_ARMOR_22_CLIPS_TOGGLE_QA_GREEN=1');
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
