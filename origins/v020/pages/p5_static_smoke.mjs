#!/usr/bin/env node
// Prove the P5 built game loads from the exact GitHub Pages project subpath.
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {resolve,join} from 'node:path';
import fs from 'node:fs';
const root=resolve(process.argv[2]||'upstream');
const {chromium}=createRequire(join(root,'package.json'))('playwright');
const base='http://127.0.0.1:4185/cobalt-hollow-lab/';
const shell=spawn('python3',['-m','http.server','4185','--bind','127.0.0.1','--directory','highfly-p5-http'],{stdio:'ignore'});
let browser;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
 fs.mkdirSync('highfly-p5-http',{recursive:true});
 try{fs.symlinkSync(resolve(root,'dist'),resolve('highfly-p5-http/cobalt-hollow-lab'),'dir');}catch(e){if(e.code!=='EEXIST')throw e;}
 for(let i=0;i<70;i++){
  try{const rsp=await fetch(base+'play.html?highfly_p3=1');if(rsp.ok)break;}catch{}
  await sleep(250);if(i===69)throw Error('P5 local static HTTP server unavailable');
 }
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--disable-dev-shm-usage']});
 const ctx=await browser.newContext({viewport:{width:915,height:412},deviceScaleFactor:3,isMobile:true,hasTouch:true,
  userAgent:'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 Chrome/128.0.0.0 Mobile Safari/537.36'});
 const page=await ctx.newPage();
 let networkAssetFailures=[];
 page.on('response',res=>{if(res.status()>=400&&/\/cobalt-hollow-lab\/(models|media|ui|textures|env|vfx|assets)\//.test(res.url()))networkAssetFailures.push({status:res.status(),url:res.url()});});
 await page.goto(base+'play.html?highfly_p3=1',{waitUntil:'domcontentloaded',timeout:60000});
 await page.locator('#mobile-preflight-continue').click({timeout:50000});
 await page.waitForFunction(()=>!!window.__game?.sim?.player && !!document.querySelector('canvas'),undefined,{timeout:120000});
 const state=await page.evaluate(()=>({player:window.__game.sim.player.name,level:window.__game.sim.player.level,
  canvas:document.querySelector('canvas')?.getBoundingClientRect().toJSON(),hud:document.getElementById('mobile-controls')?.getBoundingClientRect().toJSON(),
  icon:document.querySelector('#mobile-attack-nearest')?.getBoundingClientRect().toJSON()}));
 if(state.hud?.width<500 || state.hud?.height<200)throw Error('Game HUD hidden '+JSON.stringify(state));
 if(networkAssetFailures.length)throw Error('Public asset requests failed '+JSON.stringify(networkAssetFailures.slice(0,9)));
 const index=await fetch(base);if(!index.ok||(await index.text()).indexOf('HIGHFLY ORIGIN')<0)throw Error('Missing P5 root entry');
 console.log('[HIGHFLY P5 PAGES STATIC] PASS '+JSON.stringify(state)+'; static base, world and HUD OK');
 await ctx.close();
}catch(e){console.error('[HIGHFLY P5 PAGES STATIC] FAIL '+(e.stack||e));process.exitCode=1;
}finally{if(browser)await browser.close();shell.kill('SIGTERM');}
