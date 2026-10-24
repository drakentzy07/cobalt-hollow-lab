/**
 * C2-04 Android preview entry only. v0.44.7 production hides offline mode.
 * Guarded HTML + startOffline launch; no Fury/Sim/asset changes.
 */
import {readFileSync,writeFileSync} from 'node:fs';
function one(path,before,after){
  const s=readFileSync(path,'utf8');
  if(s.split(before).length!==2)throw Error('C204_ENTRY_ANCHOR_DRIFT '+path);
  writeFileSync(path,s.replace(before,after),'utf8');
}
const branch=[
'} else if (',
"  import.meta.env.VITE_HIGHFLY_C204_PLAYTEST === '1' &&",
"  location.pathname.includes('/c204/') &&",
"  startupParams.get('hfWorld') === '1'",
') {',
"  startSitePresence('home');",
"  const gate=document.getElementById('hf-c204-play-gate');",
"  const field=document.getElementById('hf-c204-hunter-name') as HTMLInputElement | null;",
"  const launch=(kind:'world'|'lab',button:HTMLButtonElement)=>{",
"    const name=sanitizeOfflineName(field?.value||'Hunter');",
"    const url=new URL(location.href);",
"    if(kind==='lab')url.searchParams.set('hfLab','1');",
"    else url.searchParams.delete('hfLab');",
"    history.replaceState(history.state,'',url);",
"    button.disabled=true;",
"    try{const fs=document.documentElement.requestFullscreen?.();if(fs)void fs.catch(()=>{});}catch{}",
"    try{void screen.orientation.lock?.('landscape').catch(()=>{});}catch{}",
"    if(gate)gate.hidden=true;",
"    void startOffline('warrior',name,0).catch(error=>{",
"      console.error('HIGHFLY_C204_OFFLINE_WORLD_BOOT_FAILED',error);",
"      button.disabled=false;",
"      if(gate)gate.hidden=false;",
"      const status=document.getElementById('hf-c204-boot-error');",
"      if(status)status.textContent='El mundo no pudo iniciarse. Revisar recursos.';",
"    });",
"  };",
"  const world=document.getElementById('hf-c204-world') as HTMLButtonElement|null;",
"  const lab=document.getElementById('hf-c204-lab') as HTMLButtonElement|null;",
"  world?.addEventListener('click',()=>launch('world',world));",
"  lab?.addEventListener('click',()=>launch('lab',lab));",
'} else {',
"  startSitePresence('home');",
"  wireStartScreens();",
"  initHomepageMusic();",
'}'
].join('\n');
const tail=[
'} else {',
"  startSitePresence('home');",
"  wireStartScreens();",
"  initHomepageMusic();",
'}'
].join('\n');
one('src/main.ts',tail,branch);
const html=[
'<style id="hf-c204-entry-css">',
'#hf-c204-play-gate[hidden]{display:none!important}',
'#hf-c204-play-gate{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;overflow:auto;padding:16px;box-sizing:border-box;color:#e8eef8;background:radial-gradient(ellipse at 40% 25%,#143349 0%,#091724 65%,#040a12 100%);font:15px system-ui,sans-serif}',
'#hf-c204-play-gate .hf-c204-card{max-width:560px;width:100%;padding:clamp(18px,3vw,32px);background:#0b1c2c;border:1px solid #c6a35f;border-radius:16px;box-shadow:0 14px 60px #000b;text-align:center}',
'#hf-c204-play-gate h1{color:#f0cc7e;letter-spacing:.1em;font-size:clamp(23px,4vw,38px);margin:0 0 4px}',
'#hf-c204-play-gate p{margin:7px 0 16px}',
'#hf-c204-play-gate label{display:block;text-align:left;font-size:13px;margin:10px auto 4px;max-width:310px}',
'#hf-c204-play-gate input{width:100%;max-width:310px;box-sizing:border-box;padding:11px;border:1px solid #7893ac;border-radius:9px;background:#e8edf2;color:#142031;font-size:16px}',
'#hf-c204-play-gate .hf-c204-actions{display:flex;justify-content:center;flex-wrap:wrap;gap:12px;margin:19px auto 10px}',
'#hf-c204-play-gate button{min-width:180px;min-height:49px;border-radius:9px;border:1px solid #e7c878;background:#e8bd70;color:#122033;font-size:15px;font-weight:800;touch-action:manipulation}',
'#hf-c204-play-gate button:disabled{opacity:.55}',
'#hf-c204-play-gate small{color:#b6cadb}',
'#hf-c204-boot-error{color:#ffc2b4;font-weight:600}',
'</style>',
'<section id="hf-c204-play-gate" role="dialog" aria-modal="true" aria-label="HIGHFLY CLEAN C2-04">',
' <div class="hf-c204-card">',
'  <h1>HIGHFLY WORLD</h1>',
'  <p>C2-04 · Prueba Android de GOLDEN 360°, doble salto y entrenamiento.</p>',
'  <label for="hf-c204-hunter-name">Nombre del Hunter</label>',
'  <input id="hf-c204-hunter-name" maxlength="16" value="Hunter" autocomplete="off"/>',
'  <div class="hf-c204-actions">',
'   <button type="button" id="hf-c204-world">ENTRAR AL MUNDO</button>',
'   <button type="button" id="hf-c204-lab">LABORATORIO</button>',
'  </div>',
'  <p id="hf-c204-boot-error" role="alert"></p>',
'  <small>Prueba offline, entrenamientos guardados por separado en Mundo y LAB.</small>',
' </div>',
'</section>'
].join('\n');
one('index.html','  <script type="module" src="/src/main.ts"></script>',html+'\n  <script type="module" src="/src/main.ts"></script>');
console.log('HIGHFLY_C204_ISOLATED_WORLD_AND_LAB_ENTRY_GUARDED=PASS');
