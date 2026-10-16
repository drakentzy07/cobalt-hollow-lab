/**
 * R32 HONEST mobile boot gate. Unlike the inherited Warrior-only S23 smoke,
 * it clicks the ACTUAL HIGHFLY ORIGIN Hunter entry and reaches the native
 * world with four equipped buttons. A frozen CARGANDO MUNDO is a hard RED.
 * Simulated 844x390 Galaxy S23 Ultra; not physical-device certification.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const url='http://127.0.0.1:4173/cobalt-hollow-lab/';
const report={target:'HIGHFLY ORIGIN R32 Hunter',url,pass:false,phase:'init',
  errors:[],missing:[],diagnostics:null,expectedIds:['fireball','heroic_leap','blink','flamestrike']};
let browser,page;
const visible = async selector => page.locator(selector).isVisible().catch(()=>false);
try {
  browser=await chromium.launch({channel:'chrome',headless:true});
  const context=await browser.newContext({
    viewport:{width:844,height:390},screen:{width:844,height:390},
    deviceScaleFactor:3,hasTouch:true,isMobile:true,
    userAgent:'Mozilla/5.0 (Linux; Android 16; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Mobile Safari/537.36',
  });
  page=await context.newPage();
  page.on('pageerror', e=>report.errors.push(String(e)));
  page.on('response', r=>{if(r.status()===404 && !r.url().includes('/api/'))report.missing.push(r.url());});
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:40000});
  report.phase='hunter-entry';
  await page.locator('#hf-origin-entry button').waitFor({state:'attached',timeout:45000});
  await page.evaluate(()=>{
    const name=document.querySelector('#hf-origin-name');
    if(name instanceof HTMLInputElement) {
      name.value='Hunter';name.dispatchEvent(new Event('input',{bubbles:true}));
    }
    document.querySelector('#hf-origin-entry button')?.click();
  });
  // The real Android mobile preflight must be accepted through its native
  // callback; no synthetic game state or bypass to FORCE_GREEN.
  report.phase='mobile-preflight';
  await page.waitForFunction(()=>{
    const pre=document.getElementById('mobile-preflight');
    return !!window.__game?.sim?.player
      || document.body.classList.contains('mobile-preflight-open')
      || (!!pre && pre.classList.contains('visible'));
  },null,{timeout:110000});
  if(await visible('#mobile-preflight')) {
    await page.waitForFunction(()=>typeof document.getElementById('mobile-preflight-continue')?.onclick==='function',
      null,{timeout:10000});
    await page.evaluate(()=>document.getElementById('mobile-preflight-continue')?.click());
  }
  report.phase='native-Hunter-boot';
  await page.waitForFunction(()=>!!window.__game?.sim?.player,null,{timeout:135000});
  report.phase='world-ready-and-native-HUD';
  await page.waitForFunction(()=>
    !!window.__game?.sim?.player?.originResources
      &&document.body.classList.contains('hf-origin-r32-combat')
      &&document.querySelectorAll('#actionbar [data-hotbar-slot="1"], #actionbar [data-hotbar-slot="2"], #actionbar [data-hotbar-slot="3"], #actionbar [data-hotbar-slot="4"]').length===4,
    null,{timeout:35000});
  report.diagnostics=await page.evaluate(()=>{
    const sim=window.__game?.sim;
    return {originHunter:!!sim?.player?.originResources,
      gameActive:document.body.classList.contains('game-active'),
      r32Hud:document.body.classList.contains('hf-origin-r32-combat'),
      ready:document.body.classList.contains('hf-c25-world-ready'),
      loadingVisible:(()=>{
        const el=document.getElementById('loading-screen');
        return !!el && getComputedStyle(el).display!=='none' && el.classList.contains('visible');
      })(),
      fourSlots:[1,2,3,4].map(n=>({
        slot:n,exists:!!document.querySelector('#actionbar [data-hotbar-slot="'+n+'"]')
      })),
      legacySpecialSlots:!!document.getElementById('hf-c1-special-seats'),
      use:!!document.getElementById('hf-r32-use'),
      known:sim?.players?.get(sim?.playerId)?.known?.map(x=>x.def.id)||[],
    };
  });
  if(report.diagnostics.loadingVisible || !report.diagnostics.gameActive)
    throw Error('R32_HUNTER_BOOT_NOT_GAME_ACTIVE '+JSON.stringify(report.diagnostics));
  if(report.diagnostics.known.join(',')!==report.expectedIds.join(','))
    throw Error('R32_HUNTER_FOUR_WRONG_KNOWN '+JSON.stringify(report.diagnostics));
  if(report.diagnostics.legacySpecialSlots)
    throw Error('R32_SECRET_SLOTS_LEAK');
  if(report.missing.length || report.errors.length)
    throw Error('R32_BOOT_BROWSER_ERRORS '+JSON.stringify({errors:report.errors.slice(0,5),missing:report.missing.slice(0,5)}));
  report.pass=true;
  console.log('HIGHFLY_R32_REAL_HUNTER_WEBGL_4_NATIVE_SKILLS_S23_EMULATED_BOOT_GREEN=1');
} catch(error) {
  report.failure=String(error);
  try { report.diagnostics??=await page?.evaluate(()=>({
    body:document.body.className,loading:document.querySelector('#loading-screen')?.textContent?.slice(0,500),
    preflight:document.querySelector('#mobile-preflight')?.textContent?.slice(0,300),
    hunterEntry:document.querySelector('#hf-origin-entry')?.textContent?.slice(0,350),
    hasGame:!!window.__game,origin:!!window.__game?.sim?.player?.originResources
  }));await page?.screenshot({path:'../r32-hunter-boot-failure.png',fullPage:true});}catch{}
  console.error('HIGHFLY_R32_HUNTER_BOOT_RED',JSON.stringify(report,null,2));
  process.exitCode=1;
} finally {
  fs.writeFileSync('../r32-hunter-boot-report.json',JSON.stringify(report,null,2));
  if(browser)await browser.close();
}
