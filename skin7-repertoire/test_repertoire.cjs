/* HIGHFLY Armor Style DNA — six-family real Chrome/WebGL gate.
 * Separate folder, isolated Git branch; never publishes public HIGHFLY Pages.
 * Proves loading/skinning/variety/animation but NOT art quality or physical S23.
 */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const url=process.env.HF_REPERTOIRE_URL||'http://127.0.0.1:4917/skin7-repertoire/';
const variants=['violet','dragon','celestial','royal','berserker','arcane'];
const dir='skin7-repertoire/evidence';
fs.mkdirSync(dir,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:960},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  assert(response?.ok(),'repertoire must have HTTP 200');
  await page.waitForFunction(()=>window.__HIGHFLY_ARMOR_REPERTOIRE__?.sourceLoaded===true || window.__HIGHFLY_ARMOR_REPERTOIRE__?.error,null,{timeout:110000});
  let state=await page.evaluate(()=>window.__HIGHFLY_ARMOR_REPERTOIRE__);
  assert.equal(state.error,null,'original ClaudeCraft should load');
  const screenshots={}, proofs={};
  for(const id of variants){
   await page.locator('[data-id="'+id+'"]').click();
   await page.waitForFunction(variant=>{
    const s=window.__HIGHFLY_ARMOR_REPERTOIRE__;
    return !!s?.error || !!(s?.variantReady && s.variantId===variant);
   },id,{timeout:160000});
   state=await page.evaluate(()=>window.__HIGHFLY_ARMOR_REPERTOIRE__);
   assert.equal(state.error,null,'variant failed '+id);
   const p=state.proofs[id];proofs[id]=p;
   assert(p && p.structuralGreen===true,'variant structural proof '+id);
   assert.equal(p.originalNativeSlots,11);assert.equal(p.originalNativePrimitives,17);
   assert.equal(p.nativeSlots,11);assert.equal(p.originalNativePrimitives,17);
   assert.equal(p.clips,22);assert.equal(p.originalBones,23);
   assert.equal(p.flags.donorAndRigPreserved,true);
   assert.equal(p.flags.noBodyLeaks,true);
   assert.equal(p.flags.styleSignature,true);
   assert.equal(p.flags.animationClips,true);
   assert(p.newStyleMeshes>14,'variant must contain novel authored pieces '+id);
   assert(p.skinnedStyleMeshes===p.newStyleMeshes,'all styled meshes must use native bones '+id);
   assert(p.sourceImmutable===true,'upstream unchanged '+id);
   assert.equal(p.nativeIntegration?.pass,'SKIN8_NATIVE_CONTINUITY_01','integration pass missing '+id);
   assert.equal(p.nativeIntegration?.originalPrimitives,17);
   assert.equal(p.nativeIntegration?.nativeSlots,11);
   assert.equal(p.nativeIntegration?.originalBones,23);
   assert.equal(p.nativeIntegration?.clips,22);
   assert.equal(p.nativeIntegration?.allConnectorsSkinned,true);
   assert(p.nativeIntegration?.connectors>=10,'minimum articulated parts '+id);
   assert.equal(p.nativeIntegration?.artReviewed,false);
   assert.equal(p.artFit?.pass,'SKIN8_2_ART_FIT');
   assert(p.artFit?.correctedOverlays>0,'bounds fitting must move geometry '+id);
   assert(p.artFit?.underArmor>=6,'continuous native under-armor '+id);
   assert.equal(p.artFit?.nativePrimitives,17);
   assert.equal(p.artFit?.hiddenSourceUnderPlates,17,'overlapping native layers hidden');
   assert(p.artFit?.compactedHeadPieces>=4,'source-compatible head compacted');
   assert.equal(p.reference83?.pass,id==='royal'?'SKIN8_3_REFERENCE_FUSION':'SKIN8_4_TRUE_REPLACEMENT','true replacement pass '+id);
   if(id!=='royal'){
    assert.equal(p.reference83?.enabled,true,'five requested armor replacements '+id);
    assert.equal(p.reference83?.sourceBones,23);
    assert.equal(p.reference83?.originalClips,22);
    assert.equal(p.reference83?.sourcePrimitivesPreserved,17);
    assert.equal(p.reference83?.assemblies,11,'one skinned fused assembly per source slot '+id);
    assert.equal(p.reference83?.skinWeightAssemblies,11);
    assert.equal(p.reference83?.shellCount,17);
    assert.equal(p.reference83?.trueReplacement,true,'five NEW armors must fully replace old overlays');
    assert.equal(p.reference83?.visibleLegacyMeshes,0,'NO original armor or previous skin shells allowed');
    assert.equal(p.reference83?.visibleOtherMeshes,0,'NO unexpected floating mesh allowed');
    assert.equal(p.reference83?.visibleFusedAssemblies,11,'only the 11 new armature slots render');
    assert.equal(p.reference83?.closedArmorEnvelopes,11,'new volume for each slot');
    assert.equal(p.nativeReforge841?.pass,'SKIN8_4_1_NATIVE_REFORGE');
    assert.equal(p.nativeReforge841?.sourceOriginalInvisible,true,'all old native armor hidden');
    assert.equal(p.nativeReforge841?.resculptedNewMeshes,17,'every original armor piece resculpted');
    assert.equal(p.nativeReforge841?.weightedMeshes,17,'all 17 resculpted pieces retain native rig');
    assert.equal(p.nativeReforge841?.slotCoverage.length,11);
    assert.equal(p.nativeReforge841?.clips,22);
    assert.equal(p.surfaceConform85?.pass,'SKIN8_5_SURFACE_CONFORM');
    assert.equal(p.surfaceConform85?.enabled,true);
    assert.equal(p.surfaceConform85?.originalBones,23);
    assert.equal(p.surfaceConform85?.clips,22);
    assert.equal(p.surfaceConform85?.newNativePieces,17);
    assert.equal(p.surfaceConform85?.visibleNativePieces,17);
    assert.equal(p.surfaceConform85?.visibleOriginalArmor,0);
    assert.equal(p.surfaceConform85?.visiblePriorFlatPanels,0,'front cuboid and old cape must be HIDDEN');
    assert(p.surfaceConform85?.oldFusedFlatPanelsHidden>=11,'all prior flat armatures removed');
    assert(p.surfaceConform85?.backNativeCapePieces>=1,'cape sourced from Back native rig');
    assert(p.surfaceConform85?.backTopAnchorVertices>=4,'cape anchored at native Back top');
    assert(p.surfaceConform85?.maxSurfaceOffsetRatio<=.11,'all reshapes remain near ORIGINAL skin surface');
    assert(p.nativeReforge841?.verticesResculpted>=500);
    assert(p.reference83?.underArmorRetained>=10,'native articulated underarmor remains');

    assert(p.reference83?.geometryPiecesCombined>=50);
    assert(p.reference83?.oldFloatingDecorationsHidden>=10,'old detached ornaments hidden '+id);
    assert.equal(p.reference83?.artApproved,false);
    assert.equal(p.reference83?.faithfulImageReconstruction,false);
   }else {assert.equal(p.reference83?.enabled,false,'royal remains legacy comparator');assert.equal(p.nativeReforge841?.enabled,false);assert.equal(p.surfaceConform85?.enabled,false);}

   if(id==='dragon')assert(p.newStyleMeshes>=15);
   if(id==='celestial')assert(p.distinctDesignGeometry.shoulder>=8);
   if(id==='berserker')assert(p.distinctDesignGeometry.shoulder>=10);
   if(id==='arcane')assert(p.distinctDesignGeometry.runes>=3);
   const hashes=[];
   for(const view of ['front','side','back']){
    await page.click('#'+view);
    await page.waitForTimeout(160);
    const path=dir+'/'+id+'-'+view+'.png';
    await page.screenshot({path,fullPage:true});
    await page.locator('#candidate').screenshot({path:dir+'/'+id+'-'+view+'-detail.png'});
    hashes.push(crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex').slice(0,12));
   }
   screenshots[id]=hashes;
   if(['violet','dragon','berserker'].includes(id)){
    for(const pose of ['Running_A','Jump_Idle','1H_Melee_Attack_Chop']){
     await page.selectOption('#animation',{label:pose});
     await page.waitForTimeout(280);
     await page.locator('#candidate').screenshot({path:dir+'/'+id+'-motion-'+pose.replace(/[^a-zA-Z0-9]/g,'_')+'.png'});
    }
    await page.selectOption('#animation',{label:'Reposo'});
   }
   console.log('HIGHFLY_STYLE_DNA_VARIANT_GREEN',id,p.newStyleMeshes,p.signature,JSON.stringify(hashes));
  }
  assert.equal(new Set(variants.map(id=>proofs[id].signature)).size,6,'every family must have different authored style DNA');
  assert(new Set(variants.map(id=>screenshots[id][0])).size>=5,'front captures must not repeat a single design');
  fs.writeFileSync(dir+'/all-families-proof.json',JSON.stringify({proofs,screenshots},null,2));
  await page.close();
 const mobilePage=await browser.newPage({viewport:{width:915,height:412},deviceScaleFactor:1});
 await mobilePage.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
 await mobilePage.waitForFunction(()=>window.__HIGHFLY_ARMOR_REPERTOIRE__?.variantReady===true,null,{timeout:120000});
 await mobilePage.screenshot({path:dir+'/mobile-landscape-violet.png',fullPage:true});
 await mobilePage.locator('[data-id="dragon"]').click();
 await mobilePage.waitForFunction(()=>window.__HIGHFLY_ARMOR_REPERTOIRE__?.variantReady&&window.__HIGHFLY_ARMOR_REPERTOIRE__?.variantId==='dragon',null,{timeout:150000});
 await mobilePage.screenshot({path:dir+'/mobile-landscape-dragon.png',fullPage:true});
 const mobile=await mobilePage.evaluate(()=>({bounds:document.querySelector('#candidate canvas').getBoundingClientRect().toJSON(),proof:window.__HIGHFLY_ARMOR_REPERTOIRE__?.proofs.dragon}));
 assert(mobile.bounds.width>=200&&mobile.bounds.height>=300);
 const names=await mobilePage.locator('#animation option').allTextContents();
 for(const name of ['Running_A','Jump_Idle','1H_Melee_Attack_Chop']){
  assert(names.includes(name),'missing clip '+name);
  await mobilePage.selectOption('#animation',{label:name});
  await mobilePage.waitForTimeout(350);
 }
 assert.equal(await mobilePage.evaluate(()=>window.__HIGHFLY_ARMOR_REPERTOIRE__?.error),null);
 const qa={variants,expectedNativeSlots:11,expectedPrimitives:17,expectedBones:23,expectedClips:22,
  mobile,artApproved:false,femaleFitApproved:false,collisionApproved:false,physicalAndroidApproved:false};
 fs.writeFileSync(dir+'/repertoire-qa.json',JSON.stringify(qa,null,2));
 console.log('HIGHFLY_REPERTOIRE_SIX_VARIANTS_CHROME_GREEN=1');
 console.log('HIGHFLY_SKIN85_TRUE_NATIVE_SURFACE_CONFORM_AND_BACK_CAPE_ANCHOR_GREEN=1');
 console.log('HIGHFLY_REPERTOIRE_S23_SIMULATED_VIEWPORT_GREEN=1');
 console.log('HIGHFLY_REPERTOIRE_PHYSICAL_ANDROID_AND_ART_UNAPPROVED=1');
 }finally{await browser.close();}
})().catch(e=>{console.error('HIGHFLY_REPERTOIRE_GATE_FAIL',e.stack||e);process.exit(1);});