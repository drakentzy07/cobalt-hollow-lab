/** P08 public GitHub Pages READ-ONLY audit.
 * Does not deploy. SHA256 covers downloaded HTML/linked assets only,
 * NOT a complete source/site snapshot. Full preservation is a separate gate.
 */
import {createHash} from 'node:crypto';
import fs from 'node:fs';
const origin='https://drakentzy07.github.io';
const root='/cobalt-hollow-lab/';
const url=origin+root;
const targets=[
  {path:'',mandatory:true},
  {path:'v4-02/',mandatory:false},
  {path:'monster-lab/',mandatory:false},
  {path:'skin-lab/',mandatory:false},
  {path:'v4-03-preview/',mandatory:false},
];
const report={checkedAt:new Date().toISOString(),pagesUrl:url,
  purpose:'P08 read-only external Pages HTTP audit, NO DEPLOY',
  fullSiteSnapshot:false,productionProtected:true,checks:[],assetChecks:[],
  findings:[],pass:false};
const sleep=n=>new Promise(res=>setTimeout(res,n));
async function inspect(path){
  const href=new URL(path, url).href;
  let last;
  for(let attempt=0;attempt<3;attempt++){
    try{
      const r=await fetch(href,{redirect:'follow',
        signal:AbortSignal.timeout(18000),headers:{'user-agent':'HIGHFLY-P08-safe-pages-audit'}});
      const data=Buffer.from(await r.arrayBuffer());
      const sha256=createHash('sha256').update(data).digest('hex');
      return {path,href,status:r.status,finalUrl:r.url,bytes:data.length,
        type:r.headers.get('content-type')??'',sha256,
        html:(r.headers.get('content-type')??'').includes('text/html')?
          data.toString('utf8').slice(0,1_000_000):null};
    }catch(e){last=String(e);if(attempt<2)await sleep(1200);}
  }
  return {path,href,error:last};
}
for(const target of targets){
  const item=await inspect(target.path);
  report.checks.push(Object.fromEntries(Object.entries(item).filter(([k])=>k!=='html')));
  if(target.mandatory&&item.status!==200)
    report.findings.push('PUBLIC_ROOT_UNREACHABLE:'+String(item.error??item.status));
  if(target.path===''&&item.html){
    const snippets=[...item.html.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/gi)]
      .map(x=>x[1]).filter(s=>s&&!s.startsWith('data:'));
    const candidates=[...new Set(snippets)].map(h=>{try{return new URL(h,url)}catch{return null}})
      .filter(u=>u&&u.origin===origin&&u.pathname.startsWith(root)&&
        !u.pathname.endsWith('/')).slice(0,12);
    for(const u of candidates){
      const entry=await inspect(u.href);
      report.assetChecks.push(Object.fromEntries(Object.entries(entry).filter(([k])=>k!=='html')));
      if(entry.status!==200)report.findings.push('BROKEN_PUBLIC_ENTRY_ASSET:'+u.pathname);
    }
  }
}
report.pass=report.findings.length===0;
fs.writeFileSync('pages-public-p08-audit.json',JSON.stringify(report,null,2));
console.log('HF_P08_PAGES_READ_ONLY_AUDIT='+JSON.stringify({
  pass:report.pass,root:report.checks[0],otherRoutes:report.checks.slice(1),
  entryAssets:report.assetChecks.length,findings:report.findings}));
if(!report.pass)process.exitCode=1;
