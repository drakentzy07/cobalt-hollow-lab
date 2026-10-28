#!/usr/bin/env node
// FURY P4A true browser multitouch test. Do not distribute proprietary game art.
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {resolve,join} from 'node:path';
const root=resolve(process.argv[2]||'upstream');
const require=createRequire(join(root,'package.json'));
const {chromium}=require('playwright');
const url='http://127.0.0.1:4173/play.html?highfly_p3=1';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4173','--strictPort'],{cwd:root,stdio:'ignore',env:{...process.env,VITE_TURNSTILE_SITEKEY:''}});
let browser=null;
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
try{
 for(let i=0;i<100;i++){try{if((await fetch(url)).ok)break;}catch{}await sleep(200);if(i===99)throw Error('Vite did not start');}
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--disable-dev-shm-usage','--disable-gpu-sandbox']});
 const context=await browser.newContext({viewport:{width:915,height:412},isMobile:true,hasTouch:true,deviceScaleFactor:3,
 userAgent:'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36'});
 const page=await context.newPage();
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:40000});
 await page.locator('#mobile-preflight-continue').click({timeout:50000});
 await page.waitForFunction(()=>!!window.__game?.input?.highflyFuryStickVector&&!!window.__game?.sim?.player,undefined,{timeout:120000});
 // Start with a diagonal left-hand stick and keep it held while tapping attack.
 const start=await page.evaluate(()=>{
  const g=window.__game;
  const initial={x:g.sim.player.pos.x,z:g.sim.player.pos.z,yaw:g.input.camYaw,level:g.sim.player.level};
  const el=document.getElementById('mobile-move-zone');
  if(!el)throw Error('Move zone missing');
  const box=el.getBoundingClientRect();
  const x=box.left+65,y=box.bottom-80;
  const send=(type,el,id,x,y)=>el.dispatchEvent(new PointerEvent(type,{
   bubbles:true,cancelable:true,pointerId:id,pointerType:'touch',isPrimary:id===11,
   clientX:x,clientY:y,buttons:type==='pointerup'?0:1,button:0
  }));
  send('pointerdown',el,11,x,y);
  send('pointermove',el,11,x+22,y-38);
  const actual=g.input.highflyFuryStickVector();
  if(!actual||actual.x<0.15||actual.y>-0.15)throw Error('Continuous stick never engaged '+JSON.stringify(actual));
  return {initial,box:{x:box.x,y:box.y,width:box.width,height:box.height},x,y,actual};
 });
 await sleep(750);
 const inMotion=await page.evaluate(()=>{
  const g=window.__game;
  return {x:g.sim.player.pos.x,z:g.sim.player.pos.z,
   yaw:g.input.camYaw,stick:g.input.highflyFuryStickVector(),
   input:{...g.sim.moveInput},level:g.sim.player.level};
 });
 const travel=Math.hypot(inMotion.x-start.initial.x,inMotion.z-start.initial.z);
 if(travel<0.12)throw Error('FURY stick did not move player '+JSON.stringify({start,inMotion,travel}));
 if(Math.abs(inMotion.yaw-start.initial.yaw)>0.09)
  throw Error('Left FURY stick unexpectedly rotated independent camera '+JSON.stringify({start,inMotion}));
 // With the left stick STILL pressed, pressing attack must not cancel it.
 await page.locator('#mobile-attack-nearest').click({timeout:12000});
 const afterAttack=await page.evaluate(()=>({stick:window.__game.input.highflyFuryStickVector(),
  x:window.__game.sim.player.pos.x,z:window.__game.sim.player.pos.z}));
 if(!afterAttack.stick)throw Error('Attack cleared held left stick');
 // Simultaneous independent right camera pointer must rotate the view without dropping left movement.
 const cam=await page.evaluate(()=>{
  const g=window.__game,el=document.getElementById('mobile-camera-joystick');
  const rect=el.getBoundingClientRect(),x=rect.x+rect.width/2,y=rect.y+rect.height/2;
  const mk=(kind,px,py)=>el.dispatchEvent(new PointerEvent(kind,{
   bubbles:true,cancelable:true,pointerId:12,pointerType:'touch',isPrimary:false,
   clientX:px,clientY:py,buttons:kind==='pointerup'?0:1,button:0
  }));
  mk('pointerdown',x,y);
  mk('pointermove',x+31,y-15);
  return {yaw:g.input.camYaw,x,y};
 });
 await sleep(400);
 const afterCam=await page.evaluate(()=>({yaw:window.__game.input.camYaw,stick:window.__game.input.highflyFuryStickVector()}));
 if(!afterCam.stick)throw Error('Right camera stick stole left stick pointer');
 if(Math.abs(afterCam.yaw-cam.yaw)<0.015)throw Error('Right camera stick failed independent yaw '+JSON.stringify({cam,afterCam}));
 const release=await page.evaluate(({x,y,cam})=>{
  const m=document.getElementById('mobile-move-zone');
  m.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,cancelable:true,pointerId:11,pointerType:'touch',clientX:x+22,clientY:y-38}));
  const el=document.getElementById('mobile-camera-joystick');
  el.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,cancelable:true,pointerId:12,pointerType:'touch',clientX:cam.x+31,clientY:cam.y-15}));
  return window.__game.input.highflyFuryStickVector();
 },{x:start.x,y:start.y,cam}).catch(async()=>{
   // The release checks the left stick even if the diagnostic right pointer cleanup was unavailable.
   return await page.evaluate(()=>window.__game.input.highflyFuryStickVector());
 });
 if(release)throw Error('Left joystick did not neutralize on release '+JSON.stringify(release));
 console.log('[HIGHFLY FURY P4A] PASS '+JSON.stringify({travel:Math.round(travel*1000)/1000,
  cameraYawBefore:start.initial.yaw,cameraYawAfter:afterCam.yaw,
  bothThumbsIndependent:true,attackWhileMoving:true,stick:inMotion.stick}));
 await context.close();
}catch(e){console.error('[HIGHFLY FURY P4A] FAIL '+(e?.stack||e));process.exitCode=1;
}finally{if(browser)await browser.close();server.kill('SIGTERM');}
