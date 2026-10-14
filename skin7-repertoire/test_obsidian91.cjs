/* HIGHFLY SKIN 9.1 - REAL ClaudeCraft KNIGHT. Chrome/WebGL gate, not artistic approval. */
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const dir='skin7-repertoire/evidence-91';fs.mkdirSync(dir,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.stack||String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  const a=await page.goto('http://127.0.0.1:4917/skin7-repertoire/',{waitUntil:'domcontentloaded',timeout:60000});
  assert(a.ok(),'VIEWER_HTTP_RED');
  try{await page.waitForFunction(()=>window.__HIGHFLY_ARMOR_REPERTOIRE__?.sourceLoaded||window.__HIGHFLY_ARMOR_REPERTOIRE__?.error,null,{timeout:85000});}
  catch(e){throw Error('HF91_BOOTSTRAP_TIMEOUT / '+JSON.stringify(errors.slice(0,10))+' / '+await page.locator('#progress').innerText());}
  assert.deepEqual(await page.locator('#families button').evaluateAll(xs=>xs.map(x=>x.dataset.id)),['obsidian91']);
  await page.waitForFunction(()=>window.__HIGHFLY_ARMOR_REPERTOIRE__?.variantReady||window.__HIGHFLY_ARMOR_REPERTOIRE__?.error,null,{timeout:165000});
  const st=await page.evaluate(()=>window.__HIGHFLY_ARMOR_REPERTOIRE__);
  assert.equal(st.error,null,'VISIBLE_OBSIDIAN_RED');
  assert.equal(st.variantId,'obsidian91');
  assert.equal(st.proofs.obsidian91?.structuralGreen,true);
  const qa=st.proofs.obsidian91.obsidian91;
  for(const [key,n] of [['nativeKnightDonors',12],['originalBones',23],['clips',22],['nativeReworkedPieces',12],
    ['newHelmetNativePieces',2],['visibleKnightPieces',12],['visibleOldArmor',0],['visibleWings',0]])
   assert.equal(qa[key],n,key+'_RED');
  assert.equal(qa.realNativeGeometryOriginalUntouched,true);
  assert.equal(qa.sameSkeletonAndSkinWeights,true);
  assert(qa.helmetResculptVertices>10);
  assert(qa.chestResculptVertices>10);
  assert(qa.visibleBodyUnderArmor>=9);
  const geom=await page.evaluate(()=>{
   const root=window.__HIGHFLY_ARMOR_REPERTOIRE__.debugCandidateRoot;
   const ret={nativeMeshes:0,bodyMeshes:0,triangles:0,vertices:0,nonfinite:0,badWeight:0,not23:0,
    helmet:0,chest:0,arms:0,legs:0,feet:0,sourceArmorVisible:0,wrongSources:[]};
   root.traverse(o=>{
    if(!o.isMesh||!o.visible)return;
    if(o.name.startsWith('Armor_'))ret.sourceArmorVisible++;
    if(/^M_/.test(o.name))ret.bodyMeshes++;
    if(!o.name.startsWith('HF91_'))return;
    ret.nativeMeshes++;
    if(/Head/.test(o.name))ret.helmet++;
    if(/Chest/.test(o.name))ret.chest++;
    if(/Arm|Hand/.test(o.name))ret.arms++;
    if(/Leg/.test(o.name))ret.legs++;
    if(/Foot/.test(o.name))ret.feet++;
    const p=o.geometry.getAttribute('position'),sw=o.geometry.getAttribute('skinWeight');
    ret.vertices+=p.count;
    ret.triangles+=o.geometry.index?.count/3||p.count/3;
    if(o.skeleton.bones.length!==23)ret.not23++;
    for(let i=0;i<p.count;i++){
     if(![p.getX(i),p.getY(i),p.getZ(i)].every(Number.isFinite)){ret.nonfinite++;break;}
     let s=0;for(let k=0;k<4;k++)s+=sw.getComponent(i,k);
     if(!Number.isFinite(s)||Math.abs(s-1)>.02){ret.badWeight++;break;}
    }
   });
   return ret;
  });
  assert.equal(geom.nativeMeshes,12);assert.equal(geom.sourceArmorVisible,0);
  assert.equal(geom.not23,0);assert.equal(geom.nonfinite,0);assert.equal(geom.badWeight,0);
  assert(geom.helmet>=2&&geom.chest>=1&&geom.arms>=4&&geom.legs>=2&&geom.feet>=2);
  for(const view of ['front','side','back']){
   await page.click('#'+view);await page.waitForTimeout(330);
   await page.locator('#candidate').screenshot({path:dir+'/obsidian-'+view+'.png'});
   await page.locator('#original').screenshot({path:dir+'/original-'+view+'.png'});
  }
  for(const label of ['Running_A','Jump_Idle','1H_Melee_Attack_Chop']){
   const options=await page.locator('#animation option').allTextContents();
   assert(options.includes(label),'MISSING_CLIP_'+label);
   await page.selectOption('#animation',{label});await page.waitForTimeout(600);
   await page.locator('#candidate').screenshot({path:dir+'/obsidian-'+label.replace(/[^a-zA-Z0-9]/g,'_')+'.png'});
  }
  await page.selectOption('#animation',{label:'Reposo'});
  assert.deepEqual(errors,[],'WEBGL_ERRORS');
  const mob=await browser.newPage({viewport:{width:915,height:412},deviceScaleFactor:1});
  await mob.goto('http://127.0.0.1:4917/skin7-repertoire/',{waitUntil:'domcontentloaded',timeout:60000});
  await mob.waitForFunction(()=>window.__HIGHFLY_ARMOR_REPERTOIRE__?.variantReady||window.__HIGHFLY_ARMOR_REPERTOIRE__?.error,null,{timeout:170000});
  assert.equal(await mob.evaluate(()=>window.__HIGHFLY_ARMOR_REPERTOIRE__.error),null,'MOBILE_SCREEN_RED');
  await mob.screenshot({path:dir+'/android-landscape-simulation.png',fullPage:true});
  fs.writeFileSync(dir+'/obsidian-qa.json',JSON.stringify({proof:qa,geometry:geom,chromeErrors:errors,
   sourceImmutable:true,conceptArtExact:false,artApproved:false,physicalSamsungTested:false,viewport:'915x412 simulated'},null,2));
  console.log('HIGHFLY_SKIN91_NATIVE_KNIGHT_12_RIGGED_REAL_3D_GREEN=1',geom);
 }finally{await browser.close();}
})().catch(e=>{console.error('HIGHFLY_SKIN91_QA_RED',e.stack||e);process.exit(1);});
