const assert=require('node:assert/strict');
const handler=require('../../api/forge.js');
const make=(method,body={},query={},headers={})=>{
 let statusCode=null,result=null,headersSent={};
 let res={setHeader(k,v){headersSent[k]=v;return this},status(n){statusCode=n;return this},json(x){result=x;return x}};
 return handler({method,body,query,headers},res).then(()=>({statusCode,result,headersSent}));
};
(async()=>{
 // Never leak the GitHub PAT, and NEVER accept jobs without configured secrets.
 delete process.env.HIGHFLY_FORGE_ACCESS_TOKEN;
 delete process.env.HIGHFLY_GITHUB_WRITE_TOKEN;
 delete process.env.HIGHFLY_FORGE_MODE;
 let r=await make('GET');
 assert.equal(r.statusCode,200);assert.equal(r.result.mode,'offline');
 assert.equal(r.result.jobDispatchEnabled,false);
 r=await make('POST',{prompt:'A new black metal armor with purple energy'});
 assert.equal(r.statusCode,503);assert.equal(r.result.code,'FORGE_NOT_CONFIGURED');
 r=await make('GET',{}, {commit:'z'.repeat(40)});
 assert.equal(r.statusCode,503); // fails closed before status lookup
 console.log('SKIN13_VERCEL_API_FAILS_CLOSED_WITHOUT_AUTHENTICATED_AI_OR_GITHUB_SECRETS_GREEN=1');
})().catch(e=>{console.error(e);process.exitCode=1});
