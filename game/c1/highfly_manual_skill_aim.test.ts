import { describe, it, expect } from 'vitest';
import {
  hfAimVector, hfPointFromVector, hfAimTarget, hfInsideCancel,
} from '../src/highfly/manual_skill_aim';

describe('HIGHFLY SF2 manual aiming — 9-class shared geometry', () => {
  it('maps up and right without mutating movement/camera', () => {
    const up=hfAimVector(100,100,100,-25,0,35);
    expect(up.yaw).toBeCloseTo(0);
    expect(up.distance).toBeCloseTo(35);
    const right=hfAimVector(100,100,225,100,0,35);
    expect(right.yaw).toBeCloseTo(Math.PI/2);
    expect(hfPointFromVector({x:10,z:20},right).x).toBeCloseTo(45);
    expect(hfPointFromVector({x:10,z:20},right).z).toBeCloseTo(20);
  });
  it('clamps the reach of ground areas, jumps and line indicators', () => {
    const v=hfAimVector(0,0,0,-1000,0,8);
    expect(v.distance).toBe(8);
    expect(hfPointFromVector({x:0,z:0},v).z).toBeCloseTo(8);
    expect(hfAimVector(0,0,0,0,0,8).distance).toBe(0);
  });
  it('manual direction wins: never auto-selects a hostile behind the hunter',()=>{
    const mobs=[
      {id:1,pos:{x:0,z:-2}},
      {id:2,pos:{x:0,z:5}},
      {id:3,pos:{x:30,z:1}},
    ];
    expect(hfAimTarget(mobs,{x:0,z:0},0,8,()=>true)).toBe(2);
    expect(hfAimTarget(mobs,{x:0,z:0},Math.PI,8,()=>true)).toBe(1);
    expect(hfAimTarget(mobs,{x:0,z:0},Math.PI/2,8,()=>true)).toBeNull();
  });
  it('does not target an invulnerable/non-hostile entity or anything out of range',()=>{
    const mobs=[{id:1,pos:{x:0,z:2}},{id:2,pos:{x:0,z:40}}];
    expect(hfAimTarget(mobs,{x:0,z:0},0,8,id=>id===2)).toBeNull();
  });
  it('CANCELAR covers its full rectangular touch target',()=>{
    const box={left:50,top:60,right:150,bottom:120};
    expect(hfInsideCancel(50,60,box)).toBe(true);
    expect(hfInsideCancel(149,119,box)).toBe(true);
    expect(hfInsideCancel(151,119,box)).toBe(false);
    expect(hfInsideCancel(100,125,box)).toBe(false);
  });
});
