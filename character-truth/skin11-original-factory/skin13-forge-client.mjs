/** HIGHFLY SKIN13 — verified server-side jobs only; not a fake timer. */
export function setupForge13({getCommission}){
 const $=id=>document.getElementById(id);
 const root='/api/forge';
 let capability={mode:'offline'},access='',commit=null,polling=null;
 const setStatus=(text,offline=false)=>{
  $('forgeStatus').textContent=text;
  $('forgeStatus').classList.toggle('offline',offline);
 };
 async function capabilityCheck(){
  $('fabricate3D').disabled=true;
  $('forgeBadge').textContent='Comprobando…';
  try{
   const r=await fetch(root,{cache:'no-store',headers:{'Accept':'application/json'}});
   if(!r.ok)throw Error('Motor no alcanzable');
   capability=await r.json();
   if(capability.mode!=='operational'||!capability.jobDispatchEnabled){
    setStatus('Motor pendiente de activar: faltan las credenciales privadas del servidor o el servicio de ejecución. No hay ningún trabajo en curso.',true);
    $('forgeBadge').textContent='MOTOR DESCONECTADO';
    $('forgeLive').style.display='none';return;
   }
   $('forgeLive').style.display='block';
   $('fabricate3D').disabled=false;
   $('forgeBadge').textContent='PROTOTIPO PROCEDURAL ACTIVO';
   setStatus('El servidor permite enviar un prototipo de modelado. No hay IA generativa 3D conectada ni aprobación automática.');
  }catch(e){
   capability={mode:'offline'};
   $('forgeBadge').textContent='MOTOR NO DISPONIBLE';
   setStatus('No se pudo verificar el servidor. La fabricación está desactivada hasta que responda con seguridad.',true);
  }
 }
 async function statusPoll(){
  if(!commit||!access)return;
  try{
   const r=await fetch(root+'?commit='+encodeURIComponent(commit),{
     cache:'no-store',headers:{'x-highfly-forge-token':access}});
   if(!r.ok)throw Error('Sin confirmación del estado');
   const x=await r.json();
   if(x.runUrl&&x.runUrl.startsWith('https://github.com/drakentzy07/cobalt-hollow-lab/actions/runs/')){
    $('forgeRun').hidden=false;$('forgeRunLink').href=x.runUrl;
   }
   setStatus('GitHub Actions: '+String(x.state||'desconocido')+
     (x.conclusion?' · resultado '+x.conclusion:'')+
     '. Solo se declara terminado cuando GitHub lo confirme. Arte todavía no aprobado.');
   if(x.state==='completed'&&polling){clearInterval(polling);polling=null}
  }catch{setStatus('Seguimiento temporalmente no disponible. Revisá el RUN desde GitHub.',true)}
 }
 $('fabricate3D').onclick=async()=>{
  if(capability.mode!=='operational'){await capabilityCheck();return}
  const comm=getCommission();
  if(!comm){setStatus('Primero tocá «Preparar mi armadura original».',true);return}
  if(comm.input?.image){
   setStatus('El modo imagen todavía no tiene un canal seguro de IA visual. No se envió el encargo.',true);return;
  }
  access=$('forgeToken').value.trim();
  if(!access){setStatus('Ingresá la credencial temporal del propietario antes de crear un RUN.',true);return}
  $('fabricate3D').disabled=true;
  setStatus('Enviando… hasta recibir confirmación del servidor, NO se considera iniciado.');
  try{
   const r=await fetch(root,{method:'POST',headers:{'Content-Type':'application/json',
      'x-highfly-forge-token':access},body:JSON.stringify({
        prompt:comm.input.prompt,preset:'original',consentForImageAnalysis:false})});
   const data=await r.json();
   if(r.status!==202||!data.commit)throw Error(data.message||data.code||'No se confirmó el trabajo');
   commit=data.commit;setStatus('Encargo real aceptado por GitHub. Pendiente de ejecución; aún no hay GLB ni arte aprobado.');
   await statusPoll();
   if(polling)clearInterval(polling);
   polling=setInterval(statusPoll,12000);
  }catch(e){setStatus('❌ No se inició ningún trabajo: '+String(e.message).slice(0,180),true)}
  finally{$('fabricate3D').disabled=capability.mode!=='operational'}
 };
 $('recheckForge').onclick=capabilityCheck;
 capabilityCheck();
 return {capabilityCheck};
}
