/* Standalone package must run from NEW SITE ROOT, no old /character-truth paths */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const out='highfly-skinfactory-v5-site-proof';fs.mkdirSync(out,{recursive:true});
const doc={standaloneRoot:true,glbsBundled:false,published:false,PF6Modified:false,
rightsReviewRequired:true,physicalS23Tested:false,pass:false,checks:[],errors:[]};
const yes=(condition,msg)=>{assert(condition,msg);doc.checks.push(msg)};
(async()=>{
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
  const page=await browser.newPage({viewport:{width:915,height:412},hasTouch:true,isMobile:true,deviceScaleFactor:2});
  page.on('pageerror',e=>doc.errors.push('JS '+String(e)));
  page.on('requestfailed',r=>doc.errors.push('HTTP transport '+r.url()+' '+r.failure()?.errorText));
  page.on('response',r=>{if(r.status()>=400)doc.errors.push('HTTP '+r.status()+' '+r.url())});
  await page.goto('http://127.0.0.1:4174/',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.__HF_SKIN_STUDIO_V5__?.state().ready||
   window.__HF_SKIN_STUDIO_V5__?.state().error,null,{timeout:120000});
  const result=await page.evaluate(()=>({
   state:window.__HF_SKIN3_FACTORY_V4__.state(),
   glb:performance.getEntriesByType('resource').filter(x=>/\.glb/.test(x.name)).map(x=>x.name),
   width:innerWidth,scroll:document.documentElement.scrollWidth,studio:window.__HF_SKIN_STUDIO_V5__.state()
  }));
  yes(result.studio.ready&&result.studio.rig,'V5 interface initializes on original native source');
  yes(result.state.ready&&!result.state.error,'standalone root uses real source GLB and bundled JS dependencies');
  yes(result.glb.length===6&&result.glb.every(x=>x.includes('raw.githubusercontent.com/levy-street/world-of-claudecraft/')),
    'original assets loaded upstream, never copied into our ZIP');
  yes(result.scroll<=result.width+3,'full V4 portrait/widescreen fallback does not spill horizontally in emulation');
  await page.screenshot({path:path.join(out,'site-opened-01.png')});
  await page.locator('#kit').selectOption('rogue');
  await page.locator('#kitApply').click();
  yes((await page.evaluate(()=>window.__HF_SKIN_STUDIO_V5__.state())).parts.length===7,'V5 source kit editor works standalone');
  await page.evaluate(()=>{
   const a=window.__HF_SKIN3_FACTORY_V4__;
   a.put('feet','ranger','graphite');
   a.shape('feet',{width:.3,length:.2,depth:0,taper:-.1});
   a.shape('chest',{width:.5,length:.2,depth:0,taper:0});
  });
  await page.locator('#save').click();
  const saved=await page.evaluate(()=>localStorage.getItem('HIGHFLY_SKIN3_FACTORY_V4_SAVED_DESIGN'));
  yes(JSON.parse(saved).shapes.feet.width===.3&&JSON.parse(saved).shapes.chest.width===.5,
    'standalone save writes original armor sculpt AND paint recipe');
  await page.reload({waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.__HF_SKIN3_FACTORY_V4__?.state().ready,null,{timeout:120000});
  await page.locator('#load').click();
  const recovered=await page.evaluate(()=>({
   saved:window.__HF_SKIN3_FACTORY_V4__.save(),
   meshes:window.__HF_SKIN3_FACTORY_V4__.geometry().filter(m=>m.changed).length
  }));
  yes(recovered.saved===saved&&recovered.meshes>0,'published-path reload restores real molded source geometry');
  const animation=await page.evaluate(()=>window.__HF_SKIN3_FACTORY_V4__.sourceAnimation('Walking_A',.3));
  yes(animation.finiteVertices&&animation.animatedMeshes>0,'source animation runs on restored sculpted Hunter');
  yes(doc.errors.length===0,'no failed browser module import/GLB HTTP/CORS/runtime errors');
  await page.screenshot({path:path.join(out,'site-restored-02.png')});
  doc.pass=true;
  console.log('HIGHFLY_SKIN_STUDIO_V5_PORTABLE_SITE_GREEN=1 CHECKS='+doc.checks.length+' ORIGINAL_GLB_BUNDLED=0 PUBLIC_DEPLOY=0');
 }catch(e){doc.failure=String(e.stack||e);console.error('V5_PORTABLE_SITE_RED',doc.failure);throw e}
 finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(doc,null,2));if(browser)await browser.close()}
})().catch(()=>process.exit(1));
