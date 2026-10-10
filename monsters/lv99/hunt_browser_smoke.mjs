/** HIGHFLY P02-C — actual browser gameplay on opt-in LV21 native world.
 * No source edits or fake Sim entities. Android Chrome is EMULATED, not a real S23.
 * Runs against Vite preview of NO DEPLOY artifact with VITE_HIGHFLY_HUNT_PREVIEW=1.
 */
import { chromium } from 'playwright';

const LEVEL=Number(process.env.HF_HUNT_PREVIEW_LEVEL??21);
const MODE=process.env.HF_HUNT_ENCOUNTER_MODE??'';
const FULL_MATRIX=process.env.HF_HUNT_S23_MATRIX==='1';
if(![21,30,40,50,60,70,80,90].includes(LEVEL)||
  !['','elite','captain'].includes(MODE))throw Error('HF_HUNT_SMOKE_UNKNOWN_MODE');
const URL='http://127.0.0.1:4173/cobalt-hollow-lab/?hfHunt='+LEVEL+
  (MODE?'&hfEncounter='+MODE:'');
const result={url:URL,stage:'init',world:null,actualMobCount:0,
  touchMovement:null,cameraYawDelta:null,mobileHud:null,frameMsMedian:null,
  startupMs:null,activeWebgl:false,missingAssets:[],errors:[],passed:false};
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
  const navigationStarted=Date.now();
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
  result.startupMs=Date.now()-navigationStarted;
  result.world=await page.evaluate(()=>{
    const sim=window.__game?.sim;
    if(!sim) return null;
    const mobs=[...sim.entities.values()].filter(e=>e.kind==='mob'&&
      (e.templateId.startsWith('hf_hunt_')||e.templateId.startsWith('hf_enc_'))&&!e.dead);
    const specials=mobs.filter(e=>e.templateId.startsWith('hf_enc_'));
    return {
      hunterLevel:sim.player?.level, playerName:sim.player?.name,
      hunterHp:sim.player?.hp, hunterMaxHp:sim.player?.maxHp,
      biome:sim.cfg.world?.zones?.[0]?.biome,
      zone:sim.cfg.world?.zones?.[0]?.id,
      levelRange:sim.cfg.world?.zones?.[0]?.levelRange,
      campIds:sim.cfg.world?.camps?.map(c=>c.mobId),
      mobCount:mobs.length, aliveByFamily:mobs.map(e=>e.templateId),
      specialCount:specials.length,specialIds:specials.map(e=>e.templateId),
      sourceNpcs:Object.keys(sim.cfg.world?.npcs??{}).length,
      playerStart:sim.cfg.world?.playerStart,
      customizedTerrain:sim.cfg.world?.terrainEdits?.length??0,
      trails:sim.cfg.world?.roads?.length??0,
      decorCount:sim.cfg.world?.props?.decorProps?.length??0,
      namedLandmarks:sim.cfg.world?.zones?.[0]?.pois?.length??0,
      refugeTents:sim.cfg.world?.props?.tents?.length??0,
    };
  });
  const expectedHuntBiomes={21:'haunt',30:'marsh',40:'peaks',50:'frost',
    60:'volcano',70:'garden',80:'gale',90:'cave'};
  if(result.world?.biome!==expectedHuntBiomes[LEVEL]||
     !Number.isFinite(result.world?.hunterMaxHp)||
     result.world.hunterMaxHp<=0||
     result.world?.hunterHp<=0)
    throw Error('P02I hunt zone biome or live trial Hunter HP mismatch: '+
      JSON.stringify(result.world));
  if(!result.world||result.world.hunterLevel!==LEVEL||
     result.world.levelRange?.[0]!==LEVEL||
     !result.world.zone?.endsWith('_playtest')||
     result.world.mobCount!==8||
     new Set(result.world.campIds).size!==(MODE?5:4)||
     result.world.specialCount!==(MODE?1:0)||
     (MODE&&result.world.specialIds?.[0]!=='hf_enc_'+MODE+'_'+LEVEL)||
     result.world.sourceNpcs!==0||
     result.world.customizedTerrain!==6||
     result.world.trails!==4||
     result.world.decorCount!==12||
     result.world.namedLandmarks!==(MODE?7:6)||
     result.world.refugeTents!==3)
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
  // P02G mobile-only quality gate for ALL eight bands, not just LV21 and LV90.
  // Frame sampling is a CI host-health diagnostic, not a physical S23 FPS claim.
  if(FULL_MATRIX){
    result.stage='S23-mobile-control-geometry';
    result.mobileHud=await page.evaluate(()=>{
      const rect=(sel)=>{
        const el=document.querySelector(sel);
        if(!(el instanceof HTMLElement))return null;
        const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
        return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,
          width:r.width,height:r.height,visible:cs.display!=='none'&&cs.visibility!=='hidden'};
      };
      return {mobile:document.body.classList.contains('mobile-touch'),
        move:rect('#mobile-move-zone'),jump:rect('#mobile-jump'),
        evade:rect('#mobile-evade'),attack:rect('#mobile-action-attack'),
        menu:rect('#mobile-menu-anchor'),
        slots:Array.from({length:10},(_,i)=>rect('#actionbar .action-btn[data-hotbar-slot="'+(i+1)+'"]'))};
    });
    if(!result.mobileHud.mobile)throw Error('S23 HUNT touch runtime inactive');
    for(const [n,v] of Object.entries(result.mobileHud)){
      if(n==='mobile'||n==='slots')continue;
      if(!v||!v.visible||v.width<5||v.height<5||v.x<-2||v.y<-2||
         v.right>846||v.bottom>392)
        throw Error('S23 HUNT offscreen control '+n+':'+JSON.stringify(v));
    }
    if(result.mobileHud.slots.some(v=>!v||!v.visible||
      v.width<5||v.height<5||v.right>846||v.bottom>392))
      throw Error('S23 HUNT missing HUD slot');
    result.stage='S23-right-camera';
    const beforeYaw=await page.evaluate(()=>window.__game.input.camYaw);
    await page.evaluate(()=>{
      const e=document.getElementById('game-canvas');
      if(!(e instanceof HTMLElement))throw Error('Hunt camera canvas missing');
      const r=e.getBoundingClientRect(),x=r.x+r.width*.72,y=r.y+r.height*.4;
      const ev=(type,xx,yy)=>new PointerEvent(type,{pointerId:2722,
        pointerType:'touch',isPrimary:true,bubbles:true,cancelable:true,clientX:xx,clientY:yy});
      e.dispatchEvent(ev('pointerdown',x,y));
      e.dispatchEvent(ev('pointermove',x+82,y+30));
      e.dispatchEvent(ev('pointermove',x+105,y+33));
      e.dispatchEvent(ev('pointerup',x+105,y+33));
    });
    await page.waitForTimeout(350);
    const yaw=await page.evaluate(()=>window.__game.input.camYaw);
    result.cameraYawDelta=Number(Math.abs(Math.atan2(
      Math.sin(yaw-beforeYaw),Math.cos(yaw-beforeYaw))).toFixed(4));
    if(result.cameraYawDelta<.004)throw Error('S23 HUNT free 360 camera blocked');
    result.stage='S23-frame-sample';
    result.frameMsMedian=await page.evaluate(()=>new Promise(resolve=>{
      const frameIntervals=[];
      let lastFrameTime=null;
      const tick=(time)=>{
        if(lastFrameTime!==null&&time>lastFrameTime)
          frameIntervals.push(time-lastFrameTime);
        lastFrameTime=time;
        if(frameIntervals.length>=45){
          const sorted=frameIntervals.filter(ms=>ms>0&&Number.isFinite(ms))
            .sort((a,b)=>a-b);
          resolve(sorted[Math.floor(sorted.length/2)]??null);
        }else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }));
    if(!Number.isFinite(result.frameMsMedian)||result.frameMsMedian<=0||
      result.frameMsMedian>2000)
      throw Error('S23 HUNT browser frame scheduling stalled');
  }
  if(missing.length)throw Error('HuntPilot preview contains missing assets: '+missing.slice(0,4).join(','));
  result.stage='passed';result.passed=true;
  await page.screenshot({path:'../highfly-hunt-p02f-'+(MODE||'normal')+'-lv'+LEVEL+'-s23-preview.png',fullPage:true}).catch(()=>{});
}catch(e){
  result.error=String(e);result.errors=errors;result.missingAssets=missing;
  await page?.screenshot({path:'../highfly-hunt-p02f-'+(MODE||'normal')+'-lv'+LEVEL+'-s23-failure.png',fullPage:true}).catch(()=>{});
}finally{
  await browser?.close().catch(()=>{});
}
console.log('HIGHFLY_HUNT_P02C_BROWSER_RESULT='+JSON.stringify(result));
if(!result.passed)process.exitCode=1;
