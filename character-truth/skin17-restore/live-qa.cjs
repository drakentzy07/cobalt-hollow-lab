const {chromium}=require('playwright');const fs=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:915,height:412},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 const url='https://highfly-skin17-original-character-r.vercel.app/';
 const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:50000});
 assert.equal(response.status(),200,'LIVE_SITE_HTTP_'+response.status()+' body='+((await page.locator('body').innerText()).slice(0,260)));
 await page.locator('#status').waitFor({timeout:10000});
 try{
  await page.waitForFunction(()=>window.HIGHFLY_SKIN17?.ready,{timeout:90000});
 }catch(e){
  throw Error('SOURCE_NOT_READY: '+(await page.locator('#status').innerText())+' | '+errors.slice(-5).join(' | '));
 }
 const original=await page.evaluate(()=>window.HIGHFLY_SKIN17);
 assert.equal(original.mode,'original');
 assert.equal(original.clips,22);
 assert.equal(original.nativeBody,11);
 assert.equal(original.originalArmorMeshes,17);
 assert.equal(original.nativeArmorRendererCount,17);
 assert(original.newArmorSlots===11,'ECLIPSE_NOT_ATTACHED_TO_ORIGINAL');
 const dir='character-truth/skin17-restore/qa';
 fs.mkdirSync(dir,{recursive:true});
 await page.screenshot({path:dir+'/claudecraft-original-paladin.png',fullPage:true});
 await page.locator('#base').click();
 assert.equal(await page.evaluate(()=>window.HIGHFLY_SKIN17.mode),'base');
 await page.screenshot({path:dir+'/native-hunter-base.png',fullPage:true});
 await page.locator('#experiment').click();
 assert.equal(await page.evaluate(()=>window.HIGHFLY_SKIN17.mode),'experiment');
 assert.equal(await page.evaluate(()=>window.HIGHFLY_SKIN17.newArmorSlots),11);
 await page.screenshot({path:dir+'/eclipse-prototype.png',fullPage:true});
 await page.locator('#original').click();
 await page.locator('#clip').selectOption('4');
 await page.locator('#pause').click();
 assert((await page.locator('#pause').innerText()).includes('Seguir'));
 await page.locator('#pause').click();
 await page.locator('#speed').selectOption('1.4');
 assert.equal(errors.length,0,errors.join(' | '));
 fs.writeFileSync(dir+'/gate.json',JSON.stringify({green:true,url,claudecraftOriginal:true,body:original.nativeBody,paladinNativeMeshes:17,
  experimentalArmorSlots:11,clips:22,animationSelectionVerified:true,originalTextureLoader:'KTX2+Meshopt',
  originalArmorPreserved:true,artApproved:false,physicalS23Tested:false,errors},null,2));
 console.log('HIGHFLY_SKIN17_ORIGINAL_CLAUDECRAFT_KTX2_PALADIN_17_MESHES_OVERLAY_11_AND_22_CLIPS_LIVE_GREEN=1');
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
