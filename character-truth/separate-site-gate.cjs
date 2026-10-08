/* Verify site candidate from exact project-relative / entry URL.
   Remote upstream art is loaded by original URL; no raw GLB published here.
 */
const assert=require('node:assert/strict'), fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const output=path.resolve('skin3-site-proof');fs.mkdirSync(output,{recursive:true});
const report={kind:'PUBLIC_STATIC_SITE_CANDIDATE_TEST',standaloneRepoCreated:false,
 publicPagesDeployed:false,sourceArtBundled:false,externalModelOrigin:'levy-street/world-of-claudecraft',
 physicalS23:false,sourceOnly:true,checks:[],errors:[],success:false};
function ok(x,s){assert(x,s);report.checks.push(s);}
(async()=>{
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:915,height:412},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  page.on('pageerror',e=>report.errors.push('JS '+String(e)));
  page.on('requestfailed',r=>report.errors.push('REQUEST '+r.url()+' '+r.failure()?.errorText));
  page.on('response',r=>{if(r.status()>=400)report.errors.push('HTTP '+r.status()+' '+r.url())});
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.__HF_SKIN3_P10__?.ready ||
   window.__HF_SKIN3_P10__?.getDiagnostics()?.errors?.length ||
   window.__HF_SKIN3_CAGE__?.error, null,{timeout:150000});
  const read=()=>page.evaluate(()=>({
   source:window.__HF_SKIN3_CAGE__?.ready,
   error:window.__HF_SKIN3_CAGE__?.error,
   ready:window.__HF_SKIN3_P10__?.ready,
   diag:window.__HF_SKIN3_P10__?.getDiagnostics(),
   parts:window.__HF_SKIN3_CAGE__?.last?.parts?.length||0,
   size:[innerWidth,innerHeight],scrollWidth:document.documentElement.scrollWidth,
   original:window.__HF_SKIN3_CAGE__?.sourceRevision
  }));
  const init=await read();report.initial=init;
  ok(init.ready,'published-path entry loads same genuine actor, module dependencies and six upstream GLB');
  ok(init.source&&init.parts>5,'original skinned 3D meshes rendered');
  ok(init.original==='9b57e49c9676d75962700f828cc00a50a9a988b5','frozen source identity retained');
  ok(init.scrollWidth<=init.size[0]+3,'landscape not horizontally clipped');
  await page.screenshot({path:path.join(output,'preview-01-original.png'),timeout:30000});
  await page.locator('#p10-item').selectOption('source-demo-1');
  await page.locator('#p10-equip').click();
  let s=await page.evaluate(()=>({
   state:window.__HF_SKIN3_P10__.getState(),
   visual:window.__HF_SKIN3_P10__.getVisual(),
   meshes:window.__HF_SKIN3_CAGE__.last.parts.map(m=>m.name)
  }));
  ok(s.state.equipment.chest?.itemId==='militia_vest','HTML touch equip selected actual catalog item');
  ok(s.visual.worn.chest==='knight'&&s.meshes.some(m=>m.startsWith('Armor_knight_')),
   'actual upstream native chest armor mesh rendered');
  await page.screenshot({path:path.join(output,'preview-02-original-equipped.png'),timeout:30000});
  await page.locator('#p10-save').click();
  await page.reload({waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.__HF_SKIN3_P10__?.ready,null,{timeout:150000});
  await page.locator('#p10-load').click();
  s=await page.evaluate(()=>({state:window.__HF_SKIN3_P10__.getState(),visual:window.__HF_SKIN3_P10__.getVisual()}));
  ok(s.state.equipment.chest?.itemId==='militia_vest'&&s.visual.worn.chest==='knight',
   'same-site real browser reload restores isolated test save');
  await page.locator('#p10-unequip-slot').selectOption('chest');
  await page.locator('#p10-unequip').click();
  s=await page.evaluate(()=>({state:window.__HF_SKIN3_P10__.getState(),visual:window.__HF_SKIN3_P10__.getVisual()}));
  ok(!s.state.equipment.chest&&s.visual.worn.chest===null,'visual unequip works on site candidate');
  const privateArt=await page.evaluate(()=>performance.getEntriesByType('resource').filter(x=>x.name.endsWith('.glb')).map(x=>x.name));
  ok(privateArt.length===6&&privateArt.every(x=>x.includes('raw.githubusercontent.com/levy-street/world-of-claudecraft/9b57e49c')),
   'all original GLB load from original upstream, not duplicated in site');
  ok(report.errors.length===0,'no CORS, 404 or browser JS errors');
  report.remoteModels=privateArt.map(u=>u.slice(u.lastIndexOf('/')+1));
  report.success=true;
  console.log('HIGHFLY_SKIN3_SEPARATE_PREVIEW_BUNDLE_GREEN=1 CHECKS='+report.checks.length+
   ' LIVE_PAGES_DEPLOYED=0 ORIGINAL_GLBS_BUNDLED=0');
 }catch(e){report.failure=String(e.stack||e);console.error('SITE_PACKAGE_GATE_FAILED',report.failure);throw e;}
 finally{fs.writeFileSync(path.join(output,'site-gate.json'),JSON.stringify(report,null,2));if(browser)await browser.close()}
})().catch(()=>process.exit(1));
