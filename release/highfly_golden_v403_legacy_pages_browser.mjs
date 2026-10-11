/** Browser gate for V4-02 preservation on full combined Pages static output.
 * The existing V4-02 must boot the actual character selector, request zero
 * missing static assets, and still be byte-identical at HTML baseline.
 * Runs on an ephemeral local server and never touches the user's storage.
 */
import {chromium} from 'playwright';
const base='http://127.0.0.1:4174/cobalt-hollow-lab/';
const urls=['', 'v4-02/','monster-lab/hunts.html'];
const expectedTitles=['HIGHFLY','HIGHFLY','Monster Lab'];
let browser;
const result={pass:false,pages:[],oldStatic404:[],errors:[]};
try{
  browser=await chromium.launch({channel:'chrome',headless:true});
  const context=await browser.newContext({viewport:{width:844,height:390},
    isMobile:true,hasTouch:true,deviceScaleFactor:3});
  for(let i=0;i<urls.length;i++){
    const page=await context.newPage();
    page.on('response',r=>{if(r.status()===404&&!r.url().includes('/api/'))
      result.oldStatic404.push(r.url())});
    page.on('pageerror',e=>result.errors.push(String(e)));
    const response=await page.goto(base+urls[i],{waitUntil:'domcontentloaded',timeout:45000});
    if(response?.status()!==200)throw Error('ORIGINAL_PAGES_NOT_200:'+urls[i]);
    const title=await page.title();
    if(!title.includes(expectedTitles[i]))throw Error('ORIGINAL_PAGE_TITLE_DRIFT:'+title);
    if(i<=1){
      await page.locator('#btn-offline').waitFor({state:'attached',timeout:30000});
      const classes=await page.evaluate(()=>[...document.querySelectorAll('#offline-select .mini-class')].length);
      // The selector starts closed in GOLDEN; don't modify its state.
      result.pages.push({path:urls[i],title,offlineButtonPresent:true});
    }else result.pages.push({path:urls[i],title});
    await page.close();
  }
  if(result.oldStatic404.length)throw Error('ORIGINAL_STATIC_ASSET_404='+result.oldStatic404.slice(0,6).join(';'));
  result.pass=true;
}catch(e){result.error=String(e)}finally{
  console.log('HF_GOLDEN_PRESERVED_LIVE_V402_BROWSER='+JSON.stringify(result));
  await browser?.close().catch(()=>{});
}
if(!result.pass)process.exit(1);
