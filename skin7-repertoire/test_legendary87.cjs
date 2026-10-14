/* Chrome/WebGL gate for the THREE NEW HERO armors. Not a quality certification. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const variants=['hero-dragon','hero-celestial','hero-death'];
const base='http://127.0.0.1:4917/skin7-repertoire/';
const dir='skin7-repertoire/evidence-87';fs.mkdirSync(dir,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  await page.addInitScript(()=>{
   window.__geometryStacks=[];
   const prev=console.error;
   console.error=(...args)=>{
    if(args.some(x=>String(x).includes('Computed min/max have NaN')||String(x).includes('Computed radius is NaN'))&&window.__geometryStacks.length<8)window.__geometryStacks.push(new Error('geometry callsite').stack);
    prev(...args);
   };
  });
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  let res=await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});
  assert(res?.ok(),'viewer must load');
  await page.waitForFunction(()=>window.__HIGHFLY_ARMOR_REPERTOIRE__?.sourceLoaded || window.__HIGHFLY_ARMOR_REPERTOIRE__?.error,null,{timeout:120000});
  const proof={};
  for(const id of variants){
   await page.locator('[data-id="'+id+'"]').click();
   await page.waitForFunction(key=>{
    const s=window.__HIGHFLY_ARMOR_REPERTOIRE__;return s?.error||s?.variantReady&&s.variantId===key;
   },id,{timeout:165000});
   const st=await page.evaluate(()=>window.__HIGHFLY_ARMOR_REPERTOIRE__);
   assert.equal(st.error,null,'HERO87_RED '+id);
   const p=st.proofs[id];assert(p?.structuralGreen===true);
   assert.equal(p.originalBones,23);assert.equal(p.clips,22);
   assert.equal(p.originalNativePrimitives,17);assert.equal(p.originalNativeSlots,11);
   assert.equal(p.sourceImmutable,true);
   assert.equal(p.hero87?.pass,'SKIN8_7_THREE_LEGENDARY');
   assert.equal(p.hero87?.id,id);
   assert.equal(p.hero87?.sourcePrimitives,17);
   assert.equal(p.hero87?.bones,23);assert.equal(p.hero87?.clips,22);
   assert.equal(p.hero87?.meshes,p.hero87?.weightedMeshes);
   assert.equal(p.hero87?.wingPairs,2);
   assert.equal(p.hero87?.attachedWingFeathers,id==='hero-dragon'?18:id==='hero-celestial'?26:30);
   assert.equal(p.hero87?.legacySpikesVisible,0);
   assert.equal(p.hero87?.exactToRenderedImages,false);
   assert(p.hero87?.coverage.includes('Back'),'native wings attached to Back');
   for(const view of ['front','side','back']){
    await page.click('#'+view);
    await page.waitForTimeout(260);
    await page.locator('#candidate').screenshot({path:dir+'/'+id+'-'+view+'.png'});
   }
   const options=await page.locator('#animation option').allTextContents();
   for(const clip of ['Running_A','Jump_Idle','1H_Melee_Attack_Chop']){
    assert(options.includes(clip),'missing clip '+clip);
    await page.selectOption('#animation',{label:clip});await page.waitForTimeout(500);
    await page.locator('#candidate').screenshot({path:dir+'/'+id+'-'+clip.replace(/[^a-zA-Z0-9]/g,'_')+'.png'});
   }
   await page.selectOption('#animation',{label:'Reposo'});
   console.log('HIGHFLY_SKIN87_HERO_CHROME_GREEN',id,p.hero87.meshes,p.hero87.attachedWingFeathers);
   proof[id]=p;
  }
  assert.equal(new Set(variants.map(id=>proof[id].signature)).size,3);
  assert.equal(new Set(variants.map(id=>proof[id].hero87.attachedWingFeathers)).size,3);
  const diagnostic=await page.evaluate(()=>{
    const root=window.__HIGHFLY_ARMOR_REPERTOIRE__.debugCandidateRoot;
    const bad=[],report={meshes:0,vertices:0,rawNan:0,deformedNan:0};
    if(!root)return {bad:[{error:'missing root'}],report};
    root.traverse(o=>{
      if(!o.isMesh||!o.visible)return;
      report.meshes++;
      const p=o.geometry.getAttribute('position'),deformed=o.position.clone();
      for(let i=0;i<p.count;i++){
        report.vertices++;
        const raw=[p.getX(i),p.getY(i),p.getZ(i)];
        if(!raw.every(Number.isFinite)){report.rawNan++;if(bad.length<10)bad.push({name:o.name,i,type:'raw',raw});break;}
        try{
          if(o.isSkinnedMesh)o.getVertexPosition(i,deformed);
          else deformed.set(...raw);
          if(![deformed.x,deformed.y,deformed.z].every(Number.isFinite)){
            report.deformedNan++;
            if(bad.length<10)bad.push({name:o.name,i,type:'skinned',raw,skinIndices:[0,1,2,3].map(k=>o.geometry.getAttribute('skinIndex').getComponent(i,k)),skinWeights:[0,1,2,3].map(k=>o.geometry.getAttribute('skinWeight').getComponent(i,k))});
            break;
          }
        }catch(e){if(bad.length<10)bad.push({name:o.name,i,type:'exception',reason:String(e)});break;}
      }
    });
    return {bad,report};
  });
  console.log('HF87_FINITE_MESH_DIAGNOSTIC',JSON.stringify(diagnostic));
  console.log('HF87_BOUNDS_WARN_STACK',JSON.stringify(await page.evaluate(()=>window.__geometryStacks)));
  console.log('HF87_BROWSER_ERRORS_COUNT',errors.length);
  assert.equal(diagnostic.bad.length,0,'invalid donor or hero mesh '+JSON.stringify(diagnostic.bad));
  assert.equal(errors.length,0,'browser errors '+JSON.stringify(errors));
  const mobile=await browser.newPage({viewport:{width:915,height:412},deviceScaleFactor:1});
  await mobile.goto(base,{waitUntil:'domcontentloaded',timeout:60000});
  await mobile.waitForFunction(()=>window.__HIGHFLY_ARMOR_REPERTOIRE__?.variantReady||window.__HIGHFLY_ARMOR_REPERTOIRE__?.error,null,{timeout:145000});
  for(const id of variants){
   await mobile.locator('[data-id="'+id+'"]').click();
   await mobile.waitForFunction(key=>{
    const s=window.__HIGHFLY_ARMOR_REPERTOIRE__;return s?.error||s?.variantReady&&s.variantId===key;
   },id,{timeout:150000});
   assert.equal(await mobile.evaluate(()=>window.__HIGHFLY_ARMOR_REPERTOIRE__.error),null,'mobile hero '+id);
   await mobile.screenshot({path:dir+'/mobile-'+id+'.png',fullPage:true});
  }
  fs.writeFileSync(dir+'/legendary-qa.json',JSON.stringify({variants,proof,
   mobileViewport:'915x412 simulated; real Samsung not tested',
   sourceUnmodified:true,wingPhysicsCertified:false,exactImageArtApproved:false},null,2));
  console.log('HIGHFLY_SKIN87_THREE_LEGENDARY_RIG_AND_MOTION_GREEN=1');
 }finally{await browser.close();}
})().catch(e=>{console.error('HIGHFLY_LEGENDARY87_GATE_FAIL',e.stack||e);process.exit(1)});
