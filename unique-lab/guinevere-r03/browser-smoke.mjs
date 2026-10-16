import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
const url=pathToFileURL(join(here,'dist/HIGHFLY_GUINEVERE_R03_KAYKIT_3D.html')).href;
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox']});
let failed=false;
try{
 for(const [name,width,height,deviceScaleFactor] of [['desktop',1280,720,1],['s23-landscape-emulated',915,412,2]]){
  const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor,isMobile:name!=='desktop',hasTouch:name!=='desktop'});
  const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
  await page.goto(url,{waitUntil:'load',timeout:30000});
  try{await page.waitForFunction(()=>window.__HIGHFLY_UNIQUE_R03_QA?.rig().loaded===true,undefined,{timeout:60000});}
  catch(e){
    await page.screenshot({path:join(here,'dist/smoke-failure-'+name+'.png')}).catch(()=>{});
    const diagnostics=await page.evaluate(()=>({loading:document.getElementById('loading')?.textContent,qaExists:!!window.__HIGHFLY_UNIQUE_R03_QA,rig:window.__HIGHFLY_UNIQUE_R03_QA?.rig?.(),bodyText:document.body.innerText?.slice(0,350)})).catch(err=>({error:String(err)}));
    throw Error('RIG_LOAD_DIAGNOSTIC '+name+' '+JSON.stringify({diagnostics,errors,waitError:String(e)}));
  }
  const controls=await page.evaluate(()=>{const j=document.querySelector('#joy').getBoundingClientRect(),k=document.querySelector('#kit').getBoundingClientRect();return {j:j.x+j.width/2,k:k.x+k.width/2,width:innerWidth,airtime:!!document.querySelector('#airtime'),mirror:!!document.querySelector('#mirror')};});
  if(!(controls.j<controls.width/2&&controls.k>controls.width/2&&controls.airtime&&controls.mirror))throw Error('HUD_CLASSIC_LAYOUT_INVERTED '+JSON.stringify(controls));
  await page.keyboard.press('Digit1');await page.waitForTimeout(450);
  await page.keyboard.press('Digit2');await page.waitForTimeout(510);
  await page.keyboard.press('Digit3');await page.waitForTimeout(520);
  await page.screenshot({path:join(here,'dist/smoke-'+name+'.png')});
  const state=await page.evaluate(()=>({rig:window.__HIGHFLY_UNIQUE_R03_QA.rig(),events:window.__HIGHFLY_UNIQUE_R03_QA.events()}));
  const castSkills=state.events.filter(e=>e.type==='cast').map(e=>e.skill);
  if(state.rig.clips.length<15||castSkills.indexOf('U1')<0||castSkills.indexOf('U2')<0||castSkills.indexOf('U3')<0||errors.length)throw Error('BROWSER_SMOKE_FAILED '+name+JSON.stringify({clips:state.rig.clips,castSkills,errors}));
  console.log('BROWSER_SMOKE_GREEN',name,'GLB clips:',state.rig.clips.length,'casts:',castSkills,'errors:',errors.length);
  await ctx.close();
 }
}catch(e){failed=true;console.error(e);}finally{await browser.close();}
if(failed)process.exitCode=1;
