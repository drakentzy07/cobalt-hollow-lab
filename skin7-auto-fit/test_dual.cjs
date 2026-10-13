/* HIGHFLY SKIN 7.5 / 7.6 native dual-shell WebGL Gate.
 * Real Playwright browser, original immutable ClaudeCraft source, isolated local HTTP.
 * WARNING: visual assets are diagnostic; this does not certify commercial art/physics.
 */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const url=process.env.HF_DUAL_URL || 'http://127.0.0.1:4765/skin7-auto-fit/dual.html';
const dir='skin7-auto-fit/dual-evidence';fs.mkdirSync(dir,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:900},deviceScaleFactor:1});
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
  page.on('console',x=>{if(x.type()==='error')pageErrors.push(x.text())});
  const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:50000});
  assert(response?.ok(), 'dual lab HTTP must return 200');
  await page.waitForFunction(()=>window.__HIGHFLY_DUAL_LAB__?.sourceLoaded===true,null,{timeout:100000});
  await page.waitForFunction(()=>window.__HIGHFLY_DUAL_LAB__?.variantReady===true||window.__HIGHFLY_DUAL_LAB__?.lastError,null,{timeout:120000});
  let state=await page.evaluate(()=>window.__HIGHFLY_DUAL_LAB__);
  assert.equal(state.lastError,null,'Violet shader/geometry loads without WebGL exception');
  assert.equal(state.active,'violet');assert.equal(state.proofs.violet.nativeSlots,11);
  assert.equal(state.proofs.violet.nativePrimitives,17,'donors must NOT include old violet accessories');
  assert.equal(state.proofs.violet.originalBones,23);assert.equal(state.proofs.violet.originalClips,22);
  assert.equal(state.proofs.violet.originalBodyHidden,true);assert.equal(state.proofs.violet.structuralGreen,true);
  assert.equal(state.proofs.violet.shellCount,17);
  assert.equal(state.proofs.violet.unwantedVisibleMeshes,0);
  assert(state.proofs.violet.retainedNativeCrystals>=4);
  console.log('HF_DUAL_VIOLET_NATIVE_GREEN=1',JSON.stringify(state.proofs.violet));
  await page.waitForTimeout(500);
  await page.screenshot({path:dir+'/violet-front.png',fullPage:true});
  await page.click('#side');await page.waitForTimeout(400);
  await page.screenshot({path:dir+'/violet-profile.png',fullPage:true});
  await page.click('#back');await page.waitForTimeout(400);
  await page.screenshot({path:dir+'/violet-back.png',fullPage:true});
  await page.click('#front');
  await page.click('#show-dragon');
  await page.waitForFunction(()=>window.__HIGHFLY_DUAL_LAB__?.variantReady === true &&
   window.__HIGHFLY_DUAL_LAB__?.active==='dragon'||window.__HIGHFLY_DUAL_LAB__?.lastError,null,{timeout:120000});
  state=await page.evaluate(()=>window.__HIGHFLY_DUAL_LAB__);
  assert.equal(state.lastError,null);
  const d=state.proofs.dragon;
  assert.equal(d.variant,'dragon');assert.equal(d.nativeSlots,11);assert.equal(d.originalBones,23);
  assert.equal(d.nativePrimitives,17,'dragon must use only original 17 Paladin meshes');
  assert.equal(d.originalClips,22);assert.equal(d.structuralGreen,true);assert(d.shellCount>=11);
  assert.equal(d.unwantedVisibleMeshes,0);
  assert.equal(d.retainedNativeCrystals,0);
  assert(d.scaleCount>=35 && d.hornCount>=6,'dragon geometry must contain real scales and horn meshes');
  assert(d.authoredGeometry>state.proofs.violet.authoredGeometry,'dragon must be structurally different from violet');
  console.log('HF_DUAL_DRAGON_NATIVE_GREEN=1',JSON.stringify(d));
  await page.waitForTimeout(350);await page.screenshot({path:dir+'/dragon-front.png',fullPage:true});
  await page.click('#side');await page.waitForTimeout(300);await page.screenshot({path:dir+'/dragon-profile.png',fullPage:true});
  await page.click('#back');await page.waitForTimeout(300);await page.screenshot({path:dir+'/dragon-back.png',fullPage:true});
  // Animations prove that the original clips are still selectable and start.
  for(const name of ['Running_A','Jump_Idle','1H_Melee_Attack_Chop']){
   await page.selectOption('#animation',{label:name});
   await page.waitForTimeout(400);
   assert.equal(await page.evaluate(()=>window.__HIGHFLY_DUAL_LAB__.lastError),null);
  }
  await page.selectOption('#animation',{label:'Idle'});
  await page.click('#show-violet');
  await page.waitForFunction(()=>window.__HIGHFLY_DUAL_LAB__?.variantReady&&window.__HIGHFLY_DUAL_LAB__?.active==='violet',null,{timeout:120000});
  console.log('HF_DUAL_SWITCH_BACK_GREEN=1');
  await page.setViewportSize({width:915,height:412});
  await page.waitForTimeout(500);await page.click('#front');
  await page.screenshot({path:dir+'/s23-landscape.png',fullPage:true});
  const mobile=await page.evaluate(()=>({canvas:document.querySelector('#right canvas')?.getBoundingClientRect().toJSON(),proof:window.__HIGHFLY_DUAL_LAB__.proofs.violet}));
  assert(mobile.canvas.width>=250&&mobile.canvas.height>=300,'mobile viewport must display model');
  fs.writeFileSync(dir+'/dual-proof.json',JSON.stringify({violet:state.proofs.violet,dragon:d,camera:state.camera,mobile,pageErrors,artApproved:false,physicalAndroidApproved:false},null,2));
  console.log('HF_DUAL_ANDROID_VIEWPORT_SMOKE_GREEN=1');
  console.log('HF_DUAL_STILL_REQUIRES_ART_APPROVAL=1');
  if(pageErrors.length)console.log('BROWSER_WARNINGS',JSON.stringify(pageErrors.slice(0,5)));
 }finally{await browser.close()}
})().catch(e=>{console.error('HF_DUAL_GATE_FAIL',e.stack||e);process.exit(1);});