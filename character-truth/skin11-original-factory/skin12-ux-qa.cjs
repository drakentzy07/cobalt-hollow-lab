const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const url=process.env.SKIN11_TEST_URL||'http://127.0.0.1:4777/';
const proof=process.env.SKIN12_QA_DIR||'character-truth/skin11-original-factory/skin12-qa';
fs.mkdirSync(proof,{recursive:true});
(async()=>{
 const b=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader']});
 try{
  const ctx=await b.newContext({viewport:{width:915,height:412},isMobile:true,hasTouch:true,deviceScaleFactor:2,acceptDownloads:true});
  const p=await ctx.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto(url,{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>!!window.__HF_SKIN11_FACTORY__);
  assert.equal(await p.locator('.preset').count(),5);
  assert.equal(await p.locator('#stepModel').innerText(),'3 · Modelo 3D pendiente');
  await p.locator('[data-preset="eclipse"]').click();
  const prompt=await p.locator('#prompt').inputValue();
  assert(prompt.includes('Eclipse Eterno')&&prompt.includes('ClaudeCraft')&&prompt.includes('Hombreras'));
  assert((await p.locator('#characters').innerText()).includes(String(prompt.length)));
  assert.equal((await p.evaluate(()=>window.__HF_SKIN11_FACTORY__.snapshot())).presetSelected,'eclipse');
  await p.locator('#build').click();
  let snap=await p.evaluate(()=>window.__HF_SKIN11_FACTORY__.snapshot());
  assert.equal(snap.stage,'DESIGN_BRIEF_CREATED');
  assert.equal(snap.modelReady,false);assert.equal(snap.historyCount,1);
  assert.equal(snap.legacyGeometryForbidden,true);assert.equal(snap.aiStatus,'NOT_CONNECTED');
  assert((await p.locator('#result').innerText()).includes('12 piezas originales'));
  assert((await p.locator('#stageLabel').innerText()).includes('MODELADO PENDIENTE'));
  await p.screenshot({path:proof+'/eclipse-intuitive-first-draft.png',fullPage:true});
  const dl=p.waitForEvent('download',{timeout:10000});
  await p.locator('#export').click();
  const downloaded=await dl;assert(downloaded.suggestedFilename().endsWith('-ORIGINAL-SKIN.json'));
  await p.locator('[data-preset="dragon"]').click();
  await p.locator('#build').click();
  snap=await p.evaluate(()=>window.__HF_SKIN11_FACTORY__.snapshot());
  assert.equal(snap.historyCount,2);
  assert.equal(snap.modelReady,false);
  await p.reload();await p.waitForFunction(()=>!!window.__HF_SKIN11_FACTORY__);
  snap=await p.evaluate(()=>window.__HF_SKIN11_FACTORY__.snapshot());
  assert.equal(snap.historyCount,2);
  assert.equal(snap.stage,'ENTER_IDEA');
  assert.equal(errors.length,0,errors.join('; '));
  fs.writeFileSync(proof+'/gate.json',JSON.stringify({green:true,
   testedMobileSize:'915x412',eclipseStarter:true,originalArmorTags:true,oneClickBrief:true,
   auto3DGenerated:false,aiServiceConfigured:false,legacySkinsEdited:false,
   artApproved:false,publicHIGHFLYDeployed:false,errors},null,2));
  console.log('HIGHFLY_SKIN12_ECLIPSE_EASY_FACTOY_5_PRESETS_MOBILE_ART_NO_GO_GREEN=1');
 }finally{await b.close()}
})().catch(e=>{fs.writeFileSync(proof+'/gate-red.json',JSON.stringify({error:String(e.stack||e)},null,2));console.error(e);process.exitCode=1});
