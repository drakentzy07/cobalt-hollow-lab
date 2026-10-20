import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {HIGHFLY_F261_AIM_DRAG_PX,highflyF261Aim,highflyF261FlipDirection} from '../src/highfly/combat/f261_controls';
import {HIGHFLY_F261_JUMP_VELOCITY,HIGHFLY_ORIGIN_JUMP_VELOCITY} from '../src/sim/player_motion';
describe('F2.6.1 S23 control polish',()=>{
  it('prioritizes forwards, then true laterals, and backwards hop',()=>{
    expect(highflyF261FlipDirection({x:.36,y:-.91})).toBe('forward');
    expect(highflyF261FlipDirection({x:-.91,y:-.36})).toBe('left');
    expect(highflyF261FlipDirection({x:.91,y:-.36})).toBe('right');
    expect(highflyF261FlipDirection({x:.12,y:.91})).toBe('back');
    expect(highflyF261FlipDirection({x:0,y:0})).toBe('forward');
  });
  it('inverts only the original X aim and has gentler drag reach',()=>{
    const a=highflyF261Aim({x:0,z:0},0,80,-60,30);
    const b=highflyF261Aim({x:0,z:0},0,-80,-60,30);
    expect(a.x).toBeLessThan(0);
    expect(b.x).toBeGreaterThan(0);
    expect(a.range).toBeLessThan(30);
    expect(HIGHFLY_F261_AIM_DRAG_PX).toBeGreaterThan(94);
  });
  it('extends air time for ORIGIN f261 only',()=>{
    expect(HIGHFLY_F261_JUMP_VELOCITY).toBeGreaterThan(HIGHFLY_ORIGIN_JUMP_VELOCITY);
    const s=readFileSync('src/sim/player_motion.ts','utf8');
    expect(s).toContain('p.highflyF261Controls ? HIGHFLY_F261_JUMP_VELOCITY');
  });
  it('back hop stays non-rotating and left-arm has authored second strike',()=>{
    const v=readFileSync('src/render/characters/visual.ts','utf8');
    expect(v).toContain('f261BackHop');
    expect(v).toContain("abilityId==='highfly_basic_2'");
    // The F2.6.2 revision now uses the real KayKit clip rather than the
    // previously guessed left-hand animation label.
    expect(v).toContain('const dualClip=this.def.clips.attackByHand?.dualwield');
  });
  it('removes independent Flash HUD and granted Blink ONLY in F2.6.1',()=>{
    const ui=readFileSync('src/highfly/origin/f1_world_ui.ts','utf8');
    expect(ui).toContain('if(f26 && !f261)');
    expect(ui).toContain("const flashButton=f26 && !f261?node('button'");
    expect(ui).not.toContain('hf-f261-flash-cd');
    expect(ui).not.toContain("jumpButton.style.translate='-38px 0'");
    expect(ui).not.toContain("liveEvade.style.translate='-38px 0'");
    expect(ui).toContain("effects:[{type:'blinkForward'");
    // Authoritative physical Evadir and both jumps are unchanged.
    const mobile=readFileSync('src/game/mobile_controls.ts','utf8');
    expect(mobile).toContain("this.bindButton('mobile-evade'");
    expect(mobile).toContain("this.bindButton('mobile-jump'");
  });
});
