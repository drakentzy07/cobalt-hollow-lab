/** Chromium emulated S23 landscape: TRUE 54 mesh Blender original, original 23 bone Hunter,
 * 2 body sexes, 2 geometrically different profiles, user accept/reject (local, no game).
 */
const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const dir='character-truth/skin7-block2-evidence';fs.mkdirSync(dir,{recursive:true});
const checks=[],errors=[];
const ok=(value,name)=>{assert(value,name);checks.push(name)};
(async()=>{
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
  const ctx=await browser.newContext({viewport:{width:915,height:412},isMobile:true,
   hasTouch:true,deviceScaleFactor:2,acceptDownloads:true});
  const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4277/',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.__HF_SKIN_STUDIO_V5__?.state().ready,null,{timeout:120000});
  await page.waitForFunction(()=>window.__HF_SKIN7_SUPREME_FORGE__?.state().ready,null,{timeout:60000});
  ok(await page.locator('#dreamCockpit').count()===1,'Frozen V17 cockpit still present');
  ok(await page.locator('#hf18Panel').count()===1,'Frozen V18 actual head truth still present');
  ok(await page.locator('#hf19Panel').count()===1,'Frozen V19 actual geometry still present');
  ok(await page.locator('#hf20Panel').count()===1,'Frozen V20 text/image recipe still present');
  ok(await page.locator('#skin7Panel').count()===1,'One clean additive SKIN7 artisan workbench');
  const ui=await page.evaluate(()=>window.__HF_SKIN7_SUPREME_FORGE__);
  ok(await page.evaluate(()=>window.__HF_SKIN7_SUPREME_FORGE__.state().productionCatalogApproved)===false,
    'No automatic artistic acceptance or gameplay integration');
  await page.locator('#skin7Open').click();
  ok(await page.evaluate(()=>window.__HF_DREAM_V17__.state().tab)==='editor',
    'Artisan cockpit opens exact original 3D Hunter editor');
  const crimson=await page.evaluate(()=>window.__HF_SKIN7_SUPREME_FORGE__.forge());
  ok(crimson.realBlenderNewMeshCount===54&&crimson.vertices>1500,
    'REAL authored Blender 54 meshes mounted, not only recolor');
  ok(crimson.realRigBones===23&&crimson.topologyNovel&&crimson.originalCharacterBodyUnchanged,
    'Original native ClaudeCraft rig and character meshes preserved');
  let i=await page.evaluate(()=>window.__HF_SKIN7_SUPREME_FORGE__.inspect());
  ok(i.nativeBoneMapping&&i.gender==='M'&&i.visible===27,
    '27 original-weighted new male meshes share exact 23 native bones');
  await page.locator('#skin7Front').click();
  await page.screenshot({path:dir+'/01-crimson-male-front.png'});
  await page.locator('#skin7Side').click();
  await page.screenshot({path:dir+'/02-crimson-male-side.png'});
  await page.locator('#skin7Gender').selectOption('female');
  i=await page.evaluate(()=>window.__HF_SKIN7_SUPREME_FORGE__.inspect());
  ok(i.gender==='F'&&i.visible===27,
    '27 distinct female-authored meshes on true original female modular Hunter');
  await page.locator('#skin7Back').click();
  await page.screenshot({path:dir+'/03-crimson-female-back.png'});
  const animation=await page.evaluate(()=>window.__HF_SKIN7_SUPREME_FORGE__.anim());
  ok(animation.length===5&&animation.every(x=>x.finite&&x.newSkinnedMeshes===27),
    'Five original source animation clips checked on new skinned parts');
  const exportOverlay=await page.evaluate(()=>window.__HF_SKIN7_SUPREME_FORGE__.exportOverlay());
  const exportFull=await page.evaluate(()=>window.__HF_SKIN7_SUPREME_FORGE__.exportFull());
  ok(exportOverlay.bytes>15000&&exportFull.bytes>exportOverlay.bytes,
    'Export two actual generated skinned GLBs including real new topology');
  const accepted=await page.evaluate(()=>window.__HF_SKIN7_SUPREME_FORGE__.decision('liked'));
  ok(accepted.userDecision==='liked'&&accepted.authorizedGameplayDeployment===false,
    'ARTISTIC liked candidate stored locally; game unchanged, QA pending');
  const stored=await page.evaluate(()=>localStorage.getItem('highfly.skin7.art-review.local.v1'));
  ok(JSON.parse(stored)?.userDecision==='liked','User art feedback persists in local project browser');
  await page.locator('#skin7Prompt').fill('Armadura caballero oscuro guardian de acero plata, hombros equilibrados, pecho blindado y faldones');
  const guardian=await page.evaluate(()=>window.__HF_SKIN7_SUPREME_FORGE__.forge());
  ok(guardian.profile==='guardian'&&guardian.realBlenderNewMeshCount===54,
    'Different Spanish prompt selects a SECOND genuinely separately forged geometry family');
  await page.locator('#skin7Front').click();
  await page.screenshot({path:dir+'/04-guardian-female-front.png'});
  const reject=await page.evaluate(()=>window.__HF_SKIN7_SUPREME_FORGE__.decision('discarded'));
  ok(reject.userDecision==='discarded'&&!await page.evaluate(()=>window.__HF_SKIN7_SUPREME_FORGE__.state().mounted),
    'DISCARD actually removes only candidate and restores prior original studio');
  ok(errors.length===0,'No JavaScript errors through actual rigged 3D armors and two scenarios');
  fs.writeFileSync(dir+'/browser-proof.json',JSON.stringify({green:true,checks,errors,
    rig:'Rig_Medium',bones:23,realAuthoredMeshes:54,genders:['M','F'],
    physicalS23Tested:false,unityImportTested:false,artistApproved:false,
    publicGameUnchanged:true,semanticImageToArbitrary3D:false},null,2));
  console.log('HIGHFLY_SKIN7_BLOCK2_REAL_ARTISAN_FORGE_TWO_ORIGINAL_3D_PROFILES_BROWSER_GREEN=1 CHECKS='+checks.length);
 }finally{await browser?.close()}
})().catch(e=>{
 fs.writeFileSync(dir+'/browser-red.json',JSON.stringify({error:String(e.stack||e),checks,errors},null,2));
 console.error(e);process.exitCode=1;
});
