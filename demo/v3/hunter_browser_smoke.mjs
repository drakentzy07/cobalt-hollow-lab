// HIGHFLY DEMO V3-01 — real Playwright desktop gameplay smoke (read-only source).
// Runs solely against local Vite preview. No GitHub Pages or production writes.
import { chromium } from 'playwright';
import fs from 'node:fs';
const URL='http://127.0.0.1:4173/cobalt-hollow-lab/';
const result={phase:'boot',url:URL,gameBooted:false,trainingOpen:false,movementMeters:null,combatNearbyProbe:null,static404:[],doubleBase:[],pageErrors:[],previewDiagnostics:null,trainingDiagnostics:null,pass:false};
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
  result.phase='movement';
  const before=await page.evaluate(()=>({x:window.__game.sim.player.pos.x,z:window.__game.sim.player.pos.z}));
  await page.keyboard.down('w');
  await page.waitForTimeout(1800);
  await page.keyboard.up('w');
  await page.waitForTimeout(250);
  const after=await page.evaluate(()=>({x:window.__game.sim.player.pos.x,z:window.__game.sim.player.pos.z}));
  result.movementMeters=+Math.hypot(after.x-before.x,after.z-before.z).toFixed(3);
  if(result.movementMeters<=0.5)throw Error('Jugador no avanza usando W');
  result.phase='combat-availability';
  result.combatNearbyProbe=await page.evaluate(()=>{
    const g=window.__game,p=g.sim.player;
    const wolf=[...g.sim.entities.values()].find(e=>e.templateId==='forest_wolf'&&!e.dead);
    return {playerLevel:p.level,playerHp:p.hp,nearbyWolf:!!wolf,hasSimAttack:typeof g.sim.startAutoAttack==='function'};
  });
  if(!result.combatNearbyProbe.hasSimAttack)throw Error('Runtime carece de ataque básico');
  result.phase='training-ui';
  const trainButton=page.locator('#mm-training');
  await trainButton.waitFor({state:'visible',timeout:15000});
  // Real user path; retry only when the panel did not open.
  // No artificial .removeAttribute('hidden') or synthetic success signals.
  for(let attempt=1;attempt<=3;attempt++){
    if(await page.locator('#highfly-training-window').isVisible().catch(()=>false))break;
    await trainButton.click({timeout:10000});
    await page.waitForTimeout(800);
  }
  result.trainingDiagnostics=await page.evaluate(()=>{
    const win=document.querySelector('#highfly-training-window');
    const btn=document.querySelector('#mm-training');
    const loading=document.querySelector('#loading-screen');
    const computed=win instanceof HTMLElement?getComputedStyle(win):null;
    return {
      windowPresent:win instanceof HTMLElement,
      windowHiddenAttribute:win?.hasAttribute('hidden'),
      windowDisplay:computed?.display,
      windowVisibility:computed?.visibility,
      buttonExists:btn instanceof HTMLElement,
      buttonText:(btn?.textContent??'').trim().slice(0,100),
      buttonDisabled:btn instanceof HTMLButtonElement?btn.disabled:null,
      bodyClasses:document.body.className,
      loadingVisible:loading instanceof HTMLElement?loading.classList.contains('visible'):null,
      calibrationText:(win?.textContent??'').includes('CALIBRACIÓN DE FUERZA'),
    };
  });
  result.trainingOpen=await page.locator('#highfly-training-window').isVisible().catch(()=>false);
  if(!result.trainingOpen||!result.trainingDiagnostics?.calibrationText){
    throw Error('Training no abrió con clicks reales: '+JSON.stringify(result.trainingDiagnostics));
  }
  await page.locator('#highfly-training-close').click({timeout:10000});
  await page.locator('#highfly-training-window').waitFor({state:'hidden',timeout:10000});

  result.static404=bad.filter(x=>!x.url.includes('/api/'));
  result.doubleBase=bad.filter(x=>x.url.includes('/cobalt-hollow-lab/cobalt-hollow-lab/'));
  result.pageErrors=errors.slice(0,25);
  if(result.static404.length||result.doubleBase.length)throw Error('Assets 404 o duplicación de ruta base');
  result.pass=true;
  result.phase='passed';
  await page.screenshot({path:'../demo-v3-01-desktop.png',fullPage:true}).catch(()=>{});
}catch(e){
 result.error=String(e);
 result.pageErrors=errors.slice(-30);
 result.static404=bad.filter(x=>!x.url.includes('/api/')).slice(0,30);
 if(page){
   if(!result.previewDiagnostics)result.previewDiagnostics=await page.evaluate(()=>{
     const c=document.querySelector('#char-preview-canvas');
     return {canvas:c?{width:c.width,height:c.height,frame:c.dataset?.highflyPreviewFrame,visual:c.dataset?.highflyPreviewVisual}:null,selectedClass:document.querySelector('#offline-select .mini-class.sel')?.getAttribute('data-class'),offlineError:document.querySelector('#offline-error')?.textContent}
   }).catch(()=>null);
   await page.screenshot({path:'../demo-v3-01-failure.png',fullPage:true}).catch(()=>{});
 }
}
finally {
 fs.writeFileSync('../demo-v3-01-report.json',JSON.stringify(result,null,2));
 console.log('HIGHFLY_DEMO_V3_01_BROWSER_REPORT',JSON.stringify(result));
 if(browser)await browser.close().catch(()=>{});
}
if(!result.pass)process.exitCode=1;
