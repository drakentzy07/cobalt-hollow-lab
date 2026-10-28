#!/usr/bin/env node
// Internal visual-runtime smoke: a real Chromium 915x412 Android-like touch
// viewport, actual offline game renderer, no screenshots/artifacts published.
// Physical S23 testing still required: browser emulation is not device testing.
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {resolve,join} from 'node:path';
const root=resolve(process.argv[2]||'upstream');
const require=createRequire(join(root,'package.json'));
const {chromium}=require('playwright');
const url='http://127.0.0.1:4173/play.html?highfly_p3=1';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4173','--strictPort'],{
  cwd:root,stdio:['ignore','pipe','pipe'],env:{...process.env,VITE_TURNSTILE_SITEKEY:''}
});
const err=[];
server.stderr.on('data',chunk=>err.push(String(chunk).slice(0,500)));
let browser=null;
const sleep=ms=>new Promise(done=>setTimeout(done,ms));
async function serverUp(){
 for(let i=0;i<100;i++){
  if(server.exitCode!==null)throw Error('Vite process terminated: '+err.join(' ').slice(-1000));
  try{const res=await fetch(url);if(res.ok)return;}catch{}
  await sleep(150);
 }
 throw Error('Local Vite server not reachable: '+err.join(' ').slice(-1000));
}
async function loadGame(page,label){
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e).slice(0,300)));
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
 const prompt=page.locator('#mobile-preflight-continue');
 await prompt.waitFor({state:'visible',timeout:45000});
 await prompt.click();
 try{
  await page.waitForFunction(()=>Boolean(window.__game?.sim?.player && window.__game?.renderer),undefined,{timeout:110000});
 }catch(e){
  const info=await page.evaluate(()=>({
    title:document.title,bodyClasses:document.body.className,
    loadingText:document.getElementById('ls-status')?.textContent,
    gameActive:document.body.classList.contains('game-active'),
    canvasPresent:!!document.getElementById('game-canvas'),
    controlsPresent:!!document.getElementById('mobile-controls'),
    preflightVisible:getComputedStyle(document.getElementById('mobile-preflight')).display,
  }));
  throw Error(label+' world did not boot: '+JSON.stringify(info)+' runtime errors '+JSON.stringify(errors.slice(-9))+' original '+String(e).slice(0,250));
 }
 const data=await page.evaluate(()=>{
  const g=window.__game;
  const ents=[...g.sim.entities.values()];
  const rect=id=>{
    const el=document.getElementById(id);
    const r=el?.getBoundingClientRect();
    return r?{x:r.x,y:r.y,width:r.width,height:r.height,visible:getComputedStyle(el).display!=='none'}:null;
  };
  return {
   active:document.body.classList.contains('game-active'),
   touch:document.body.classList.contains('mobile-touch'),
   width:innerWidth,height:innerHeight,
   playerId:g.sim.playerId,playerName:g.sim.player.name,
   playerLevel:g.sim.player.level,
   mobCount:ents.filter(x=>x.kind==='mob').length,
   npcCount:ents.filter(x=>x.kind==='npc').length,
   canvas:rect('game-canvas'),
   move:rect('mobile-move-joystick'),
   camera:rect('mobile-camera-joystick'),
   attack:rect('mobile-attack-nearest'),
   jump:rect('mobile-jump'),
   use:rect('mobile-interact'),
   more:rect('mobile-more'),
   saveState:g.sim.serializeCharacter(g.sim.playerId)?.inventory?.length??-1
  };
 });
 if(data.playerId<1||data.mobCount<15||data.npcCount<10||!data.active||!data.touch||
    !data.canvas||!data.move?.visible||!data.camera?.visible||!data.attack?.visible||!data.jump?.visible||
    !data.use?.visible||!data.more?.visible)
   throw Error(label+' invalid real Android-like world surface: '+JSON.stringify(data));
 for(const key of ['move','camera','attack','jump','use','more']){
  const r=data[key];
  if(r.width<15||r.height<15||r.x<-10||r.y<-10||r.x+r.width>data.width+10||r.y+r.height>data.height+10){
   throw Error(label+' offscreen touch control: '+key+' '+JSON.stringify(r));
  }
 }
 console.log('[HIGHFLY P3 '+label+'] '+JSON.stringify(data));
 if(errors.length)console.log('[HIGHFLY P3 nonfatal page exceptions] '+JSON.stringify(errors.slice(0,4)));
 return data;
}
try {
 await serverUp();
 browser=await chromium.launch({
  headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--disable-dev-shm-usage','--disable-gpu-sandbox']
 });
 const context=await browser.newContext({
   viewport:{width:915,height:412},isMobile:true,hasTouch:true,deviceScaleFactor:3,
   userAgent:'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
 });
 const first=await context.newPage();
 await loadGame(first,'initial boot');
 await first.evaluate(()=>{
   const sim=window.__game.sim;
   sim.addItem('healing_potion',1,sim.playerId);
   const state=sim.serializeCharacter(sim.playerId);
   if(!state?.inventory.some(x=>x.itemId==='healing_potion'))throw Error('smoke fixture potion missing');
   window.dispatchEvent(new Event('pagehide'));
 });
 const key='highfly.origin.v020.character.v1.warrior.draken';
 const stored=await first.evaluate(k=>localStorage.getItem(k),key);
 if(!stored)throw Error('No persistent save reached localStorage after pagehide.');
 await first.close();
 const second=await context.newPage();
 await loadGame(second,'persisted reload');
 const restored=await second.evaluate(()=>{
   const sim=window.__game.sim;
   return sim.serializeCharacter(sim.playerId)?.inventory.some(x=>x.itemId==='healing_potion')||false;
 });
 if(!restored)throw Error('Potion did not survive actual Chromium reload/Sim restoration.');
 console.log('[HIGHFLY P3] PASS full-world landscape Chromium + touch controls + real persisted inventory');
 await context.close();
} catch(e) {
 console.error('[HIGHFLY P3] FAIL '+(e?.stack||String(e)));
 process.exitCode=1;
} finally {
 if(browser)await browser.close();
 server.kill('SIGTERM');
}
