/** R29 real WebGL Chrome S23 simulated test for all 23 ORIGINAL MIT VFX.
 * Exercises actual vendor AbilityManager and Three scene, including serpent GLB.
 * Distinct from native cast hit/cost/CC QA — does not claim those passed.
 */
import {chromium} from 'playwright';
import fs from 'node:fs';
const URL='http://127.0.0.1:4173/cobalt-hollow-lab/';
const report={device:'Samsung S23 landscape emulation 844x390 DPR3',releaseReady:false,
 sourceRenderCount:0,total:23,sourceVisualFailures:[],pageErrors:[],
 shaderErrors:[],brokenAssets:[],ids:[],status:'pending'};
let browser;
try{
 browser=await chromium.launch({channel:'chrome',headless:true,timeout:60000});
 const ctx=await browser.newContext({viewport:{width:844,height:390},screen:{width:844,height:390},
   deviceScaleFactor:3,isMobile:true,hasTouch:true,
   userAgent:'Mozilla/5.0 (Linux; Android 16; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Mobile Safari/537.36'});
 const page=await ctx.newPage();
 page.on('pageerror',e=>report.pageErrors.push(String(e)));
 page.on('console',msg=>{
   if(msg.type()==='error' && /WebGLProgram|GLSL|shader|compile|ERROR: 0:/i.test(msg.text()))
    report.shaderErrors.push(msg.text().slice(0,900));
 });
 page.on('response',res=>{
  if(res.status()>=400 && /\.glb|\/assets\//.test(res.url()))
   report.brokenAssets.push({status:res.status(),url:res.url()});
 });
 await page.goto(URL,{waitUntil:'domcontentloaded',timeout:50000});
 await page.locator('#hf-origin-entry').waitFor({state:'attached',timeout:60000});
 await page.locator('#hf-origin-name').fill('R29VfxQA');
 await page.evaluate(()=>document.querySelector('#hf-origin-entry button')?.click());
 for(let i=0;i<110;i++){
  const state=await page.evaluate(()=>{
   const b=document.querySelector('#mobile-preflight-continue');
   return {preflight:b instanceof HTMLElement&&b.getBoundingClientRect().height>0
     &&getComputedStyle(b).display!=='none',
     loaded:!!window.__game?.sim?.player,
     probe:!!window.__HIGHFLY_R29_VFX_QA__};
  });
  if(state.preflight)await page.evaluate(()=>document.querySelector('#mobile-preflight-continue')?.click());
  if(state.loaded&&state.probe)break;
  await page.waitForTimeout(650);
 }
 await page.waitForFunction(()=>Boolean(window.__HIGHFLY_R29_VFX_QA__?.probe),null,{timeout:110000});
 const all=await page.evaluate(()=>window.__HIGHFLY_R29_VFX_QA__.ids);
 report.ids=all;
 if(all.length!==23||new Set(all.map(x=>x.id)).size!==23)
   throw Error('R29_BROWSER_23_VFX_CATALOG_DRIFT');
 for(const skill of all){
   const probe=await page.evaluate(async(id)=>
      await window.__HIGHFLY_R29_VFX_QA__.probe(id),skill.id);
   if(!probe.ok)
     report.sourceVisualFailures.push({skill:skill.id,...probe});
   else report.sourceRenderCount++;
   // Forces real WebGL frames; source shaders are rendered by same Three scene.
   await page.waitForTimeout(190);
 }
 report.stats=await page.evaluate(()=>window.__HIGHFLY_R29_VFX_QA__.stats());
 if(report.sourceVisualFailures.length||report.shaderErrors.length||report.pageErrors.length||
    report.brokenAssets.length||report.sourceRenderCount!==23)
   throw Error('R29_ORIGINAL_MIT_SOURCE_VFX_QA_INCOMPLETE');
 report.status='source-vfx-23-pass';
} catch(e){
 report.status='failed';report.error=String(e);
} finally {
 fs.writeFileSync('highfly-r29-vfx23-s23-browser-report.json',JSON.stringify(report,null,2));
 await browser?.close().catch(()=>{});
}
console.log('HIGHFLY_R29_ORIGINAL_MIT_VFX23_S23_BROWSER='+JSON.stringify(report));
if(report.status!=='source-vfx-23-pass')process.exitCode=1;
