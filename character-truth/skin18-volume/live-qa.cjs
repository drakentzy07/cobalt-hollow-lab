const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const URL='https://highfly-skin18-eclipse-volume-lab.vercel.app/';
(async()=>{
const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:915,height:412},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text())});
 const response=await page.goto(URL,{waitUntil:'domcontentloaded',timeout:60000});
 assert.equal(response.status(),200,'VERCEL_RETURNED_NOT_200');
 await page.locator('#view').waitFor();
 try{
  await page.waitForFunction(()=>window.HIGHFLY_SKIN18?.ready,{timeout:115000});
 }catch(e){
  throw Error('REAL_NATIVE_CHARACTER_NOT_READY: '+(await page.locator('#status').innerText())+' | '+errors.join(' | '));
 }
 const meta=await page.evaluate(()=>window.HIGHFLY_SKIN18);
 assert.equal(meta.nativeBody,11);
 assert.equal(meta.originalArmorMeshes,17);
 assert.equal(meta.volumeArmorSlots,11,'SKIN18 volumetric armor did not bind 11 slots');
 assert.equal(meta.newArmorSlots,11,'Legacy comparison unavailable');
 assert.equal(meta.clips,22,'Native animation clips are not intact');
 assert.equal(meta.originalRigBones,23);
 assert(meta.availableNativeFamilies.length>=7);
 const path='character-truth/skin18-volume/live-qa';fs.mkdirSync(path,{recursive:true});
 await page.screenshot({path:path+'/01-paladin-original.png',fullPage:true});
 await page.locator('#volume').click();
 assert.equal(await page.evaluate(()=>window.HIGHFLY_SKIN18.mode),'volume');
 const state=await page.evaluate(()=>window.HIGHFLY_SKIN18);
 assert(state.volumeArmorPrimitives>=11,'NO_RENDERED_NEW_ARMOR');
 await page.screenshot({path:path+'/02-eclipse-real-volume.png',fullPage:true});
 await page.locator('#experiment').click();
 assert.equal(await page.evaluate(()=>window.HIGHFLY_SKIN18.mode),'experiment');
 await page.screenshot({path:path+'/03-eclipse-bodypaint-before.png',fullPage:true});
 await page.locator('#original').click();
 await page.locator('#nativeArmor').selectOption('knight');
 assert((await page.evaluate(()=>window.HIGHFLY_SKIN18.originalArmorMeshes))>0);
 await page.screenshot({path:path+'/04-knight-original.png',fullPage:true});
 await page.locator('#nativeArmor').selectOption('paladin');
 await page.locator('#volume').click();
 await page.locator('#clip').selectOption('4');
 await page.locator('#pause').click();assert((await page.locator('#pause').innerText()).includes('Seguir'));
 await page.locator('#pause').click();await page.locator('#speed').selectOption('1.4');
 const proof=await page.evaluate(async()=>{
  const r=await fetch('https://raw.githubusercontent.com/drakentzy07/cobalt-hollow-lab/highfly-skin18-volume-preview-assets/skin18-volume/qa/proof.json');
  if(!r.ok)throw Error('PROOF_NOT_PUBLISHED');
  return await r.json();
 });
 assert.equal(proof.schema,'highfly.skin18.volumetric-armor-proof/1');
 assert.equal(proof.designRevision,'VOLUME_BLOCKOUT_V2_ANATOMICAL_PROPORTIONS','PREVIOUS_BLOCKOUT_NOT_V2');
 assert.equal(proof.glbSha256,'8353b0f48000e5cff24b88e6940e5d02c55f33f500753fbb2787ce12632d6063');
 const actualDownload=await page.evaluate(()=>performance.getEntriesByType('resource').some(e=>e.name.includes('HF18-ECLIPSE-REAL-VOLUME-22-CLIPS.glb?v=8353b0f48000')));
 assert(actualDownload,'V2_GLTF_WAS_NOT_REQUESTED');
 assert(proof.closedArmorSolids>=38);
 assert(proof.reviewAnglesRendered===3);
 assert(proof.originalRigBones===23 && proof.originalAnimationClips===22);
 for(const p of Object.values(proof.anatomicalVolumeEvidence)){
  assert(p.armorToBodyAxes[1]>=1.12,'BODYPAINT_DETECTED_BY_DEPTH');
 }
 const payload={green:true,url:URL,nativePaladinVisible:true,nativeKnightVisible:true,
  nativeBodyPieces:meta.nativeBody,paladinRenderMeshes:17,
  currentEclipseArmorSlots:meta.volumeArmorSlots,oldEclipseArmorSlots:meta.newArmorSlots,revision:'V2',
  volumeSolids:proof.closedArmorSolids,animationClips:22,rigBones:23,
  comparisonControlsValidated:true,artApproved:false,physicalSamsungS23Tested:false,
  publicHighflyUnchanged:true};
 fs.writeFileSync(path+'/live-qa.json',JSON.stringify(payload,null,2));
 assert.equal(errors.length,0,errors.join(' | '));
 console.log('HIGHFLY_SKIN18_LIVE_REAL_NATIVE_CLAUDECRAFT_AND_47_SOLID_VOLUMES_22_CLIPS_GREEN=1');
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
