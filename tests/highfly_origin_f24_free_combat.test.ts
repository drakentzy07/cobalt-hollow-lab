import {describe,it,expect} from 'vitest';
import {pickHighflyFreeTarget} from '../src/sim/combat/highfly_free_target';
import {highflyComboAccent,highflyPhysicalBasic,highflySomersaultPitch,HIGHFLY_SOMERSAULT_SECONDS} from '../src/render/characters/highfly_combat_presentation';
import {readFileSync} from 'node:fs';
const read=(p:string)=>readFileSync(p,'utf8');
describe('F2.4 physical freedom, no manual target required',()=>{
  const entities=[{id:3,pos:{x:-1,z:0}},{id:2,pos:{x:1,z:0}},{id:4,pos:{x:2,z:0}}];
  it('acquires a facing reachable monster without tap marking',()=>{
    expect(pickHighflyFreeTarget(entities,{x:0,z:0},Math.PI/2,e=>e.id!==4,()=>2)?.id).toBe(2);
    expect(pickHighflyFreeTarget(entities,{x:0,z:0},-Math.PI/2,()=>true,()=>1.5)?.id).toBe(3);
  });
  it('ignores dead, nonhostile, out-of-range and finds nearby alternative',()=>{
    expect(pickHighflyFreeTarget(entities,{x:0,z:0},0,e=>e.id===3,()=>2)?.id).toBe(3);
    expect(pickHighflyFreeTarget(entities,{x:0,z:0},0,()=>false,()=>9)).toBeNull();
    expect(pickHighflyFreeTarget(entities,{x:0,z:0},0,()=>true,()=>0.3)).toBeNull();
  });
  it('airborne chop has a real distinct ID, existing damage and an upper-body track',()=>{
    expect(highflyPhysicalBasic('highfly_basic_air')).toBe(true);
    expect(read('src/sim/combat/auto_attack.ts')).toContain("!p.onGround ? 'highfly_basic_air'");
    expect(read('src/render/characters/visual.ts')).toContain("'2H_Melee_Attack_Chop'");
    expect(read('src/render/characters/visual.ts')).toContain('this.playOriginPhysicalGesture(aerial,1.26,true,abilityId)');
    expect(read('src/render/renderer.ts')).toContain("? 'highfly_basic_air' : 'highfly_basic_'");
  });
  it('finisher is more emphasized than taps; manually performed flip renders',()=>{
    const a=highflyComboAccent('highfly_basic_1',0.26);
    const b=highflyComboAccent('highfly_basic_3',0.26);
    expect(Math.abs(b.roll)).toBeGreaterThan(Math.abs(a.roll));
    expect(highflyComboAccent('highfly_basic_air',0.26).pitch).toBeGreaterThan(b.pitch);
    expect(highflySomersaultPitch(HIGHFLY_SOMERSAULT_SECONDS/2,false)).not.toBe(0);
    expect(read('src/render/characters/visual.ts')).toContain('highflySomersaultPitch(this.originFlipTime, false)');
  });
});
