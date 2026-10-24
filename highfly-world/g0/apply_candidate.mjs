/**
 * HIGHFLY WORLD G0 — clean v0.44.7 world-entry overlay.
 * This is a map/asset smoke candidate, NOT the final universal Hunter.
 * The engine's native Warrior identity is a temporary internal test fixture.
 *
 * Fail closed on donor drift. Never write to any production build or save.
 */
import {readFileSync,writeFileSync} from 'node:fs';
function one(file, oldText, replacement) {
  let source=readFileSync(file,'utf8');
  const count=source.split(oldText).length-1;
  if(count!==1)throw Error('HIGHFLY_G0_UPSTREAM_DRIFT '+file+' anchorCount='+count+' '+oldText.slice(0,80));
  writeFileSync(file,source.replace(oldText,replacement),'utf8');
}

one('src/game/offline_world_config.ts',
  '    compulsoryTutorial: options.world === undefined,',
  "    compulsoryTutorial: import.meta.env.VITE_HIGHFLY_WORLD_GENESIS === '1' && new URLSearchParams(location.search).get('hfWorld') === '1' ? false : options.world === undefined,");

one('src/main.ts',
  "  void startOffline('warrior', 'Diagnostics', 0);\n} else {\n  startSitePresence('home');\n  wireStartScreens();",
  [
    "  void startOffline('warrior', 'Diagnostics', 0);",
    "} else if (import.meta.env.VITE_HIGHFLY_WORLD_GENESIS === '1' &&",
    "           startupParams.get('hfWorld') === '1' &&",
    "           location.pathname.startsWith(import.meta.env.BASE_URL)) {",
    "  // G0: validate the native terrain, world boot and combat entities before",
    "  // replacing the internal character class/creator with HIGHFLY's own schema.",
    "  // No production save is read or written by this isolated build.",
    "  startSitePresence('home');",
    "  const enter = document.getElementById('hf-world-enter') as HTMLButtonElement | null;",
    "  enter?.addEventListener('click', () => {",
    "    enter.disabled = true;",
    "    void startOffline('warrior', 'WorldTester', 0).catch((error) => {",
    "      console.error('HIGHFLY_G0_WORLD_BOOT_FAILED', error);",
    "      enter.disabled = false;",
    "    });",
    "  });",
    "} else {",
    "  startSitePresence('home');",
    "  wireStartScreens();"
  ].join('\n'));

const index='index.html';
let html=readFileSync(index,'utf8');
const found=html.match(/<img class="ls-logo" src="\/worldofclaudecraft-logo\.png"[^>]*>/g);
if(!found||found.length!==1)throw Error('HIGHFLY_G0_LOADING_BRAND_DRIFT');
html=html.replace(found[0],'<div class="ls-logo hf-world-loading-logo" role="img" aria-label="HIGHFLY WORLD">HIGHFLY WORLD</div>');
const banner=[
'<style id="hf-world-g0-style">',
'html.hf-world-genesis #start-screen,',
'html.hf-world-genesis .steam-wishlist,',
'html.hf-world-genesis #mm-wiki,',
'html.hf-world-genesis #mm-discord,',
'html.hf-world-genesis #nav-btn-wiki,',
'html.hf-world-genesis #mobile-discord {display:none!important}',
'html.hf-world-genesis .hf-world-loading-logo {color:#e5c477;font:900 clamp(22px,4vw,42px)/1.3 system-ui;text-align:center;letter-spacing:.12em;margin:auto}',
'#hf-world-gate[hidden]{display:none!important}',
'#hf-world-gate {position:fixed;inset:0;z-index:2147483600;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 38%,#194252 0%,#08141f 70%,#050911 100%);color:#f3e9c9;font:16px system-ui;text-align:center;box-sizing:border-box;padding:18px}',
'#hf-world-gate .hf-card {border:1px solid #bb975a;background:#0b1c2b;padding:22px;border-radius:14px;max-width:min(94vw,520px);box-shadow:0 20px 60px #000a}',
'#hf-world-gate h1{margin:0 0 5px;font-size:clamp(24px,5vw,40px);letter-spacing:.14em}',
'#hf-world-gate p{font-size:clamp(12px,2vw,15px);color:#ced8dd}',
'#hf-world-enter {min-width:205px;min-height:48px;border:1px solid #efd493;border-radius:10px;background:#e1bf70;color:#09131c;font-weight:800;font-size:16px;cursor:pointer}',
'</style>',
'<div id="hf-world-gate" hidden role="dialog" aria-modal="true" aria-label="HIGHFLY WORLD">',
' <div class="hf-card">',
'  <h1>HIGHFLY WORLD</h1>',
'  <p>Un mundo para explorar. Combate HIGHFLY en desarrollo.</p>',
'  <button type="button" id="hf-world-enter">ENTRAR AL MUNDO</button>',
'  <p>G0 · prueba del mapa offline · personaje técnico temporal</p>',
' </div>',
'</div>',
'<script id="hf-world-g0-entry">',
'(function(){',
" if(new URLSearchParams(location.search).get('hfWorld')!=='1')return;",
" document.documentElement.classList.add('hf-world-genesis');",
" var gate=document.getElementById('hf-world-gate'); if(gate)gate.hidden=false;",
" var enter=document.getElementById('hf-world-enter');",
" if(enter)enter.addEventListener('click',function(){",
"  try { var fs=document.documentElement.requestFullscreen?.(); if(fs&&fs.catch)fs.catch(function(){}); } catch(_e){}",
"  try { screen.orientation.lock?.('landscape')?.catch?.(function(){}); } catch(_e){}",
"  if(gate)gate.hidden=true;",
" });",
'})();',
'</script>'
].join('\n');
const suffix='  <script type="module" src="/src/main.ts"></script>';
if(html.split(suffix).length!==2)throw Error('HIGHFLY_G0_ENTRY_ANCHOR');
html=html.replace(suffix,banner+'\n'+suffix);
writeFileSync(index,html,'utf8');
console.log('HIGHFLY_G0_CLEAN_0447_OFFLINE_MAP_ENTRY_PATCHED=PASS');
