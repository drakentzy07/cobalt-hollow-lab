// HIGHFLY GENESIS G1.1 — verify actual RG Poly partial city and explicit entry in headless Chromium.
import puppeteer from 'puppeteer-core';
import { BROWSER_PATH } from './browser_path.mjs';
const url=process.env.G11_URL??'http://127.0.0.1:4180/cobalt-hollow-lab/genesis/';
const browser=await puppeteer.launch({
  executablePath:BROWSER_PATH,
  headless:'new',
  protocolTimeout:180000,
  args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage',
        '--window-size=844,390','--use-gl=angle','--use-angle=swiftshader',
        '--enable-unsafe-swiftshader','--disable-gpu-sandbox'],
  defaultViewport:{width:844,height:390,isMobile:true,hasTouch:true,deviceScaleFactor:1},
});
const page=await browser.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
try {
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.__highflyGenesisG1?.realScenePrefabs>1000,{timeout:90000});
  const before=await page.evaluate(()=>({
    state:window.__highflyGenesisG1,
    button:document.getElementById('enter-world')?.textContent?.trim(),
    stored:localStorage.getItem('highfly.origin.primary.v1')
  }));
  if(before.button!=='ENTRAR A LA CIUDAD'||before.state?.mode!=='start'||
     before.state.realScenePrefabs<1000||before.state.collisions<1)
     throw Error('G11_ORIGINAL_CITY_NOT_LOADED '+JSON.stringify(before));
  if(before.stored)throw Error('G11_WRITES_ORIGINAL_DRAKEN_SAVE');
  await page.click('#enter-world');
  await page.waitForFunction(()=>window.__highflyGenesisG1?.mode==='exploring',{timeout:10000});
  await page.keyboard.down('w');
  // The standalone visual updates its QA state every 25 WebGL frames.
  // Software-rendered GitHub Chromium can take several seconds for 1981 meshes.
  await page.waitForFunction(()=>window.__highflyGenesisG1?.collisionChecks>0,{
      timeout:45000,polling:500,
    }).catch(()=>undefined);
  await page.keyboard.up('w');
  const after=await page.evaluate(()=>window.__highflyGenesisG1);
  if(errors.length)throw Error('G11_PAGE_ERRORS '+errors.join(' | '));
  if(after.mode!=='exploring'||after.collisionChecks<1)
    throw Error('G11_INPUT_OR_COLLISION_MISSING '+JSON.stringify(after));
  console.log('HIGHFLY_G11_ORIGINAL_PREFAB_CITY_AND_ENTRY_BROWSER_GREEN=1');
  console.log('G11_QA '+JSON.stringify({prefabs:after.realScenePrefabs,collisions:after.collisions,
      movementChecks:after.collisionChecks,position:after.player,mode:after.mode}));
}finally{await browser.close()}
