// HIGHFLY DEMO V3-01 — real Playwright desktop gameplay smoke (read-only source).
// Runs solely against local Vite preview. No GitHub Pages or production writes.
import { chromium } from 'playwright';
import fs from 'node:fs';
const URL='http://127.0.0.1:4173/cobalt-hollow-lab/';
const result={phase:'boot',url:URL,gameBooted:false,trainingOpen:false,movementMeters:null,combatNearbyProbe:null,static404:[],doubleBase:[],pageErrors:[],pass:false};
let browser;
try {
  browser=await chromium.launch({channel:'chrome',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[];
  const bad=[];
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
      el.value='HIGHFLY V3 Auditor';
      el.dispatchEvent(new Event('input',{bubbles:true}));
    }
    document.querySelector('#offline-select .mini-class[data-class="warrior"]')?.click();
  });
  result.phase='preview';
  await page.waitForFunction(()=>{
    const c=document.querySelector('#char-preview-canvas');
    return c instanceof HTMLCanvasElement &&
      c.dataset.highflyPreviewVisual==='player_warrior_modular' &&
      Number(c.dataset.highflyPreviewFrame??0)>0 && c.width>10 && c.height>10;
  },null,{timeout:25000});
  await page.evaluate(()=>document.querySelector('#btn-start-offline')?.click());
  await page.locator('#mobile-preflight-continue').waitFor({state:'visible',timeout:6000}).catch(()=>{});
  await page.evaluate(()=>document.querySelector('#mobile-preflight-continue')?.click());
  result.phase='world-boot';
  await page.waitForFunction(()=>Boolean(window.__game?.sim?.player),null,{timeout:90000});
  await page.waitForTimeout(2300);
  result.gameBooted=true;
  await page.evaluate(()=>{
    const wanted=new Set(['Dismiss','Understood','Got it','Skip tutorial']);
    for(const button of document.querySelectorAll('button'))
      if(wanted.has((button.textContent??'').trim()))button.click();
    document.querySelector('.camera-prompt-confirm')?.click();
    document.querySelector('button.tut-skip')?.click();
  }).catch(()=>{});
  await page.keyboard.press('Escape').catch(()=>{});
  result.phase='training-ui';
  await page.locator('#mm-training').waitFor({state:'visible',timeout:12000});
  await page.locator('#mm-training').click();
  await page.locator('#highfly-training-window').waitFor({state:'visible',timeout:12000});
  result.trainingOpen=await page.evaluate(()=>{
    const win=document.querySelector('#highfly-training-window');
    return win instanceof HTMLElement && !win.hasAttribute('hidden') &&
      (win.textContent??'').includes('CALIBRACIÓN DE FUERZA');
  });
  if(!result.trainingOpen)throw Error('Training Core no accesible desde menú real');
  await page.evaluate(()=>document.querySelector('#highfly-training-close')?.click());
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
  result.static404=bad.filter(x=>!x.url.includes('/api/'));
  result.doubleBase=bad.filter(x=>x.url.includes('/cobalt-hollow-lab/cobalt-hollow-lab/'));
  result.pageErrors=errors.slice(0,25);
  if(result.static404.length||result.doubleBase.length)throw Error('Assets 404 o duplicación de ruta base');
  result.pass=true;
  result.phase='passed';
  await page.screenshot({path:'../demo-v3-01-desktop.png',fullPage:true}).catch(()=>{});
}catch(e){result.error=String(e);}
finally {
 fs.writeFileSync('../demo-v3-01-report.json',JSON.stringify(result,null,2));
 console.log('HIGHFLY_DEMO_V3_01_BROWSER_REPORT',JSON.stringify(result));
 if(browser)await browser.close().catch(()=>{});
}
if(!result.pass)process.exitCode=1;
