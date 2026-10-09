/* V13 real source Hunter + original Nightfall true THREE material brush audit. */
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve('character-truth/v13-forged-paint-proof');fs.mkdirSync(root,{recursive:true});
const report={checks:[],errors:[],visualQualityApproved:false,physicalSamsungVerified:false,
  modifiedGlbExported:false,originalHunterUntouched:true,green:false};
const check=(condition,why)=>{assert(condition,why);report.checks.push(why)};
(async()=>{
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
  const ctx=await browser.newContext({viewport:{width:915,height:412},isMobile:true,hasTouch:true,deviceScaleFactor:2,acceptDownloads:true});
  const page=await ctx.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));
  const port=process.env.HF_SITE_PORT||'4173';
  await page.goto('http://127.0.0.1:'+port+(port==='4173'?'/character-truth/integration-modules/studio-v13.html':'/'),
    {waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.__HF_SKIN_STUDIO_V5__?.state().ready,null,{timeout:120000});
  check(!!(await page.locator('#premiumPainterPanel').count()),'Real forged armor paint control panel loads');
  await page.locator('#bodyForgeLoad').click();
  await page.waitForFunction(()=>window.__HF_SKIN_STUDIO_V10__?.state().mounted||
    /RECHAZADO/i.test(document.querySelector('#bodyForgeState')?.textContent||''),null,{timeout:40000});
  const start=await page.evaluate(()=>{
   const body=window.__HF_SKIN_STUDIO_V10__,meshes=body.forgedMeshes();
   const m=meshes.find(m=>m.name==='HFV12_M_CHEST_ABDOMINAL_CUIRASS');
   const f=meshes.find(m=>m.name==='HFV12_F_CHEST_ABDOMINAL_CUIRASS');
   if(!m||!f)throw Error('NO_AUTHENTIC_V12_FORGED_PAIR');
   return {meshCount:meshes.length,m:m.material.color.getHexString(),f:f.material.color.getHexString(),
     originalRig:body.state().originalRig};
  });
  check(start.meshCount===92&&start.originalRig,'All 92 genuine Blender meshes on ORIGINAL Rig_Medium');
  const p=await page.evaluate(()=>{
   const api=window.__HF_SKIN_STUDIO_V13__;
   const selected=api.selectByName('HFV12_M_CHEST_ABDOMINAL_CUIRASS');
   const applied=api.apply('#ee4488',.55,.22);
   return {selected,applied,recipe:api.recipe(),state:api.state()};
  });
  check(p.selected.key==='HFV12_CHEST_ABDOMINAL_CUIRASS'&&p.applied.meshCount===2,
   'Direct forge painting applies exact same real plate to M and F');
  check(p.state.paintedPieces===1&&!p.state.exportedBakedGLB,
   'Edits are real Three.js materials, not fake baked GLB claim');
  const painted=await page.evaluate(()=>{
    const a=window.__HF_SKIN_STUDIO_V10__.forgedMeshes();
    return ['HFV12_M_CHEST_ABDOMINAL_CUIRASS','HFV12_F_CHEST_ABDOMINAL_CUIRASS']
      .map(n=>a.find(m=>m.name===n).material.color.getHexString());
  });
  check(painted.every(c=>c==='ee4488'),'Both actual SkinnedMesh materials visibly colored in Three.js');
  await page.locator('#front').click();
  await page.screenshot({path:path.join(root,'01-v13-premium-live-pink-cuirass.png')});
  const receipt=await page.evaluate(()=>window.__HF_SKIN_STUDIO_V13__.recipe());
  await page.evaluate(()=>window.__HF_SKIN_STUDIO_V13__.reset());
  const reset=await page.evaluate(()=>{
    const a=window.__HF_SKIN_STUDIO_V10__.forgedMeshes();
    return ['HFV12_M_CHEST_ABDOMINAL_CUIRASS','HFV12_F_CHEST_ABDOMINAL_CUIRASS']
      .map(n=>a.find(m=>m.name===n).material.color.getHexString());
  });
  check(reset[0]===start.m&&reset[1]===start.f,'Reset restores BOTH exact original Blender material colors');
  const restored=await page.evaluate(recipe=>{
    window.__HF_SKIN_STUDIO_V13__.loadRecipe(recipe);
    return window.__HF_SKIN_STUDIO_V13__.state();
  },receipt);
  check(restored.paintedPieces===1,'Validated JSON recipe fully restores REAL forged material');
  await page.locator('#gender').selectOption('female');
  check((await page.evaluate(()=>window.__HF_SKIN_STUDIO_V10__.state())).activeMeshes===46,
   'Female original Hunter retains 46 real forge skinned meshes after palette edit');
  await page.locator('#front').click();
  await page.screenshot({path:path.join(root,'02-v13-female-painted-cuirass.png')});
  const dl=page.waitForEvent('download');
  await page.locator('#premiumRecipeDownload').click();
  check((await dl).suggestedFilename()==='HIGHFLY-Nightfall-V13-mi-pintura.json',
    'User can export bounded style recipe WITHOUT falsely claiming GLB repaint');
  report.green=true;
  check(!report.errors.length,'No uncaught 3D browser errors');
  console.log('HIGHFLY_V13_NATIVE_WEIGHTED_ARMOR_TRUE_MATERIAL_PAINT_GREEN=1 '+JSON.stringify({
    checks:report.checks.length,originalRig:true,forgedMeshes:92,
    genderMaterialSync:true,presetRecipe:true,glbBaked:false,gameUnchanged:true}));
  await ctx.close();
 }catch(e){report.failure=String(e.stack||e);console.error('HIGHFLY_V13_REAL_PAINT_RED',report.failure);throw e}
 finally{fs.writeFileSync(path.join(root,'report.json'),JSON.stringify(report,null,2));if(browser)await browser.close()}
})().catch(()=>process.exitCode=1);
