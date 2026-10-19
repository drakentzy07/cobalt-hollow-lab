/** HIGHFLY F1 — browser integration on Android S23 landscape emulation.
 * This is NOT a physical-device performance certification.
 */
import fs from 'node:fs';
import puppeteer from 'puppeteer-core';
import { BROWSER_PATH } from './browser_path.mjs';

const BASE=process.env.F1_GAME_URL??'http://127.0.0.1:4173/';
const OUT='foundation-output';
fs.mkdirSync(OUT,{recursive:true});
const browser=await puppeteer.launch({
  executablePath:BROWSER_PATH,
  headless:'new',
  protocolTimeout:240_000,
  args:[
    '--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage',
    '--window-size=844,390',
    '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader',
  ],
  defaultViewport:{width:844,height:390,isMobile:true,hasTouch:true,deviceScaleFactor:1},
});
const page=await browser.newPage();
page.on('pageerror',e=>console.log('F1_PAGE_ERROR',e.message));
page.on('console',m=>{if(m.type()==='error')console.log('F1_BROWSER_CONSOLE_ERROR',m.text().slice(0,450));});
const report={url:BASE,browser:'Chrome S23 viewport emulation (not physical device)'};
try {
  await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:120_000});
  await page.evaluate(()=>localStorage.clear());
  await page.reload({waitUntil:'domcontentloaded',timeout:120_000});
  await page.waitForSelector('#btn-play',{timeout:90_000});
  await page.evaluate(()=>document.getElementById('btn-play')?.click());
  await page.waitForFunction(()=>{const e=document.getElementById('offline-select');return e&&!e.hidden;},{timeout:60_000});
  // The renderer creates the modular editor only AFTER an asynchronous
  // IndexedDB primary-slot lookup and its class-detail mount. A visible panel
  // is NOT proof the editor is mounted; sample neither in the same tick.
  await page.waitForFunction(
    ()=>!!document.querySelector('#offline-appearance .appearance-customizer'),
    {timeout:65_000,polling:250},
  ).catch(async(error)=>{
    const diag=await page.evaluate(()=>({
      panel:document.getElementById('offline-select')?.hidden,
      editorHtml:document.getElementById('offline-appearance')?.innerHTML?.slice(0,800),
      button:document.querySelector('#offline-select .mini-class')?.outerHTML,
    }));
    throw new Error('F1_EDITOR_MOUNT_TIMEOUT '+JSON.stringify(diag)+' '+error.message);
  });
  const creator=await page.evaluate(()=>{
    const panel=document.getElementById('offline-select');
    const cards=panel?.querySelectorAll('.mini-class');
    const hiddenCards=[...(cards??[])].every(el=>getComputedStyle(el).display==='none'||el.closest('[hidden]')!==null);
    return {
      classCards:cards?.length??0,
      classPickerHidden:hiddenCards,
      femaleMaleEditor:!!panel?.querySelector('#offline-appearance .appearance-customizer'),
      title:panel?.querySelector('h2')?.textContent?.trim(),
    };
  });
  report.creator=creator;
  if(creator.classCards!==1||!creator.classPickerHidden||!creator.femaleMaleEditor){
    throw Error('F1_CREATOR_NOT_CLASSLESS '+JSON.stringify(creator));
  }
  await page.screenshot({path:OUT+'/f1-creator-android.png'});
  await page.evaluate(()=>{
    localStorage.setItem('woc.cameraModePrompt.shown','1');
    const el=document.getElementById('char-name');
    el.value='Wayfarer';
    el.dispatchEvent(new Event('input',{bubbles:true}));
    document.getElementById('btn-start-offline')?.click();
  });
  await page.waitForSelector('#mobile-preflight-continue',{visible:true,timeout:20000})
    .then(()=>page.evaluate(()=>document.getElementById('mobile-preflight-continue')?.click()))
    .catch(()=>{});
  await page.waitForFunction(()=>window.__game?.sim?.player,{timeout:180_000});
  await page.waitForSelector('#hf-origin-f1-hud',{timeout:35000});
  const initial=await page.evaluate(()=>{
    const sim=window.__game.sim;
    const meta=sim.players.get(sim.playerId);
    return {
      playerCount:sim.players.size,
      name:meta?.name,
      position:{x:sim.player.pos.x,z:sim.player.pos.z},
      equipment:{...meta?.equipment},
      tutorialGreeting:!!meta?.tutorialGreetingSent,
      guidePresent:[...sim.entities.values()].some(e=>e.kind==='npc'&&e.templateId==='hf_origin_wayfarer'),
      resourceHud:!!document.getElementById('hf-origin-f1-hud'),
    };
  });
  report.firstWorld=initial;
  if(initial.playerCount!==1||initial.name!=='Wayfarer')throw Error('F1_DUPLICATE_OR_WRONG_HUNTER');
  if(initial.equipment.mainhand||initial.equipment.offhand||initial.equipment.chest)throw Error('F1_NOT_UNARMED '+JSON.stringify(initial.equipment));
  if(initial.position.x < -180)throw Error('F1_TELEPORTED_TO_TUTORIAL_ISLAND');
  if(!initial.guidePresent||!initial.resourceHud)throw Error('F1_GUIDE_OR_RESOURCE_MISSING');
  await page.screenshot({path:OUT+'/f1-birth-android.png'});
  await page.waitForFunction(()=>{
    const guide=document.getElementById('hf-origin-f1-guide');
    return guide&&getComputedStyle(guide).display!=='none';
  },{timeout:15000});
  await page.evaluate(()=>{
    document.querySelector('#hf-origin-f1-guide button')?.click();
    document.querySelector('#hf-origin-f1-guide div:nth-of-type(2) button')?.click();
  });
  await page.waitForFunction(()=>window.__game.sim.players.get(window.__game.sim.playerId)?.equipment.mainhand==='worn_sword',{timeout:13000});
  const granted=await page.evaluate(()=>{
    const raw=localStorage.getItem('highfly.offline.primary.v1');
    const slot=raw?JSON.parse(raw):null;
    return {
      weapon:window.__game.sim.players.get(window.__game.sim.playerId)?.equipment.mainhand,
      saved:slot?.originF1?.starterClaimed,
      savedWeapon:slot?.originF1?.starterWeaponId,
      savedName:slot?.name,
    };
  });
  report.starter=granted;
  if(granted.weapon!=='worn_sword'||!granted.saved||granted.savedWeapon!=='worn_sword')throw Error('F1_STARTER_NOT_PERSISTED');
  await page.screenshot({path:OUT+'/f1-first-weapon-android.png'});
  fs.writeFileSync(OUT+'/f1-browser-report.json',JSON.stringify(report,null,2)+'\n');
  console.log('HIGHFLY_F1_ANDROID_BROWSER_INTERACTION_GREEN=1',JSON.stringify(report));
} finally {
  await browser.close();
}
