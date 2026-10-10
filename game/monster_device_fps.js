/* HIGHFLY P02-J — voluntary on-device frame diagnostics.
 * Loaded ONLY from Monster Lab game.html, NEVER from main HIGHFLY/V4.
 * ?hfPerf=1 activates. One requestAnimationFrame loop, no gameplay writes,
 * network, analytics, storage, canvas/context access or global event capture.
 */
(()=>{
  'use strict';
  const query = new URLSearchParams(location.search);
  const level = query.get('hfHunt');
  if(query.get('hfPerf')!=='1' || !/^(21|30|40|50|60|70|80|90)$/.test(level || ''))return;
  const maxWindowMs=5000;
  const warmupMs=2500;
  const start=performance.now();
  let last=0,updated=0;
  const frames=[];
  const label='Hunter LV'+level+(query.get('hfEncounter')?' · '+query.get('hfEncounter'):' · normal');
  const overlay=document.createElement('aside');
  overlay.setAttribute('aria-label','Diagnóstico temporal de FPS de Monster Lab');
  overlay.id='hf-monster-device-fps';
  overlay.style.cssText=[
    'position:fixed','top:8px','right:8px','z-index:2147482000',
    'box-sizing:border-box','min-width:164px','max-width:200px',
    'padding:9px 11px','border:1px solid #55c5bc','border-radius:9px',
    'background:rgba(7,16,27,.88)','color:#fff','font:12px/1.45 system-ui,sans-serif',
    'white-space:pre-line','text-align:left','pointer-events:none',
    'box-shadow:0 2px 12px rgba(0,0,0,.4)'
  ].join(';');
  overlay.textContent='HIGHFLY · FPS REAL\n'+label+'\nCalibrando 3 s…';
  (document.body || document.documentElement).appendChild(overlay);
  const state={mode:'mobile-rAF',level:Number(level),fps:null,p95ms:null,stuttersPct:null,frames:0,ready:false};
  Object.defineProperty(window,'__hfMonsterFps',{value:state,configurable:false,writable:false});
  function reset(t){
    last=t;updated=t;frames.length=0;
    state.fps=null;state.p95ms=null;state.stuttersPct=null;state.frames=0;state.ready=false;
  }
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)reset(performance.now());
  },{passive:true});
  function tick(t){
    requestAnimationFrame(tick);
    if(document.hidden){last=t;return;}
    if(!last){last=t;return;}
    const dt=t-last;last=t;
    if(t-start<warmupMs)return;
    if(!Number.isFinite(dt)||dt<=0||dt>2000){reset(t);return;}
    frames.push([t,dt]);
    while(frames.length&&t-frames[0][0]>maxWindowMs)frames.shift();
    if(t-updated<950)return;
    updated=t;
    const elapsed=frames.reduce((sum,entry)=>sum+entry[1],0);
    if(frames.length<4||elapsed<=0)return;
    const durations=frames.map(entry=>entry[1]).sort((a,b)=>a-b);
    const p95=durations[Math.min(durations.length-1,Math.ceil(durations.length*.95)-1)];
    const stutters=durations.filter(ms=>ms>50).length;
    const fps=frames.length*1000/elapsed;
    state.fps=Math.round(fps*10)/10;
    state.p95ms=Math.round(p95);
    state.stuttersPct=Math.round(100*stutters/frames.length);
    state.frames=frames.length;
    state.ready=true;
    overlay.textContent='HIGHFLY · FPS REAL\n'+label+'\nFPS '+state.fps.toFixed(1)+
      ' | p95 '+state.p95ms+' ms\nTirones >50 ms: '+state.stuttersPct+'%'+
      '\nVentana de ~5 s · S23';
  }
  requestAnimationFrame(tick);
})();
