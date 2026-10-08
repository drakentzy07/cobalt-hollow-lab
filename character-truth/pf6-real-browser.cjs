/* SKIN3 PF6 original game, real Pages build - zero game edits.
 * Runtime proof of screenshots and creator interaction; no final mesh fit certification.
 */
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright');
const URL='http://127.0.0.1:4173/cobalt-hollow-lab/';
const dest=path.resolve('character-truth/phase6-proof');fs.mkdirSync(dest,{recursive:true});
const report={sourceRun:37770166898,sourceArtifact:11548096837,immutablePF6Reference:true,
 originalSourceSha:'312fe2e67219415a73a56303fcbd3b0bd9f62273',runtimeExecuted:false,
 previews:[],inGame:[],pageErrors:[],failedRequests:[],skippedOrUnverified:[],
 PF6VisualEquivalenceCertified:false,fullArmorFitCertified:false,s23PhysicalDeviceCertified:false};
function write(){fs.writeFileSync(path.join(dest,'pf6-real-browser.json'),JSON.stringify(report,null,2));}
(async()=>{
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
  const page=await context.newPage();
  page.on('pageerror',e=>report.pageErrors.push(String(e).slice(0,400)));
  page.on('requestfailed',r=>report.failedRequests.push({url:r.url(),reason:r.failure()?.errorText||'unknown'}));
  page.on('response',r=>{if(r.status()===404)report.failedRequests.push({url:r.url(),reason:'HTTP404'})});
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#btn-offline').waitFor({state:'attached',timeout:20000});
  await page.evaluate(()=>localStorage.setItem('woc.cameraModePrompt.shown','1'));
  for(let i=0;i<65;i++){
   await page.evaluate(()=>document.querySelector('#btn-offline')?.click());
   if(await page.locator('#offline-select').isVisible().catch(()=>false))break;
   await page.waitForTimeout(240);
  }
  assert(await page.locator('#offline-select').isVisible(),'Frozen PF6 offline creator did not open');
  report.runtimeExecuted=true;
  report.availableClasses=await page.locator('#offline-select .mini-class').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-class')).filter(Boolean));
  const classes=['warrior','rogue','hunter','mage'];
  for(const gender of ['male','female']){
   for(const cls of classes){
    const inputName='HF'+gender[0].toUpperCase()+cls.slice(0,7);
    await page.evaluate(({cls,name})=>{
     const input=document.querySelector('#char-name');
     if(input){input.value=name;input.dispatchEvent(new Event('input',{bubbles:true}))}
     document.querySelector('#offline-select .mini-class[data-class="'+cls+'"]')?.click();
    },{cls,name:inputName});
    await page.waitForFunction(cls=>{
     const c=document.querySelector('#char-preview-canvas');
     return c instanceof HTMLCanvasElement&&c.dataset.highflyPreviewVisual==='player_'+cls+'_modular'&&Number(c.dataset.highflyPreviewFrame||0)>0&&c.width>10&&c.height>10;
    },cls,{timeout:30000});
    const genderUI=await page.evaluate(gender=>{
     const pane=document.querySelector('#offline-appearance');
     const tabs=[...(pane?.querySelectorAll('.ac-tab')||[])];
     if(tabs[0])tabs[0].click();
     const buttons=[...(pane?.querySelectorAll('.ac-seg .ac-seg-btn')||[])];
     if(buttons.length>=2)buttons[gender==='female'?1:0].click();
     return {tabs:tabs.map(x=>x.textContent.trim()),bodyButtons:buttons.map(x=>({label:x.textContent.trim(),pressed:x.getAttribute('aria-pressed')})),
       activeIndex:buttons.findIndex(x=>x.getAttribute('aria-pressed')==='true'),exists:buttons.length>=2};
    },gender);
    assert(genderUI.exists,'PF6 creator gender selector missing');
    assert.equal(genderUI.activeIndex,gender==='female'?1:0,'PF6 gender button failed '+gender+' '+cls);
    await page.waitForTimeout(750);
    const runtime=await page.evaluate(()=>{
     const c=document.querySelector('#char-preview-canvas'),gl=c?.getContext('webgl2');
     const rect=c?.getBoundingClientRect(),start=document.querySelector('#btn-start-offline');
     return {visual:c?.dataset.highflyPreviewVisual||'',frames:parseInt(c?.dataset.highflyPreviewFrame||'0',10),
      canvas:[c?.width||0,c?.height||0],css:[Math.round(rect?.width||0),Math.round(rect?.height||0)],
      glAvailable:!!gl,contextLost:gl?.isContextLost()??null,
      canEnter:!!start&&!start.disabled};
    });
    assert(runtime.glAvailable&&!runtime.contextLost,'Real preview WebGL missing '+gender+' '+cls);
    assert(runtime.canEnter&&runtime.frames>0,'Character preview not actually ready '+gender+' '+cls);
    const file='pf6-'+gender+'-'+cls+'-creator.png';
    await page.locator('#offline-preview-container').screenshot({path:path.join(dest,file),timeout:30000});
    report.previews.push({cls,gender,genderUI,runtime,screenshot:file});
    console.log('PF6_REAL_CREATOR_PREVIEW',gender,cls,JSON.stringify(runtime));
   }
  }
  // Enter one actual native female Warrior character without modifying the game.
  await page.evaluate(()=>{
   document.querySelector('#offline-select .mini-class[data-class="warrior"]')?.click();
   document.querySelector('#offline-appearance .ac-tab')?.click();
   const choice=[...document.querySelectorAll('#offline-appearance .ac-seg .ac-seg-btn')][1];
   choice?.click();
   const input=document.querySelector('#char-name');
   if(input){input.value='Skin3WarriorF';input.dispatchEvent(new Event('input',{bubbles:true}));}
  });
  await page.waitForFunction(()=>{
   const c=document.querySelector('#char-preview-canvas');
   return c?.dataset.highflyPreviewVisual==='player_warrior_modular' && +((c?.dataset.highflyPreviewFrame)||0)>0;
  },null,{timeout:30000});
  await page.evaluate(()=>document.querySelector('#btn-start-offline')?.click());
  await page.locator('#mobile-preflight-continue').waitFor({state:'visible',timeout:8000}).catch(()=>{});
  await page.evaluate(()=>document.querySelector('#mobile-preflight-continue')?.click());
  await page.waitForFunction(()=>Boolean(window.__game?.sim?.player),null,{timeout:90000});
  await page.waitForTimeout(2300);
  const ingame=await page.evaluate(()=>{
   const g=window.__game,p=g?.sim?.player,renderer=g?.renderer;
   const canvases=[...document.querySelectorAll('canvas')].map(c=>({id:c.id,width:c.width,height:c.height,visible:(()=>{const b=c.getBoundingClientRect();return b.width>4&&b.height>4})()}));
   return {hasSim:!!p,hasRenderer:!!renderer,name:p?.name||'',level:p?.level||null,characterClass:g?.sim?.cfg?.playerClass||p?.cls||p?.classId||null,
    playerClassSources:{simConfig:g?.sim?.cfg?.playerClass||null,playerCls:p?.cls||null},
    looksRenderKeys:Object.keys(renderer||{}).filter(x=>/char|visual|player|scene|model|rig|world/i.test(x)).slice(0,40),
    canvases,playerPosition:p?.pos?{x:p.pos.x,z:p.pos.z}:null};
  });
  assert(ingame.hasSim&&ingame.hasRenderer,'PF6 game did not construct player and renderer');
  assert.equal(ingame.name,'Skin3WarriorF','PF6 player name did not match freshly entered original Hunter');
  assert.equal(ingame.characterClass,'warrior','PF6 actual playable class is not Warrior: '+JSON.stringify(ingame.playerClassSources));
  report.inGame.push(ingame);
  await page.screenshot({path:path.join(dest,'pf6-warrior-female-inworld.png'),fullPage:true});
  report.creatorVisualGate='PF6_NATIVE_CREATOR_WEBGL_RENDERED_8';
  report.worldBootGate='PF6_NATIVE_WARRIOR_ENTERED_REAL_WORLD';
  const api404=report.failedRequests.filter(x=>x.reason==='HTTP404'&&x.url.includes('/api/'));
  const badStatic=report.failedRequests.filter(x=>x.reason==='HTTP404'&&!x.url.includes('/api/'));
  report.expectedLocalApi404Count=api404.length;
  report.static404Count=badStatic.length;
  report.cancelledAudioCount=report.failedRequests.filter(x=>x.reason==='net::ERR_ABORTED'&&x.url.includes('/audio/')).length;
  if(badStatic.length)report.skippedOrUnverified.push('Unexpected static 404: '+JSON.stringify(badStatic));
  assert.equal(badStatic.length,0,'Original PF6 public game has missing static resources');
  console.log('HIGHFLY_SKIN3_PF6_REAL_CREATOR_GREEN='+report.previews.length+' INGAME='+report.inGame.length+' VERIFIED_CLASS='+ingame.characterClass+' STATIC404='+report.static404Count+' OPTIONAL_API404='+report.expectedLocalApi404Count);
  await context.close();
 }catch(err){
  report.failure=String(err.stack||err);
  console.error('PHASE6_BROWSER_FAIL',report.failure);
  throw err;
 }finally{write();if(browser)await browser.close()}
})().catch(()=>process.exit(1));