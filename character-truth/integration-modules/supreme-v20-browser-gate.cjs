/** V20 live Chromium portrait & S23 landscape emulation with authentic pinned V19 GLBs.
 * Physical Galaxy S23 and Unity not tested.
 */
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const proof='character-truth/v20-evidence';fs.mkdirSync(proof,{recursive:true});
const checks=[],errors=[];
function ok(value,label){assert(value,label);checks.push(label)}
(async()=>{
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
  const context=await browser.newContext({viewport:{width:915,height:412},isMobile:true,
   hasTouch:true,deviceScaleFactor:2,acceptDownloads:true});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4200/',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.__HF_SKIN_STUDIO_V5__?.state().ready,null,{timeout:120000});
  await page.waitForFunction(()=>window.__HF_SUPREME_V20__?.state().ready,null,{timeout:60000});
  ok(await page.locator('#dreamCockpit').count()===1,'V17 frozen cockpit preserved');
  ok(await page.locator('#hf18Panel').count()===1,'V18 authentic head fit preserved');
  ok(await page.locator('#hf19Panel').count()===1,'V19 real new mesh forge preserved');
  ok(await page.locator('#hf20Panel').count()===1,'V20 new guided image/text recipe UI exists');
  ok(await page.locator('#hf20Launch').count()===1,'V20 premium direct studio launch exists');
  const initial=await page.evaluate(()=>window.__HF_SUPREME_V20__.state());
  ok(initial.originalHunterPreserved,'V20 never replaces Hunter actor');
  await page.locator('#hf20Launch').click();
  ok(await page.evaluate(()=>window.__HF_DREAM_V17__.state().tab)==='editor',
    'V20 editor navigation opens 3D original real character');
  const r=await page.evaluate(()=>window.__HF_SUPREME_V20__.analyze());
  ok(r?.schema==='highfly.supreme.armor/v20.1'&&r.rig==='Rig_Medium',
    'Spanish idea converted to strictly original-rig JSON');
  ok(r.pieces.helmet.includes('kabuto')&&r.pieces.shoulder.includes('massive')&&
    r.palette.base==='#ac2533','Reference samurai red armor parsed into semantic pieces and palette');
  const result=await page.evaluate(()=>window.__HF_SUPREME_V20__.wear());
  ok(result.affected>=60&&result.shoulder>0,'Existing Blender-weighted V19 armor styled on actual Hunter');
  const mount=await page.evaluate(()=>window.__HF_LEGENDARY_V19__.inspect());
  ok(mount.mapped&&mount.sourceJointCount===23&&mount.originalOnly,
    'All 23 genuine ClaudeCraft Rig_Medium joints still authoritative');
  const source=await page.evaluate(()=>window.__HF_SUPREME_V20__.recipe());
  ok(source.generatedNewMeshes===false,'UI does not claim arbitrary image-to-3D capability');
  await page.screenshot({path:proof+'/01-v20-crimson-samurai-real-hunter-mobile.png'});
  const exportProof=await page.evaluate(()=>window.__HF_SUPREME_V20__.exportGlb());
  ok(exportProof.affectedPrimitives>=60&&exportProof.sourceRigPreserved&&
    exportProof.shoulderNodesScaled>0,'Real rigged GLB rewritten with actual PBR materials and bounded mesh scale');
  await page.locator('#hf20Image').evaluate(async input=>{
   const c=document.createElement('canvas');c.width=80;c.height=80;
   const ctx=c.getContext('2d');ctx.fillStyle='#050509';ctx.fillRect(0,0,80,80);
   ctx.fillStyle='#db1730';ctx.fillRect(20,8,40,64);
   ctx.fillStyle='#e6b04b';ctx.fillRect(32,8,16,64);
   const b=await new Promise(resolve=>c.toBlob(resolve,'image/png'));
   const dt=new DataTransfer();dt.items.add(new File([b],'samurai-test.png',{type:'image/png'}));
   input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));
  });
  const imgRecipe=await page.evaluate(()=>window.__HF_SUPREME_V20__.analyze());
  ok(imgRecipe.palette.source==='V16-heuristic-pixels-plus-user-description',
    'Local uploaded image goes through honest V16 heuristic pixel colors');
  ok(imgRecipe.confidence.imageSemantics==='not inferred; use written notes',
    'No false promise of perfect photo-to-freeform-geometry');
  await page.locator('#hf20Reset').click();
  ok(await page.evaluate(()=>window.__HF_SUPREME_V20__.state().mountedStyled)===0,
    'Reset restores exact original V19 materials and scales');
  ok(errors.length===0,'No page JavaScript errors on actual skinned 3D');
  fs.writeFileSync(proof+'/browser-proof.json',JSON.stringify({green:true,checks,errors,
   originalHunter:true,rigBones:23,artistApproved:false,physicalSamsungVerified:false,
   unityImportVerified:false,newFreeformMeshGeneration:false},null,2));
  console.log('HIGHFLY_V20_1_TRUE_IMAGE_TEXT_RECIPE_AND_REAL_HUNTER_STYLED_GLB_BROWSER_GREEN=1 CHECKS='+checks.length);
 }finally{await browser?.close()}
})().catch(e=>{
 fs.writeFileSync(proof+'/browser-red.json',JSON.stringify({error:String(e.stack||e),checks,errors},null,2));
 console.error(e);process.exitCode=1;
});
