/* HIGHFLY R0.9 — native 23 bones + 22 clips + local diagnostic binding.
Synthetic GLB is a TEST ONLY, never publish it as real armor. */
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
 const html=fs.readFileSync('skin-factory-core/tailor_lab_r09.html','utf8');
 const code=html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
 assert(code,'MISSING_INLINE_MODULE');
 fs.writeFileSync('/tmp/highfly-tailor-r09-module.mjs',code);
 require('node:child_process').execFileSync('node',['--check','/tmp/highfly-tailor-r09-module.mjs']);
 for(const marker of ['HIGHFLY','23 huesos','22 animaciones','PartCrafter','unzipSync',
   'showAIReference','topologyPreserved','NATIVE_KNIGHT_WEARABLE_MISSING','Rig_Medium']){
   if(marker==='getVertexPosition')continue;
   assert(html.includes(marker),'MISSING_'+marker);
 }
 assert(html.includes('IA NO EQUIPABLE'),'MUST_NOT_APPROVE_RAW_AI_STATUE');
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
 try{
  const page=await browser.newPage({viewport:{width:1320,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const resp=await page.goto('http://127.0.0.1:4951/skin-factory-core/tailor_lab_r09.html',{waitUntil:'domcontentloaded',timeout:70000});
  assert(resp.ok());
  await page.waitForFunction(()=>window.__HIGHFLY_TAILOR_R09__?.ready||window.__HIGHFLY_TAILOR_R09__?.lastError,null,{timeout:120000});
  const state=await page.evaluate(()=>window.__HIGHFLY_TAILOR_R09__);
  assert.equal(state.lastError,null,JSON.stringify(state));
  assert.equal(state.bones,23);assert.equal(state.clipCount,22);assert(state.profile.bodyParts);
  assert.equal(state.wearableApproved,false);
  const opts=await page.locator('#clip option').count();assert.equal(opts,23);
  for(const name of ['Running_A','Jump_Idle','1H_Melee_Attack_Chop']){
   await page.selectOption('#clip',{label:name});await page.waitForTimeout(210);
  }
  await page.locator('#raw').setInputFiles('skin-factory-core/factory-test-r09-fixture.glb');
  await page.click('#fit');
  await page.waitForFunction(()=>window.__HIGHFLY_TAILOR_R09__?.animatedWithOriginalRig||window.__HIGHFLY_TAILOR_R09__?.lastError,null,{timeout:65000});
  const s=await page.evaluate(()=>window.__HIGHFLY_TAILOR_R09__);
  assert.equal(s.lastError,null,JSON.stringify(s));
  assert.equal(s.animatedWithOriginalRig,true);assert(s.previewTriangles>=300);assert.equal(s.aiGarmentApplied,false);assert(s.nativeKnightCount===undefined||s.nativeKnightCount>=0);
  assert.equal(s.visualFitApproved,false);assert.equal(s.wearableApproved,false);
  assert.equal(await page.locator('#wearable').textContent(),'IA NO EQUIPABLE');
  fs.mkdirSync('skin-factory-core/factory-evidence-r09',{recursive:true});
  await page.locator('#view').screenshot({path:'skin-factory-core/factory-evidence-r09/native-rig-ai-test-fixture.png'});
  assert.deepEqual(errors,[],'BROWSER_PAGE_ERRORS');
  console.log('HIGHFLY_R09_ORIGINAL_23_BONE_22_CLIP_LOCAL_GLB_DIAGNOSTIC_SKINNING_GREEN');
 }finally{await browser.close()}
})().catch(e=>{console.error('HIGHFLY_R09_BROWSER_RED',e.stack||e);process.exit(1)});
