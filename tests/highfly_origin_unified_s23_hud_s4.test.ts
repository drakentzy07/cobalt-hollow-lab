import { describe,expect,it } from 'vitest';
import { readFileSync } from 'node:fs';
import { highflyGroundCircleAim,highflyF261Aim,HIGHFLY_F261_AIM_DRAG_PX } from '../src/highfly/combat/f261_controls';
import { highflyAimShape } from '../src/highfly/combat/f24_aim_core';
const src=(path:string)=>readFileSync(path,'utf8');
const p={x:12,z:-14},R=30;
const near=(a:number,b:number)=>expect(a).toBeCloseTo(b,4);

describe('HIGHFLY UNIFIED S23 correction — native HP/MP/ST and unrestricted S4',()=>{
  it('casts S4 anywhere in complete 360 degrees at the native max range',()=>{
    const front=highflyGroundCircleAim(p,0,0,-145,R);
    const back=highflyGroundCircleAim(p,0,0,145,R);
    const right=highflyGroundCircleAim(p,0,-145,0,R);
    const left=highflyGroundCircleAim(p,0,145,0,R);
    near(front.x,12);near(front.z,16);
    near(back.x,12);near(back.z,-44);
    near(right.x,42);near(right.z,-14);
    near(left.x,-18);near(left.z,-14);
    for(const q of [front,back,right,left])near(q.range,R);
  });
  it('allows close, mid and far placements but never exceeds native range',()=>{
    for(const d of [0,1,10,40,72.5,145,4000]){
      const q=highflyGroundCircleAim(p,0,d,-d,R);
      expect(q.range).toBeGreaterThanOrEqual(0);
      expect(q.range).toBeLessThanOrEqual(R);
      near(Math.hypot(q.x-p.x,q.z-p.z),q.range);
    }
    near(highflyGroundCircleAim(p,0,0,0,R).range,0);
    const a=highflyGroundCircleAim(p,0,0,-HIGHFLY_F261_AIM_DRAG_PX*.5,R);
    near(a.range,R*.5);
    const rot=highflyGroundCircleAim(p,Math.PI/2,0,-145,R);
    near(rot.x,42);near(rot.z,-14);
  });
  it('preserves the preferred Meteor art and its original hit radius/cost',()=>{
    expect(highflyAimShape('meteor')).toBe('ground-circle');
    const main=src('src/main.ts');
    expect(main).toContain("shape==='ground-circle'");
    expect(main).toContain("highflyGroundCircleAim(p.pos,input.camYaw,dx,dy,maxRange)");
    expect(main).toContain("def?.effects.find(e=>e.type==='groundAoE')?.radius??8");
    expect(main).toContain("shape==='leap'||shape==='ground-circle'");
    const authored=src('src/sim/content/classes.ts');
    expect(authored).toContain("meteor: {");
    expect(authored).toContain('radius: 8,');
    expect(authored).toContain('range: 30,');
    const visual=src('src/render/ground_aim_reticle_visual.ts');
    expect(visual).toContain("shape==='ground-circle'");
    expect(visual).not.toContain('highfly-origin-ground-impact-center');
    // F2.6 controls for Fireball stay angularly softened, no global 360 mutation.
    expect(highflyF261Aim(p,0,145,0,R).range).toBe(R);
    expect(highflyF261Aim(p,0,145,0,R).x).toBeGreaterThan(-18);
  });
  it('mounts MP then STA immediately BELOW the native HP, hides donor power only in unified',()=>{
    const ui=src('src/highfly/origin/f1_world_ui.ts');
    const css=src('src/styles/hud.css');
    expect(ui).toContain("if (unifiedFrame && hp) hp.after(meter)");
    expect(ui).toContain("hp.after(meter)");
    expect(ui).toContain("f25 && !unifiedFrame");
    expect(ui).toContain("['mana','MP','#4e98e8'],['stamina','ST','#e5b73a']");
    expect(css).toContain('body.hf-origin-unified.hf-origin-f263 #player-frame > .uf-bars > #pf-resource');
    expect(css).toContain('display: none !important;');
    expect(css).toContain('body.hf-origin-unified.hf-origin-f263 #player-frame > .uf-bars > #hf-origin-f1-resource-meter');
    expect(css).toContain('width: 100% !important;');
  });
});
