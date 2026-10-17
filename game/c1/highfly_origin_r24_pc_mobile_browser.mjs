/** R24 opt-in: real WebGL game, native action ring on PC+S23; NO DEPLOY. */
import {chromium} from 'playwright';
import fs from 'node:fs';
const url='http://127.0.0.1:4173/cobalt-hollow-lab/?hf_r24=1';
const report={version:'R24-P0',url,status:'running',cases:[],error:null,
  note:'PC mouse + S23 simulated Chromium; physical device acceptance pending'};
let browser;
try {
  browser=await chromium.launch({channel:'chrome',headless:true});
  for(const device of [
    {name:'pc',width:1440,height:810,scale:1,touch:false,mobile:false,gender:'male'},
    {name:'s23',width:844,height:390,scale:3,touch:true,mobile:true,gender:'female'},
  ]) {
    const context=await browser.newContext({
      viewport:{width:device.width,height:device.height},
      screen:{width:device.width,height:device.height},
      deviceScaleFactor:device.scale,hasTouch:device.touch,isMobile:device.mobile,
      ...(device.mobile?{userAgent:'Mozilla/5.0 (Linux; Android 16; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Mobile Safari/537.36'}:{}),
    });
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
    await page.locator('#hf-clean-gender-picker button[data-origin-gender="'+device.gender+'"]').waitFor({timeout:50000});
    await page.evaluate(gender=>{
      document.querySelector('#hf-clean-gender-picker button[data-origin-gender="'+gender+'"]')?.click();
      const name=document.getElementById('hf-origin-name');
      if(name instanceof HTMLInputElement){
        name.value=gender==='male'?'Alpha Hunter':'Beta Hunter';
        name.dispatchEvent(new Event('input',{bubbles:true}));
      }
      document.querySelector('#hf-origin-entry > button')?.click();
    },device.gender);
    await page.waitForFunction(()=>!!window.__game?.sim?.player||
       document.body.classList.contains('mobile-preflight-open'),null,{timeout:120000});
    if(await page.locator('#mobile-preflight').isVisible().catch(()=>false)){
      await page.waitForFunction(()=>
        typeof document.getElementById('mobile-preflight-continue')?.onclick==='function',
        null,{timeout:15000});
      await page.evaluate(()=>document.getElementById('mobile-preflight-continue')?.click());
    }
    await page.waitForFunction(()=>!!window.__game?.sim?.player &&
      document.body.classList.contains('game-active'),null,{timeout:120000});
    await page.waitForTimeout(1200);
    const found=await page.evaluate(()=>{
      const visible=el=>{
        if(!el)return false;
        const s=getComputedStyle(el),r=el.getBoundingClientRect();
        return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;
      };
      const slots=[...document.querySelectorAll('#mobile-action-ring .mobile-action-slot')];
      return {
        preview:document.body.classList.contains('hf-r24-preview'),
        desktop:document.body.classList.contains('hf-r24-desktop'),
        touchLayout:document.body.classList.contains('mobile-touch'),
        nativeMobileRing:visible(document.getElementById('mobile-action-ring')),
        slots:slots.length,visibleSlots:slots.filter(visible).length,
        attack:visible(document.getElementById('mobile-action-attack')),
        pageToggle:visible(document.getElementById('mobile-action-page-toggle')),
        joystick:visible(document.getElementById('mobile-move-joystick')),
        gender:window.__game.sim.player.modularAppearance?.gender??null,
        equipment:window.__game.sim.equipment??null,
        origin:!!window.__game.sim.player.originResources,
      };
    });
    const passed=found.preview && found.desktop===!device.mobile &&
       found.touchLayout && found.nativeMobileRing && found.slots===4 &&
       found.visibleSlots===4 && found.attack && !found.pageToggle &&
       found.joystick===device.mobile && found.gender===device.gender &&
       found.origin && !found.equipment?.chest && !found.equipment?.mainhand &&
       !found.equipment?.offhand && !errors.length;
    const entry={device:device.name,passed,found,errors:errors.slice(0,5)};
    report.cases.push(entry);
    await page.screenshot({path:'../hf-r24-'+device.name+'.png',fullPage:false}).catch(()=>{});
    await context.close();
    if(!passed)throw new Error('R24_LAYOUT_S23_PC_RED '+JSON.stringify(entry));
  }
  report.status='GREEN';
  console.log('HIGHFLY_R24_PC_WASD_S23_SHARED_NATIVE_4BASE_RING_GREEN=1');
}catch(e){
  report.status='RED';
  report.error=String(e);
  console.error('HIGHFLY_R24_BROWSER_RED',JSON.stringify(report,null,2));
  process.exitCode=1;
}finally{
  fs.writeFileSync('../highfly-r24-browser-report.json',JSON.stringify(report,null,2));
  if(browser)await browser.close();
}