#!/usr/bin/env python3
"""HIGHFLY Android P3: ONE native 4-BASE combat surface + optional lab.
Apply after P2/R23 in the disposable frozen donor build only. No main deploy.
No changes to camera, Sim damage, saves, server skills or motion control.
"""
from pathlib import Path
import shutil

def once(path,before,after):
    p=Path(path)
    s=p.read_text(encoding='utf8')
    n=s.count(before)
    if n!=1:raise SystemExit(f'P3_SOURCE_DRIFT:{path}:count={n}:{before[:85]}')
    p.write_text(s.replace(before,after,1),encoding='utf8')

# Requires the P2 opt-in. The *normal* game, desktop, and old P2 remain intact.
once('src/main.ts',
     "  document.body.classList.toggle('hf-android-p2',androidP2);",
     """  document.body.classList.toggle('hf-android-p2',androidP2);
  document.body.classList.toggle('hf-android-p3',androidP2 &&
    new URLSearchParams(location.search).get('hf_android_p3')==='1');""")

new=Path('src/highfly/highfly_android_p3_runtime.ts')
if new.exists():raise SystemExit('P3_MODULE_ALREADY_PRESENT')
shutil.copy2('../v9-corrections/game/c1/highfly_android_p3_runtime.ts',new)

once('src/highfly/highfly_origin_trial_runtime.ts',
     "import { mountOriginR18Editor } from './highfly_origin_r18_loadout';",
     """import { mountOriginR18Editor } from './highfly_origin_r18_loadout';
import { installHighflyAndroidP3 } from './highfly_android_p3_runtime';""")
once('src/highfly/highfly_origin_trial_runtime.ts',
     """  mountOriginR18Editor(sim,panel,list,referencePanel,status,refresh);
  dispatch('sync');""",
     """  mountOriginR18Editor(sim,panel,list,referencePanel,status,refresh);
  installHighflyAndroidP3(sim,shell,toggle,panel);
  dispatch('sync');""")

# The old C1 display transforms ATK into USAR when near an object.
# P3 keeps ATK a combat control; the separately restored native #mobile-interact
# button handles context use via its original event path.
once('src/highfly/game_c1_runtime.ts',
     "  const use = w.__highflyGameC1Context?.canUse?.() === true;",
     "  const use = !document.body.classList.contains('hf-android-p3') && w.__highflyGameC1Context?.canUse?.() === true;")

# P3 owns only presentation; native MobileActionRingPainter and four actual
# mobile action slots still dispatch the exact native cast and cooldown routes.
# C1/C25 are kept installed to avoid breaking any original game systems.
css=Path('src/styles/hud.mobile.css')
style=css.read_text(encoding='utf8')
style+=r"""
/* HIGHFLY P3 CLEAN — Android opt-in only. Never affect PC, P2 or upstream. */
body.mobile-touch.hf-game-c1.hf-android-p3 #actionbar,
body.mobile-touch.hf-game-c1.hf-android-p3 #actionbar2,
body.mobile-touch.hf-game-c1.hf-android-p3 #actionbar3,
body.mobile-touch.hf-game-c1.hf-android-p3 #hf-c1-special-seats,
body.mobile-touch.hf-game-c1.hf-android-p3 #hf-c22-ghost-skills,
body.mobile-touch.hf-game-c1.hf-android-p3 #hf-origin-utility-row,
body.mobile-touch.hf-game-c1.hf-android-p3 #mobile-target-cycle {
  display:none !important;
  pointer-events:none !important;
}
body.mobile-touch.hf-game-c1.hf-android-p3 #mobile-action-ring .mobile-action-slot {
  display:flex !important; /* Exactly 4 existing native source buttons. */
  touch-action:none;
}
body.mobile-touch.hf-game-c1.hf-game-c25.hf-android-p3 #mobile-interact {
  display:flex !important;
  position:fixed !important;
  right:calc(20px + env(safe-area-inset-right)) !important;
  bottom:calc(145px + env(safe-area-inset-bottom)) !important;
  width:48px !important;
  height:48px !important;
  min-width:48px !important;
  min-height:48px !important;
  border-radius:50% !important;
  z-index:184 !important;
  pointer-events:auto;
}
body.mobile-touch.hf-android-p3.game-active #hf-origin-training {
  display:none !important;
}
body.mobile-touch.hf-android-p3.hf-p3-lab-open.game-active #hf-origin-training[data-p3-lab="enabled"] {
  display:block !important;
  position:fixed !important;
  top:calc(8px + env(safe-area-inset-top)) !important;
  right:calc(8px + env(safe-area-inset-right)) !important;
  z-index:9500 !important;
  pointer-events:auto !important;
}
body.mobile-touch.hf-android-p3 #hf-origin-training > button {
  display:none !important; /* old HUNTER SKILLS always hidden */
}
body.mobile-touch.hf-android-p3 #hf-p3-lab-entry {
  display:block;
  width:calc(100% - 20px);
  margin:8px 10px;
  padding:10px;
  border:1px solid #84a8c9;
  border-radius:10px;
  color:white;
  background:#1b3d5c;
  font:700 12px system-ui,sans-serif;
  touch-action:manipulation;
}
body.mobile-touch.hf-android-p3 #hf-p3-lab-close,
body.mobile-touch.hf-android-p3 #hf-p3-base-preset {
  display:block;
  margin:3px 0 9px;
  padding:9px;
  width:100%;
  background:#204465;
  border:1px solid #668cad;
  border-radius:9px;
  color:white;
  font:700 12px system-ui,sans-serif;
}
body.mobile-touch.hf-android-p3 #hf-p3-base-result {
  color:#a9d8ec;
  font:12px system-ui,sans-serif;
}
body.mobile-touch.hf-android-p3 #hf-p3-aux-root {
  display:none; /* only gameplay */
}
body.mobile-touch.hf-android-p3.game-active:not(.hf-p3-lab-open) #hf-p3-aux-root {
  display:block;
  position:fixed;
  left:44%;
  bottom:calc(8px + env(safe-area-inset-bottom));
  z-index:185;
  pointer-events:none;
}
body.mobile-touch.hf-android-p3 #hf-p3-aux-toggle {
  display:block;
  border-radius:9px;
  border:1px solid #b39b69;
  width:42px;
  height:38px;
  background:#18283cdd;
  color:#f2dbb4;
  font:700 11px system-ui,sans-serif;
  pointer-events:auto;
  touch-action:manipulation;
}
body.mobile-touch.hf-android-p3 #hf-p3-aux-grid {
  display:grid;
  position:absolute;
  left:50%;
  bottom:45px;
  transform:translateX(-50%);
  grid-template-columns:repeat(4,42px);
  gap:6px;
  padding:7px;
  border:1px solid #677589;
  border-radius:12px;
  background:#0c1c32e9;
  pointer-events:auto;
}
body.mobile-touch.hf-android-p3 #hf-p3-aux-grid[hidden],
body.mobile-touch.hf-android-p3 #hf-p3-aux-grid button[hidden],
body.mobile-touch.hf-android-p3 #hf-p3-aux-toggle[hidden] {
  display:none !important;
}
body.mobile-touch.hf-android-p3.mobile-window-open #hf-p3-aux-root,
body.mobile-touch.hf-android-p3.mobile-more-open #hf-p3-aux-root {
  visibility:hidden !important;
  pointer-events:none !important;
}
body.mobile-touch.hf-android-p3.hf-p3-lab-open #mobile-action-ring,
body.mobile-touch.hf-android-p3.hf-p3-lab-open #mobile-move-joystick,
body.mobile-touch.hf-android-p3.hf-p3-lab-open #mobile-move-zone,
body.mobile-touch.hf-android-p3.hf-p3-lab-open #mobile-interact {
  visibility:hidden !important;
  pointer-events:none !important;
}
"""
css.write_text(style,encoding='utf8')
if 'hf-android-p3' not in css.read_text():
    raise SystemExit('P3_CSS_NOT_INSTALLED')
print('HIGHFLY_ANDROID_P3_CLEAN_SINGLE_NATIVE_4BASE_HUD_AND_OPT_IN_LAB_PATCH_GREEN=1')
