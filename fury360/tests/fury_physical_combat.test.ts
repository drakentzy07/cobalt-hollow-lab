import assert from 'node:assert/strict';
import {test} from 'node:test';
import {
  FuryPhysicalCombatTimeline,planFuryAttackFacing,
  furySecondJumpVisual,furyPhysicalDashCue,
} from '../src/physical_combat.ts';
const a=(kind:'basic'|'native-skill'='basic')=>({
  kind,abilityId:kind==='native-skill'?'native-shot':undefined,
  gate:{kind:kind==='basic'?'basic' as const:'skill' as const,
    nativeAllowed:true,stunned:false,airborne:false,moving:true,
    allowAirborne:false,allowMovement:true},
  durationMs:500,cancelOpensMs:250,bufferMs:180,allowCancelPrevious:true,
});
test('manual input only: no speculative attack, damage or combo before native acceptance',()=>{
  const ctl=new FuryPhysicalCombatTimeline();
  assert.equal(ctl.currentAction,null);
  const r=ctl.request(a(),100);
  assert.equal(r.status,'ready');
  if(r.status!=='ready')throw Error('missing proposal');
  assert.equal(ctl.currentAction,null);
  assert.equal(ctl.confirmNative(r.proposal.ticket,false,101),null);
  assert.equal(ctl.currentAction,null);
  const q=ctl.request(a(),103);
  assert.equal(q.status,'ready');
  if(q.status!=='ready')throw Error('missing proposal');
  assert.equal(ctl.confirmNative(q.proposal.ticket,true,105)?.comboStep,1);
});
test('combo buffer waits for animation cancel window; native rejection cannot create hit',()=>{
  const ctl=new FuryPhysicalCombatTimeline();
  const first=ctl.request(a(),100);
  if(first.status!=='ready')throw Error('missing proposal');
  ctl.confirmNative(first.proposal.ticket,true,100);
  assert.equal(ctl.request(a(),210).status,'rejected');
  assert.equal(ctl.request(a(),300).status,'buffered');
  assert.equal(ctl.pollBuffered(320),null);
  const second=ctl.pollBuffered(352)!;
  assert.equal(second.action.kind,'basic');
  assert.equal(ctl.currentAction?.comboStep,1);
  assert.equal(ctl.confirmNative(second.ticket,true,352)?.comboStep,2);
});
test('no buffered action fires twice or survives after expiry',()=>{
  const ctl=new FuryPhysicalCombatTimeline();
  const s=ctl.request(a(),0);
  if(s.status!=='ready')throw Error('missing proposal');
  ctl.confirmNative(s.proposal.ticket,true,0);
  assert.equal(ctl.request(a(),145).status,'buffered');
  assert.equal(ctl.pollBuffered(220),null);
  assert.equal(ctl.pollBuffered(330),null);
  assert.equal(ctl.bufferedInput,false);
});
test('native rejection, stun and air restrictions stay authoritative',()=>{
  const ctl=new FuryPhysicalCombatTimeline();
  assert.equal(ctl.request({...a(),gate:{...a().gate,stunned:true}},0).status,'rejected');
  assert.equal(ctl.request({...a(),gate:{...a().gate,airborne:true}},1).status,'rejected');
  assert.equal(ctl.request({...a(),gate:{...a().gate,nativeAllowed:false}},2).status,'rejected');
  assert.equal(ctl.request({...a('native-skill'),gate:{...a('native-skill').gate,airborne:true,allowAirborne:true}},3).status,'ready');
  ctl.reset();
  assert.equal(ctl.currentAction,null);
});
test('attack facing turns toward validated native target with bounded rotation',()=>{
  const face=planFuryAttackFacing({x:0,z:0},0,{x:10,z:0},Math.PI/4);
  assert.ok(Math.abs(face-Math.PI/4)<1e-7);
  assert.equal(planFuryAttackFacing({x:0,z:0},0,null,1),0);
  assert.equal(planFuryAttackFacing({x:0,z:0},0,{x:10,z:0},0),0);
});
test('somersault and dash cues never take over original physics',()=>{
  assert.equal(furySecondJumpVisual(false,'forward'),null);
  assert.deepEqual(furySecondJumpVisual(true,'left'),{kind:'somersault',direction:'left'});
  assert.equal(furyPhysicalDashCue(false,true),null);
  assert.equal(furyPhysicalDashCue(true,true),'dash');
  assert.equal(furyPhysicalDashCue(true,false),'roll');
});
