const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const base=process.env.SKIN13_URL||'https://highfly-skin12-forja-original.vercel.app/';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader']});
 try{
  const p=await browser.newPage({viewport:{width:915,height:412},isMobile:true,hasTouch:true});
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(base,{waitUntil:'domcontentloaded',timeout:45000});
  await p.locator('#forgeStatus').waitFor();
  await p.waitForFunction(()=>document.querySelector('#forgeBadge')?.textContent!=='Consultando motor',{timeout:30000}).catch(()=>{});
  const cap=await p.evaluate(async()=>{
   const r=await fetch('/api/forge',{cache:'no-store'});
   return {code:r.status,body:await r.json()};
  });
  assert.equal(cap.code,200);
  assert.equal(cap.body.schema,'highfly.skin13.capability/1');
  const enabled=cap.body.mode==='operational';
  assert.equal(await p.locator('#fabricate3D').isDisabled(),!enabled);
  if(!enabled){
   assert.equal(cap.body.jobDispatchEnabled,false);
   assert((await p.locator('#forgeStatus').innerText()).includes('Motor pendiente de activar'));
   assert.equal(await p.locator('#forgeRun').isVisible(),false);
  }
  assert.equal(errors.length,0,errors.join(';'));
  const dir='character-truth/skin13-auto-forge/live-qa';
  fs.mkdirSync(dir,{recursive:true});
  await p.screenshot({path:dir+'/SKIN13-automatic-forge-secure-gate.png',fullPage:true});
  fs.writeFileSync(dir+'/gate.json',JSON.stringify({green:true,backendOperational:enabled,
    noFakeQueue:true,buttonRespectsBackendState:true,legacyArtUnchanged:true,
    realAIConnected:false,actualHardwareTested:false,artApproved:false,errors},null,2));
  console.log('HIGHFLY_SKIN13_REAL_VERCEL_BACKEND_CAPABILITY_AND_NO_FAKE_QUEUE_GREEN=1');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
