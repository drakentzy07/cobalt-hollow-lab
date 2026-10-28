#!/usr/bin/env node
// Internal-only P6 browser QA. Do NOT deploy from this branch.
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {resolve,join} from 'node:path';
import fs from 'node:fs';
const root=resolve(process.argv[2]||'upstream');
const {chromium}=createRequire(join(root,'package.json'))('playwright');
const serveRoot=resolve('highfly-p6-http');
const base='http://127.0.0.1:4186/cobalt-hollow-lab/';
const server=spawn('python3',['-m','http.server','4186','--bind','127.0.0.1','--directory',serveRoot],{stdio:'ignore'});
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
let browser;
try{
 fs.mkdirSync(serveRoot,{recursive:true});
 try{fs.symlinkSync(join(root,'dist'),join(serveRoot,'cobalt-hollow-lab'),'dir');}catch(e){if(e.code!=='EEXIST')throw e;}
 for(let attempt=0;attempt<60;attempt++){
  try{if((await fetch(base+'play.html?highfly_origin=1')).ok)break;}catch{}
  await sleep(250);
  if(attempt===59)throw Error('P6 HTTP unavailable');
 }
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width:915,height:412},deviceScaleFactor:3,isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 16; SM-S918B) AppleWebKit/537.36 Chrome/128.0.0.0 Mobile Safari/537.36'});
 const page=await context.newPage();
 const pageErrors=[];
 page.on('pageerror',e=>pageErrors.push(String(e)));
 await page.goto(base+'play.html?highfly_origin=1',{waitUntil:'domcontentloaded',timeout:60000});
 await page.locator('#mobile-preflight-continue').click({timeout:50000});
 await page.waitForFunction(()=>Boolean(window.__game?.sim?.player)&&document.body.classList.contains('game-active'),undefined,{timeout:60000});
 const result=await page.evaluate(()=>{
  const el=id=>document.getElementById(id);
  const rect=node=>{const r=node.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};};
  const shown=node=>node&&getComputedStyle(node).display!=='none'&&node.getBoundingClientRect().width>0&&node.getBoundingClientRect().height>0;
  const slots=[...document.querySelectorAll('#actionbar > .action-btn')];
  return {
   player:window.__game.sim.player.name,
   title:document.title,lang:document.documentElement.lang,
   page:location.pathname,body:document.body.className,
   attack:rect(el('mobile-attack-nearest')),
   jump:rect(el('mobile-jump')),dash:rect(el('mobile-dash')),
   use:rect(el('mobile-interact')),more:rect(el('mobile-more')),
   cameraHidden:!shown(el('mobile-camera-joystick')),
   originalSlots:slots.slice(1,5).map((s)=>({id:s.dataset.hotbarSlot,shown:!!shown(s),rect:rect(s)})),
   legacyVisible:slots.slice(5).filter(shown).length,
   settingsAvailable:!!el('mobile-extra-controls'),
  };
 });
 if(!result.title.includes('HIGHFLY ORIGIN'))throw Error('P6 branding missing '+JSON.stringify(result));
 if(!result.originalSlots.every((slot,i)=>slot.id===String(i+1)&&slot.shown))throw Error('4 native slots missing '+JSON.stringify(result));
 if(result.legacyVisible!==0||!result.cameraHidden)throw Error('P6 HUD legacy overlay active '+JSON.stringify(result));
 for(const key of ['attack','jump','dash','use','more'])if(result[key].w<44||result[key].h<44)throw Error('Too small '+key+' '+JSON.stringify(result));
 if(Math.hypot(result.jump.x-result.dash.x,result.jump.y-result.dash.y)<45)throw Error('Jump/dash overlap');
 if(pageErrors.length)throw Error('Browser errors: '+JSON.stringify(pageErrors.slice(0,6)));
 console.log('HIGHFLY_P6_INTERNAL_MOBA_S23_QA_GREEN '+JSON.stringify(result));
 await context.close();
}catch(e){console.error('HIGHFLY_P6_QA_RED '+(e.stack||e));process.exitCode=1}
finally{if(browser)await browser.close();server.kill('SIGTERM');}
