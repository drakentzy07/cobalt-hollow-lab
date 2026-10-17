#!/usr/bin/env python3
"""R24 opt-in shared mobile ring in desktop keyboard+mouse browser.
Runs AFTER CLEAN P1 patch in disposable ClaudeCraft v0.44.0 worktree.
All changes gated by ?hf_r24=1; no migration, no hidden ability deletion,
no damage/cooldown/cast/skill semantics changed.
"""
from pathlib import Path

def once(path, before, after):
    p=Path(path)
    source=p.read_text(encoding='utf-8')
    found=source.count(before)
    if found!=1: raise SystemExit(f'R24_SOURCE_DRIFT {path} {found}: {before[:85]!r}')
    p.write_text(source.replace(before,after,1),encoding='utf-8')

main='src/main.ts'
once(main,
"""function syncPhoneTouchClass(): void {
  document.body.classList.toggle('mobile-touch', NATIVE_APP || useTouchInterface());
  syncCommunityMenuMode();
}""",
"""function syncPhoneTouchClass(): void {
  // R24 opt-in: preview the EXISTING native mobile combat ring on desktop.
  // Do not activate MobileControls pointer listeners for mouse: only the CSS/HUD
  // presentation is unified. Default production remains unchanged.
  const r24=new URLSearchParams(location.search).get('hf_r24')==='1';
  const desktop=r24 && !NATIVE_APP && !isPhoneTouchDevice() && !useTouchInterface();
  document.body.classList.toggle('hf-r24-preview',r24);
  document.body.classList.toggle('hf-r24-desktop',desktop);
  document.body.classList.toggle('mobile-touch', NATIVE_APP || useTouchInterface() || desktop);
  syncCommunityMenuMode();
}""")

mobile='src/game/mobile_controls.ts'
once(mobile,
"    document.body.classList.toggle('mobile-touch', active);",
"""    // Keep R24 PC native mobile chrome visible while touch pointer routing
    // remains inactive. Native S23 still follows the original touch ownership.
    document.body.classList.toggle('mobile-touch',
      active || document.body.classList.contains('hf-r24-desktop'));""")

inputfile='src/game/input.ts'
once(inputfile,
"""  ) {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));""",
"""  ) {
    // R24 desktop: allow native Mouse Camera WASD strafe without changing
    // the saved mouseCamera preference or keyboard bindings of legacy users.
    if (document.body.classList.contains('hf-r24-desktop')) this.mouseCameraEnabled=true;
    window.addEventListener('keydown', (e) => this.onKeyDown(e));""")
once(inputfile,
"""  setMouseCameraEnabled(on: boolean): void {
    this.mouseCameraEnabled = on;""",
"""  setMouseCameraEnabled(on: boolean): void {
    this.mouseCameraEnabled = on || document.body.classList.contains('hf-r24-desktop');""")
# The GOLDEN decoupled camera rule was intended for phone only, not a desktop
# displaying the same ring. Keep mouse camera behavior native on desktop.
once(inputfile,
"""      document.body.classList.contains('mobile-touch') &&
      this.cb.isCameraLocked?.() !== true""",
"""      document.body.classList.contains('mobile-touch') &&
      !document.body.classList.contains('hf-r24-desktop') &&
      this.cb.isCameraLocked?.() !== true""")

hud='src/ui/hud.ts'
once(hud,
"""  private currentMobileActionPage(): number {
    return clampMobilePage(this.mobileActionPage);
  }""",
"""  private currentMobileActionPage(): number {
    // R24: exactly four visible BASE actions, with legacy pages/data preserved.
    return document.body.classList.contains('hf-r24-preview')
      ? 0 : clampMobilePage(this.mobileActionPage);
  }""")

css=Path('src/styles/hud.mobile.css')
style=r"""
/* HIGHFLY R24 OPT-IN: same original mobile ring on PC, no cloned action logic. */
@layer hud-mobile {
  body.hf-r24-preview #mobile-action-page-toggle { display:none !important; }
  body.hf-r24-desktop #mobile-move-zone,
  body.hf-r24-desktop #mobile-move-joystick,
  body.hf-r24-desktop #mobile-camera-joystick,
  body.hf-r24-desktop #mobile-autorun-target { display:none !important; pointer-events:none !important; }
  body.hf-r24-desktop.game-active #mobile-controls::before {
    content:"W  A  S  D  ·  MOVER     |     MOUSE  ·  CÁMARA";
    position:absolute;left:max(24px,env(safe-area-inset-left));
    bottom:max(26px,env(safe-area-inset-bottom));
    z-index:24;pointer-events:none;user-select:none;
    padding:10px 14px;border:1px solid #b7955570;border-radius:9px;
    color:#e9d6a4;background:#111c2bd9;
    font:700 clamp(11px,1vw,15px)/1.4 system-ui,sans-serif;
    letter-spacing:.025em;
  }
  body.hf-r24-desktop.game-active #mobile-action-ring {
    --mobile-chrome-scale:.95;
  }
  body.hf-r24-desktop #mobile-action-ring > button { touch-action:manipulation; }
  body.hf-r24-preview #mobile-action-ring .mobile-action-slot {
    outline-offset:2px;
  }
}
"""
css.write_text(css.read_text(encoding='utf-8')+"\n"+style,encoding='utf-8')
print('HIGHFLY_R24_SHARED_NATIVE_RING_PC_WASD_MOUSE_AND_S23_4BASE_OPTIN_PATCH_READY=1')
