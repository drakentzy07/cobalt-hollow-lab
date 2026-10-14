/** V13-only native skill aim & visual resource QA. Never touches public game. */
import {describe,expect,it} from 'vitest';
import {highflyV13PickSmartTarget,highflyV13ResourceRefillEnabled} from '../src/highfly/v13_skill_lab';
const origin={x:0,z:0};
const mobs=[
  {id:11,pos:{x:0,z:4}},  // near and in front
  {id:12,pos:{x:0,z:-1}}, // closer but behind
  {id:13,pos:{x:2,z:5}},  // off-axis
  {id:14,pos:{x:0,z:50}}, // far
];
describe('V13 tap aim prioritizes closest visible-front attackable in 9 classes',()=>{
  it.each(['warrior','paladin','hunter','rogue','priest','shaman','mage','warlock','druid'])(
    '%s selects front on tap, not behind or across entire world',()=>{
      expect(highflyV13PickSmartTarget(mobs,origin,0,10,()=>true)).toBe(11);
    });
  it('only valid hostile entities, with fallback to a behind target if alone',()=>{
    expect(highflyV13PickSmartTarget(mobs,origin,0,10,id=>id===12)).toBe(12);
    expect(highflyV13PickSmartTarget(mobs,origin,0,10,id=>id===14)).toBeNull();
    expect(highflyV13PickSmartTarget([],origin,0,10,()=>true)).toBeNull();
  });
  it('is directional relative to the camera yaw, never an arbitrary 360-degree attack',()=>{
    expect(highflyV13PickSmartTarget(mobs,origin,Math.PI,10,()=>true)).toBe(12);
    expect(highflyV13PickSmartTarget(mobs,origin,0,10,id=>id!==11)).toBe(13);
  });
  it('visual resource refill is disabled until isolated V13 UI is installed',()=>{
    expect(highflyV13ResourceRefillEnabled()).toBe(false);
  });
});
