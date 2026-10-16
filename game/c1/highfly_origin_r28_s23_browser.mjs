/** R28-specific Samsung S23 Chrome emulation: real ORIGINAL Hunter
 * entry, universal grimoire touch selector, same Sim level-up, ATK restore.
 * No synthetic skill damage and no public deploy.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
const URL='http://127.0.0.1:4173/cobalt-hollow-lab/';
const qa={entry:false,grimorio:false,premium23:false,atkNative:false,lv2:false,
  restored:false,pageErrors:[],status:'pending'};
let browser;
try{
 browser=await chromium.launch({channel:'chrome',headless:true});
 const context=await browser.newContext({
   viewport:{width:844,height:390},screen:{width:844,height:390},
   deviceScaleFactor:3,isMobile:true,hasTouch:true,
   userAgent:'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Mobile Safari/537.36'
 });
 const page=await context.newPage();
 page.on('pageerror',e=>qa.pageErrors.push(String(e)));
 await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
 await page.locator('#hf-origin-entry').waitFor({state:'attached',timeout:35000});
 await page.locator('#hf-origin-name').fill('Rtwentyeight');
 await page.evaluate(()=>document.querySelector('#hf-origin-entry button')?.click());
 for(let i=0;i<90;i++){
   const state=await page.evaluate(()=>{
     const b=document.querySelector('#mobile-preflight-continue');
     return {preflight:b instanceof HTMLElement&&
       b.getBoundingClientRect().height>0&&getComputedStyle(b).display!=='none',
       loaded:!!window.__game?.sim?.player};
   });
   if(state.preflight)await page.evaluate(()=>document.querySelector('#mobile-preflight-continue')?.click());
   if(state.loaded)break;
   await page.waitForTimeout(700);
 }
 await page.waitForFunction(()=>!!window.__game?.sim?.player,null,{timeout:100000});
 qa.entry=true;
 await page.locator('#hf-r28-universal-tester').waitFor({state:'attached',timeout:30000});
 await page.locator('#hf-r28-universal-tester > button').click();
 await page.locator('#hf-r28-grimoire').waitFor({state:'visible',timeout:15000});
 qa.grimorio=true;
 const premiumTab=page.locator('#hf-r28-grimoire button').filter({hasText:'PREMIUM · 23'}).first();
 await premiumTab.click();
 qa.premium23=await page.locator('#hf-r28-scroll button').count()>=23 &&
   await page.evaluate(()=>[...document.querySelectorAll('#hf-r28-scroll button')].every(x=>x.disabled));
 if(!qa.premium23)throw Error('R28 premium data catalog not clearly pending 23/23');
 await page.locator('#hf-r28-grimoire button').filter({hasText:'CLAUDE ORIGINAL'}).first().click();
 await page.locator('#hf-r28-grimoire input').fill('meteor');
 const meteor=page.locator('#hf-r28-scroll button').filter({hasText:'Meteoro'}).first();
 await meteor.waitFor({state:'visible',timeout:10000});
 await meteor.click();
 qa.atkNative=await page.evaluate(()=>{
   const sim=window.__game?.sim;
   const btn=document.querySelector('[data-r28-skill="meteor"]');
   return !!sim&&!!btn&&sim.known.map(k=>k.def.id).join(',')==='meteor'&&
     sim.player.autoAttack===false;
 });
 if(!qa.atkNative)throw Error('ATK selected skill mismatch or native attack still active');
 qa.lv2=await page.evaluate(()=>{
   const sim=window.__game?.sim;
   sim.setPlayerLevel(2);
   return sim.player.level===2&&sim.known.map(k=>k.def.id).join(',')==='meteor'&&
      (sim.players.get(sim.playerId)?.originHunter?.learnedSkillIds?.length??-1)===0;
 });
 if(!qa.lv2)throw Error('R28 LV2 lost ephemeral skill or saved a fake unlock');
 await page.locator('#hf-r28-universal-tester > button').click();
 await page.locator('#hf-r28-grimoire').waitFor({state:'visible',timeout:10000});
 await page.locator('#hf-r28-grimoire button').filter({hasText:'VOLVER A ATK NORMAL'}).click();
 qa.restored=await page.evaluate(()=>{
   const sim=window.__game?.sim;
   return sim.known.length===0&&!document.querySelector('[data-r28-skill="meteor"]');
 });
 if(!qa.restored)throw Error('ATK normal restore did not clear trial skill');
 if(qa.pageErrors.length)throw Error('Browser runtime JS errors '+JSON.stringify(qa.pageErrors));
 qa.status='green';
} catch(e){
 qa.status='failed';qa.error=String(e);
} finally {
 fs.writeFileSync('highfly-r28-s23-browser-report.json',JSON.stringify(qa,null,2));
 await browser?.close().catch(()=>{});
}
console.log('HIGHFLY_R28_S23_BROWSER_REAL_UI='+JSON.stringify(qa));
if(qa.status!=='green')process.exitCode=1;
