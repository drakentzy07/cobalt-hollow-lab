const {chromium}=require('playwright');
const fs=require('fs');
const gltfValidator=require('gltf-validator');
(async()=>{
  const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:1365,height:768},acceptDownloads:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto('http://127.0.0.1:4173/creator-lab/',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.__CREATOR_DIAG__?.ready||window.__CREATOR_DIAG__?.error,null,{timeout:25000}).catch(async err=>{
    const state=await page.evaluate(()=>({
      location:location.href,readyState:document.readyState,
      diagnostic:window.__CREATOR_DIAG__||null,
      body:document.querySelector('#status')?.textContent,
      scripts:[...document.querySelectorAll('script')].map(s=>s.src).filter(Boolean)
    }));
    fs.writeFileSync('creator-proof/bootstrap-error.json',JSON.stringify({state,errors},null,2));
    throw Error('Creator bootstrap failed: '+JSON.stringify({message:err.message,errors,state}));
  });
  let d=await page.evaluate(()=>window.__CREATOR_DIAG__);
  if(d.error)throw Error('Bootstrap '+JSON.stringify(d));
  if(!d.nativeRig||!d.headReferenceReal||!d.realHead||!d.headParentOK||
    !d.rootIdentity||d.bones<20||d.clips!==22||d.sourceBytes!==3477500||
    d.sourceBlob!=='e3fb52b8e064ab3927f3bc34a5ba7d04e8d701c2'||
    d.featherCount!==4||d.geometries<32||d.nonfinite!==0||!d.sourceOriginalIntact||
    !d.helmetReady||!d.helmetAttached||!d.helmetVisible||d.helmetMeshCount<28||
    d.helmetPartCount!==9||d.helmetColorCount<6||!d.headFacesHidden)
    throw Error('Rig, asset or geometry contract '+JSON.stringify(d));
  if(!d.faceLandmarksVerified||d.landmarkCount<2||!Number.isFinite(d.nativeEyeY))
    throw Error('Real facial mesh landmarks missing '+JSON.stringify(d));
  if(!d.fullFaceFitted||d.faceFitParts<7||!d.faceFitCoverage?.eyes)
    throw Error('Whole-mask anatomy fit missing '+JSON.stringify({
      fullFaceFitted:d.fullFaceFitted,parts:d.faceFitParts,coverage:d.faceFitCoverage
    }));
  if(!d.quality?.valid||!d.quality?.mobileBudget||d.quality.invalid>0)
    throw Error('Native helmet geometry QA '+JSON.stringify(d.quality));
  const landmarks=await page.evaluate(()=>window.__CREATOR_API__.getLandmarks());
  if(!landmarks.verified||!landmarks.leftEye||!landmarks.rightEye||landmarks.samples.left<7)
    throw Error('Derived native bilateral eyes invalid '+JSON.stringify(landmarks));
  const observed=await page.evaluate(()=>window.__CREATOR_DIAG__.eyeYResult);
  if(!Number.isFinite(observed)||Math.abs(observed-landmarks.eyeY)>.35)
    throw Error('Visor not mapped to anatomical eye '+JSON.stringify({landmarks,observed}));
  await page.click('#guidesBtn');
  const guideState=await page.locator('#guidesBtn').textContent();
  if(!guideState.includes('Ocultar'))throw Error('Native anatomical guide control failed');
  await page.click('#guidesBtn');
  await page.screenshot({path:'creator-proof/creator-desktop.png',fullPage:true});
  // The helmet must be inspectable from every principal viewpoint, with separate materials.
  await page.click('#frontBtn');await page.waitForTimeout(250);
  await page.screenshot({path:'creator-proof/avian-helmet-front.png'});
  await page.click('#sideBtn');await page.waitForTimeout(250);
  await page.screenshot({path:'creator-proof/avian-helmet-profile.png'});
  await page.click('#backBtn');await page.waitForTimeout(250);
  await page.screenshot({path:'creator-proof/avian-helmet-back.png'});
  await page.click('#headViewBtn');
  await page.selectOption('#helmetPartSelect','visor');
  await page.locator('#helmetPartColor').evaluate(el=>{
    el.value='#ff65dd';el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
  });
  const eyePaint=await page.evaluate(()=>window.__CREATOR_API__.getRecipe().helmet.colors.visor);
  if(eyePaint!=='#ff65dd')throw Error('Helmet subpiece visor paint failed: '+eyePaint);
  await page.locator('#helmetBeakNumber').fill('130');
  await page.locator('#helmetBeakNumber').dispatchEvent('change');
  let recipe=await page.evaluate(()=>window.__CREATOR_API__.getRecipe());
  if(Math.abs(recipe.helmet.beak-1.3)>1e-5)throw Error('Numeric beak input failed');
  await page.click('#helmetOffBtn');d=await page.evaluate(()=>window.__CREATOR_DIAG__);
  if(d.helmetVisible||d.headFacesHidden)throw Error('Helmet hiding did not restore base head: '+JSON.stringify(d));
  await page.click('#helmetOnBtn');d=await page.evaluate(()=>window.__CREATOR_DIAG__);
  if(!d.helmetReady||!d.helmetAttached||!d.headFacesHidden)throw Error('Helmet did not reattach '+JSON.stringify(d));
  await page.locator('#lengthNumber').fill('115');
  await page.locator('#lengthNumber').dispatchEvent('change');
  recipe=await page.evaluate(()=>window.__CREATOR_API__.getRecipe());
  if(Math.abs(recipe.pieces[0].length-1.15)>1e-5)throw Error('Precise feather length failed');
  await page.locator('#xNumber').fill('30');
  await page.locator('#xNumber').dispatchEvent('change');
  recipe=await page.evaluate(()=>window.__CREATOR_API__.getRecipe());
  if(Math.abs(recipe.pieces[0].x-.30)>1e-5)throw Error('3D position control failed');
  await page.click('#helmetOnBtn');
  await page.screenshot({path:'creator-proof/avian-helmet-painted.png'});
  d=await page.evaluate(()=>window.__CREATOR_DIAG__);
  if(!d.blenderAssetAvailable||!d.blenderNativeHeadMounted||d.blenderMeshCount!==7)
    throw Error('Real Blender GLB not mounted on native head: '+JSON.stringify(d));
  await page.click('#blenderPreviewBtn');
  d=await page.evaluate(()=>window.__CREATOR_DIAG__);
  if(!d.blenderPreviewActive)throw Error('Blender 7-mesh comparison unavailable');
  await page.click('#sideBtn');await page.waitForTimeout(250);
  await page.screenshot({path:'creator-proof/blender-forged-beak-profile.png'});
  await page.click('#frontBtn');await page.waitForTimeout(250);
  await page.screenshot({path:'creator-proof/blender-forged-beak-front.png'});
  await page.click('#blenderOffBtn');
  d=await page.evaluate(()=>window.__CREATOR_DIAG__);
  if(d.blenderPreviewActive)throw Error('Blender comparison cannot be disabled');
  await page.click('#blenderPreviewBtn');

  await page.click('#gizmoMove');
  d=await page.evaluate(()=>window.__CREATOR_DIAG__);
  if(!d.gizmoAttached||d.gizmoMode!=='translate')throw Error('3D gizmo not attached to real feather '+JSON.stringify(d));
  await page.click('#gizmoRotate');
  d=await page.evaluate(()=>window.__CREATOR_DIAG__);
  if(d.gizmoMode!=='rotate')throw Error('Gizmo rotate unavailable');
  await page.click('#gizmoScale');
  d=await page.evaluate(()=>window.__CREATOR_DIAG__);
  if(d.gizmoMode!=='scale')throw Error('Gizmo scale unavailable');
  await page.click('#gizmoOff');
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
  // A copied recipe must roundtrip through an actual user-selected JSON file.
  const fromCurrent=await page.evaluate(()=>JSON.stringify(window.__CREATOR_API__.getRecipe()));
  await page.locator('#importFile').setInputFiles({name:'creator-recipe.json',mimeType:'application/json',buffer:Buffer.from(fromCurrent)});
  const imported=await page.evaluate(()=>window.__CREATOR_API__.getRecipe());
  if(imported.helmet.colors.visor!=='#ff65dd'||imported.pieces.length!==5)
    throw Error('Recipe upload failed');
  await page.locator('#forgeCommand').fill('pintar visor #a56eff');
  await page.click('#forgeRunBtn');
  const aiReady=await page.evaluate(()=>window.__CREATOR_API__.getRecipe());
  if(aiReady.helmet.colors.visor!=='#a56eff')throw Error('Safe typed paint command not executed');
  await page.click('#undoBtn');
  if((await page.evaluate(()=>window.__CREATOR_API__.getRecipe())).helmet.colors.visor!=='#ff65dd')
    throw Error('Guided command not undoable');
  await page.locator('#forgeCommand').fill('rm -rf /');
  await page.click('#forgeRunBtn');
  if((await page.evaluate(()=>window.__CREATOR_API__.getRecipe())).helmet.colors.visor!=='#ff65dd')
    throw Error('Unsupported freeform command executed');
  await page.click('#qualityBtn');
  const q=await page.evaluate(()=>window.__CREATOR_API__.getQuality());
  if(!q.valid||!q.mobileBudget||q.triangles<=100||q.invalid!==0)
    throw Error('Geometry quality inspector failed '+JSON.stringify(q));
  const size=await page.evaluate(()=>window.__CREATOR_API__.exportGLB(false));
  if(size<1500)throw Error('GLB export incomplete '+size);
  if(!(await page.evaluate(()=>window.__CREATOR_DIAG__.exportContainsBlender)))
    throw Error('Final GLB missing selected Blender-forged mesh');
  const [download]=await Promise.all([
    page.waitForEvent('download',{timeout:45000}),page.click('#exportBtn')
  ]);
  await download.saveAs('creator-proof/helmet-real.glb');
  const bytes=fs.readFileSync('creator-proof/helmet-real.glb');
  if(bytes.length<1500)throw Error('Downloaded GLB file is empty');
  const report=await gltfValidator.validateBytes(new Uint8Array(bytes),{uri:'helmet-real.glb',maxIssues:80});
  fs.writeFileSync('creator-proof/glb-validator-report.json',JSON.stringify(report,null,2));
  if(report.issues.numErrors!==0)throw Error('Khronos GLB validation errors: '+JSON.stringify(report.issues.messages.slice(0,8)));
  console.log('KHRONOS_GLB_VALIDATION_GREEN bytes='+bytes.length+' warnings='+report.issues.numWarnings);
  await page.screenshot({path:'creator-proof/creator-painted-desktop.png',fullPage:true});
  await page.setViewportSize({width:823,height:384});await page.waitForTimeout(300);
  const mobile=await page.evaluate(()=>({canvas:document.querySelector('#stage canvas').getBoundingClientRect().toJSON(),panel:document.querySelector('aside').getBoundingClientRect().toJSON()}));
  if(mobile.canvas.width<515||mobile.canvas.height<300||mobile.panel.width>292)throw Error('S23 stage too small '+JSON.stringify(mobile));
  await page.screenshot({path:'creator-proof/creator-s23-landscape.png',fullPage:true});
  if(errors.length)throw Error('Console errors '+errors.join(' | '));
  d=await page.evaluate(()=>window.__CREATOR_DIAG__);
  if(!d.helmetReady||d.helmetPartCount!==9||d.nonfinite!==0)
    throw Error('Post-edit helmet lost validity: '+JSON.stringify(d));
  fs.writeFileSync('creator-proof/verify.json',JSON.stringify({
    green:true,nativeHead:true,clips:22,facialLandmarksVerified:d.faceLandmarksVerified,
    fullFaceFitted:d.fullFaceFitted,faceFitParts:d.faceFitParts,faceFitCoverage:d.faceFitCoverage,
    triangleCount:d.quality?.triangles,blenderMounted:d.blenderNativeHeadMounted,
    blenderMeshes:d.blenderMeshCount,blenderExported:d.exportContainsBlender,
    helmetParts:d.helmetPartCount,helmetMeshes:d.helmetMeshCount,
    helmetColors:d.helmetColorCount,exportedBytes:size,mobile
  },null,2));
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
