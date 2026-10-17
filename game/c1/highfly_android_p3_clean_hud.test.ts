import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const main=readFileSync('src/main.ts','utf8');
const runtime=readFileSync('src/highfly/highfly_android_p3_runtime.ts','utf8');
const trial=readFileSync('src/highfly/highfly_origin_trial_runtime.ts','utf8');
const hud=readFileSync('src/ui/hud.ts','utf8');
const style=readFileSync('src/styles/hud.mobile.css','utf8');
const c1=readFileSync('src/highfly/game_c1_runtime.ts','utf8');

describe('HIGHFLY Android P3 HUD CLEAN without sacrificing GOLDEN/native combat',()=>{
  it('requires Android P2 AND explicit P3; PC and P2 unaffected',()=>{
    expect(main).toContain("get('hf_android_p3')==='1'");
    expect(main).toContain("document.body.classList.toggle('hf-android-p3',androidP2 &&");
    expect(main).toContain("document.body.classList.toggle('hf-android-p2',androidP2)");
  });
  it('retires old ten-button actionbar, visible fake special seats, duplicate buffs',()=>{
    for(const id of ['#actionbar','#actionbar2','#actionbar3','#hf-c1-special-seats',
      '#hf-c22-ghost-skills','#hf-origin-utility-row'])
      expect(style).toContain(id);
    expect(style).toContain('hf-android-p3');
    expect(style).toContain('#mobile-action-ring .mobile-action-slot');
    expect(style).toContain('display:flex !important');
    expect(hud).toContain('this.mobileActionRingView.tick(actionBarWorld)');
    expect(hud).toContain('this.mobileActionRingPainter.paint(');
  });
  it('preserves true native ATK separate from contextual native USAR',()=>{
    expect(c1).toContain("!document.body.classList.contains('hf-android-p3')");
    expect(style).toContain('#mobile-interact');
    expect(style).toContain('bottom:calc(145px + env(safe-area-inset-bottom))');
  });
  it('gates the training/editor as LAB-only, never default app chrome',()=>{
    expect(trial).toContain('installHighflyAndroidP3(sim,shell,toggle,panel)');
    expect(runtime).toContain("get('hf_lab') === '1'");
    expect(runtime).toContain('hf-p3-lab-entry');
    expect(runtime).toContain('originalToggle.click()');
    expect(style).toContain('hf-p3-lab-open');
    expect(style).toContain('#hf-origin-training > button');
  });
  it('never creates fake skill button handlers or free permanent unlocks',()=>{
    for(const id of ['fireball','heroic_leap','blink','flamestrike'])
      expect(runtime).toContain(id);
    expect(runtime).toContain('P3_BASE_IDS.forEach((id, i) => fire');
    expect(runtime).toContain("sim.known.some(known => known.def.id === id)");
    expect(runtime).toContain('admitted.length !== P3_BASE_IDS.length');
    expect(runtime).not.toContain('learnOriginHunterSkillTrusted(');
    expect(runtime).not.toContain('localStorage.setItem(');
    expect(runtime).not.toContain('new Sim(');
  });
  it('moves existing buff buttons and preserves handlers without new casts',()=>{
    expect(runtime).toContain("button[data-origin-buff]");
    expect(runtime).toContain('grid.appendChild(button)');
    expect(runtime).toContain("grid.hidden = !grid.hidden");
    expect(runtime).not.toContain('sim.cast');
    expect(runtime).not.toContain('sim.attack');
  });
});
