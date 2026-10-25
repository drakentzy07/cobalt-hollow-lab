/* C7: S23-sized WebGL smoke test of actual Vite build.
   Captures real UI: entry + canvas + touch HUD, not an illustrated mock.
   No screenshots or assets are publicly deployed.
*/
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const root=path.resolve(process.argv[2]||'.');
const out=path.resolve(process.argv[3]||'../hf-c7-screens');
fs.mkdirSync(out,{recursive:true});
const {chromium}=createRequire(path.join(root,'package.json'))('@playwright/test');
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--no-sandbox']});
const ctx=await browser.newContext({viewport:{width:915,height:412},isMobile:true,hasTouch:true,
 deviceScaleFactor:1,userAgent:'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 Chrome/129.0.0.0 Mobile Safari/537.36'});
const p=await ctx.newPage();
const errors=[],badPaths=[];
p.on('pageerror',e=>errors.push(e.message));
p.on('response',r=>{if(r.status()>=400 && /\.(glb|webp|png|jpg|js|css)$/i.test(r.url()))badPaths.push({status:r.status(),url:r.url()})});
let entryVisible=false,worldLoaded=false,hudVisible=false,canvasCount=0,buttonIds=[];
try{
 await p.goto('http://127.0.0.1:4173/cobalt-hollow-lab/',{waitUntil:'domcontentloaded',timeout:30000});
 await p.waitForSelector('#hf-reborn-entry',{state:'visible',timeout:20000});
 entryVisible=true;
 await p.screenshot({path:path.join(out,'01-hf-reborn-intro-915x412.png')});
 await p.locator('#hf-reborn-hunter-name').fill('Tester');
 await p.locator('#hf-reborn-enter-world').tap();
 await p.waitForFunction(()=>document.body.classList.contains('game-active'),null,{timeout:40000});
 worldLoaded=true;
 await p.waitForTimeout(2500);
 canvasCount=await p.locator('canvas').count();
 hudVisible=await p.locator('#hf-reborn-hud').isVisible().catch(()=>false);
 for(const button of ['mobile-action-attack','mobile-evade','mobile-jump','mobile-interact']){
  if(await p.locator('#'+button).count())buttonIds.push(button);
 }
 await p.screenshot({path:path.join(out,'02-hf-reborn-world-915x412.png')});
 if(hudVisible)await p.locator('#hf-reborn-hud').screenshot({path:path.join(out,'03-hf-reborn-hud.png')});
 // True native DOM interaction only; does not claim physical Android gestures.
 if(hudVisible){
  await p.locator('#mobile-jump').tap({timeout:7000});
  await p.locator('#mobile-evade').tap({timeout:7000});
  await p.screenshot({path:path.join(out,'04-hf-reborn-after-jump-dash.png')});
 }
}catch(e){
 errors.push('QA_SMOKE: '+String(e));
 await p.screenshot({path:path.join(out,'99-failed-state.png')}).catch(()=>{});
}finally{
 const report={entryVisible,worldLoaded,hudVisible,canvasCount,buttonIds,errors,badPaths:badPaths.slice(0,50),
  physicalS23Verified:false,licenseReleaseReady:false,meaning:'Headless Chromium mobile WebGL smoke; NOT true phone test'};
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log('HIGHFLY_C7_BROWSER_SMOKE='+JSON.stringify(report));
 await browser.close();
 if(!entryVisible||!worldLoaded||!hudVisible||canvasCount===0 || errors.length || buttonIds.length!==4 || badPaths.length)process.exitCode=1;
}
