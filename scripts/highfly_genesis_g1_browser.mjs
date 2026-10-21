// Actual Chromium/SwiftShader touch smoke: G1 preview cannot silently fake RG Poly.
import puppeteer from 'puppeteer-core';
import { BROWSER_PATH } from './browser_path.mjs';
const url=process.env.G1_BROWSER_URL??'http://127.0.0.1:4173/cobalt-hollow-lab/genesis/';
const browser=await puppeteer.launch({
  executablePath:BROWSER_PATH,headless:'new',protocolTimeout:120000,
  args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage',
    '--window-size=844,390','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],
  defaultViewport:{width:844,height:390,isMobile:true,hasTouch:true,deviceScaleFactor:1},
});
const page=await browser.newPage(),errs=[];
page.on('pageerror',e=>errs.push(e.message));
try {
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.__highflyG1?.mode==='blocked',{timeout:50000});
  const initial=await page.evaluate(()=>({
    mode:window.__highflyG1.mode,real:window.__highflyG1.realMapLoaded,
    saved:localStorage.getItem('highfly.origin.primary.v1'),
    control:window.__highflyG1.inputReady,
  }));
  if(initial.mode!=='blocked'||initial.real||!initial.control)throw Error('G1 FAIL CLOSED '+JSON.stringify(initial));
  await page.click('#diag-btn');
  await page.waitForFunction(()=>window.__highflyG1?.mode==='calibration',{timeout:5000});
  await page.keyboard.down('KeyW').catch(()=>{}); // fallback to standard 'w'
  await page.keyboard.down('w');
  await new Promise(resolve=>setTimeout(resolve,600));
  await page.keyboard.up('w');
  const mid=await page.evaluate(()=>({state:window.__highflyG1,headline:document.querySelector('#mode')?.textContent}));
  if(mid.state.mode!=='calibration'||mid.state.realMapLoaded||!mid.headline.includes('no es RG Poly')||mid.state.frame<3)throw Error('G1 DIAG INVALID '+JSON.stringify(mid));
  if(mid.state.position.z<=-39)throw Error('G1 MOVEMENT NOT CAMERA RELATIVE '+JSON.stringify(mid.state.position));
  await page.keyboard.press('Space');
  await new Promise(resolve=>setTimeout(resolve,90));
  const after=await page.evaluate(()=>window.__highflyG1);
  if(after.collisionChecks<1)throw Error('G1 COLLISION NOT EXERCISED');
  if(errs.length)throw Error('G1 CONSOLE ERRORS '+errs.join(' | '));
  console.log('HIGHFLY_G1_CHROMIUM_TOUCH_EXPLORATION_QA_GREEN=1',JSON.stringify({
    mode:after.mode,frame:after.frame,position:after.position,collisionChecks:after.collisionChecks,
    note:'procedural calibration ONLY; authentic RG Poly asset not yet present'
  }));
} finally {await browser.close();}
