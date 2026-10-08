/* Source-only 7-slot armor swap matrix. ORIGINAL GLB and original modularPartNames.
 * No claim that PF6 supports these runtime equip changes or persistence yet.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const dir=path.resolve('character-truth/phase8-proof');fs.mkdirSync(dir,{recursive:true});
const slots=['head','chest','arms','hands','legs','feet','back'];
const kits=['knight','barbarian','druid','mage','paladin','ranger','rogue'];
const emptySlots={barbarian:['back'],druid:['head'],mage:['hands'],ranger:['head'],rogue:['head']};
const results={
 type:'CLAUDECRAFT_ORIGINAL_7_SLOT_MIXING_EVIDENCE',upstream:'9b57e49c9676d75962700f828cc00a50a9a988b5',
 sourceOnly:true,PF6GameplayEquipProven:false,PF6PersistenceProven:false,
 fullSkinnedClearanceProven:false,SamsungActualDeviceProven:false,
 cases:[],browserErrors:[],sourceMissingPieces:[],originalSlots:slots,originalSets:kits};
(async()=>{
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
  const page=await browser.newPage({viewport:{width:1350,height:880}});
  page.on('pageerror',e=>results.browserErrors.push(String(e)));
  page.on('requestfailed',req=>results.browserErrors.push('request '+req.url()));
  await page.goto('http://127.0.0.1:4173/character-truth/phase8-dressing.html',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.__HF_SKIN3_CAGE__?.ready||window.__HF_SKIN3_CAGE__?.error,null,{timeout:120000});
  const info=await page.evaluate(()=>({ready:window.__HF_SKIN3_CAGE__.ready,error:window.__HF_SKIN3_CAGE__.error,names:window.__HF_SKIN3_CAGE__.names}));
  assert(info.ready,info.error||'Source GLB unavailable');
  assert.deepEqual(info.names.sets,kits);assert.deepEqual(info.names.slots,slots);
  assert.equal(info.names.glbs.length,6);
  async function run(spec,id,snap){
   const d=await page.evaluate(x=>window.__HF_SKIN3_CAGE__.measure(x),spec);
   assert(d.sourceOnly&&d.originalSourceOnly&&!d.PF6Verified&&!d.PF6PerSlotEquipProven);
   assert(d.bodyAlwaysPresent&&d.bones===23&&d.vertices>100);
   assert(d.full.size.every(n=>Number.isFinite(n)&&n>0));
   assert(d.originalNames.includes(spec.gender==='female'?'F_Head':'M_Head'));
   assert(d.originalNames.includes(spec.gender==='female'?'F_Torso':'M_Torso'));
   assert(!d.originalNames.includes(spec.gender==='female'?'M_Head':'F_Head'));
   assert(Object.values(d.armorBySlot).every(x=>Array.isArray(x)));
   if(snap)await page.locator('#stage').screenshot({path:path.join(dir,id+'.png'),timeout:30000});
   const row={id,gender:d.gender,kit:d.kit,worn:d.worn,
    bodyNodesPreserved:true,sourceNodes:d.originalNames,
    armorBySlot:d.armorBySlot,vertices:d.vertices,meshPrimitives:d.meshes,
    animatedClip:d.clip,fullBounds:d.full};
   results.cases.push(row);return row;
  }
  for(const gender of ['male','female']){
   await run({gender,kit:'none',clip:'Idle'},gender+'-bare',true);
   for(const kit of kits){
    const row=await run({gender,kit,clip:'Idle'},gender+'-full-'+kit,true);
    assert(Object.values(row.armorBySlot).flat().some(n=>n.startsWith('Armor_'+kit+'_')));
   }
   for(const slot of slots)for(const kit of kits){
    const worn={[slot]:kit},id=gender+'-'+slot+'-'+kit;
    const row=await run({gender,kit:'none',worn,clip:'Idle'},id,kit==='knight');
    const piece=row.armorBySlot[slot];
    const missing=(emptySlots[kit]||[]).includes(slot);
    if(missing)assert.equal(piece.length,0,'Incorrectly invented original piece '+id);
    else assert(piece.length>0,'Real authored piece missing '+id);
    for(const other of slots)if(other!==slot)assert.equal(row.armorBySlot[other].length,0,'Unwanted extra kit '+id);
    const actualArmor=row.sourceNodes.filter(n=>n.startsWith('Armor_'));
    assert.deepEqual(actualArmor,piece,'Source selected wrong slot pieces '+id);
    if(missing)results.sourceMissingPieces.push(id);
   }
   const mixed=Object.fromEntries(slots.map((slot,i)=>[slot,kits[i]]));
   const hybrid=await run({gender,kit:'none',worn:mixed,clip:'Block',phase:.4},gender+'-seven-mixed-armor',true);
   const families=new Set(hybrid.sourceNodes.filter(n=>n.startsWith('Armor_')).map(n=>n.split('_')[1]));
   assert(families.size>=4,'Original mixed armor incorrectly collapsed to single family');
  }
  assert.equal(results.cases.length,116);
  assert.equal(results.sourceMissingPieces.length,10);
  assert.equal(results.browserErrors.length,0,results.browserErrors.join('\n'));
  results.green=true;
  results.testedSingleSlotCases=98;results.testedCompleteSets=14;results.testedMixedSets=2;
  results.testedBareBodies=2;
  fs.writeFileSync(path.join(dir,'seven-slot-results.json'),JSON.stringify(results,null,2));
  fs.writeFileSync(path.join(dir,'REVIEW_GATE.md'),
   '# SKIN3 Phase 8 — Genuine 7-slot source dressing lab\n\n'+
   'GREEN: 116 source-only cases on six original GLBs, with original modularPartNames and two bodies. '+
   '98 single-slot changes, 14 full kits, two mixed looks and two bare bodies. '+
   'Expected missing pieces reported rather than invented: '+results.sourceMissingPieces.length+'.\n\n'+
   'NOT CERTIFIED: native PF6 live equip UI, save/load of individual armor slots, in-world appearance, '+
   'armor mesh penetration, weapon sockets under combat, smartphone performance, or new premium skin suitability. '+
   'No PF6 or frozen Foundation source was changed.\n');
  console.log('HIGHFLY_SKIN3_PHASE8_ORIGINAL_SEVEN_SLOT_MIX_GREEN='+results.cases.length+
   ' SINGLE_SLOT='+results.testedSingleSlotCases+' FULL='+results.testedCompleteSets+
   ' MIX='+results.testedMixedSets+' ABSENT_SOURCE_PIECES='+results.sourceMissingPieces.length);
 }catch(err){
  results.failure=String(err.stack||err);console.error('PHASE8_DRESSING_FAIL',results.failure);throw err;
 }finally{
  fs.writeFileSync(path.join(dir,'seven-slot-results.json'),JSON.stringify(results,null,2));
  if(browser)await browser.close();
 }
})().catch(()=>process.exit(1));
