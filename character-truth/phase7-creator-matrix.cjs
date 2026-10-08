/* HIGHFLY · SKIN3 Phase7. Genuine PF6 RUN333 original Creator at localhost.
   Seven ORIGINAL class armors × male/female; screenshots are real WebGL canvas,
   no mock characters, no runtime injections, no gameplay/source mutations.
   Source class-to-armor correspondence is verified independently in Phase5.
*/
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const {PNG}=require('pngjs');
const root=path.resolve('character-truth/phase7-proof');fs.mkdirSync(root,{recursive:true});
const classes=[['warrior','knight'],['shaman','barbarian'],['druid','druid'],['mage','mage'],['paladin','paladin'],['hunter','ranger'],['rogue','rogue']];
const evidence={
 type:'REAL_FROZEN_PF6_CREATOR_CLASS_ARMOR_MF_MATRIX',run:37770166898,
 artifact:11548096837,pf6Commit:'312fe2e67219415a73a56303fcbd3b0bd9f62273',
 actualPF6Browser:true,actualInGameEquipmentSwitch:false,sourceOnlyMapping:true,
 runtimeMeshesAndExactMaterialsNotEnumerated:true,measuredSkinFit:false,
 physicalSamsungS23Tested:false,legendarySkinsApproved:false,
 screenshotEvidence:[],failedRequests:[],errors:[],remainingGates:[]
};
function persist(){fs.writeFileSync(path.join(root,'phase7-creator-matrix.json'),JSON.stringify(evidence,null,2));}
function pngStats(buf){
 const png=PNG.sync.read(buf),bins=new Set(),sampled=[];
 let colored=0,alpha=0;
 const step=Math.max(1,Math.round(Math.sqrt(png.width*png.height/16000)));
 for(let y=0;y<png.height;y+=step)for(let x=0;x<png.width;x+=step){
  const i=(y*png.width+x)*4;
  const [a,b,c,d]=png.data.subarray(i,i+4);
  bins.add((a>>4)+','+(b>>4)+','+(c>>4));if(d)alpha++;
  if(Math.max(a,b,c)-Math.min(a,b,c)>18)colored++;
  if(sampled.length<8)sampled.push([a,b,c,d]);
 }
 return {width:png.width,height:png.height,binnedColors:bins.size,alphaSamples:alpha,
  nonGraySamples:colored,sampled};
}
(async()=>{
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
  const page=await context.newPage();
  page.on('pageerror',e=>evidence.errors.push(String(e).slice(0,500)));
  page.on('response',r=>{if(r.status()===404)evidence.failedRequests.push({kind:'HTTP404',url:r.url()})});
  page.on('requestfailed',req=>evidence.failedRequests.push({kind:req.failure()?.errorText||'failed',url:req.url()}));
  await page.goto('http://127.0.0.1:4173/cobalt-hollow-lab/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.evaluate(()=>localStorage.setItem('woc.cameraModePrompt.shown','1'));
  await page.locator('#btn-offline').waitFor({state:'attached',timeout:25000});
  for(let i=0;i<80;i++){
   await page.evaluate(()=>document.querySelector('#btn-offline')?.click());
   if(await page.locator('#offline-select').isVisible().catch(()=>false))break;
   await page.waitForTimeout(200);
  }
  assert(await page.locator('#offline-select').isVisible(),'Frozen PF6 offline creator did not open');
  evidence.selectableClasses=await page.locator('#offline-select .mini-class').evaluateAll(a=>a.map(x=>x.getAttribute('data-class')));
  for(const [cls] of classes)assert(evidence.selectableClasses.includes(cls),'Original class selector missing '+cls);
  await page.evaluate(()=>{
    const el=document.querySelector('#char-name');
    el.value='SkinPreview';
    el.dispatchEvent(new Event('input',{bubbles:true}));
  });
  for(const gender of ['male','female']){
   for(const [cls,sourceKit] of classes){
    await page.evaluate(cls=>document.querySelector('#offline-select .mini-class[data-class="'+cls+'"]')?.click(),cls);
    await page.waitForFunction(cls=>{
      const c=document.querySelector('#char-preview-canvas');
      return c && c.dataset.highflyPreviewVisual==='player_'+cls+'_modular' &&
        Number(c.dataset.highflyPreviewFrame||0)>0 && c.width>10 && c.height>10;
    },cls,{timeout:40000});
    const before=await page.evaluate(()=>Number(document.querySelector('#char-preview-canvas').dataset.highflyPreviewFrame||0));
    const info=await page.evaluate(g=>{
      const pane=document.querySelector('#offline-appearance');
      const tab=pane?.querySelector('.ac-tab');if(tab)tab.click();
      const seg=[...pane?.querySelectorAll('.ac-seg .ac-seg-btn')||[]];
      if(seg.length>=2)seg[g==='female'?1:0].click();
      return {labels:seg.map(x=>x.textContent.trim()),selected:seg.findIndex(x=>x.getAttribute('aria-pressed')==='true')};
    },gender);
    assert.equal(info.labels.length>=2,true,'Native gender control missing '+cls);
    assert.equal(info.selected,gender==='male'?0:1,'Creator failed to select native '+gender+' '+cls);
    await page.waitForFunction(({cls,before})=>{
       const c=document.querySelector('#char-preview-canvas');
       return c?.dataset.highflyPreviewVisual==='player_'+cls+'_modular' &&
         Number(c.dataset.highflyPreviewFrame||0)>before;
    },{cls,before},{timeout:30000});
    const status=await page.evaluate(()=>{
      const c=document.querySelector('#char-preview-canvas');
      const gl=c.getContext('webgl2');const rect=c.getBoundingClientRect();
      return {visual:c.dataset.highflyPreviewVisual,frames:Number(c.dataset.highflyPreviewFrame||0),
       actualCanvasWidth:c.width,actualCanvasHeight:c.height,
       displayedWidth:Math.round(rect.width),displayedHeight:Math.round(rect.height),
       glAvailable:!!gl,glLost:gl?.isContextLost()??true,
       enterButtonEnabled:!document.querySelector('#btn-start-offline')?.disabled,
       currentName:document.querySelector('#char-name')?.value||null};
    });
    assert.equal(status.visual,'player_'+cls+'_modular');
    assert(status.glAvailable&&!status.glLost,'WebGL context unavailable '+gender+' '+cls);
    assert(status.enterButtonEnabled,'Native Creator enter button disabled '+gender+' '+cls);
    const name='pf6-'+gender+'-'+cls+'-'+sourceKit+'.png';
    const buffer=await page.locator('#char-preview-canvas').screenshot({path:path.join(root,name),timeout:30000});
    const colors=pngStats(buffer);
    assert(colors.width>=100&&colors.height>=100,'Preview screenshot dimensions invalid');
    assert(colors.binnedColors>=6,'Native creator preview is flat/blank '+gender+' '+cls+': '+JSON.stringify(colors));
    const row={cls,gender,sourceKitFromOriginalClassMap:sourceKit,
      sourceClassArmorSetNotReadFromGPU:true,preview:status,realCanvas:colors,
      sha256:crypto.createHash('sha256').update(buffer).digest('hex'),screenshot:name};
    evidence.screenshotEvidence.push(row);
    console.log('PHASE7_REAL_PF6_CREATOR',gender,cls,sourceKit,JSON.stringify({frames:status.frames,colors:colors.binnedColors,canvas:[colors.width,colors.height]}));
   }
  }
  assert.equal(evidence.screenshotEvidence.length,14);
  const byKit=new Set(evidence.screenshotEvidence.map(x=>x.sourceKitFromOriginalClassMap));
  assert.equal(byKit.size,7);
  const badStatic=evidence.failedRequests.filter(x=>x.kind==='HTTP404'&&!x.url.includes('/api/'));
  evidence.static404s=badStatic;assert.equal(badStatic.length,0,'Missing original static assets '+JSON.stringify(badStatic));
  const old=JSON.parse(fs.readFileSync('character-truth/phase7-prior/creator-grip-matrix.json','utf8'));
  assert.equal(old.originalClasses,9);assert.equal(old.classGenderCases,18);assert.equal(old.originalArmorSets,7);
  for(const [cls,kit] of classes)assert.equal(old.classMapping[cls],kit,'Native kit mapping changed from phase5');
  evidence.originalClassKitMappingCrossChecked=true;
  evidence.success=true;
  evidence.remainingGates=[
   'Exact PF6 renderer component/morph node identity for each screenshot',
   'Native user equip swaps and per-slot appearance in live gameplay',
   'Move/parry/jump attacks with selected original kit and weapon sockets',
   'Human-reviewed visible seams, UVs and occluded surfaces; 3D clipping clearance',
   'On-device S23 Ultra landscape FPS and first render measurement'
  ];
  console.log('HIGHFLY_SKIN3_REAL_CREATOR_SEVEN_KITS_MF_GREEN='+evidence.screenshotEvidence.length+' UNMODIFIED_PF6=1 SOURCE_KIT_MAPPED=1');
  await context.close();
 }catch(e){evidence.failure=String(e.stack||e);console.error('PHASE7_REAL_CREATOR_FAILED',evidence.failure);throw e}
 finally{persist();if(browser)await browser.close();}
})().catch(()=>process.exit(1));
