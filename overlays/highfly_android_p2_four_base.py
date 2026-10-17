#!/usr/bin/env python3
"""HIGHFLY Android P2: four visible BASE buttons on real S23, untouched PC MMO.
Apply AFTER the GREEN P1 Hunter M/F patch on frozen ClaudeCraft v0.44.0 donor.
Opt-in ?hf_android_p2=1; R23 joystick/GOLDEN camera, original Sim and save intact.
"""
from pathlib import Path

def once(path,old,new):
    p=Path(path)
    s=p.read_text(encoding='utf8')
    n=s.count(old)
    if n!=1: raise SystemExit(f'ANDROID_P2_SOURCE_DRIFT:{path}:count={n}:{old[:80]}')
    p.write_text(s.replace(old,new,1),encoding='utf8')

once('src/main.ts',
"""function syncPhoneTouchClass(): void {
  document.body.classList.toggle('mobile-touch', NATIVE_APP || useTouchInterface());
  syncCommunityMenuMode();
}""",
"""function syncPhoneTouchClass(): void {
  // Android-only opt-in. Never force mobile-touch on desktop or modify its input.
  const androidP2=new URLSearchParams(location.search).get('hf_android_p2')==='1'
    && (NATIVE_APP || isPhoneTouchDevice());
  document.body.classList.toggle('hf-android-p2',androidP2);
  document.body.classList.toggle('mobile-touch', NATIVE_APP || useTouchInterface());
  syncCommunityMenuMode();
}""")

once('src/ui/hud.ts',
"""  private currentMobileActionPage(): number {
    return clampMobilePage(this.mobileActionPage);
  }""",
"""  private currentMobileActionPage(): number {
    // The Hunter sees four BASE skills on the S23 action arc. Additional
    // learned skills remain saved, selectable in the original skills library;
    // never invent placeholders for secret unique skills or mutate the Sim.
    return this.isMobileLayout() && document.body.classList.contains('hf-android-p2')
      ? 0 : clampMobilePage(this.mobileActionPage);
  }""")

# Android P2 ONLY: a new offline Hunter must not be auto-ferried into
# ClaudeCraft's compulsory island tutorial, which opens a native window and
# leaves the combat HUD hidden by its legitimate modal gate.
# Keep the original compulsoryTutorial setting for desktop and legacy entries.
once('src/main.ts',
     "        const hunter = new Sim({...cfg,originHunterEnabled:true});",
     """        const androidP2Hunter = new URLSearchParams(location.search).get('hf_android_p2')==='1'
          && (NATIVE_APP || isPhoneTouchDevice());
        const hunter = new Sim({...cfg,originHunterEnabled:true,
          compulsoryTutorial: androidP2Hunter ? false : cfg.compulsoryTutorial});""")

css=Path('src/styles/hud.mobile.css')
s=css.read_text(encoding='utf8')
s+=r"""
/* HIGHFLY Android P2: real native 4 BASE arc + ATK on S23; no desktop impact.
   Keep the native separate buffs, consumable and GEM banks until HUD cleanup P3.
   Never force a mobile HUD on PC, never disable camera/joystick touch paths. */
@layer hud-mobile {
  body.mobile-touch.hf-android-p2 #mobile-action-page-toggle {
    display:none !important;
    pointer-events:none !important;
  }
  body.mobile-touch.hf-android-p2 #mobile-action-ring .mobile-action-slot {
    touch-action:none;
  }
}
"""
# C1 intentionally retires the old radial/paged source slots via !important.
# P2 explicitly resurrects ONLY the four original/native BASE action buttons.
# Do not override visibility or pointer-events: native dialogs must still
# suppress combat controls while legitimately open.
s+=r"""
body.mobile-touch.hf-game-c1.hf-android-p2 #mobile-action-ring .mobile-action-slot {
  display: flex !important;
}
"""
css.write_text(s,encoding='utf8')
print('HIGHFLY_ANDROID_P2_S23_GOLDEN_4BASE_NATIVE_HUD_WITHOUT_PC_CHANGES_PATCH_READY=1')
