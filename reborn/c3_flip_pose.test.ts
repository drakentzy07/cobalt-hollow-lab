import test from 'node:test';
import assert from 'node:assert/strict';
import {directionalSomersault, SOMERSAULT_SECONDS} from './c3_flip_pose.ts';

test('no false flip on launch, landing, expiry, invalid time or reduced motion',()=>{
  for(const t of [0,SOMERSAULT_SECONDS,1,-1,Infinity,NaN]){
    assert.deepEqual(directionalSomersault(t,'back'),{pitch:0,roll:0});
  }
  assert.deepEqual(directionalSomersault(0.3,'forward',true),{pitch:0,roll:0});
});
test('forward/back and left/right are full 360 turns on orthogonal axes',()=>{
  const t=SOMERSAULT_SECONDS/2;
  const f=directionalSomersault(t,'forward'),b=directionalSomersault(t,'back');
  const l=directionalSomersault(t,'left'),r=directionalSomersault(t,'right');
  assert.ok(Math.abs(f.pitch+Math.PI)<0.000001);
  assert.ok(Math.abs(b.pitch-Math.PI)<0.000001);
  assert.ok(Math.abs(l.roll+Math.PI)<0.000001);
  assert.ok(Math.abs(r.roll-Math.PI)<0.000001);
  assert.equal(f.roll,0); assert.equal(l.pitch,0);
});
