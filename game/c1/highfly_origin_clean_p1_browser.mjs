/**
 * CLEAN P1: REAL compiled Hunter creator regression on S23 landscape emulation.
 * Both male/female must enter same ClaudeCraft world without original kit.
 * Strictly browser-only; does not publish or modify game saves/server.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const url='http://127.0.0.1:4173/cobalt-hollow-lab/';
const report={version:'CLEAN-R1-P1',pass:false,source:'physical S23 PENDING',
  variants:[],errors:[]};
let browser;
try{
  browser=await chromium.launch({channel:'chrome',headless:true});
  for(const gender of ['male','female']){
    const context=await browser.newContext({
      viewport:{width:844,height:390},screen:{width:844,height:390},
      deviceScaleFactor:3,hasTouch:true,isMobile:true,
      userAgent:'Mozilla/5.0 (Linux; Android 16; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Mobile Safari/537.36',
    });
    const page=await context.newPage(),err=[];
    page.on('pageerror',e=>err.push(String(e)));
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:40000});
    await page.locator('#hf-clean-gender-picker button[data-origin-gender="'+gender+'"]').waitFor({timeout:45000});
    await page.evaluate((value)=>{
      const btn=document.querySelector('#hf-clean-gender-picker button[data-origin-gender="'+value+'"]');
      btn?.click();
      const name=document.getElementById('hf-origin-name');
      if(name instanceof HTMLInputElement){
        name.value=value==='male'?'Hunter Male':'Hunter Female';
        name.dispatchEvent(new Event('input',{bubbles:true}));
      }
      document.querySelector('#hf-origin-entry button:last-of-type')?.click();
    },gender);
    await page.waitForFunction(()=>{
      const pre=document.getElementById('mobile-preflight');
      return !!window.__game?.sim?.player
        || document.body.classList.contains('mobile-preflight-open')
        || (!!pre && pre.classList.contains('visible'));
    },null,{timeout:110000});
    if(await page.locator('#mobile-preflight').isVisible().catch(()=>false)){
      await page.waitForFunction(()=>typeof document.getElementById('mobile-preflight-continue')?.onclick==='function',null,{timeout:15000});
      await page.evaluate(()=>document.getElementById('mobile-preflight-continue')?.click());
    }
    await page.waitForFunction(()=>!!window.__game?.sim?.player,null,{timeout:120000});
    const state=await page.evaluate(()=>{
      const sim=window.__game?.sim;
      return {
        origin:!!sim?.player?.originResources,
        gender:sim?.player?.modularAppearance?.gender??null,
        equipment:sim?.equipment??null,
        class:sim?.cfg?.playerClass??null,
        gameActive:document.body.classList.contains('game-active'),
        profile:document.body.classList.contains('hf-game-c1'),
      };
    });
    const entry={gender,...state,errors:err.slice(0,8)};
    report.variants.push(entry);
    await page.screenshot({path:'../clean-p1-'+gender+'.png',fullPage:true}).catch(()=>{});
    if(!entry.origin||entry.gender!==gender || !entry.gameActive ||
       entry.equipment?.mainhand||entry.equipment?.offhand||entry.equipment?.chest||err.length){
      throw Error('CLEAN_P1_BROWSER_REAL_HUNTER_IDENTITY_OR_STARTER_GEAR_RED '+JSON.stringify(entry));
    }
    await context.close();
  }
  report.pass=true;
  console.log('HIGHFLY_CLEAN_P1_TWO_GENDERS_REAL_UNARMED_HUNTER_S23_BROWSER_GREEN=1');
}catch(e){
  report.error=String(e);
  console.error('HIGHFLY_CLEAN_P1_BROWSER_RED',JSON.stringify(report,null,2));
  process.exitCode=1;
}finally{
  fs.writeFileSync('../clean-p1-s23-report.json',JSON.stringify(report,null,2));
  if(browser)await browser.close();
}
