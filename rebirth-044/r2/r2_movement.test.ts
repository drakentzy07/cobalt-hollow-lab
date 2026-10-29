import {describe,it,expect} from 'vitest';
import {resolveFreedom360} from '../src/highfly/combat/freedom_360';
import {highflyF261FlipDirection} from '../src/highfly/combat/f261_controls';
import {highflyAimShape} from '../src/highfly/combat/f24_aim_core';
describe('REBIRTH R2 native-safe camera-relative HIGHFLY kernels',()=>{
  it('rejects no-input and non-finite inputs without ghost movement',()=>{
    expect(resolveFreedom360({x:0,y:0},0)).toBeNull();
    expect(resolveFreedom360({x:NaN,y:-1},0)).toBeNull();
    expect(resolveFreedom360({x:0,y:-1},NaN)).toBeNull();
  });
  it('covers all eight analog octants independently from current camera yaw',()=>{
    for(const yaw of [0,Math.PI/2,Math.PI,Math.PI*1.7]){
      for(let oct=0;oct<8;oct++){
        const a=Math.PI*oct/4,stick={x:Math.sin(a),y:-Math.cos(a)};
        const v=resolveFreedom360(stick,yaw);
        expect(v).not.toBeNull();
        expect(Math.hypot(v!.worldX,v!.worldZ)).toBeCloseTo(1,6);
        expect(v!.analog).toBeCloseTo(1,6);
        expect(Math.atan2(v!.worldX,v!.worldZ)).toBeCloseTo(v!.facing,6);
      }
    }
  });
  it('preserves analog magnitude for partial movement',()=>{
    expect(resolveFreedom360({x:0,y:-0.4},0)?.analog).toBeCloseTo(0.4);
    expect(resolveFreedom360({x:0,y:-1},0)?.worldZ).toBeCloseTo(1);
    expect(resolveFreedom360({x:1,y:0},0)?.worldX).toBeCloseTo(-1);
  });
  it('reuses actual S23 directional flip and targeting geometry math',()=>{
    expect(highflyF261FlipDirection({x:0,y:-1})).toBe('forward');
    expect(highflyF261FlipDirection({x:0,y:1})).toBe('back');
    expect(highflyAimShape('fireball')).toBe('line');
    expect(highflyAimShape('charge')).toBe('cone');
    expect(highflyAimShape('frost_nova')).toBe('circle');
  });
});
