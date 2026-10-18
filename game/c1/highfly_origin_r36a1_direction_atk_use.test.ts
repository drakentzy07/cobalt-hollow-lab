import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {highflyR36A1AttackHeading,highflyR36A1EnemyInMeleeRange}
 from '../src/game/highfly_r36a1_attack_heading';
import {highflyR36ANearbyTarget} from '../src/game/highfly_r36a_soft_attack_target';
const file=(p:string)=>readFileSync(p,'utf8');
describe('R36A.1 — independent USAR and joystick-relative melee facing',()=>{
  it('GOLDEN joystick forward attacks camera-relative forward, no forced target',()=>{
    expect(highflyR36A1AttackHeading(0,{x:0,y:-1},1.9)).toBeCloseTo(0);
    expect(highflyR36A1AttackHeading(Math.PI/2,{x:0,y:-1},0)).toBeCloseTo(Math.PI/2);
    expect(Math.cos(highflyR36A1AttackHeading(0,{x:0,y:1},0))).toBeCloseTo(-1);
  });
  it('GOLDEN joystick diagonals and left/right are 360-degree, camera-independent',()=>{
    expect(highflyR36A1AttackHeading(0,{x:-1,y:0},0)).toBeCloseTo(Math.PI/2);
    expect(highflyR36A1AttackHeading(0,{x:1,y:0},0)).toBeCloseTo(-Math.PI/2);
    expect(highflyR36A1AttackHeading(0,{x:-1,y:-1},0)).toBeCloseTo(Math.PI/4);
    expect(Math.cos(highflyR36A1AttackHeading(Math.PI,{x:0,y:-1},0))).toBeCloseTo(-1);
  });
  it('idle stays facing where it was; camera orbit alone cannot redirect ATK',()=>{
    expect(highflyR36A1AttackHeading(Math.PI,{x:0,y:0},.7)).toBe(.7);
    expect(highflyR36A1AttackHeading(Math.PI,{x:.01,y:.02},.7)).toBe(.7);
  });
  it('only reachable enemies are eligible for free-attack soft face',()=>{
    expect(highflyR36A1EnemyInMeleeRange({x:0,z:0},{x:0,z:3})).toBe(true);
    expect(highflyR36A1EnemyInMeleeRange({x:0,z:0},{x:0,z:10})).toBe(false);
    const list=[{id:1,pos:{x:0,z:4},hostile:true},
      {id:2,pos:{x:0,z:15},hostile:true},
      {id:3,pos:{x:0,z:-1},hostile:true}];
    expect(highflyR36ANearbyTarget(list,{x:0,z:0},0,e=>e.hostile,5)).toBe(1);
    expect(highflyR36ANearbyTarget(list.slice(1),{x:0,z:0},0,e=>e.hostile,5)).toBe(null);
  });
  it('ATK button is NEVER contextual USAR when P3.5 ORIGIN; USAR stays native',()=>{
    const s=file('src/ui/hud/action_bar/mobile_action_ring_controller.ts');
    expect(s).toContain("if (!document.body.classList.contains('hf-android-p35') &&");
    expect(s).toContain('deps.contextualUse())');
    expect(s).toContain('deps.attackNearest?.()');
    expect(s).toContain('deps.activateFixedAttackSlot()');
    const controls=file('src/game/mobile_controls.ts');
    expect(controls).toContain("bindButton('mobile-interact', () => this.callbacks.onInteract())");
  });
  it('R36A1 never fires attackNearest() for ORIGIN; avoids 40yd auto-lock and pursuit',()=>{
    const main=file('src/main.ts');
    const start=main.indexOf('  hud.onMobileAttackNearest = () => {');
    expect(start).toBeGreaterThan(0);
    const segment=main.slice(start,main.indexOf('  };',start)+4);
    expect(segment).toContain('highflyR36A1AttackHeading(');
    expect(segment).toContain('input.highflyTouchVector()');
    expect(segment).toContain('highflyR36ANearbyTarget(');
    expect(segment).toContain('world.targetEntity(null)');
    expect(segment).toContain('p.facing=direction');
    expect(segment).toContain('      return;\\n    }'.replace('\\n','\n'));
    expect(segment).toContain('    attackNearest();');
    const origin=segment.slice(segment.indexOf("if (document.body.classList.contains('hf-android-p35')"));
    const fallback=origin.lastIndexOf('    attackNearest();');
    const earlyReturn=origin.lastIndexOf('      return;\\n    }'.replace('\\n','\n'));
    expect(earlyReturn).toBeLessThan(fallback);
  });
});
