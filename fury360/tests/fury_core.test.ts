import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  acceptGoldenMovement, FuryAimGesture, pickFuryTarget,
  gateFuryAction, FuryComboClock, chooseFuryPose,
} from '../src/fury_core.ts';

test('GOLDEN intent is authoritative, analog normalized, blocked state is silent', () => {
  const golden = {worldX: -0.6, worldZ: 0.8, analog: 0.5, facing: -0.6435};
  const result = acceptGoldenMovement(golden, false)!;
  assert.ok(Math.abs(Math.hypot(result.worldX,result.worldZ)-0.5)<1e-8);
  assert.equal(result.facing, golden.facing);
  assert.equal(acceptGoldenMovement(golden,true), null);
  assert.equal(acceptGoldenMovement({...golden,worldX:NaN},false), null);
  assert.equal(acceptGoldenMovement(null,false), null);
});
test('AIM tracks one pointer; release returns cast intent exactly once', () => {
  const aim = new FuryAimGesture();
  assert.equal(aim.start(7,{abilityId:'native-fire',shape:'line',range:20},{x:2,z:3},0),true);
  assert.equal(aim.start(8,{abilityId:'other',shape:'cone',range:5},{x:0,z:0},0),false);
  assert.equal(aim.preview(8,50,-80),null);
  const result = aim.release(7,0,-145)!;
  assert.equal(result.abilityId,'native-fire');
  assert.equal(result.shape,'line');
  assert.ok(Math.abs(result.world.x-2)<1e-8);
  assert.ok(Math.abs(result.world.z-23)<1e-8);
  assert.equal(aim.busy,false);
  assert.equal(aim.release(7,0,-145),null);
});
test('AIM cancel is pointer-owned, no ability request or resource charge', () => {
  const aim = new FuryAimGesture();
  assert.equal(aim.start(1,{abilityId:'native-skill',shape:'circle',range:12},{x:0,z:0},0),true);
  assert.equal(aim.cancel(2),false);
  assert.equal(aim.busy,true);
  assert.equal(aim.cancel(1),true);
  assert.equal(aim.release(1,50,50),null);
});
test('AIM has tap quick-cast intent and S23 horizontal correction', () => {
  const aim=new FuryAimGesture();
  aim.start(2,{abilityId:'slash',shape:'cone',range:10},{x:0,z:0},0);
  const tap=aim.release(2,0,0)!;
  assert.equal(tap.isTap,true);
  assert.equal(tap.distance,10);
  aim.start(3,{abilityId:'slash',shape:'cone',range:10},{x:0,z:0},0);
  const right=aim.release(3,100,-100)!;
  assert.ok(right.world.x<0);
});
test('TARGETING never steals valid lock and respects attackability and obstacles', () => {
  const enemies=[
    {id:3,pos:{x:0,z:2}},
    {id:2,pos:{x:0,z:5}},
    {id:4,pos:{x:0,z:-1}},
  ];
  const base={origin:{x:0,z:0},facing:0,maxRange:10,canAttack:(e:typeof enemies[number])=>e.id!==4};
  assert.equal(pickFuryTarget(enemies,base),3);
  assert.equal(pickFuryTarget(enemies,{...base,lockedTargetId:2}),2);
  assert.equal(pickFuryTarget(enemies,{...base,lineOfSight:e=>e.id!==3}),2);
  assert.equal(pickFuryTarget(enemies,{...base,canAttack:()=>false}),null);
});
test('NATIVE ability permission stays authoritative across movement and air', () => {
  const request={kind:'skill' as const,nativeAllowed:true,stunned:false,
    airborne:true,moving:true,allowAirborne:true,allowMovement:true};
  assert.equal(gateFuryAction(request).allowed,true);
  assert.equal(gateFuryAction({...request,nativeAllowed:false}).reason,'native-denied');
  assert.equal(gateFuryAction({...request,allowAirborne:false}).reason,'airborne-denied');
  assert.equal(gateFuryAction({...request,allowMovement:false}).reason,'moving-denied');
});
test('COMBO sequences only accepted hits, resets after gap and backwards time', () => {
  const combo=new FuryComboClock();
  assert.equal(combo.registerAcceptedHit(100),1);
  assert.equal(combo.registerAcceptedHit(350),2);
  assert.equal(combo.registerAcceptedHit(1200),1);
  assert.equal(combo.registerAcceptedHit(1100),1);
  combo.reset();
  assert.equal(combo.step,0);
});
test('POSE is pure presentation with safe priority', () => {
  const state={dead:false,dashing:false,attacking:false,casting:false,
    airborne:false,vy:0,moving:true};
  assert.equal(chooseFuryPose(state),'run');
  assert.equal(chooseFuryPose({...state,airborne:true,vy:-1}),'fall');
  assert.equal(chooseFuryPose({...state,casting:true,airborne:true}),'cast');
  assert.equal(chooseFuryPose({...state,dead:true,dashing:true}),'dead');
});
