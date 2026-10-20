import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {highflyF26LateralBend,highflyF26TrajectoryPoint,highflyF262GroundContact} from '../src/highfly/combat/f26_skillshot_core';
describe('F2.6.2 semi-assisted TRUE skillshot',()=>{
  const start={x:0,y:5,z:0},end={x:0,y:1,z:10};
  it('grounded wolf near visible aim corridor is hittable from the air',()=>{
    expect(highflyF262GroundContact(start,end,{x:0,z:5})).not.toBeNull();
    expect(highflyF262GroundContact(start,end,{x:1.2,z:5})).not.toBeNull();
  });
  it('wildly aimed Fireball still misses; no homing or target locking',()=>{
    expect(highflyF262GroundContact(start,end,{x:2.2,z:5})).toBeNull();
    expect(highflyF262GroundContact(start,end,{x:0,z:-5})).toBeNull();
  });
  it('reticle and authoritative projectile share identical bend',()=>{
    const bend=highflyF26LateralBend(false,true,'right',15);
    expect(bend).toBeGreaterThan(0);
    const a={x:0,y:0,z:0},b={x:0,y:0,z:15};
    const pt=highflyF26TrajectoryPoint(a,b,.5,bend);
    expect(highflyF262GroundContact(
      highflyF26TrajectoryPoint(a,b,.45,bend),
      highflyF26TrajectoryPoint(a,b,.55,bend),
      {x:pt.x,z:pt.z})).not.toBeNull();
    expect(highflyF262GroundContact(
      highflyF26TrajectoryPoint(a,b,.45,bend),
      highflyF26TrajectoryPoint(a,b,.55,bend),
      {x:3.5,z:7.5})).toBeNull();
    expect(highflyF26LateralBend(false,true,'forward',15)).toBe(0);
    expect(highflyF26LateralBend(true,true,'left',15)).toBe(0);
  });
  it('no railroad sleepers, soft continuous band follows actual curved path',()=>{
    const g=readFileSync('src/render/ground_aim_reticle_visual.ts','utf8');
    expect(g).toContain('highfly-f262-soft-skillshot-lane');
    expect(g).toContain('highflyF26TrajectoryPoint');
    expect(g).not.toContain('for(let k=1;k<=24;k++)');
    expect(g).toContain('const halfWidth=1.35');
    const main=readFileSync('src/main.ts','utf8');
    expect(main).toContain('highflyF26LateralBend');
  });
  it('actual KayKit loaded dual-wield attack, not imaginary left-only clips',()=>{
    const manifest=readFileSync('src/render/characters/manifest.ts','utf8');
    const visual=readFileSync('src/render/characters/visual.ts','utf8');
    expect(manifest).toContain("dualwield: 'Dualwield_Melee_Attack_Chop'");
    expect(visual).toContain('const dualClip=this.def.clips.attackByHand?.dualwield');
    expect(visual).not.toContain("'Warrior_DualWield_Left'");
    expect(visual).toContain("weaponAttackStyle(this.weaponItemId,this.offhandItemId)==='dualwield'");
  });
  it('isolates hit tolerance to the F2.6.2 Hunter, not donor classes',()=>{
    const sim=readFileSync('src/sim/projectile_travel.ts','utf8');
    expect(sim).toContain('source.highflyF262ContactAssist===true');
    expect(sim).toContain('target.onGround');
    const ui=readFileSync('src/highfly/origin/f1_world_ui.ts','utf8');
    expect(ui).toContain('if(f262)sim.player.highflyF262ContactAssist=true');
  });
});