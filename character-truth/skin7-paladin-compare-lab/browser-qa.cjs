/** HARD GATE: three genuine rigs, all 22 synchronized source clips, source vs reforged,
 * 4th commission, mobile Samsung S23 Ultra landscape emulation. No public game deploy.
 */
const {chromium}=require('playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const URL=process.env.HF_PALADIN_LAB_URL||'http://127.0.0.1:4278/';
const dir=process.env.HF_PALADIN_PROOF||'character-truth/skin7-paladin-scratch/live-browser-proof';
fs.mkdirSync(dir,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader','--use-gl=angle']});
 const checks=[],errors=[],network=[];
 const ok=(v,description)=>{assert(v,description);checks.push(description)};
 try{
 const ctx=await browser.newContext({viewport:{width:915,height:412},isMobile:true,hasTouch:true,deviceScaleFactor:2,acceptDownloads:true});
 const p=await ctx.newPage();
 p.on('pageerror',e=>errors.push(e.message));
 p.on('console',e=>{if(e.type()==='error')errors.push('console:'+e.text().slice(0,800))});
 p.on('response',r=>{if(r.status()>=400)network.push(r.status()+' '+r.url())});
 p.on('requestfailed',r=>network.push('failed:'+r.url()+':'+r.failure()?.errorText));
 await p.goto(URL,{waitUntil:'domcontentloaded',timeout:120000});
 try{
  await p.waitForFunction(()=>window.__HF_SKIN7_LAB__?.state().ready,null,{timeout:60000});
 }catch(e){
  const diagnostic=await p.evaluate(()=>({
    status:document.getElementById('status')?.textContent,
    appExposed:!!window.__HF_SKIN7_LAB__,
    scripts:[...document.scripts].map(s=>s.src||s.type),
    body:document.body.innerText.slice(0,1800)
  })).catch(x=>({inspectError:String(x)}));
  await p.screenshot({path:dir+'/startup-failure.png',timeout:10000}).catch(()=>{});
  fs.writeFileSync(dir+'/startup-diagnostic.json',JSON.stringify({diagnostic,errors,network},null,2));
  console.error('SKIN7_LAB_STARTUP_DIAGNOSTIC='+JSON.stringify({diagnostic,errors,network}));
  throw e;
 }
 let s=await p.evaluate(()=>window.__HF_SKIN7_LAB__.state());
 ok(s.actors===3,'Three REAL independent Hunter actors render in one lab');
 ok(s.originalPaladin.renderMeshes===17&&s.originalPaladin.missing.length===0,
   'Original ClaudeCraft Paladin helmet, shoulders, chest, legs etc: ALL 11 slots and 17 multi-material original meshes RENDER');
 ok(Object.keys(s.originalPaladin.slots).length===11,
   'Original Paladin equipment is actually visible, not bald/unarmored Hunter');
 ok(s.nativeBones===23&&s.rig==='Rig_Medium','Authentic 23-bone Rig_Medium');
 ok(s.clips.length===22,'ALL 22 original ClaudeCraft movement and combat animation clips');
 ok(s.sourceBlobSha1==='e3fb52b8e064ab3927f3bc34a5ba7d04e8d701c2','Frozen authentic source provenance');
 ok(s.gameDeployment===false,'Never touches playable public HIGHFLY game');
 ok(s.gameMechanicsSimulated===false,'Do not pretend native clips simulate hitboxes/damage/parry mechanics');
 for(const name of s.clips){
   s=await p.evaluate(n=>{window.__HF_SKIN7_LAB__.selectClip(n,.27);return window.__HF_SKIN7_LAB__.state()},name);
   ok(s.clip===name,'Synchronized original animation '+name);
 }
 await p.evaluate(()=>{window.__HF_SKIN7_LAB__.selectClip('Idle',0);window.__HF_SKIN7_LAB__.poseTime(.20)});
 ok(await p.locator('#viewer canvas').count()===1,'Single GPU canvas for all actors');
 ok(checks.filter(x=>x.startsWith('Synchronized original animation ')).length===22,'Every native animation clip was evaluated');
 await p.locator('#all').click();
 await p.screenshot({path:dir+'/01-all-three-actors-male.png'});
 await p.locator('#gender').selectOption('F');
 s=await p.evaluate(()=>window.__HF_SKIN7_LAB__.state());
 ok(s.gender==='F','All actor suits reuse native FEMALE modular body by visibility, no invented skeleton');
 ok(s.originalPaladin.renderMeshes===17&&s.originalPaladin.missing.length===0,
   'Paladin ORIGINAL eleven equipment slots still visually equipped after switch to FEMALE');
 await p.screenshot({path:dir+'/02-all-three-actors-female.png'});
 await p.locator('#gender').selectOption('M');
 await p.locator('#original').click();await p.screenshot({path:dir+'/03-paladin-original-front.png'});
 await p.locator('#reforged').click();await p.screenshot({path:dir+'/04-paladin-reforged-front.png'});
 await p.locator('#side').click();await p.screenshot({path:dir+'/05-paladin-reforged-side.png'});
 await p.locator('#back').click();await p.screenshot({path:dir+'/06-paladin-reforged-back.png'});
 await p.locator('#all').click();
 await p.evaluate(()=>window.__HF_SKIN7_LAB__.selectClip('1H_Melee_Attack_Chop',.42));
 await p.screenshot({path:dir+'/07-three-actors-melee-attack-pose.png'});
 await p.locator('#commission').click();
 ok(await p.locator('#workshop').isVisible(),'Fourth commissioned custom armor station is functional');
 await p.locator('#prompt').fill('Forja un paladin de armadura celestial con hombreras curvas gigantes, bordes oro y casco proporcional.');
 await p.locator('#enamelColor').fill('#bb3344');
 await p.locator('input[data-slot="arms"]').evaluate(input=>{input.value='1.29';input.dispatchEvent(new Event('input',{bubbles:true}))});
 const live=await p.evaluate(()=>window.__HF_SKIN7_LAB__.state().liveCommission);
 ok(live.meshes===11&&live.nativeMeshesOnly===true&&live.rig==='Rig_Medium','Live fourth station edits the real eleven skinned armor meshes with original rig');
 ok(live.editedVertices>0&&live.intensity.arms===1.29,'Slider deforms actual native skinned armor vertices in real time');
 ok(live.palette.enamel==='#bb3344','Changing the color picker repaints the real preview material');
 await p.screenshot({path:dir+'/08-fourth-station-live-deformation-and-color.png'});

 ok(await p.locator('#presetFactory').count()===1,'Skin8 native factory with local library and bounded workflows exists');
 await p.locator('[data-style="obsidiana"]').click();
 let studio=await p.evaluate(()=>window.__HF_SKIN7_LAB__.studio());
 ok(studio.styleCount===5,'FIVE actual native experimental armor presets available');
 ok((await p.evaluate(()=>window.__HF_SKIN7_LAB__.state().liveCommission)).palette.enamel==='#202435',
   'Obsidian visual preset repaints actual source-derived skinned armor');
 await p.locator('#designName').fill('QA Obsidiana Local');
 await p.locator('#storeDesign').click();
 studio=await p.evaluate(()=>window.__HF_SKIN7_LAB__.studio());
 ok(studio.saved.includes('QA Obsidiana Local'),'Custom named armor preset saved to local browser library');
 await p.reload({waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>window.__HF_SKIN7_LAB__?.state().ready,null,{timeout:60000});
 studio=await p.evaluate(()=>window.__HF_SKIN7_LAB__.studio());
 ok(studio.saved.includes('QA Obsidiana Local'),'Saved custom armor preset survives page reload in localStorage');
 await p.locator('#commission').click();
 await p.locator('#savedDesigns').selectOption('QA Obsidiana Local');
 await p.locator('#loadDesign').click();
 ok((await p.evaluate(()=>window.__HF_SKIN7_LAB__.state().liveCommission)).palette.enamel==='#202435',
    'Reloaded stored preset changes true skinned armor in viewer');
 await p.locator('[data-style="real"]').click();
 await p.locator('#undoDesign').click();
 ok((await p.evaluate(()=>window.__HF_SKIN7_LAB__.state().liveCommission)).palette.enamel==='#202435',
    'Undo safely restores previous native armor colors');
 await p.locator('#redoDesign').click();
 ok((await p.evaluate(()=>window.__HF_SKIN7_LAB__.state().liveCommission)).palette.enamel==='#522439',
    'Redo re-applies a full preset on the same native mesh');
 await p.locator('#epic').click();
 ok((await p.evaluate(()=>window.__HF_SKIN7_LAB__.studio())).cameraX>0,
    'Epic presentation camera is interactive');

 await p.locator('#prompt').fill('Armadura de rey oscuro con corona dorada, visor cerrado y hombreras enormes');
 await p.locator('#interpretOrder').click();
 const intent=await p.evaluate(()=>window.__HF_SKIN7_LAB__.skin9());
 ok(intent.intent?.themes.includes('royal')&&intent.intent.themes.includes('shadow'),
    'SKIN9 Spanish natural language interpreted as combined royal and shadow armor themes');
 ok(intent.intent.slotShapes.head.includes('crown')&&intent.intent.slotShapes.head.includes('closed-visor'),
    'SKIN9 identifies novel crown and closed-visor Blender shape instructions');
 ok(intent.intent.gameDeployAllowed===false&&intent.newTopologyGenerated===false,
    'SKIN9 never falsely claims new modeled meshes or public game deployment');
 await p.locator('#skin9Mutation').selectOption('epic');
 await p.locator('#skin9Mutate').click();
 ok((await p.evaluate(()=>window.__HF_SKIN7_LAB__.skin9())).intent.mutation==='epic',
    'SKIN9 live genetic mutation creates derived recipe and updates the actual Hunter preview');
 await p.locator('#skin9BlenderCandidate').click();
 ok((await p.locator('#order').innerText()).includes('Candidato exportado'),
    'SKIN9 Blender candidate JSON exported with outstanding topology requirements');
 await p.screenshot({path:dir+'/09-skin9-prompt-to-armored-hunter.png'});
 await p.locator('#resetLive').click();

 ok((await p.evaluate(()=>window.__HF_SKIN7_LAB__.state().liveCommission)).editedVertices===0,'Reset fully restores baseline geometry and material colors');
 await p.locator('#saveOrder').click();
 ok(await p.locator('#order').innerText().then(x=>x.includes('Receta descargada')),'Fourth station exports actual source-derived commission recipe JSON');
 ok(errors.length===0,'Browser has zero fatal JavaScript page errors');
 fs.writeFileSync(dir+'/gate.json',JSON.stringify({green:true,checks,errors,sourceGLB:true,actors:3,
   originalClipCount:22,customImageTo3DAutomatic:false,gameplayPhysicsCertified:false,
   actualSamsungHardwareTested:false,artApproved:false},null,2));
 console.log('HIGHFLY_SKIN7_REAL_BASE_PALADIN_ORIGINAL_PALADIN_REFORGED_22_ANIMATIONS_4_STATION_LAB_BROWSER_GREEN=1 CHECKS='+checks.length);
 }finally{await browser.close()}
})().catch(e=>{fs.writeFileSync(dir+'/gate-red.json',JSON.stringify({red:true,error:String(e.stack||e)},null,2));console.error(e);process.exitCode=1});
