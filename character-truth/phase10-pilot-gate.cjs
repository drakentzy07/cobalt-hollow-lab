/* SKIN3 Phase 10: READ-ONLY authentic source 3D armor equip visual, unequip and save/load.
 * CI uses upstream SHA-verified native catalog/rules/modular GLB. The actual PF6
 * game is not patched, so source-lab save is not a live-game save guarantee.
 */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const dest=path.resolve('character-truth/phase10-proof');fs.mkdirSync(dest,{recursive:true});
const report={
 frozenUpstream:'9b57e49c9676d75962700f828cc00a50a9a988b5',
 realOriginalGLB:true,realOriginalEquipRules:true,realOriginalCatalogIds:true,
 actualPF6Scene:false,livePF6Save:false,physicalS23:false,
 nativeItemSpecificArmorAssets:false,armorKitPreviewMappingsOnly:true,
 weapon3DAttachmentCertified:false,statsMutated:false,
 screens:[],actions:[],errors:[],results:[],success:false
};
const write=()=>fs.writeFileSync(path.join(dest,'phase10-pilot.json'),JSON.stringify(report,null,2));
(async()=>{
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
  const context=await browser.newContext({viewport:{width:1400,height:1000}});
  const page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400)report.errors.push('HTTP'+r.status()+' '+r.url())});
  page.on('requestfailed',r=>report.errors.push(r.failure()?.errorText+' '+r.url()));
  await page.goto('http://127.0.0.1:4173/character-truth/phase10-pilot.html',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.__HF_SKIN3_P10__?.ready || window.__HF_SKIN3_P10__?.getDiagnostics()?.errors?.length>0,
    null,{timeout:120000});
  const api=await page.evaluate(()=>({ready:window.__HF_SKIN3_P10__.ready,
    diagnostics:window.__HF_SKIN3_P10__.getDiagnostics(),
    source:window.__HF_SKIN3_CAGE__.names,
    initial:window.__HF_SKIN3_P10__.getState(),
    visual:window.__HF_SKIN3_P10__.getVisual()}));
  assert(api.ready,'Original actor did not boot: '+JSON.stringify(api.diagnostics));
  assert.equal(api.initial.inventory.length,7);
  assert.equal(api.source.glbs.length,6);
  assert.equal(api.source.slots.length,7);
  assert(api.visual.nodes.includes('M_Torso'));
  report.results.push({test:'source-real-same-hunter-body-initialized',ok:true});
  async function shot(name){
   const filename=name+'.png';await page.locator('#stage').screenshot({path:path.join(dest,filename),timeout:45000});
   report.screens.push(filename);
  }
  await shot('01-unaltered-male-body');
  async function act(kind,itemId,slot,accept=true){
   const v=await page.evaluate(({kind,itemId,slot})=>{
    const h=window.__HF_SKIN3_P10__;
    const s=h.getState();
    if(kind==='equip'){
     const copy=s.inventory.find(x=>x.itemId===itemId);
     return h.equip(copy?.copyId||'not-in-bag',slot);
    }
    if(kind==='unequip')return h.unequip(slot);
    if(kind==='gender')return h.gender(itemId);
    throw Error('Invalid test');
   },{kind,itemId,slot});
   report.actions.push({kind,itemId,slot,ok:v.ok,code:v.code});
   assert.equal(v.ok,accept,'Unexpected action '+kind+' '+itemId+' '+slot+': '+JSON.stringify(v));
   return v;
  }
  await act('equip','militia_vest','chest');
  let p=await page.evaluate(()=>({s:window.__HF_SKIN3_P10__.getState(),v:window.__HF_SKIN3_P10__.getVisual(),
    last:window.__HF_SKIN3_CAGE__.last}));
  assert.equal(p.s.equipment.chest.itemId,'militia_vest');
  assert.equal(p.v.worn.chest,'knight');
  assert(p.v.nodes.some(x=>x.startsWith('Armor_knight_')));
  assert(p.last.parts.some(x=>x.name.startsWith('Armor_knight_')));
  await shot('02-original-knight-chest-equipped');
  await act('equip','oiled_boots','feet');
  p=await page.evaluate(()=>({s:window.__HF_SKIN3_P10__.getState(),v:window.__HF_SKIN3_P10__.getVisual(),
   last:window.__HF_SKIN3_CAGE__.last}));
  assert.equal(p.s.equipment.feet.itemId,'oiled_boots');
  assert.equal(p.v.worn.feet,'ranger');
  assert(p.v.nodes.some(x=>x.startsWith('Armor_ranger_')));
  assert(p.last.parts.some(x=>x.name.startsWith('Armor_ranger_')));
  await shot('03-native-chest-and-ranger-boots');
  const beforeError=await page.evaluate(()=>window.__HF_SKIN3_P10__.getState());
  await act('equip','quilted_trousers','chest',false);
  const afterError=await page.evaluate(()=>window.__HF_SKIN3_P10__.getState());
  assert.deepEqual(beforeError,afterError,'Rejected equip must not mutate state');
  await act('equip','worn_sword','mainhand');
  const withSword=await page.evaluate(()=>window.__HF_SKIN3_P10__.getVisual());
  assert.equal(withSword.equippedWeaponId,'worn_sword');
  assert.equal(withSword.weaponVisualProof,false);
  await act('gender','female');
  p=await page.evaluate(()=>({s:window.__HF_SKIN3_P10__.getState(),v:window.__HF_SKIN3_P10__.getVisual(),
    last:window.__HF_SKIN3_CAGE__.last}));
  assert.equal(p.s.gender,'female');
  assert(p.v.nodes.includes('F_Torso')&&!p.v.nodes.includes('M_Torso'));
  assert(p.last.parts.some(x=>x.name.startsWith('Armor_knight_')));
  await shot('04-unchanged-items-female-body');
  const json=await page.evaluate(()=>window.__HF_SKIN3_P10__.save());
  const beforeSave=await page.evaluate(()=>window.__HF_SKIN3_P10__.getState());
  assert.deepEqual(JSON.parse(json),beforeSave);
  // REAL PAGE RELOAD, then explicitly load from isolated browser localStorage.
  await page.reload({waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.__HF_SKIN3_P10__?.ready,null,{timeout:120000});
  const restored=await page.evaluate(()=>window.__HF_SKIN3_P10__.load());
  assert.deepEqual(restored,beforeSave,'Source lab save/reload damaged equipment or gender');
  const afterRestore=await page.evaluate(()=>({s:window.__HF_SKIN3_P10__.getState(),v:window.__HF_SKIN3_P10__.getVisual()}));
  assert.equal(afterRestore.v.worn.chest,'knight');
  assert.equal(afterRestore.v.worn.feet,'ranger');
  assert.equal(afterRestore.v.equippedWeaponId,'worn_sword');
  await shot('05-after-real-browser-reload');
  await act('unequip',null,'chest');
  p=await page.evaluate(()=>({s:window.__HF_SKIN3_P10__.getState(),v:window.__HF_SKIN3_P10__.getVisual(),
    last:window.__HF_SKIN3_CAGE__.last}));
  assert.equal(p.s.equipment.chest,undefined);
  assert.equal(p.v.worn.chest,null);
  assert(!p.last.parts.some(x=>x.name.startsWith('Armor_knight_')));
  assert(p.s.inventory.some(x=>x.itemId==='militia_vest'));
  await shot('06-native-chest-unequipped');
  await act('equip','shadow_jerkin','chest');
  p=await page.evaluate(()=>({v:window.__HF_SKIN3_P10__.getVisual(),last:window.__HF_SKIN3_CAGE__.last}));
  assert.equal(p.v.worn.chest,'rogue');
  assert(p.last.parts.some(x=>x.name.startsWith('Armor_rogue_')));
  await shot('07-rogue-chest-on-same-hunter');
  await act('unequip',null,'feet');
  p=await page.evaluate(()=>window.__HF_SKIN3_P10__.getVisual());
  assert.equal(p.worn.feet,null);
  await act('unequip',null,'mainhand');
  p=await page.evaluate(()=>window.__HF_SKIN3_P10__.getVisual());
  assert.equal(p.equippedWeaponId,null);
  assert.equal(p.weaponVisualProof,false);
  // UI click sanity: never simulate underlying state through a custom proxy actor.
  await page.locator('#p10-gender').click();
  const uiGender=await page.evaluate(()=>window.__HF_SKIN3_P10__.getState().gender);
  assert.equal(uiGender,'male');
  await page.locator('#p10-save').click();
  await page.locator('#p10-reset').click();
  const reset=await page.evaluate(()=>window.__HF_SKIN3_P10__.getState());
  assert.equal(Object.keys(reset.equipment).length,0);
  await page.locator('#p10-load').click();
  const uiRestore=await page.evaluate(()=>window.__HF_SKIN3_P10__.getState());
  assert.equal(uiRestore.equipment.chest.itemId,'shadow_jerkin');
  assert.equal(uiRestore.gender,'male');
  await shot('08-native-ui-save-load-reused');
  report.results.push({test:'real-catalog-native-equip-unequip',ok:true},
   {test:'cross-original-kit-body-piece-render',ok:true},
   {test:'original-inventory-rule-rejection-no-mutation',ok:true},
   {test:'original-sword-recorded-not-fake-render-claim',ok:true},
   {test:'gender-same-state-preservation',ok:true},
   {test:'JSON-lab-localStorage-full-page-reload',ok:true},
   {test:'UI-save-reset-load',ok:true});
  report.success=true;
  report.finalView=await page.evaluate(()=>({state:window.__HF_SKIN3_P10__.getState(),
    look:window.__HF_SKIN3_P10__.getVisual(),diagnostics:window.__HF_SKIN3_P10__.getDiagnostics()}));
  assert.equal(report.errors.length,0,report.errors.join('\n'));
  console.log('HIGHFLY_SKIN3_PHASE10_NATIVE_EQUIP_UNEQUIP_SAVE_RELOAD_GREEN=1 ACTIONS='+
   report.actions.length+' SCREENSHOTS='+report.screens.length+' TWO_GENDERS=1 GAME_PF6_UNMODIFIED=1');
  await context.close();
 }catch(e){report.error=String(e.stack||e);console.error('PHASE10_PILOT_FAIL',report.error);throw e}
 finally{write();if(browser)await browser.close()}
})().catch(()=>process.exit(1));
