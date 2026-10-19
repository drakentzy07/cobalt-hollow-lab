// HIGHFLY F2 BETA — viewport smoke against the Pages lab path.
// Deliberately does NOT claim offline capability; F1's root SW is untouched.
import puppeteer from 'puppeteer-core';
import { BROWSER_PATH } from './browser_path.mjs';

const BASE = process.env.F2_BETA_URL ?? 'http://127.0.0.1:4173/cobalt-hollow-lab/lab/f2-combat-beta/';
const betaKey = 'highfly.origin.f2-combat-beta.primary.v1';
const rootKey = 'highfly.origin.primary.v1';
const browser = await puppeteer.launch({
  executablePath:BROWSER_PATH,headless:'new',protocolTimeout:240000,
  args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage',
        '--window-size=844,390','--use-gl=angle','--use-angle=swiftshader',
        '--enable-unsafe-swiftshader'],
  defaultViewport:{width:844,height:390,isMobile:true,hasTouch:true,deviceScaleFactor:1}
});
const page=await browser.newPage();
page.on('pageerror',e=>console.log('F2_BETA_PAGE_ERROR',e.message));
try {
  await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:120000});
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('highfly.origin.primary.v1','F1_SAVE_MUST_SURVIVE');
    localStorage.setItem('woc.cameraModePrompt.shown','1');
  });
  await page.reload({waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForSelector('#btn-play',{timeout:90000});
  await page.evaluate(()=>document.getElementById('btn-play')?.click());
  await page.waitForFunction(()=>!!document.querySelector('#offline-appearance.appearance-customizer'),{timeout:65000});
  const before=await page.evaluate(()=>({
    name:document.getElementById('char-name')?.value,
    hasRootSentinel:localStorage.getItem('highfly.origin.primary.v1')==='F1_SAVE_MUST_SURVIVE',
    betaSave:localStorage.getItem('highfly.origin.f2-combat-beta.primary.v1')
  }));
  if(before.name||!before.hasRootSentinel||before.betaSave)throw Error('F2_BETA_INHERITED_F1_DATA '+JSON.stringify(before));
  await page.evaluate(()=>{
    document.getElementById('char-name').value='Wayfarer';
    document.getElementById('char-name').dispatchEvent(new Event('input',{bubbles:true}));
    document.getElementById('btn-start-offline')?.click();
  });
  await page.waitForSelector('#mobile-preflight-continue',{visible:true,timeout:20000})
    .then(()=>page.evaluate(()=>document.getElementById('mobile-preflight-continue')?.click())).catch(()=>{});
  await page.waitForFunction(()=>!!window.__game?.sim?.player,{timeout:180000});
  await page.waitForSelector('#hf-origin-f1-hud',{timeout:45000});
  await page.evaluate(()=>document.body.classList.remove('mobile-chrome-idle'));
  const state=await page.evaluate(()=>{
    const player=window.__game.sim.player;
    const meta=window.__game.sim.players.get(window.__game.sim.playerId);
    const atk=document.getElementById('mobile-action-attack')?.getBoundingClientRect();
    const slots=[...document.querySelectorAll('#mobile-action-ring .mobile-action-slot')];
    return {pos:{x:player.pos.x,z:player.pos.z},name:meta?.name,
      eq:meta?.equipment,atk:{x:atk?.x,y:atk?.y,w:atk?.width,h:atk?.height},
      slots:slots.filter(x=>x.getBoundingClientRect().width>=40).length,
      noRootChange:localStorage.getItem('highfly.origin.primary.v1')==='F1_SAVE_MUST_SURVIVE'};
  });
  if(state.name!=='Wayfarer'||state.eq?.mainhand||state.pos.x< -180||
     state.slots!==4||!state.atk.w||!state.noRootChange)throw Error('F2_BETA_ENTRY_HUD '+JSON.stringify(state));
  await page.touchscreen.tap(state.atk.x+state.atk.w/2,state.atk.y+state.atk.h/2);
  await page.waitForFunction(()=>Number(document.body.dataset.highflyBasicAttackCount||0)>0,{timeout:11000});
  const attack=await page.evaluate(()=>({
    combo:Number(document.body.dataset.highflyBasicAttackCount||0),
    animation:window.__game?.renderer?.abilityVfxAttackCount()||0,
    modal:document.getElementById('hf-origin-f1-modal-backdrop')?.style.display
  }));
  if(attack.combo<1||attack.animation<1||attack.modal!=='none')throw Error('F2_BETA_ATK_REGRESSION '+JSON.stringify(attack));
  await page.waitForFunction(()=>{
    const e=document.getElementById('hf-origin-f1-guide');return e&&getComputedStyle(e).display!=='none';
  },{timeout:18000});
  await page.evaluate(()=>document.getElementById('hf-origin-f1-open')?.click());
  await page.waitForFunction(()=>document.getElementById('hf-origin-f1-modal-backdrop')?.style.display==='flex',{timeout:15000});
  await page.evaluate(()=>document.querySelector('#hf-origin-f1-options [data-starter="worn_sword"]')?.click());
  await page.waitForFunction(()=>window.__game.sim.players.get(window.__game.sim.playerId)?.equipment.mainhand==='worn_sword',{timeout:15000});
  const saved=await page.evaluate(()=>({
    beta:JSON.parse(localStorage.getItem('highfly.origin.f2-combat-beta.primary.v1')??'null'),
    f1:localStorage.getItem('highfly.origin.primary.v1')
  }));
  if(saved.beta?.originF1?.starterWeaponId!=='worn_sword'||saved.f1!=='F1_SAVE_MUST_SURVIVE')
    throw Error('F2_BETA_SAVE_CROSSTALK '+JSON.stringify(saved));
  await page.reload({waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForSelector('#btn-play',{timeout:90000});
  await page.evaluate(()=>document.getElementById('btn-play')?.click());
  await page.waitForFunction(()=>document.getElementById('char-name')?.value==='Wayfarer',{timeout:60000});
  console.log('HIGHFLY_F2_PAGES_BETA_BROWSER_GREEN=1',JSON.stringify({
    url:BASE,attack,starter:'worn_sword',saveNamespace:betaKey,
    rootSaveIntact:saved.f1==='F1_SAVE_MUST_SURVIVE',resume:true,
    device:'Chrome 844x390 touch emulation; not physical S23',
    offline:'NOT TESTED / beta remains online-only'
  }));
}finally{await browser.close();}
