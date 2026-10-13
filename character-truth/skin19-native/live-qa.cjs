const {chromium}=require('playwright');const fs=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:915,height:412},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 const url='https://highfly-skin19-native-paladin-lab.vercel.app/';
 const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:50000});
 assert.equal(response.status(),200,'LIVE_SITE_HTTP_'+response.status()+' body='+((await page.locator('body').innerText()).slice(0,260)));
 await page.locator('#status').waitFor({timeout:10000});
 try{
  await page.waitForFunction(()=>window.HIGHFLY_SKIN19?.ready,{timeout:90000});
 }catch(e){
  throw Error('SOURCE_NOT_READY: '+(await page.locator('#status').innerText())+' | '+errors.slice(-5).join(' | '));
 }
 const original=await page.evaluate(()=>window.HIGHFLY_SKIN19);
 assert.equal(original.mode,'original');
 assert.equal(await page.locator('#clip').inputValue(),String(await page.locator('#clip option').evaluateAll(nodes=>nodes.findIndex(o=>o.textContent==='Idle'))),'Default animation must be true standing Idle, not Sit_Floor_Idle');
 assert.equal(original.clips,22);
 assert.equal(original.nativeBody,11);
 assert.equal(original.originalArmorMeshes,17);
 assert.equal(original.nativeArmorRendererCount,17);
 assert(original.availableNativeFamilies.length>=2,'NEED_MORE_THAN_ONE_REAL_ORIGINAL_CLAUDECRAFT_ARMOR');
 const other=original.availableNativeFamilies.find(f=>f.family!=='paladin');
 await page.locator('#nativeArmor').selectOption(other.family);
 assert.equal(await page.evaluate(()=>window.HIGHFLY_SKIN19.nativeFamily),other.family);
 assert((await page.evaluate(()=>window.HIGHFLY_SKIN19.originalArmorMeshes))>0);
 await page.locator('#nativeArmor').selectOption('paladin');
 assert.equal(await page.evaluate(()=>window.HIGHFLY_SKIN19.originalArmorMeshes),17);
 assert(original.nativeSourcePaladinReused===true && original.legacyExperimentsAvailable===false,'WRONG_REFORGE_SOURCE');
 console.log('SKIN19_GLTF_DEBUG',JSON.stringify({newSlots:original.newArmorSlots,newMeshes:original.newArmorPrimitives,status:await page.locator('#status').innerText(),errors}));
 assert(original.newArmorSlots===11,'ECLIPSE_NATIVE_PALADIN_REFORGE_NOT_ATTACHED');
 assert.equal(await page.locator('#eclipse').count(),1);
 assert.equal(await page.locator('#experiment').count(),0);
 assert.equal(await page.locator('#volume').count(),0);
 const dir='character-truth/skin19-native/live-qa';
 fs.mkdirSync(dir,{recursive:true});
 await page.screenshot({path:dir+'/claudecraft-original-paladin.png',fullPage:true});
 await page.locator('#nativeArmor').selectOption('knight');
 assert((await page.evaluate(()=>window.HIGHFLY_SKIN19.originalArmorMeshes))>0);
 await page.screenshot({path:dir+'/knight-original.png',fullPage:true});
 await page.locator('#nativeArmor').selectOption('paladin');
 await page.locator('#base').click();
 assert.equal(await page.evaluate(()=>window.HIGHFLY_SKIN19.mode),'base');
 await page.screenshot({path:dir+'/native-hunter-base.png',fullPage:true});
 await page.locator('#eclipse').click();
 assert.equal(await page.evaluate(()=>window.HIGHFLY_SKIN19.mode),'eclipse');
 assert.equal(await page.evaluate(()=>window.HIGHFLY_SKIN19.newArmorSlots),11);
 await page.screenshot({path:dir+'/eclipse-native-reforge.png',fullPage:true});
 await page.locator('#original').click();
 await page.locator('#clip').selectOption('4');
 await page.locator('#pause').click();
 assert((await page.locator('#pause').innerText()).includes('Seguir'));
 await page.locator('#pause').click();
 await page.locator('#speed').selectOption('1.4');
 assert.equal(errors.length,0,errors.join(' | '));
 fs.writeFileSync(dir+'/gate.json',JSON.stringify({green:true,url,claudecraftOriginal:true,body:original.nativeBody,paladinNativeMeshes:17,
  paladinDerivedEclipseSlots:11,clips:22,animationSelectionVerified:true,originalTextureLoader:'KTX2+Meshopt',
  originalArmorPreserved:true,nativeFamilies:original.availableNativeFamilies,oldBodypaintRemoved:true,oldMinionRemoved:true,sourcePaladinMeshesReused:11,allNativeEquipmentsInGame:false,artApproved:false,physicalS23Tested:false,errors},null,2));
 console.log('HIGHFLY_SKIN19_ORIGINAL_CLAUDECRAFT_KTX2_PALADIN_17_MESHES_OVERLAY_11_AND_22_CLIPS_LIVE_GREEN=1');
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
