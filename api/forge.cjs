/* HIGHFLY SKIN13 secure Vercel API.
   Requires owner-provisioned HIGHFLY_FORGE_ACCESS_TOKEN and scoped
   HIGHFLY_GITHUB_WRITE_TOKEN. Neither exists in the current project.
   No anonymous GitHub Actions dispatch and no fabricated QUEUED state.
 */
'use strict';
const crypto=require('node:crypto');
const OWNER='drakentzy07',REPO='cobalt-hollow-lab';
const BRANCH='highfly-skin13-auto-forge-mvp';
const ROOT='character-truth/skin13-auto-forge/jobs/';
const GH='https://api.github.com';
const response=(res,n,data)=>res.status(n).json(data);
const available=()=>Boolean(process.env.HIGHFLY_FORGE_ACCESS_TOKEN&&process.env.HIGHFLY_GITHUB_WRITE_TOKEN&&process.env.HIGHFLY_AI_ENDPOINT);
const tokenMatches=req=>{
 const expected=process.env.HIGHFLY_FORGE_ACCESS_TOKEN||'';
 const incoming=String(req.headers['x-highfly-forge-token']||'');
 if(expected.length<24||incoming.length!==expected.length)return false;
 return crypto.timingSafeEqual(Buffer.from(incoming),Buffer.from(expected));
};
async function github(path,options={}){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),10000);
 try{
  const r=await fetch(GH+path,{...options,signal:controller.signal,
   headers:{'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',
    'Authorization':'Bearer '+process.env.HIGHFLY_GITHUB_WRITE_TOKEN,
    ...(options.headers||{})}});
  const body=await r.text();
  if(!r.ok)throw Object.assign(Error('GITHUB_FAILED'),{status:r.status,
    body:body.slice(0,200)});
  return body?JSON.parse(body):null;
 }finally{clearTimeout(timer)}
}
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method==='GET'&&!req.query?.commit){
  return response(res,200,{schema:'highfly.skin13.capability/1',
   mode:available()?'operational':'offline',
   aiIntegrated:Boolean(process.env.HIGHFLY_AI_ENDPOINT),
   jobDispatchEnabled:available(),
   userActionRequired:available()?null:'REQUIRES_SERVER_SECRETS_AND_AI_PROVIDER',
   activeJob:null});
 }
 if(!available())return response(res,503,{code:'FORGE_NOT_CONFIGURED',
  message:'La fabricación automática todavía no está habilitada en el servidor. Ningún trabajo fue iniciado.'});
 if(!tokenMatches(req))return response(res,401,{code:'UNAUTHORIZED'});
 if(req.method==='GET'&&req.query?.commit){
  if(!/^[0-9a-f]{40}$/i.test(req.query.commit))return response(res,400,{code:'BAD_COMMIT'});
  try{
   const x=await github('/repos/'+OWNER+'/'+REPO+
    '/actions/runs?event=push&branch='+BRANCH+'&head_sha='+req.query.commit+'&per_page=10');
   const run=x.workflow_runs?.find(r=>r.head_sha===req.query.commit);
   return response(res,200,{state:run?.status||'pending',conclusion:run?.conclusion||null,
    runId:run?.id||null,runUrl:run?.html_url||null,
    message:run?'Estado confirmado por GitHub Actions':'Esperando que GitHub registre el RUN'});
  }catch(e){return response(res,502,{code:'STATUS_BACKEND_UNAVAILABLE'})}
 }
 if(req.method!=='POST'){res.setHeader('Allow','GET, POST');return response(res,405,{code:'METHOD_NOT_ALLOWED'})}
 let request;
 try{
  if(Number(req.headers['content-length']||0)>14000)throw Error('PAYLOAD_TOO_LARGE');
  const {normalizeForgeRequest}=await import('../character-truth/skin13-auto-forge/skin13-job-core.mjs');
  request=normalizeForgeRequest(req.body||{});
 }catch(e){return response(res,400,{code:'INVALID_COMMISSION',detail:String(e.message).slice(0,110)})}
 // Image semantics remain blocked until the image storage+AI service
 // can actually receive the bytes. A hash/palette alone is NOT a picture.
 if(request.reference)return response(res,409,{code:'IMAGE_INGESTION_NOT_CONNECTED',
  message:'Las fotografías necesitan un canal autenticado y un analizador visual real.'});
 const id='hf13-'+crypto.randomUUID();
 const path=ROOT+id+'.json';
 const body={schema:'highfly.skin13.forge-job/1',id,
  createdAt:new Date().toISOString(),source:'authenticated-api',phase:'queued',
  request,output:{glb:null,proof:null,artApproved:false,gameDeployed:false},
  provenance:{parentSourceArmorGeometryCopied:false,rigReference:'Rig_Medium',
   targetRigBones:23,originalAnimationClips:22,artStatus:'NOT_REVIEWED'}};
 try{
  const put=await github('/repos/'+OWNER+'/'+REPO+'/contents/'+path,{
   method:'PUT',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({message:'job(SKIN13): original armor commission '+id,
    content:Buffer.from(JSON.stringify(body,null,2)).toString('base64'),branch:BRANCH})});
  if(!/^[0-9a-f]{40}$/i.test(put.commit?.sha||''))throw Error('NO_GITHUB_COMMIT');
  return response(res,202,{id,phase:'queued',commit:put.commit.sha,
   verified:false,jobPath:path,dispatchedVia:'isolated-GitHub-commit',
   message:'Encargo enviado a GitHub. Consultá el RUN para el estado real. Arte aún no aprobado.'});
 }catch(e){return response(res,502,{code:'QUEUE_NOT_CONFIRMED',
  message:'No se pudo confirmar el encargo en GitHub. No se inició ningún trabajo.'})}
};
