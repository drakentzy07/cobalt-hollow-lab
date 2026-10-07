const {chromium}=require('playwright');
const fs=require('fs');
(async()=>{
  const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:1365,height:768},acceptDownloads:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto('http://127.0.0.1:4173/creator-lab/',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.__CREATOR_DIAG__?.ready||window.__CREATOR_DIAG__?.error,null,{timeout:120000});
  let d=await page.evaluate(()=>window.__CREATOR_DIAG__);
  if(d.error)throw Error('Bootstrap '+JSON.stringify(d));
  if(!d.nativeRig||!d.headReferenceReal||!d.realHead||!d.headParentOK||
    !d.rootIdentity||d.bones<20||d.clips!==22||d.sourceBytes!==3477500||
    d.sourceBlob!=='e3fb52b8e064ab3927f3bc34a5ba7d04e8d701c2'||
    d.featherCount!==4||d.geometries<6||d.nonfinite!==0||!d.sourceOriginalIntact)
    throw Error('Rig, asset or geometry contract '+JSON.stringify(d));
  await page.screenshot({path:'creator-proof/creator-desktop.png',fullPage:true});
  await page.click('#addBtn');
  d=await page.evaluate(()=>window.__CREATOR_DIAG__);
  if(d.featherCount!==5||d.undoDepth<1)throw Error('Add feather failed '+JSON.stringify(d));
  await page.click('#duplicateBtn');d=await page.evaluate(()=>window.__CREATOR_DIAG__);
  if(d.featherCount!==6)throw Error('Duplicate failed '+JSON.stringify(d));
  await page.click('#deleteBtn');d=await page.evaluate(()=>window.__CREATOR_DIAG__);
  if(d.featherCount!==5)throw Error('Delete failed '+JSON.stringify(d));
  await page.click('#undoBtn');d=await page.evaluate(()=>window.__CREATOR_DIAG__);
  if(d.featherCount!==6)throw Error('Undo failed '+JSON.stringify(d));
  await page.click('#redoBtn');d=await page.evaluate(()=>window.__CREATOR_DIAG__);
  if(d.featherCount!==5)throw Error('Redo failed '+JSON.stringify(d));
  const before=await page.evaluate(()=>window.__CREATOR_API__.getSelected().color);
  await page.locator('#color').evaluate(e=>{e.value='#b565f5';e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))});
  const after=await page.evaluate(()=>window.__CREATOR_API__.getSelected().color);
  if(after!=='#b565f5'||before===after)throw Error('Per-piece painting failed');
  await page.click('#saveBtn');d=await page.evaluate(()=>window.__CREATOR_DIAG__);
  if(!d.saved)throw Error('Save failed');
  await page.click('#resetBtn');d=await page.evaluate(()=>window.__CREATOR_DIAG__);
  if(d.featherCount!==4)throw Error('Reset failed');
  await page.click('#loadBtn');d=await page.evaluate(()=>window.__CREATOR_DIAG__);
  if(d.featherCount!==5)throw Error('Load failed');
  const paint=await page.evaluate(()=>window.__CREATOR_API__.getRecipe().pieces.some(p=>p.color==='#b565f5'));
  if(!paint)throw Error('Paint persistence failed');
  const size=await page.evaluate(()=>window.__CREATOR_API__.exportGLB(false));
  if(size<1500)throw Error('GLB export incomplete '+size);
  await page.screenshot({path:'creator-proof/creator-painted-desktop.png',fullPage:true});
  await page.setViewportSize({width:823,height:384});await page.waitForTimeout(300);
  const mobile=await page.evaluate(()=>({canvas:document.querySelector('#stage canvas').getBoundingClientRect().toJSON(),panel:document.querySelector('aside').getBoundingClientRect().toJSON()}));
  if(mobile.canvas.width<515||mobile.canvas.height<300||mobile.panel.width>292)throw Error('S23 stage too small '+JSON.stringify(mobile));
  await page.screenshot({path:'creator-proof/creator-s23-landscape.png',fullPage:true});
  if(errors.length)throw Error('Console errors '+errors.join(' | '));
  fs.writeFileSync('creator-proof/verify.json',JSON.stringify({green:true,nativeHead:true,clips:22,exportedBytes:size,mobile},null,2));
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
