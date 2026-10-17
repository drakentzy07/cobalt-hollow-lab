import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

const main=readFileSync('src/main.ts','utf8');
const hud=readFileSync('src/ui/hud.ts','utf8');
const css=readFileSync('src/styles/hud.mobile.css','utf8');
const touch=readFileSync('src/game/mobile_controls.ts','utf8');
const input=readFileSync('src/game/input.ts','utf8');

describe('HIGHFLY Android P2 4 BASE native arc while PC stays PC',()=>{
  it('is phone-only opt-in, legacy mode default',()=>{
    expect(main).toContain("get('hf_android_p2')==='1'");
    expect(main).toContain("&& (NATIVE_APP || isPhoneTouchDevice())");
    expect(main).toContain("document.body.classList.toggle('hf-android-p2',androidP2)");
    expect(main).toContain("document.body.classList.toggle('mobile-touch', NATIVE_APP || useTouchInterface());");
  });
  it('skips compulsory island tutorial ONLY for a fresh Android P2 Hunter',()=>{
    expect(main).toContain("const androidP2Hunter = new URLSearchParams(location.search).get('hf_android_p2')==='1'");
    expect(main).toContain("compulsoryTutorial: androidP2Hunter ? false : cfg.compulsoryTutorial");
    expect(main).toContain("const hunter = new Sim({...cfg,originHunterEnabled:true,");
  });
  it('restores C1-hidden native action buttons without disabling window input gates',()=>{
    expect(css).toContain('body.mobile-touch.hf-game-c1.hf-android-p2 #mobile-action-ring .mobile-action-slot');
    expect(css).toContain('display: flex !important;');
    const p2Css=css.split('body.mobile-touch.hf-game-c1.hf-android-p2 #mobile-action-ring .mobile-action-slot')[1];
    expect(p2Css).not.toMatch(/pointer-events\s*:\s*auto|visibility\s*:\s*visible/);
  });
  it('keeps one native 4-slot mobile action ring and existing server cast+cooldowns',()=>{
    expect(hud).toContain("this.isMobileLayout() && document.body.classList.contains('hf-android-p2')");
    expect(hud).toContain("? 0 : clampMobilePage(this.mobileActionPage)");
    expect(hud).toContain("this.mobileActionRingPainter.paint(");
    expect(hud).toContain("this.mobileActionRingView.tick(actionBarWorld)");
    expect(css).toContain("body.mobile-touch.hf-android-p2 #mobile-action-page-toggle");
    expect(css).toContain("display:none !important");
  });
  it('does not change R23 GOLDEN joystick camera touch routing or desktop WASD binding',()=>{
    expect(touch).not.toContain("hf-android-p2");
    expect(input).not.toContain("hf-android-p2");
    expect(input).toContain("held('turnLeft')");
    expect(input).toContain("held('turnRight')");
  });
  it('preserves Hunter P1 unarmed body variants without fake stat/save hooks',()=>{
    const patch=readFileSync('../v9-corrections/overlays/highfly_android_p2_four_base.py','utf8');
    expect(patch).not.toContain("src/sim/sim.ts");
    expect(patch).not.toContain("localStorage.setItem");
    expect(patch).not.toContain("src/game/input.ts");
    expect(patch).not.toContain("src/game/mobile_controls.ts");
  });
});
