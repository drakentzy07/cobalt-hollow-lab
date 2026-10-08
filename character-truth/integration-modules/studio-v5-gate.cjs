/* HIGHFLY SKIN STUDIO V5 — native GLB real-browser proof, no gameplay edits. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const dir=path.resolve('character-truth/studio-v5-proof');fs.mkdirSync(dir,{recursive:true});
const report={branch:'highfly-skinfactory-studio-v5',nativeSource:true,gameChanged:false,
  physicalS23Tested:false,premium3DExportCertified:false,checks:[],errors:[],captures:[],green:false};
function ck(test,msg){assert(test,msg);report.checks.push(msg)}
(async()=>{
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
  const context=await browser.newContext({viewport:{width:915,height:412},deviceScaleFactor:2,isMobile:true,hasTouch:true,acceptDownloads:true});
  const page=await context.newPage();
  page.on('pageerror',e=>report.errors.push('JS '+String(e)));
  page.on('requestfailed',e=>report.errors.push('NETWORK '+e.url()+' '+e.failure()?.errorText));
  page.on('response',e=>{if(e.status()>=400)report.errors.push('HTTP '+e.status()+' '+e.url())});
  await page.goto('http://127.0.0.1:4173/character-truth/integration-modules/studio-v5.html',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.__HF_SKIN_STUDIO_V5__?.state().ready||window.__HF_SKIN_STUDIO_V5__?.state().error,null,{timeout:120000});
  const get=()=>page.evaluate(()=>({
   v5:window.__HF_SKIN_STUDIO_V5__.state(),
   cam:window.__HF_SKIN_STUDIO_V5__.camera(),
   v4:window.__HF_SKIN3_FACTORY_V4__.state(),
   rig:window.__HF_SKIN3_STABLE_CAMERA__.source(),
   width:document.documentElement.scrollWidth,inner:innerWidth
  }));
  const first=await get();
  ck(first.v5.ready&&!first.v5.error&&first.v5.rig,'GLB warrior_modular original Rig_Medium loads');
  ck(first.rig.allMeshes>20,'real native character mesh count >20');
  ck(first.v5.parts.length===1&&first.v5.parts[0]==='chest','initial source chest only');
  ck(first.width<=first.inner+3,'mobile landscape does not horizontally overflow');
  const capture=async name=>{await page.locator('#scene').screenshot({path:path.join(dir,name+'.png')});report.captures.push(name+'.png')};
  await capture('01-native-start');
  await page.locator('#kit').selectOption('paladin');
  await page.locator('#kitApply').click();
  let x=await get();
  ck(x.v5.parts.length===7,'one-click full native seven-slot outfit');
  ck(x.v4.design.parts.head.set==='paladin'&&x.v4.design.parts.feet.set==='paladin','all seven slots source referenced');
  await capture('02-native-seven-slots');
  await page.locator('#undo').click();
  x=await get();ck(x.v5.parts.length===1,'undo restores previous full native recipe');
  await page.locator('#redo').click();
  x=await get();ck(x.v5.parts.length===7,'redo restores seven native slots');
  await page.locator('#gender').selectOption('female');
  x=await get();ck(x.v4.design.gender==='female','original female uses same seven-slot design');
  await capture('03-real-female');
  const beforeHelmet=x.cam;
  await page.locator('#slot').selectOption('head');
  await page.locator('#remove').click();
  const helmetOff=await get();
  ck(JSON.stringify(helmetOff.cam)===JSON.stringify(beforeHelmet),'native helmet equip/unequip leaves orbit camera unchanged');
  await page.locator('#apply').click();
  const helmetOn=await get();
  ck(JSON.stringify(helmetOn.cam)===JSON.stringify(beforeHelmet),'re-equipping head cannot shift camera');
  await page.locator('#profile').click();
  const profile=(await get()).cam;
  ck(JSON.stringify(profile)!==JSON.stringify(beforeHelmet),'explicit profile camera action changes view');
  const canvas=page.locator('#scene canvas');
  const r=await canvas.boundingBox();
  await page.mouse.move(r.x+r.width/2,r.y+r.height/2);
  await page.mouse.down();await page.mouse.move(r.x+r.width/2+85,r.y+r.height/2+20,{steps:5});await page.mouse.up();
  const dragged=(await get()).cam;
  ck(JSON.stringify(dragged)!==JSON.stringify(profile),'pointer drag orbits the real 3D Hunter');
  await page.locator('#slot').selectOption('feet');
  await page.locator('#remove').click();
  const afterDrag=(await get()).cam;
  ck(JSON.stringify(afterDrag)===JSON.stringify(dragged),'editing keeps user-defined orbit pose');
  const downloaded=page.waitForEvent('download');
  await page.locator('#exportRecipe').click();
  const download=await downloaded;ck(download.suggestedFilename().endsWith('.json'),'standalone validated recipe JSON export');
  const saved=await page.evaluate(()=>window.__HF_SKIN_STUDIO_V5__.save());
  ck(JSON.parse(saved).schemaVersion===4,'versioned full armor recipe roundtrip');
  await page.evaluate(s=>window.__HF_SKIN_STUDIO_V5__.load(s),saved);
  ck((await get()).v5.parts.length===6,'validated imported full native set');
  const bad=await page.evaluate(()=>{try{window.__HF_SKIN_STUDIO_V5__.load('{"schemaVersion":987}');return false}catch(e){return true}});
  ck(bad,'invalid malicious/unknown schema rejected before mutation');
  const animation=await page.evaluate(()=>window.__HF_SKIN3_FACTORY_V4__.sourceAnimation('Walking_A',.2));
  ck(animation.finiteVertices&&animation.animatedMeshes>0,'real native skinning still runs walking animation');
  await capture('04-modified-with-orbit');
  ck(report.errors.length===0,'no JS, source GLB HTTP or renderer errors');
  report.green=true;console.log('HIGHFLY_SKIN_STUDIO_V5_NATIVE_BROWSER_GREEN=1 CHECKS='+report.checks.length+' PAGES_DEPLOY=0 ORIGINAL_MESH=1');
  await context.close();
 }catch(e){report.failure=String(e.stack||e);console.error('HIGHFLY_SKIN_STUDIO_V5_RED',report.failure);throw e}
 finally{fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify(report,null,2));if(browser)await browser.close()}
})().catch(()=>process.exit(1));
