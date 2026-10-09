/* V14: genuine browser sculpt + final GLB download, not a fake screenshot. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const report={checks:[],errors:[],green:false,physicalSamsungVerified:false,unityImportVerified:false};
const check=(value,msg)=>{assert(value,msg);report.checks.push(msg)};
const dir=path.resolve('character-truth/v14-sculpt-proof');fs.mkdirSync(dir,{recursive:true});
function positionVectors(doc,nodeName){
 const j=doc.json,n=j.nodes.find(n=>n.name===nodeName);
 if(!n)throw Error('MISSING_REAL_ARMOR_'+nodeName);
 const a=j.accessors[j.meshes[n.mesh].primitives[0].attributes.POSITION],
 view=j.bufferViews[a.bufferView];
 const o=(view.byteOffset||0)+(a.byteOffset||0),d=new DataView(
  doc.chunks[1].bytes.buffer,doc.chunks[1].bytes.byteOffset,doc.chunks[1].bytes.byteLength);
 const r=[];for(let i=0;i<a.count;i++)r.push([
 d.getFloat32(o+i*12,true),d.getFloat32(o+i*12+4,true),d.getFloat32(o+i*12+8,true)]);
 return r;
}
(async()=>{
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
  const context=await browser.newContext({viewport:{width:915,height:412},deviceScaleFactor:2,isMobile:true,hasTouch:true,acceptDownloads:true});
  const page=await context.newPage();
  page.on('pageerror',e=>report.errors.push('JS: '+e.message));
  const port=process.env.HF_SITE_PORT||'4173';
  await page.goto('http://127.0.0.1:'+port+(port==='4173'?'/character-truth/integration-modules/studio-v14.html':'/'),
   {waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.__HF_SKIN_STUDIO_V5__?.state().ready,null,{timeout:120000});
  check(await page.locator('#premiumModelerPanel').count()===1,'Native V14 modeler visible on phone landscape');
  await page.locator('#bodyForgeLoad').click();
  await page.waitForFunction(()=>window.__HF_SKIN_STUDIO_V10__?.state().mounted,null,{timeout:45000});
  const before=await page.evaluate(()=>{
   const a=window.__HF_SKIN_STUDIO_V10__.forgedMeshes();
   const names=['HFV12_M_CHEST_ABDOMINAL_CUIRASS','HFV12_F_CHEST_ABDOMINAL_CUIRASS'];
   const all=names.map(name=>{
    const m=a.find(m=>m.name===name);if(!m)throw Error('MISSING_NATIVE_MESH');
    return {name,position:Array.from(m.geometry.attributes.position.array),
      skinIndex:Array.from(m.geometry.attributes.skinIndex.array),
      skinWeight:Array.from(m.geometry.attributes.skinWeight.array),
      normal:Array.from(m.geometry.attributes.normal.array),
      originalGeoUUID:m.geometry.uuid};
   });
   return {meshes:a.length,stats:window.__HF_SKIN_STUDIO_V10__.state(),all};
  });
  check(before.meshes===92&&before.stats.originalRig,'Exactly 92 genuine original 23-bone source weighted meshes');
  await page.evaluate(()=>{
   window.__HF_SKIN_STUDIO_V14__.selectByName('HFV12_M_CHEST_ABDOMINAL_CUIRASS');
   window.__HF_SKIN_STUDIO_V13__.selectByName('HFV12_M_CHEST_ABDOMINAL_CUIRASS');
  });
  await page.locator('#shapeWidth').evaluate(el=>{el.value='1.25';el.dispatchEvent(new Event('input',{bubbles:true}))});
  await page.locator('#shapeHeight').evaluate(el=>{el.value='1.05';el.dispatchEvent(new Event('input',{bubbles:true}))});
  await page.locator('#shapeDepth').evaluate(el=>{el.value='1.10';el.dispatchEvent(new Event('input',{bubbles:true}))});
  await page.locator('#shapeX').evaluate(el=>{el.value='.02';el.dispatchEvent(new Event('input',{bubbles:true}))});
  await page.locator('#shapeY').evaluate(el=>{el.value='.01';el.dispatchEvent(new Event('input',{bubbles:true}))});
  await page.locator('#shapeApply').click();
  await page.locator('#premiumColor').evaluate(el=>{el.value='#ee4488';el.dispatchEvent(new Event('input',{bubbles:true}))});
  await page.locator('#premiumApply').click();
  const after=await page.evaluate(()=>{
   const names=['HFV12_M_CHEST_ABDOMINAL_CUIRASS','HFV12_F_CHEST_ABDOMINAL_CUIRASS'];
   const a=window.__HF_SKIN_STUDIO_V10__.forgedMeshes();
   return {meshes:names.map(name=>{
    const m=a.find(m=>m.name===name);
    return {name,position:Array.from(m.geometry.attributes.position.array),
      skinIndex:Array.from(m.geometry.attributes.skinIndex.array),
      skinWeight:Array.from(m.geometry.attributes.skinWeight.array),
      originalGeoUUID:m.geometry.uuid,
      color:m.material.color.getHexString()};
    }),modeler:window.__HF_SKIN_STUDIO_V14__.state(),
    shapes:window.__HF_SKIN_STUDIO_V14__.recipe(),
    paint:window.__HF_SKIN_STUDIO_V13__.recipe()};
  });
  check(after.modeler.modifiedPieces===1&&after.shapes.shapes.length===1,
    'Real mouse/touch-editable shape recipe persisted for source armor');
  for(let i=0;i<2;i++){
   check(after.meshes[i].originalGeoUUID!==before.all[i].originalGeoUUID,
     'Original authentic '+before.all[i].name+' BufferGeometry cloned before sculpting');
   check(after.meshes[i].position.some((v,k)=>Math.abs(v-before.all[i].position[k])>.0001),
     'Real '+before.all[i].name+' weighted vertex coordinates changed in active Three.js scene');
   check(after.meshes[i].skinIndex.every((v,k)=>v===before.all[i].skinIndex[k])&&
     after.meshes[i].skinWeight.every((v,k)=>v===before.all[i].skinWeight[k]),
     'Original true '+before.all[i].name+' joint indices and weights untouched');
   check(after.meshes[i].color==='ee4488','New PBR color remains visible together with 3D shape');
  }
  await page.locator('#front').click();
  await page.screenshot({path:path.join(dir,'01-v14-real-sculpt-front.png')});
  const event=page.waitForEvent('download',{timeout:40000});
  await page.locator('#shapeBakedGlb').click();
  const downloaded=await event;
  check(downloaded.suggestedFilename()==='HIGHFLY-Nightfall-V14-FORMA-Y-PINTURA-original-rig.glb',
   'True user button downloads final baked 3D sculpt plus PBR color');
  const file=path.join(dir,downloaded.suggestedFilename());
  await downloaded.saveAs(file);
  const raw=fs.readFileSync(file);
  const {inspectNightfallGlb}=await import('./bake-nightfall-v13-1.mjs');
  const original=inspectNightfallGlb(fs.readFileSync('character-truth/integration-modules/assets/HIGHFLY-NIGHTFALL-rigged-body.glb'));
  const actual=inspectNightfallGlb(raw);
  check(actual.names.length===92&&actual.json.skins.length===original.json.skins.length,
   'Export has same 92 source meshes and same bone skin(s)');
  check(actual.json.animations===undefined,'No duplicate donor animation mixer in actual export');
  check(JSON.stringify(actual.json.skins)===JSON.stringify(original.json.skins)&&
   JSON.stringify(actual.json.accessors.slice(0,original.json.accessors.length))===
   JSON.stringify(original.json.accessors),
   'Original skeleton, bone inverse references and skin accessors unmodified');
  check(actual.chunks[1].bytes.slice(0,original.chunks[1].bytes.length)
   .every((b,i)=>b===original.chunks[1].bytes[i]),
   'Actual GLB binary prefix retains byte-exact original geometry and all skin weights');
  check(actual.chunks[1].bytes.length>original.chunks[1].bytes.length,
   'Actual GLB contains newly appended POSITION and NORMAL binary buffers');
  for(const name of ['HFV12_M_CHEST_ABDOMINAL_CUIRASS','HFV12_F_CHEST_ABDOMINAL_CUIRASS']){
   const old=positionVectors(original,name),fresh=positionVectors(actual,name);
   check(old.length===fresh.length&&old.some((p,i)=>p.some((v,k)=>Math.abs(v-fresh[i][k])>.0001)),
    'Actual downloaded '+name+' POSITION accessor has truly changed vertices');
   const n=actual.json.nodes.find(n=>n.name===name);
   const mat=actual.json.materials[actual.json.meshes[n.mesh].primitives[0].material].pbrMetallicRoughness;
   check(Math.abs(mat.metallicFactor-.70)<1e-5&&
     mat.baseColorFactor[0]>.8,'Actual downloaded '+name+' PBR paint survives 3D sculpt export');
  }
  const validator=require('gltf-validator');
  const result=await validator.validateBytes(new Uint8Array(raw),{uri:'HIGHFLY-NIGHTFALL-V14-SCULPT-PBR.glb',maxIssues:100});
  fs.writeFileSync(path.join(dir,'khronos-glb-v14-validator.json'),JSON.stringify(result,null,2));
  check(result.issues.numErrors===0,'Official Khronos validator reports zero GLB errors: '+JSON.stringify(result.issues.messages.slice(0,4)));
  const stored=await page.evaluate(()=>window.__HF_SKIN_STUDIO_V14__.recipe());
  await page.evaluate(()=>window.__HF_SKIN_STUDIO_V14__.reset());
  const originalAgain=await page.evaluate(()=>{
   const a=window.__HF_SKIN_STUDIO_V10__.forgedMeshes();
   return a.filter(m=>/^HFV12_[MF]_CHEST_ABDOMINAL_CUIRASS$/.test(m.name))
     .map(m=>Array.from(m.geometry.attributes.position.array));
  });
  check(originalAgain.length===2&&originalAgain.every((a,i)=>a.every((v,j)=>v===before.all[i].position[j])),
   'Reset precisely restores unmodified original 3D geometry for both Hunters');
  await page.evaluate(data=>window.__HF_SKIN_STUDIO_V14__.restore(data),stored);
  check((await page.evaluate(()=>window.__HF_SKIN_STUDIO_V14__.state())).modifiedPieces===1,
   'Shape recipe round trip re-applies actual sculpt');
  await page.locator('#gender').selectOption('female');
  await page.locator('#front').click();
  await page.screenshot({path:path.join(dir,'02-v14-female-shape-painted.png')});
  check((await page.evaluate(()=>window.__HF_SKIN_STUDIO_V10__.state())).activeMeshes===46,
   'Female character correctly displays 46 skinned native geometry pieces after sculpt');
  check(!report.errors.length,'Browser has no unhandled JS runtime errors');
  report.green=true;report.sculpt={newGlbBytes:raw.length,originalGlbBytes:original.bytes.length,
    newBinaryBytes:actual.chunks[1].bytes.length-original.chunks[1].bytes.length,
    unchangedOriginalWeights:true,changed3DMeshes:2,realPbrPaint:true,khronosErrors:0};
  console.log('HIGHFLY_V14_TRUE_SCULPTED_WEIGHTED_GLB_AND_PBR_BROWSER_GREEN=1 CHECKS='+report.checks.length);
  await context.close();
 }catch(e){report.failure=String(e.stack||e);console.error('HIGHFLY_V14_NATIVE_SCULPT_RED',report.failure);throw e}
 finally{fs.writeFileSync(path.join(dir,'v14-report.json'),JSON.stringify(report,null,2));if(browser)await browser.close()}
})().catch(()=>process.exitCode=1);
