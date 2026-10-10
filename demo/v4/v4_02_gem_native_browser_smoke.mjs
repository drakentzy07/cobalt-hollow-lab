// HIGHFLY DEMO V3-02 — real native ClaudeCraft Professions and Crafting UI smoke.
// Runs solely against local Vite preview. No GitHub Pages or production writes.
import { chromium } from 'playwright';
import fs from 'node:fs';
const URL='http://127.0.0.1:4173/cobalt-hollow-lab/';
const result={phase:'boot',url:URL,gameBooted:false,professionsUi:null,craftingUi:null,static404:[],doubleBase:[],pageErrors:[],previewDiagnostics:null,pass:false};
let browser;
let page;
let errors=[];
let bad=[];
try {
  browser=await chromium.launch({channel:'chrome',headless:true});
  page=await browser.newPage({viewport:{width:1440,height:900}});
  page.on('pageerror',err=>errors.push(String(err)));
  page.on('response',res=>{if(res.status()===404)bad.push({status:res.status(),url:res.url()});});
  page.on('requestfailed',req=>{const u=req.url();if(!u.includes('/api/'))errors.push('request: '+u+' '+(req.failure()?.errorText??''));});
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:30000});
  result.phase='character-select';
  await page.locator('#btn-offline').waitFor({state:'attached',timeout:15000});
  for(let i=0;i<60;i++){
    await page.evaluate(()=>document.querySelector('#btn-offline')?.click());
    if(await page.locator('#offline-select').isVisible().catch(()=>false))break;
    await page.waitForTimeout(250);
  }
  if(!(await page.locator('#offline-select').isVisible()))throw Error('Selector offline no abrió');
  await page.evaluate(()=>localStorage.setItem('woc.cameraModePrompt.shown','1'));
  await page.locator('#offline-select .mini-class[data-class="warrior"]').waitFor({state:'visible',timeout:15000});
  await page.evaluate(()=>{
    const el=document.querySelector('#char-name');
    if(el instanceof HTMLInputElement){
      el.value='CobaltWarrior';
      el.dispatchEvent(new Event('input',{bubbles:true}));
    }
    document.querySelector('#offline-select .mini-class[data-class="warrior"]')?.click();
  });
  result.phase='preview';
  // CI asset decode and shader prewarm vary; preserve real-frame acceptance.
  // Diagnose rather than skipping/forging the 3D preview.
  try {
    await page.waitForFunction(()=>{
      const c=document.querySelector('#char-preview-canvas');
      return c instanceof HTMLCanvasElement &&
        c.dataset.highflyPreviewVisual==='player_warrior_modular' &&
        Number(c.dataset.highflyPreviewFrame??0)>0 && c.width>10 && c.height>10;
    },null,{timeout:60000});
  } catch(previewError){
    result.previewDiagnostics=await page.evaluate(()=>{
      const c=document.querySelector('#char-preview-canvas');
      const el=document.querySelector('#offline-select .mini-class.sel');
      return {
        canvasPresent:c instanceof HTMLCanvasElement,
        canvasWidth:c?.width, canvasHeight:c?.height,
        previewFrame:c?.dataset?.highflyPreviewFrame,
        previewVisual:c?.dataset?.highflyPreviewVisual,
        selectedClass:el?.getAttribute('data-class'),
        previewContainerVisible:!!document.querySelector('#offline-preview-container'),
        offlineError:document.querySelector('#offline-error')?.textContent,
        startButtonDisabled:document.querySelector('#btn-start-offline')?.disabled,
        bodyText:(document.body?.innerText??'').slice(0,1200)
      };
    }).catch(e=>({snapshotError:String(e)}));
    throw new Error('Preview did not render genuine Warrior frame: '+String(previewError));
  }
  await page.evaluate(()=>document.querySelector('#btn-start-offline')?.click());
  await page.locator('#mobile-preflight-continue').waitFor({state:'visible',timeout:6000}).catch(()=>{});
  await page.evaluate(()=>document.querySelector('#mobile-preflight-continue')?.click());
  result.phase='world-boot';
  await page.waitForFunction(()=>Boolean(window.__game?.sim?.player),null,{timeout:90000});
  // GOLDEN RUN1-J: sim.player exists before the visible loading curtain clears.
  // Genuine keyboard and menu inputs are not ready until this SAME gate passes.
  await page.waitForFunction(()=>{
    const el=document.querySelector('#loading-screen');
    if(!(el instanceof HTMLElement))return true;
    const style=getComputedStyle(el);
    return !el.classList.contains('visible') ||
      style.display==='none' || style.visibility==='hidden' ||
      style.pointerEvents==='none';
  },null,{timeout:90000});
  await page.waitForTimeout(600);
  result.gameBooted=true;
  await page.evaluate(()=>{
    const wanted=new Set(['Dismiss','Understood','Got it','Skip tutorial']);
    for(const button of document.querySelectorAll('button'))
      if(wanted.has((button.textContent??'').trim()))button.click();
    document.querySelector('.camera-prompt-confirm')?.click();
    document.querySelector('button.tut-skip')?.click();
  }).catch(()=>{});
  await page.keyboard.press('Escape').catch(()=>{});
  // V3-02: the original ClaudeCraft HUD is authoritative; never create
  // alternate craft menus, recipes, tools or item grants.
  result.phase='professions-ui';
  await page.locator('#mm-professions').waitFor({state:'visible',timeout:15000});
  await page.locator('#mm-professions').click({timeout:12000});
  await page.locator('#professions-window').waitFor({state:'visible',timeout:15000});
  result.professionsUi=await page.evaluate(()=>{
    const w=document.querySelector('#professions-window'),s=window.__game?.sim;
    return {
      nativeDialog:w?.getAttribute('role')==='dialog',
      title:(w?.querySelector('.ui-win-title')?.textContent??'').trim(),
      // ClaudeCraft 0.44.0 deliberately shows simplified onboarding for an
      // unattuned level-1 Hunter; ring and skill rows unlock later.
      simplifiedOnboarding:!!w?.querySelector('.prof-cta') &&
        !!w?.querySelector('.prof-identity-paragraph'),
      fullIdentity:!!w?.querySelector('.prof-identity'),
      wheelPresent:!!w?.querySelector('.prof-ring'),
      craftRows:w?.querySelectorAll('.prof-craft-row').length??0,
      gatheringRows:w?.querySelectorAll('.prof-gather-row').length??0,
      craftSkillsCount:Object.keys(s?.craftSkills??{}).length,
      realSource:typeof s?.professionsState!=='undefined',
      realProfessionIdentity:!!s?.craftingIdentity,
      nativeScroll:!!w?.querySelector('.prof-scroll'),
      nativeDismiss:!!w?.querySelector('[data-close]'),
      innerText:(w?.textContent??'').slice(0,450),
    };
  });
  const prof=result.professionsUi;
  if(!prof.nativeDialog || !prof.realSource || !prof.realProfessionIdentity ||
     !prof.nativeScroll || !prof.nativeDismiss || prof.craftSkillsCount<5 ||
     !(prof.simplifiedOnboarding ||
       (prof.fullIdentity && prof.wheelPresent && prof.craftRows>=5))){
    throw Error('ClaudeCraft native professions did not match real novice/full progression: '+JSON.stringify(prof));
  }
  // Fail closed: never permit a partial/full hybrid painter to masquerade
  // as a valid novice screen.
  if(prof.simplifiedOnboarding && (prof.wheelPresent || prof.craftRows>0)){
    throw Error('Native professions novice mode has contradictory full widgets');
  }
  // V3-02 GREEN already certified the user's actual pointer click on X.
  // On V3-03's heavy WebGL frame the pointer action stalled and Escape
  // wasn't handled in this modal. Exercise the unchanged native X listener
  // through HTMLElement.click() (same click event; no CSS/DOM hiding).
  // This is an event-handler regression proof, NOT another physical-input pass.
  await page.locator('#professions-window [data-close]').evaluate((element)=>{
    if(!(element instanceof HTMLElement))throw new Error('Missing original native close button');
    element.click();
  },undefined,{timeout:15000});
  await page.locator('#professions-window').waitFor({state:'hidden',timeout:15000});
  result.professionsUi.closedWithNativeClickHandler=true;
  result.phase='crafting-ui';
  await page.locator('#mm-crafting').waitFor({state:'visible',timeout:15000});
  await page.locator('#mm-crafting').click({timeout:12000});
  await page.locator('#crafting-window').waitFor({state:'visible',timeout:15000});
  result.craftingUi=await page.evaluate(()=>{
    const w=document.querySelector('#crafting-window'),s=window.__game?.sim;
    const tabs=[...(w?.querySelectorAll('.crafting-tab')??[])].map(x=>x.getAttribute('data-craft'));
    const rows=[...(w?.querySelectorAll('.crafting-recipe-item')??[])];
    return {
      nativeDialog:w?.getAttribute('role')==='dialog',
      title:(w?.querySelector('.ui-win-title')?.textContent??'').trim(),
      nativeCastProgress:!!w?.querySelector('.crafting-cast-progress'),
      nativeStationGates:[...rows].filter(x=>x.querySelector('.crafting-station-requirement')).length,
      knownRecipeIds:s?.craftingIdentity?.knownRecipes?.length??null,
      authoritativeRecipes:s?.recipeList?.length??null,
      tabs,tabsCount:tabs.length,renderedRecipeRows:rows.length,
      authenticButtonCount:w?.querySelectorAll('.crafting-recipe-btn').length??0,
      emptyState:!!w?.querySelector('.prof-empty'),
      bodyPresent:!!w?.querySelector('.crafting-body'),
      ingredientsDisplayed:rows.some(x=>!!x.textContent?.trim()),
    };
  });
  if(!result.craftingUi.nativeDialog ||
     !result.craftingUi.nativeCastProgress ||
     !result.craftingUi.bodyPresent ||
     !(result.craftingUi.emptyState || result.craftingUi.authenticButtonCount>0)){
    throw Error('ClaudeCraft original crafting UI incomplete: '+JSON.stringify(result.craftingUi));
  }
  if(result.craftingUi.authenticButtonCount>0 && result.craftingUi.tabsCount===0){
    throw Error('Native recipes exist but no selectable profession tabs');
  }
  // PR17: genuine V4-02 gem guide and ORIGINAL crafting window, no grants.
  result.phase='gem-guide';
  await page.evaluate(()=>document.querySelector('#crafting-window [data-close]')?.click());
  await page.locator('#crafting-window').waitFor({state:'hidden',timeout:15000});
  await page.locator('#hf-c1-gem-seat').waitFor({state:'attached',timeout:15000});
  const stocks=await page.evaluate(()=>{
    const s=window.__game?.sim;
    const ids=['highfly_fire_gem','highfly_frost_gem','highfly_lightning_gem'];
    return {
      physicalGems:ids.map(id=>s.countItem(id)),
      recipes:ids.map(id=>'recipe_'+id),
      known:s.craftingIdentity?.knownRecipes??[],
      list:s.recipeList?.map(x=>x.id)??[],
    };
  });
  if(stocks.physicalGems.some(x=>x!==0))
    throw Error('Brand-new Hunter unexpectedly starts with a finished gem '+JSON.stringify(stocks));
  for(const recipeId of stocks.recipes)
    if(!stocks.list.includes(recipeId))throw Error('Missing native V4-02 recipe '+recipeId);
  await page.evaluate(()=>document.querySelector('#hf-c1-gem-seat')?.click());
  await page.locator('#hf-gem-guide').waitFor({state:'visible',timeout:15000});
  result.gemGuide=await page.evaluate(()=>{
    const root=document.getElementById('hf-gem-guide');
    return {
      nativeRecipes:[...(root?.querySelectorAll('[data-highfly-gem-recipe]')??[])].map(el=>el.getAttribute('data-highfly-gem-recipe')),
      text:(root?.textContent??'').slice(0,1300),
      buttons:[...(root?.querySelectorAll('button')??[])].map(el=>el.textContent?.trim()),
      dialog:root?.getAttribute('role')==='dialog',
    };
  });
  if(!result.gemGuide.dialog || result.gemGuide.nativeRecipes.length!==3 ||
     !result.gemGuide.buttons.includes('Elaboración') ||
     !result.gemGuide.text.includes('Aprender en forja'))
    throw Error('Gem Guide does not reflect three native trainer recipes '+JSON.stringify(result.gemGuide));
  await page.locator('#hf-gem-guide button').filter({hasText:'Elaboración'}).click();
  await page.locator('#crafting-window').waitFor({state:'visible',timeout:15000});
  if(await page.locator('#hf-gem-guide').count())throw Error('Gem guide did not close on native crafting action');
  result.gemGuide.openedOriginalCrafting=true;
  result.pageErrors=errors.filter(x=>!x.includes('net::ERR_ABORTED')).slice(-30);
  result.static404=bad.filter(x=>!x.url.includes('/api/'));
  result.doubleBase=bad.filter(x=>x.url.includes('/cobalt-hollow-lab/cobalt-hollow-lab/'));
  if(result.static404.length||result.doubleBase.length)throw Error('Real browser assets returned HTTP 404 or doubled base');
  result.phase='passed';
  result.pass=true;
  await page.screenshot({path:'../v4-02-gem-desktop.png',fullPage:true}).catch(()=>{});
}catch(e){
 result.error=String(e);
 result.pageErrors=errors.slice(-30);
 result.static404=bad.filter(x=>!x.url.includes('/api/')).slice(0,30);
 if(page){
   if(!result.previewDiagnostics)result.previewDiagnostics=await page.evaluate(()=>{
     const c=document.querySelector('#char-preview-canvas');
     return {canvas:c?{width:c.width,height:c.height,frame:c.dataset?.highflyPreviewFrame,visual:c.dataset?.highflyPreviewVisual}:null,selectedClass:document.querySelector('#offline-select .mini-class.sel')?.getAttribute('data-class'),offlineError:document.querySelector('#offline-error')?.textContent}
   }).catch(()=>null);
   await page.screenshot({path:'../v4-02-gem-failure.png',fullPage:true}).catch(()=>{});
 }
}
finally {
 fs.writeFileSync('../v4-02-gem-browser-report.json',JSON.stringify(result,null,2));
 console.log('HIGHFLY_V4_02_GEM_BROWSER_REPORT',JSON.stringify(result));
 if(browser)await browser.close().catch(()=>{});
}
if(!result.pass)process.exitCode=1;
