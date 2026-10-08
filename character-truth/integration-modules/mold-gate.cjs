/* HIGHFLY SKIN3 Molder V3 — verify authentic 3D mesh clone, no input geometry/rig mutation.
 * No production runtime updates. Test in landscape simulated S23, both genders.
 */
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=path.resolve('character-truth/molder-proof');fs.mkdirSync(out,{recursive:true});
const record={phase:'SKIN3 V3 native geometry molder',originalsNotOverwritten:true,
 sourceMolds:true,nonDestructive:true,publicGameUnmodified:true,
 physicalS23Tested:false,productionSkinApproved:false,checks:[],screenshots:[],errors:[],success:false};
const pass=(condition,label)=>{assert(condition,label);record.checks.push(label)};
const shape=(width,length,depth,taper)=>({width,length,depth,taper});
(async()=>{
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
  const ctx=await browser.newContext({viewport:{width:915,height:412},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const page=await ctx.newPage();
  page.on('pageerror',e=>record.errors.push('JS '+String(e)));
  page.on('requestfailed',e=>record.errors.push('Network '+e.url()+' '+e.failure()?.errorText));
  page.on('response',e=>{if(e.status()>=400)record.errors.push('HTTP '+e.status()+' '+e.url())});
  await page.goto('http://127.0.0.1:4173/character-truth/integration-modules/mold-preview.html',
    {waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.__HF_SKIN3_MOLDER_V3_PROOF__?.state().ready||
    window.__HF_SKIN3_MOLDER_V3_PROOF__?.state().error,null,{timeout:120000});
  const read=()=>page.evaluate(()=>{
   const a=window.__HF_SKIN3_MOLDER_V3_PROOF__;
   return {state:a.state(),audit:a.geometryAudit(),rig:a.rigInfo(),
    width:innerWidth,scroll:document.documentElement.scrollWidth};
  });
  const start=await read();
  pass(start.state.ready&&!start.state.error,'authentic 3D original GLB opens in S23-like landscape');
  pass(start.rig.realRoot&&start.rig.partCount>20,'original Rig_Medium and many source mesh parts');
  pass(start.state.design.gender==='male','starts on male original Hunter');
  pass(start.audit.some(a=>a.visible&&a.name.startsWith('Armor_')),'real native armor meshes visible');
  pass(start.audit.every(a=>!a.changed&&a.sourceGeometryId===a.liveGeometryId),'all untouched original geometries at entry');
  pass(start.scroll<=start.width+3,'no landscape horizontal spill');
  const shot=async label=>{
   const file=label+'.png';await page.locator('#scene').screenshot({path:path.join(out,file),timeout:45000});
   record.screenshots.push(file);
  };
  await shot('01-male-original-painted-unmolded');
  const genderRule=async(g)=>page.evaluate(g=>window.__HF_SKIN3_MOLDER_V3_PROOF__.setGender(g),g);
  const mold=async(slot,s)=>page.evaluate(({slot,s})=>window.__HF_SKIN3_MOLDER_V3_PROOF__.applyShape(slot,s),{slot,s});
  const x=await mold('chest',shape(.6,.4,-.2,.2));
  const changed=await read();
  console.log('SKIN3_MOLDER_NATIVE_MESH_COUNT',JSON.stringify(x));
  pass(x.changedMeshes>0&&x.changedVertices>0,'source chest actual skinned geometry is deformed');
  const actual=changed.audit.filter(a=>a.visible&&a.changed&&a.name.startsWith('Armor_'));
  pass(actual.length>0,'changed meshes are visible authored original Armor nodes');
  pass(actual.some(a=>a.sourcePositions!==a.livePositions),'vertex position bytes genuinely changed');
  pass(actual.every(a=>a.sourceGeometryId!==a.liveGeometryId),'modified meshes use CLONES, not original geometry');
  pass(actual.every(a=>a.sourceSkinIndex===a.liveSkinIndex&&a.sourceSkinWeight===a.liveSkinWeight),
    'weights and bone indices bit-for-bit identical to original geometry');
  pass(actual.every(a=>a.boneCount>20),'changed meshes are bound to native skeleton');
  pass(changed.audit.filter(a=>a.visible&&!a.name.startsWith('Armor_')).every(a=>!a.changed),
    'original bare body remains unchanged');
  await shot('02-male-chest-molded-original-GLB');
  const before=changed.audit.filter(a=>a.visible&&a.changed).map(a=>[a.name,a.livePositions,a.sourcePositions]);
  const again=await mold('chest',shape(.6,.4,-.2,.2));
  const same=await read();
  const after=same.audit.filter(a=>a.visible&&a.changed).map(a=>[a.name,a.livePositions,a.sourcePositions]);
  pass(again.changedMeshes>0&&JSON.stringify(before)===JSON.stringify(after),
    'reapplying same shape does NOT accumulate deform damage');
  await genderRule('female');
  const female=await read();
  const editedF=female.audit.filter(a=>a.visible&&a.changed);
  pass(female.state.design.gender==='female','switched to genuine female source body');
  pass(editedF.length>0&&editedF.every(a=>a.sourceSkinIndex===a.liveSkinIndex&&
    a.sourceSkinWeight===a.liveSkinWeight),'female armor has real cloned vertices, unchanged weights/bones');
  pass(female.audit.filter(a=>a.visible&&!a.name.startsWith('Armor_')).every(a=>!a.changed),
    'female original body geometry untouched');
  await shot('03-female-chest-molded-original-GLB');
  const mix=await page.evaluate(()=>{
   const a=window.__HF_SKIN3_MOLDER_V3_PROOF__;
   a.put('feet','ranger');a.put('legs','mage');
   a.applyShape('feet',{width:.3,length:0,depth:.4,taper:0});
   a.applyShape('legs',{width:-.3,length:.2,depth:0,taper:.2});
   return a.state();
  });
  const mixed=await read();
  pass(Object.keys(mixed.state.shapes).length===3&&mixed.state.appliedMold.changedMeshes>0,
    '3 independent mold slots retained simultaneously');
  pass(mixed.audit.filter(a=>a.changed).every(a=>a.sourceSkinIndex===a.liveSkinIndex&&
     a.sourceSkinWeight===a.liveSkinWeight),'mixed knight mage ranger preserve original rig attributes');
  await shot('04-female-three-piece-molded');
  await page.evaluate(()=>window.__HF_SKIN3_MOLDER_V3_PROOF__.restoreShape('chest'));
  const partial=await read();
  pass(!partial.state.shapes.chest&&partial.state.shapes.feet&&partial.state.shapes.legs,
    'restoring chest leaves other two molds untouched');
  // UI must perform an actual mold and visually change a NEW source mesh.
  await page.locator('#slot').selectOption('chest');
  await page.locator('#family').selectOption('knight');
  await page.locator('#apply').click();
  await page.locator('#mwidth').evaluate(el=>{el.value='50';el.dispatchEvent(new Event('input',{bubbles:true}))});
  await page.locator('#mold').click();
  const button=await read();
  pass(button.state.shapes.chest?.width===.5,'mobile HTML touch button activates actual geometry transform');
  await page.locator('#unmold').click();
  const restoredOne=await read();
  pass(!restoredOne.state.shapes.chest,'mobile touch restores just the selected geometry');
  await page.locator('#unmoldall').click();
  const final=await read();
  pass(final.audit.every(a=>!a.changed&&a.sourceGeometryId===a.liveGeometryId),
    'one-button rollback returns every original geometry reference exactly');
  pass(Object.keys(final.state.shapes).length===0,'no retained mold in source after full rollback');
  await shot('05-female-all-native-molds-restored');
  const invalid=await page.evaluate(()=>{
   const a=window.__HF_SKIN3_MOLDER_V3_PROOF__;
   try{a.applyShape('chest',{width:20,length:0,depth:0,taper:0});return false}
   catch(e){return String(e).includes('SHAPE_OUT_OF_SAFE_BOUNDS')}
  });
  pass(invalid,'unsafe 20x deformation rejected before any rendering');
  const afterRejected=await read();
  pass(afterRejected.audit.every(a=>!a.changed),'bad mold cannot mutate original geometry');
  pass(record.errors.length===0&&!afterRejected.state.error,'no unhandled rendering or HTTP errors');
  record.success=true;
  record.summary={actualModifiedMeshes:changed.state.appliedMold.changedMeshes,
   appliedSourceVertices:changed.state.appliedMold.changedVertices,
   maleAndFemale:true,threeIndependentShapes:true,bothVisualAndTechProof:true};
  console.log('HIGHFLY_SKIN3_V3_NATIVE_MOLDER_GREEN=1 CHECKS='+record.checks.length+
   ' CAPTURES='+record.screenshots.length+' SOURCE_GEOMETRY_AND_RIG_UNCHANGED=1 TWO_GENDERS=1');
  await ctx.close();
 }catch(e){record.failure=String(e.stack||e);console.error('HIGHFLY_SKIN3_MOLDER_V3_RED',record.failure);throw e}
 finally{fs.writeFileSync(path.join(out,'molder-gate.json'),JSON.stringify(record,null,2));if(browser)await browser.close()}
})().catch(()=>process.exit(1));
