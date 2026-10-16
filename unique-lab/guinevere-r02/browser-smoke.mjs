import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
const url=pathToFileURL(join(here,'dist/HIGHFLY_GUINEVERE_R02_KAYKIT_3D.html')).href;
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--disable-gpu-sandbox']});
let failed=false;
try{
 for(const [name,width,height,deviceScaleFactor] of [['desktop',1280,720,1],['s23-landscape-emulated',915,412,2]]){
  const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor,isMobile:name!=='desktop',hasTouch:name!=='desktop'});
  const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(url,{waitUntil:'load',timeout:30000});
  await page.waitForFunction(()=>window.__HIGHFLY_UNIQUE_R02_QA?.rig().loaded===true,undefined,{timeout:24000});
  await page.keyboard.press('Digit1');await page.waitForTimeout(450);
  await page.keyboard.press('Digit2');await page.waitForTimeout(510);
  await page.keyboard.press('Digit3');await page.waitForTimeout(520);
  await page.screenshot({path:join(here,'dist/smoke-'+name+'.png')});
  const state=await page.evaluate(()=>({rig:window.__HIGHFLY_UNIQUE_R02_QA.rig(),events:window.__HIGHFLY_UNIQUE_R02_QA.snapshot().events}));
  const castSkills=state.events.filter(e=>e.type==='cast').map(e=>e.skill);
  if(state.rig.clips.length<15||castSkills.indexOf('U1')<0||castSkills.indexOf('U2')<0||castSkills.indexOf('U3')<0||errors.length)throw Error('BROWSER_SMOKE_FAILED '+name+JSON.stringify({clips:state.rig.clips,castSkills,errors}));
  console.log('BROWSER_SMOKE_GREEN',name,'GLB clips:',state.rig.clips.length,'casts:',castSkills,'errors:',errors.length);
  await ctx.close();
 }
}catch(e){failed=true;console.error(e);}finally{await browser.close();}
if(failed)process.exitCode=1;
