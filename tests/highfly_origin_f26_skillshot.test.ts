import {describe,it,expect} from 'vitest';
import {highflyF26SegmentSphereHit} from '../src/highfly/combat/f26_skillshot_core';
describe('F2.6 true-skillshot (no homing)',()=>{
 it('hits only when the physically swept path crosses the enemy',()=>{
   expect(highflyF26SegmentSphereHit({x:0,y:1,z:0},{x:10,y:1,z:0},{x:5,y:1,z:0},.8)).toBeCloseTo(.42);
   expect(highflyF26SegmentSphereHit({x:0,y:1,z:0},{x:10,y:1,z:0},{x:5,y:1,z:2},.8)).toBeNull();
 });
 it('rejects flying over and behind the target',()=>{
   expect(highflyF26SegmentSphereHit({x:0,y:5,z:0},{x:10,y:5,z:0},{x:5,y:1,z:0},1)).toBeNull();
   expect(highflyF26SegmentSphereHit({x:0,y:1,z:0},{x:10,y:1,z:0},{x:-3,y:1,z:0},1)).toBeNull();
 });
 it('does not depend on target id, lock, camera or recast',()=>{
   expect(highflyF26SegmentSphereHit({x:0,y:0,z:0},{x:0,y:0,z:0},{x:0,y:0,z:0},.5)).toBe(0);
 });
});
