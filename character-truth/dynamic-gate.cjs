/* Authentic six-GLB GPU/pose evidence; NEVER a clipping or PF6 runtime certification. */
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright');
(async()=>{
 const folder=path.resolve('character-truth/dynamic-proof');fs.mkdirSync(folder,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:1450,height:860}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('requestfailed',r=>errors.push(r.url()));
 await page.goto('http://127.0.0.1:4173/character-truth/dynamic-audit.html',{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForFunction(()=>window.__HF_SKIN3_DYNAMIC__?.ready||window.__HF_SKIN3_DYNAMIC__?.error,null,{timeout:120000});
 const meta=await page.evaluate(()=>({ready:window.__HF_SKIN3_DYNAMIC__.ready,error:window.__HF_SKIN3_DYNAMIC__.error,loaded:window.__HF_SKIN3_DYNAMIC__.loaded}));
 assert(!meta.error,meta.error);assert(meta.ready&&meta.loaded.length===6);
 const all=[];
 async function snap(spec,id){
  const o=await page.evaluate(s=>window.__HF_SKIN3_DYNAMIC__.inspect(s),spec);
  assert(o.finite&&o.jointNodes>=23&&o.triangles>0&&o.visibleMeshes>=5,JSON.stringify(o));
  assert(o.sourceOnly&&!o.PF6RuntimeCertified&&!o.clippingCertified);
  if(spec.model!=='knight'&&spec.set&&spec.set!=='none')assert(o.visibleArmorMeshes>0,'Armor absent '+id);
  if(spec.clip&&spec.clip!=='Idle')assert(o.movedBones>0,'No source bone motion '+id);
  all.push({id,...o});await page.locator('#viewport').screenshot({path:path.join(folder,id+'.png')});
 }
 for(const gender of ['male','female']){
  for(const view of ['front','profile','back'])await snap({model:'modular',gender,set:'none',view},gender+'-base-'+view);
  for(const set of ['knight','barbarian','druid','mage','paladin','ranger','rogue'])await snap({model:'modular',gender,set},gender+'-'+set);
 }
 await snap({model:'knight'},'knight-original-idle');
 for(const clip of ['Walking_A','Running_A','Jump_Idle','1H_Melee_Attack_Chop','Block','Hit_A','Warrior_Heroic_Leap']){
  await snap({model:'modular',gender:'male',set:'knight',clip},'male-'+clip);
 }
 for(const clip of ['Walking_A','Running_A','Jump_Idle','1H_Melee_Attack_Chop','Block','Hit_A']){
  await snap({model:'modular',gender:'female',set:'rogue',clip},'female-'+clip);
 }
 await snap({model:'knight',clip:'Shield_Bash'},'knight-shield-bash');
 fs.writeFileSync(path.join(folder,'dynamic-report.json'),JSON.stringify({sourceRun:37803666522,originalGLBs:meta.loaded,
  result:'SOURCE_BROWSER_MOTION_ONLY',samples:all.length,proof:all,browserErrors:errors,
  armorClippingApproval:false,PF6CompositionApproval:false,realDeviceApproval:false,humanReviewRequired:true},null,2));
 assert.equal(errors.length,0,errors.join('\n'));
 console.log('HIGHFLY_SKIN3_REAL_SOURCE_BROWSER_GREEN='+all.length+' NO_CLIPPING_APPROVAL=1');
 await browser.close();
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});