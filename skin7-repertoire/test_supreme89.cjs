/* SKIN 8.9 actual Chrome WebGL and simulated Samsung mobile, NOT concept art quality certification. */
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const ids=['supreme-obsidian','supreme-solar','supreme-crimson'],dir='skin7-repertoire/evidence-89';
fs.mkdirSync(dir,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl']});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  const r=await page.goto('http://127.0.0.1:4917/skin7-repertoire/',{waitUntil:'domcontentloaded',timeout:60000});
  assert(r.ok(),'viewer responds');
  await page.waitForFunction(()=>window.__HIGHFLY_ARMOR_REPERTOIRE__?.sourceLoaded||window.__HIGHFLY_ARMOR_REPERTOIRE__?.error,null,{timeout:135000});
  assert.deepEqual(await page.locator('#families button').evaluateAll(xs=>xs.map(x=>x.dataset.id)),ids);
  const proofs={};
  for(const id of ids){
   await page.locator('[data-id="'+id+'"]').click();
   await page.waitForFunction(id=>{
    const a=window.__HIGHFLY_ARMOR_REPERTOIRE__;
    return a?.error||a?.variantReady&&a.variantId===id;
   },id,{timeout:165000});
   const st=await page.evaluate(()=>window.__HIGHFLY_ARMOR_REPERTOIRE__);
   assert.equal(st.error,null,'BUILD_FAIL '+id);
   const p=st.proofs[id];assert(p?.structuralGreen,'GATE_NOT_GREEN '+id);
   const a=p.supreme89;
   assert.equal(a?.pass,'SKIN89_NEW_TOPOLOGY_RIGGED_3D');
   assert.equal(a.sourceBones,23);assert.equal(a.clips,22);
   assert.equal(a.sourceDonorMeshes,17);
   assert.equal(a.generatedSkinnedMeshes,2);
   assert.equal(a.oldHelmetVisible,0);
   assert.equal(a.oldChestVisible,0);
   assert.equal(a.wingMeshesVisible,0);
   assert(a.helmetTriangles>900&&a.cuirassTriangles>800);
   assert(a.nativeBodyMeshesReworked>=10);
   assert.equal(a.sourceGLBImmutable,true);
   assert.equal(a.exactConceptArtMatch,false);
   const integrity=await page.evaluate(()=>{
    const root=window.__HIGHFLY_ARMOR_REPERTOIRE__.debugCandidateRoot;
    let rawNan=0,skinnedNan=0,weightBad=0,triangles=0,visibleOldHead=0,visibleWings=0;
    const parts=[];
    root.traverse(o=>{
     if(!o.isSkinnedMesh||!o.visible)return;
     if(o.name.startsWith('Armor_paladin_Head')||o.name.includes('_Head_')&&o.name.startsWith('HF84_'))visibleOldHead++;
     if(/_wings_/.test(o.name))visibleWings++;
     const g=o.geometry,p=g.getAttribute('position'),si=g.getAttribute('skinIndex'),sw=g.getAttribute('skinWeight');
     if(!p||!si||!sw){weightBad++;return;}
     triangles+=g.index?.count/3||p.count/3;
     for(let i=0;i<p.count;i++){
      if(![p.getX(i),p.getY(i),p.getZ(i)].every(Number.isFinite)){rawNan++;break;}
      let sum=0;for(let k=0;k<4;k++)sum+=sw.getComponent(i,k);
      if(!Number.isFinite(sum)||Math.abs(sum-1)>.02){weightBad++;break;}
     }
     if(o.name.startsWith('HF89_'))parts.push({name:o.name,verts:p.count,bones:o.skeleton.bones.length});
    });
    return {rawNan,skinnedNan,weightBad,triangles,visibleOldHead,visibleWings,parts};
   });
   assert.equal(integrity.rawNan,0,'NAN_POS '+JSON.stringify(integrity));
   assert.equal(integrity.weightBad,0,'BAD_WEIGHTS '+JSON.stringify(integrity));
   assert.equal(integrity.visibleOldHead,0,'OLD_HELMET_RENDERED');
   assert.equal(integrity.visibleWings,0,'WINGS_NOT_ALLOWED');
   assert.equal(integrity.parts.length,2,'REAL_REPLACEMENT_PIECES_MISSING');
   for(const view of ['front','side','back']){
    await page.click('#'+view);await page.waitForTimeout(250);
    await page.locator('#candidate').screenshot({path:dir+'/'+id+'-'+view+'.png'});
   }
   const options=await page.locator('#animation option').allTextContents();
   for(const clip of ['Running_A','Jump_Idle','1H_Melee_Attack_Chop']){
    assert(options.includes(clip),'MISSING_CLIP '+clip);
    await page.selectOption('#animation',{label:clip});
    await page.waitForTimeout(420);
    await page.locator('#candidate').screenshot({path:dir+'/'+id+'-'+clip.replace(/[^a-zA-Z0-9]/g,'_')+'.png'});
   }
   await page.selectOption('#animation',{label:'Reposo'});
   proofs[id]={proof:p,integrity};
   console.log('SKIN89_REAL_NEW_HELMET_AND_CUIRASS_GREEN',id,JSON.stringify(integrity.parts));
  }
  assert.equal(errors.length,0,'CHROME_ERRORS '+JSON.stringify(errors));
  const mob=await browser.newPage({viewport:{width:915,height:412},deviceScaleFactor:1});
  await mob.goto('http://127.0.0.1:4917/skin7-repertoire/',{waitUntil:'domcontentloaded',timeout:60000});
  await mob.waitForFunction(()=>window.__HIGHFLY_ARMOR_REPERTOIRE__?.sourceLoaded||window.__HIGHFLY_ARMOR_REPERTOIRE__?.error,null,{timeout:145000});
  for(const id of ids){
   await mob.locator('[data-id="'+id+'"]').click();
   await mob.waitForFunction(id=>{
    const a=window.__HIGHFLY_ARMOR_REPERTOIRE__;
    return a?.error||a?.variantReady&&a.variantId===id;
   },id,{timeout:165000});
   assert.equal(await mob.evaluate(()=>window.__HIGHFLY_ARMOR_REPERTOIRE__.error),null,'MOBILE '+id);
   await mob.screenshot({path:dir+'/mobile-'+id+'.png',fullPage:true});
  }
  fs.writeFileSync(dir+'/supreme-qa.json',JSON.stringify({variants:ids,proofs,sourceUnmodified:true,
   physicalSamsungTest:false,artQualityHumanApproval:false,mobileSimulated915x412:true},null,2));
  console.log('HIGHFLY_SKIN89_THREE_3D_ARMORS_CHROME_GREEN=1');
 }finally{await browser.close();}
})().catch(e=>{console.error('SKIN89_QA_RED',e.stack||e);process.exit(1)});
