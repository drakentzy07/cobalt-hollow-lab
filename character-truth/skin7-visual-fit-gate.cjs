/** SKIN7 Source-vs-authored helmet geometry truth.
 * Measure actual skinned world-space source M_Head / F_Head and HF7 head meshes.
 * Does NOT use screenshot OCR, identity guesses or substitute characters.
 */
const {chromium}=require('playwright'),fs=require('node:fs');
const out='character-truth/skin7-visual-truth.json';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:915,height:412},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4277/',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.__HF_SKIN7_ARTISAN__?.state().ready&&window.__HF_SKIN_STUDIO_V5__?.state().ready,null,{timeout:120000});
  await page.locator('#skin7Open').click();
  const measurements=[];
  for(const sex of ['male','female']){
   await page.locator('#skin7Gender').selectOption(sex);
   await page.evaluate(()=>window.__HF_SKIN7_ARTISAN__.forge());
   const metrics=await page.evaluate(async()=>{
    const THREE=await import('three');
    const root=window.__HF_V19_SCENE__.root(),sex=document.getElementById('gender').value==='female'?'F':'M';
    root.updateMatrixWorld(true);
    const names=[sex+'_Head',sex+'_Torso','HF7_'+sex+'_HEAD_KABUTO_DOME',
      'HF7_'+sex+'_HEAD_KABUTO_RIM','HF7_'+sex+'_HEAD_HORN_L',
      'HF7_'+sex+'_HEAD_ONI_MASK','HF7_'+sex+'_CHEST_HERO_CUIRASS',
      'HF7_'+sex+'_SHOULDER_L_PAGODA_0','HF7_'+sex+'_SHOULDER_R_PAGODA_0'];
    const details={sex};
    for(const name of names){
     const node=root.getObjectByName(name);
     if(!node){details[name]={missing:true};continue}
     const b=new THREE.Box3().setFromObject(node,true),c=b.getCenter(new THREE.Vector3()),size=b.getSize(new THREE.Vector3());
     details[name]={min:b.min.toArray(),max:b.max.toArray(),center:c.toArray(),size:size.toArray(),visible:node.visible,
      skinned:!!node.isSkinnedMesh};
    }
    return details;
   });
   measurements.push(metrics);
  }
  const result={schema:'highfly.skin7.real-head-geometry-truth/1',measurements,errors,
    originalCharacterAuthority:'remote pinned ClaudeCraft GLB on authentic Rig_Medium',gameModified:false};
  fs.writeFileSync(out,JSON.stringify(result,null,2));
  console.log('HIGHFLY_SKIN7_SOURCE_HEAD_VS_HELMET_WORLD_BOUNDS='+JSON.stringify(measurements));
  if(errors.length)throw Error('SKIN7_VISUAL_BROWSER_JS_ERRORS_'+errors.join('|'));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
