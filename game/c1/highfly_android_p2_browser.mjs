/** ANDROID P2 native HUD E2E: two Hunter bodies, R23 GOLDEN, 4 BASE on S23 only. */
import {chromium} from 'playwright';
import fs from 'node:fs';

const url='http://127.0.0.1:4173/cobalt-hollow-lab/?hf_android_p2=1';
const report={version:'HIGHFLY-ANDROID-P2',url,pass:false,device:'emulated Samsung S23 Ultra landscape, physical device not yet tested',hunters:[],failure:null};
let browser;
try {
  browser=await chromium.launch({channel:'chrome',headless:true});
  for(const gender of ['male','female']) {
    const context=await browser.newContext({
      viewport:{width:844,height:390},screen:{width:844,height:390},
      deviceScaleFactor:3,isMobile:true,hasTouch:true,
      userAgent:'Mozilla/5.0 (Linux; Android 16; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Mobile Safari/537.36',
    });
    const page=await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
    await page.locator('#hf-clean-gender-picker button[data-origin-gender="'+gender+'"]').waitFor({timeout:50000});
    await page.evaluate(sex=>{
      document.querySelector('#hf-clean-gender-picker button[data-origin-gender="'+sex+'"]')?.click();
      const el=document.getElementById('hf-origin-name');
      if(el instanceof HTMLInputElement){
        el.value=sex==='male'?'Hunter Male':'Hunter Female';
        el.dispatchEvent(new Event('input',{bubbles:true}));
      }
      document.querySelector('#hf-origin-entry > button')?.click();
    },gender);
    await page.waitForFunction(()=>!!window.__game?.sim?.player||
      document.body.classList.contains('mobile-preflight-open')||
      document.getElementById('mobile-preflight')?.classList.contains('visible'),
      null,{timeout:110000});
    if(await page.locator('#mobile-preflight').isVisible().catch(()=>false)){
      await page.waitForFunction(()=>
        typeof document.getElementById('mobile-preflight-continue')?.onclick==='function',
        null,{timeout:15000});
      await page.evaluate(()=>document.getElementById('mobile-preflight-continue')?.click());
    }
    await page.waitForFunction(()=>!!window.__game?.sim?.player &&
      document.body.classList.contains('game-active'),null,{timeout:120000});
    const found=await page.evaluate(()=>{
      const sim=window.__game.sim;
      const visible=el=>{
        if(!el)return false;
        const rect=el.getBoundingClientRect(),cs=getComputedStyle(el);
        if(cs.display==='none'||cs.visibility==='hidden'||rect.width<=0||rect.height<=0)return false;
        for(let cur=el.parentElement;cur;cur=cur.parentElement){
          const p=getComputedStyle(cur);
          if(p.display==='none'||p.visibility==='hidden')return false;
        }
        return true;
      };
      const slots=[...document.querySelectorAll('#mobile-action-ring .mobile-action-slot')];
      return {
        androidP2:document.body.classList.contains('hf-android-p2'),
        touch:document.body.classList.contains('mobile-touch'),
        gameActive:document.body.classList.contains('game-active'),
        origin:!!sim.player.originResources,
        gender:sim.player.modularAppearance?.gender??null,
        equipment:sim.equipment,
        controls:visible(document.getElementById('mobile-controls')),
        moveJoystick:visible(document.getElementById('mobile-move-joystick')),
        ring:visible(document.getElementById('mobile-action-ring')),
        slots:slots.length,visibleSlots:slots.filter(visible).length,
        attack:visible(document.getElementById('mobile-action-attack')),
        pageToggle:visible(document.getElementById('mobile-action-page-toggle')),
        hasHiddenUniqueSlot:!!document.querySelector('[id*="origin-unique-slot"],[id*="hf-unique-locked"]'),
      };
    });
    const okay=found.androidP2&&found.touch&&found.gameActive&&found.origin &&
      found.gender===gender&&!found.equipment?.mainhand&&!found.equipment?.offhand &&
      !found.equipment?.chest&&found.controls&&found.moveJoystick&&found.ring &&
      found.slots===4&&found.visibleSlots===4&&found.attack&&!found.pageToggle &&
      !found.hasHiddenUniqueSlot&&errors.length===0;
    const entry={gender,pass:okay,found,errors:errors.slice(0,6)};
    report.hunters.push(entry);
    await page.screenshot({path:'../highfly-android-p2-'+gender+'.png',fullPage:false}).catch(()=>{});
    await context.close();
    if(!okay)throw Error('HIGHFLY_ANDROID_P2_HUD_BROWSER_RED '+JSON.stringify(entry));
  }
  report.pass=true;
  console.log('HIGHFLY_ANDROID_P2_NATIVE_4BASE_HUNTER_MALE_FEMALE_S23_BROWSER_GREEN=1');
}catch(e){
  report.failure=String(e);
  console.error('HIGHFLY_ANDROID_P2_BROWSER_RED '+JSON.stringify(report,null,2));
  process.exitCode=1;
}finally{
  fs.writeFileSync('../highfly-android-p2-report.json',JSON.stringify(report,null,2));
  if(browser)await browser.close();
}
