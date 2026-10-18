import {describe,it,expect} from 'vitest';
import {r39C3AcceptedMotion} from '../src/sim/highfly_origin_r39c3_motion_policy';
const ground={onGround:true,vy:0,horizontalSpeed:0};
describe('R39C3 accepted-only motion policy',()=>{
  it('never emits a cue for rejected Sim attack',()=>{
    expect(r39C3AcceptedMotion(1,ground,false,false)).toBeNull();
  });
  it('preserves native 1-2-3 and only allows elemental fourth when ready',()=>{
    expect(r39C3AcceptedMotion(2,ground,true,false)).toEqual({kind:'native-basic',step:2,context:'ground',clip:'highfly_basic_2'});
    expect(r39C3AcceptedMotion(4,ground,true,false)).toBeNull();
    expect(r39C3AcceptedMotion(4,ground,true,true)?.step).toBe(4);
  });
  it('identifies running, airborne and plunge without scheduling strikes',()=>{
    expect(r39C3AcceptedMotion(1,{...ground,horizontalSpeed:3},true,false)?.context).toBe('running');
    expect(r39C3AcceptedMotion(3,{...ground,onGround:false,vy:2},true,false)?.context).toBe('air');
    expect(r39C3AcceptedMotion(3,{...ground,onGround:false,vy:-2},true,false)?.context).toBe('plunge');
    expect(r39C3AcceptedMotion(3,{...ground,dead:true},true,false)).toBeNull();
  });
});
