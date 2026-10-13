const fs=require('node:fs');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
 try{
  const page=await browser.newPage({viewport:{width:1500,height:910},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  const response=await page.goto('http://127.0.0.1:4257/character-truth/skin7-helmet-compare.html',{waitUntil:'domcontentloaded'});
  assert.equal(response.status(),200);
  await page.waitForFunction(()=>window.__HF_SKIN7_COMPARE__?.ready||window.__HF_SKIN7_COMPARE__?.error,null,{timeout:80000});
  const state=await page.evaluate(()=>window.__HF_SKIN7_COMPARE__);
  if(state.error)throw new Error(state.error);
  assert(state.ready&&state.items.length===2,'COMPARISON_NOT_READY');
  for(const x of state.items){
   assert.equal(x.skinned,true,'HELMET_NOT_NATIVE_SKINNED_MESH');
   assert(x.skinJoints>=15,'NATIVE_BONE_LINKS_MISSING');
   assert(x.triangles>0&&x.helmets>0&&x.bodies>0&&x.finiteBounds,'INVALID_RENDERED_COMPOSITION');
  }
  assert(!errors.length,'BROWSER_PAGE_ERRORS_'+errors.join(' '));
  fs.mkdirSync('character-truth/skin7-evidence',{recursive:true});
  await page.screenshot({path:'character-truth/skin7-evidence/skin7-before-after.png',fullPage:true});
  fs.writeFileSync('character-truth/skin7-evidence/skin7-browser-proof.json',JSON.stringify({green:true,items:state.items,errors,method:'real GLB WebGL browser capture',caveats:['visual capture only','no automatic clipping certification','no S23 physical verification','no runtime item-equipping integration']},null,2));
  console.log('SKIN7_ORIGINAL_VS_NATIVE_VARIANT_REAL_WEBGL_SCREENSHOT_GREEN=1',JSON.stringify(state.items));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
