// HIGHFLY ORIGIN UNIFIED 01 — single-URL World / LAB real browser smoke.
// This validates SAME native Sim, 4 trial skills and independent save mirrors.
// Chromium touch emulation is NOT a real Samsung S23 Ultra certification.
import puppeteer from 'puppeteer-core';
import {BROWSER_PATH} from './browser_path.mjs';

const BASE=process.env.HIGHFLY_UNIFIED_URL??'http://127.0.0.1:4173/cobalt-hollow-lab/candidate/unified-01/';
const browser=await puppeteer.launch({
  executablePath:BROWSER_PATH,headless:'new',protocolTimeout:240000,
  args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage',
    '--window-size=844,390','--use-gl=angle','--use-angle=swiftshader',
    '--enable-unsafe-swiftshader'],
  defaultViewport:{width:844,height:390,isMobile:true,hasTouch:true,deviceScaleFactor:1},
});
const page=await browser.newPage();
page.setDefaultTimeout(90000);
page.on('pageerror',err=>console.warn('UNIFIED_PAGE_ERROR',err.message));
async function openCreator(){
  await page.waitForSelector('#btn-play',{timeout:90000});
  await page.evaluate(()=>document.getElementById('btn-play')?.click());
  await page.waitForSelector('#hf-origin-mode-lab',{visible:true,timeout:60000});
}
async function continuePreflight(){
  await page.waitForSelector('#mobile-preflight-continue',{visible:true,timeout:12000})
    .then(()=>page.evaluate(()=>document.getElementById('mobile-preflight-continue')?.click()))
    .catch(()=>{});
}
async function awaitHunter(){
  await continuePreflight();
  await page.waitForFunction(()=>!!window.__game?.sim?.player,{timeout:180000});
  await page.waitForSelector('#hf-origin-f1-hud',{timeout:60000});
}
try {
  await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:120000});
  await page.evaluate(()=>{
    localStorage.clear();
    localStorage.setItem('highfly.origin.primary.v1','WORLD_SENTINEL_MUST_SURVIVE_LAB');
    localStorage.setItem('woc.cameraModePrompt.shown','1');
  });
  await page.reload({waitUntil:'domcontentloaded',timeout:120000});
  await openCreator();
  await page.evaluate(()=>document.getElementById('hf-origin-mode-lab').click());
  await page.waitForFunction(()=>document.getElementById('char-name')?.value==='DrakenLAB');
  const labPreview=await page.evaluate(()=>({
    name:document.getElementById('char-name')?.value,
    readonly:document.getElementById('char-name')?.readOnly,
    labPressed:document.getElementById('hf-origin-mode-lab')?.getAttribute('aria-pressed')
  }));
  if(!labPreview.readonly||labPreview.name!=='DrakenLAB'||labPreview.labPressed!=='true')
    throw Error('UNIFIED_LAB_ENTRY_UI_BAD '+JSON.stringify(labPreview));
  await page.evaluate(()=>document.getElementById('btn-start-offline')?.click());
  await awaitHunter();
  const skills=['fireball','sinister_strike','highfly_blade_rush','meteor'];
  await page.waitForFunction(ids=>{
    const g=window.__game;
    return document.body.classList.contains('hf-origin-lab')&&
      document.body.classList.contains('hf-origin-unified')&&
      ids.every(id=>g?.sim?.known?.some(k=>k.def.id===id))&&
      ids.every((id,i)=>g?.hud?.hotbarActions?.[i]?.id===id);
  },{timeout:50000},skills);
  await page.waitForFunction(()=>localStorage.getItem('highfly.origin.unified01.candidate.lab.v1')!==null,{timeout:30000});
  const lab=await page.evaluate(()=>({
    level:window.__game.sim.player.level,
    name:window.__game.sim.players.get(window.__game.sim.playerId)?.name,
    skills:window.__game.sim.known.map(k=>k.def.id),
    hotbar:window.__game.hud.hotbarActions.slice(0,4).map(a=>a?.id),
    f27:document.body.classList.contains('hf-origin-f27'),
    lab:JSON.parse(localStorage.getItem('highfly.origin.unified01.candidate.lab.v1')??'null'),
    worldSentinel:localStorage.getItem('highfly.origin.primary.v1'),
    oldF27:localStorage.getItem('highfly.origin.f27-combat-beta.primary.v1')
  }));
  if(lab.level!==1||lab.name!=='DrakenLAB'||lab.worldSentinel!=='WORLD_SENTINEL_MUST_SURVIVE_LAB'||lab.oldF27!==null||
     lab.lab?.name!=='DrakenLAB'||!lab.f27)
    throw Error('UNIFIED_LAB_NATIVE_OR_SAVE_REGRESSION '+JSON.stringify(lab));
  console.log('UNIFIED_LAB_LV1_FOUR_NATIVE_SKILLS_GREEN=1',JSON.stringify({level:lab.level,name:lab.name,skills:lab.hotbar}));

  // Reload same installed app URL. Normal Draken starts from WORLD ONLY.
  await page.reload({waitUntil:'domcontentloaded',timeout:120000});
  await openCreator();
  await page.waitForFunction(()=>document.getElementById('hf-origin-mode-world')?.getAttribute('aria-pressed')==='true');
  await page.evaluate(()=>{
    const input=document.getElementById('char-name');
    input.value='Draken';
    input.dispatchEvent(new Event('input',{bubbles:true}));
    document.getElementById('btn-start-offline').click();
  });
  await awaitHunter();
  await page.waitForFunction(()=>document.body.classList.contains('hf-origin-unified') &&
    !document.body.classList.contains('hf-origin-lab'));
  await page.waitForFunction(()=>localStorage.getItem('highfly.origin.unified01.candidate.world.v1')?.startsWith('{'),{timeout:30000});
  const world=await page.evaluate(()=>({
    level:window.__game.sim.player.level,
    name:window.__game.sim.players.get(window.__game.sim.playerId)?.name,
    known:window.__game.sim.known.map(k=>k.def.id),
    original:JSON.parse(localStorage.getItem('highfly.origin.unified01.candidate.world.v1')??'null'),
    liveMirror:localStorage.getItem('highfly.origin.primary.v1'),
    liveLab:localStorage.getItem('highfly.origin.lab.primary.v1'),
    lab:JSON.parse(localStorage.getItem('highfly.origin.unified01.candidate.lab.v1')??'null'),
    labFlag:document.body.classList.contains('hf-origin-lab'),
  }));
  if(world.name!=='Draken'||world.level!==1||world.labFlag||
      skills.some(id=>world.known.includes(id))||
      world.original?.name!=='Draken'||world.lab?.name!=='DrakenLAB'||
      world.liveMirror!=='WORLD_SENTINEL_MUST_SURVIVE_LAB'||world.liveLab!==null)
    throw Error('UNIFIED_WORLD_ACQUIRED_LAB_BONUSES '+JSON.stringify(world));
  console.log('UNIFIED_WORLD_NO_TRIAL_GRANTS_AND_BOTH_SAVES_GREEN=1',JSON.stringify({
    level:world.level,known:world.known,world:world.original?.name,lab:world.lab?.name
  }));
  console.log('HIGHFLY_UNIFIED_01_BROWSER_GREEN=1',JSON.stringify({
    base:BASE,modeChoices:true,labLevel1:true,fourTrialSkills:true,realWorldLevel1:true,
    separateSaves:true,productionSavesUntouched:true,device:'844x390 touch-emulated Chromium; NOT physical S23',
    publication:'NO DEPLOY'
  }));
}finally{await browser.close();}
