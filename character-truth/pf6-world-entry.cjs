/* HIGHFLY SKIN 3 Phase 6B — direct faithful Warrior female frozen PF6.
 * Does not approve actual visual equip clearances or skin transfers.
 */
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve('character-truth/phase6-world-proof');fs.mkdirSync(root,{recursive:true});
const report={sourceRun:37770166898,sourceBuild:'PF6_RUN333_FROZEN_PAGES',creatorGender:'female',intendedClass:'warrior',
 intendedName:'Skin3WarriorF',runtimeGameLoaded:false,playerIdentityVerified:false,API404:[],asset404:[],
 errors:[],requestFailures:[],visualMatchInSceneNotProven:true,realS23NotTested:true};
async function main(){
 const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage']});
 let page;
 try{
  page=await browser.newPage({viewport:{width:1440,height:900}});
  page.on('pageerror',e=>report.errors.push(String(e)));
  page.on('response',r=>{if(r.status()===404)(r.url().includes('/api/')?report.API404:report.asset404).push(r.url())});
  page.on('requestfailed',r=>report.requestFailures.push({url:r.url(),reason:r.failure()?.errorText||'unknown'}));
  await page.goto('http://127.0.0.1:4173/cobalt-hollow-lab/',{waitUntil:'domcontentloaded',timeout:35000});
  await page.evaluate(()=>localStorage.setItem('woc.cameraModePrompt.shown','1'));
  await page.locator('#btn-offline').waitFor({state:'attached',timeout:15000});
  for(let i=0;i<65;i++){
    await page.evaluate(()=>document.querySelector('#btn-offline')?.click());
    if(await page.locator('#offline-select').isVisible().catch(()=>false))break;
    await page.waitForTimeout(220);
  }
  assert(await page.locator('#offline-select').isVisible(),'Frozen PF6 offline selector failed');
  await page.evaluate(()=>{
   const n=document.querySelector('#char-name');
   n.value='Skin3WarriorF';n.dispatchEvent(new Event('input',{bubbles:true}));
   document.querySelector('#offline-select .mini-class[data-class="warrior"]')?.click();
  });
  await page.waitForFunction(()=>{
   const c=document.querySelector('#char-preview-canvas');
   return c?.dataset.highflyPreviewVisual==='player_warrior_modular' && +(c?.dataset.highflyPreviewFrame||0)>0;
  },null,{timeout:30000});
  const gender=await page.evaluate(()=>{
   document.querySelector('#offline-appearance .ac-tab')?.click();
   const choices=[...document.querySelectorAll('#offline-appearance .ac-seg .ac-seg-btn')];
   if(choices.length>=2)choices[1].click();
   return choices.map(x=>({text:x.textContent?.trim(),pressed:x.getAttribute('aria-pressed')}));
  });
  assert.equal(gender.length>=2,true,'Original gender control absent');
  assert.equal(gender[1].pressed,'true','Female body not selected by original creator');
  await page.waitForFunction(()=>{
   const c=document.querySelector('#char-preview-canvas'),start=document.querySelector('#btn-start-offline');
   return c?.dataset.highflyPreviewVisual==='player_warrior_modular' && +(c?.dataset.highflyPreviewFrame||0)>0 && start && !start.disabled;
  },null,{timeout:45000});
  report.entryReady=await page.evaluate(()=>({
   name:document.querySelector('#char-name')?.value||null,
   visual:document.querySelector('#char-preview-canvas')?.dataset.highflyPreviewVisual||null,
   frame:+(document.querySelector('#char-preview-canvas')?.dataset.highflyPreviewFrame||0),
   startDisabled:document.querySelector('#btn-start-offline')?.disabled??null
  }));
  assert.equal(report.entryReady.name,report.intendedName);
  await page.locator('#offline-preview-container').screenshot({path:path.join(root,'warrior-female-frozen-creator.png')});
  await page.evaluate(()=>document.querySelector('#btn-start-offline')?.click());
  const gate=await page.waitForFunction(()=>{
    if(window.__game?.sim?.player)return 'world';
    const el=document.querySelector('#mobile-preflight-continue');
    if(el && getComputedStyle(el).display!=='none' && getComputedStyle(el).visibility!=='hidden' && el.getBoundingClientRect().width>0)return 'preflight';
    if(document.querySelector('#loading-screen')?.classList.contains('visible'))return 'loading';
    return false;
  },null,{timeout:40000});
  report.entryGate=await gate.jsonValue();
  if(report.entryGate==='preflight'){
    await page.evaluate(()=>document.querySelector('#mobile-preflight-continue')?.click());
  }
  await page.waitForFunction(()=>Boolean(window.__game?.sim?.player),null,{timeout:125000});
  await page.waitForTimeout(2000);
  report.world=await page.evaluate(()=>{
   const g=window.__game,p=g?.sim?.player;
   return {name:p?.name||null,level:p?.level??null,playerCls:p?.cls??null,configClass:g?.sim?.cfg?.playerClass??null,
    rendererReady:!!g?.renderer,gameCanvasReady:document.querySelector('#game-canvas')?.width>10,
    playerKeys:Object.keys(p||{}).filter(x=>/class|cls|name|appear|skin|look/i.test(x)).slice(0,35),
    simKeys:Object.keys(g?.sim||{}).filter(x=>/cfg|config|player|look|appear/i.test(x)).slice(0,35)};
  });
  report.runtimeGameLoaded=!!report.world.rendererReady;
  report.playerIdentityVerified=report.world.name===report.intendedName && (report.world.configClass==='warrior'||report.world.playerCls==='warrior');
  await page.screenshot({path:path.join(root,'warrior-female-frozen-world.png'),fullPage:true});
  assert(report.runtimeGameLoaded&&report.world.gameCanvasReady,'Game world or renderer missing');
  assert(report.playerIdentityVerified,'Actual PF6 Warrior identity not proven: '+JSON.stringify(report.world));
  assert(!report.asset404.length,'Static game assets missing '+report.asset404.join(';'));
  console.log('SKIN3_PF6_WARRIOR_FEMALE_ACTUAL_WORLD_GREEN=1 '+JSON.stringify({name:report.world.name,cls:report.world.configClass||report.world.playerCls,api404:report.API404.length,assets404:report.asset404.length}));
 }catch(e){
  report.failure=String(e.stack||e);
  if(page){
   report.failureState=await page.evaluate(()=>({name:document.querySelector('#char-name')?.value||'',visible:document.querySelector('#offline-select')?.hidden,
    startDisabled:document.querySelector('#btn-start-offline')?.disabled??null,preview:document.querySelector('#char-preview-canvas')?.dataset.highflyPreviewVisual||null,
    activeClass:document.querySelector('#offline-select .mini-class.sel')?.getAttribute('data-class')||null,
    gameExists:!!window.__game?.sim?.player,bodyText:document.body.innerText.slice(0,1300)})).catch(()=>null);
   await page.screenshot({path:path.join(root,'FAILED-screen.png'),fullPage:true,timeout:20000}).catch(()=>{});
  }
  console.error('SKIN3_PF6_WORLD_ENTRY_FAILED',report.failure,JSON.stringify(report.failureState));
  throw e;
 }finally{
  fs.writeFileSync(path.join(root,'actual-world-identity.json'),JSON.stringify(report,null,2));
  await browser.close();
 }
}
main().catch(()=>process.exit(1));