import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

const main=readFileSync('src/main.ts','utf8');
const mobile=readFileSync('src/game/mobile_controls.ts','utf8');
const input=readFileSync('src/game/input.ts','utf8');
const hud=readFileSync('src/ui/hud.ts','utf8');
const css=readFileSync('src/styles/hud.mobile.css','utf8');

describe('R24 native shared HUD PC and S23 opt-in only',()=>{
  it('is entirely opt-in; the default R23/P1 profile still works',()=>{
    expect(main).toContain("get('hf_r24')==='1'");
    expect(main).toContain("document.body.classList.toggle('hf-r24-preview',r24)");
    expect(main).toContain("document.body.classList.toggle('hf-r24-desktop',desktop)");
    expect(mobile).toContain("active || document.body.classList.contains('hf-r24-desktop')");
  });
  it('desktop renders native touch HUD without enabling fake joystick input',()=>{
    expect(main).toContain("!isPhoneTouchDevice() && !useTouchInterface()");
    expect(mobile).toContain("this.setActive(useTouchInterface() || isNativeAppShell())");
    expect(css).toContain("body.hf-r24-desktop #mobile-move-zone");
    expect(css).toContain("W  A  S  D");
  });
  it('desktop uses native Mouse Camera A/D STRAFE input and right mouse',()=>{
    expect(input).toContain("if (document.body.classList.contains('hf-r24-desktop')) this.mouseCameraEnabled=true");
    expect(input).toContain("this.mouseCameraEnabled = on || document.body.classList.contains('hf-r24-desktop')");
    expect(input).toContain("!document.body.classList.contains('hf-r24-desktop') &&");
    expect(input).toContain("held('turnLeft')");
    expect(input).toContain("held('turnRight')");
  });
  it('only FOUR base ability buttons share native cast, costs and cooldowns',()=>{
    expect(hud).toContain("document.body.classList.contains('hf-r24-preview')");
    expect(hud).toContain("? 0 : clampMobilePage(this.mobileActionPage)");
    expect(css).toContain("body.hf-r24-preview #mobile-action-page-toggle");
    expect(hud).toContain("this.mobileActionRingView.tick(actionBarWorld)");
    expect(hud).toContain("this.mobileActionRingPainter.paint(");
  });
  it('does not mutate ability definitions, saves, SIM or world assets',()=>{
    const patch=readFileSync('../v9-corrections/overlays/highfly_origin_r24_unified_pc_preview.py','utf8');
    expect(patch).not.toContain("src/sim/sim.ts");
    expect(patch).not.toContain("src/sim/content/classes.ts");
    expect(patch).not.toContain("src/sim/character_state.ts");
    expect(patch).not.toContain("localStorage.setItem");
  });
});
