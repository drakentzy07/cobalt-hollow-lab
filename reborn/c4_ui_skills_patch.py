#!/usr/bin/env python3
"""REBORN C4: introduce HIGHFLY offline gate, native HUD and 4 original abilities.
No licensing sanitizer, media mutation, second Sim, or Pages publication.
"""
from pathlib import Path
import shutil,subprocess

def swap(f,old,new,label):
 p=Path(f);t=p.read_text(encoding='utf8')
 if t.count(old)!=1:raise SystemExit(f'HIGHFLY_C4_ANCHOR_DRIFT {label}: {t.count(old)}')
 p.write_text(t.replace(old,new),encoding='utf8')

root=Path('src/highfly/reborn');root.mkdir(parents=True,exist_ok=True)
shutil.copyfile('../tools/reborn/c4_skill_defs.ts',root/'skill_defs.ts')
shutil.copyfile('../tools/reborn/c4_hud.ts',root/'hud.ts')
swap('src/sim/content/classes.ts',
 "import type {", "import type {", 'noop') if False else None
p=Path('src/sim/content/classes.ts')
t=p.read_text()
if 'HIGHFLY_REBORN_SKILLS' in t:raise SystemExit('HIGHFLY_C4_ALREADY_PATCHED')
p.write_text("import { HIGHFLY_REBORN_SKILLS } from '../../highfly/reborn/skill_defs';\n"+t)
swap('src/sim/content/classes.ts',
 """    startItems: START_RATIONS,
    abilities: [
      'heroic_strike',""",
 """    startItems: START_RATIONS,
    abilities: [
      // HIGHFLY native-first kit, no proprietary icon or effect assets.
      'highfly_arc_shot',
      'highfly_cross_cut',
      'highfly_breakstep',
      'highfly_storm_circle',
      'heroic_strike',""",'warrior adapter known skills')
swap('src/sim/content/classes.ts',
 """export const ABILITIES: Record<string, AbilityDef> = {
  ...PALADIN_CORE_ABILITIES,""",
 """export const ABILITIES: Record<string, AbilityDef> = {
  ...PALADIN_CORE_ABILITIES,
  ...HIGHFLY_REBORN_SKILLS,""", 'register in native Sim')

p=Path('src/main.ts')
t=p.read_text()
if 'mountRebornHud' in t:raise SystemExit('HIGHFLY_C4_MAIN_ALREADY_PATCHED')
p.write_text("import { mountRebornHud } from './highfly/reborn/hud';\n"+t)
swap('src/main.ts',
 """  mobileControls.start();""",
 """  mobileControls.start();
  if (import.meta.env.VITE_HIGHFLY_REBORN === '1') {
    mountRebornHud(world, renderer);
    document.body.classList.add('hf-reborn-world-running');
  }""", 'mount native action dock')

# Own entry branch; keep original editor+diagnostics; never modify original
# landing art. Only activate under explicit VITE_HIGHFLY_REBORN flag.
swap('src/main.ts',
 """} else {
  startSitePresence('home');
  wireStartScreens();
  initHomepageMusic();
}""",
 """} else if (import.meta.env.VITE_HIGHFLY_REBORN === '1') {
  startSitePresence('home');
  const gate = document.getElementById('hf-reborn-entry');
  const field = document.getElementById('hf-reborn-hunter-name') as HTMLInputElement | null;
  const status = document.getElementById('hf-reborn-entry-error');
  const start = (mode:'world'|'lab', button:HTMLButtonElement) => {
    const name = sanitizeOfflineName(field?.value || 'Hunter');
    if (field) field.value = name;
    const url=new URL(location.href);
    if(mode==='lab') url.searchParams.set('hfLab','1');
    else url.searchParams.delete('hfLab');
    history.replaceState(history.state,'',url);
    button.disabled=true;
    try { const fs=document.documentElement.requestFullscreen?.(); if(fs)void fs.catch(()=>{}); } catch {}
    try { void screen.orientation.lock?.('landscape').catch(()=>{}); } catch {}
    if(gate)gate.hidden=true;
    void startOffline('warrior',name,0).catch(error=>{
      console.error('HIGHFLY_REBORN_BOOT_FAILED',error);
      button.disabled=false;
      if(gate)gate.hidden=false;
      if(status)status.textContent='No pudo abrirse el mundo. Revisar los recursos.';
    });
  };
  const worldButton=document.getElementById('hf-reborn-enter-world') as HTMLButtonElement | null;
  const labButton=document.getElementById('hf-reborn-enter-lab') as HTMLButtonElement | null;
  worldButton?.addEventListener('click',()=>start('world',worldButton));
  labButton?.addEventListener('click',()=>start('lab',labButton));
} else {
  startSitePresence('home');
  wireStartScreens();
  initHomepageMusic();
}""", 'offline launcher')

html=Path('index.html')
text=html.read_text(encoding='utf8')
if 'hf-reborn-entry' in text:raise SystemExit('HIGHFLY_C4_HTML_ALREADY_PATCHED')
anchor='  <script type="module" src="/src/main.ts"></script>'
if text.count(anchor)!=1: raise SystemExit('HIGHFLY_C4_INDEX_ANCHOR_DRIFT')
add="""<style id="hf-reborn-style">
#hf-reborn-entry[hidden]{display:none!important}
#hf-reborn-entry{position:fixed;inset:0;z-index:2147483000;display:flex;
  justify-content:center;align-items:center;box-sizing:border-box;overflow-y:auto;
  background:radial-gradient(ellipse at 50% 34%,#193f55,#091824 60%,#03090e);
  color:#e9f4fa;font:16px system-ui,sans-serif;padding:18px}
#hf-reborn-entry *{box-sizing:border-box}
#hf-reborn-entry .hf-launch{width:min(680px,94vw);text-align:center;padding:24px 22px 26px;
  border:1px solid #b9975d;border-radius:18px;background:rgba(5,17,28,.90);
  box-shadow:0 15px 55px rgba(0,0,0,.5)}
#hf-reborn-entry h1{font-size:clamp(32px,6vw,62px);letter-spacing:.09em;
  color:#ffd18d;margin:0 0 2px;font-weight:900}
#hf-reborn-entry .hf-sub{font-weight:700;letter-spacing:.18em;
  color:#9fdbef;font-size:clamp(12px,2.7vw,19px);margin:2px 0 16px}
#hf-reborn-entry p{margin:6px 0 14px}
#hf-reborn-entry label{display:block;max-width:340px;text-align:left;
  margin:0 auto 5px;font-size:13px}
#hf-reborn-entry input{display:block;width:min(340px,85vw);margin:auto;
  background:#edf4fb;border:2px solid #8bb5c9;border-radius:10px;
  color:#132a40;font-size:17px;padding:12px;direction:ltr;text-align:left;
  transform:none!important}
#hf-reborn-entry .hf-choice{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin:18px 0}
#hf-reborn-entry .hf-choice button{min-height:52px;min-width:210px;border:1px solid #fbd79e;
  border-radius:12px;background:#e3b969;font-weight:900;color:#132236;
  font-size:15px;touch-action:manipulation}
#hf-reborn-entry .hf-choice button:last-child{background:#214e64;color:#f0f6fa}
#hf-reborn-entry button:disabled{opacity:.55}
#hf-reborn-entry small{font-size:12px;color:#a2bccb}
#hf-reborn-entry-error{color:#ffac97;min-height:20px}
#hf-reborn-hud{position:fixed;right:max(7px,env(safe-area-inset-right));
 bottom:max(7px,env(safe-area-inset-bottom));width:min(370px,53vw);height:245px;
 z-index:500000;display:none;pointer-events:none;color:#fff;font:700 13px system-ui;
 -webkit-user-select:none;user-select:none;touch-action:none}
body.game-active.mobile-touch #hf-reborn-hud{display:block}
#hf-reborn-hud .hf-native,#hf-reborn-hud .hf-action{position:absolute;pointer-events:auto}
#hf-reborn-hud button{box-sizing:border-box;touch-action:none;-webkit-tap-highlight-color:transparent}
#hf-reborn-hud .hf-native>button,#hf-reborn-hud .hf-action{
  display:flex!important;align-items:center!important;justify-content:center!important;
  position:static!important;opacity:1!important;transform:none!important;
  width:100%!important;height:100%!important;border-radius:50%!important;
  background:#1a3448!important;border:2px solid #8dc9df!important;
  color:#f2f7fa!important;font:800 13px system-ui!important;
  padding:0!important;line-height:1.1!important;pointer-events:auto!important}
#hf-atk-dock{width:89px;height:89px;right:93px;bottom:2px}
#hf-reborn-hud #hf-atk-dock>button{background:#873a30!important;
 border:3px solid #ffd08b!important;font-size:21px!important}
#hf-dash-dock{width:65px;height:65px;right:212px;bottom:19px}
#hf-jump-dock{width:65px;height:65px;right:17px;bottom:92px}
#hf-use-dock{width:58px;height:58px;right:10px;bottom:8px}
#hf-reborn-hud .hf-s1{width:63px!important;height:63px!important;right:20px;bottom:169px}
#hf-reborn-hud .hf-s2{width:63px!important;height:63px!important;right:98px;bottom:166px}
#hf-reborn-hud .hf-s3{width:63px!important;height:63px!important;right:176px;bottom:136px}
#hf-reborn-hud .hf-s4{width:63px!important;height:63px!important;right:278px;bottom:85px}
#hf-reborn-hud .hf-action.hf-aiming{border-color:#ffe08d!important;background:#365c65!important}
#hf-reborn-hud #hf-reborn-cancel{position:fixed;right:12px;top:52px;
 width:50px;height:50px;border:2px solid #fff3ca;border-radius:50%;
 background:#8d3e42;color:#fff;font-size:24px;pointer-events:auto}
#hf-reborn-cancel[hidden],#hf-reborn-aim[hidden]{display:none!important}
#hf-reborn-aim{position:fixed;width:68px;height:68px;margin:-34px 0 0 -34px;
 border:3px dashed #ffd47b;border-radius:50%;background:rgba(56,185,224,.19);
 box-shadow:0 0 10px #20adcb;pointer-events:none}
#hf-reborn-hint{position:fixed;right:22px;bottom:248px;min-height:20px;
 font:700 13px system-ui;text-shadow:0 2px 5px #000}
@media(max-height:370px){#hf-reborn-hud{transform:scale(.85);transform-origin:bottom right}}
@media(max-width:560px){#hf-reborn-hud{transform:scale(.85);transform-origin:bottom right}}
</style>
<section id="hf-reborn-entry" role="dialog" aria-modal="true" aria-label="HIGHFLY RPG Fitness World">
  <div class="hf-launch">
    <h1>HIGHFLY</h1>
    <p class="hf-sub">RPG FITNESS WORLD</p>
    <p>Tu entrenamiento construye a tu Hunter. Tu mundo, tus decisiones.</p>
    <label for="hf-reborn-hunter-name">NOMBRE DEL HUNTER</label>
    <input id="hf-reborn-hunter-name" value="Hunter" maxlength="16" autocomplete="off" />
    <div class="hf-choice">
      <button type="button" id="hf-reborn-enter-world">ENTRAR AL MUNDO</button>
      <button type="button" id="hf-reborn-enter-lab">ENTRAR AL LABORATORIO</button>
    </div>
    <p id="hf-reborn-entry-error" role="alert"></p>
    <small>OFFLINE • FURY 360° • Entrenamiento real • Prototipo técnico</small>
  </div>
</section>
"""
html.write_text(text.replace(anchor,add+'\n'+anchor),encoding='utf8')
# Original assets MUST remain byte-for-byte original. This is a source-only integration.
changed=subprocess.check_output(['git','status','--porcelain','--untracked-files=no','--','public'],text=True).strip()
if changed:raise SystemExit('HIGHFLY_C4_PUBLIC_ASSETS_CHANGED '+changed)
print('HIGHFLY_REBORN_C4_ORIGINAL_SKILLS_REGISTERED_IN_SIM=PASS')
print('HIGHFLY_REBORN_C4_OWN_OFFLINE_INTRO_AND_TOUCH_DOCK=PASS')
print('HIGHFLY_REBORN_C4_ARTWORK_UNCHANGED_AND_RESTRICTED_ASSETS_NOT_PUBLISHED=PASS')
