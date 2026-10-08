/* Native KAGE-ONI proof: Blender-generated new GLB, real Warrior bone binding. */
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const out=path.resolve('character-truth/forge-v6-proof');fs.mkdirSync(out,{recursive:true});
const report={originalSource:true,noGameEdits:true,physicalS23Tested:false,
 fullBodySkinned:false,checks:[],errors:[],captures:[],green:false};
function ok(x,msg){assert(x,msg);report.checks.push(msg)}
(async()=>{
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
  const context=await browser.newContext({viewport:{width:915,height:412},deviceScaleFactor:2,hasTouch:true,isMobile:true,acceptDownloads:true});
  const page=await context.newPage();
  page.on('pageerror',e=>report.errors.push('JS '+e.message));
  page.on('requestfailed',e=>report.errors.push('NET '+e.url()+' '+e.failure()?.errorText));
  page.on('response',e=>{if(e.status()>=400)report.errors.push('HTTP '+e.status()+' '+e.url())});
  const port=process.env.HF_SITE_PORT||'4173';
  const url=port==='4173'?'/character-truth/integration-modules/studio-v6.html':'/';
  await page.goto('http://127.0.0.1:'+port+url,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.__HF_SKIN_STUDIO_V5__?.state().ready||
    window.__HF_SKIN_STUDIO_V5__?.state().error,null,{timeout:120000});
  const initial=await page.evaluate(()=>({v5:window.__HF_SKIN_STUDIO_V5__.state(),v6:window.__HF_SKIN_STUDIO_V6__.state()}));
  ok(initial.v5.ready&&initial.v6.rigOriginal,'Original warrior_modular Rig_Medium loads');
  ok(initial.v6.forgedMeshes===0,'Unmodified native character before forge');
  await page.screenshot({path:path.join(out,'01-native-before-forge.png')});
  await page.locator('#forgeLoad').click();
  await page.waitForFunction(()=>window.__HF_SKIN_STUDIO_V6__.state().realHeadAttached||
    /rechazada/i.test(document.querySelector('#forgeState')?.textContent||''),null,{timeout:90000});
  let state=await page.evaluate(()=>window.__HF_SKIN_STUDIO_V6__.state());
  ok(state.realHeadAttached&&state.headName?.toLowerCase()==='head','Brand new Blender geometry anchored to authentic HEAD bone');
  ok(state.sample&&state.forgedMeshes>=25&&state.binaryBytes>5000,'Original Kage Oni GLB with at least 25 meshes');
  const native=await page.evaluate(()=>window.__HF_SKIN3_FACTORY_V4__.state());
  ok(!native.design.parts.head,'Native helmet omitted to prevent overlapping head geometry');
  await page.screenshot({path:path.join(out,'02-kage-oni-front.png')});
  await page.locator('#profile').click();
  await page.screenshot({path:path.join(out,'03-kage-oni-profile.png')});
  await page.locator('#backview').click();
  await page.screenshot({path:path.join(out,'04-kage-oni-back.png')});
  const animation=await page.evaluate(()=>window.__HF_SKIN3_FACTORY_V4__.sourceAnimation('Walking_A',.4));
  ok(animation.animatedMeshes>0&&animation.finiteVertices,'Original walking animation keeps functioning with attached helmet');
  ok((await page.evaluate(()=>window.__HF_SKIN_STUDIO_V6__.state())).realHeadAttached,
    'Accessory stays child of real head through native animation');
  const dl=page.waitForEvent('download');
  await page.locator('#forgeDownload').click();
  const download=await dl;ok(download.suggestedFilename()==='HIGHFLY-KAGE-ONI-original.glb','User can download actual produced GLB');
  await page.locator('#forgeOff').click();
  state=await page.evaluate(()=>window.__HF_SKIN_STUDIO_V6__.state());
  ok(!state.realHeadAttached&&state.binaryBytes===0,'Disabling forged helmet removes attachment safely');
  await page.locator('#forgeLoad').click();
  await page.waitForFunction(()=>window.__HF_SKIN_STUDIO_V6__.state().realHeadAttached,{timeout:50000});
  await page.locator('#gender').selectOption('female');
  ok((await page.evaluate(()=>window.__HF_SKIN_STUDIO_V6__.state())).realHeadAttached,'Forge attached after native gender variation');
  ok(report.errors.length===0,'No renderer, GLTF parse, CORS, JS or HTTP errors');
  report.green=true;
  console.log('HIGHFLY_V6_ORIGINAL_KAGE_ONI_BLENDER_RIG_HEAD_GREEN=1 CHECKS='+report.checks.length+' PUBLIC_DEPLOY=0');
  await context.close();
 }catch(e){report.failure=String(e.stack||e);console.error('HIGHFLY_V6_FORGE_RED',report.failure);throw e}
 finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));if(browser)await browser.close()}
})().catch(()=>process.exit(1));
