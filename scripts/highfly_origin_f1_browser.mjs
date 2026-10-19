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
const failedRequests=[];
const pageErrors=[];
let phase='boot';
const report={url:BASE,browser:'Chrome S23 viewport emulation (not physical device)',phases:[],failedRequests,pageErrors};
const checkpoint=(next)=>{phase=next;report.phases.push({name:next,at:new Date().toISOString()});console.log('F1_CHECKPOINT',next);};
page.on('pageerror',e=>{const detail={phase,message:e.message,stack:e.stack?.slice(0,1600)};pageErrors.push(detail);console.log('F1_PAGE_ERROR',JSON.stringify(detail));});
page.on('console',m=>{if(m.type()==='error')console.log('F1_BROWSER_CONSOLE_ERROR',m.text().slice(0,450));});
page.on('requestfailed',req=>{const detail={phase,url:req.url(),error:req.failure()?.errorText??'unknown'};failedRequests.push(detail);console.log('F1_REQUEST_FAILED',JSON.stringify(detail));});
page.on('response',res=>{
  if(res.status()<400)return;
  const detail={phase,url:res.url(),status:res.status()};
  failedRequests.push(detail);
  console.log('F1_HTTP_ERROR',JSON.stringify(detail));
});
// Simulate connectivity being OFF while bundled assets remain reachable on localhost.
// The offline game must not require Turnstile, CDN fonts, analytics or a realm.
await page.setRequestInterception(true);
const ownOrigin=new URL(BASE).origin;
page.on('request',req=>{
  const url=req.url();
  if(url.startsWith('data:')||url.startsWith('blob:')||new URL(url).origin===ownOrigin)void req.continue();
  else {console.log('F1_OPTIONAL_REMOTE_BLOCKED',url.slice(0,220));void req.abort();}
});
try {
  checkpoint('launcher');
  await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:120_000});
  await page.evaluate(()=>localStorage.clear());
  await page.reload({waitUntil:'domcontentloaded',timeout:120_000});
  await page.waitForSelector('#btn-play',{timeout:90_000});
  checkpoint('launcher-ready');
  await page.evaluate(()=>document.getElementById('btn-play')?.click());
  await page.waitForFunction(()=>{const e=document.getElementById('offline-select');return e&&!e.hidden;},{timeout:60_000});
  checkpoint('creator-panel');
  // The renderer creates the modular editor only AFTER an asynchronous
  // IndexedDB primary-slot lookup and its class-detail mount. A visible panel
  // is NOT proof the editor is mounted; sample neither in the same tick.
  await page.waitForFunction(
    ()=>!!document.querySelector('#offline-appearance.appearance-customizer'),
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
      femaleMaleEditor:!!panel?.querySelector('#offline-appearance.appearance-customizer'),
      title:panel?.querySelector('h2')?.textContent?.trim(),
    };
  });
  report.creator=creator;
  if(creator.classCards!==1||!creator.classPickerHidden||!creator.femaleMaleEditor){
    throw Error('F1_CREATOR_NOT_CLASSLESS '+JSON.stringify(creator));
  }
  checkpoint('creator-ready');
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
  checkpoint('enter-world');
  await page.waitForFunction(()=>window.__game?.sim?.player,{timeout:180_000});
  checkpoint('world-sim-and-renderer-ready');
  await page.waitForSelector('#hf-origin-f1-hud',{timeout:35000});
  checkpoint('world-hud-ready');
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
  checkpoint('starter-npc');
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
  checkpoint('starter-verified');
  if (process.env.F11_VERIFY_RELOAD === '1') {
    // F1.1: certify the actual player state survives two new browser entries,
    // with the second one having no network access at all.
    await page.waitForFunction(()=>navigator.serviceWorker?.controller,{timeout:120_000});
    checkpoint('offline-worker-controlling');
    await page.reload({waitUntil:'domcontentloaded',timeout:120_000});
    checkpoint('restart-online');
    await page.waitForSelector('#btn-play',{timeout:90_000});
    await page.evaluate(()=>document.getElementById('btn-play')?.click());
    await page.waitForFunction(()=>document.getElementById('char-name')?.value==='Wayfarer',{timeout:40_000});
    await page.evaluate(()=>document.getElementById('btn-start-offline')?.click());
    await page.waitForFunction(()=>window.__game?.sim?.player,{timeout:180_000});
    await page.waitForSelector('#hf-origin-f1-hud',{timeout:35000});
    const resumed=await page.evaluate(()=>{
      const sim=window.__game.sim;
      const meta=sim.players.get(sim.playerId);
      return {
        count:sim.players.size,
        name:meta?.name,
        mainhand:meta?.equipment.mainhand,
        claimed:JSON.parse(localStorage.getItem('highfly.offline.primary.v1')??'{}')?.originF1?.starterClaimed,
        npcOffersAgain:getComputedStyle(document.getElementById('hf-origin-f1-guide')).display!=='none',
      };
    });
    report.resumed=resumed;
    if(resumed.count!==1||resumed.name!=='Wayfarer'||resumed.mainhand!=='worn_sword'||!resumed.claimed||resumed.npcOffersAgain)
      throw Error('F11_RESUME_HUNTER_REGRESSION '+JSON.stringify(resumed));
    await page.screenshot({path:OUT+'/f11-resumed-online-android.png'});
    checkpoint('save-recovery-verified');

    // Keep the HTTP server running, but force Chrome itself offline. Only
    // ServiceWorker CacheStorage can satisfy the next navigation and modules.
    await page.setOfflineMode(true);
    await page.reload({waitUntil:'domcontentloaded',timeout:120_000});
    checkpoint('restart-no-network');
    await page.waitForSelector('#btn-play',{timeout:90_000});
    await page.evaluate(()=>document.getElementById('btn-play')?.click());
    await page.waitForFunction(()=>document.getElementById('char-name')?.value==='Wayfarer',{timeout:40_000});
    await page.evaluate(()=>document.getElementById('btn-start-offline')?.click());
    await page.waitForFunction(()=>window.__game?.sim?.player,{timeout:180_000});
    await page.waitForSelector('#hf-origin-f1-hud',{timeout:35000});
    const offline=await page.evaluate(()=>{
      const sim=window.__game.sim;
      const meta=sim.players.get(sim.playerId);
      return {name:meta?.name,count:sim.players.size,mainhand:meta?.equipment.mainhand,
        serviceWorker:!!navigator.serviceWorker?.controller,
        navigatorOffline:!navigator.onLine};
    });
    report.offline=offline;
    if(offline.name!=='Wayfarer'||offline.count!==1||offline.mainhand!=='worn_sword'||
        !offline.serviceWorker||!offline.navigatorOffline)
      throw Error('F11_TRUE_OFFLINE_WORLD_FAILURE '+JSON.stringify(offline));
    await page.screenshot({path:OUT+'/f11-offline-restored-android.png'});
    checkpoint('offline-world-verified');
    const legacyApiCalls=failedRequests.filter(q=>
      /\\/api\\/(?:site-presence|project-stats)/.test(q.url));
    if(legacyApiCalls.length)throw Error('F11_DONOR_API_DEPENDENCY '+JSON.stringify(legacyApiCalls));
    console.log('HIGHFLY_F11_ANDROID_OFFLINE_RESTORE_GREEN=1',JSON.stringify(offline));
  }
  fs.writeFileSync(OUT+'/f1-browser-report.json',JSON.stringify(report,null,2)+'\\n');
  console.log('HIGHFLY_F1_ANDROID_BROWSER_INTERACTION_GREEN=1',JSON.stringify(report));
} catch(error) {
  report.error={phase,message:String(error),stack:error?.stack?.slice(0,3500)};
  try {
    report.browserState=await page.evaluate(()=>({
      href:location.href,
      bodyClass:document.body.className,
      readyState:document.readyState,
      loadingStatus:document.getElementById('ls-status')?.textContent,
      loadingPercent:document.getElementById('ls-fill')?.style.width,
      loadingVisible:document.getElementById('loading-screen')?.className,
      fatal:document.querySelector('#fatal-overlay,.fatal-overlay')?.textContent?.slice(0,700),
      preflightVisible:document.getElementById('mobile-preflight')?.classList.contains('visible'),
      gameActive:document.body.classList.contains('game-active'),
      gameReady:!!window.__game?.sim?.player,
      resourceCount:performance.getEntriesByType('resource').length,
    }));
    await page.screenshot({path:OUT+'/f1-failure-android.png'});
  } catch (diagError) {report.diagnosticFailure=String(diagError);}
  fs.writeFileSync(OUT+'/f1-browser-report.json',JSON.stringify(report,null,2)+'\\n');
  console.error('F1_DIAGNOSTIC_FAILURE',JSON.stringify(report).slice(0,24000));
  throw error;
} finally {
  await browser.close();
}
