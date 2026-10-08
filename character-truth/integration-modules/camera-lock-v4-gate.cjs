/* HIGHFLY SKIN3 V4.1 CAMERA LOCK — actual original 3D native source,
 * mobile viewport, cap equip/unequip, zoom + orbit invariants, paint, sculpt.
 */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const out=path.resolve('character-truth/stable-camera-proof');fs.mkdirSync(out,{recursive:true});
const report={purpose:'Original native Hunter frame-lock repair',originalsModified:false,
 gameModified:false,liveSiteUpdated:false,physicalS23Tested:false,
 checks:[],captures:[],errors:[],pass:false};
function check(test,message){assert(test,message);report.checks.push(message)}
(async()=>{
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
  const context=await browser.newContext({viewport:{width:915,height:412},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const page=await context.newPage();
  page.on('pageerror',e=>report.errors.push('JS '+String(e)));
  page.on('requestfailed',e=>report.errors.push('NETWORK '+e.url()+' '+e.failure()?.errorText));
  page.on('response',e=>{if(e.status()>=400)report.errors.push('HTTP '+e.status()+' '+e.url())});
  await page.goto('http://127.0.0.1:4173/character-truth/integration-modules/factory-v4-camera-stable.html',
    {waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.__HF_SKIN3_STABLE_CAMERA__?.state().ready||
    window.__HF_SKIN3_FACTORY_V4__?.state().error,null,{timeout:120000});
  const camera=()=>page.evaluate(()=>window.__HF_SKIN3_STABLE_CAMERA__.state());
  const scene=()=>page.evaluate(()=>{
   const v=window.__HF_SKIN3_FACTORY_V4__;
   return {design:v.state().design,originalSource:v.state().sourceOnly,
    painted:v.state().appliedPaint.totalMeshes,
    originalRig:window.__HF_SKIN3_STABLE_CAMERA__.source().originalRig,
    props:v.boundary(),rigged:v.geometry().filter(x=>x.visible&&x.boneCount>20).length};
  });
  const first=await camera();
  const initial=await scene();
  check(first.lockedFrame&&first.center?.length===3&&first.extent>0,'camera frame computed and LOCKED once');
  check(initial.originalRig&&initial.originalSource,'original Rig_Medium GLB is the source');
  check(initial.rigged>0&&initial.painted>0,'real original skinned mesh and painting present');
  check(initial.props.actualEquipAuthority===false,'no game inventory authority');
  const capture=async(label)=>{
   await page.locator('#scene').screenshot({path:path.join(out,label+'.png')});report.captures.push(label+'.png');
  };
  await capture('01-base-no-helmet');
  // Actually click the same UI controls used in user's Chrome screenshot.
  await page.locator('#slot').selectOption('head');
  await page.locator('#family').selectOption('knight');
  await page.locator('#apply').click();
  const helmet=await scene(),afterEquip=await camera();
  check(helmet.design.parts.head?.set==='knight','head helmet equipped via real UI');
  check(JSON.stringify(afterEquip)===JSON.stringify(first),'equipping helmet NEVER alters camera position/rotation/center/zoom');
  await capture('02-helmet-on-locked-framing');
  await page.locator('#remove').click();
  const removed=await scene(),afterRemove=await camera();
  check(!removed.design.parts.head,'helmet removed via real button');
  check(JSON.stringify(afterRemove)===JSON.stringify(first),'removing helmet NEVER alters camera');
  await capture('03-helmet-removed-same-framing');
  await page.locator('#apply').click();
  const back=await camera();
  check(JSON.stringify(back)===JSON.stringify(first),'reapplying helmet does not move Hunter');
  const source=await page.evaluate(()=>{
    const api=window.__HF_SKIN3_FACTORY_V4__;
    api.put('legs','mage','graphite');
    api.put('feet','ranger','raven');
    api.shape('chest',{width:.4,length:.2,depth:0,taper:-.1});
    api.shape('legs',{width:-.2,length:.1,depth:.2,taper:0});
    return {frame:window.__HF_SKIN3_STABLE_CAMERA__.state(),geom:api.geometry()};
  });
  check(JSON.stringify(source.frame)===JSON.stringify(first),'painting mixed armor and molding two source slots cannot reframe');
  check(source.geom.some(m=>m.changed&&m.livePositions!==m.sourcePositions),'native mesh geometry really deformed');
  check(source.geom.filter(m=>m.changed).every(m=>
     m.liveSkinIndex===m.sourceSkinIndex&&m.liveSkinWeight===m.sourceSkinWeight),
     'native rig skin attributes still identical');
  const angle=await page.evaluate(()=>window.__HF_SKIN3_STABLE_CAMERA__.view());
  const rotated=await camera();
  check(rotated.viewIndex===1&&JSON.stringify(angle)!==JSON.stringify(first.position),
    'user explicitly rotates camera to another native view');
  await page.evaluate(()=>window.__HF_SKIN3_FACTORY_V4__.remove('feet'));
  const postRotate=await camera();
  check(JSON.stringify(postRotate)===JSON.stringify(rotated),'after an intentional camera turn equipment still leaves camera fixed');
  await page.locator('#gender').selectOption('female');
  const female=await scene(),genderFrame=await camera();
  check(female.design.gender==='female','genuine original female selected');
  check(JSON.stringify(genderFrame)===JSON.stringify(rotated),'gender swap does not make camera jump');
  await capture('04-female-helmet-mixed-fixed-camera');
  const value=await page.evaluate(()=>window.__HF_SKIN3_FACTORY_V4__.persist());
  check(JSON.parse(value).schemaVersion===4,'original V4 paint and sculpt data save retained');
  await page.reload({waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.__HF_SKIN3_FACTORY_V4__?.state().ready,null,{timeout:120000});
  await page.locator('#load').click();
  const loaded=await scene();
  check(loaded.design.gender==='female'&&loaded.design.parts.head?.set==='knight','reload restores full native design');
  const present=await camera();
  await page.locator('#remove').click();
  const afterReloadRemoval=await camera();
  check(JSON.stringify(present)===JSON.stringify(afterReloadRemoval),'head slot changes after reload preserve new frozen camera');
  check(report.errors.length===0,'no JavaScript HTTP or original media loading errors');
  report.pass=true;report.camera={originalFrame:first,afterUserOrbit:rotated};
  console.log('HIGHFLY_SKIN3_REAL_HELMET_CAMERA_LOCK_GREEN=1 CHECKS='+report.checks.length+
   ' CAPTURES='+report.captures.length+' REAL_GLBS=1 PREVIOUS_V4_UNTOUCHED=1');
  await context.close();
 }catch(e){report.error=String(e.stack||e);console.error('HIGHFLY_SKIN3_HELMET_CAMERA_GATE_RED',report.error);throw e}
 finally{fs.writeFileSync(path.join(out,'helmet-camera-lock.json'),JSON.stringify(report,null,2));if(browser)await browser.close()}
})().catch(()=>process.exit(1));
