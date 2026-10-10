/** HIGHFLY P02-C — actual browser gameplay on opt-in LV21 native world.
 * No source edits or fake Sim entities. Android Chrome is EMULATED, not a real S23.
 * Runs against Vite preview of NO DEPLOY artifact with VITE_HIGHFLY_HUNT_PREVIEW=1.
 */
import { chromium } from 'playwright';

const URL='http://127.0.0.1:4173/cobalt-hollow-lab/?hfHunt=21';
const result={url:URL,stage:'init',world:null,actualMobCount:0,
  touchMovement:null,activeWebgl:false,missingAssets:[],errors:[],passed:false};
const errors=[],missing=[];
let browser,page;
try {
  browser=await chromium.launch({channel:'chrome',headless:true});
  const ctx=await browser.newContext({
    viewport:{width:844,height:390},screen:{width:844,height:390},
    hasTouch:true,isMobile:true,deviceScaleFactor:3,
    userAgent:'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Mobile Safari/537.36',
  });
  page=await ctx.newPage();
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.status()===404&&!r.url().includes('/api/'))missing.push(r.url());});
  result.stage='enter-native-preview';
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:40000});
  // Reuse original real mobile preflight button rather than bypassing startup.
  for(let i=0;i<100;i++) {
    const state=await page.evaluate(()=>({
      player:!!window.__game?.sim?.player,
      consent:(()=>{
        const e=document.querySelector('#mobile-preflight');
        return e instanceof HTMLElement &&
          getComputedStyle(e).display!=='none' &&
          getComputedStyle(e).visibility!=='hidden' &&
          e.getBoundingClientRect().width>10;
      })(),
      fatal:document.getElementById('fatal-overlay')?.textContent?.slice(0,200)??null,
    }));
    if(state.player)break;
    if(state.consent) {
      await page.evaluate(()=>document.querySelector('#mobile-preflight-continue')?.click());
      break;
    }
    await page.waitForTimeout(250);
  }
  await page.waitForFunction(()=>!!window.__game?.sim?.player,null,{timeout:100000});
  result.stage='actual-hunter-and-spawns';
  result.world=await page.evaluate(()=>{
    const sim=window.__game?.sim;
    if(!sim) return null;
    const mobs=[...sim.entities.values()].filter(e=>e.kind==='mob'&&e.templateId.startsWith('hf_hunt_')&&!e.dead);
    return {
      hunterLevel:sim.player?.level, playerName:sim.player?.name,
      zone:sim.cfg.world?.zones?.[0]?.id,
      levelRange:sim.cfg.world?.zones?.[0]?.levelRange,
      campIds:sim.cfg.world?.camps?.map(c=>c.mobId),
      mobCount:mobs.length, aliveByFamily:mobs.map(e=>e.templateId),
      sourceNpcs:Object.keys(sim.cfg.world?.npcs??{}).length,
      playerStart:sim.cfg.world?.playerStart,
      customizedTerrain:sim.cfg.world?.terrainEdits?.length??0,
    };
  });
  if(!result.world||result.world.hunterLevel!==21||
     result.world.zone!=='hf_hunt_woods_21_playtest'||
     result.world.mobCount!==8||
     new Set(result.world.campIds).size!==4||
     result.world.sourceNpcs!==0||
     result.world.customizedTerrain!==1)
    throw Error('Native hunt did not load exact LV21 isolated 8-monster Sim: '+JSON.stringify(result.world));
  result.actualMobCount=result.world.mobCount;
  await page.waitForFunction(()=>{
    const e=document.querySelector('#loading-screen');
    if(!(e instanceof HTMLElement))return true;
    const style=getComputedStyle(e);
    return !e.classList.contains('visible')||style.display==='none'||
      style.visibility==='hidden'||style.pointerEvents==='none';
  },null,{timeout:90000});
  result.stage='real-render-and-hud';
  await page.locator('#game-canvas').waitFor({state:'visible',timeout:25000});
  await page.locator('#mobile-move-zone').waitFor({state:'visible',timeout:25000});
  result.activeWebgl=await page.evaluate(()=>{
    const e=document.getElementById('game-canvas');
    return e instanceof HTMLCanvasElement &&
      !!e.getContext('webgl2') && !e.getContext('webgl2').isContextLost();
  });
  if(!result.activeWebgl)throw Error('Native hunt WebGL2 canvas failed');

  // Move via the REAL MOBILE joystick, without touching the Sim position.
  const before=await page.evaluate(()=>({x:window.__game.sim.player.pos.x,z:window.__game.sim.player.pos.z}));
  await page.evaluate(()=>{
    const el=document.getElementById('mobile-move-zone');
    if(!(el instanceof HTMLElement))throw Error('Touch input missing');
    const b=el.getBoundingClientRect(),x=b.x+b.width/2,y=b.y+b.height/2;
    el.dispatchEvent(new PointerEvent('pointerdown',{pointerId:1701,pointerType:'touch',isPrimary:true,bubbles:true,cancelable:true,clientX:x,clientY:y}));
    el.dispatchEvent(new PointerEvent('pointermove',{pointerId:1701,pointerType:'touch',isPrimary:true,bubbles:true,cancelable:true,clientX:x+46,clientY:y+4}));
  });
  await page.waitForTimeout(1300);
  await page.evaluate(()=>{
    document.getElementById('mobile-move-zone')?.dispatchEvent(
      new PointerEvent('pointerup',{pointerId:1701,pointerType:'touch',isPrimary:true,bubbles:true,cancelable:true}));
  });
  const after=await page.evaluate(()=>({x:window.__game.sim.player.pos.x,z:window.__game.sim.player.pos.z}));
  result.touchMovement=Number(Math.hypot(after.x-before.x,after.z-before.z).toFixed(3));
  if(result.touchMovement<0.3)throw Error('Real mobile HuntPilot failed native 360 joystick: '+result.touchMovement);
  if(missing.length)throw Error('HuntPilot preview contains missing assets: '+missing.slice(0,4).join(','));
  result.stage='passed';result.passed=true;
  await page.screenshot({path:'../highfly-hunt-p02c-s23-preview.png',fullPage:true}).catch(()=>{});
}catch(e){
  result.error=String(e);result.errors=errors;result.missingAssets=missing;
  await page?.screenshot({path:'../highfly-hunt-p02c-s23-failure.png',fullPage:true}).catch(()=>{});
}finally{
  await browser?.close().catch(()=>{});
}
console.log('HIGHFLY_HUNT_P02C_BROWSER_RESULT='+JSON.stringify(result));
if(!result.passed)process.exitCode=1;
