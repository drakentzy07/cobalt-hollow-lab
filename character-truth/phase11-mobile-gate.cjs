/* HIGHFLY SKIN3 — Android landscape (S23 Ultra style CSS viewport) Playtest Gate.
 * Real original GLBs from upstream pin. Browser emulation ≠ physical S23.
 * No gameplay deploy, no game save, no new user-authored premium skin.
 */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const out=path.resolve('character-truth/phase11-mobile-proof');fs.mkdirSync(out,{recursive:true});
const results={phase:'HIGHFLY_SKIN3_PLAYTEST_MOBILE_READINESS',emulatedAndroid:true,
 physicalSamsungS23Ultra:false,realOriginalGLB:true,notPF6Gameplay:true,
 distinctPublicationStillRequired:true,pass:false,errors:[],checks:[],screenshots:[]};
function check(v,label){assert(v,label);results.checks.push(label);}
(async()=>{
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage']});
  const ctx=await browser.newContext({
   viewport:{width:915,height:412},deviceScaleFactor:2,isMobile:true,hasTouch:true,
   userAgent:'Mozilla/5.0 (Linux; Android 16; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36'
  });
  const page=await ctx.newPage();
  page.on('pageerror',e=>results.errors.push('page '+e.message));
  page.on('response',res=>{if(res.status()>=400)results.errors.push('HTTP '+res.status()+' '+res.url())});
  page.on('requestfailed',req=>results.errors.push('request '+req.url()+' '+req.failure()?.errorText));
  await page.goto('http://127.0.0.1:4173/character-truth/phase11-playtest.html',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.__HF_SKIN3_P10__?.ready||window.__HF_SKIN3_P10__?.getDiagnostics()?.errors?.length>0,
    null,{timeout:120000});
  const geo=await page.evaluate(()=>{
    const r=id=>{const a=document.querySelector(id).getBoundingClientRect();return {
      x:a.x,y:a.y,w:a.width,h:a.height,right:a.right,bottom:a.bottom
    }};
    return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,
      stage:r('#stage'),aside:r('aside'),easy:r('#skin3-easy'),advancedOpen:document.getElementById('skin3-advanced').open,
      webgl:!!window.__HF_SKIN3_CAGE__?.ready,
      body:window.__HF_SKIN3_P10__?.getState().gender,
      preview:window.__HF_SKIN3_CAGE__?.last?.parts?.length||0};
  });
  results.landscape=geo;
  check(geo.webgl,'authentic original GLB booted in emulated landscape browser');
  check(geo.preview>5,'real rigged mesh selected');
  check(geo.width>geo.height,'landscape mode active');
  check(geo.scrollWidth<=geo.width+3,'no page-wide horizontal clipping');
  check(geo.stage.w>400&&geo.stage.h>220,'3D preview stays useful in landscape');
  check(geo.aside.w>240&&geo.aside.h>220,'side controls stay usable in landscape');
  check(geo.stage.right<=geo.aside.x+3,'stage and controls do not overlap');
  check(geo.stage.bottom<=geo.height+5&&geo.aside.bottom<=geo.height+5,'both columns fit display');
  check(!geo.advancedOpen,'simple controls visible before advanced editor');
  check(geo.easy.w>225,'touch-first basic equip control panel fits');
  const screenshot=async id=>{
   await page.screenshot({path:path.join(out,id+'.png'),timeout:30000});
   results.screenshots.push(id+'.png');
  };
  await screenshot('01-mobile-hunter-original');
  await page.locator('#p10-item').selectOption('source-demo-1');
  await page.locator('#p10-equip').click();
  let state=await page.evaluate(()=>({s:window.__HF_SKIN3_P10__.getState(),
    v:window.__HF_SKIN3_P10__.getVisual(),mesh:window.__HF_SKIN3_CAGE__.last.parts.map(x=>x.name)}));
  check(state.s.equipment.chest?.itemId==='militia_vest','touch UI equips real source item ID');
  check(state.v.worn.chest==='knight'&&state.mesh.some(s=>s.startsWith('Armor_knight_')),
    'real original knight chest geometry appears on original Hunter');
  await screenshot('02-mobile-original-chest-equipped');
  await page.locator('#p10-gender').click();
  state=await page.evaluate(()=>({s:window.__HF_SKIN3_P10__.getState(),v:window.__HF_SKIN3_P10__.getVisual()}));
  check(state.s.gender==='female'&&state.v.nodes.includes('F_Torso'),'gender changes without losing item');
  await screenshot('03-mobile-female-original-chest');
  await page.locator('#p10-save').click();
  await page.locator('#p10-reset').click();
  check((await page.evaluate(()=>Object.keys(window.__HF_SKIN3_P10__.getState().equipment).length))===0,
    'user reset empties sample equipment');
  await page.locator('#p10-load').click();
  state=await page.evaluate(()=>({s:window.__HF_SKIN3_P10__.getState(),v:window.__HF_SKIN3_P10__.getVisual()}));
  check(state.s.equipment.chest?.itemId==='militia_vest','touch UI restores lab save state');
  await page.reload({waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.__HF_SKIN3_P10__?.ready,null,{timeout:120000});
  await page.locator('#p10-load').click();
  state=await page.evaluate(()=>({s:window.__HF_SKIN3_P10__.getState(),v:window.__HF_SKIN3_P10__.getVisual()}));
  check(state.s.gender==='female'&&state.v.worn.chest==='knight','mobile browser reload preserves sample visual');
  await page.locator('#p10-unequip-slot').selectOption('chest');
  await page.locator('#p10-unequip').click();
  state=await page.evaluate(()=>({s:window.__HF_SKIN3_P10__.getState(),v:window.__HF_SKIN3_P10__.getVisual()}));
  check(!state.s.equipment.chest&&state.v.worn.chest===null,'touch UI unequips armor visually');
  await screenshot('04-mobile-chest-unequipped');
  const err=await page.evaluate(()=>window.__HF_SKIN3_P10__.getDiagnostics().errors);
  check(err.length===0&&results.errors.length===0,'no browser errors and no missing assets');
  // Additional portrait viewport: report availability only, this is desktop-style standalone lab.
  await page.setViewportSize({width:412,height:915});
  const portrait=await page.evaluate(()=>({
   screen:[innerWidth,innerHeight],mainColumns:getComputedStyle(document.querySelector('main')).gridTemplateColumns,
   stageWidth:document.querySelector('#stage').getBoundingClientRect().width,
   scrollWidth:document.documentElement.scrollWidth
  }));
  results.portrait=portrait;
  check(portrait.stageWidth>=340&&portrait.scrollWidth<=412+3,'portrait fallback stays within viewport');
  await screenshot('05-mobile-portrait-fallback');
  results.pass=true;
  console.log('HIGHFLY_SKIN3_TOUCH_LANDSCAPE_ORIGINAL_PREVIEW_GREEN=1 CHECKS='+results.checks.length+
    ' CAPTURES='+results.screenshots.length+' PHYSICAL_S23_CERTIFIED=0 PUBLIC_GAME_MODIFIED=0');
  await ctx.close();
 }catch(e){results.failure=String(e.stack||e);console.error('MOBILE_PLAYTEST_GATE_FAIL',results.failure);throw e}
 finally{fs.writeFileSync(path.join(out,'mobile-readiness.json'),JSON.stringify(results,null,2));if(browser)await browser.close()}
})().catch(()=>process.exit(1));
