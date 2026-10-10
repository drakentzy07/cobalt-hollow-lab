/** HIGHFLY V3-06 — simulated Samsung S23 Ultra Chrome LANDSCAPE smoke.
 * Actual Chromium 844x390, touch, DPR3, Android user-agent; NOT a real S23.
 * No game source changes, no artificial HP/XP/movement, no fake game state.
 * Native pointer events exercise joystick and right-side camera drag.
 * The 9 class buttons are only a presence gate; real-device visual QA remains.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
const URL='http://127.0.0.1:4173/cobalt-hollow-lab/';
const EXPECTED=['warrior','paladin','hunter','rogue','priest','shaman','mage','warlock','druid'];
const result={phase:'entry',emulatedDevice:'Galaxy S23 Ultra Android Chrome landscape 844x390',nineClassChoices:[],preview:null,boot:false,hud:null,joystickMeters:null,cameraYawDelta:null,training:null,static404:[],pageErrors:[],pass:false};
let browser,page;const errors=[],notFound=[];
function fail(message){throw new Error(message)}
try {
  browser=await chromium.launch({channel:'chrome',headless:true});
  const context=await browser.newContext({
    viewport:{width:844,height:390},screen:{width:844,height:390},
    deviceScaleFactor:3,hasTouch:true,isMobile:true,
    userAgent:'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Mobile Safari/537.36',
  });
  page=await context.newPage();
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.status()===404&&!r.url().includes('/api/'))notFound.push(r.url())});
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:30000});
  await page.evaluate(()=>localStorage.setItem('woc.cameraModePrompt.shown','1'));
  await page.locator('#btn-offline').waitFor({state:'attached',timeout:20000});
  for(let i=0;i<45;i++){
    await page.evaluate(()=>document.querySelector('#btn-offline')?.click());
    if(await page.locator('#offline-select .mini-class[data-class="warrior"]').isVisible().catch(()=>false))break;
    await page.waitForTimeout(200);
  }
  await page.locator('#offline-select .mini-class[data-class="warrior"]').waitFor({state:'visible',timeout:15000});
  result.phase='nine-class-selector';
  result.nineClassChoices=await page.evaluate(()=>[...document.querySelectorAll('#offline-select .mini-class[data-class]')].map(el=>el.getAttribute('data-class')));
  if([...new Set(result.nineClassChoices)].sort().join('|')!==[...EXPECTED].sort().join('|')){
    fail('S23 landscape selector does not expose precisely nine original classes: '+JSON.stringify(result.nineClassChoices));
  }
  await page.evaluate(()=>{
    const input=document.querySelector('#char-name');
    if(input instanceof HTMLInputElement){input.value='HighflyTester';input.dispatchEvent(new Event('input',{bubbles:true}));}
    document.querySelector('#offline-select .mini-class[data-class="warrior"]')?.click();
  });
  result.phase='actual-modular-preview';
  await page.waitForFunction(()=>{
    const c=document.querySelector('#char-preview-canvas');
    return c instanceof HTMLCanvasElement&&c.dataset.highflyPreviewVisual==='player_warrior_modular'&&
      Number(c.dataset.highflyPreviewFrame??0)>0&&c.width>10&&c.height>10;
  },null,{timeout:80000});
  result.preview=await page.evaluate(()=>{
    const c=document.querySelector('#char-preview-canvas'),b=document.querySelector('#offline-preview-container');
    return {visual:c?.dataset.highflyPreviewVisual,frames:Number(c?.dataset.highflyPreviewFrame??0),
      webgl:!!(c instanceof HTMLCanvasElement&&c.getContext('webgl2')&&!c.getContext('webgl2')?.isContextLost()),
      width:b?.getBoundingClientRect().width??0,height:b?.getBoundingClientRect().height??0};
  });
  if(!result.preview.webgl||result.preview.width<200||result.preview.height<130)fail('Modular Warrior preview is not an actual visible mobile WebGL surface');
  await page.screenshot({path:'../demo-v3-06-s23-creator.png',fullPage:true}).catch(()=>{});
  // Match ClaudeCraft's mobile-preflight contract: the asynchronous
  // "enter world" click first arms a physical-device consent dialog; only
  // that dialog's native onclick may resolve prepareWorldEntry().
  // Diagnose every distinct stage instead of merely waiting 120 seconds.
  const entryState=()=>page.evaluate(()=>{
    const visible=(selector)=>{
      const e=document.querySelector(selector);
      return e instanceof HTMLElement&&getComputedStyle(e).display!=='none'&&
        getComputedStyle(e).visibility!=='hidden'&&e.getBoundingClientRect().width>0;
    };
    const b=document.querySelector('#btn-start-offline');
    const p=document.querySelector('#mobile-preflight-continue');
    return {
      selected:document.querySelector('#offline-select .mini-class.sel')?.getAttribute('data-class')??null,
      name:document.querySelector('#char-name')?.value??null,
      startDisabled:b?.disabled??null,startVisible:visible('#btn-start-offline'),
      preflightVisible:visible('#mobile-preflight'),
      preflightButtonVisible:visible('#mobile-preflight-continue'),
      preflightButtonWired:typeof p?.onclick==='function',
      mobileTouch:document.body.classList.contains('mobile-touch'),
      devicePreflight:document.body.classList.contains('mobile-preflight-open'),
      gameActive:document.body.classList.contains('game-active'),
      gamePresent:!!window.__game,playerPresent:!!window.__game?.sim?.player,
      loadingVisible:visible('#loading-screen'),loadingText:document.querySelector('#loading-screen')?.textContent?.slice(0,650)??null,
      offlineError:document.querySelector('#offline-error')?.textContent??null,
      fatalVisible:visible('#fatal-overlay'),fatalText:document.querySelector('#fatal-overlay')?.textContent?.slice(0,800)??null,
      creatorVisible:visible('#offline-select'),
      bodyClasses:document.body.className,
    };
  });
  result.entryFlow={beforeClick:await entryState()};
  if(result.entryFlow.beforeClick.selected!=='warrior' ||
     result.entryFlow.beforeClick.startDisabled ||
     result.entryFlow.beforeClick.name!=='HighflyTester'){
    fail('Mobile creator has not accepted Warrior/name/start: '+JSON.stringify(result.entryFlow.beforeClick));
  }
  await page.evaluate(()=>document.querySelector('#btn-start-offline')?.click());
  result.phase='mobile-entry-preflight';
  await page.waitForFunction(()=>{
    const e=document.querySelector('#mobile-preflight');
    return !!window.__game?.sim?.player||
      document.body.classList.contains('mobile-preflight-open')||
      document.body.classList.contains('game-active')||
      (e instanceof HTMLElement&&e.classList.contains('visible'));
  },null,{timeout:30000}).catch(()=>{});
  result.entryFlow.afterStartClick=await entryState();
  if(result.entryFlow.afterStartClick.preflightVisible){
    if(!result.entryFlow.afterStartClick.preflightButtonWired){
      fail('Real mobile consent dialog rendered without its original click handler: '+JSON.stringify(result.entryFlow.afterStartClick));
    }
    await page.evaluate(()=>document.querySelector('#mobile-preflight-continue')?.click());
    result.entryFlow.continuedRealPreflight=true;
  }else if(!result.entryFlow.afterStartClick.gameActive &&
           !result.entryFlow.afterStartClick.playerPresent){
    fail('Original mobile entry never reached consent or world-loading stage: '+JSON.stringify(result.entryFlow.afterStartClick));
  }
  result.phase='mobile-world-boot';
  try {
    await page.waitForFunction(()=>Boolean(window.__game?.sim?.player),null,{timeout:100000});
  }catch(e){
    result.entryFlow.afterBootFailure=await entryState().catch(x=>({captureError:String(x)}));
    fail('Mobile world failed after original entry/preflight: '+JSON.stringify(result.entryFlow)+': '+String(e));
  }
  await page.waitForFunction(()=>{
    const e=document.querySelector('#loading-screen');if(!(e instanceof HTMLElement))return true;
    const s=getComputedStyle(e);return !e.classList.contains('visible')||s.display==='none'||s.visibility==='hidden'||s.pointerEvents==='none';
  },null,{timeout:90000});
  await page.waitForTimeout(800);
  await page.evaluate(()=>{
    for(const b of document.querySelectorAll('button'))if(['Dismiss','Understood','Got it','Skip tutorial'].includes((b.textContent??'').trim()))b.click();
    document.querySelector('.camera-prompt-confirm')?.click();
    document.querySelector('button.tut-skip')?.click();
  });
  result.boot=true;
  result.phase='mobile-golden-hud';
  for(const selector of ['#mobile-action-attack','#mobile-move-joystick','#mobile-menu-anchor','#mobile-jump','#mobile-evade']){
    await page.locator(selector).waitFor({state:'visible',timeout:20000});
  }
  result.hud=await page.evaluate(()=>{
    const rect=(selector)=>{
      const el=document.querySelector(selector);if(!(el instanceof HTMLElement))return null;
      const r=el.getBoundingClientRect(),css=getComputedStyle(el);
      return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height,display:css.display,visibility:css.visibility};
    };
    return {viewport:[innerWidth,innerHeight],mobileTouch:document.body.classList.contains('mobile-touch'),
      golden:document.body.classList.contains('hf-game-c1'),
      slots:Array.from({length:10},(_,i)=>rect('#actionbar .action-btn[data-hotbar-slot="'+(i+1)+'"]')),
      attack:rect('#mobile-action-attack'),joystick:rect('#mobile-move-zone'),jump:rect('#mobile-jump'),evade:rect('#mobile-evade'),
      menu:rect('#mobile-menu-anchor'),camera:rect('#game-canvas'),hasTraining:!!document.querySelector('#mobile-training')};
  });
  if(!result.hud.mobileTouch||!result.hud.golden||!result.hud.hasTraining)fail('Original HIGHFLY mobile runtime or Training More entry missing');
  for(const [name,r] of Object.entries({attack:result.hud.attack,joystick:result.hud.joystick,jump:result.hud.jump,evade:result.hud.evade,menu:result.hud.menu})){
    if(!r||r.display==='none'||r.visibility==='hidden'||r.w<5||r.h<5||r.x< -2||r.right>846||r.y< -2||r.bottom>392)fail('S23 mobile control offscreen or invisible: '+name+' '+JSON.stringify(r));
  }
  if(result.hud.slots.length!==10||result.hud.slots.some(r=>!r||r.display==='none'||r.visibility==='hidden'||r.right>846||r.bottom>392))fail('S23 10-slot GOLDEN HUD violated');

  // Touch joystick. The source's onMoveDown/onMoveMove handlers, not an
  // artificial position edit, must move the character in the actual Sim.
  result.phase='touch-left-joystick';
  const pre=await page.evaluate(()=>({x:window.__game.sim.player.pos.x,z:window.__game.sim.player.pos.z,yaw:window.__game.input.camYaw}));
  await page.evaluate(()=>{
    const e=document.getElementById('mobile-move-zone');if(!(e instanceof HTMLElement))throw Error('Mobile movement zone missing');
    const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;
    e.dispatchEvent(new PointerEvent('pointerdown',{pointerId:606,pointerType:'touch',isPrimary:true,bubbles:true,cancelable:true,clientX:x,clientY:y}));
    e.dispatchEvent(new PointerEvent('pointermove',{pointerId:606,pointerType:'touch',isPrimary:true,bubbles:true,cancelable:true,clientX:x+48,clientY:y+4}));
  });
  await page.waitForTimeout(1350);
  await page.evaluate(()=>{
    const e=document.getElementById('mobile-move-zone');if(!(e instanceof HTMLElement))return;
    e.dispatchEvent(new PointerEvent('pointerup',{pointerId:606,pointerType:'touch',isPrimary:true,bubbles:true,cancelable:true}));
  });
  const post=await page.evaluate(()=>({x:window.__game.sim.player.pos.x,z:window.__game.sim.player.pos.z}));
  result.joystickMeters=Number(Math.hypot(post.x-pre.x,post.z-pre.z).toFixed(3));
  if(result.joystickMeters<0.3)fail('S23 left touch joystick did not move the real Hunter: '+result.joystickMeters);

  // Camera gesture through the actual canvas pointer router, no setCamYaw.
  result.phase='right-camera-swipe';
  const beforeYaw=await page.evaluate(()=>window.__game.input.camYaw);
  await page.evaluate(()=>{
    const e=document.getElementById('game-canvas');if(!(e instanceof HTMLElement))throw Error('WebGL canvas missing');
    const r=e.getBoundingClientRect(),x=r.x+r.width*0.72,y=r.y+r.height*0.40;
    const ev=(type,xx,yy)=>new PointerEvent(type,{pointerId:607,pointerType:'touch',isPrimary:true,bubbles:true,cancelable:true,clientX:xx,clientY:yy});
    e.dispatchEvent(ev('pointerdown',x,y));
    e.dispatchEvent(ev('pointermove',x+82,y+30));
    e.dispatchEvent(ev('pointermove',x+105,y+33));
    e.dispatchEvent(ev('pointerup',x+105,y+33));
  });
  await page.waitForTimeout(350);
  const afterYaw=await page.evaluate(()=>window.__game.input.camYaw);
  result.cameraYawDelta=Number(Math.abs(Math.atan2(Math.sin(afterYaw-beforeYaw),Math.cos(afterYaw-beforeYaw))).toFixed(4));
  if(result.cameraYawDelta<0.004)fail('S23 right-side camera swipe did not change true camYaw: '+result.cameraYawDelta);

  result.phase='mobile-training-menu';
  await page.evaluate(()=>document.querySelector('#mobile-menu-anchor')?.click());
  await page.locator('#mobile-training').waitFor({state:'visible',timeout:10000});
  await page.evaluate(()=>document.querySelector('#mobile-training')?.click());
  await page.locator('#highfly-training-window').waitFor({state:'visible',timeout:15000});
  result.training=await page.evaluate(()=>{
    const el=document.querySelector('#highfly-training-window');const r=el?.getBoundingClientRect();
    return {visible:!!r&&r.width>600,width:r?.width??0,height:r?.height??0,text:(el?.textContent??'').slice(0,500)};
  });
  if(!result.training.visible||result.training.width<750)fail('Training Core not usable in landscape mobile view');
  await page.screenshot({path:'../demo-v3-06-s23-training.png',fullPage:true}).catch(()=>{});
  result.static404=notFound;
  result.pageErrors=errors;
  if(notFound.length)fail('S23 local mobile offline bundle has static HTTP404');
  result.phase='passed';result.pass=true;
  await page.screenshot({path:'../demo-v3-06-s23-world.png',fullPage:true}).catch(()=>{});
} catch(e){
  result.error=String(e);result.static404=notFound;result.pageErrors=errors;
  await page?.screenshot({path:'../demo-v3-06-s23-failure.png',fullPage:true}).catch(()=>{});
} finally {
  fs.writeFileSync('../demo-v3-06-mobile-report.json',JSON.stringify(result,null,2));
  console.log('HIGHFLY_DEMO_V3_06_MOBILE_REPORT '+JSON.stringify(result));
  await browser?.close().catch(()=>{});
}
if(!result.pass)process.exit(1);
