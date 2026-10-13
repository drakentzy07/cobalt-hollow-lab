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
 console.log('HIGHFLY_REPERTOIRE_S23_SIMULATED_VIEWPORT_GREEN=1');
 console.log('HIGHFLY_REPERTOIRE_PHYSICAL_ANDROID_AND_ART_UNAPPROVED=1');
 }finally{await browser.close();}
})().catch(e=>{console.error('HIGHFLY_REPERTOIRE_GATE_FAIL',e.stack||e);process.exit(1);});